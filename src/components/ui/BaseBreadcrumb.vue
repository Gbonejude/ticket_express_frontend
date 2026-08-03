<script setup lang="ts">
import { RouterLink } from 'vue-router'

import type { Crumb } from './types'

defineProps<{ items: Crumb[] }>()
</script>

<template>
  <nav class="breadcrumb" aria-label="Fil d'Ariane">
    <ol class="breadcrumb__list">
      <li v-for="(item, index) in items" :key="item.label" class="breadcrumb__item t-label">
        <RouterLink v-if="item.to" class="breadcrumb__link" :to="item.to">
          {{ item.label }}
        </RouterLink>
        <span v-else aria-current="page">{{ item.label }}</span>

        <span v-if="index < items.length - 1" class="breadcrumb__separator" aria-hidden="true">
          /
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumb__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.breadcrumb__item {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
}

.breadcrumb__link {
  color: var(--color-on-surface-variant);
  transition: color var(--transition-fast);
}

.breadcrumb__link:hover {
  color: var(--color-primary);
}

.breadcrumb__separator {
  color: var(--color-outline-variant);
}

.breadcrumb__item:last-child {
  color: var(--color-primary);
}
</style>
