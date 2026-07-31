import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

/**
 * Test configuration, kept separate from `vite.config.ts`.
 *
 * The app config loads `vite-plugin-vue-devtools` and reads env files to pick a
 * dev-server port — neither is wanted in a test run, and the devtools plugin
 * injects scripts that have no place in jsdom.
 */
export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  test: {
    // Components and stores touch `document` and `localStorage`.
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/**/*.{test,spec}.ts',
        'src/__tests__/**',
        'src/main.ts',
        // Type-only modules and barrel files compile away to nothing.
        'src/types/**',
        'src/**/index.ts',
        // Placeholders, replaced during the functional phase.
        'src/pages/**',
      ],
    },
  },

  define: {
    // `import.meta.env` values the modules read at import time.
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://api.test/api/v1'),
    'import.meta.env.VITE_APP_NAME': JSON.stringify('Ticket Express'),
    'import.meta.env.VITE_APP_CURRENCY': JSON.stringify('XOF'),
    'import.meta.env.VITE_APP_LOCALE': JSON.stringify('fr-FR'),
  },
})
