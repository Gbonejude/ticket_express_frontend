<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { BaseAlert, BaseButton, BaseIcon } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import type { ApiError } from '@/api'

/**
 * Sign-in — Stitch screen « Connexion (Style Tikerama) ».
 *
 * The fields use a floating label rather than a placeholder: a placeholder
 * disappears as soon as the visitor types, which leaves a filled form with no
 * indication of what each box holds.
 */
const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const isPasswordVisible = ref(false)
const error = ref<string | null>(null)
const fieldErrors = ref<Record<string, string[]>>({})

const isSubmitting = computed(() => auth.isLoading)

async function submit(): Promise<void> {
  error.value = null
  fieldErrors.value = {}

  try {
    await auth.login({ email: email.value, password: password.value })
    ui.notify('Content de vous revoir !', 'success')

    // Honour the destination the guard stored before redirecting here.
    const redirect = route.query.redirect

    await router.push(typeof redirect === 'string' ? redirect : { name: 'home' })
  } catch (caught) {
    const apiError = caught as ApiError

    if (apiError.isValidationError) fieldErrors.value = apiError.errors ?? {}
    else error.value = apiError.message
  }
}
</script>

<template>
  <div class="login">
    <div class="login__card">
      <header class="login__intro">
        <h1 class="t-headline-lg">Bon retour !</h1>
        <p class="login__subtitle t-body-md">
          Connectez-vous pour accéder à vos billets et événements.
        </p>
      </header>

      <BaseAlert v-if="error" class="login__error" variant="error">{{ error }}</BaseAlert>

      <form class="login__form" @submit.prevent="submit">
        <div class="field">
          <input
            id="email"
            v-model="email"
            class="field__input"
            :class="{ 'field__input--invalid': fieldErrors.email }"
            type="email"
            name="email"
            placeholder=" "
            autocomplete="email"
            required
            :aria-invalid="fieldErrors.email ? true : undefined"
            aria-describedby="email-error"
          />
          <label class="field__label" for="email">Adresse e-mail</label>
          <p v-if="fieldErrors.email" id="email-error" class="field__error" role="alert">
            {{ fieldErrors.email[0] }}
          </p>
        </div>

        <div class="field">
          <input
            id="password"
            v-model="password"
            class="field__input field__input--with-action"
            :class="{ 'field__input--invalid': fieldErrors.password }"
            :type="isPasswordVisible ? 'text' : 'password'"
            name="password"
            placeholder=" "
            autocomplete="current-password"
            required
            :aria-invalid="fieldErrors.password ? true : undefined"
            aria-describedby="password-error"
          />
          <label class="field__label" for="password">Mot de passe</label>

          <button
            class="field__action"
            type="button"
            :aria-label="isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
            :aria-pressed="isPasswordVisible"
            @click="isPasswordVisible = !isPasswordVisible"
          >
            <BaseIcon :name="isPasswordVisible ? 'visibility' : 'lock'" :size="22" />
          </button>

          <p v-if="fieldErrors.password" id="password-error" class="field__error" role="alert">
            {{ fieldErrors.password[0] }}
          </p>
        </div>

        <div class="login__forgot">
          <a href="#mot-de-passe-oublie">Mot de passe oublié ?</a>
        </div>

        <BaseButton
          class="login__submit"
          type="submit"
          block
          size="lg"
          :loading="isSubmitting"
          icon-end="keyboard_double_arrow_right"
        >
          Se connecter
        </BaseButton>
      </form>

      <p class="login__footer t-body-md">
        Nouveau ici&nbsp;?
        <RouterLink :to="{ name: 'register' }">S'inscrire</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: var(--space-4);
}

.login__card {
  width: 100%;
  max-width: 27.5rem;
  padding: var(--space-6);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.login__intro {
  margin-block-end: var(--space-10);
  text-align: center;
}

.login__subtitle {
  margin-block-start: var(--space-2);
  color: var(--color-secondary);
}

.login__error {
  margin-block-end: var(--space-6);
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* --- Floating-label field --- */
.field {
  position: relative;
}

.field__input {
  width: 100%;
  padding: var(--space-4);
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

.field__input--invalid {
  border-color: var(--color-error);
}

.field__label {
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  color: var(--color-secondary);
  font-size: var(--text-body-md);
  pointer-events: none;
  transition:
    transform var(--transition-fast),
    font-size var(--transition-fast),
    color var(--transition-fast);
}

/* Lifts once the field has focus or content — `placeholder=" "` is what makes
   `:not(:placeholder-shown)` a reliable "has content" test. */
.field__input:focus + .field__label,
.field__input:not(:placeholder-shown) + .field__label {
  color: var(--color-on-surface);
  font-size: var(--text-body-sm);
  transform: translateY(-1.75rem);
}

.field__action {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  display: flex;
  color: var(--color-secondary);
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

.login__forgot {
  display: flex;
  justify-content: flex-end;
  margin-block-start: calc(var(--space-6) * -1 + var(--space-2));
}

.login__forgot a {
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.login__forgot a:hover {
  text-decoration: underline;
}

.login__submit {
  font-size: var(--text-headline-md);
  box-shadow: var(--shadow-lg);
}

.login__footer {
  margin-block-start: var(--space-8);
  color: var(--color-secondary);
  text-align: center;
}

.login__footer a {
  margin-inline-start: var(--space-1);
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.login__footer a:hover {
  text-decoration: underline;
}
@media (width >= 480px) {
  .login {
    padding: var(--space-gutter);
  }

  .login__card {
    padding: var(--space-8);
  }
}
</style>
