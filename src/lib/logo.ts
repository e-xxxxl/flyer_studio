import { useEffect, useState } from 'react'
import { brand } from '../config/brand'
import { hexToRgb } from './color'

export interface LogoAsset {
  url: string // data URL (same origin by construction, never taints the canvas)
  aspect: number // width / height of the trimmed mark
}

interface Loaded {
  canvas: HTMLCanvasElement
  tone: 'light' | 'dark'
}

const cache = new Map<string, Promise<Loaded | null>>()

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Draws the image trimmed to its visible pixels and works out whether it is light or dark. */
function trimAndMeasure(img: HTMLImageElement): Loaded | null {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) return null
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d', { willReadFrequently: true })
  if (!g) return null
  g.drawImage(img, 0, 0)
  const data = g.getImageData(0, 0, w, h).data
  let minX = w, minY = h, maxX = -1, maxY = -1
  let lum = 0
  let weight = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const a = data[i + 3]
      if (a > 24) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
        const l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255
        lum += l * a
        weight += a
      }
    }
  }
  if (maxX < 0) return null
  const tw = maxX - minX + 1
  const th = maxY - minY + 1
  const out = document.createElement('canvas')
  out.width = tw
  out.height = th
  out.getContext('2d')!.drawImage(c, minX, minY, tw, th, 0, 0, tw, th)
  const avg = weight ? lum / weight : 1
  return { canvas: out, tone: avg > 0.55 ? 'light' : 'dark' }
}

function loadLogoFile(path: string): Promise<Loaded | null> {
  let p = cache.get(path)
  if (!p) {
    p = loadImage(path).then((img) => (img ? trimAndMeasure(img) : null))
    cache.set(path, p)
  }
  return p
}

function tint(src: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = src.width
  out.height = src.height
  const g = out.getContext('2d')!
  const [r, gr, b] = hexToRgb(color)
  g.fillStyle = `rgb(${r}, ${gr}, ${b})`
  g.fillRect(0, 0, out.width, out.height)
  g.globalCompositeOperation = 'destination-in'
  g.drawImage(src, 0, 0)
  return out
}

/**
 * Resolves the logo for a given backdrop:
 *  - the file's own colours are kept when they already contrast with the backdrop
 *  - otherwise logo-light.png is used (if it exists)
 *  - otherwise the logo is recoloured to `fallbackColor`
 */
export async function resolveLogo(backdropIsLight: boolean, fallbackColor: string): Promise<LogoAsset | null> {
  const base = await loadLogoFile(brand.logoPath)
  if (!base) return null
  const tone = brand.logoVariant === 'auto' ? base.tone : brand.logoVariant
  const needTone: 'light' | 'dark' = backdropIsLight ? 'dark' : 'light'
  let canvas = base.canvas
  if (tone !== needTone) {
    const alt = needTone === 'light' ? await loadLogoFile(brand.logoLightPath) : null
    canvas = alt && alt.tone === 'light' ? alt.canvas : tint(base.canvas, fallbackColor)
  }
  return { url: canvas.toDataURL('image/png'), aspect: canvas.width / canvas.height }
}

/** Resolves the logo and fully decodes it before reporting it. */
export function useLogo(backdropIsLight: boolean, fallbackColor: string): LogoAsset | null {
  const [asset, setAsset] = useState<LogoAsset | null>(null)
  useEffect(() => {
    let alive = true
    resolveLogo(backdropIsLight, fallbackColor).then(async (a) => {
      if (a) {
        const img = new Image()
        img.src = a.url
        try {
          await img.decode()
        } catch {
          /* decode is best effort */
        }
      }
      if (alive) setAsset(a)
    })
    return () => {
      alive = false
    }
  }, [backdropIsLight, fallbackColor])
  return asset
}
