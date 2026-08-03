<script setup lang="ts">
import { BaseBadge, BaseIcon } from '@/components/ui'
import type { TicketType } from '@/types/event'
import { formatPrice } from '@/utils/format'

/**
 * Radio list of the ticket types on sale.
 *
 * Sold-out types stay visible but disabled: hiding them makes the page look
 * like the event never had that tier, and the visitor keeps looking for it.
 */
defineProps<{ ticketTypes: TicketType[] }>()

const model = defineModel<string | null>({ default: null })
</script>

<template>
  <fieldset class="picker">
    <legend class="visually-hidden">Choix du billet</legend>

    <label
      v-for="type in ticketTypes"
      :key="type.id"
      class="picker__option"
      :class="{
        'picker__option--selected': model === type.id,
        'picker__option--disabled': !type.isAvailableForPurchase,
      }"
    >
      <input
        v-model="model"
        class="picker__input"
        type="radio"
        name="ticket-type"
        :value="type.id"
        :disabled="!type.isAvailableForPurchase"
      />

      <span class="picker__body">
        <span class="picker__header">
          <span class="picker__name t-headline-md">{{ type.name }}</span>
          <BaseBadge
            v-if="type.availabilityStatus !== 'available'"
            :variant="type.availabilityStatus === 'sold_out' ? 'neutral' : 'warning'"
            pill
          >
            {{ type.availabilityStatusLabel }}
          </BaseBadge>
        </span>

        <span v-if="type.description" class="picker__description">{{ type.description }}</span>

        <span v-if="type.benefits.length" class="picker__benefits">
          <span v-for="benefit in type.benefits" :key="benefit" class="picker__benefit t-label">
            <BaseIcon name="check" :size="14" />
            {{ benefit }}
          </span>
        </span>
      </span>

      <span class="picker__pricing">
        <s v-if="type.hasActivePromotion" class="picker__strike">{{ formatPrice(type.price) }}</s>
        <span class="picker__price t-price">
          {{ type.currentPrice === 0 ? 'Gratuit' : formatPrice(type.currentPrice) }}
        </span>
        <span v-if="type.hasActivePromotion" class="picker__discount t-label">
          −{{ type.discountPercentage }} %
        </span>
      </span>
    </label>
  </fieldset>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  border: none;
}

.picker__option {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  padding: var(--space-4);
  border: 2px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast);
}

.picker__option:hover:not(.picker__option--disabled) {
  border-color: var(--color-primary);
}

.picker__option--selected {
  border-color: var(--color-primary);
  background-color: color-mix(in srgb, var(--color-primary-fixed) 30%, transparent);
}

.picker__option--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.picker__input {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-block-start: 0.125rem;
  accent-color: var(--color-primary);
}

.picker__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.picker__header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.picker__name {
  color: var(--color-on-surface);
}

.picker__description {
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-sm);
  line-height: 1.5;
}

.picker__benefits {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  margin-block-start: var(--space-1);
}

.picker__benefit {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  color: var(--color-success);
  text-transform: uppercase;
}

.picker__pricing {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  align-items: flex-end;
  text-align: end;
}

.picker__strike {
  color: var(--color-outline);
  font-size: var(--text-body-sm);
}

.picker__price {
  color: var(--color-on-surface);
  white-space: nowrap;
}

.picker__discount {
  color: var(--color-primary);
  text-transform: uppercase;
}
</style>
