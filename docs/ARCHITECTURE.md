# Architecture — ticketExpress-frontend

Ce document explique **pourquoi** le projet est structuré ainsi. Pour installer et lancer l'application, voir le [README](../README.md).

---

## 1. Principe directeur

Le site public et le back-office n'ont pas les mêmes contraintes :

| | Back-office (`TicketExpress-dashoard`) | Site public (ce projet) |
| --- | --- | --- |
| Utilisateurs | Quelques administrateurs authentifiés | Visiteurs anonymes, en majorité mobiles |
| Priorité | Densité d'information, productivité | Temps de chargement, lisibilité, référencement |
| Accès | Fermé par défaut, ouvert par permission | Ouvert par défaut, fermé par exception |
| UI | Vuetify (tableaux, dialogues) | Design propre, tokens CSS |

Le back-office a servi de **référence technique**, pas de modèle à dupliquer. Les décisions ci-dessous découlent directement de cette différence de contexte.

---

## 2. Décisions techniques

### 2.1 Un seul client HTTP

Le back-office fait cohabiter deux couches HTTP : `ofetch` (`$api`) et `createFetch` de VueUse (`useApi`). La seconde **avale les réponses non-2xx**, ce qui rend une erreur de validation 422 impossible à lire — d'où l'obligation d'utiliser `$api` dès qu'un formulaire est en jeu.

Ici, **une seule instance Axios** (`src/api/http.ts`) traite toutes les requêtes. Les erreurs passent par un intercepteur unique et ressortent normalisées.

### 2.2 Enveloppe API déballée une seule fois

Le backend renvoie systématiquement `{ success, message, data, meta?, errors? }`. Plutôt que d'écrire `response.data.data` à chaque appel, `http.ts` expose des helpers typés :

```ts
getOne<T>(url)   // → T
getList<T>(url)  // → { items: T[], meta: PaginationMeta }
post<T, B>(url, body)
put<T, B>(url, body)
destroy(url)
postForMessage(url, body) // quand seul le message compte (OTP, logout)
```

Si l'enveloppe change côté backend, un seul fichier est à corriger.

> ⚠️ **Piège connu du backend** : un `index()` doit retourner `XResource::collection($paginator)` **directement**. Passer par `$this->success(...)` produit un double-imbriquement `data.data` que `getList` ne saurait pas lire.

### 2.3 Erreurs typées

Toute erreur remontant à l'application est une `ApiError` (`src/api/errors.ts`) :

```ts
try {
  await ordersService.create(payload)
} catch (e) {
  const error = e as ApiError
  if (error.isValidationError) form.errors = error.errors
  else ui.notify(error.message, 'error')
}
```

`ApiError` distingue les cas qui appellent des réactions différentes : `isNetworkError`, `isCanceled`, `isUnauthenticated`, `isForbidden`, `isNotFound`, `isValidationError`, `isServerError`. Le champ `message` est **toujours affichable** — le message du serveur quand il existe, sinon un texte générique en français.

### 2.4 Routing explicite

Le back-office utilise `unplugin-vue-router` (routes générées depuis l'arborescence). Il a fallu le contourner : `beforeWriteFiles` avec des `root.insert(...)` manuels, plus une fonction `recursiveLayouts()` écrite à la main pour appliquer les layouts.

Ici, `src/router/routes.ts` déclare les routes explicitement. C'est plus verbeux, mais :

- le tableau des routes est lisible et se cherche au `grep` ;
- les layouts sont de **l'imbrication de routes** ordinaire, sans magie de build ;
- les URLs publiques sont en français (`/evenements`) indépendamment du nom des fichiers ;
- toutes les pages sont chargées en lazy (`() => import(...)`), une route = un chunk.

### 2.5 Pas d'auto-imports

Le back-office active `unplugin-auto-import` et `unplugin-vue-components` : `ref`, `computed` et `useCookie` apparaissent sans import. Conséquences : « aller à la définition » ne fonctionne pas, l'origine d'un symbole est invisible, et trois fichiers générés (`auto-imports.d.ts`, `components.d.ts`, `.eslintrc-auto-import.json`) doivent être versionnés.

Tout est importé explicitement ici.

### 2.6 Séparation `api/` et `services/`

- **`src/api/`** — le *transport*. Comment on parle à un serveur HTTP : instance, en-têtes, intercepteurs, enveloppe, erreurs, registre d'URLs.
- **`src/services/`** — le *domaine*. Un module par ressource, une fonction par endpoint, avec des types métier.

Un service ne connaît ni Axios ni l'enveloppe ; l'API ne connaît pas les événements ni les commandes.

### 2.7 Services sans état

Un service mappe un appel vers un endpoint et renvoie des données typées. Il ne stocke rien, n'expose pas de `isLoading` et n'affiche pas d'erreur. Ces responsabilités appartiennent :

- au **store** quand l'état est partagé entre plusieurs pages (session, panier) ;
- au **composable** `useApiRequest` quand il est local à une page.

```ts
const { data, isLoading, error, execute } = useApiRequest(eventsService.list)
await execute({ page: 1, search: 'concert' })
```

`useApiRequest` annule automatiquement la requête précédente quand une nouvelle part — indispensable pour une recherche au clavier, où les réponses peuvent arriver dans le désordre.

### 2.8 Session en `localStorage`

Le back-office stocke `accessToken`, `userData` et `userAbilityRules` dans des cookies, avec des noms imposés par le template Vuexy.

Ici, le token va dans `localStorage` (`src/utils/storage.ts`) :

- l'API authentifie par **bearer token Sanctum**, pas par cookie de session : le navigateur n'a rien à envoyer automatiquement et il n'y a pas de flux CSRF à respecter ;
- l'accès est encapsulé et protégé — `localStorage` lève une exception en navigation privée, et une entrée corrompue ne doit pas empêcher l'application de démarrer.

Les clés sont centralisées dans `src/constants/storage.ts`.

**Rupture de cycle.** L'intercepteur 401 ne peut pas importer le store (`store → services → http → store`). `http.ts` expose donc `setUnauthenticatedHandler()`, que `main.ts` branche une fois Pinia installé.

### 2.9 Sécurité des routes : inversion par rapport au back-office

Le back-office ferme tout par défaut et ouvre par permission CASL (`screen.*`). Un site public fait l'inverse : **tout est ouvert**, seules les routes portant `meta.requiresAuth` sont protégées. Il n'y a ni CASL ni rôles côté public.

`meta.guestOnly` couvre le cas symétrique : un visiteur déjà connecté n'a rien à faire sur la page de connexion.

### 2.10 Design tokens plutôt qu'une bibliothèque UI

Aucune bibliothèque de composants n'est installée. Vuetify est taillé pour un back-office et pèserait lourd sur un site public dont l'enjeu est le temps de chargement.

`src/assets/styles/tokens.css` définit couleurs, espacements, typographie, rayons et transitions sous forme de custom properties. Un thème sombre est prévu via `data-theme="dark"`. Une bibliothèque reste ajoutable plus tard sans réécriture.

---

## 3. Contrat avec l'API

### 3.1 Casse

| Sens | Casse | Exemple |
| --- | --- | --- |
| Réponse → front | `camelCase` | `organizerId`, `startDate`, `statusLabel` |
| Front → requête | `snake_case` | `organizer_id`, `start_date`, `ticket_type_id` |

C'est pour cela que la règle ESLint `camelcase` est configurée avec `properties: 'never'` : les corps de requête *doivent* être en `snake_case`.

### 3.2 Dates

Les dates ne sont pas des chaînes mais des objets :

```ts
interface ApiDate {
  datetime: string   // ISO 8601 — pour les calculs
  human: string      // libellé localisé — pour l'affichage
  humanDiff: string  // relatif, ex. « dans 3 jours »
}
```

Utilisez `formatDate()` / `formatRelativeDate()` (`src/utils/format.ts`), et `toDateTimeLocal()` pour alimenter un `<input type="datetime-local">`.

### 3.3 Identifiants

Toutes les clés primaires sont des **ULID** (type `Ulid`), jamais des entiers.

### 3.4 Pagination

Pagination **serveur partout, 15 par page**. `getList` renvoie `{ items, meta }` où `meta` contient `current_page`, `per_page`, `total`, `last_page`, `from`, `to`.

### 3.5 Endpoints publics disponibles

| Ressource | Route | Auth |
| --- | --- | --- |
| Événements | `GET events`, `GET events/{id}` | non |
| Types de billets | `GET events/{event}/ticket-types` | non |
| Occurrences | `GET events/{event}/occurrences` | non |
| Catégories | `GET categories` | non |
| Lieux | `GET venues` | non |
| Organisateurs | `GET organizers` | non |
| Avis | `GET events/{id}/reviews` | non |
| Connexion | `POST auth/login` | non |
| Inscription | `POST auth/register/client` | non |
| Commande | `POST orders` | **non** — achat invité autorisé |
| Commandes | `GET orders`, `GET orders/{id}`, `POST orders/{id}/cancel` | oui |
| Paiement | `POST payments/initiate`, `GET payments/{id}/status` | non |
| Billets | `GET tickets/download/{token}` | non (token) |
| Favoris | `GET favorites`, `POST events/{event}/favorite` | oui |
| Profil | `GET me` | oui |

### 3.6 Authentification

Toutes les entrées publiques renvoient la **même enveloppe de session**, décrite par le type `AuthSession` :

```jsonc
{ "success": true, "message": "…", "data": { "token": "5|abc…", "user": { /* UserResource */ } } }
```

| Route | Effet |
| --- | --- |
| `POST auth/login` | Connexion email + mot de passe → session |
| `POST auth/register/client` | Création de compte → session (connecté immédiatement) |
| `POST auth/register` | Fin d'inscription après OTP → session |
| `POST auth/verify-otp` | Code valide → session, ou `is_new_user: true` |

L'en-tête optionnel `X-Device-Name` nomme le token côté serveur (défaut : `web`), ce qui permet à l'utilisateur de distinguer ses sessions.

> Le back-office garde sa propre route `POST auth/admin/login`, qui renvoie `accessToken` / `userData` / `userAbilityRules` (nommage hérité de Vuexy). Le site public ne l'utilise pas, et ce nommage ne doit pas se propager ici.

Le flux téléphone (`send-otp` → `verify-otp` → `register` si le numéro est inconnu) est câblé dans `authService` mais aucune page ne le consomme encore.

### 3.7 Paiement PayGate

Le paiement mobile money (FLOOZ / TMONEY) est **asynchrone** :

1. `POST payments/initiate` déclenche l'invite USSD sur le téléphone du payeur, sans connexion requise ;
2. PayGate appelle le webhook du backend une fois l'opération résolue ;
3. le front interroge `GET payments/{id}/status` jusqu'à sortie de l'état `pending`.

La clé PayGate vit uniquement dans le `.env` **du backend**. Elle ne doit jamais apparaître ici.

---

## 4. Tests

**Vitest** + **@vue/test-utils**, en environnement `jsdom`. La configuration vit dans `vitest.config.ts`, séparée de `vite.config.ts` : le plugin devtools et la lecture des fichiers `.env` n'ont rien à faire dans un run de tests.

Les tests sont **à côté du code qu'ils couvrent** (`src/api/errors.spec.ts` teste `src/api/errors.ts`), et non dans un dossier miroir : déplacer un module déplace son test.

Ce qui est couvert par le socle :

| Fichier | Ce qui est vérifié |
| --- | --- |
| `api/errors.spec.ts` | Normalisation de toute erreur en `ApiError` : réseau, timeout, 422 par champ, message serveur prioritaire |
| `api/http.spec.ts` | Intercepteurs (bearer, `FormData`), déballage de l'enveloppe, déclenchement du handler 401 |
| `stores/auth.store.spec.ts` | Connexion, inscription, déconnexion, réhydratation, expiration du token |
| `router/guards.spec.ts` | `requiresAuth`, `guestOnly`, conservation de `?redirect=`, titre du document |
| `composables/useApiRequest.spec.ts` | États `loading`/`error`, annulation, `reset` |
| `utils/*.spec.ts` | Formatage (prix, dates, troncature) et robustesse de `localStorage` |
| `components/layout/TheHeader.spec.ts` | Rendu selon l'état de session, accessibilité de la navigation |

Les valeurs `import.meta.env` sont injectées par `define` dans `vitest.config.ts` — les modules les lisent à l'import, un `.env` de test ne suffirait pas.

Le rapport de couverture (`npm run test:coverage`) exclut les types, les barrels, `main.ts` et les pages placeholder : y inclure du code sans logique ne ferait que diluer le chiffre.

**Ce qui n'est volontairement pas testé ici** : les services (`src/services/`) sont des mappings d'une ligne vers un endpoint ; leur logique réelle — enveloppe et erreurs — est couverte par `api/http.spec.ts`. Ils mériteront des tests quand ils porteront des transformations.

---

## 5. Ajouter une fonctionnalité

Exemple : afficher la liste des coupons.

1. **Type** — `src/types/` : décrire la ressource telle que le backend la renvoie.
2. **Endpoint** — `src/api/endpoints.ts` : ajouter l'URL.
3. **Service** — `src/services/coupons.service.ts` : une fonction par endpoint, puis l'exporter depuis `services/index.ts`.
4. **Page** — `src/pages/` : consommer le service via `useApiRequest`.
5. **Route** — `src/router/routes.ts` : ajouter l'entrée avec son `meta.title`.
6. **Store** — *seulement* si l'état doit être partagé entre plusieurs pages.
7. **Tests** — `*.spec.ts` à côté du module, pour la logique ajoutée.

Avant de committer :

```bash
npm run lint && npm run format && npm run type-check && npm run test && npm run build
```

---

## 6. Points ouverts

| Sujet | État |
| --- | --- |
| Internationalisation | Textes en français en dur ; `vue-i18n` ajoutable si le multilingue est requis |
| SEO / SSR | SPA pure. Un rendu serveur (Nuxt) serait à discuter si l'indexation des événements devient prioritaire |
| Tests end-to-end | Vitest couvre l'unitaire et le composant ; Playwright reste à décider pour les parcours d'achat |
| TypeScript 7 | Bloqué par `typescript-eslint@8` (peer `<6.1.0`) |
| `overrides` brace-expansion | Contournement d'une faille dev-only (GHSA-mh99-v99m-4gvg) ; à retirer quand `@vue/test-utils` mettra son arbre à jour |
