<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

import BaseIcon from './BaseIcon.vue'

/**
 * Panel sliding in from the side. Used for the mobile navigation and for the
 * filter panel on the explore page below the tablet breakpoint.
 *
 * Same contract as `BaseModal` — Escape closes it, the backdrop closes it, body
 * scroll is locked — but it is anchored to an edge instead of being centred.
 */
const props = withDefaults(defineProps<{ title?: string; side?: 'left' | 'right' }>(), {
  title: undefined,
  side: 'left',
})

const open = defineModel<boolean>('open', { default: false })

function close(): void {
  open.value = false
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

function release(): void {
  document.body.style.removeProperty('overflow')
  document.removeEventListener('keydown', onKeydown)
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeydown)
  } else {
    release()
  }
})

onBeforeUnmount(release)

defineExpose({ close })
</script>

<template>
  <Teleport to="body">
    <Transition :name="`drawer-${props.side}`">
      <div v-if="open" class="drawer" @mousedown.self="close">
        <aside
          class="drawer__panel"
          :class="`drawer__panel--${side}`"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header class="drawer__header">
            <p v-if="title" class="drawer__title t-headline-md">{{ title }}</p>
            <button class="drawer__close" type="button" aria-label="Fermer" @click="close">
              <BaseIcon name="close" :size="22" />
            </button>
          </header>

          <div class="drawer__body"><slot :close="close" /></div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer {
  position: fixed;
  inset: 0;
  z-index: var(--z-drawer);
  background-color: rgb(39 24 23 / 45%);
}

.drawer__panel {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: min(20rem, 85vw);
  background-color: var(--color-surface-container-lowest);
  box-shadow: var(--shadow-xl);
}

.drawer__panel--left {
  left: 0;
}

.drawer__panel--right {
  right: 0;
}

.drawer__header {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-block-end: 1px solid var(--color-outline-variant);
}

.drawer__title {
  color: var(--color-on-surface);
}

.drawer__close {
  display: flex;
  margin-inline-start: auto;
  color: var(--color-on-surface-variant);
}

.drawer__body {
  flex: 1;
  padding: var(--space-5);
  overflow-y: auto;
}

.drawer-left-enter-active,
.drawer-left-leave-active,
.drawer-right-enter-active,
.drawer-right-leave-active {
  transition: opacity var(--transition-base);
}

.drawer-left-enter-active .drawer__panel,
.drawer-left-leave-active .drawer__panel,
.drawer-right-enter-active .drawer__panel,
.drawer-right-leave-active .drawer__panel {
  transition: transform var(--transition-base);
}

.drawer-left-enter-from,
.drawer-left-leave-to,
.drawer-right-enter-from,
.drawer-right-leave-to {
  opacity: 0;
}

.drawer-left-enter-from .drawer__panel,
.drawer-left-leave-to .drawer__panel {
  transform: translateX(-100%);
}

.drawer-right-enter-from .drawer__panel,
.drawer-right-leave-to .drawer__panel {
  transform: translateX(100%);
}
</style>
