import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { brand } from './src/config/brand.ts'
import { defaultTheme } from './src/config/themes.ts'

const BRAND_BG = defaultTheme.background

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "prompt": a new version waits until the operator taps "Update" (see PwaBar).
      registerType: 'prompt',
      includeAssets: ['brand/favicon.ico', 'brand/apple-touch-icon-180x180.png'],
      manifest: {
        name: brand.installName,
        short_name: brand.shortName,
        description: 'Make church birthday flyers in seconds.',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        theme_color: BRAND_BG,
        background_color: BRAND_BG,
        icons: [
          { src: 'brand/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'brand/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'brand/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'brand/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell, self-hosted fonts and every lazy chunk (including the background-removal runtime).
        globPatterns: ['**/*.{js,css,html,woff2,woff,png,svg,ico,webmanifest}'],
        // The model is ~100 MB: cached on first use (below), never precached.
        globIgnores: ['bgdata/**'],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Self-hosted model and WASM runtime (public/bgdata). Hashed file names never change.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.includes('/bgdata/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'bg-removal-model',
              expiration: { maxEntries: 60, purgeOnQuotaError: false },
              cacheableResponse: { statuses: [200] },
              rangeRequests: true,
            },
          },
          {
            // CDN fallback for the same files when public/bgdata is not deployed.
            // The background-removal model and WASM files. Large, versioned and immutable, so cache first.
            urlPattern: /^https:\/\/staticimgly\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bg-removal-model-cdn',
              expiration: { maxEntries: 60, purgeOnQuotaError: false },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
})
