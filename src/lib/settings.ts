import { useEffect, useState } from 'react'
import { DEFAULT_HEADLINE_FONT, DEFAULT_NAME_FONT } from '../config/fonts'
import type { Aspect } from '../config/layouts'
import { CUSTOM_THEME_ID, defaultTheme, themes, type Theme, type ThemeColorKey } from '../config/themes'
import { todayIso } from './date'

export type ThemeColors = Pick<Theme, ThemeColorKey>

export interface SavedTheme {
  id: string
  label: string
  colors: ThemeColors
}

export interface PhotoAdjust {
  scale: number
  offsetX: number
  offsetY: number
  flip: boolean
  /** undefined = layout default */
  overlap?: number
}

export interface Settings {
  title: string
  name: string
  date: string
  useCustomDate: boolean
  dateOverride: string
  headlineText: string
  headlineFont: string
  nameFont: string
  themeId: string
  /** The colours currently in use when themeId is "custom". */
  customColors: ThemeColors
  savedThemes: SavedTheme[]
  aspect: Aspect
  showConfetti: boolean
  showBlur: boolean
  confettiSeed: number
  skipRemoval: boolean
  photo: PhotoAdjust
}

export const TITLES = ['', 'Pastor', 'Deacon', 'Deaconess', 'Minister', 'Mrs', 'Mr', 'Dr', 'Evangelist', 'Elder']

export const defaultPhotoAdjust: PhotoAdjust = { scale: 1, offsetX: 0, offsetY: 0, flip: false }

export function colorsOf(t: Theme): ThemeColors {
  const { background, glow, panelFrom, panelTo, headline, name, date, confetti } = t
  return { background, glow, panelFrom, panelTo, headline, name, date, confetti }
}

export const defaultSettings: Settings = {
  title: 'Pastor',
  name: 'Daniel Bentley',
  date: todayIso(),
  useCustomDate: false,
  dateOverride: '',
  headlineText: 'HAPPY BIRTHDAY',
  headlineFont: DEFAULT_HEADLINE_FONT,
  nameFont: DEFAULT_NAME_FONT,
  themeId: defaultTheme.id,
  customColors: colorsOf(defaultTheme),
  savedThemes: [],
  aspect: '4:5',
  showConfetti: true,
  showBlur: true,
  confettiSeed: 7,
  skipRemoval: false,
  photo: defaultPhotoAdjust,
}

export function resolveTheme(s: Settings): Theme {
  if (s.themeId === CUSTOM_THEME_ID) return { id: CUSTOM_THEME_ID, label: 'Custom', ...s.customColors }
  const saved = s.savedThemes.find((t) => t.id === s.themeId)
  if (saved) return { id: saved.id, label: saved.label, ...saved.colors }
  return themes.find((t) => t.id === s.themeId) ?? defaultTheme
}

const KEY = 'flyer-studio:settings:v1'

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultSettings
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      ...defaultSettings,
      ...parsed,
      // the date should start from today unless the operator typed a custom text
      date: defaultSettings.date,
      customColors: { ...defaultSettings.customColors, ...parsed.customColors },
      photo: { ...defaultPhotoAdjust, ...parsed.photo },
    }
  } catch {
    return defaultSettings
  }
}

/** Settings state that remembers the last-used values in localStorage. */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {
      /* storage may be unavailable; the app still works */
    }
  }, [settings])
  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }))
  return { settings, setSettings, update }
}
