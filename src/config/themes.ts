export interface Theme {
  id: string
  label: string
  /** Base background colour (near black). */
  background: string
  /** Colour of the light that bleeds in from the left and right edges. */
  glow: string
  panelFrom: string
  panelTo: string
  headline: string
  name: string
  date: string
  confetti: string
}

/** Colour fields the operator can edit with pickers. */
export type ThemeColorKey = Exclude<keyof Theme, 'id' | 'label'>

export const CUSTOM_THEME_ID = 'custom'

export const themes: Theme[] = [
  {
    id: 'sunset-gold',
    label: 'Sunset Gold',
    background: '#1f0606',
    glow: '#ff4d12',
    panelFrom: '#f7b22e',
    panelTo: '#ffe84f',
    headline: '#f7e6cb',
    name: '#7a1410',
    date: '#4c1410',
    confetti: '#c9923b',
  },
  {
    id: 'royal-purple',
    label: 'Royal Purple & Gold',
    background: '#14062e',
    glow: '#7b2cff',
    panelFrom: '#e9b23c',
    panelTo: '#ffe69a',
    headline: '#f6eeff',
    name: '#3b0f6e',
    date: '#2a0a4f',
    confetti: '#e3b64f',
  },
  {
    id: 'deep-blue',
    label: 'Deep Blue & Silver',
    background: '#050e26',
    glow: '#1f6cff',
    panelFrom: '#b9c5d6',
    panelTo: '#f3f6fb',
    headline: '#eef3fb',
    name: '#0b2a5c',
    date: '#0b1f45',
    confetti: '#b8c4d8',
  },
  {
    id: 'emerald-cream',
    label: 'Emerald & Cream',
    background: '#04191a',
    glow: '#14b37a',
    panelFrom: '#efdfb4',
    panelTo: '#fff7df',
    headline: '#f8f0da',
    name: '#0a4a36',
    date: '#07382b',
    confetti: '#d9c68c',
  },
  {
    id: 'rose-blush',
    label: 'Rose & Blush',
    background: '#2c0a1c',
    glow: '#ff5c8d',
    panelFrom: '#ffb3c9',
    panelTo: '#fff0f4',
    headline: '#ffe9ef',
    name: '#8b1742',
    date: '#5f0f2f',
    confetti: '#f6a8c0',
  },
  {
    id: 'midnight',
    label: 'Midnight Black & White',
    background: '#060606',
    glow: '#5a5a5a',
    panelFrom: '#dcdcdc',
    panelTo: '#ffffff',
    headline: '#ffffff',
    name: '#111111',
    date: '#111111',
    confetti: '#bcbcbc',
  },
]

export const defaultTheme = themes[0]

export const themeColorFields: { key: ThemeColorKey; label: string }[] = [
  { key: 'background', label: 'Background' },
  { key: 'glow', label: 'Edge glow' },
  { key: 'panelFrom', label: 'Panel start' },
  { key: 'panelTo', label: 'Panel end' },
  { key: 'headline', label: 'Headline' },
  { key: 'name', label: 'Name' },
  { key: 'date', label: 'Date' },
  { key: 'confetti', label: 'Confetti' },
]

