<script setup lang="ts">
/**
 * The white surface every block of content sits on.
 *
 * The mockups use exactly one card treatment — white fill, hairline border,
 * medium radius — and vary only the padding and whether it lifts on hover.
 * Keeping that in one component is what stops six near-identical card styles
 * from appearing across the pages.
 */
withDefaults(
  defineProps<{
    /** `flat` for static blocks, `raised` for anything clickable. */
    elevation?: 'flat' | 'raised'
    padding?: 'none' | 'sm' | 'md' | 'lg'
    radius?: 'md' | 'lg' | 'xl'
    /** Renders as `<article>`; use for a card that stands on its own. */
    as?: 'div' | 'article' | 'section' | 'li'
  }>(),
  { elevation: 'flat', padding: 'md', radius: 'md', as: 'div' },
)
</script>

<template>
  <component
    :is="as"
    class="card"
    :class="[`card--${elevation}`, `card--pad-${padding}`, `card--radius-${radius}`]"
  >
    <slot />
  </component>
</template>

<style scoped>
.card {
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  transition:
    box-shadow var(--transition-base),
    border-color var(--transition-base),
    transform var(--transition-base);
}

.card--radius-md {
  border-radius: var(--radius-md);
}

.card--radius-lg {
  border-radius: var(--radius-lg);
}

.card--radius-xl {
  border-radius: var(--radius-xl);
}

.card--pad-none {
  padding: 0;
}

.card--pad-sm {
  padding: var(--space-4);
}

.card--pad-md {
  padding: var(--space-5);
}

.card--pad-lg {
  padding: var(--space-8);
}

.card--raised:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-lg);
}
</style>
