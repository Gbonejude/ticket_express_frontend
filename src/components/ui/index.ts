/**
 * Design system — barrel.
 *
 * These components are the vocabulary of the interface: a page composes them,
 * it does not restyle them. If a screen needs a look none of them provides, the
 * fix is a new variant here, not a local override.
 *
 * Anything domain-specific (an event card, a ticket) lives in
 * `src/components/event/`, `src/components/account/` and so on, and is built
 * on top of these.
 */

export { default as BaseAlert } from './BaseAlert.vue'
export { default as BaseAvatar } from './BaseAvatar.vue'
export { default as BaseBadge } from './BaseBadge.vue'
export { default as BaseBreadcrumb } from './BaseBreadcrumb.vue'
export { default as BaseButton } from './BaseButton.vue'
export { default as BaseCard } from './BaseCard.vue'
export { default as BaseCheckbox } from './BaseCheckbox.vue'
export { default as BaseDrawer } from './BaseDrawer.vue'
export { default as BaseEmptyState } from './BaseEmptyState.vue'
export { default as BaseIcon } from './BaseIcon.vue'
export { default as BaseInput } from './BaseInput.vue'
export { default as BaseModal } from './BaseModal.vue'
export { default as BasePagination } from './BasePagination.vue'
export { default as BaseQuantityStepper } from './BaseQuantityStepper.vue'
export { default as BaseRadio } from './BaseRadio.vue'
export { default as BaseSelect } from './BaseSelect.vue'
export { default as BaseSkeleton } from './BaseSkeleton.vue'
export { default as BaseSpinner } from './BaseSpinner.vue'
export { default as BaseTabs } from './BaseTabs.vue'
export { default as SectionHeading } from './SectionHeading.vue'
export { default as ToastHost } from './ToastHost.vue'

export type { IconName } from './icons'
export type { Crumb, SelectOption, TabItem } from './types'
