<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'
import { computed, ref } from 'vue'

import { BaseIcon } from '@/components/ui'
import { APP_CONFIG } from '@/constants/app'

/**
 * About — Stitch screen « À propos (Simplifié) ».
 *
 * Two alternating two-column bands (copy/photo, then photo/copy) around a
 * centred hero and a full-width vision card. The content is declared as data so
 * adding a pillar or a module is one line and the markup stays readable.
 */

const pillars: { title: string; body: string }[] = [
  {
    title: 'Acheter en trois minutes',
    body: 'Pas de compte obligatoire : vos nom, e-mail et numéro suffisent pour repartir avec votre billet.',
  },
  {
    title: 'Payer avec ce que vous avez déjà',
    body: 'Mixx by Yas et Moov Money, débités depuis votre téléphone. Ni carte bancaire, ni déplacement.',
  },
  {
    title: 'Recevoir où vous voulez',
    body: 'Votre billet arrive par e-mail, par WhatsApp, ou les deux — à vous de choisir au moment de payer.',
  },
]

const modules: { title: string; body: string }[] = [
  {
    title: 'Un billet, un QR code',
    body: 'Chaque billet porte un QR code unique, scanné une seule fois à l’entrée. Sur le téléphone ou imprimé, il fonctionne pareil — et sans réseau sur place.',
  },
  {
    title: 'Les événements en ligne aussi',
    body: 'Pour un événement à distance, le billet contient un lien d’accès personnel, actif à l’heure de début et utilisable depuis un seul appareil à la fois.',
  },
  {
    title: 'Vos billets restent accessibles',
    body: 'Avec un compte, vous retrouvez à tout moment vos billets, l’historique de vos achats et vos événements favoris, même si vous avez perdu l’e-mail.',
  },
]

/** Only the first module is open, as in the mockup. */
const openModule = ref(0)

function toggle(index: number): void {
  openModule.value = openModule.value === index ? -1 : index
}

const { y } = useWindowScroll()

const showBackToTop = computed(() => y.value > 600)

function backToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="about">
    <!-- Hero -->
    <section class="container hero">
      <span class="eyebrow">Notre ambition</span>

      <h1 class="hero__title t-headline-xl">
        Connecter le monde par <span class="accent">l'émotion</span>
      </h1>

      <span class="rule" aria-hidden="true" />

      <p class="hero__lead t-body-lg">
        <strong class="accent">{{ APP_CONFIG.name }}</strong> n'est pas qu'une simple plateforme de
        billetterie. C'est le moteur technologique qui propulse vos ambitions événementielles,
        transformant chaque idée en une réussite mémorable grâce à une agilité sans précédent.
      </p>
    </section>

    <!-- Why us: copy left, photo right -->
    <section class="band band--white">
      <div class="container split">
        <div class="split__copy">
          <h2 class="split__title t-headline-xl">Pourquoi nous ?</h2>

          <p class="split__lead t-body-lg">
            Assister à un concert ou à un match ne devrait pas demander une carte bancaire, un
            déplacement en billetterie ni une file d'attente. Nous avons construit la voie la plus
            courte entre l'envie d'y être et le billet dans votre poche.
          </p>

          <ul class="pillars">
            <li v-for="pillar in pillars" :key="pillar.title" class="pillar">
              <div>
                <h3 class="pillar__title">{{ pillar.title }}</h3>
                <p class="pillar__body t-body-md">{{ pillar.body }}</p>
              </div>
            </li>
          </ul>
        </div>

        <div class="split__media split__media--first">
          <span class="split__backdrop" aria-hidden="true" />
          <div class="split__frame split__frame--float">
            <img src="/mock/about-equipe.webp" :alt="`Culture d'innovation ${APP_CONFIG.name}`" />
          </div>
        </div>
      </div>
    </section>

    <!-- Expertise: photo left, copy right -->
    <!-- Anchor target of the home page's « Comment ça marche ? » button: this
         band is where the platform's modules are actually explained. -->
    <section id="comment-ca-marche" class="band band--tinted">
      <div class="container split split--reverse">
        <div class="split__media">
          <span class="split__glow" aria-hidden="true" />
          <div class="split__frame">
            <img src="/mock/about-support.webp" alt="Équipe support en régie de billetterie" />
          </div>
        </div>

        <div class="split__copy">
          <span class="eyebrow eyebrow--start">Notre expertise</span>

          <h2 class="split__title t-headline-xl">
            L'excellence<br /><span class="accent">au quotidien</span>
          </h2>

          <p class="split__lead t-body-lg">
            Découvrez comment {{ APP_CONFIG.name }} transforme la gestion de vos événements grâce à
            des modules pensés par des professionnels pour des professionnels.
          </p>

          <div class="accordions">
            <div
              v-for="(entry, index) in modules"
              :key="entry.title"
              class="accordion"
              :class="{ 'accordion--open': openModule === index }"
            >
              <button
                class="accordion__trigger"
                type="button"
                :aria-expanded="openModule === index"
                :aria-controls="`module-${index}`"
                @click="toggle(index)"
              >
                <span class="accordion__label t-headline-md">{{ entry.title }}</span>
                <span class="accordion__chevron">
                  <BaseIcon name="expand_more" :size="20" />
                </span>
              </button>

              <div :id="`module-${index}`" class="accordion__panel">
                <p class="accordion__body t-body-md">{{ entry.body }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Vision -->
    <section class="band band--white">
      <div class="container vision">
        <span class="eyebrow">Horizon 2030</span>
        <h2 class="vision__title t-headline-xl">Notre vision pour demain</h2>
        <span class="rule rule--wide" aria-hidden="true" />

        <div class="vision__card">
          <p class="vision__lead t-headline-lg">
            Nous façonnons le futur de l'économie événementielle en Afrique et à l'international, en
            plaçant l'inclusion technologique au cœur de notre stratégie.
          </p>

          <p class="vision__body t-body-lg">
            {{ APP_CONFIG.name }} aspire à devenir bien plus qu'une interface transactionnelle.
            Notre vision est de bâtir un réseau intelligent capable d'anticiper les besoins des
            organisateurs et les envies des spectateurs. Nous investissons massivement dans
            l'intelligence artificielle pour personnaliser les recommandations et optimiser les flux
            logistiques lors des grands rassemblements.
          </p>

          <p class="vision__body t-body-lg">
            En soutenant la création locale tout en répondant aux standards internationaux, nous
            créons un pont entre les talents et leur marché. Demain, chaque organisateur, du
            festival indépendant au grand stade national, disposera des mêmes chances de succès
            grâce à la démocratisation de nos solutions premium.
          </p>
        </div>
      </div>
    </section>

    <Transition name="fade">
      <button
        v-if="showBackToTop"
        class="to-top"
        type="button"
        aria-label="Revenir en haut de la page"
        @click="backToTop"
      >
        <BaseIcon name="arrow_upward" :size="24" />
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.accent {
  color: var(--color-primary-container);
}

.eyebrow {
  display: block;
  margin-block-end: var(--space-4);
  color: var(--color-primary);
  font-size: var(--text-label-bold);
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-align: center;
}

.eyebrow--start {
  text-align: start;
}

.rule {
  display: block;
  width: 5rem;
  height: 0.375rem;
  margin-inline: auto;
  margin-block-end: var(--space-12);
  background-color: var(--color-primary-container);
  border-radius: var(--radius-full);
}

.rule--wide {
  margin-block-end: var(--space-16);
}

/* --- Hero --- */
.hero {
  padding-block: var(--space-16);
  text-align: center;
}

.hero__title {
  max-width: 56rem;
  margin-inline: auto;
  margin-block-end: var(--space-8);
  line-height: 1;
  letter-spacing: -0.03em;
  text-transform: uppercase;
}

.hero__lead {
  max-width: 48rem;
  margin-inline: auto;
  color: var(--color-secondary);
  line-height: 1.7;
}

.hero__lead strong {
  font-weight: 800;
}

/* --- Bands --- */
/* The decorative shapes behind the photos — a rotated backdrop and a blurred
   halo — deliberately reach past their column. Clipped here so they can do
   that without widening the page: at 1024 px they were pushing 2 px of
   horizontal scroll onto the whole document. */
.band {
  padding-block: var(--space-section-gap);
  overflow: hidden;
}

.band--white {
  background-color: var(--color-surface-container-lowest);
}

.band--tinted {
  background-color: var(--color-surface-container-low);
}

/* --- Two-column split --- */
.split {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-12);
  align-items: center;
}

.split__title {
  margin-block-end: var(--space-6);
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

.split__lead {
  margin-block-end: var(--space-10);
  color: var(--color-secondary);
  line-height: 1.7;
}

/* The photo comes first on a phone in the first band, as the mockup orders it. */
.split__media {
  position: relative;
  order: -1;
}

.split__frame {
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
}

.split__frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  aspect-ratio: 1;
}

/* Tinted panel tilted behind the photo. */
.split__backdrop {
  position: absolute;
  inset: 0;
  background-color: color-mix(in srgb, var(--color-primary-container) 5%, transparent);
  border-radius: var(--radius-2xl);
  transform: rotate(-3deg) scale(1.05);
}

/* Soft halo behind the second photo. */
.split__glow {
  position: absolute;
  top: -2.5rem;
  left: -2.5rem;
  width: 10rem;
  height: 10rem;
  background-color: color-mix(in srgb, var(--color-primary-container) 10%, transparent);
  border-radius: var(--radius-full);
  filter: blur(48px);
}

.split__frame--float {
  animation: floating 6s ease-in-out infinite;
}

@keyframes floating {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(15px);
  }
}

/* --- Pillars --- */
.pillars {
  display: grid;
  gap: var(--space-6);
}

.pillar {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  transition: background-color var(--transition-fast);
}

.pillar:hover {
  background-color: var(--color-surface-container-low);
}

.pillar__title {
  margin-block-end: var(--space-1);
  color: var(--color-on-surface);
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.pillar__body {
  color: var(--color-on-surface-variant);
}

/* --- Accordions --- */
.accordions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.accordion {
  overflow: hidden;
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-sm);
  transition:
    border-color var(--transition-base),
    background-color var(--transition-base);
}

.accordion--open {
  background-color: var(--color-surface-container-low);
  border-color: var(--color-outline);
}

.accordion__trigger {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-6);
  text-align: start;
  transition: background-color var(--transition-fast);
}

.accordion__trigger:hover {
  background-color: var(--color-surface-container-low);
}

.accordion__chevron {
  display: flex;
  flex-shrink: 0;
  padding: var(--space-1);
  background-color: var(--color-surface-container);
  border-radius: var(--radius-full);
  transition: transform var(--transition-slow);
}

.accordion--open .accordion__chevron {
  transform: rotate(180deg);
}

/* Height animation needs a fixed bound; 31rem clears the longest copy. */
.accordion__panel {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    max-height 400ms cubic-bezier(0.4, 0, 0.2, 1),
    opacity 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

.accordion--open .accordion__panel {
  max-height: 31rem;
  opacity: 1;
}

.accordion__body {
  padding: var(--space-4) var(--space-6) var(--space-6);
  margin-inline: var(--space-6);
  color: var(--color-on-surface-variant);
  line-height: 1.7;
  border-block-start: 1px solid var(--color-outline-variant);
  padding-inline: 0;
}

/* --- Vision --- */
.vision {
  text-align: center;
}

.vision__title {
  margin-block-end: var(--space-8);
  letter-spacing: -0.03em;
  text-transform: uppercase;
}

/* 40 px each side eats a quarter of a phone; the generous inset is a desktop
   affordance and comes back at 768 px. */
.vision__card {
  padding: var(--space-5);
  text-align: start;
  background-color: var(--color-surface-container-low);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-2xl);
}

.vision__lead {
  max-width: 48rem;
  margin-block-end: var(--space-8);
  color: var(--color-on-surface);
  line-height: 1.25;
}

.vision__body {
  max-width: 48rem;
  color: var(--color-secondary);
  line-height: 1.7;
}

.vision__body + .vision__body {
  margin-block-start: var(--space-8);
}

/* --- Back to top --- */
.to-top {
  position: fixed;
  right: var(--space-6);
  bottom: calc(var(--tabbar-height) + var(--space-4) + env(safe-area-inset-bottom));
  z-index: var(--z-tabbar);
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  color: #fff;
  background-color: var(--color-primary-container);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-lg);
  transition: transform var(--transition-fast);
}

.to-top:hover {
  transform: translateY(-2px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-base);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (width >= 768px) {
  .vision__card {
    padding: var(--space-10);
  }

  .split {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-16);
  }

  /* First band: copy left, photo right. */
  .split__copy {
    order: 1;
  }

  .split__media--first {
    order: 2;
  }

  .split__frame img {
    aspect-ratio: auto;
  }

  /* Second band keeps the photo on the left. */
  .split--reverse {
    gap: var(--space-20, 5rem);
  }

  .split--reverse .split__media {
    order: 1;
  }

  .split--reverse .split__copy {
    order: 2;
  }

  .vision__card {
    padding: var(--space-16);
  }

  .to-top {
    bottom: var(--space-10);
  }
}
</style>
