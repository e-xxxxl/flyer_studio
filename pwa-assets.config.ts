import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Must match the colour used in scripts/make-icon-source.mjs and the manifest background_color.
const BRAND_BG = '#1f0606'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: BRAND_BG, fit: 'contain' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: BRAND_BG, fit: 'contain' } },
  },
  images: ['public/brand/icon-source.png'],
})
