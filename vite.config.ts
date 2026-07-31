import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Only VITE_-prefixed variables are exposed to the client bundle; the ones
  // read here are used to configure the dev server itself.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), vueDevTools()],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    server: {
      port: Number(env.VITE_DEV_PORT ?? 5173),
      strictPort: false,
      // The API is called directly through VITE_API_BASE_URL. A proxy is only
      // needed if the backend cannot enable CORS for the dev origin; in that
      // case set VITE_API_BASE_URL=/api/v1 and uncomment the block below.
      // proxy: {
      //   '/api': {
      //     target: env.VITE_API_PROXY_TARGET ?? 'http://localhost:8000',
      //     changeOrigin: true,
      //   },
      // },
    },

    preview: {
      port: 4173,
    },

    build: {
      target: 'es2022',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          // Keep the framework in its own long-lived cache entry so app code
          // can ship often without invalidating it. Rolldown only accepts the
          // function form, hence the module-id test rather than a map.
          manualChunks(id: string) {
            if (id.includes('node_modules')) return 'vendor'

            return null
          },
        },
      },
    },
  }
})
