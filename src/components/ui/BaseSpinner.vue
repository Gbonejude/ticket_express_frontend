<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
    /** Announced to screen readers while the spinner is on screen. */
    label?: string
  }>(),
  { size: 20, label: 'Chargement en cours' },
)
</script>

<template>
  <span class="spinner" role="status" :style="{ '--spinner-size': `${size}px` }">
    <span class="visually-hidden">{{ label }}</span>
  </span>
</template>

<style scoped>
.spinner {
  display: inline-block;
  width: var(--spinner-size);
  height: var(--spinner-size);
  border: 2px solid currentcolor;
  border-top-color: transparent;
  border-radius: var(--radius-full);
  animation: spin 700ms linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
