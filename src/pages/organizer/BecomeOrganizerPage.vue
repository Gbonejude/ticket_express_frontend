<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'

import { ApiError } from '@/api'
import { BaseAlert, BaseButton, BaseCard, BaseIcon, BaseInput } from '@/components/ui'
import { organizersService } from '@/services'
import { useUiStore } from '@/stores/ui.store'

/**
 * "Devenir organisateur" — a public sign-up form, and nothing else.
 *
 * Organizers do not have an account *on this site*: they manage their events in
 * TicketExpress-dashboard. So this page creates the application and stops. It
 * deliberately does not sign anyone in, does not show a status screen, and does
 * not link to the back-office — the applicant cannot get in yet, and the URL
 * reaches them in the approval e-mail once an administrator has decided.
 *
 * The whole journey after this form is e-mail: an administrator is notified, the
 * applicant gets an acknowledgement, and approval brings the dashboard link.
 */
const ui = useUiStore()

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  company_name: '',
  description: '',
  website: '',
})

const error = ref<ApiError | null>(null)
const isSubmitting = ref(false)
const isSent = ref(false)

// --- Logo -------------------------------------------------------------------

const logoInput = ref<HTMLInputElement | null>(null)
const logo = ref<File | null>(null)
const logoPreview = ref<string | null>(null)

function pickLogo(payload: Event): void {
  const file = (payload.target as HTMLInputElement).files?.[0]

  if (!file) return

  // Revoked before replacing, so picking several files in a row does not leak
  // a blob URL each time.
  if (logoPreview.value) URL.revokeObjectURL(logoPreview.value)

  logo.value = file
  logoPreview.value = URL.createObjectURL(file)
}

function clearLogo(): void {
  if (logoPreview.value) URL.revokeObjectURL(logoPreview.value)

  logo.value = null
  logoPreview.value = null
  if (logoInput.value) logoInput.value.value = ''
}

onBeforeUnmount(clearLogo)

const fieldError = (field: string): string | undefined => error.value?.firstError(field)

const isComplete = computed(() =>
  Boolean(
    form.first_name.trim() &&
      form.last_name.trim() &&
      form.email.trim() &&
      form.phone.trim() &&
      form.password &&
      form.company_name.trim() &&
      form.description.trim(),
  ),
)

async function submit(): Promise<void> {
  if (form.password !== form.password_confirmation) {
    error.value = new ApiError('Les deux mots de passe ne correspondent pas.', {
      status: 422,
      errors: { password_confirmation: ['Les deux mots de passe ne correspondent pas.'] },
    })

    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    await organizersService.register({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      password_confirmation: form.password_confirmation,
      company_name: form.company_name.trim(),
      description: form.description.trim(),
      website: form.website.trim() || undefined,
      logo: logo.value,
    })

    isSent.value = true
    ui.notify('Votre demande a bien été envoyée.', 'success')
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught : new ApiError('Envoi impossible.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="container become">
    <!-- Sent: nothing to do but wait for the e-mail. -->
    <BaseCard v-if="isSent" class="become__panel become__panel--done">
      <div class="status">
        <BaseIcon name="check_circle" :size="40" />
        <div>
          <h1 class="t-headline-lg">Demande envoyée</h1>
          <p class="t-body-lg">
            Merci ! Nous avons bien reçu votre demande pour
            <strong>{{ form.company_name }}</strong
            >.
          </p>
        </div>
      </div>

      <BaseAlert variant="info" title="Et maintenant ?">
        <p>
          Un e-mail de confirmation vient de vous être envoyé. Notre équipe examine votre dossier,
          puis vous recevrez une réponse par e-mail.
        </p>
        <p class="become__hint">
          En cas d'accord, cet e-mail contiendra le lien vers votre espace organisateur, où vous
          créerez et gérerez vos événements.
        </p>
      </BaseAlert>

      <BaseButton :to="{ name: 'home' }" variant="outline">Retour à l'accueil</BaseButton>
    </BaseCard>

    <template v-else>
      <header class="become__header">
        <h1 class="t-headline-xl">Devenir organisateur</h1>
        <p class="become__lead t-body-lg">
          Publiez vos événements sur Ticket Express et vendez vos billets en ligne. Créez votre
          compte organisateur ci-dessous : notre équipe l'examine sous 48 heures.
        </p>
      </header>

      <BaseCard class="become__panel">
        <BaseAlert
          v-if="error && !error.isValidationError"
          variant="error"
          title="Envoi impossible"
        >
          {{ error.message }}
        </BaseAlert>

        <form class="become__form" novalidate @submit.prevent="submit">
          <h2 class="become__section t-label">Votre structure</h2>

          <BaseInput
            v-model="form.company_name"
            label="Nom de votre structure"
            placeholder="EventPro Togo"
            required
            :error="fieldError('company_name')"
          />

          <div class="field">
            <label class="field__label" for="organizer-description">
              Décrivez votre activité <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="organizer-description"
              v-model="form.description"
              class="field__control"
              rows="4"
              placeholder="Organisation de concerts et festivals à Lomé."
              required
              :aria-invalid="Boolean(fieldError('description'))"
            />
            <p v-if="fieldError('description')" class="field__error">
              {{ fieldError('description') }}
            </p>
          </div>

          <BaseInput
            v-model="form.website"
            label="Site web (facultatif)"
            placeholder="https://exemple.tg"
            :error="fieldError('website')"
          />

          <!-- Optional on purpose: a missing logo must not stop someone from
               applying. It is what the administrator sees while reviewing the
               file, and what dresses the public organiser page afterwards. -->
          <div class="field">
            <span class="field__label">Logo (facultatif)</span>

            <div class="logo">
              <img v-if="logoPreview" class="logo__preview" :src="logoPreview" alt="Aperçu du logo" />
              <span v-else class="logo__placeholder" aria-hidden="true">
                <BaseIcon name="business" :size="28" />
              </span>

              <div class="logo__actions">
                <BaseButton variant="outline" size="sm" @click="logoInput?.click()">
                  {{ logoPreview ? 'Changer le logo' : 'Choisir un logo' }}
                </BaseButton>
                <BaseButton v-if="logoPreview" variant="ghost" size="sm" @click="clearLogo">
                  Retirer
                </BaseButton>

                <p class="logo__hint">JPG ou PNG, 2 Mo maximum.</p>
              </div>

              <input
                ref="logoInput"
                class="visually-hidden"
                type="file"
                accept="image/*"
                @change="pickLogo"
              />
            </div>

            <p v-if="fieldError('logo')" class="field__error">{{ fieldError('logo') }}</p>
          </div>

          <h2 class="become__section t-label">Votre compte</h2>

          <div class="become__row">
            <BaseInput
              v-model="form.first_name"
              label="Prénom"
              required
              autocomplete="given-name"
              :error="fieldError('first_name')"
            />
            <BaseInput
              v-model="form.last_name"
              label="Nom"
              required
              autocomplete="family-name"
              :error="fieldError('last_name')"
            />
          </div>

          <BaseInput
            v-model="form.email"
            label="Adresse e-mail"
            type="email"
            required
            autocomplete="email"
            :error="fieldError('email')"
          />

          <BaseInput
            v-model="form.phone"
            label="Téléphone"
            type="tel"
            required
            autocomplete="tel"
            placeholder="+228 90 00 00 00"
            :error="fieldError('phone')"
          />

          <div class="become__row">
            <BaseInput
              v-model="form.password"
              label="Mot de passe"
              type="password"
              required
              autocomplete="new-password"
              :error="fieldError('password')"
            />
            <BaseInput
              v-model="form.password_confirmation"
              label="Confirmer le mot de passe"
              type="password"
              required
              autocomplete="new-password"
              :error="fieldError('password_confirmation')"
            />
          </div>

          <BaseButton type="submit" size="lg" :loading="isSubmitting" :disabled="!isComplete" block>
            Envoyer ma demande
          </BaseButton>
        </form>
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.become {
  padding-block: var(--space-8) var(--space-section-gap);
}

.become__header {
  max-width: 44rem;
  margin-inline: auto;
  margin-block-end: var(--space-gutter);
  text-align: center;
}

.become__lead {
  margin-block-start: var(--space-2);
  color: var(--color-on-surface-variant);
}

/* A single-column form reads better centred than pinned to the left edge of a
   wide page. */
.become__panel {
  display: grid;
  gap: var(--space-gutter);
  max-width: 44rem;
  margin-inline: auto;
}

.become__panel--done {
  margin-block-start: var(--space-8);
  justify-items: start;
}

.become__section {
  color: var(--color-on-surface);
  text-transform: uppercase;
}

.become__section:not(:first-child) {
  margin-block-start: var(--space-4);
}

.status {
  display: flex;
  gap: var(--space-stack-md);
  align-items: flex-start;
  color: var(--color-success, var(--color-primary));
}

.status h1 {
  color: var(--color-on-surface);
}

.status p {
  margin-block-start: var(--space-2);
  color: var(--color-on-surface-variant);
}

.become__hint {
  margin-block-start: var(--space-2);
  font-size: var(--text-body-sm);
}

.become__form {
  display: grid;
  gap: var(--space-gutter);
}

.become__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-gutter);
}

/* Multiline field, matching BaseInput's look. */
.field {
  display: grid;
  gap: var(--space-2);
}

.field__label {
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.field__control {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  color: var(--color-on-surface);
  background-color: var(--color-surface);
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  resize: vertical;
}

.field__control:focus {
  border-color: var(--color-focus);
  outline: none;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-focus) 10%, transparent);
}

.field__control[aria-invalid='true'] {
  border-color: var(--color-error);
}

.field__error {
  color: var(--color-error);
  font-size: var(--text-body-sm);
}

/* --- Logo --- */
.logo {
  display: flex;
  gap: var(--space-gutter);
  align-items: center;
}

.logo__preview,
.logo__placeholder {
  flex-shrink: 0;
  width: 5rem;
  height: 5rem;
  border-radius: var(--radius-md);
}

.logo__preview {
  object-fit: cover;
  border: 1px solid var(--color-outline-variant);
}

.logo__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-on-surface-variant);
  background-color: var(--color-surface-variant);
  border: 1px dashed var(--color-outline);
}

.logo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.logo__hint {
  flex-basis: 100%;
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-sm);
}

@media (width >= 640px) {
  .become__row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
