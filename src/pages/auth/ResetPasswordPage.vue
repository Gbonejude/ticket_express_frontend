<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import type { ApiError } from '@/api'
import { BaseAlert, BaseButton, BaseIcon } from '@/components/ui'
import { authService } from '@/services'
import { useUiStore } from '@/stores/ui.store'
import type { FieldErrors } from '@/utils'
import { minLength, sameAs, validate } from '@/utils'

/**
 * Choix d'un nouveau mot de passe depuis le lien reçu par mail.
 *
 * Le jeton et l'adresse arrivent par la query string — c'est la forme que pose
 * `ResetPassword::createUrlUsing` côté API. Ils ne sont pas modifiables ici :
 * l'adresse est affichée en lecture seule, parce qu'un jeton est émis pour un
 * compte précis et qu'un champ éditable laissait croire qu'on pouvait réinitialiser
 * le mot de passe de quelqu'un d'autre avec le même lien.
 *
 * Un lien tronqué — ce que font certains clients mail sur les URL longues —
 * arrive ici sans jeton. On le dit tout de suite plutôt que de laisser remplir
 * un formulaire qui finira en 422.
 */
const route = useRoute()
const router = useRouter()
const ui = useUiStore()

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const email = computed(() => (typeof route.query.email === 'string' ? route.query.email : ''))
const isLinkComplete = computed(() => token.value !== '' && email.value !== '')

const password = ref('')
const passwordConfirmation = ref('')
const isPasswordVisible = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const fieldErrors = ref<FieldErrors>({})

/** Vide l'erreur d'un champ dès qu'on le corrige. */
function clearError(field: string): void {
  if (fieldErrors.value[field]) {
    const { [field]: _removed, ...rest } = fieldErrors.value

    fieldErrors.value = rest
  }
}

async function submit(): Promise<void> {
  error.value = null

  // La concordance est vérifiée ici et pas seulement par l'API : c'est la faute
  // la plus courante sur ce formulaire, et un aller-retour pour l'apprendre
  // efface les deux champs saisis.
  fieldErrors.value = validate({
    password: () => minLength(password.value, 8, 'Mot de passe'),
    password_confirmation: () =>
      sameAs(
        passwordConfirmation.value,
        password.value,
        'Les deux mots de passe ne correspondent pas.',
      ),
  })

  if (Object.keys(fieldErrors.value).length > 0) return

  isSubmitting.value = true

  try {
    await authService.resetPassword({
      email: email.value,
      token: token.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })

    // Toutes les sessions sont révoquées côté serveur : on renvoie vers la
    // connexion, il n'y a pas de session à reprendre ici.
    ui.notify('Mot de passe modifié. Connectez-vous avec le nouveau.', 'success')
    await router.push({ name: 'login' })
  } catch (caught) {
    const apiError = caught as ApiError

    if (apiError.isValidationError) fieldErrors.value = apiError.errors ?? {}
    else error.value = apiError.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="reset">
    <div class="reset__card">
      <header class="reset__intro">
        <h1 class="t-headline-lg">Nouveau mot de passe</h1>
        <p v-if="isLinkComplete" class="reset__subtitle t-body-md">
          Choisissez un mot de passe pour <strong>{{ email }}</strong
          >.
        </p>
      </header>

      <template v-if="!isLinkComplete">
        <BaseAlert variant="error">
          Ce lien est incomplet ou a été tronqué par votre client mail. Refaites une demande depuis
          « Mot de passe oublié ».
        </BaseAlert>

        <p class="reset__footer t-body-md">
          <RouterLink :to="{ name: 'forgot-password' }">Refaire une demande</RouterLink>
        </p>
      </template>

      <template v-else>
        <BaseAlert v-if="error" class="reset__error" variant="error">{{ error }}</BaseAlert>

        <form class="reset__form" novalidate @submit.prevent="submit">
          <div class="field">
            <div class="field__control">
              <input
                id="password"
                v-model="password"
                class="field__input field__input--with-action"
                :class="{ 'field__input--invalid': fieldErrors.password }"
                :type="isPasswordVisible ? 'text' : 'password'"
                name="password"
                placeholder=" "
                autocomplete="new-password"
                :aria-invalid="fieldErrors.password ? true : undefined"
                aria-describedby="password-error password-hint"
                @input="clearError('password')"
              />
              <label class="field__label" for="password">Nouveau mot de passe</label>

              <button
                class="field__action"
                type="button"
                :aria-label="
                  isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                "
                :aria-pressed="isPasswordVisible"
                @click="isPasswordVisible = !isPasswordVisible"
              >
                <BaseIcon :name="isPasswordVisible ? 'visibility' : 'lock'" :size="22" />
              </button>
            </div>

            <p v-if="fieldErrors.password" id="password-error" class="field__error" role="alert">
              {{ fieldErrors.password[0] }}
            </p>
            <!-- Les règles sont annoncées avant la saisie : l'API les vérifie
                 toutes, et les découvrir une par une au refus est pénible. -->
            <p v-else id="password-hint" class="field__hint">
              8 caractères minimum, avec au moins une minuscule, une majuscule et un chiffre.
            </p>
          </div>

          <div class="field">
            <div class="field__control">
              <input
                id="password-confirmation"
                v-model="passwordConfirmation"
                class="field__input"
                :class="{ 'field__input--invalid': fieldErrors.password_confirmation }"
                type="password"
                name="password_confirmation"
                placeholder=" "
                autocomplete="new-password"
                :aria-invalid="fieldErrors.password_confirmation ? true : undefined"
                aria-describedby="password-confirmation-error"
                @input="clearError('password_confirmation')"
              />
              <label class="field__label" for="password-confirmation">
                Confirmer le mot de passe
              </label>
            </div>

            <p
              v-if="fieldErrors.password_confirmation"
              id="password-confirmation-error"
              class="field__error"
              role="alert"
            >
              {{ fieldErrors.password_confirmation[0] }}
            </p>
          </div>

          <BaseButton
            class="reset__submit"
            type="submit"
            block
            size="lg"
            :loading="isSubmitting"
            icon-end="keyboard_double_arrow_right"
          >
            Enregistrer
          </BaseButton>
        </form>

        <p class="reset__footer t-body-md">
          <RouterLink :to="{ name: 'login' }">Retour à la connexion</RouterLink>
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.reset {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: var(--space-4);
}

.reset__card {
  width: 100%;
  max-width: 27.5rem;
  padding: var(--space-6);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.reset__intro {
  margin-block-end: var(--space-8);
  text-align: center;
}

.reset__subtitle {
  margin-block-start: var(--space-2);
  color: var(--color-secondary);
  overflow-wrap: anywhere;
}

.reset__error {
  margin-block-end: var(--space-6);
}

.reset__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* --- Floating-label field ---
   Même construction que l'écran de connexion. */
.field__control {
  position: relative;
}

.field__input {
  width: 100%;
  padding: var(--space-6) var(--space-4) var(--space-2);
  font-size: var(--text-body-lg);
  background-color: var(--color-surface-container-low);
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.field__input--with-action {
  padding-inline-end: var(--space-12);
}

.field__input:focus {
  border-color: var(--color-focus);
  outline: none;
  box-shadow: 0 0 0 1px var(--color-focus);
}

/* Déclaré après `:focus` pour le couvrir : le champ garde son cadre rouge tant
   que la saisie ne l'a pas effacé, et le voir passer au bleu du focus laisserait
   croire que c'est réglé. */
.field__input--invalid,
.field__input--invalid:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 1px var(--color-error);
}

.field__label {
  position: absolute;
  top: 50%;
  left: calc(var(--space-4) + 1px);
  color: var(--color-secondary);
  font-size: var(--text-body-lg);
  line-height: var(--leading-flat);
  pointer-events: none;
  transform: translateY(-50%);
  transition:
    top var(--transition-fast),
    transform var(--transition-fast),
    font-size var(--transition-fast),
    color var(--transition-fast);
}

.field__input:focus + .field__label,
.field__input:not(:placeholder-shown) + .field__label {
  top: var(--space-2);
  color: var(--color-on-surface);
  font-size: var(--text-body-sm);
  transform: translateY(0);
}

.field__action {
  position: absolute;
  top: 50%;
  right: var(--space-4);
  display: flex;
  color: var(--color-secondary);
  transform: translateY(-50%);
  transition: color var(--transition-fast);
}

.field__action:hover {
  color: var(--color-on-surface);
}

.field__error {
  margin-block-start: var(--space-1);
  color: var(--color-error);
  font-size: var(--text-body-sm);
}

.field__hint {
  margin-block-start: var(--space-1);
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
}

.reset__submit {
  font-size: var(--text-headline-md);
  box-shadow: var(--shadow-lg);
}

.reset__footer {
  margin-block-start: var(--space-8);
  color: var(--color-secondary);
  text-align: center;
}

.reset__footer a {
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.reset__footer a:hover {
  text-decoration: underline;
}

@media (width >= 480px) {
  .reset {
    padding: var(--space-gutter);
  }

  .reset__card {
    padding: var(--space-8);
  }
}
</style>
