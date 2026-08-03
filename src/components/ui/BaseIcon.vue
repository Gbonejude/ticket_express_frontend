<script setup lang="ts">
import { computed } from 'vue'

import { ICON_VIEW_BOX, icons, type IconName } from './icons'

/**
 * Renders one Material Symbols Outlined glyph as inline SVG.
 *
 * The mockups use the icon font; inlining the paths avoids a 320 kB download
 * and a flash of missing icons on first paint. See `icons.ts` for how to add
 * a glyph.
 *
 * Icons are decorative by default (`aria-hidden`). Pass `label` only when the
 * icon carries meaning on its own — an icon-only button, for instance.
 */
const props = withDefaults(
  defineProps<{
    name: IconName
    /** Rendered size in pixels; matches the surrounding font size by default. */
    size?: number | string
    /** Accessible name. Omit when adjacent text already says the same thing. */
    label?: string
  }>(),
  { size: undefined, label: undefined },
)

const path = computed(() => icons[props.name])

const dimension = computed(() =>
  props.size === undefined
    ? '1em'
    : typeof props.size === 'number'
      ? `${props.size}px`
      : props.size,
)
</script>

<template>
  <svg
    class="icon"
    :width="dimension"
    :height="dimension"
    :viewBox="ICON_VIEW_BOX"
    fill="currentColor"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : true"
    focusable="false"
  >
    <path :d="path" />
  </svg>
</template>

<style scoped>
.icon {
  flex-shrink: 0;
}
</style>
