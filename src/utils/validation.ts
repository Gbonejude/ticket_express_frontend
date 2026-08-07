/**
 * Validation côté client des formulaires d'authentification.
 *
 * Le navigateur sait déjà refuser un champ `required`, mais il le fait à sa
 * façon : une bulle native, dans la langue du navigateur et non celle du site,
 * qui disparaît au premier clic et ne laisse aucune trace de quel champ est en
 * cause. Elle bloque aussi la soumission avant que le code ne voie quoi que ce
 * soit, donc impossible de marquer le champ.
 *
 * Ces règles produisent la **même forme** que les erreurs de l'API —
 * `Record<string, string[]>` — pour que les deux origines s'affichent par le
 * même chemin dans le gabarit : cadre rouge sur le champ, message dessous. Sans
 * cela il faudrait deux rendus d'erreur par champ.
 *
 * Les messages reprennent la formulation du back-office (« Titre est
 * obligatoire. »), sans article : le genre du libellé n'est pas connu ici et
 * « Le Description » serait fautif.
 */

/** Erreurs par champ, indexées comme les `errors` d'une réponse 422. */
export type FieldErrors = Record<string, string[]>

/** Une règle rend le message d'erreur, ou `null` quand la valeur passe. */
export type Rule = () => string | null

export function required(value: string | boolean, field: string): string | null {
  const isFilled = typeof value === 'boolean' ? value : value.trim().length > 0

  return isFilled ? null : `${field} est obligatoire.`
}

/**
 * Forme d'une adresse e-mail.
 *
 * Volontairement permissif — une adresse ne se valide vraiment qu'en écrivant
 * dessus, et l'API a sa propre vérification, plus stricte. Le but ici est
 * d'attraper la faute de frappe évidente (« jean@ », pas de point) avant un
 * aller-retour réseau, pas de trancher les cas limites de la RFC.
 */
export function email(value: string, field = 'Adresse e-mail'): string | null {
  if (value.trim().length === 0) return `${field} est obligatoire.`

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
    ? null
    : 'Cette adresse e-mail n’est pas valide.'
}

export function minLength(value: string, length: number, field: string): string | null {
  if (value.length === 0) return `${field} est obligatoire.`

  return value.length >= length ? null : `${field} doit contenir au moins ${length} caractères.`
}

export function sameAs(value: string, other: string, message: string): string | null {
  return value === other ? null : message
}

/**
 * Applique les règles et rend les erreurs trouvées.
 *
 * Une seule règle par champ est retenue : empiler « obligatoire » et « format
 * invalide » sous un champ vide n'apprend rien de plus, et la première est
 * toujours celle à corriger.
 */
export function validate(rules: Record<string, Rule>): FieldErrors {
  const errors: FieldErrors = {}

  for (const [field, rule] of Object.entries(rules)) {
    const message = rule()

    if (message !== null) errors[field] = [message]
  }

  return errors
}
