import { useSyncExternalStore } from 'react'
import { brand } from '../config/brand'
import { defaultTheme } from '../config/themes'
import { defaultPrefs, type Prefs, type SavedTheme } from './settings'

/** A tiny localStorage-backed store that components can subscribe to. Safe when storage is blocked. */
function createStore<T>(key: string, initial: T, migrate: (raw: unknown) => T = (raw) => raw as T) {
  let value: T = initial
  try {
    const raw = localStorage.getItem(key)
    if (raw) value = migrate(JSON.parse(raw))
  } catch {
    /* ignore corrupt or unavailable storage */
  }
  const listeners = new Set<() => void>()
  const subscribe = (fn: () => void) => {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }
  const get = () => value
  const set = (next: T | ((prev: T) => T)) => {
    value = typeof next === 'function' ? (next as (p: T) => T)(value) : next
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l())
  }
  const use = () => [useSyncExternalStore(subscribe, get), set] as const
  return { get, set, use }
}

// ---- church branding (Settings page) ----
export interface BrandSettings {
  churchName: string
  /** Template new flyers start from. */
  defaultThemeId: string
  /** Default wish or verse added to new flyers. Empty = none. */
  defaultWish: string
}

const brandDefaults: BrandSettings = { churchName: brand.churchName, defaultThemeId: defaultTheme.id, defaultWish: '' }

export const brandStore = createStore<BrandSettings>('flyer-studio:brand:v1', brandDefaults, (raw) => ({
  ...brandDefaults,
  ...(raw as Partial<BrandSettings>),
}))

// ---- birthdays ----
export interface Birthday {
  id: string
  title: string
  name: string
  /** "MM-DD" */
  md: string
}

export const birthdayStore = createStore<Birthday[]>('flyer-studio:birthdays:v1', [], (raw) =>
  Array.isArray(raw) ? (raw as Birthday[]) : [],
)

// ---- operator preferences and saved colour themes ----
export const prefsStore = createStore<Prefs>('flyer-studio:prefs:v1', defaultPrefs, (raw) => ({
  ...defaultPrefs,
  ...(raw as Partial<Prefs>),
}))

export const savedThemeStore = createStore<SavedTheme[]>('flyer-studio:themes:v1', [], (raw) =>
  Array.isArray(raw) ? (raw as SavedTheme[]) : [],
)

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
