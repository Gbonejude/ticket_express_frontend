<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import type { ApiError } from '@/api'
import { BaseAlert, BaseButton, BaseIcon } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import type { FieldErrors } from '@/utils'
import { minLength, required, validate, email as validateEmail } from '@/utils'

/**
 * Sign-up — Stitch screen « Inscription (Style Tikerama) ».
 *
 * First and last name are two separate fields rather than the mockup's single
 * "Nom complet": the API takes `first_name` and `last_name`, and splitting one
 * box on whitespace guesses wrong on compound names — « Jean Paul Kouassi »
 * has no single correct reading.
 *
 * A phone field the mockup does not show is added because `register/client`
 * requires it; leaving it out would only surface as a 422 after submitting.
 *
 * Les champs sont vérifiés ici plutôt que par l'attribut `required` : la bulle
 * native n'est pas dans la langue du site, s'efface au premier clic et empêche
 * de marquer le champ fautif — sur un formulaire de six champs, c'est la seule
 * indication de ce qui manque. Le résultat prend la forme des erreurs de l'API,
 * si bien que les deux s'affichent par le même chemin.
 */
const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const acceptsTerms = ref(false)
const isPasswordVisible = ref(false)
const error = ref<string | null>(null)
const fieldErrors = ref<FieldErrors>({})

const isSubmitting = computed(() => auth.isLoading)

/** Vide l'erreur d'un champ dès qu'on le corrige. */
function clearError(field: string): void {
  if (fieldErrors.value[field]) {
    const { [field]: _removed, ...rest } = fieldErrors.value

    fieldErrors.value = rest
  }
}

async function submit(): Promise<void> {
  error.value = null

  // Le minimum de huit caractères est celui de l'API : le vérifier ici évite un
  // aller-retour pour un refus que l'on sait d'avance.
  fieldErrors.value = validate({
    first_name: () => required(firstName.value, 'Prénom'),
    last_name: () => required(lastName.value, 'Nom'),
    email: () => validateEmail(email.value, 'E-mail'),
    phone: () => required(phone.value, 'Téléphone'),
    password: () => minLength(password.value, 8, 'Mot de passe'),
  })

  if (Object.keys(fieldErrors.value).length > 0) return

  try {
    await auth.register({
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      email: email.value,
      phone: phone.value,
      password: password.value,
      password_confirmation: password.value,
    })

    ui.notify('Bienvenue ! Votre compte est créé.', 'success')
    await router.push({ name: 'home' })
  } catch (caught) {
    const apiError = caught as ApiError

    if (apiError.isValidationError) fieldErrors.value = apiError.errors ?? {}
    else error.value = apiError.message
  }
}
</script>

<template>
  <div class="signup">
    <header class="signup__intro">
      <h1 class="t-headline-lg">Créer un compte</h1>
      <p class="signup__subtitle t-body-md">Rejoignez la plus grande communauté d'événements.</p>
    </header>

    <div class="signup__card">
      <BaseAlert v-if="error" class="signup__error" variant="error">{{ error }}</BaseAlert>

      <form class="signup__form" novalidate @submit.prevent="submit">
        <div class="signup__names">
          <div class="field">
            <label class="field__label" for="firstname">Prénom</label>
            <div class="field__control">
              <BaseIcon class="field__icon" name="person" :size="20" />
              <input
                id="firstname"
                v-model="firstName"
                class="field__input"
                :class="{ 'field__input--invalid': fieldErrors.first_name }"
                type="text"
                placeholder="Jean"
                autocomplete="given-name"
                :aria-invalid="fieldErrors.first_name ? true : undefined"
                @input="clearError('first_name')"
              />
            </div>
            <p v-if="fieldErrors.first_name" class="field__error" role="alert">
              {{ fieldErrors.first_name[0] }}
            </p>
          </div>

          <div class="field">
            <label class="field__label" for="lastname">Nom</label>
            <div class="field__control">
              <BaseIcon class="field__icon" name="person" :size="20" />
              <input
                id="lastname"
                v-model="lastName"
                class="field__input"
                :class="{ 'field__input--invalid': fieldErrors.last_name }"
                type="text"
                placeholder="Dupont"
                autocomplete="family-name"
                :aria-invalid="fieldErrors.last_name ? true : undefined"
                @input="clearError('last_name')"
              />
            </div>
            <p v-if="fieldErrors.last_name" class="field__error" role="alert">
              {{ fieldErrors.last_name[0] }}
            </p>
          </div>
        </div>

        <div class="field">
          <label class="field__label" for="signup-email">E-mail</label>
          <div class="field__control">
            <BaseIcon class="field__icon" name="mail" :size="20" />
            <input
              id="signup-email"
              v-model="email"
              class="field__input"
              :class="{ 'field__input--invalid': fieldErrors.email }"
              type="email"
              placeholder="jean.dupont@exemple.com"
              autocomplete="email"
              :aria-invalid="fieldErrors.email ? true : undefined"
              @input="clearError('email')"
            />
          </div>
          <p v-if="fieldErrors.email" class="field__error" role="alert">
            {{ fieldErrors.email[0] }}
          </p>
        </div>

        <div class="field">
          <label class="field__label" for="signup-phone">Téléphone</label>
          <div class="field__control">
            <BaseIcon class="field__icon" name="call" :size="20" />
            <input
              id="signup-phone"
              v-model="phone"
              class="field__input"
              :class="{ 'field__input--invalid': fieldErrors.phone }"
              type="tel"
              placeholder="+228 90 12 34 56"
              autocomplete="tel"
              :aria-invalid="fieldErrors.phone ? true : undefined"
              @input="clearError('phone')"
            />
          </div>
          <p v-if="fieldErrors.phone" class="field__error" role="alert">
            {{ fieldErrors.phone[0] }}
          </p>
        </div>

        <div class="field">
          <label class="field__label" for="signup-password">Mot de passe</label>
          <div class="field__control">
            <BaseIcon class="field__icon" name="lock" :size="20" />
            <input
              id="signup-password"
              v-model="password"
              class="field__input field__input--with-action"
              :class="{ 'field__input--invalid': fieldErrors.password }"
              :type="isPasswordVisible ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="new-password"
              :aria-invalid="fieldErrors.password ? true : undefined"
              @input="clearError('password')"
            />
            <button
              class="field__action"
              type="button"
              :aria-label="
                isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
              "
              :aria-pressed="isPasswordVisible"
              @click="isPasswordVisible = !isPasswordVisible"
            >
              <BaseIcon :name="isPasswordVisible ? 'visibility' : 'lock'" :size="20" />
            </button>
          </div>
          <p v-if="fieldErrors.password" class="field__error" role="alert">
            {{ fieldErrors.password[0] }}
          </p>
        </div>

        <label class="signup__terms">
          <!-- Pas de `required` : le bouton d'envoi est déjà désactivé tant que
               la case n'est pas cochée, et la contrainte native ne pourrait donc
               jamais se déclencher. -->
          <input v-model="acceptsTerms" type="checkbox" />
          <span>
            J'accepte les <a href="#cgv">Conditions générales de vente</a> et la
            <a href="#confidentialite">Politique de confidentialité</a>.
          </span>
        </label>

        <BaseButton
          class="signup__submit"
          type="submit"
          block
          size="lg"
          :disabled="!acceptsTerms"
          :loading="isSubmitting"
          icon-end="keyboard_double_arrow_right"
        >
          S'inscrire
        </BaseButton>
      </form>

      <p class="signup__footer t-body-md">
        Déjà un compte&nbsp;?
        <RouterLink :to="{ name: 'login' }">Se connecter</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.signup {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: var(--space-10) var(--space-4);
}

.signup__intro {
  margin-block-end: var(--space-8);
  text-align: center;
}

.signup__subtitle {
  margin-block-start: var(--space-2);
  color: var(--color-secondary);
}

.signup__card {
  width: 100%;
  max-width: 30rem;
  padding: var(--space-6);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid color-mix(in srgb, var(--color-outline-variant) 30%, transparent);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.signup__error {
  margin-block-end: var(--space-6);
}

.signup__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* --- Fields --- */
.signup__names {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.field__label {
  color: var(--color-secondary);
  font-size: var(--text-label-bold);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.field__control {
  position: relative;
  display: flex;
  align-items: center;
}

.field__icon {
  position: absolute;
  left: var(--space-3);
  color: var(--color-secondary);
  pointer-events: none;
}

.field__input {
  width: 100%;
  padding: var(--space-3) var(--space-4) var(--space-3) var(--space-10);
  font-size: var(--text-body-md);
  background-color: var(--color-surface-container-low);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast);
}

.field__input--with-action {
  padding-inline-end: var(--space-12);
}

.field__input:focus {
  background-color: var(--color-surface-container-lowest);
  border-color: var(--color-focus);
  outline: none;
  box-shadow: 0 0 0 1px var(--color-focus);
}

/* Le champ fautif est cerné de rouge. Déclaré après `:focus` pour le couvrir :
   le champ que l'on vient de corriger garde son cadre rouge tant que la saisie
   ne l'a pas effacé, et le voir passer au bleu du focus laisserait croire que
   c'est réglé. */
.field__input--invalid,
.field__input--invalid:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 1px var(--color-error);
}

.field__action {
  position: absolute;
  right: var(--space-3);
  display: flex;
  color: var(--color-secondary);
  transition: color var(--transition-fast);
}

.field__action:hover {
  color: var(--color-on-surface);
}

.field__error {
  color: var(--color-error);
  font-size: var(--text-body-sm);
}

/* --- Terms --- */
.signup__terms {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
  cursor: pointer;
}

.signup__terms input {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-block-start: 0.125rem;
  accent-color: var(--color-primary);
}

.signup__terms a {
  font-weight: 600;
}

.signup__terms a:hover {
  text-decoration: underline;
}

.signup__submit {
  font-size: var(--text-headline-md);
  box-shadow: var(--shadow-lg);
}

.signup__footer {
  margin-block-start: var(--space-8);
  color: var(--color-secondary);
  text-align: center;
}

.signup__footer a {
  font-weight: 700;
}

.signup__footer a:hover {
  text-decoration: underline;
}

@media (width >= 480px) {
  .signup__names {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (width >= 480px) {
  .signup {
    padding: var(--space-gutter);
  }

  .signup__card {
    padding: var(--space-8);
  }
}
</style>
