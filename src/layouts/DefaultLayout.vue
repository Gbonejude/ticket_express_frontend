<script setup lang="ts">
import { RouterView } from 'vue-router'

import TheBottomNav from '@/components/layout/TheBottomNav.vue'
import TheFooter from '@/components/layout/TheFooter.vue'
import TheHeader from '@/components/layout/TheHeader.vue'

/**
 * Layout of the public site.
 *
 * The header is fixed and the tab bar is fixed, so the main region reserves
 * room for both with padding rather than margins — margins would collapse into
 * the first section and leave the hero under the bar.
 */
</script>

<template>
  <div class="layout">
    <TheHeader />

    <main id="main-content" tabindex="-1" class="layout__main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <TheFooter />
    <TheBottomNav />
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
  padding-block-start: var(--header-height);

  /* Clears the fixed tab bar; removed once it disappears at `md`. */
  padding-block-end: calc(var(--tabbar-height) + env(safe-area-inset-bottom));
}

@media (width >= 768px) {
  .layout__main {
    padding-block-end: 0;
  }
}
</style>
