import { DEFAULT_HEADLINE_FONT, DEFAULT_NAME_FONT } from '../config/fonts'
import type { Aspect } from '../config/layouts'
import { CUSTOM_THEME_ID, defaultTheme, themes, type Theme, type ThemeColorKey } from '../config/themes'
import { DEFAULT_TREATMENT } from '../config/treatments'
import { todayIso } from './date'

export type ThemeColors = Pick<Theme, ThemeColorKey>

export interface SavedTheme {
  id: string
  label: string
  colors: ThemeColors
  treatment?: string
}

export interface PhotoAdjust {
  scale: number
  offsetX: number
  offsetY: number
  flip: boolean
  /** undefined = layout default */
  overlap?: number
  /** Crop, as a fraction of the cut-out's own size. */
  cropTop: number
  cropRight: number
  cropBottom: number
  cropLeft: number
}

/** Everything that defines one flyer (except the photo pixels). */
export interface Settings {
  title: string
  name: string
  date: string
  useCustomDate: boolean
  dateOverride: string
  headlineText: string
  /** Optional wish or verse printed above the logo. */
  wish: string
  headlineFont: string
  nameFont: string
  themeId: string
  /** The colours in use when themeId is "custom", and a snapshot of the last picked theme. */
  customColors: ThemeColors
  /** Photo blend override; undefined = the template's own treatment. */
  treatmentId?: string
  aspect: Aspect
  showConfetti: boolean
  showBlur: boolean
  confettiSeed: number
  skipRemoval: boolean
  photo: PhotoAdjust
}

export const TITLES = ['', 'Pastor', 'Deacon', 'Deaconess', 'Minister', 'Mrs', 'Mr', 'Dr', 'Evangelist', 'Elder']

export const defaultPhotoAdjust: PhotoAdjust = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  flip: false,
  cropTop: 0,
  cropRight: 0,
  cropBottom: 0,
  cropLeft: 0,
}

export function colorsOf(t: Theme): ThemeColors {
  const { background, glow, panelFrom, panelTo, headline, name, date, confetti } = t
  return { background, glow, panelFrom, panelTo, headline, name, date, confetti }
}

/** Options the operator tends to keep between flyers. */
export interface Prefs {
  headlineFont: string
  nameFont: string
  aspect: Aspect
  showConfetti: boolean
  showBlur: boolean
  skipRemoval: boolean
}

export const defaultPrefs: Prefs = {
  headlineFont: DEFAULT_HEADLINE_FONT,
  nameFont: DEFAULT_NAME_FONT,
  aspect: '4:5',
  showConfetti: true,
  showBlur: true,
  skipRemoval: false,
}

export interface NewFlyerOptions {
  themeId?: string
  wish?: string
  prefs?: Prefs
  title?: string
  name?: string
  date?: string
}

export function newSettings(o: NewFlyerOptions = {}, savedThemes: SavedTheme[] = []): Settings {
  const prefs = o.prefs ?? defaultPrefs
  const base = resolveThemeById(o.themeId ?? defaultTheme.id, savedThemes) ?? defaultTheme
  return {
    title: o.title ?? 'Pastor',
    name: o.name ?? 'Daniel Bentley',
    date: o.date ?? todayIso(),
    useCustomDate: false,
    dateOverride: '',
    headlineText: 'HAPPY BIRTHDAY',
    wish: o.wish ?? '',
    headlineFont: prefs.headlineFont,
    nameFont: prefs.nameFont,
    themeId: base.id,
    customColors: colorsOf(base),
    aspect: prefs.aspect,
    showConfetti: prefs.showConfetti,
    showBlur: prefs.showBlur,
    confettiSeed: 7,
    skipRemoval: prefs.skipRemoval,
    photo: defaultPhotoAdjust,
  }
}

function resolveThemeById(id: string, savedThemes: SavedTheme[]): Theme | null {
  const saved = savedThemes.find((t) => t.id === id)
  if (saved) return { id: saved.id, label: saved.label, treatment: saved.treatment ?? DEFAULT_TREATMENT, ...saved.colors }
  return themes.find((t) => t.id === id) ?? null
}

export function resolveTheme(s: Settings, savedThemes: SavedTheme[] = []): Theme {
  if (s.themeId === CUSTOM_THEME_ID) {
    return { id: CUSTOM_THEME_ID, label: 'Custom', treatment: DEFAULT_TREATMENT, ...s.customColors }
  }
  const found = resolveThemeById(s.themeId, savedThemes)
  if (found) return found
  // A deleted saved theme still renders from its snapshot.
  return { id: CUSTOM_THEME_ID, label: 'Custom', treatment: DEFAULT_TREATMENT, ...s.customColors }
}

/** Fills in fields that older saved flyers do not have. */
export function normaliseSettings(raw: Partial<Settings>): Settings {
  const base = newSettings()
  return {
    ...base,
    ...raw,
    customColors: { ...base.customColors, ...raw.customColors },
    photo: { ...defaultPhotoAdjust, ...raw.photo },
  }
}
