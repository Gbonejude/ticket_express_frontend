<script setup lang="ts">
import { RouterView } from 'vue-router'

/**
 * Application root.
 *
 * It renders almost nothing itself: layouts are route components, so the chrome
 * a page gets is decided by the route table rather than by conditions here.
 * Toasts are not rendered here either — SweetAlert2 appends them to `body`, so
 * they already outlive every navigation.
 */
</script>

<template>
  <a class="skip-link" href="#main-content">Aller au contenu principal</a>

  <RouterView />
</template>
