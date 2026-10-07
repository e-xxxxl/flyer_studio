export interface FontSpec {
  family: string
  weight: number
  /** font-stretch percentage for fonts with a width axis. */
  stretch?: number
}

/** A font the operator can pick for the headline or the name block. */
export interface FontOption {
  id: string
  label: string
  spec: FontSpec
  /** Multiplies the layout's vertical stretch (layouts.ts headline.scaleY). Wide fonts get a taller stretch. */
  tall: number
  /** Name block only: line pitch as a multiple of font size. */
  leading?: number
}

/**
 * Fonts offered in the app. To add one: `npm i @fontsource/<name>`, import its css in src/fonts.ts,
 * then add an entry here. Every font is self-hosted, so it works offline and in the exported PNG.
 */
export const headlineFonts: FontOption[] = [
  { id: 'tall-didone', label: 'Tall Didone', spec: { family: 'Noto Serif Display Variable', weight: 800, stretch: 66 }, tall: 1 },
  { id: 'gloock', label: 'Gloock', spec: { family: 'Gloock', weight: 400 }, tall: 0.9 },
  { id: 'abril', label: 'Abril Fatface', spec: { family: 'Abril Fatface', weight: 400 }, tall: 0.85 },
  { id: 'playfair', label: 'Playfair Black', spec: { family: 'Playfair Display', weight: 900 }, tall: 0.9 },
  { id: 'dm-serif', label: 'DM Serif Display', spec: { family: 'DM Serif Display', weight: 400 }, tall: 0.9 },
  { id: 'bodoni', label: 'Bodoni Moda', spec: { family: 'Bodoni Moda', weight: 800 }, tall: 0.9 },
  { id: 'anton', label: 'Anton', spec: { family: 'Anton', weight: 400 }, tall: 0.8 },
  { id: 'bebas', label: 'Bebas Neue', spec: { family: 'Bebas Neue', weight: 400 }, tall: 0.8 },
]

export const nameFonts: FontOption[] = [
  { id: 'tall-didone', label: 'Tall Didone', spec: { family: 'Noto Serif Display Variable', weight: 500, stretch: 62.5 }, tall: 1, leading: 0.86 },
  { id: 'instrument', label: 'Instrument Serif', spec: { family: 'Instrument Serif', weight: 400 }, tall: 1, leading: 0.9 },
  { id: 'playfair', label: 'Playfair Display', spec: { family: 'Playfair Display', weight: 700 }, tall: 1, leading: 0.98 },
  { id: 'dm-serif', label: 'DM Serif Display', spec: { family: 'DM Serif Display', weight: 400 }, tall: 1, leading: 0.98 },
  { id: 'gloock', label: 'Gloock', spec: { family: 'Gloock', weight: 400 }, tall: 1, leading: 0.98 },
  { id: 'bodoni', label: 'Bodoni Moda', spec: { family: 'Bodoni Moda', weight: 700 }, tall: 1, leading: 0.98 },
  { id: 'anton', label: 'Anton', spec: { family: 'Anton', weight: 400 }, tall: 1, leading: 1 },
  { id: 'bebas', label: 'Bebas Neue', spec: { family: 'Bebas Neue', weight: 400 }, tall: 1, leading: 0.95 },
]

export const DEFAULT_HEADLINE_FONT = 'tall-didone'
export const DEFAULT_NAME_FONT = 'tall-didone'

export const pickHeadlineFont = (id: string) => headlineFonts.find((f) => f.id === id) ?? headlineFonts[0]
export const pickNameFont = (id: string) => nameFonts.find((f) => f.id === id) ?? nameFonts[0]

/** Fixed fonts (not user selectable). */
export const fonts = {
  date: { family: 'Archivo Variable', weight: 800, stretch: 125 },
  church: { family: 'Montserrat', weight: 800 },
} satisfies Record<string, FontSpec>

export const allFontSpecs = (): FontSpec[] => [
  ...headlineFonts.map((f) => f.spec),
  ...nameFonts.map((f) => f.spec),
  ...Object.values(fonts),
]

export const fontStack = (f: FontSpec, fallback: string) => `"${f.family}", ${fallback}`

/** CSS props that select a FontSpec. */
export const fontCss = (f: FontSpec, fallback: string) => ({
  fontFamily: fontStack(f, fallback),
  fontWeight: f.weight,
  fontStretch: f.stretch ? `${f.stretch}%` : undefined,
})
