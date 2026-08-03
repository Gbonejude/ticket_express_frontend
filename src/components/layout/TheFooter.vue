<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { BaseIcon } from '@/components/ui'
import { APP_CONFIG } from '@/constants/app'
import { FOOTER_COLUMNS } from '@/constants/navigation'

/**
 * Site footer.
 *
 * The mobile mockups end on the tab bar and show no footer, so this block is
 * hidden below `md` — a footer stacked above a fixed tab bar would just be dead
 * scroll. From `md` up, where the tab bar disappears, it carries the secondary
 * links the header no longer has room for.
 */
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer__top">
        <div class="footer__brand-block">
          <RouterLink :to="{ name: 'home' }" class="footer__brand">
            {{ APP_CONFIG.name }}
          </RouterLink>
          <p class="footer__tagline t-body-md">
            Découvrez, réservez et vivez les meilleurs concerts, festivals et spectacles au Togo.
          </p>
        </div>

        <div class="footer__columns">
          <nav v-for="column in FOOTER_COLUMNS" :key="column.title" :aria-label="column.title">
            <h2 class="footer__heading">{{ column.title }}</h2>
            <ul class="footer__links">
              <li v-for="link in column.links" :key="link.label">
                <RouterLink v-if="link.to" class="footer__link" :to="link.to">
                  {{ link.label }}
                </RouterLink>
                <a v-else class="footer__link" :href="link.href">{{ link.label }}</a>
              </li>
            </ul>
          </nav>

          <div>
            <h2 class="footer__heading">Contact</h2>
            <ul class="footer__links">
              <li>
                <a class="footer__link footer__link--icon" href="mailto:support@ticketexpress.com">
                  <BaseIcon name="mail" :size="18" />
                  support@ticketexpress.com
                </a>
              </li>
              <li>
                <a class="footer__link footer__link--icon" href="#aide">
                  <BaseIcon name="help" :size="18" />
                  Centre d’aide
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <p class="footer__bottom t-body-sm">
        © {{ year }} {{ APP_CONFIG.name }}. Tous droits réservés.
      </p>
    </div>
  </footer>
</template>

<style scoped>
/* Shown at every width. It was hidden below md because the mockup only draws
   a tab bar there, but a site with no legal links, no support link and no
   contact e-mail on a phone is a site missing them where most visits happen. */
.footer {
  margin-block-start: auto;
  padding-block: var(--space-10);
  background-color: var(--color-surface-container-low);
  border-block-start: 1px solid var(--color-surface-variant);
}

.footer__top {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin-block-end: var(--space-8);
}

.footer__brand-block {
  max-width: 20rem;
}

.footer__brand {
  display: block;
  margin-block-end: var(--space-3);
  color: var(--color-primary);
  font-size: var(--text-headline-lg);
  font-weight: 700;
  letter-spacing: var(--tracking-headline);
}

.footer__tagline {
  color: var(--color-secondary);
}

/* One column per screenful on a phone, two as soon as there is room: the
   `auto-fit` track was collapsing to 11 rem columns on a 320 px screen and
   breaking the tagline into four-word lines. */
.footer__columns {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-6);
}

.footer__heading {
  margin-block-end: var(--space-4);
  color: var(--color-on-surface);
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.footer__links {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.footer__link {
  color: var(--color-secondary);
  font-size: var(--text-body-md);
  transition: color var(--transition-fast);
}

.footer__link:hover {
  color: var(--color-primary);
}

.footer__link--icon {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  overflow-wrap: anywhere;
}

.footer__bottom {
  padding-block-start: var(--space-6);
  color: var(--color-secondary);
  border-block-start: 1px solid var(--color-surface-variant);
}

@media (width >= 768px) {
  .footer__top {
    flex-direction: row;
    gap: var(--space-12);
    justify-content: space-between;
  }

  .footer__columns {
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    gap: var(--space-8);
  }
}
</style>
