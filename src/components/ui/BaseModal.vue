<script setup lang="ts">
import { onBeforeUnmount, ref, useId, watch } from 'vue'

import BaseIcon from './BaseIcon.vue'

/**
 * Centred dialog rendered in a teleport, used for the digital ticket overlay
 * and any confirmation.
 *
 * What it takes care of, because every dialog needs it and no page should have
 * to re-implement it:
 *  - closes on Escape and on a click outside the panel;
 *  - moves focus into the dialog on open and back to the trigger on close;
 *  - keeps Tab inside the dialog while it is open;
 *  - locks body scroll so the page behind does not drift.
 */
const props = withDefaults(
  defineProps<{
    title?: string
    /** Hides the visible title but keeps an accessible name. */
    hideTitle?: boolean
    size?: 'sm' | 'md' | 'lg'
    /** Set to false for a dialog the user must answer. */
    dismissible?: boolean
  }>(),
  { title: undefined, size: 'md', dismissible: true },
)

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const titleId = useId()

let previouslyFocused: HTMLElement | null = null

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function close(): void {
  if (!props.dismissible) return

  open.value = false
  emit('close')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    close()

    return
  }

  if (event.key !== 'Tab' || !panel.value) return

  const targets = Array.from(panel.value.querySelectorAll<HTMLElement>(FOCUSABLE))

  if (targets.length === 0) {
    event.preventDefault()

    return
  }

  const first = targets[0]!
  const last = targets[targets.length - 1]!

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function releaseScroll(): void {
  document.body.style.removeProperty('overflow')
  document.removeEventListener('keydown', onKeydown)
}

watch(open, async (isOpen) => {
  if (isOpen) {
    previouslyFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeydown)

    // Wait for the panel to exist before reaching into it.
    await Promise.resolve()
    const target = panel.value?.querySelector<HTMLElement>(FOCUSABLE) ?? panel.value

    target?.focus()
  } else {
    releaseScroll()

    // The trigger may have gone with the dialog — a button inside a drawer that
    // closed at the same time. Focus would then fall to `<body>` and a keyboard
    // visitor would lose their place, so the main landmark takes over.
    if (previouslyFocused?.isConnected) previouslyFocused.focus()
    else document.getElementById('main-content')?.focus()

    previouslyFocused = null
  }
})

onBeforeUnmount(releaseScroll)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal" @mousedown.self="close">
        <div
          ref="panel"
          class="modal__panel"
          :class="`modal__panel--${size}`"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          tabindex="-1"
        >
          <header v-if="title || dismissible" class="modal__header">
            <h2
              v-if="title"
              :id="titleId"
              class="modal__title t-headline-md"
              :class="{ 'visually-hidden': hideTitle }"
            >
              {{ title }}
            </h2>

            <button
              v-if="dismissible"
              class="modal__close"
              type="button"
              aria-label="Fermer"
              @click="close"
            >
              <BaseIcon name="close" :size="22" />
            </button>
          </header>

          <div class="modal__body"><slot /></div>

          <footer v-if="$slots.footer" class="modal__footer"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: grid;
  place-items: center;
  padding: var(--space-4);
  overflow-y: auto;
  background-color: rgb(39 24 23 / 55%);
  backdrop-filter: blur(4px);
}

.modal__panel {
  width: 100%;
  max-height: calc(100vh - var(--space-8));
  overflow-y: auto;
  background-color: var(--color-surface-container-lowest);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
}

.modal__panel--sm {
  max-width: 24rem;
}

.modal__panel--md {
  max-width: 32rem;
}

.modal__panel--lg {
  max-width: 48rem;
}

.modal__header {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-5) 0;
}

.modal__title {
  color: var(--color-on-surface);
}

.modal__close {
  display: flex;
  margin-inline-start: auto;
  color: var(--color-on-surface-variant);
  transition: color var(--transition-fast);
}

.modal__close:hover {
  color: var(--color-primary);
}

.modal__body {
  padding: var(--space-5);
}

.modal__footer {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding: 0 var(--space-5) var(--space-5);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-base);
}

.modal-enter-active .modal__panel,
.modal-leave-active .modal__panel {
  transition: transform var(--transition-base);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal__panel,
.modal-leave-to .modal__panel {
  transform: scale(0.96) translateY(8px);
}
</style>
