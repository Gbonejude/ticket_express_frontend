import type { EventCategory, Event, Organizer, TicketType, Venue } from '@/types/event'
import type { Order, Ticket } from '@/types/order'
import type { User } from '@/types/user'

import { apiDate, inDays } from './helpers'

/**
 * Mock catalogue.
 *
 * Every record matches the domain types in `src/types/`, which are themselves a
 * transcription of the API resources — so these objects are byte-compatible
 * with what the backend will return. Content and imagery come from the Stitch
 * mockups; the images were downloaded into `public/mock/` so the app renders
 * identically offline.
 */

/**
 * Mock covers, served as WebP.
 *
 * Each file is sized to the slot it fills — 800 px for a card cover, 200 for
 * an avatar, 1200 for a full-bleed banner — which took the folder from 8 MB to
 * 1.6 MB. Real covers will come from the API, so this is a demo-data concern
 * only, but 8 MB made every page load feel broken on a phone.
 */
const img = (name: string) => `/mock/${name}.webp`

// --- Categories --------------------------------------------------------------

export const categories: EventCategory[] = [
  { id: 'cat_concert', name: 'Concert', slug: 'concert', eventsCount: 124 },
  { id: 'cat_culture', name: 'Culture', slug: 'culture', eventsCount: 31 },
  { id: 'cat_formation', name: 'Formation', slug: 'formation', eventsCount: 89 },
  { id: 'cat_soiree', name: 'Soirée', slug: 'soiree', eventsCount: 47 },
  { id: 'cat_tourisme', name: 'Tourisme', slug: 'tourisme', eventsCount: 18 },
  { id: 'cat_sport', name: 'Sport', slug: 'sport', eventsCount: 15 },
  { id: 'cat_festival', name: 'Festival', slug: 'festival', eventsCount: 42 },
  { id: 'cat_science', name: 'Science', slug: 'science', eventsCount: 22 },
  { id: 'cat_religieux', name: 'Religieux', slug: 'religieux', eventsCount: 9 },
  { id: 'cat_gastronomie', name: 'Gastronomie', slug: 'gastronomie', eventsCount: 26 },
]

// --- Venues ------------------------------------------------------------------

const venues: Venue[] = [
  {
    id: 'ven_amitie',
    name: 'Stade de Kégué',
    address: 'Boulevard Jean-Paul II',
    city: 'Lomé',
    country: 'Togo',
    capacity: 30000,
    latitude: 6.2058,
    longitude: 1.2103,
  },
  {
    id: 'ven_cicad',
    name: 'Palais des Congrès de Kara',
    address: 'Rue de l’Hôpital',
    city: 'Kara',
    country: 'Togo',
    capacity: 1500,
    latitude: 9.5511,
    longitude: 1.1861,
  },
  {
    id: 'ven_almadies',
    name: 'Espace Baguida',
    address: 'Route de Baguida',
    city: 'Baguida',
    country: 'Togo',
    capacity: 80,
    latitude: 6.1833,
    longitude: 1.3667,
  },
  {
    id: 'ven_arena',
    name: 'Stade Municipal de Lomé',
    address: 'Rue du Stade',
    city: 'Lomé',
    country: 'Togo',
    capacity: 15000,
    latitude: 6.1319,
    longitude: 1.22,
  },
  {
    id: 'ven_culture',
    name: 'Palais des Congrès de Lomé',
    address: 'Boulevard du 13 Janvier',
    city: 'Lomé',
    country: 'Togo',
    capacity: 3500,
    latitude: 6.1298,
    longitude: 1.2205,
  },
  {
    id: 'ven_odc',
    name: 'Institut Français du Togo',
    address: 'Rue de la Marina',
    city: 'Lomé',
    country: 'Togo',
    capacity: 200,
    latitude: 6.1275,
    longitude: 1.2225,
  },
  {
    id: 'ven_ahidjo',
    name: 'Stade de Kara',
    address: 'Boulevard Eyadéma',
    city: 'Kara',
    country: 'Togo',
    capacity: 20000,
    latitude: 9.545,
    longitude: 1.19,
  },
  {
    id: 'ven_nations',
    name: 'Place de l’Indépendance',
    address: 'Avenue de la Libération',
    city: 'Lomé',
    country: 'Togo',
    capacity: 5000,
    latitude: 6.1319,
    longitude: 1.2228,
  },
  {
    id: 'ven_sofitel',
    name: 'Hôtel Sarakawa',
    address: 'Boulevard du Mono',
    city: 'Lomé',
    country: 'Togo',
    capacity: 300,
    latitude: 6.123,
    longitude: 1.268,
  },
]

// --- Organizers --------------------------------------------------------------

function organizer(
  id: string,
  companyName: string,
  description: string,
  logo: string | null = null,
  eventsCount = 12,
): Organizer {
  return {
    id,
    userId: `usr_${id}`,
    companyName,
    description,
    logo,
    logoThumbnail: logo,
    website: null,
    status: 'active',
    statusLabel: 'Actif',
    isActive: true,
    eventsCount,

    // Mirrors what `GET /organizers/{id}` eager-loads: the contact details of
    // the account behind the organiser.
    user: {
      id: `usr_${id}`,
      firstName: companyName.split(' ')[0] ?? companyName,
      lastName: '',
      fullName: companyName,
      email: `contact@${id.replace('org_', '')}.tg`,
      phone: '+228 90 12 34 56',
      role: 'organizer-manager',
    },
  }
}

export const organizers: Organizer[] = [
  organizer(
    'org_afrobeat',
    'Lomé Vibes',
    'Collectif de production musicale spécialisé dans les grands rassemblements afrobeats.',
    img('avatar-org-1'),
    12,
  ),
  organizer(
    'org_digitalhub',
    'Art & Culture Lab',
    'Expositions, résidences d’artistes et rencontres culturelles depuis 2015.',
    img('avatar-org-2'),
    8,
  ),
  organizer(
    'org_livenation',
    'Live Nation Togo',
    'Producteur des plus grandes tournées passant par le Togo.',
    img('avatar-org-3'),
    24,
  ),
  organizer(
    'org_impact',
    'Impact Global',
    'Conférences et sommets professionnels à destination des entreprises.',
    img('avatar-org-4'),
    5,
  ),
  organizer(
    'org_showtime',
    'Showtime Lomé',
    'Spectacles vivants, humour et théâtre dans toute la région maritime.',
    img('avatar-org-5'),
    14,
  ),
  organizer(
    'org_gastro',
    'Group Pro Events',
    'Festivals culinaires, salons et événements de plein air.',
    img('avatar-org-6'),
    19,
  ),
]

// --- Ticket types ------------------------------------------------------------

interface TicketTypeSeed {
  name: string
  description?: string
  price: number
  promotionalPrice?: number
  quantity: number
  soldQuantity: number
  benefits?: string[]
  featured?: boolean
}

function buildTicketTypes(eventId: string, seeds: TicketTypeSeed[]): TicketType[] {
  return seeds.map((seed, index) => {
    const available = seed.quantity - seed.soldQuantity
    const soldPercentage = Math.round((seed.soldQuantity / seed.quantity) * 100)
    const hasPromotion = seed.promotionalPrice !== undefined

    const status =
      available === 0
        ? ('sold_out' as const)
        : available / seed.quantity <= 0.1
          ? ('almost_sold_out' as const)
          : available / seed.quantity <= 0.3
            ? ('limited' as const)
            : ('available' as const)

    const labels = {
      available: 'Disponible',
      limited: 'Stock limité',
      almost_sold_out: 'Dernières places',
      sold_out: 'Complet',
      not_started: 'Bientôt en vente',
      ended: 'Vente terminée',
    }

    const colors = {
      available: 'success',
      limited: 'warning',
      almost_sold_out: 'warning',
      sold_out: 'error',
      not_started: 'info',
      ended: 'neutral',
    }

    return {
      id: `${eventId}_tt${index + 1}`,
      eventId,
      occurrenceId: null,
      name: seed.name,
      description: seed.description ?? null,
      locationDetails: null,
      benefits: seed.benefits ?? [],
      isFeatured: seed.featured ?? false,
      sortOrder: index,

      price: seed.price,
      promotionalPrice: seed.promotionalPrice ?? null,
      currentPrice: seed.promotionalPrice ?? seed.price,
      hasActivePromotion: hasPromotion,
      discountPercentage: hasPromotion
        ? Math.round(((seed.price - seed.promotionalPrice!) / seed.price) * 100)
        : null,
      promotionStartDate: hasPromotion ? apiDate(inDays(-10)) : null,
      promotionEndDate: hasPromotion ? apiDate(inDays(10)) : null,

      quantity: seed.quantity,
      soldQuantity: seed.soldQuantity,
      availableQuantity: available,
      remainingTickets: available,
      soldPercentage,
      availabilityPercentage: 100 - soldPercentage,

      availabilityStatus: status,
      availabilityStatusLabel: labels[status],
      availabilityStatusColor: colors[status],
      isAvailableForPurchase: available > 0,
      urgencyLevel: status === 'almost_sold_out' ? 'high' : 'normal',

      saleStartDate: apiDate(inDays(-30)),
      saleEndDate: null,
    }
  })
}

// --- Events ------------------------------------------------------------------

interface EventSeed {
  id: string
  title: string
  description: string
  banner: string
  categoryId: string
  organizerId: string
  venueId: string
  startsIn: number
  hour?: number
  favoritesCount?: number
  averageRating?: number
  tickets: TicketTypeSeed[]
}

const seeds: EventSeed[] = [
  {
    id: 'evt_concert_ete',
    title: "Grand Concert Annuel de l'Été",
    description:
      "La plus grande célébration afrobeats de la sous-région revient pour une nuit entière. Trois scènes, vingt artistes, et un village gastronomique ouvert dès 18 h. Une production Afrobeat Nation, pensée pour faire vibrer le Stade de l'Amitié du premier au dernier morceau.",
    banner: img('event-concert-live'),
    categoryId: 'cat_concert',
    organizerId: 'org_afrobeat',
    venueId: 'ven_amitie',
    startsIn: 21,
    favoritesCount: 1240,
    averageRating: 4.8,
    tickets: [
      {
        name: 'Entrée générale',
        description: 'Accès à toutes les scènes principales et au village gastronomique.',
        price: 20000,
        promotionalPrice: 15000,
        quantity: 4000,
        soldQuantity: 1800,
        benefits: ['Accès aux 3 scènes', 'Village gastronomique'],
      },
      {
        name: 'VIP Experience',
        description: 'Tribune surélevée, bar dédié et accès au backstage.',
        price: 75000,
        quantity: 300,
        soldQuantity: 285,
        featured: true,
        benefits: ['Tribune VIP', 'Bar dédié', 'Accès backstage', 'Parking réservé'],
      },
    ],
  },
  {
    id: 'evt_sommet_tech',
    title: 'Sommet Tech & Innovation',
    description:
      "Trois jours de conférences, d'ateliers et de rencontres autour de l'innovation africaine. Plus de soixante intervenants venus de douze pays, et un espace de démonstration ouvert aux startups de la région.",
    banner: img('event-tech'),
    categoryId: 'cat_science',
    organizerId: 'org_digitalhub',
    venueId: 'ven_cicad',
    startsIn: 48,
    hour: 9,
    favoritesCount: 320,
    averageRating: 4.6,
    tickets: [
      {
        name: 'Pass unique 3 jours',
        description: 'Accès à toutes les conférences et ateliers, déjeuners inclus.',
        price: 50000,
        quantity: 900,
        soldQuantity: 840,
        benefits: ['3 jours de conférences', 'Déjeuners inclus', 'Accès à la plateforme replay'],
      },
    ],
  },
  {
    id: 'evt_atelier_peinture',
    title: 'Atelier Peinture & Vin',
    description:
      "Une soirée créative en petit comité : deux heures de peinture guidée par un artiste, un verre à la main. Tout le matériel est fourni, aucune expérience n'est nécessaire.",
    banner: img('event-expo'),
    categoryId: 'cat_formation',
    organizerId: 'org_showtime',
    venueId: 'ven_almadies',
    startsIn: 6,
    hour: 19,
    favoritesCount: 96,
    averageRating: 4.9,
    tickets: [
      {
        name: 'Place individuelle',
        description: 'Matériel, toile et première consommation compris.',
        price: 25000,
        quantity: 40,
        soldQuantity: 22,
        benefits: ['Matériel fourni', 'Toile à emporter', 'Un verre offert'],
      },
    ],
  },
  {
    id: 'evt_finales_basket',
    title: 'Finales de Championnat',
    description:
      "Les deux meilleures équipes du championnat s'affrontent en match unique. Ouverture des portes deux heures avant le coup d'envoi, animations et village partenaires sur l'esplanade.",
    banner: img('event-arena'),
    categoryId: 'cat_sport',
    organizerId: 'org_livenation',
    venueId: 'ven_arena',
    startsIn: 12,
    hour: 17,
    favoritesCount: 780,
    averageRating: 4.5,
    tickets: [
      {
        name: 'Siège tribune',
        price: 5000,
        quantity: 12000,
        soldQuantity: 5400,
      },
      {
        name: 'Carré or',
        description: 'Places centrales au bord du terrain.',
        price: 25000,
        quantity: 500,
        soldQuantity: 500,
      },
    ],
  },
  {
    id: 'evt_afrobeats_sunset',
    title: 'Afrobeats Sunset Live 2024',
    description:
      "Coucher de soleil, sound system et line-up panafricain. Une édition en plein air pensée comme un long crescendo, du DJ set d'ouverture au grand final sur la scène principale.",
    banner: img('event-festival'),
    categoryId: 'cat_festival',
    organizerId: 'org_impact',
    venueId: 'ven_culture',
    startsIn: 34,
    favoritesCount: 2100,
    averageRating: 4.7,
    tickets: [
      {
        name: 'General Admission',
        description: 'Standard entry, access to all main stages and food courts.',
        price: 15000,
        promotionalPrice: 12000,
        quantity: 3000,
        soldQuantity: 1200,
        benefits: ['Accès scènes principales', 'Food court'],
      },
      {
        name: 'VIP Experience',
        description: 'Espace surélevé, service au bar et accès prioritaire.',
        price: 45000,
        quantity: 400,
        soldQuantity: 370,
        featured: true,
        benefits: ['Espace VIP', 'Accès prioritaire', 'Vestiaire inclus'],
      },
    ],
  },
  {
    id: 'evt_jazz_wine',
    title: 'Jazz & Wine Night Expo',
    description:
      "Quatuor de jazz en formation acoustique, accompagné d'une sélection de vins commentée. Une soirée à taille humaine dans le salon du Sofitel Teranga.",
    banner: img('event-jazz'),
    categoryId: 'cat_concert',
    organizerId: 'org_impact',
    venueId: 'ven_sofitel',
    startsIn: 27,
    hour: 19,
    favoritesCount: 210,
    averageRating: 4.4,
    tickets: [
      {
        name: 'Place assise',
        price: 30000,
        quantity: 250,
        soldQuantity: 90,
        benefits: ['Dégustation commentée'],
      },
    ],
  },
  {
    id: 'evt_uiux_master',
    title: 'UI/UX Design Masterclass',
    description:
      "Une journée intensive sur les fondamentaux du design d'interface : recherche utilisateur, systèmes de composants et prototypage. Ordinateur portable requis.",
    banner: img('event-conference'),
    categoryId: 'cat_formation',
    organizerId: 'org_digitalhub',
    venueId: 'ven_odc',
    startsIn: 39,
    hour: 9,
    favoritesCount: 145,
    averageRating: 4.8,
    tickets: [
      {
        name: 'Participation',
        description: 'Support de cours et certificat de participation inclus.',
        price: 40000,
        quantity: 60,
        soldQuantity: 47,
        benefits: ['Support de cours', 'Certificat'],
      },
    ],
  },
  {
    id: 'evt_derby',
    title: 'Derby Régional : Lions vs Aigles',
    description:
      "Le derby le plus attendu de la saison. Guichets ouverts trois heures avant le coup d'envoi, animations d'avant-match sur le parvis.",
    banner: img('event-football'),
    categoryId: 'cat_sport',
    organizerId: 'org_livenation',
    venueId: 'ven_ahidjo',
    startsIn: 31,
    hour: 15,
    favoritesCount: 640,
    averageRating: 4.3,
    tickets: [
      { name: 'Virage', price: 3000, quantity: 20000, soldQuantity: 9000 },
      { name: 'Tribune couverte', price: 10000, quantity: 6000, soldQuantity: 5700 },
    ],
  },
  {
    id: 'evt_street_food',
    title: 'Gastro Street Food Festival',
    description:
      'Quarante stands, six pays représentés et une scène acoustique en continu. Entrée libre pour les moins de douze ans accompagnés.',
    banner: img('event-gastro'),
    categoryId: 'cat_festival',
    organizerId: 'org_gastro',
    venueId: 'ven_nations',
    startsIn: 44,
    hour: 11,
    favoritesCount: 410,
    averageRating: 4.6,
    tickets: [{ name: 'Entrée', price: 0, quantity: 5000, soldQuantity: 1300 }],
  },
  {
    id: 'evt_retrospective_art',
    title: 'Rétrospective Art Moderne',
    description:
      'Cinquante œuvres rassemblées pour la première fois, avec visite guidée toutes les heures et catalogue disponible sur place.',
    banner: img('event-art-digital'),
    categoryId: 'cat_culture',
    organizerId: 'org_showtime',
    venueId: 'ven_culture',
    startsIn: 58,
    hour: 10,
    favoritesCount: 180,
    averageRating: 4.5,
    tickets: [{ name: 'Visite libre', price: 8000, quantity: 900, soldQuantity: 300 }],
  },
  {
    id: 'evt_opera_digital',
    title: 'Opéra Digital Expérience',
    description:
      'Une relecture scénographique où projection holographique et chant lyrique se répondent. Durée : 1 h 40 sans entracte.',
    banner: img('event-theatre'),
    categoryId: 'cat_culture',
    organizerId: 'org_impact',
    venueId: 'ven_culture',
    startsIn: 72,
    hour: 20,
    favoritesCount: 260,
    averageRating: 4.7,
    tickets: [
      { name: 'Orchestre', price: 18000, quantity: 600, soldQuantity: 210 },
      { name: 'Balcon', price: 12000, quantity: 400, soldQuantity: 160 },
    ],
  },
  {
    id: 'evt_web3',
    title: 'Web3 Global Summit',
    description:
      'Rencontres, keynotes et sessions techniques autour des infrastructures décentralisées et de leurs usages sur le continent.',
    banner: img('event-business'),
    categoryId: 'cat_science',
    organizerId: 'org_digitalhub',
    venueId: 'ven_cicad',
    startsIn: 65,
    hour: 9,
    favoritesCount: 340,
    averageRating: 4.4,
    tickets: [{ name: 'Pass conférence', price: 60000, quantity: 700, soldQuantity: 250 }],
  },
]

function buildEvent(seed: EventSeed): Event {
  const ticketTypes = buildTicketTypes(seed.id, seed.tickets)
  const start = inDays(seed.startsIn, seed.hour ?? 20)

  return {
    id: seed.id,
    organizerId: seed.organizerId,
    categoryId: seed.categoryId,
    venueId: seed.venueId,
    title: seed.title,
    slug: seed.id.replace('evt_', '').replace(/_/g, '-'),
    description: seed.description,
    banner: seed.banner,
    bannerThumbnail: seed.banner,
    startDate: apiDate(start),
    endDate: apiDate(inDays(seed.startsIn, (seed.hour ?? 20) + 4)),
    maxAttendees: null,
    status: 'published',
    statusLabel: 'Publié',
    eventType: 'physical',
    eventTypeLabel: 'En présentiel',
    onlineUrl: null,
    refundAllowed: true,
    refundDaysBefore: 7,

    organizer: organizers.find((entry) => entry.id === seed.organizerId),
    category: categories.find((entry) => entry.id === seed.categoryId),
    venue: venues.find((entry) => entry.id === seed.venueId),
    ticketTypes,

    ticketTypesCount: ticketTypes.length,
    reviewsCount: Math.round((seed.favoritesCount ?? 0) / 12),
    favoritesCount: seed.favoritesCount ?? 0,
    averageRating: seed.averageRating,

    createdAt: apiDate(inDays(-60)),
    updatedAt: apiDate(inDays(-2)),
  }
}

export const events: Event[] = seeds.map(buildEvent)

/** Ids promoted in the "Événements en Vedette" row of the home page. */
export const featuredEventIds = [
  'evt_concert_ete',
  'evt_sommet_tech',
  'evt_atelier_peinture',
  'evt_finales_basket',
]

/** Ids the signed-in mock user has favourited. */
export const favoriteEventIds = ['evt_retrospective_art', 'evt_opera_digital', 'evt_jazz_wine']

// --- Session -----------------------------------------------------------------

export const currentUser: User = {
  id: 'usr_alex',
  firstName: 'Alex',
  lastName: 'Dupont',
  fullName: 'Alex Dupont',
  email: 'alex.dupont@example.com',
  phone: '+228 90 12 34 56',
  image: img('avatar-user'),
  role: 'client',
  createdAt: apiDate(inDays(-420)),
}

// --- Orders and tickets ------------------------------------------------------

interface OrderSeed {
  id: string
  number: string
  eventId: string
  ticketTypeIndex: number
  quantity: number
  daysAgo: number
  status: Order['status']
}

const orderSeeds: OrderSeed[] = [
  {
    id: 'ord_1',
    number: 'TX-2024-0912',
    eventId: 'evt_afrobeats_sunset',
    ticketTypeIndex: 0,
    quantity: 2,
    daysAgo: 4,
    status: 'paid',
  },
  {
    id: 'ord_2',
    number: 'TX-2024-0876',
    eventId: 'evt_uiux_master',
    ticketTypeIndex: 0,
    quantity: 1,
    daysAgo: 18,
    status: 'paid',
  },
  {
    id: 'ord_3',
    number: 'TX-2024-0791',
    eventId: 'evt_derby',
    ticketTypeIndex: 0,
    quantity: 3,
    daysAgo: 32,
    status: 'cancelled',
  },
  {
    id: 'ord_4',
    number: 'TX-2024-0742',
    eventId: 'evt_jazz_wine',
    ticketTypeIndex: 0,
    quantity: 2,
    daysAgo: 45,
    status: 'pending',
  },
  {
    id: 'ord_5',
    number: 'TX-2024-0688',
    eventId: 'evt_street_food',
    ticketTypeIndex: 0,
    quantity: 4,
    daysAgo: 61,
    status: 'refunded',
  },
]

const statusLabels: Record<Order['status'], string> = {
  pending: 'En attente',
  paid: 'Payée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
  failed: 'Échouée',
}

function buildOrder(seed: OrderSeed): Order {
  const event = events.find((entry) => entry.id === seed.eventId)!
  const ticketType = event.ticketTypes![seed.ticketTypeIndex]!
  const subtotal = ticketType.currentPrice * seed.quantity
  const commissionRate = 0.05
  const commissionAmount = Math.round(subtotal * commissionRate)

  const tickets: Ticket[] = Array.from({ length: seed.quantity }, (_, index) => ({
    id: `${seed.id}_tk${index + 1}`,
    orderId: seed.id,
    ticketTypeId: ticketType.id,
    attendeeName: currentUser.fullName,
    attendeeEmail: currentUser.email,
    qrCode: `${seed.number}-${String(index + 1).padStart(2, '0')}`,
    ticketNumber: `${seed.number}-${String(index + 1).padStart(2, '0')}`,
    status:
      seed.status === 'paid' ? 'valid' : seed.status === 'refunded' ? 'refunded' : 'cancelled',
    statusLabel:
      seed.status === 'paid' ? 'Valide' : seed.status === 'refunded' ? 'Remboursé' : 'Annulé',
    checkedInAt: null,
    isCheckedIn: false,
    accessMethod: 'Présentation du QR code à l’entrée',
    isOnlineAccess: false,
    isPhysicalAccess: true,
    onlineAccessLink: null,
    ticketType,
  }))

  return {
    id: seed.id,
    orderNumber: seed.number,
    userId: currentUser.id,
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    fullName: currentUser.fullName,
    email: currentUser.email ?? '',
    phone: currentUser.phone ?? '',
    totalAmount: subtotal + commissionAmount,
    commissionRate,
    commissionAmount,
    netAmount: subtotal,
    status: seed.status,
    statusLabel: statusLabels[seed.status],
    paymentMethod: 'FLOOZ',
    deliveryMethod: 'download',
    deliveryMethodLabel: 'Téléchargement',
    downloads:
      seed.status === 'paid'
        ? {
            downloadUrl: '#',
            qrImageUrls: [],
            whatsappLink: null,
            expiresAt: apiDate(inDays(30)),
            downloadCount: 0,
            maxDownloads: 5,
            isValid: true,
            isExpired: false,
          }
        : null,
    items: [
      {
        id: `${seed.id}_it1`,
        orderId: seed.id,
        ticketTypeId: ticketType.id,
        quantity: seed.quantity,
        unitPrice: ticketType.currentPrice,
        subtotal,
        ticketType,
      },
    ],
    tickets,
    itemsCount: 1,
    ticketsCount: seed.quantity,
    createdAt: apiDate(inDays(-seed.daysAgo, 14, 30)),
    updatedAt: apiDate(inDays(-seed.daysAgo, 14, 35)),
  }
}

export const orders: Order[] = orderSeeds.map(buildOrder)

/** Event behind an order, resolved for the ticket and history screens. */
export function eventOfOrder(order: Order): Event {
  const ticketTypeId = order.items?.[0]?.ticketTypeId

  return events.find((event) => event.ticketTypes?.some((type) => type.id === ticketTypeId))!
}

// --- Dashboard ---------------------------------------------------------------

export interface ActivityEntry {
  id: string
  icon: 'shopping_cart' | 'favorite' | 'check_circle'
  label: string
  target: string
  at: string
}

/**
 * FAQ shown on every event page.
 *
 * Static for now because the API exposes no per-event FAQ; when it does, this
 * moves behind `dataSource.events.faq(id)` and the page is unchanged.
 */
export const eventFaq = [
  {
    question: 'Quels sont les moyens de paiement disponibles ?',
    answer:
      'Le paiement se fait par mobile money : Mixx by Yas (ex T-Money) et Moov Money (Flooz). Le montant est débité depuis votre numéro après confirmation par code.',
  },
  {
    question: 'Comment puis-je accéder à mes tickets après l’achat ?',
    answer:
      'Au moment du paiement, vous choisissez de recevoir votre billet par e-mail, par WhatsApp, ou par les deux. Si vous avez un compte, il reste aussi disponible à tout moment dans « Mes billets ».',
  },
  {
    question: 'Comment valider mon ticket le jour J ?',
    answer:
      'Pour un événement sur place, présentez le QR code de votre billet — sur votre téléphone ou imprimé — à l’entrée, où il sera scanné. Pour un événement en ligne, aucun QR code n’est nécessaire : votre billet contient un lien d’accès personnel, actif à l’heure de début et utilisable depuis un seul appareil à la fois.',
  },
  {
    question: 'Puis-je me faire rembourser ?',
    answer:
      'Le remboursement dépend des conditions fixées par l’organisateur, indiquées sur la page de l’événement. La demande se fait depuis l’historique de vos commandes.',
  },
]

export const recentActivity: ActivityEntry[] = [
  {
    id: 'act_1',
    icon: 'shopping_cart',
    label: 'Achat de 2 billets pour',
    target: 'Afrobeats Sunset Live 2024',
    at: 'Il y a 2 heures',
  },
  {
    id: 'act_2',
    icon: 'favorite',
    label: 'Ajouté à vos favoris :',
    target: 'Rétrospective Art Moderne',
    at: 'Hier, 14:30',
  },
  {
    id: 'act_3',
    icon: 'check_circle',
    label: 'Billet scanné avec succès :',
    target: 'UI/UX Design Masterclass',
    at: 'Samedi dernier',
  },
]
