import type { Aspect } from '../../config/layouts'
import type { Theme } from '../../config/themes'

export interface PhotoState {
  /** Cut-out image (transparent background), trimmed to its visible pixels. */
  url: string
  /** width / height of the trimmed cut-out. */
  aspect: number
  /** True when the photo has no transparency (a plain rectangle), so it needs heavier blending. */
  rect?: boolean
  /** 1 = default size. */
  scale: number
  /** Offsets as a fraction of canvas width / height. */
  offsetX: number
  offsetY: number
  flip: boolean
  /** How far the head rises into the headline, fraction of canvas height. Layout default when undefined. */
  overlap?: number
  /** Crop as a fraction of the cut-out's own size. */
  cropTop?: number
  cropRight?: number
  cropBottom?: number
  cropLeft?: number
}

export interface FlyerProps {
  /** "Pastor", "Dr", ... may be empty. */
  title: string
  /** "Daniel Bentley" */
  name: string
  /** ISO date, "2026-09-20". */
  date: string
  /** When set, replaces the formatted date (one line per row). */
  dateOverride?: string
  headlineText: string
  /** Font ids from config/fonts.ts. Defaults apply when omitted. */
  headlineFont?: string
  nameFont?: string
  /** Optional wish or verse above the logo. */
  wish?: string
  /** Church name printed under the logo. Defaults to brand.ts. */
  churchName?: string
  /** Photo treatment id (config/treatments.ts). Defaults to the theme's own. */
  treatmentId?: string
  theme: Theme
  aspect: Aspect
  photo?: PhotoState | null
  confettiSeed: number
  showConfetti: boolean
  showBlur: boolean
}
