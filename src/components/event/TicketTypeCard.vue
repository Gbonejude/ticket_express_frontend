<script setup lang="ts">
import { computed } from 'vue'

import { BaseIcon } from '@/components/ui'
import type { TicketType } from '@/types/event'
import { formatPrice } from '@/utils/format'

/**
 * One purchasable tier on the event page: name, price, availability badge and
 * a quantity stepper.
 *
 * Sold-out tiers stay on screen but lose their stepper — hiding them makes the
 * page look like the tier never existed, and the visitor keeps looking for it.
 *
 * The stepper is bounded by what is left in stock rather than being a free
 * number field, so the basket cannot hold more than the server will sell.
 */
const props = defineProps<{ ticketType: TicketType }>()

const quantity = defineModel<number>({ default: 0 })

const max = computed(() => Math.min(props.ticketType.remainingTickets, 10))

const badge = computed(() => {
  const { availabilityStatus, availabilityStatusLabel } = props.ticketType

  if (availabilityStatus === 'sold_out')
    return { tone: 'sold', icon: 'cancel' as const, label: 'Soldout' }
  if (availabilityStatus === 'almost_sold_out' || availabilityStatus === 'limited') {
    return { tone: 'limited', icon: 'schedule' as const, label: 'Places limitées' }
  }

  return { tone: 'open', icon: 'check_circle' as const, label: availabilityStatusLabel }
})

function step(delta: number): void {
  quantity.value = Math.min(max.value, Math.max(0, quantity.value + delta))
}
</script>

<template>
  <div class="ticket" :class="{ 'ticket--sold': !ticketType.isAvailableForPurchase }">
    <div class="ticket__head">
      <div>
        <span class="ticket__name">{{ ticketType.name }}</span>
        <p class="ticket__price t-price">{{ formatPrice(ticketType.currentPrice) }}</p>
      </div>

      <span class="ticket__badge" :class="`ticket__badge--${badge.tone}`">
        <BaseIcon :name="badge.icon" :size="14" />
        {{ badge.label }}
      </span>
    </div>

    <p v-if="ticketType.description" class="ticket__description">{{ ticketType.description }}</p>

    <p v-if="!ticketType.isAvailableForPurchase" class="ticket__sold-note">Soldout</p>

    <div v-else class="ticket__footer">
      <span class="ticket__hint">Sélectionnez la quantité</span>

      <div class="stepper">
        <button
          class="stepper__button"
          type="button"
          :disabled="quantity <= 0"
          :aria-label="`Retirer un billet ${ticketType.name}`"
          @click="step(-1)"
        >
          <BaseIcon name="remove" :size="16" />
        </button>

        <output class="stepper__value" :aria-label="`Quantité ${ticketType.name}`">
          {{ quantity }}
        </output>

        <button
          class="stepper__button"
          type="button"
          :disabled="quantity >= max"
          :aria-label="`Ajouter un billet ${ticketType.name}`"
          @click="step(1)"
        >
          <BaseIcon name="add" :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticket {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: var(--space-stack-md);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-lg);
}

.ticket--sold {
  background-color: var(--color-surface-container);
  opacity: 0.75;
}

.ticket__head {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  justify-content: space-between;
  margin-block-end: var(--space-4);
}

.ticket__name {
  color: var(--color-primary);
  font-size: var(--text-label-bold);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.ticket--sold .ticket__name {
  color: var(--color-secondary);
}

.ticket__price {
  margin-block-start: var(--space-1);
  color: var(--color-on-surface);
}

.ticket__badge {
  display: flex;
  flex-shrink: 0;
  gap: var(--space-1);
  align-items: center;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-label-bold);
  font-weight: 700;
  border-radius: var(--radius-sm);
}

.ticket__badge--sold {
  color: var(--color-on-secondary-container);
  background-color: var(--color-secondary-container);
}

.ticket__badge--limited {
  color: var(--color-on-tertiary-fixed-variant, var(--color-tertiary));
  background-color: var(--color-tertiary-fixed);
}

.ticket__badge--open {
  color: var(--color-success);
  background-color: var(--color-success-container);
}

.ticket__description {
  margin-block-end: var(--space-4);
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
  line-height: 1.5;
}

.ticket__sold-note {
  color: var(--color-primary);
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.ticket__footer {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
  margin-block-start: auto;
  padding-block-start: var(--space-6);
}

.ticket__hint {
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
}

.stepper {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-md);
}

.stepper__button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-3);
  color: var(--color-on-surface);
  background-color: var(--color-surface);
  transition: background-color var(--transition-fast);
}

.stepper__button:hover:not(:disabled) {
  background-color: var(--color-surface-variant);
}

.stepper__button:disabled {
  color: var(--color-surface-dim);
  cursor: not-allowed;
}

.stepper__value {
  min-width: 2.5rem;
  font-size: var(--text-label-bold);
  font-weight: 700;
  text-align: center;
}
</style>
