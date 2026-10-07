import { useEffect, useState } from 'react'
import { allFontSpecs, fontStack, type FontSpec } from '../config/fonts'

let ctx: CanvasRenderingContext2D | null = null
let probe: HTMLSpanElement | null = null

/** Width of `text` at 100px, measured in the DOM so width axes and spacing match rendering exactly. */
function measureAt100(text: string, font: FontSpec, letterSpacingEm: number): number {
  if (!probe) {
    probe = document.createElement('span')
    probe.setAttribute('aria-hidden', 'true')
    Object.assign(probe.style, {
      position: 'fixed',
      left: '-9999px',
      top: '0',
      visibility: 'hidden',
      whiteSpace: 'pre',
      fontSize: '100px',
      lineHeight: '1',
    })
    document.body.appendChild(probe)
  }
  probe.style.fontFamily = fontStack(font, 'serif')
  probe.style.fontWeight = String(font.weight)
  probe.style.fontStretch = font.stretch ? `${font.stretch}%` : 'normal'
  probe.style.letterSpacing = `${letterSpacingEm}em`
  probe.textContent = text
  return probe.getBoundingClientRect().width
}

interface FitOptions {
  font: FontSpec
  letterSpacingEm?: number
  maxWidth: number
  maxHeight?: number
  leading: number
  maxSize: number
  minSize?: number
}

/** Largest font size (px) at which every line fits the box, capped at maxSize. */
export function fitFontSize(lines: string[], o: FitOptions): number {
  if (!lines.length) return o.maxSize
  const widest = Math.max(...lines.map((l) => measureAt100(l, o.font, o.letterSpacingEm ?? 0)))
  let size = Math.min(o.maxSize, (o.maxWidth / Math.max(widest, 1)) * 100)
  if (o.maxHeight) size = Math.min(size, o.maxHeight / (lines.length * o.leading))
  return Math.max(o.minSize ?? 8, size)
}

export interface Metrics {
  ascent: number
  descent: number
  cap: number
}

/** Real glyph metrics at `size` px so text can be placed by baseline and cap height. */
export function fontMetrics(font: FontSpec, size: number): Metrics {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return { ascent: size * 0.9, descent: size * 0.25, cap: size * 0.7 }
  ctx.font = `${font.weight} 100px "${font.family}"`
  const m = ctx.measureText('H')
  const k = size / 100
  return {
    ascent: (m.fontBoundingBoxAscent ?? 90) * k,
    descent: (m.fontBoundingBoxDescent ?? 25) * k,
    cap: m.actualBoundingBoxAscent * k,
  }
}

/** Distance from the top of a line box (height lineHeight) to its baseline. */
export function baselineOffset(m: Metrics, lineHeight: number): number {
  return (lineHeight - (m.ascent + m.descent)) / 2 + m.ascent
}

/** Loads every flyer font so measuring and rendering both use the real face. */
export function loadFlyerFonts(): Promise<void> {
  const specs = allFontSpecs().map((f) => `${f.weight} 64px "${f.family}"`)
  return Promise.all(specs.map((s) => document.fonts.load(s, 'AaBb0123')))
    .then(() => document.fonts.ready)
    .then(() => undefined)
}

/** Re-renders the caller once fonts are available so fitted sizes are recomputed. */
export function useFontsReady(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    loadFlyerFonts().then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])
  return ready
}
