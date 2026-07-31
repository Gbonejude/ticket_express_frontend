# ticketExpress-frontend

Site public de **Ticket Express** : consultation et recherche d'événements, achat de billets, compte utilisateur et suivi des commandes.

Cette application consomme l'API Laravel du dépôt `TicketExpress-backend`. Elle est indépendante du back-office `TicketExpress-dashoard`, qui a ses propres besoins et sa propre stack.

---

## Stack technique

| Domaine          | Choix                | Version | Pourquoi                                                                                    |
| ---------------- | -------------------- | ------- | ------------------------------------------------------------------------------------------- |
| Framework        | Vue 3 (Composition API, `<script setup>`) | 3.5   | Standard de la plateforme, déjà maîtrisé par l'équipe                                        |
| Build            | Vite (Rolldown)      | 8.x     | HMR instantané, build de production rapide                                                    |
| Langage          | TypeScript           | 5.9     | Les réponses de l'API sont typées de bout en bout : un champ mal orthographié échoue au type-check |
| Routing          | Vue Router           | 5.x     | Routes déclarées **explicitement**, pas de génération par fichiers                             |
| État global      | Pinia                | 4.x     | Store officiel, API `setup` alignée sur la Composition API                                    |
| HTTP             | Axios                | 1.x     | Intercepteurs matures, gestion propre de `FormData` et de l'annulation                        |
| Utilitaires      | `@vueuse/core`       | 14.x    | Debounce de recherche, observateurs, helpers réactifs                                         |
| Tests            | Vitest + Vue Test Utils | 4 / 2 | Même moteur que Vite : une seule chaîne de transformation, pas de configuration Babel séparée |
| Qualité          | ESLint + Prettier    | 10 / 3  | ESLint = correction, Prettier = format. Aucune règle en doublon                               |

> **TypeScript est volontairement figé en 5.9.** `typescript-eslint@8` déclare le peer `typescript >=4.8.4 <6.1.0` : installer TypeScript 7 casse le lint typé. À rehausser lorsque `typescript-eslint` publiera le support de TS 7.

Aucune bibliothèque de composants UI n'est installée. Le back-office utilise Vuetify, conçu pour des tableaux de données et des dialogues d'administration ; un site grand public a besoin de son propre design. Les styles reposent sur des **design tokens** en CSS natif (`src/assets/styles/tokens.css`).

---

## Prérequis

- **Node.js** `^22.18.0 || >=24.12.0` (voir `.nvmrc`)
- **npm** 10+
- Le backend `TicketExpress-backend` accessible (par défaut `http://localhost:8000`)

---

## Installation

```bash
git clone <url-du-depot>
cd ticketExpress-frontend

npm install

# Créer la configuration locale à partir du modèle
cp .env.example .env      # Windows PowerShell : Copy-Item .env.example .env
```

Ajustez ensuite `VITE_API_BASE_URL` dans `.env` pour pointer vers votre backend.

---

## Commandes

| Commande               | Effet                                                                 |
| ---------------------- | --------------------------------------------------------------------- |
| `npm run dev`          | Serveur de développement avec HMR sur http://localhost:5173            |
| `npm run build`        | Type-check **et** build de production en parallèle, sortie dans `dist/` |
| `npm run build-only`   | Build sans type-check (itérations rapides)                             |
| `npm run preview`      | Sert `dist/` localement pour valider le build                          |
| `npm test`             | Lance la suite de tests une fois                                       |
| `npm run test:watch`   | Tests en mode watch pendant le développement                           |
| `npm run test:coverage`| Suite complète + rapport de couverture (`coverage/`)                   |
| `npm run type-check`   | `vue-tsc` sur tout le projet                                           |
| `npm run lint`         | ESLint avec correction automatique                                     |
| `npm run lint:check`   | ESLint sans écriture (à utiliser en CI)                                |
| `npm run format`       | Prettier sur `src/`                                                    |
| `npm run format:check` | Vérifie le formatage sans écrire (à utiliser en CI)                    |

---

## Variables d'environnement

Seules les variables préfixées `VITE_` sont injectées dans le bundle. **Tout ce qui est déclaré ici est visible par le navigateur : n'y placez jamais de secret.**

| Variable            | Requise | Exemple                        | Rôle                                  |
| ------------------- | ------- | ------------------------------ | ------------------------------------- |
| `VITE_API_BASE_URL` | oui     | `http://localhost:8000/api/v1` | Base de l'API, sans slash final       |
| `VITE_API_TIMEOUT`  | non     | `15000`                        | Timeout des requêtes en ms            |
| `VITE_APP_NAME`     | oui     | `Ticket Express`               | Nom affiché et suffixe des titres     |
| `VITE_APP_URL`      | non     | `https://ticketexpress.tg`     | URL canonique du site                 |
| `VITE_APP_CURRENCY` | non     | `XOF`                          | Devise utilisée par `formatPrice()`   |
| `VITE_APP_LOCALE`   | non     | `fr-FR`                        | Locale des formats de date et nombre  |
| `VITE_DEV_PORT`     | non     | `5173`                         | Port du serveur de dev                |

Fichiers : `.env.example` (modèle, versionné) · `.env` (local, ignoré par git) · `.env.production` (valeurs de build, versionné, sans secret).

Chaque variable est déclarée dans `env.d.ts`, ce qui rend `import.meta.env` typé et vérifié à la compilation.

---

## Architecture

```
src/
├── __tests__/      setup global de Vitest
├── api/            Transport HTTP — client Axios, intercepteurs, erreurs, URLs
│   ├── http.ts         instance Axios + helpers typés qui déballent l'enveloppe
│   ├── endpoints.ts    registre de toutes les URLs appelées
│   ├── errors.ts       ApiError + normalizeError
│   └── index.ts
├── assets/styles/  tokens.css (variables), base.css (reset), main.css (entrée)
├── components/
│   ├── common/         composants réutilisables, sans logique métier
│   └── layout/         TheHeader, TheFooter
├── composables/    useApiRequest (état loading/erreur), usePageTitle
├── constants/      configuration applicative et clés de stockage
├── layouts/        DefaultLayout, AuthLayout, BlankLayout
├── pages/          un composant par route (chargés en lazy)
├── router/         index.ts, routes.ts, guards.ts
├── services/       un module par ressource API (events, auth, orders, payments…)
├── stores/         stores Pinia (auth, ui)
├── types/          modèles du domaine, calqués sur les Resources du backend
├── utils/          formatage, accès localStorage
├── App.vue
└── main.ts
```

Le flux de données est à sens unique :

```
Page/Composant → Store (état partagé) ou Composable (état local)
                        ↓
                   Service (une fonction = un endpoint)
                        ↓
                   api/http.ts (Axios + intercepteurs)
                        ↓
                   API TicketExpress
```

Détails et conventions : **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## Conventions

- **Nommage** — composants en `PascalCase.vue` ; pages suffixées `Page` ; services `*.service.ts` ; stores `*.store.ts` ; composables `useXxx.ts`.
- **Imports explicites.** Pas d'auto-import : un identifiant non importé n'existe pas. L'IDE peut suivre chaque symbole jusqu'à sa définition.
- **Alias `@`** vers `src/`. Aucun import relatif remontant (`../../`).
- **Casse de l'API** — réponses en `camelCase`, corps de requête en `snake_case`. La règle ESLint `camelcase` est configurée avec `properties: 'never'` pour l'accepter.
- **Erreurs** — toute erreur remontant à l'application est une `ApiError` avec un message déjà affichable.
- **Tests** — fichiers `*.spec.ts` placés **à côté** du module testé, pas dans un dossier miroir.

---

## Configuration recommandée de l'éditeur

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (désactiver Vetur), avec les extensions ESLint et Prettier.

---

## État du projet

La phase de **setup** est terminée : architecture, couche API, routing, state management, tests, outils qualité et documentation sont en place et vérifiés (`lint`, `format`, `type-check`, `test` — 97 tests —, `build`, `npm audit` et rendu navigateur).

Les pages présentes sont des **placeholders** : elles valident le routage et les layouts, et seront remplacées lors de la phase fonctionnelle.
