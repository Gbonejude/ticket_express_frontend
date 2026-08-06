/// <reference types="vite/client" />

/**
 * Typed contract for the environment variables exposed to the client bundle.
 * Every variable declared here must also exist in `.env.example`.
 */
interface ImportMetaEnv {
  /** Base URL of the TicketExpress API, including the version segment. */
  readonly VITE_API_BASE_URL: string
  /** Request timeout in milliseconds, as a string (env values are always strings). */
  readonly VITE_API_TIMEOUT?: string
  /** Public application name, used in titles and metadata. */
  readonly VITE_APP_NAME: string
  /** Canonical public URL of the site (used for absolute links / share URLs). */
  readonly VITE_APP_URL?: string
  /** ISO 4217 currency code used to format prices. */
  readonly VITE_APP_CURRENCY?: string
  /** BCP 47 locale used to format dates and numbers. */
  readonly VITE_APP_LOCALE?: string
  /** Login URL of TicketExpress-dashboard, where approved organizers are sent. */
  readonly VITE_DASHBOARD_URL?: string
  /** Dev server port. Read by vite.config.ts, not by application code. */
  readonly VITE_DEV_PORT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
