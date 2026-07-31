<script setup lang="ts">
import { APP_CONFIG } from '@/constants/app'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container footer__inner">
      <p>&copy; {{ year }} {{ APP_CONFIG.name }}. Tous droits réservés.</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-block-start: auto;
  background-color: var(--color-surface);
  border-block-start: 1px solid var(--color-border);
}

.footer__inner {
  padding-block: var(--space-8);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;
}
</style>
