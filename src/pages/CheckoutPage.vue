<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError } from '@/api'
import { BaseAlert, BaseButton, BaseIcon, BaseSkeleton } from '@/components/ui'
import { useApiRequest } from '@/composables/useApiRequest'
import { dataSource } from '@/data'
import { useAuthStore } from '@/stores/auth.store'
import { useCatalogStore } from '@/stores/catalog.store'
import { useUiStore } from '@/stores/ui.store'
import { couponsService, discountFor } from '@/services'
import type { CouponValidation } from '@/services'
import { formatEventSchedule, formatPrice } from '@/utils/format'
import type { PaymentMethod, PaymentStatus } from '@/types/order'

/**
 * Checkout — Stitch screen « Paiement (Style Tikerama) ».
 *
 * The basket arrives in the query as `billets=typeId:qty,…`, set by the event
 * page. Keeping it in the URL rather than in a store means a reload — or a
 * shared link — lands on the same order instead of an empty basket.
 *
 * The countdown mirrors the seat hold the backend will apply; when it reaches
 * zero the visitor is sent back to the event rather than left on a page whose
 * prices may no longer hold.
 */
const props = defineProps<{ eventId: string }>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const catalog = useCatalogStore()
const ui = useUiStore()

const detail = useApiRequest(dataSource.events.get)

const HOLD_SECONDS = 22 * 60

const secondsLeft = ref(HOLD_SECONDS)
const country = ref('Togo')
const method = ref<PaymentMethod>('TMONEY')
const acceptsTerms = ref(false)
const isPaying = ref(false)

/** Why the last attempt did not go through; shown above the pay button. */
const paymentNotice = ref<string | null>(null)

/**
 * Buyer details.
 *
 * Guest checkout is allowed, so these are always collected rather than assumed
 * from the session. A signed-in visitor gets them prefilled and can still edit
 * them — the ticket may well be for someone else.
 */
const buyer = ref({
  firstName: auth.user?.firstName ?? '',
  lastName: auth.user?.lastName ?? '',
  email: auth.user?.email ?? '',
  phone: auth.user?.phone ?? '',
})

/** Where the ticket is sent once the payment clears. */
const delivery = ref<'email' | 'whatsapp' | 'both'>('email')

const MARQUE_MAIL = '/mock/icon-mail.svg'
const MARQUE_WHATSAPP = '/mock/icon-whatsapp.svg'

const deliveryChannels = [
  {
    value: 'email',
    logos: [MARQUE_MAIL],
    label: 'Par e-mail',
    hint: 'Le billet et son QR code arrivent dans votre boîte de réception.',
  },
  {
    value: 'whatsapp',
    logos: [MARQUE_WHATSAPP],
    label: 'Par WhatsApp',
    hint: 'Vous recevez un lien de téléchargement sur WhatsApp.',
  },
  {
    value: 'both',
    logos: [MARQUE_MAIL, MARQUE_WHATSAPP],
    label: 'Les deux',
    hint: 'E-mail et WhatsApp, pour ne pas dépendre d’un seul canal.',
  },
]

const isBuyerComplete = computed(() => {
  const { firstName, lastName, email, phone } = buyer.value

  return Boolean(firstName.trim() && lastName.trim() && email.trim() && phone.trim())
})

let timer: number | undefined

const event = computed(() => detail.data.value)

/** `billets=id:qty,id:qty` → the lines to charge for. */
const lines = computed(() => {
  const raw = String(route.query.billets ?? '')

  return raw
    .split(',')
    .map((entry) => entry.split(':'))
    .filter(([id, qty]) => id && Number(qty) > 0)
    .map(([id, qty]) => {
      const ticketType = event.value?.ticketTypes?.find((type) => type.id === id)

      return ticketType ? { ticketType, quantity: Number(qty) } : null
    })
    .filter((line): line is NonNullable<typeof line> => line !== null)
})

const subtotal = computed(() =>
  lines.value.reduce((sum, line) => sum + line.ticketType.currentPrice * line.quantity, 0),
)

// --- Promo code ---------------------------------------------------------------

const couponCode = ref('')
const coupon = ref<CouponValidation | null>(null)
const couponError = ref<string | null>(null)
const isCheckingCoupon = ref(false)

/**
 * What the code takes off, or 0 when none is applied.
 *
 * Shown for the buyer's benefit only: `POST /orders` recomputes it from
 * `coupon_code`, and the server's figure is the one that is charged.
 */
const discount = computed(() => (coupon.value ? discountFor(coupon.value, subtotal.value) : 0))

const total = computed(() => Math.max(subtotal.value - discount.value, 0))

async function applyCoupon(): Promise<void> {
  const code = couponCode.value.trim()

  if (!code) return

  isCheckingCoupon.value = true
  couponError.value = null

  try {
    coupon.value = await couponsService.validate(code, props.eventId)
  } catch (error) {
    coupon.value = null
    // The API already answers in French — "Ce code promo a expiré", "…ne
    // s'applique pas à cet événement" — so its wording is shown as-is.
    couponError.value = error instanceof ApiError ? error.message : 'Code promo invalide.'
  } finally {
    isCheckingCoupon.value = false
  }
}

function clearCoupon(): void {
  coupon.value = null
  couponCode.value = ''
  couponError.value = null
}

const countdown = computed(() => {
  const minutes = Math.floor(secondsLeft.value / 60)
  const seconds = secondsLeft.value % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

/**
 * The two mobile-money operators PayGate exposes in Togo, and nothing else.
 *
 * The values are the API's `PaymentMethod` enum, not display labels: `FLOOZ`
 * is Moov Money's wallet and `TMONEY` is Togocom's, rebranded Mixx by Yas.
 * Only the current names are shown — an operator that renamed itself does not
 * want its old name on a payment screen.
 *
 * The marks are the operators' own files — Mixx's from yas.tg, Moov Money's
 * from Wikimedia Commons — served locally so the checkout never calls out to a
 * third party while someone is paying.
 */
const methods: { value: PaymentMethod; label: string; logo: string }[] = [
  { value: 'TMONEY', label: 'Mixx by Yas', logo: '/mock/pay-mixx-by-yas.svg' },
  { value: 'FLOOZ', label: 'Moov Money', logo: '/mock/pay-moov-money.webp' },
]

/**
 * Pays où l'un des deux opérateurs proposés opère réellement.
 *
 * Moov Africa couvre le Bénin, le Burkina Faso, la Côte d'Ivoire, le Mali, le
 * Niger et le Togo ; Yas (Mixx) couvre le Togo et le Sénégal. Quelqu'un au
 * Bénin peut donc payer son billet avant de faire le déplacement.
 *
 * ⚠️ Couvrir un pays ne veut pas dire que PayGate y encaisse : cette liste
 * suit les opérateurs, pas le contrat d'acquisition. À confirmer avec PayGate
 * avant la mise en production, sinon un acheteur béninois ira jusqu'au bout du
 * tunnel pour se faire refuser au dernier écran.
 */
const COUNTRIES = ['Togo', 'Bénin', 'Burkina Faso', 'Côte d’Ivoire', 'Mali', 'Niger', 'Sénégal']

const canPay = computed(
  () => acceptsTerms.value && isBuyerComplete.value && lines.value.length > 0 && !isPaying.value,
)

/**
 * Waits for PayGate to settle a payment.
 *
 * `initiate` only pushes the USSD prompt to the payer's phone; what decides the
 * outcome is the webhook PayGate calls on the backend once they enter their
 * PIN. So the front polls `payments/{id}/status` until the payment leaves
 * `pending`, rather than treating the initiate response as a receipt.
 *
 * Giving up after the deadline is not a failure: the payment may still clear
 * afterwards, which is why the caller sends the visitor to their orders instead
 * of telling them it was refused.
 */
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 120_000

async function waitForPayment(paymentId: string): Promise<PaymentStatus> {
  const deadline = Date.now() + POLL_TIMEOUT_MS

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    try {
      const payment = await dataSource.payments.status(paymentId)

      if (payment.status !== 'pending') return payment.status
    } catch {
      // A single failed poll is not an outcome — the webhook may simply not
      // have landed yet. Keep waiting until the deadline.
    }
  }

  return 'pending'
}

async function pay(): Promise<void> {
  if (!canPay.value || !event.value) return

  isPaying.value = true
  paymentNotice.value = null

  try {
    const order = await dataSource.orders.create({
      first_name: buyer.value.firstName.trim(),
      last_name: buyer.value.lastName.trim(),
      email: buyer.value.email.trim(),
      phone: buyer.value.phone.trim(),
      delivery_method: delivery.value,
      items: lines.value.map((line) => ({
        ticket_type_id: line.ticketType.id,
        quantity: line.quantity,
      })),
      // The server re-validates the code and recomputes the discount; what was
      // shown in the summary is only a preview.
      coupon_code: coupon.value?.coupon.code,
    })

    const payment = await dataSource.payments.initiate({
      order_id: order.id,
      network: method.value,
      phone_number: buyer.value.phone.trim(),
    })

    // The order exists from here on: stopping the countdown avoids yanking the
    // visitor back to the event page while they confirm on their phone.
    window.clearInterval(timer)

    const status = payment.status === 'pending' ? await waitForPayment(payment.id) : payment.status

    if (status === 'success') {
      // The tiers just lost stock, so the cached catalogue the explore page
      // filters over is now wrong. Dropping it makes the next visit refetch.
      catalog.resetEvents()

      ui.notify(`Commande ${order.orderNumber} confirmée.`, 'success')
      await router.push({ name: 'tickets' })

      return
    }

    if (status === 'pending') {
      ui.notify('Paiement toujours en attente de confirmation.', 'warning')
      await router.push({ name: 'orders' })

      return
    }

    paymentNotice.value =
      'Le paiement a été refusé ou annulé. Aucun montant n’a été débité. Vous pouvez réessayer.'
  } catch (error) {
    // Surface the API's own wording — "Stock insuffisant pour VIP", a 422 on the
    // buyer's phone number — instead of a blanket "échec" that hides the cause.
    paymentNotice.value =
      error instanceof ApiError ? error.message : 'Le paiement a échoué. Veuillez réessayer.'
  } finally {
    isPaying.value = false
  }
}

onMounted(async () => {
  await detail.execute(props.eventId)

  timer = window.setInterval(() => {
    secondsLeft.value -= 1

    if (secondsLeft.value > 0) return

    window.clearInterval(timer)
    ui.notify('Votre réservation a expiré. Reprenez votre sélection.', 'warning')
    void router.replace({ name: 'event-detail', params: { id: props.eventId } })
  }, 1000)
})

onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <div class="container checkout">
    <header class="checkout__header">
      <h1 class="t-headline-xl">Paiement</h1>
      <hr class="checkout__rule" />
    </header>

    <div class="checkout__timer-row">
      <p class="timer">
        <BaseIcon name="schedule" :size="20" />
        <span class="timer__value">{{ countdown }}</span>
        <span class="visually-hidden">restantes pour finaliser votre commande</span>
      </p>
    </div>

    <div v-if="detail.isLoading.value" class="checkout__loading">
      <BaseSkeleton variant="block" height="16rem" />
      <BaseSkeleton variant="block" height="24rem" />
    </div>

    <BaseAlert v-else-if="detail.error.value" variant="error" title="Commande indisponible">
      {{ detail.error.value.message }}
    </BaseAlert>

    <BaseAlert v-else-if="lines.length === 0" variant="warning" title="Panier vide">
      Aucun billet n'a été sélectionné.
      <RouterLink :to="{ name: 'event-detail', params: { id: eventId } }">
        Retourner à l'événement
      </RouterLink>
    </BaseAlert>

    <div v-else class="checkout__grid">
      <!-- Order summary -->
      <section class="panel">
        <header class="panel__header">
          <h2 class="t-headline-md">Votre commande</h2>
        </header>

        <div class="panel__body">
          <p v-for="line in lines" :key="line.ticketType.id" class="summary__line">
            <span>{{ line.quantity }} × {{ line.ticketType.name }}</span>
            <span>{{ formatPrice(line.ticketType.currentPrice * line.quantity) }}</span>
          </p>

          <hr class="summary__rule" />

          <!-- Promo code: checked against the API before the order is placed,
               so the buyer sees the new total rather than discovering it on
               the receipt. -->
          <div class="promo">
            <template v-if="coupon">
              <p class="promo__applied">
                <span>
                  <BaseIcon name="check_circle" :size="16" />
                  Code {{ coupon.coupon.code }}
                </span>
                <button class="promo__remove" type="button" @click="clearCoupon">Retirer</button>
              </p>
            </template>

            <template v-else>
              <label class="visually-hidden" for="promo-code">Code promo</label>
              <div class="promo__row">
                <input
                  id="promo-code"
                  v-model="couponCode"
                  class="promo__input"
                  type="text"
                  placeholder="Code promo"
                  autocomplete="off"
                  @keydown.enter.prevent="applyCoupon"
                />
                <BaseButton
                  variant="outline"
                  size="sm"
                  :loading="isCheckingCoupon"
                  :disabled="!couponCode.trim()"
                  @click="applyCoupon"
                >
                  Appliquer
                </BaseButton>
              </div>
              <p v-if="couponError" class="promo__error">{{ couponError }}</p>
            </template>
          </div>

          <p v-if="discount > 0" class="summary__line summary__line--discount">
            <span>Réduction</span>
            <span>−{{ formatPrice(discount) }}</span>
          </p>

          <p class="summary__total">
            <span class="t-headline-md">Total</span>
            <span class="t-headline-xl">{{ formatPrice(total) }}</span>
          </p>
        </div>

        <div class="panel__accordions">
          <details class="accordion">
            <summary class="accordion__summary">
              <span>
                <span class="accordion__eyebrow">Événement</span>
                <span class="accordion__value">{{ event?.title }}</span>
              </span>
              <BaseIcon class="accordion__chevron" name="expand_more" :size="22" />
            </summary>
            <div class="accordion__body">
              <p>Date : {{ formatEventSchedule(event?.startDate) }}</p>
              <p v-if="event?.venue">
                Lieu : {{ [event.venue.name, event.venue.city].filter(Boolean).join(', ') }}
              </p>
            </div>
          </details>

          <details class="accordion" open>
            <summary class="accordion__summary">
              <span>
                <span class="accordion__eyebrow">Acheteur</span>
                <span class="accordion__value">
                  {{ auth.isAuthenticated ? 'Vos coordonnées' : 'Achat en invité' }}
                </span>
              </span>
              <BaseIcon class="accordion__chevron" name="expand_more" :size="22" />
            </summary>

            <div class="accordion__body buyer">
              <p class="buyer__note">
                Ces coordonnées servent à émettre le billet et à vous l'envoyer.
              </p>

              <div class="buyer__row">
                <label class="buyer__field">
                  <span>Prénom *</span>
                  <input v-model="buyer.firstName" type="text" autocomplete="given-name" required />
                </label>
                <label class="buyer__field">
                  <span>Nom *</span>
                  <input v-model="buyer.lastName" type="text" autocomplete="family-name" required />
                </label>
              </div>

              <label class="buyer__field">
                <span>Adresse e-mail *</span>
                <input v-model="buyer.email" type="email" autocomplete="email" required />
              </label>

              <label class="buyer__field">
                <span>Numéro de téléphone *</span>
                <input v-model="buyer.phone" type="tel" autocomplete="tel" required />
              </label>
            </div>
          </details>

          <details class="accordion" open>
            <summary class="accordion__summary">
              <span>
                <span class="accordion__eyebrow">Réception du billet</span>
                <span class="accordion__value">
                  {{ deliveryChannels.find((c) => c.value === delivery)?.label }}
                </span>
              </span>
              <BaseIcon class="accordion__chevron" name="expand_more" :size="22" />
            </summary>

            <div class="accordion__body">
              <fieldset class="channels">
                <legend class="visually-hidden">Canal de réception du billet</legend>

                <label
                  v-for="channel in deliveryChannels"
                  :key="channel.value"
                  class="channel"
                  :class="{ 'channel--active': delivery === channel.value }"
                >
                  <input
                    v-model="delivery"
                    class="visually-hidden"
                    type="radio"
                    name="delivery"
                    :value="channel.value"
                  />
                  <span class="channel__icon">
                    <img v-for="logo in channel.logos" :key="logo" :src="logo" alt="" />
                  </span>
                  <span class="channel__body">
                    <span class="channel__label">{{ channel.label }}</span>
                    <span class="channel__hint">{{ channel.hint }}</span>
                  </span>
                </label>
              </fieldset>

              <p v-if="delivery !== 'email'" class="channels__note t-body-sm">
                Le billet part sur le numéro saisi plus haut&nbsp;: {{ buyer.phone || '—' }}
              </p>
            </div>
          </details>
        </div>
      </section>

      <!-- Payment method -->
      <section class="panel panel--payment">
        <header class="panel__header">
          <h2 class="t-headline-md">Méthode de paiement</h2>
        </header>

        <div class="payment">
          <div class="payment__field">
            <label class="payment__label" for="country">
              Pays <span aria-hidden="true">*</span>
            </label>
            <div class="payment__select-wrapper">
              <select id="country" v-model="country" class="payment__select">
                <option v-for="name in COUNTRIES" :key="name">{{ name }}</option>
              </select>
              <BaseIcon class="payment__chevron" name="arrow_drop_down" :size="22" />
            </div>
          </div>

          <fieldset class="payment__methods">
            <legend class="visually-hidden">Moyen de paiement</legend>

            <label
              v-for="option in methods"
              :key="option.value"
              class="method"
              :class="{ 'method--active': method === option.value }"
            >
              <input v-model="method" class="visually-hidden" type="radio" :value="option.value" />
              <span class="method__logo">
                <img :src="option.logo" :alt="option.label" />
              </span>
              <span class="method__label">{{ option.label }}</span>
            </label>
          </fieldset>

          <p class="payment__total">
            Total à payer : <span class="t-headline-md">{{ formatPrice(total) }}</span>
          </p>

          <label class="payment__terms">
            <input v-model="acceptsTerms" type="checkbox" required />
            <span>
              J'accepte les conditions générales de vente et la politique de confidentialité
            </span>
          </label>

          <BaseAlert v-if="paymentNotice" variant="error" title="Paiement non abouti">
            {{ paymentNotice }}
          </BaseAlert>

          <!-- The USSD prompt lands on the payer's phone; without saying so, a
               spinner that runs for a minute reads as a frozen page. -->
          <p v-if="isPaying" class="pay-hint">
            Confirmez le paiement sur votre téléphone. Ne fermez pas cette page.
          </p>

          <BaseButton
            block
            size="lg"
            :disabled="!canPay"
            :loading="isPaying"
            icon-end="keyboard_double_arrow_right"
            @click="pay"
          >
            Procéder au paiement
          </BaseButton>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.checkout {
  padding-block: var(--space-8) var(--space-16);
}

.checkout__header {
  margin-block-end: var(--space-8);
  text-align: center;
}

.checkout__rule {
  margin-block-start: var(--space-4);
  border: none;
  border-block-start: 1px solid var(--color-surface-variant);
  opacity: 0.5;
}

.checkout__timer-row {
  display: flex;
  justify-content: center;
  margin-block-end: var(--space-8);
}

.timer {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-2) var(--space-4);
  color: var(--color-secondary);
  background-color: var(--color-surface-container-high);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
}

.timer__value {
  color: var(--color-on-surface);
  font-size: var(--text-label-bold);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.checkout__loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.checkout__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
  align-items: start;
}

/* --- Panels --- */
.panel {
  overflow: hidden;
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-md);
}

.panel--payment {
  box-shadow: var(--shadow-sm);
}

.panel__header {
  padding: var(--space-6);
  color: var(--color-secondary);
  text-align: center;
  border-block-end: 1px solid var(--color-surface-variant);
}

.panel--payment .panel__header {
  border-block-end: none;
}

.panel__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
}

.summary__line {
  display: flex;
  justify-content: space-between;
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-lg);
}

.summary__rule {
  border: none;
  border-block-start: 1px solid var(--color-surface-variant);
  opacity: 0.5;
}

.summary__total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-block-start: var(--space-2);
}

/* --- Accordions --- */
.panel__accordions {
  border-block-start: 1px solid var(--color-surface-variant);
}

.accordion + .accordion {
  border-block-start: 1px solid var(--color-surface-variant);
}

.accordion__summary {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  list-style: none;
}

.accordion__summary::-webkit-details-marker {
  display: none;
}

.accordion__summary:hover {
  background-color: var(--color-surface-container-low);
}

.accordion__eyebrow {
  display: block;
  color: var(--color-secondary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.accordion__value {
  display: block;
  margin-block-start: var(--space-1);
  color: var(--color-on-surface);
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.accordion__chevron {
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.accordion[open] .accordion__chevron {
  transform: rotate(180deg);
}

.accordion__body {
  padding: 0 var(--space-6) var(--space-6);
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-md);
}

/* --- Buyer form --- */
.buyer {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.buyer__note {
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
}

.buyer__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

.buyer__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.channels__note {
  margin-block-start: var(--space-4);
  color: var(--color-secondary);
  line-height: 1.5;
}

.buyer__field > span {
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-sm);
  font-weight: 600;
}

.buyer__field input {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-body-md);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

.buyer__field input:focus {
  border-color: var(--color-focus);
  outline: none;
}

/* --- Delivery channels --- */
.channels {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  border: none;
}

.channel {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.channel:hover {
  border-color: var(--color-primary-container);
}

.channel--active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

/* The radio is visually hidden, so focus has to show on the card instead. */
.channel:has(:focus-visible) {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

/* Pas de pastille teintée derrière les marques : elles ont déjà leur forme et
   leurs couleurs. La largeur suit le nombre de logos — « Les deux » en porte
   deux côte à côte. */
.channel__icon {
  display: flex;
  flex-shrink: 0;
  gap: var(--space-1);
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
}

.channel__icon img {
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
}

.channel__body {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.channel__label {
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.channel__hint {
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
  line-height: 1.35;
}

/* --- Payment --- */
.payment {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6);
}

.payment__label {
  display: block;
  margin-block-end: var(--space-2);
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-sm);
  font-weight: 600;
}

.payment__label span {
  color: var(--color-primary);
}

.payment__select-wrapper {
  position: relative;
}

.payment__select {
  width: 100%;
  padding: var(--space-3) var(--space-10) var(--space-3) var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-md);
  cursor: pointer;
  appearance: none;
}

.payment__select:focus {
  border-color: var(--color-focus);
  outline: none;
}

.payment__chevron {
  position: absolute;
  top: 50%;
  right: var(--space-4);
  color: var(--color-secondary);
  transform: translateY(-50%);
  pointer-events: none;
}

.payment__methods {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  border: none;
}

.method {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.method:hover {
  border-color: var(--color-primary-container);
}

.method--active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

/* The radio is visually hidden, so focus has to show on the card instead. */
.method:has(:focus-visible) {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

/* The two marks have very different ratios — a square diamond and a wide
   wordmark — so the box is fixed and the logo is contained inside it. */
.method__logo {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 4rem;
  height: 2.75rem;
  padding: var(--space-1);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-sm);
}

.method__logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.method__label {
  font-size: var(--text-label-bold);
  font-weight: 700;
  line-height: 1.2;
}

.payment__total {
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-md);
  text-align: center;
}

.payment__total span {
  color: var(--color-on-surface);
}

.payment__terms {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-sm);
  line-height: 1.4;
  cursor: pointer;
}

.payment__terms input {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-block-start: 0.125rem;
  accent-color: var(--color-primary);
}

@media (width >= 768px) {
  .checkout__header {
    text-align: start;
  }

  .buyer__row {
    grid-template-columns: repeat(2, 1fr);
  }

  .payment__methods {
    grid-template-columns: repeat(2, 1fr);
  }
}

.pay-hint {
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-sm);
  text-align: center;
}

/* --- Promo code --- */
.promo {
  margin-block: var(--space-4);
}

.promo__row {
  display: flex;
  gap: var(--space-2);
}

.promo__input {
  flex: 1;
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-surface);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
}

.promo__input:focus {
  border-color: var(--color-focus);
  outline: none;
}

.promo__applied {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  color: var(--color-success, var(--color-primary));
  background-color: var(--color-surface-variant);
  border-radius: var(--radius-md);
  font-weight: 700;
}

.promo__applied span {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
}

.promo__remove {
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-sm);
  text-decoration: underline;
}

.promo__error {
  margin-block-start: var(--space-2);
  color: var(--color-error);
  font-size: var(--text-body-sm);
}

.summary__line--discount {
  color: var(--color-success, var(--color-primary));
  font-weight: 700;
}

@media (width >= 1024px) {
  .checkout__grid {
    grid-template-columns: 1fr 1.5fr;
  }
}
</style>
