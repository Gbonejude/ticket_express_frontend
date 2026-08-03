<script setup lang="ts">
import { useRouter } from 'vue-router'

import { BaseButton, BaseModal } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'

/**
 * Confirmation asked before signing out.
 *
 * Signing out is one click away in the header and in the account sidebar, and
 * an accidental one costs the visitor their session — including a basket in
 * progress. The dialog lives here rather than in each of those places so the
 * question, its wording and its behaviour stay identical everywhere.
 *
 * Confirming signs the visitor out and returns them to the home page. The
 * `/deconnexion` screen still exists and still works when opened directly —
 * a bookmark, an old link — but nothing in the UI routes through it any more:
 * a "you are signed out" page the visitor has to dismiss adds a step to an
 * action they just confirmed.
 */
const open = defineModel<boolean>('open', { default: false })

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

async function confirm(): Promise<void> {
  open.value = false

  // The revoke call is started but not awaited: it is a server-side courtesy,
  // and the visitor should not watch a spinner for it. The store clears the
  // local session in its own `finally`, so the header catches up on its own.
  const revoked = auth.logout()

  // Home first: the account pages are guarded, and signing out while standing
  // on one would bounce the visitor through the login screen.
  await router.push({ name: 'home' })
  ui.notify('Vous êtes déconnecté. À bientôt !', 'success')

  await revoked
}
</script>

<template>
  <BaseModal v-model:open="open" title="Se déconnecter" size="sm">
    <p class="confirm__text t-body-md">Voulez-vous vraiment vous déconnecter&nbsp;?</p>

    <template #footer>
      <div class="confirm__actions">
        <BaseButton variant="outline" @click="open = false">Annuler</BaseButton>
        <BaseButton variant="danger" icon-start="logout" @click="confirm"
          >Se déconnecter</BaseButton
        >
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm__text {
  color: var(--color-on-surface-variant);
  line-height: 1.6;
}

/* Side by side, and full width because the modal footer is
   `justify-content: flex-end` — without a width the block shrinks to its
   content and the buttons sit half-out of the card.

   The labels are short on purpose: the `sm` panel leaves 344 px of content,
   and "Non, rester connecté" / "Oui, me déconnecter" needed about 380 px, so
   they wrapped out of the card. `flex-wrap` is the safety net if a
   translation runs long. */
.confirm__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  justify-content: flex-end;
  width: 100%;
}
</style>
