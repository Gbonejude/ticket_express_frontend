<script setup lang="ts">
import { ref } from 'vue'

import { BaseButton, BaseIcon, type IconName } from '@/components/ui'
import { APP_CONFIG } from '@/constants/app'
import { dataSource } from '@/data'
import { useUiStore } from '@/stores/ui.store'
import { HEAD_OFFICE, directionsUrl, osmEmbedUrl } from '@/utils'

/**
 * Contact — Stitch screen « Contact (Simplifié) ».
 *
 * The form posts through `dataSource.contact.send`, which maps to
 * `POST /contact`. Sending the e-mail is the backend's job: the front only
 * hands over the message and reports what came back.
 *
 * A failure is surfaced rather than swallowed — a contact form that silently
 * loses a message is worse than one that says it could not send.
 */
const ui = useUiStore()

const form = ref({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  acceptsPrivacy: false,
})

const isSending = ref(false)

const subjects = [
  'Support billetterie',
  'Partenariat organisateur',
  'Réclamation paiement',
  'Autre demande',
]

const offices: { icon: IconName; title: string; lines: string[]; href?: string }[] = [
  {
    icon: 'location_on',
    title: 'Siège social',
    lines: ['Route de Baguida, Baguida', 'Golfe, Maritime, Togo'],
  },
  {
    icon: 'call',
    title: 'Assistance téléphonique',
    lines: ['+228 90 12 34 56'],
    href: 'tel:+22890123456',
  },
  {
    icon: 'mail',
    title: 'Courriel officiel',
    lines: ['contact@ticketexpress.com'],
    href: 'mailto:contact@ticketexpress.com',
  },
]

const MAP_EMBED = osmEmbedUrl(HEAD_OFFICE.latitude, HEAD_OFFICE.longitude)
const MAP_DIRECTIONS = directionsUrl(`${HEAD_OFFICE.address}, ${HEAD_OFFICE.country}`, HEAD_OFFICE)

async function submit(): Promise<void> {
  isSending.value = true

  try {
    const message = await dataSource.contact.send({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      phone: form.value.phone.trim(),
      subject: form.value.subject,
      message: form.value.message.trim(),
    })

    ui.notify(message, 'success')
    form.value = { name: '', email: '', phone: '', subject: '', message: '', acceptsPrivacy: false }
  } catch {
    ui.notify('L’envoi a échoué. Réessayez ou écrivez-nous directement par e-mail.', 'error')
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div class="contact">
    <!-- Hero -->
    <section class="container hero">
      <h1 class="hero__title t-headline-xl">Contactez notre support</h1>
      <span class="rule" aria-hidden="true" />
      <p class="hero__lead t-body-lg">
        Notre équipe d'assistance est à votre disposition pour répondre à vos questions techniques
        ou commerciales dans les plus brefs délais.
      </p>
    </section>

    <!-- Form + offices -->
    <section class="container grid">
      <div class="card">
        <header class="card__header">
          <h2 class="t-headline-lg">Envoyez-nous un message</h2>
          <span class="rule" aria-hidden="true" />
        </header>

        <form class="form" @submit.prevent="submit">
          <label class="visually-hidden" for="contact-name">Nom complet</label>
          <input
            id="contact-name"
            v-model="form.name"
            class="form__input"
            type="text"
            placeholder="Nom complet *"
            autocomplete="name"
            required
          />

          <label class="visually-hidden" for="contact-email">
            Adresse e-mail professionnelle
          </label>
          <input
            id="contact-email"
            v-model="form.email"
            class="form__input"
            type="email"
            placeholder="Adresse e-mail professionnelle *"
            autocomplete="email"
            required
          />

          <div class="form__phone">
            <span class="form__prefix">
              <BaseIcon name="call" :size="18" />
              +228
            </span>
            <label class="visually-hidden" for="contact-phone">Numéro de téléphone</label>
            <input
              id="contact-phone"
              v-model="form.phone"
              class="form__input"
              type="tel"
              placeholder="Numéro de téléphone"
              autocomplete="tel"
            />
          </div>

          <div class="form__select-wrapper">
            <label class="visually-hidden" for="contact-subject">Objet de votre demande</label>
            <select id="contact-subject" v-model="form.subject" class="form__input" required>
              <option value="" disabled>Objet de votre demande *</option>
              <option v-for="subject in subjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
            <BaseIcon class="form__chevron" name="expand_more" :size="20" />
          </div>

          <label class="visually-hidden" for="contact-message">Détaillez votre demande</label>
          <textarea
            id="contact-message"
            v-model="form.message"
            class="form__input"
            rows="6"
            placeholder="Détaillez votre demande ici *"
            required
          />

          <label class="form__consent">
            <input v-model="form.acceptsPrivacy" type="checkbox" required />
            <span>
              J'accepte que mes données soient traitées conformément à la
              <a href="#confidentialite">politique de confidentialité</a> de {{ APP_CONFIG.name }}.
            </span>
          </label>

          <BaseButton
            class="form__submit"
            type="submit"
            block
            size="lg"
            :loading="isSending"
            icon-end="send"
          >
            Valider l'envoi
          </BaseButton>
        </form>
      </div>

      <div class="side">
        <div class="card card--offices">
          <header class="card__header">
            <h2 class="t-headline-lg">Nos bureaux</h2>
            <span class="rule" aria-hidden="true" />
          </header>

          <ul class="offices">
            <li v-for="office in offices" :key="office.title" class="offices__item">
              <span class="offices__icon">
                <BaseIcon :name="office.icon" :size="22" />
              </span>

              <div>
                <h3 class="offices__label">{{ office.title }}</h3>
                <p v-for="line in office.lines" :key="line" class="offices__value">
                  <a v-if="office.href" :href="office.href">{{ line }}</a>
                  <template v-else>{{ line }}</template>
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div class="map">
          <iframe
            class="map__frame"
            :src="MAP_EMBED"
            title="Carte du siège de TicketExpress à Baguida"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>

          <div class="map__card">
            <h3 class="map__name">{{ HEAD_OFFICE.name }}</h3>
            <p class="map__address">Route de Baguida, Baguida, Golfe, Togo</p>

            <p class="map__rating">
              <span class="map__score">5,0</span>
              <span class="map__stars" aria-hidden="true">
                <BaseIcon v-for="n in 5" :key="n" name="star" :size="14" />
              </span>
              <span class="map__count">(1 avis)</span>
            </p>

            <div class="map__actions">
              <a
                class="map__action"
                :href="MAP_DIRECTIONS"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BaseIcon name="directions" :size="18" />
                Itinéraire
              </a>
              <span class="map__action"><BaseIcon name="save" :size="18" /> Enregistrer</span>
              <span class="map__action"><BaseIcon name="share" :size="18" /> Partager</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Organiser CTA -->
    <section class="cta">
      <div class="container cta__inner">
        <h2 class="cta__title t-headline-lg">Prêt à lancer votre prochain événement ?</h2>
        <p class="cta__lead t-body-lg">
          Rejoignez des milliers d'organisateurs qui font confiance à {{ APP_CONFIG.name }} pour
          leur billetterie en ligne.
        </p>
        <BaseButton variant="inverse" size="lg" href="#publier" icon-end="arrow_forward">
          Créer un événement
        </BaseButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* The short red underline the mockup puts under each heading. */
.rule {
  display: block;
  width: 2.5rem;
  height: 3px;
  margin: var(--space-2) auto;
  background-color: var(--color-primary-container);
  border-radius: 2px;
}

/* --- Hero --- */
.hero {
  padding-block: var(--space-16);
  text-align: center;
}

.hero__title {
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.hero__lead {
  max-width: 42rem;
  margin-inline: auto;
  margin-block-start: var(--space-6);
  color: var(--color-secondary);
}

/* --- Grid --- */

/* `min-width: 0` on the items: a grid item defaults to `min-width: auto`, so
   it refuses to shrink below its content and spills out of its track. At
   320 px both columns were 319 px wide inside a 288 px track, pushing 15 px of
   horizontal scroll onto the page. */
.grid > * {
  min-width: 0;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
  align-items: stretch;
  padding-block-end: var(--space-section-gap);
}

/* 32 px of padding on each side leaves a 359 px phone barely 280 px of form.
   The generous padding is a desktop affordance and returns at 768 px. */
.card {
  padding: var(--space-5);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.card--offices {
  flex: 1;
}

.card__header {
  margin-block-end: var(--space-10);
  text-align: center;
}

/* --- Form --- */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form__input {
  width: 100%;
  padding: var(--space-4);
  font-family: inherit;
  font-size: var(--text-body-md);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.form__input:hover {
  border-color: var(--color-outline);
}

.form__input:focus {
  border-color: var(--color-focus);
  outline: none;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-focus) 10%, transparent);
}

textarea.form__input {
  resize: vertical;
}

.form__phone {
  display: flex;
  gap: var(--space-3);
}

.form__prefix {
  display: flex;
  flex-shrink: 0;
  gap: var(--space-2);
  align-items: center;
  padding-inline: var(--space-3);
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-md);
  font-weight: 500;
  background-color: var(--color-surface-container-low);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
}

.form__select-wrapper {
  position: relative;
}

.form__select-wrapper select {
  color: var(--color-secondary);
  cursor: pointer;
  appearance: none;
}

.form__chevron {
  position: absolute;
  top: 50%;
  right: var(--space-4);
  color: var(--color-secondary);
  transform: translateY(-50%);
  pointer-events: none;
}

.form__consent {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding-block: var(--space-2);
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
  cursor: pointer;
}

.form__consent input {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  margin-block-start: 0.25rem;
  accent-color: var(--color-primary);
}

.form__consent a {
  text-decoration: underline;
}

.form__submit {
  font-size: var(--text-headline-md);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* --- Side --- */
.side {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.offices {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.offices__item {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
}

.offices__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  color: var(--color-primary);
  background-color: var(--color-surface-container);
  border-radius: var(--radius-md);
}

.offices__label {
  color: var(--color-on-surface);
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.offices__value {
  color: var(--color-secondary);
  font-size: var(--text-body-md);
  overflow-wrap: anywhere;
}

.offices__value a {
  color: inherit;
}

.offices__value a:hover {
  color: var(--color-primary);
}

/* --- Map --- */
.map {
  position: relative;
  height: 20rem;
  overflow: hidden;
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
}

.map__frame {
  width: 100%;
  height: 100%;
  border: none;
}

.map__card {
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  max-width: 17rem;
  padding: var(--space-3);
  background-color: var(--color-surface-container-lowest);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
}

.map__name {
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.map__address {
  margin-block-start: var(--space-1);
  color: var(--color-secondary);
  font-size: 11px;
}

.map__rating {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  margin-block-start: var(--space-1);
  font-size: 11px;
}

.map__score {
  color: var(--color-tertiary);
  font-weight: 700;
}

.map__stars {
  display: flex;
  color: var(--color-tertiary-container);
}

.map__count {
  color: var(--color-secondary);
}

.map__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-block-start: var(--space-3);
}

.map__action {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 600;
}

/* --- CTA --- */
.cta {
  padding-block: var(--space-section-gap);
  background-color: var(--color-primary);
}

.cta__inner {
  text-align: center;
}

.cta__title {
  color: #fff;
}

.cta__lead {
  max-width: 42rem;
  margin-inline: auto;
  margin-block: var(--space-4) var(--space-8);
  color: rgb(255 255 255 / 85%);
}

@media (width >= 768px) {
  .card {
    padding: var(--space-8);
  }

  .card--offices {
    padding: var(--space-10);
  }
}

@media (width >= 1024px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
