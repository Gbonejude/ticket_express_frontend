<script setup lang="ts">
import { RouterView } from 'vue-router'

import TheFooter from '@/components/layout/TheFooter.vue'
import TheHeader from '@/components/layout/TheHeader.vue'

/** Layout of the public site: header, page content, footer. */
</script>

<template>
  <div class="layout">
    <TheHeader />

    <main id="main-content" class="layout__main">
      <RouterView />
    </main>

    <TheFooter />
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.layout__main {
  flex: 1;
}
</style>
