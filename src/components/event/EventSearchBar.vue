<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { BaseButton, BaseIcon, type SelectOption } from '@/components/ui'

/**
 * The three-field search of the hero: name, category, location.
 *
 * It is a real `<form>` so Enter submits from any field, and it navigates to
 * the explore page with the criteria in the query string — which makes a search
 * shareable and survivable across a reload, and leaves the results page as the
 * single owner of the filtering logic.
 */
const props = withDefaults(
  defineProps<{
    categories: SelectOption[]
    /** `glass` sits over the hero image; `solid` over a plain background. */
    appearance?: 'glass' | 'solid'
  }>(),
  { appearance: 'glass' },
)

const router = useRouter()

const search = ref('')
const category = ref('')
const location = ref('')

function submit(): void {
  router.push({
    name: 'events',
    query: {
      ...(search.value ? { recherche: search.value } : {}),
      ...(category.value ? { categorie: category.value } : {}),
      ...(location.value ? { lieu: location.value } : {}),
    },
  })
}
</script>

<template>
  <form
    class="search"
    :class="`search--${props.appearance}`"
    role="search"
    @submit.prevent="submit"
  >
    <div class="search__field">
      <BaseIcon class="search__icon" name="search" :size="20" />
      <label class="visually-hidden" for="search-name">Nom de l'événement</label>
      <input
        id="search-name"
        v-model="search"
        class="search__input"
        type="search"
        placeholder="Nom de l'événement"
      />
    </div>

    <div class="search__field">
      <BaseIcon class="search__icon" name="category" :size="20" />
      <label class="visually-hidden" for="search-category">Catégorie</label>
      <select id="search-category" v-model="category" class="search__input search__input--select">
        <option value="">Toutes catégories</option>
        <option v-for="option in categories" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <div class="search__field search__field--last">
      <BaseIcon class="search__icon" name="location_on" :size="20" />
      <label class="visually-hidden" for="search-location">Localisation</label>
      <input
        id="search-location"
        v-model="location"
        class="search__input"
        type="text"
        placeholder="Localisation"
      />
    </div>

    <BaseButton class="search__submit" type="submit" size="lg">Rechercher</BaseButton>
  </form>
</template>

<style scoped>
.search {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
}

.search--glass {
  background-color: rgb(255 255 255 / 80%);
  backdrop-filter: blur(12px);
}

.search--solid {
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
}

.search__field {
  position: relative;
  display: flex;
  flex: 1;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-2) var(--space-4);
  border-block-end: 1px solid rgb(227 190 189 / 40%);
}

.search__field--last {
  border-block-end: none;
}

.search__icon {
  color: var(--color-primary);
}

.search__input {
  width: 100%;
  min-width: 0;
  color: var(--color-on-surface);
  background: transparent;
  border: none;
}

.search__input:focus {
  outline: none;
}

.search__input::placeholder {
  color: var(--color-on-surface-variant);
  opacity: 0.6;
}

.search__input--select {
  cursor: pointer;
  appearance: none;
}

/* The bar's own focus ring: the inputs are borderless, so focus has to be
   visible on the field wrapper instead. */
.search__field:focus-within {
  border-radius: var(--radius-sm);
  box-shadow: 0 0 0 2px var(--color-focus);
}

@media (width >= 768px) {
  .search {
    flex-direction: row;
    align-items: stretch;
  }

  .search__field {
    border-block-end: none;
    border-inline-end: 1px solid rgb(227 190 189 / 40%);
  }

  .search__field--last {
    border-inline-end: none;
  }

  .search__submit {
    flex-shrink: 0;
  }
}
</style>
