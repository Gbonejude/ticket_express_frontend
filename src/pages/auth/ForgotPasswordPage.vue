<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

import type { ApiError } from '@/api'
import { BaseAlert, BaseButton } from '@/components/ui'
import { authService } from '@/services'
import type { FieldErrors } from '@/utils'
import { validate, email as validateEmail } from '@/utils'

/**
 * Demande de réinitialisation du mot de passe.
 *
 * La page de connexion pointait sur `#mot-de-passe-oublie`, une ancre qui ne
 * menait nulle part : un visiteur qui avait oublié son mot de passe n'avait
 * aucun chemin de retour, alors que l'API expose la route depuis le début.
 *
 * Une seule réponse est affichée, qu'il existe un compte pour cette adresse ou
 * non — c'est déjà ce que fait l'API, qui répond « lien envoyé » dans les deux
 * cas. Dire « cette adresse est inconnue » transformerait le formulaire en
 * moyen de savoir qui est inscrit sur la plateforme.
 *
 * Le formulaire disparaît après l'envoi : le laisser invitait à recliquer, et
 * la route est limitée à trois requêtes par minute — le deuxième clic
 * répondait 429 alors que le mail était bien parti.
 */
const email = ref('')
const isSubmitting = ref(false)
const isSent = ref(false)
const error = ref<string | null>(null)
const fieldErrors = ref<FieldErrors>({})

/** Vide l'erreur du champ dès qu'on le corrige. */
function clearError(): void {
  fieldErrors.value = {}
}

async function submit(): Promise<void> {
  error.value = null

  // Vérifié ici plutôt que par l'attribut `required` : la route n'accepte que
  // trois requêtes par minute, et une adresse vide ou mal formée aurait consommé
  // un essai pour un refus qu'on connaissait d'avance.
  fieldErrors.value = validate({ email: () => validateEmail(email.value) })

  if (Object.keys(fieldErrors.value).length > 0) return

  isSubmitting.value = true

  try {
    await authService.forgotPassword(email.value)
    isSent.value = true
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
  <div class="forgot">
    <div class="forgot__card">
      <header class="forgot__intro">
        <h1 class="t-headline-lg">Mot de passe oublié&nbsp;?</h1>
        <p class="forgot__subtitle t-body-md">
          Indiquez l'adresse e-mail de votre compte : nous vous envoyons un lien pour choisir un
          nouveau mot de passe.
        </p>
      </header>

      <BaseAlert v-if="error" class="forgot__error" variant="error">{{ error }}</BaseAlert>

      <template v-if="isSent">
        <BaseAlert variant="success">
          Si un compte existe pour <strong>{{ email }}</strong
          >, le lien de réinitialisation vient d'être envoyé. Pensez à regarder vos spams.
        </BaseAlert>

        <p class="forgot__hint t-body-sm">
          Le lien est valable une heure. Passé ce délai, refaites une demande.
        </p>
      </template>

      <form v-else class="forgot__form" novalidate @submit.prevent="submit">
        <div class="field">
          <div class="field__control">
            <input
              id="email"
              v-model="email"
              class="field__input"
              :class="{ 'field__input--invalid': fieldErrors.email }"
              type="email"
              name="email"
              placeholder=" "
              autocomplete="email"
              :aria-invalid="fieldErrors.email ? true : undefined"
              aria-describedby="email-error"
              @input="clearError()"
            />
            <label class="field__label" for="email">Adresse e-mail</label>
          </div>
          <p v-if="fieldErrors.email" id="email-error" class="field__error" role="alert">
            {{ fieldErrors.email[0] }}
          </p>
        </div>

        <BaseButton
          class="forgot__submit"
          type="submit"
          block
          size="lg"
          :loading="isSubmitting"
          icon-end="send"
        >
          Envoyer le lien
        </BaseButton>
      </form>

      <p class="forgot__footer t-body-md">
        <RouterLink :to="{ name: 'login' }">Retour à la connexion</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.forgot {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: var(--space-4);
}

.forgot__card {
  width: 100%;
  max-width: 27.5rem;
  padding: var(--space-6);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.forgot__intro {
  margin-block-end: var(--space-8);
  text-align: center;
}

.forgot__subtitle {
  margin-block-start: var(--space-2);
  color: var(--color-secondary);
}

.forgot__error {
  margin-block-end: var(--space-6);
}

.forgot__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.forgot__hint {
  margin-block-start: var(--space-4);
  color: var(--color-secondary);
  text-align: center;
}

/* --- Floating-label field ---
   Même construction que l'écran de connexion : le libellé vit dans le cadre,
   centré tant que le champ est vide, et remonte dans le rembourrage haut dès
   qu'il porte du contenu. */
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

.field__error {
  margin-block-start: var(--space-1);
  color: var(--color-error);
  font-size: var(--text-body-sm);
}

.forgot__submit {
  font-size: var(--text-headline-md);
  box-shadow: var(--shadow-lg);
}

.forgot__footer {
  margin-block-start: var(--space-8);
  color: var(--color-secondary);
  text-align: center;
}

.forgot__footer a {
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.forgot__footer a:hover {
  text-decoration: underline;
}

@media (width >= 480px) {
  .forgot {
    padding: var(--space-gutter);
  }

  .forgot__card {
    padding: var(--space-8);
  }
}
</style>
