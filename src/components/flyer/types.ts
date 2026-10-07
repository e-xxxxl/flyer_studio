import type { Aspect } from '../../config/layouts'
import type { Theme } from '../../config/themes'

export interface PhotoState {
  /** Cut-out image (transparent background), trimmed to its visible pixels. */
  url: string
  /** width / height of the trimmed cut-out. */
  aspect: number
  /** 1 = default size. */
  scale: number
  /** Offsets as a fraction of canvas width / height. */
  offsetX: number
  offsetY: number
  flip: boolean
  /** How far the head rises into the headline, fraction of canvas height. Layout default when undefined. */
  overlap?: number
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
  theme: Theme
  aspect: Aspect
  photo?: PhotoState | null
  confettiSeed: number
  showConfetti: boolean
  showBlur: boolean
}
