import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { authMiddlewarePlugin } from './server/middleware'
import { dataMiddlewarePlugin } from './server/dataMiddleware'
import { stripeMiddlewarePlugin } from './server/stripeMiddleware'

// Netlify and Render serve the app at the root domain — no subpath needed.
// (GitHub Pages used /calisthenies/ as a subpath.)
const base = '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    authMiddlewarePlugin,
    dataMiddlewarePlugin,
    stripeMiddlewarePlugin,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Calisthenics Tracker',
        short_name: 'Calisthenics',
        description: 'Suivi personnel d\'entraînement calisthénie',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
