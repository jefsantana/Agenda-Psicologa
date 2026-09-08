import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // O deploy roda com --base=/Agenda-Psicologa/. O plugin usa o `base`
      // resolvido do Vite para scope/start_url/id — não fixar caminho aqui.
      includeAssets: ['favicon.svg', 'pwa-maskable.svg', 'login-bg.webp'],
      manifest: {
        name: 'Espaço Raquel Fróis',
        short_name: 'Raquel Fróis',
        description: 'Agenda, prontuário e financeiro do consultório.',
        lang: 'pt-BR',
        dir: 'ltr',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0b0d10',
        background_color: '#0b0d10',
        categories: ['medical', 'productivity'],
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'pwa-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webp,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/supabase\.co/],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
