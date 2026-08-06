# Intégration API — `ticketExpress-frontend`

Ce document est la carte entre les écrans du site public et l'API Laravel.
Il sert à deux choses : savoir quel endpoint alimente quel écran, et savoir ce
qui n'est **pas** connecté et pourquoi.

Toutes les routes sont relatives à `VITE_API_BASE_URL` (qui inclut `/api/v1`).

---

## Architecture

```
src/
 ├── api/          http.ts (axios + interceptors), errors.ts (ApiError), endpoints.ts
 ├── services/     un module par domaine ; sans état, ne fait que mapper appel → endpoint
 ├── stores/       état partagé et réactif (session, favoris, notifications, catalogue)
 ├── composables/  useApiRequest (loading/error), useFavorites
 ├── data/         `dataSource` — la seule couche que les pages importent
 └── pages/        aucun appel Axios direct, jamais
```

**Règle de dépendance :** une page importe `dataSource` (données) et les stores
(état partagé). Elle n'importe jamais un service ni `http` directement.

`dataSource` a le droit de **composer** — résoudre l'événement d'une commande
depuis la charge utile déjà reçue, transformer « même catégorie sauf celui-ci »
en requête filtrée. Il n'a pas le droit de filtrer ou trier une page de
résultats côté client pour simuler une requête que l'API ne sait pas faire :
cela fonctionne jusqu'à la deuxième page.

### Les favoris ne passent pas par `dataSource`

C'est délibéré. Une liste peint des dizaines de cœurs au premier rendu et a donc
besoin d'un `has()` **synchrone**, et un basculement doit mettre d'accord toutes
les cartes montées. C'est le rôle d'un store : les pages utilisent
`useFavoritesStore()` directement, comme elles utilisent déjà les stores `auth`
et `ui`.

---

## Cartographie fonctionnalité → endpoint

| Fonctionnalité | Endpoint | Méthode | Écran |
| --- | --- | --- | --- |
| Connexion | `auth/login` | POST | `LoginPage` |
| Inscription client | `auth/register/client` | POST | `RegisterPage` |
| Inscription par OTP | `auth/send-otp`, `auth/verify-otp`, `auth/register` | POST | `RegisterPage` |
| Mot de passe oublié | `auth/forgot-password` | POST | `LoginPage` |
| Déconnexion | `auth/logout` | POST | `LogoutPage` |
| Session courante | `me` | GET | partout (store `auth`) |
| Profil — modification | `users/{id}` | PUT | `ProfilePage` |
| Profil — mot de passe | `users/{id}` | PUT | `ProfilePage` |
| Profil — photo | `users/{id}` (multipart, `_method=PUT`) | POST | `ProfilePage` |
| Liste / recherche / filtres / tri | `events` | GET | `HomePage`, `EventsPage` |
| Détail événement | `events/{id}` | GET | `EventDetailPage`, `CheckoutPage` |
| Types de billets | `events/{id}/ticket-types` | GET | `EventDetailPage` |
| Catégories | `categories` | GET | `HomePage`, `EventsPage` |
| Villes (filtre lieu) | `venues` | GET | store `catalog` |
| Organisateur public | `organizers/{id}` | GET | `OrganizerPage` |
| Événements d'un organisateur | `events?organizer_id&when` | GET | `OrganizerPage` |
| Candidature organisateur | `organizers/apply` | POST | `BecomeOrganizerPage` |
| Favoris — liste | `favorites` | GET | `FavoritesPage`, store |
| Favoris — bascule | `events/{id}/favorite` | POST | toutes les cartes |
| Commande — création | `orders` | POST | `CheckoutPage` |
| Commande — historique | `orders?page&status` | GET | `OrdersPage` |
| Commande — annulation | `orders/{id}/cancel` | POST | `OrdersPage` |
| Paiement — initiation | `payments/initiate` | POST | `CheckoutPage` (visiteur ou connecté) |
| Paiement — statut (polling) | `payments/{id}/status` | GET | `CheckoutPage` (visiteur ou connecté) |
| Mes billets | `orders` (voir plus bas) | GET | `TicketsPage`, `TicketDetailPage` |
| Billet — PDF | `tickets/download/{token}` | GET | `TicketDetailPage`, `OrdersPage` |
| Billet — QR | `tickets/qr/{token}/{ticketId}` | GET | `TicketDetailPage` |
| Notifications | `notifications` | GET | `NotificationsPage` |
| Notification — lue | `notifications/{id}/markasread` | POST | `NotificationsPage` |
| Contact | `contact` | POST | `ContactPage` |

---

## Où le filtrage a lieu — et pourquoi ce n'est pas au même endroit partout

| Écran | Filtrage | Raison |
| --- | --- | --- |
| Accueil | **Serveur** (`GET /events?page&per_page&when&sort`) | Vitrine paginée : une page à la fois suffit, et la première peinture doit être rapide |
| Explorer | **Client**, sur le catalogue complet | C'est un panneau de commande : bouger le curseur de prix ou cocher trois catégories déclencherait une requête par geste, et la grille clignoterait sous le curseur |

Le filtrage client n'est **correct que parce que le store charge tout le
catalogue à venir** (`catalog.loadEvents()`, une requête pour 33 événements).
Filtrer une seule page côté client donne des résultats faux dès la page 2 — le
piège classique. Un plafond de 500 événements marque la limite : au-delà, la
page Explorer doit repasser au serveur, qui sait déjà tout faire.

Le catalogue en mémoire est vidé après un achat (`catalog.resetEvents()`) :
sans cela, un palier épuisé continuerait d'afficher « disponible » jusqu'à la
fermeture de l'onglet.

## Cache serveur

`CatalogueCache` met en cache les deux chemins de lecture les plus chauds :
`GET /categories` (1 h) et `GET /events` (60 s, court car les stocks bougent).

L'invalidation se fait **par numéro de version**, pas par tags : le store
configuré est `database`, qui ne gère pas les tags. Chaque clé porte la version,
et `flush()` l'incrémente — les anciennes entrées deviennent inatteignables.
C'est volontairement grossier (une publication vide tout le catalogue) : les
écritures sont rares, les lectures constantes.

Le déclencheur est `FlushCatalogueCacheListener`, branché sur
`ResourceChangedEvent` — que toutes les écritures émettent déjà. Une route
ajoutée plus tard est donc couverte sans que personne ait à y penser.

La clé inclut l'état d'authentification : `GET /events` masque les événements
des organisateurs désactivés aux visiteurs anonymes seulement, et servir la
page d'un administrateur au public les exposerait.

## Toasts

SweetAlert2, via `utils/toast`. `ui.notify(message, variant)` n'a pas changé de
signature — aucun appelant n'a bougé quand le rendu a changé. Le style est
ramené sur les tokens du design system dans `main.css`, et la position est
`top-end`.

## Trois décisions à connaître

### 1. « Mes billets » vient de `GET /orders`, pas de `GET /tickets`

`GET /tickets` existe mais est une liste de back-office protégée par
`role_or_permission:super-admin|screen.tickets` : elle répond **403** à un
participant, et n'est de toute façon pas limitée à ses billets.

`GET /orders` est limité à l'utilisateur connecté et transporte déjà les
billets, l'événement (via `ticketType.event`) et les liens de téléchargement.
Une seule requête suffit donc. Voir `services/tickets.service.ts`.

### 2. Les états de billet `expiré` et `en attente` n'existent pas côté backend

`TicketStatus` vaut `valid`, `used`, `cancelled` ou `refunded`.

- **`expiré`** est déduit : un billet `valid` dont l'événement est terminé.
- **`en attente`** n'est pas un billet. Les billets ne sont émis que par
  `OrderPaidListener`, donc une commande impayée n'en a aucun ; elle est
  affichée telle quelle dans l'onglet « En attente ».

### 3. Le paiement PayGate est asynchrone

`payments/initiate` ne fait que pousser l'invite USSD sur le téléphone du
payeur. Le corps envoyé à l'API doit contenir `order_id`, `phone_number` et
`network` (`FLOOZ` ou `TMONEY`). Ce qui décide de l'issue est le webhook
appelé par PayGate. Le front interroge donc `payments/{id}/status` toutes les
3 s (2 min max) au lieu de traiter la réponse d'`initiate` comme un reçu.

Au-delà du délai, la commande n'est pas déclarée refusée — elle peut encore
aboutir — l'utilisateur est envoyé vers son historique.

---

## Parcours organisateur

**Un organisateur n'a pas de compte sur le site public.** Il n'y crée rien, n'y
gère rien et n'y connecte pas : ses événements vivent dans
`TicketExpress-dashboard`. Le site public ne fait qu'une chose — recueillir sa
candidature — et tout le reste passe par e-mail.

| Étape | Ce qui se passe |
| --- | --- |
| Le visiteur clique « Devenir organisateur » | Formulaire **public** (`/devenir-organisateur`), aucune connexion requise |
| Il envoie sa demande | `POST /auth/register/organizer-manager` crée le compte **et** le profil organisateur en `pending`. **Aucun jeton n'est renvoyé** |
| Aussitôt | L'admin reçoit un e-mail (`OrganizerRegisteredNotification`, canaux `database` + `mail`) et le candidat un accusé de réception (`OrganizerApplicationReceivedNotification`) |
| L'admin approuve | `POST /organizers/{id}/approve` passe le profil en `approved` **et** `is_active: true`, puis dispatche `OrganizerStatusUpdatedEvent` → `OrganizerApprovedMail`, qui contient l'URL du dashboard |
| L'admin refuse | Même mécanique → `OrganizerRejectedMail`, avec le motif saisi |

Trois pièces manquaient et ont été ajoutées :

- `config('app.frontend_url')` et `config('app.dashboard_url')` **n'existaient
  pas** : les liens de `OrganizerApprovedMail` pointaient donc vers `null/login`.
  Déclarés dans `config/app.php`, alimentés par `FRONTEND_URL` / `DASHBOARD_URL`.
- `approve()` et `reject()` ne dispatchaient jamais `OrganizerStatusUpdatedEvent` :
  le listener savait envoyer les mails depuis toujours, rien ne le déclenchait.
- `OrganizerRegisteredNotification` n'était qu'une notification en base — un
  admin qui n'ouvrait pas le back-office ce jour-là laissait la demande en plan.

Le mail d'approbation pointe vers **le dashboard**, jamais vers le site public.
Il n'y a pas de SSO : l'organisateur s'y connecte avec les identifiants créés
au moment de sa demande.

`POST /organizers/apply` (candidature d'un client déjà connecté) a été retiré :
il supposait un compte organisateur sur le site public, ce qui n'existe plus.

---

## Endpoints existants mais non utilisés

| Endpoint | Rôle | Pourquoi non connecté | Proposition |
| --- | --- | --- | --- |
| `GET /events/{id}/occurrences` | Dates d'un événement récurrent | Le seeder crée désormais des événements à 3 dates, mais `EventDetailPage` n'a pas encore de sélecteur | Afficher un sélecteur quand `occurrences.length > 1` ; la relation est déjà chargée par `GET /events/{id}` |
| `POST /auth/register/organizer-manager` | Inscription organisateur en une étape | Le parcours retenu passe par `organizers/apply`, qui suppose un compte existant ; un visiteur anonyme passe donc par l'inscription client puis la candidature | Utiliser cette route pour un bouton « Je suis organisateur » sur `RegisterPage` |
| `GET /categories/{id}`, `GET /venues/{id}` | Détail unitaire | Les listes suffisent aux filtres ; aucun écran ne montre une catégorie ou un lieu seul | Pages de destination `/categories/{slug}` si besoin SEO |
| `GET /orders/{id}` | Détail d'une commande | `GET /orders` renvoie déjà tout ce que la ligne affiche | Page de détail de commande si le récapitulatif devient plus riche |
| `GET /payments`, `GET /payments/{id}` | Historique des paiements | Le statut de paiement est lisible via la commande | Onglet « Paiements » dans l'espace compte |

**Les avis ont été supprimés** — modèle, contrôleur, resource, routes, migration,
factory, écran du back-office, `screen.reviews`, ainsi que `reviewsCount` et
`averageRating` sur `EventResource`. Ce n'est plus une fonctionnalité du projet.

**Hors périmètre du site public** (back-office uniquement, volontairement non
connectés) : `events` (POST/PUT/DELETE/publish/unpublish/cancel/stats),
`ticket-types` (écriture), `promotions`, `organizers` (approve/reject/activate),
`users` (index/store/destroy), `roles`, `permissions`, `screens`, `settings`,
`withdrawals`, `notifications` (store/update/destroy), `tickets/{id}/check-in`,
`tickets/{id}/refund`, `ticket-downloads`, `coupons` (CRUD),
`payments/balance`, `auth/admin/login`.

---

## Écrans dont une donnée n'a pas d'endpoint

| Écran | Donnée manquante | Endpoint qui serait nécessaire |
| --- | --- | --- |
| `EventDetailPage` | FAQ par événement | Aucun. La FAQ est du contenu éditorial (`constants/faq.ts`) et décrit le fonctionnement de la plateforme, pas l'événement. À déplacer derrière l'API seulement si les organisateurs doivent la personnaliser |
| `DashboardPage` | Points de fidélité | Aucun système de fidélité n'existe côté backend. La carte a été remplacée par « Dernier achat », calculé depuis les commandes |
| `OrdersPage` | Comparaison année N-1 | Aucun endpoint ne renvoie de période précédente. L'indication « +12 % » codée en dur a été retirée plutôt que laissée fausse |
| `OrganizerPage` | Bannière d'organisateur | `OrganizerResource` n'a qu'un logo, désormais utilisé comme bannière ; il retombe sur l'affiche du prochain événement quand il manque |

Les trois manques signalés au tour précédent — compteur de non-lues, « tout
marquer comme lu », réinitialisation du mot de passe — ont été comblés côté
backend et sont branchés.

---

## À nettoyer : `public/mock/`

`src/mocks/` est supprimé. En revanche `public/mock/` reste, et son nom prête
désormais à confusion : il ne contient plus de fausses *données*, mais il
mélange deux choses.

**Encore utilisés** (vrais visuels de production, à conserver) :
`hero-accueil.webp`, `about-equipe.webp`, `about-support.webp`,
`icon-mail.svg`, `icon-whatsapp.svg`, `pay-mixx-by-yas.svg`,
`pay-moov-money.webp`.

**Plus référencés nulle part** : tous les `event-*.webp`, `poster-*.webp`,
`avatar-org-*.webp`, `avatar-user.webp`, `map-abidjan.webp`,
`logo-organisateur.webp`, `qr-code.webp` (remplacé par le vrai QR de l'API), et
le fichier résiduel `~about-equipe.webp`. Ils accompagnaient les fixtures
supprimées.

Vite copie tout `public/` dans `dist/` : ces ~40 images partent donc en
production sans être servies. Elles n'ont pas été supprimées ici — ce sont vos
visuels, pas du code — mais le ménage vaut la peine, en renommant au passage le
dossier en `public/images/` (7 références à mettre à jour).

---

## Modifications backend faites pour ce branchement

Additives, sans rupture de contrat.

| Fichier | Changement | Raison |
| --- | --- | --- |
| `EventController@index` | Ajout de `search`, `city`, `when`, `starts_after`, `starts_before`, `max_price`, `sort`, `per_page`, `venue_id`, `event_type` | La page de recherche et sa barre de filtres n'avaient aucun équivalent serveur ; `paginate(15)` était figé |
| `MeController` | `loadMissing('organizer')` | Le parcours organisateur se décide sur l'état d'approbation, que le rôle seul ne porte pas |
| `OrganizerController@apply` + `ApplyOrganizerRequest` + route `POST organizers/apply` | Candidature en self-service | `POST /organizers` est réservé au back-office ; un client connecté ne pouvait pas postuler |
| `TicketTypeResource` | Ajout de `event` (via `whenLoaded`) | Permet à « Mes billets » de nommer l'événement sans une requête par billet |
| `OrderController@index/@show` | Eager-load de `…ticketType.event.venue` | Idem, côté requête |
| `EventController@index` | Eager-load de `ticketTypes` | Les cartes en déduisent « à partir de X » et l'état complet. Sans elles, `[].every()` valant `true`, **toutes** les cartes affichaient « Indisponible » et un bouton « Complet » grisé |
| `EventController@index` | `search` porte sur la catégorie, plus sur l'organisateur | Chercher « sport » remontait tous les événements d'une agence dont le nom contient « Sport » |
| `NotificationController` | `unreadCount` + `markAllAsRead` | Le badge se calculait sur les 20 premières lignes ; « tout marquer comme lu » coûtait une requête par ligne |
| `AuthController@resetPassword` | Route ajoutée | L'action et la Form Request existaient déjà ; seule l'entrée manquait, donc le lien du mail ne menait nulle part |
| Avis | Module supprimé | Voir plus haut |
| `PlatformDemoSeeder` | Remplace `DemoDataSeeder`, `TestDataSeeder`, `TicketingSystemSeeder` | 14 catégories, 10 lieux géolocalisés, 6 organisateurs togolais avec logos, 25 événements avec affiches, occurrences, promotions et commandes |

Le tri par prix et le filtre `max_price` recalculent le prix effectif en SQL
(promotion active ou non), avec un `CAST` explicite du paramètre : PDO l'envoie
en chaîne, et SQLite considère alors tout nombre comme inférieur à tout texte —
le filtre laissait passer tout le catalogue.

### Deux corrections de tests préexistantes, rencontrées en chemin

Elles ne viennent pas du branchement mais bloquaient la validation.

**`phpunit.xml` — la suite appelait le vrai Pusher.** `config/broadcasting.php`
lit encore `BROADCAST_DRIVER` (nom d'avant Laravel 11), alors que `phpunit.xml`
ne surchargeait que `BROADCAST_CONNECTION`. La valeur de `.env`
(`BROADCAST_DRIVER=pusher`) restait donc active : chaque test déclenchant un
événement `ShouldBroadcastNow` — `ResourceChangedEvent`, dispatché à la création
d'un événement, d'un organisateur… — ouvrait une connexion HTTPS vers
`api-mt1.pusher.com` et échouait au hasard sur un timeout SSL. C'est ce qui
faisait « bouger » les échecs d'une exécution à l'autre. `BROADCAST_DRIVER=null`
a été ajouté.

**`RefundTicketActionTest` — test obsolète.** Il supposait un délai de
remboursement de 30 jours codé en dur, alors que la règle vient désormais de
`refund_days_before`, dont la colonne vaut `0` par défaut : aucune exception
n'était donc levée. Le test fixe maintenant explicitement la politique de
l'événement.
