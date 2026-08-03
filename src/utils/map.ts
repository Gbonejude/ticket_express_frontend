/**
 * Map helpers.
 *
 * The maps are OpenStreetMap embeds rather than Google Maps: the Google
 * Embed API needs a billed key, which a public front end cannot hold without
 * leaking it. OSM renders the same place from coordinates alone, and the
 * "Itinéraire" links still open Google Maps, where most people navigate.
 *
 * Screenshots were the previous approach and were plainly wrong — one picture
 * of Abidjan stood in for every venue, whatever the city.
 */

/** Head office. Baguida sits on the coast, east of Lomé. */
export const HEAD_OFFICE = {
  name: 'TicketExpress Baguida',
  address: 'Route de Baguida, Baguida',
  city: 'Baguida',
  country: 'Togo',
  latitude: 6.1833,
  longitude: 1.3667,
} as const

/**
 * Embeddable OSM map centred on a point.
 *
 * `span` is the half-width of the viewport in degrees: 0.01 ≈ 1 km, which
 * frames a venue without losing the surrounding streets.
 */
export function osmEmbedUrl(latitude: number, longitude: number, span = 0.01): string {
  const bbox = [longitude - span, latitude - span, longitude + span, latitude + span].join(',')

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`
}

/** Google Maps directions, by coordinates when known and by name otherwise. */
export function directionsUrl(
  query: string,
  point?: { latitude: number | null; longitude: number | null } | null,
): string {
  const target =
    point?.latitude != null && point.longitude != null
      ? `${point.latitude},${point.longitude}`
      : query

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target)}`
}
