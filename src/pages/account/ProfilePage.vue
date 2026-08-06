<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { ApiError } from '@/api'
import { BaseAlert, BaseAvatar, BaseButton, BaseCard, BaseInput } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'

/**
 * Account settings: personal details, password, profile picture.
 *
 * All three write through `PUT /users/{id}` with the visitor's own id — the API
 * has no `me`-scoped write route — which the auth store handles so the id is
 * always taken from the session and never from the page.
 *
 * The password form is separate from the details form on purpose: they fail
 * differently (a rejected password must not discard edited details) and the
 * API validates them independently.
 */
const auth = useAuthStore()
const ui = useUiStore()

const details = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
})

const passwords = reactive({
  password: '',
  password_confirmation: '',
})

const detailsError = ref<ApiError | null>(null)
const passwordError = ref<ApiError | null>(null)
const isSavingDetails = ref(false)
const isSavingPassword = ref(false)
const isUploadingAvatar = ref(false)

const avatarInput = ref<HTMLInputElement | null>(null)

const user = computed(() => auth.user)

const detailsFieldError = (field: string): string | undefined => detailsError.value?.firstError(field)
const passwordFieldError = (field: string): string | undefined =>
  passwordError.value?.firstError(field)

/** Copies the session's user into the form. */
function hydrate(): void {
  details.first_name = user.value?.firstName ?? ''
  details.last_name = user.value?.lastName ?? ''
  details.email = user.value?.email ?? ''
  details.phone = user.value?.phone ?? ''
  details.address = user.value?.address ?? ''
}

async function saveDetails(): Promise<void> {
  isSavingDetails.value = true
  detailsError.value = null

  try {
    await auth.updateProfile({
      first_name: details.first_name.trim(),
      last_name: details.last_name.trim(),
      email: details.email.trim(),
      phone: details.phone.trim(),
      address: details.address.trim() || null,
    })

    ui.notify('Vos informations ont été mises à jour.', 'success')
  } catch (caught) {
    detailsError.value = caught instanceof ApiError ? caught : new ApiError('Mise à jour impossible.')
  } finally {
    isSavingDetails.value = false
  }
}

async function savePassword(): Promise<void> {
  if (passwords.password !== passwords.password_confirmation) {
    passwordError.value = new ApiError('Les deux mots de passe ne correspondent pas.', {
      status: 422,
      errors: { password_confirmation: ['Les deux mots de passe ne correspondent pas.'] },
    })

    return
  }

  isSavingPassword.value = true
  passwordError.value = null

  try {
    await auth.changePassword({ ...passwords })

    passwords.password = ''
    passwords.password_confirmation = ''
    ui.notify('Votre mot de passe a été modifié.', 'success')
  } catch (caught) {
    passwordError.value =
      caught instanceof ApiError ? caught : new ApiError('Modification impossible.')
  } finally {
    isSavingPassword.value = false
  }
}

async function uploadAvatar(payload: Event): Promise<void> {
  const file = (payload.target as HTMLInputElement).files?.[0]

  if (!file) return

  isUploadingAvatar.value = true

  try {
    await auth.updateAvatar(file)
    ui.notify('Votre photo a été mise à jour.', 'success')
  } catch (caught) {
    ui.notify(caught instanceof ApiError ? caught.message : 'Envoi impossible.', 'error')
  } finally {
    isUploadingAvatar.value = false
    // Lets the same file be re-picked after a failure.
    if (avatarInput.value) avatarInput.value.value = ''
  }
}

onMounted(async () => {
  // Refetches so the form shows what the server holds, not a stale copy from
  // localStorage written at login.
  await auth.fetchProfile()
  hydrate()
})
</script>

<template>
  <div class="profile">
    <header class="profile__header">
      <h1 class="t-headline-xl">Mon profil</h1>
      <p class="profile__lead t-body-lg">
        Vos informations personnelles et les paramètres de votre compte.
      </p>
    </header>

    <!-- Identity -->
    <BaseCard class="panel">
      <div class="identity">
        <BaseAvatar :name="auth.displayName" :src="user?.image || undefined" :size="72" />

        <div class="identity__body">
          <p class="identity__name t-headline-md">{{ auth.displayName || 'Mon compte' }}</p>
          <p class="identity__email">{{ user?.email }}</p>

          <BaseButton
            variant="outline"
            size="sm"
            :loading="isUploadingAvatar"
            @click="avatarInput?.click()"
          >
            Changer la photo
          </BaseButton>

          <input
            ref="avatarInput"
            class="visually-hidden"
            type="file"
            accept="image/*"
            @change="uploadAvatar"
          />
        </div>
      </div>
    </BaseCard>

    <!-- Personal details -->
    <BaseCard class="panel">
      <h2 class="t-headline-md">Informations personnelles</h2>

      <BaseAlert
        v-if="detailsError && !detailsError.isValidationError"
        variant="error"
        title="Mise à jour impossible"
      >
        {{ detailsError.message }}
      </BaseAlert>

      <form class="form" novalidate @submit.prevent="saveDetails">
        <div class="form__row">
          <BaseInput
            v-model="details.first_name"
            label="Prénom"
            required
            :error="detailsFieldError('first_name')"
          />
          <BaseInput
            v-model="details.last_name"
            label="Nom"
            required
            :error="detailsFieldError('last_name')"
          />
        </div>

        <BaseInput
          v-model="details.email"
          label="Adresse e-mail"
          type="email"
          autocomplete="email"
          :error="detailsFieldError('email')"
        />

        <BaseInput
          v-model="details.phone"
          label="Téléphone"
          type="tel"
          autocomplete="tel"
          :error="detailsFieldError('phone')"
        />

        <BaseInput
          v-model="details.address"
          label="Adresse (facultatif)"
          :error="detailsFieldError('address')"
        />

        <BaseButton type="submit" :loading="isSavingDetails">Enregistrer</BaseButton>
      </form>
    </BaseCard>

    <!-- Password -->
    <BaseCard class="panel">
      <h2 class="t-headline-md">Mot de passe</h2>

      <BaseAlert
        v-if="passwordError && !passwordError.isValidationError"
        variant="error"
        title="Modification impossible"
      >
        {{ passwordError.message }}
      </BaseAlert>

      <form class="form" novalidate @submit.prevent="savePassword">
        <BaseInput
          v-model="passwords.password"
          label="Nouveau mot de passe"
          type="password"
          autocomplete="new-password"
          required
          :error="passwordFieldError('password')"
        />

        <BaseInput
          v-model="passwords.password_confirmation"
          label="Confirmer le mot de passe"
          type="password"
          autocomplete="new-password"
          required
          :error="passwordFieldError('password_confirmation')"
        />

        <BaseButton type="submit" variant="outline" :loading="isSavingPassword">
          Modifier le mot de passe
        </BaseButton>
      </form>
    </BaseCard>
  </div>
</template>

<style scoped>
.profile {
  display: grid;
  gap: var(--space-gutter);
}

.profile__header {
  margin-block-end: var(--space-2);
}

.profile__lead {
  margin-block-start: var(--space-2);
  color: var(--color-on-surface-variant);
}

.panel {
  display: grid;
  gap: var(--space-gutter);
  max-width: 44rem;
}

.identity {
  display: flex;
  gap: var(--space-gutter);
  align-items: center;
}

.identity__body {
  display: grid;
  gap: var(--space-2);
  justify-items: start;
}

.identity__email {
  color: var(--color-on-surface-variant);
}

.form {
  display: grid;
  gap: var(--space-gutter);
  justify-items: start;
}

.form > * {
  width: 100%;
}

.form button {
  width: auto;
}

.form__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-gutter);
}

@media (width >= 640px) {
  .form__row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
