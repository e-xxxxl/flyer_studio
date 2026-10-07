/**
 * Church branding. Swap public/brand/logo.png (and optionally logo-light.png)
 * to change the logo; edit this file to change names. No other code changes needed.
 */
export interface Brand {
  /** Printed under the logo on every flyer (unless the logo already contains the name). */
  churchName: string
  /** Same-origin path to the logo, so it never taints the export canvas. */
  logoPath: string
  /** Optional light version used on dark artwork. Falls back to a recolor of logoPath. */
  logoLightPath: string
  /** What the supplied logo.png looks like. "auto" detects it from the pixels. */
  logoVariant: 'auto' | 'light' | 'dark'
  /** Set true if the logo image already includes the church name. */
  logoIncludesName: boolean
  /** PWA name shown on the home screen / install prompt. */
  installName: string
  shortName: string
}

// Optional chaining: vite.config.ts also imports this file, outside Vite's runtime.
const base = import.meta.env?.BASE_URL ?? '/'

export const brand: Brand = {
  churchName: 'Celebration Church',
  logoPath: `${base}brand/logo.png`,
  logoLightPath: `${base}brand/logo-light.png`,
  logoVariant: 'auto',
  logoIncludesName: false,
  installName: 'Celebration Church Flyer Studio',
  shortName: 'CC Flyers',
}
