export interface Cutout {
  url: string
  aspect: number
  /** True when the image has no transparency (a plain rectangle), so it needs heavier edge blending. */
  rect: boolean
  /** True when the background was actually removed. */
  removed: boolean
  /** A friendly message when something fell back. */
  notice?: string
}

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 30 * 1024 * 1024
const MAX_SIDE = 1800
const READY_KEY = 'flyer-studio:bg-model-ready'

export class PhotoError extends Error {}

/**
 * Self-hosted model files (see scripts/fetch-bg-model.mjs). Returns undefined when they are not
 * deployed, so the library falls back to its public CDN.
 */
let localModelPath: Promise<string | undefined> | null = null
function modelPublicPath(): Promise<string | undefined> {
  localModelPath ??= (async () => {
    try {
      const base = new URL(`${import.meta.env.BASE_URL}bgdata/`, location.href).href
      const res = await fetch(`${base}resources.json`)
      if (!res.ok) return undefined
      await res.json() // a dev server may answer with index.html; that is not valid JSON
      return base
    } catch {
      return undefined
    }
  })()
  return localModelPath
}

export const bgModelReady = () => {
  try {
    return localStorage.getItem(READY_KEY) === '1'
  } catch {
    return false
  }
}

function markReady() {
  try {
    localStorage.setItem(READY_KEY, '1')
  } catch {
    /* ignore */
  }
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new PhotoError('That file could not be read as an image.'))
    }
    img.src = url
  })
}

function canvasToBlob(c: HTMLCanvasElement, type = 'image/png'): Promise<Blob> {
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new PhotoError('Could not process the image.'))), type),
  )
}

/** Downscale very large photos so removal and export stay fast and memory-safe. */
async function normalise(file: Blob): Promise<Blob> {
  const img = await loadImage(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  const c = document.createElement('canvas')
  c.width = Math.round(img.naturalWidth * scale)
  c.height = Math.round(img.naturalHeight * scale)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return canvasToBlob(c)
}

/** Crops to the visible pixels so positioning is predictable. */
async function trim(blob: Blob): Promise<{ url: string; aspect: number; hasAlpha: boolean }> {
  const img = await loadImage(blob)
  const w = img.naturalWidth
  const h = img.naturalHeight
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.drawImage(img, 0, 0)
  const data = g.getImageData(0, 0, w, h).data
  // Rows and columns only count as "visible" when several solid pixels sit in them, so stray
  // specks left by the background remover do not stretch the bounding box.
  const rows = new Uint32Array(h)
  const cols = new Uint32Array(w)
  let transparent = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3]
      if (a < 250) transparent++
      if (a > 40) {
        rows[y]++
        cols[x]++
      }
    }
  }
  const rowMin = Math.max(3, Math.round(w * 0.004))
  const colMin = Math.max(3, Math.round(h * 0.004))
  let minX = 0, maxX = -1, minY = 0, maxY = -1
  for (let y = 0; y < h; y++) if (rows[y] >= rowMin) { minY = y; break }
  for (let y = h - 1; y >= 0; y--) if (rows[y] >= rowMin) { maxY = y; break }
  for (let x = 0; x < w; x++) if (cols[x] >= colMin) { minX = x; break }
  for (let x = w - 1; x >= 0; x--) if (cols[x] >= colMin) { maxX = x; break }
  if (maxX < minX || maxY < minY) throw new PhotoError('The photo looks completely transparent.')
  const tw = maxX - minX + 1
  const th = maxY - minY + 1
  const out = document.createElement('canvas')
  out.width = tw
  out.height = th
  out.getContext('2d')!.drawImage(c, minX, minY, tw, th, 0, 0, tw, th)
  return { url: out.toDataURL('image/png'), aspect: tw / th, hasAlpha: transparent / (w * h) > 0.02 }
}

export interface ProcessOptions {
  skipRemoval: boolean
  onProgress?: (fraction: number, label: string) => void
}

/** Validates a file, removes its background (unless skipped) and returns a trimmed cut-out. */
export async function processPhoto(file: File, opts: ProcessOptions): Promise<Cutout> {
  if (!ACCEPTED.includes(file.type)) {
    throw new PhotoError('Please choose a PNG, JPG or WebP photo. (HEIC photos: export as JPG first.)')
  }
  if (file.size > MAX_BYTES) throw new PhotoError('That photo is too large. Please use one under 30 MB.')

  const base = await normalise(file)

  if (opts.skipRemoval) {
    const t = await trim(base)
    return { url: t.url, aspect: t.aspect, rect: !t.hasAlpha, removed: false }
  }

  try {
    const { removeBackground } = await import('@imgly/background-removal')
    const result = await removeBackground(base, {
      publicPath: await modelPublicPath(),
      model: 'isnet_fp16',
      output: { format: 'image/png' },
      progress: (key: string, current: number, total: number) => {
        if (!total) return
        const f = current / total
        opts.onProgress?.(f, key.startsWith('fetch') ? 'Downloading the photo tool' : 'Cutting out the background')
      },
    })
    markReady()
    const t = await trim(result)
    return { url: t.url, aspect: t.aspect, rect: !t.hasAlpha, removed: true }
  } catch (err) {
    console.error('Background removal failed', err)
    const t = await trim(base)
    return {
      url: t.url,
      aspect: t.aspect,
      rect: !t.hasAlpha,
      removed: false,
      notice: 'Background removal did not work, so the original photo is shown. Try again, or use a photo that is already cut out.',
    }
  }
}
