import { toBlob } from 'html-to-image'
import { loadFlyerFonts } from './fit'

export const EXPORT_PIXEL_RATIO = 2

const isSafari = () => /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent)

export const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

/** Waits until every <img> inside the flyer (photo, logo) is loaded and decoded. */
async function waitForImages(node: HTMLElement) {
  const imgs = Array.from(node.querySelectorAll('img'))
  await Promise.all(
    imgs.map(async (img) => {
      if (!img.complete) {
        await new Promise<void>((res) => {
          img.addEventListener('load', () => res(), { once: true })
          img.addEventListener('error', () => res(), { once: true })
        })
      }
      try {
        await img.decode()
      } catch {
        /* a broken image should not block the export */
      }
    }),
  )
}

/** Renders the flyer element to a PNG at 2x its design size (2160 px wide). */
export async function renderFlyerPng(node: HTMLElement, width: number, height: number): Promise<Blob> {
  await loadFlyerFonts()
  await waitForImages(node)
  const options = {
    width,
    height,
    pixelRatio: EXPORT_PIXEL_RATIO,
    cacheBust: false,
    style: { transform: 'none', margin: '0' },
  }
  // Safari drops images and filters on the first render, so warm it up once.
  if (isSafari()) await toBlob(node, options)
  const blob = await toBlob(node, options)
  if (!blob) throw new Error('The flyer could not be rendered.')
  return blob
}

export function fileName(name: string, dateLabel: string): string {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  const parts = ['flyer', slug(name), slug(dateLabel)].filter(Boolean)
  return `${parts.join('-')}.png`
}

export type DeliveryResult = 'downloaded' | 'shared' | 'cancelled' | 'preview'

/** Saves the PNG. Uses a normal download, or the share sheet / preview where downloads do not work (iOS app). */
export async function downloadPng(blob: Blob, filename: string): Promise<DeliveryResult> {
  const file = new File([blob], filename, { type: 'image/png' })
  if (isIos() && isStandalone() && navigator.canShare?.({ files: [file] })) {
    return shareFile(file)
  }
  if (isIos() && isStandalone()) return 'preview'
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}

export const canShareFiles = (): boolean => {
  try {
    const probe = new File([new Blob(['x'])], 'x.png', { type: 'image/png' })
    return !!navigator.canShare?.({ files: [probe] })
  } catch {
    return false
  }
}

async function shareFile(file: File): Promise<DeliveryResult> {
  try {
    await navigator.share({ files: [file], title: file.name })
    return 'shared'
  } catch (e) {
    if ((e as DOMException).name === 'AbortError') return 'cancelled'
    throw e
  }
}

/** Opens the share sheet with the PNG attached; falls back to a download. */
export async function sharePng(blob: Blob, filename: string): Promise<DeliveryResult> {
  const file = new File([blob], filename, { type: 'image/png' })
  if (canShareFiles()) return shareFile(file)
  return downloadPng(blob, filename)
}

export async function copyPng(blob: Blob): Promise<void> {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('Copying images is not supported in this browser. Use Download instead.')
  }
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}
