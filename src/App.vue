<script setup lang="ts">
import { RouterView } from 'vue-router'

import { ToastHost } from '@/components/ui'

/**
 * Application root.
 *
 * It renders almost nothing itself: layouts are route components, so the chrome
 * a page gets is decided by the route table rather than by conditions here. The
 * toast host is the exception — it must outlive every navigation.
 */
</script>

<template>
  <a class="skip-link" href="#main-content">Aller au contenu principal</a>

  <RouterView />

  <ToastHost />
</template>
