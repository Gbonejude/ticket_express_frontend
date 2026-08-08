<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'

import { BaseAlert, BaseBadge, BaseButton, BaseIcon, BaseSkeleton } from '@/components/ui'
import { useApiRequest } from '@/composables/useApiRequest'
import { dataSource } from '@/data'
import { paidPrice, pdfDownloadUrl, qrImageUrl } from '@/services'
import { useUiStore } from '@/stores/ui.store'
import { eventCover } from '@/utils/event'
import { formatPrice } from '@/utils/format'

/**
 * Single ticket — Stitch screen « Mes Billets (Style Tikerama) ».
 *
 * The layout is a physical ticket: poster header, QR code, details, then a
 * perforated stub. It stays narrow (480 px) at every width — a boarding pass
 * stretched across a desktop screen stops reading as one.
 */
const props = defineProps<{ id: string }>()

const ui = useUiStore()

const row = useApiRequest(dataSource.tickets.get)

const ticket = computed(() => row.data.value?.ticket)

/** Ce que ce billet a coûté — la ligne de commande fait foi, pas le tarif. */
const price = computed(() => (row.data.value ? paidPrice(row.data.value) : null))
const event = computed(() => row.data.value?.event)
const order = computed(() => row.data.value?.order)

const dateParts = computed(() => {
  const iso = event.value?.startDate?.datetime

  if (!iso) return null

  const value = new Date(iso)
  const doors = new Date(value.getTime() - 60 * 60 * 1000)
  const time = (date: Date) =>
    new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
      .format(date)
      .replace(':', 'h')

  return {
    day: new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(value),
    doors: time(doors),
    start: time(value),
  }
})

/**
 * The QR image and the PDF are served by token-authenticated public routes, so
 * they are plain URLs the browser fetches on its own — no bearer header, and
 * nothing for this page to proxy.
 */
const qrUrl = computed(() => (row.data.value ? qrImageUrl(row.data.value) : null))
const pdfUrl = computed(() => (order.value ? pdfDownloadUrl(order.value) : null))

/** WhatsApp hand-off, prefilled by the backend with the download link. */
const whatsappUrl = computed(() => order.value?.downloads?.whatsappLink ?? null)

/**
 * Shares the ticket through the OS sheet, falling back to the clipboard.
 *
 * What is shared is the download link, not the current URL: `/mon-espace` is
 * behind a guard, so a recipient following it would land on a login form.
 */
async function share(): Promise<void> {
  const url = pdfUrl.value

  if (!url) {
    ui.notify('Le lien de téléchargement a expiré.', 'warning')

    return
  }

  const title = `Mon billet — ${event.value?.title ?? 'Ticket Express'}`

  if (navigator.share) {
    try {
      await navigator.share({ title, url })

      return
    } catch {
      // Cancelling the sheet is not an error, and neither is a browser that
      // advertises the API but refuses it; fall through to the clipboard.
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    ui.notify('Lien du billet copié.', 'success')
  } catch {
    ui.notify('Partage impossible sur cet appareil.', 'error')
  }
}

watch(
  () => props.id,
  (id) => void row.execute(id),
)

onMounted(() => {
  void row.execute(props.id)
})
</script>

<template>
  <div class="wrapper">
    <div v-if="row.isLoading.value" class="loading">
      <BaseSkeleton variant="block" height="12rem" />
      <BaseSkeleton variant="block" height="20rem" />
    </div>

    <div v-else-if="row.error.value" class="loading">
      <BaseAlert variant="error" title="Billet indisponible">
        {{ row.error.value.message }}
      </BaseAlert>
      <BaseButton :to="{ name: 'tickets' }">Retour à mes billets</BaseButton>
    </div>

    <template v-else-if="ticket && event">
      <article class="pass">
        <!-- Poster header -->
        <header class="pass__hero">
          <img v-if="eventCover(event)" class="pass__hero-image" :src="eventCover(event)!" alt="" />
          <div class="pass__hero-scrim" aria-hidden="true" />

          <div class="pass__hero-body">
            <BaseBadge v-if="event.category">{{ event.category.name }}</BaseBadge>
            <h1 class="pass__title t-headline-lg">{{ event.title }}</h1>
          </div>
        </header>

        <div class="pass__content">
          <!-- QR -->
          <div class="qr">
            <img
              v-if="qrUrl"
              class="qr__image"
              :src="qrUrl"
              :alt="`QR code du billet ${ticket.ticketNumber}`"
            />
            <!-- An online ticket carries an access link instead of a QR code,
                 and a lapsed download link leaves neither. -->
            <p v-else class="qr__missing">
              {{
                ticket.isOnlineAccess
                  ? 'Ce billet donne accès à un événement en ligne : utilisez le lien ci-dessous.'
                  : 'QR code indisponible — le lien de téléchargement a expiré.'
              }}
            </p>
            <p class="qr__id">ID : {{ ticket.ticketNumber }}</p>
          </div>

          <BaseAlert v-if="ticket.onlineAccessLink" variant="info" title="Accès en ligne">
            <a :href="ticket.onlineAccessLink" target="_blank" rel="noopener noreferrer">
              Rejoindre l'événement
            </a>
          </BaseAlert>

          <!-- Event details -->
          <div class="details">
            <div class="details__row">
              <BaseIcon name="calendar_today" :size="22" />
              <div>
                <p class="details__value">{{ dateParts?.day }}</p>
                <p class="details__hint">
                  Portes : {{ dateParts?.doors }} | Début : {{ dateParts?.start }}
                </p>
              </div>
            </div>

            <div v-if="event.venue" class="details__row">
              <BaseIcon name="location_on" :size="22" />
              <div>
                <p class="details__value">{{ event.venue.name }}</p>
                <p class="details__hint">
                  {{
                    [event.venue.address, event.venue.city, event.venue.country]
                      .filter(Boolean)
                      .join(', ')
                  }}
                </p>
              </div>
            </div>
          </div>

          <!-- Ticket specifics -->
          <div class="specs">
            <h2 class="specs__title">Détails du ticket</h2>

            <dl class="specs__grid">
              <div>
                <dt>Type</dt>
                <dd class="t-headline-md">{{ ticket.ticketType?.name ?? '—' }}</dd>
              </div>
              <div>
                <dt>Prix</dt>
                <!-- Le prix payé, lu sur la ligne de commande, et non le tarif
                     courant : une promotion terminée ou un tarif réajusté depuis
                     l'achat affichait un montant que le porteur n'a jamais réglé. -->
                <dd class="t-headline-md specs__price">
                  {{ price === null ? '—' : formatPrice(price) }}
                </dd>
              </div>
              <div>
                <dt>Commande</dt>
                <dd class="t-headline-md">{{ order?.orderNumber }}</dd>
              </div>
              <div>
                <dt>Statut</dt>
                <dd class="t-headline-md">{{ ticket.statusLabel }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div class="pass__perforation" aria-hidden="true" />

        <footer class="pass__stub">
          <p>Scannez ce code à l'entrée de l'événement.</p>
        </footer>
      </article>

      <div class="actions">
        <!-- A real link, not a fetch: the endpoint answers with the PDF and the
             token is in the URL, so the browser downloads it directly. -->
        <BaseButton
          v-if="pdfUrl"
          block
          size="lg"
          :href="pdfUrl"
          icon-start="picture_as_pdf"
        >
          Télécharger PDF
        </BaseButton>
        <BaseAlert v-else variant="warning" title="Téléchargement indisponible">
          Le lien de téléchargement de cette commande a expiré ou atteint sa limite.
        </BaseAlert>

        <BaseButton
          v-if="whatsappUrl"
          block
          size="lg"
          variant="outline"
          :href="whatsappUrl"
          icon-start="chat"
        >
          Envoyer sur WhatsApp
        </BaseButton>

        <BaseButton block size="lg" variant="outline" icon-start="send" @click="share">
          Partager le billet
        </BaseButton>
        <BaseButton block variant="ghost" :to="{ name: 'tickets' }" icon-start="arrow_back">
          Retour à mes billets
        </BaseButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.wrapper {
  max-width: 30rem;
  margin-inline: auto;
  padding: var(--space-8) var(--space-4) var(--space-16);
}

.loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* --- Pass --- */
.pass {
  overflow: hidden;
  background-color: var(--color-surface-container-lowest);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.pass__hero {
  position: relative;
  height: 12rem;
}

.pass__hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pass__hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgb(0 0 0 / 80%), transparent);
}

.pass__hero-body {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
  padding: var(--space-6);
}

.pass__title {
  color: #fff;
}

.pass__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-6);
}

/* --- QR --- */
.qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-4);
  background-color: #fff;
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-md);
}

.qr__image {
  width: 12rem;
  height: 12rem;
  object-fit: contain;
}

.qr__id {
  margin-block-start: var(--space-4);
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

/* --- Details --- */
.details {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.details__row {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}

.details__row :deep(svg) {
  flex-shrink: 0;
  color: var(--color-primary);
}

.details__value {
  color: var(--color-on-surface);
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.details__hint {
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
}

/* --- Specs --- */
.specs {
  padding: var(--space-4);
  background-color: var(--color-surface-container);
  border-radius: var(--radius-md);
}

.specs__title {
  margin-block-end: var(--space-3);
  color: var(--color-primary);
  font-size: var(--text-label-bold);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.specs__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.specs__grid dt {
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
}

.specs__grid dd {
  color: var(--color-on-surface);
  overflow-wrap: anywhere;
}

.specs__price {
  color: var(--color-primary);
}

/* --- Perforation --- */
.pass__perforation {
  position: relative;
  height: 1px;
  background-image: linear-gradient(
    to right,
    var(--color-outline-variant) 0 8px,
    transparent 8px 16px
  );
  background-size: 16px 1px;
}

/* The two half-circles bitten out of the sides, as on a paper ticket. */
.pass__perforation::before,
.pass__perforation::after {
  position: absolute;
  top: -0.75rem;
  width: 1.5rem;
  height: 1.5rem;
  background-color: var(--color-background);
  border-radius: var(--radius-full);
  content: '';
}

.pass__perforation::before {
  left: -0.75rem;
}

.pass__perforation::after {
  right: -0.75rem;
}

.pass__stub {
  display: grid;
  place-items: center;
  height: 6rem;
  padding-inline: var(--space-6);
  color: var(--color-on-secondary-container);
  font-size: var(--text-body-sm);
  text-align: center;
  background-color: var(--color-surface-container-low);
}

/* --- Actions --- */
.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-block-start: var(--space-8);
}
</style>
