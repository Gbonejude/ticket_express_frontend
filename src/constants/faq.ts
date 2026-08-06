/**
 * FAQ shown on every event page.
 *
 * This is editorial copy, not data: the API exposes no per-event FAQ, and
 * these four answers describe how the platform works rather than anything
 * specific to an event. It lives here — not in `mocks/` — because it is the
 * real, shipped content, and it stays correct with the backend connected.
 *
 * If the backend ever grows a per-event FAQ, this becomes the fallback for
 * events that define none.
 */
export interface FaqEntry {
  question: string
  answer: string
}

export const EVENT_FAQ: readonly FaqEntry[] = [
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
] as const
