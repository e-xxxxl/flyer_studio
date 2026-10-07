import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Controls } from './components/Controls'
import { FlyerPreview } from './components/FlyerPreview'
import type { FlyerProps, PhotoState } from './components/flyer/types'
import type { PhotoStatus } from './components/PhotoUploader'
import { PwaBar } from './components/PwaBar'
import { Button } from './components/ui'
import { brand } from './config/brand'
import { layouts } from './config/layouts'
import { formatDateLines } from './lib/date'
import { copyPng, downloadPng, fileName, renderFlyerPng, sharePng } from './lib/export'
import { bgModelReady, processPhoto, PhotoError, type Cutout } from './lib/photo'
import { defaultPhotoAdjust, resolveTheme, useSettings } from './lib/settings'

const idleStatus: PhotoStatus = { busy: false, fraction: null, label: '', error: null, notice: null, firstRun: false }

function useViewportHeight() {
  const [h, setH] = useState(() => window.innerHeight)
  useEffect(() => {
    const on = () => setH(window.innerHeight)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return h
}

function useIsDesktop() {
  const q = '(min-width: 1024px)'
  const [d, setD] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setD(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return d
}

export default function App() {
  const { settings: s, update } = useSettings()
  const flyerRef = useRef<HTMLDivElement>(null)
  const [cutout, setCutout] = useState<Cutout | null>(null)
  const [status, setStatus] = useState<PhotoStatus>(idleStatus)
  const lastFile = useRef<File | null>(null)
  const job = useRef(0)

  const [exporting, setExporting] = useState<null | 'download' | 'share' | 'copy'>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [ready, setReady] = useState<{ blob: Blob; name: string; url: string; reason: 'share' | 'preview' } | null>(null)

  const vh = useViewportHeight()
  const desktop = useIsDesktop()
  const theme = resolveTheme(s)
  const L = layouts[s.aspect]

  const say = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 3500)
  }, [])

  // ---- photo handling ----
  const runPhoto = useCallback(
    async (file: File, skipRemoval: boolean) => {
      const id = ++job.current
      lastFile.current = file
      const firstRun = !skipRemoval && !bgModelReady()
      setStatus({ ...idleStatus, busy: true, label: 'Reading your photo', firstRun })
      try {
        const c = await processPhoto(file, {
          skipRemoval,
          onProgress: (fraction, label) => {
            if (id === job.current) setStatus((st) => ({ ...st, fraction, label }))
          },
        })
        if (id !== job.current) return
        setCutout(c)
        setStatus({ ...idleStatus, notice: c.notice ?? null })
      } catch (e) {
        if (id !== job.current) return
        setStatus({
          ...idleStatus,
          error: e instanceof PhotoError ? e.message : 'Something went wrong with that photo. Please try another one.',
        })
      }
    },
    [],
  )

  const onFile = (file: File) => {
    update({ photo: defaultPhotoAdjust })
    void runPhoto(file, s.skipRemoval)
  }

  const onSkipChange = (v: boolean) => {
    update({ skipRemoval: v })
    if (lastFile.current) void runPhoto(lastFile.current, v)
  }

  const clearPhoto = () => {
    job.current++
    lastFile.current = null
    setCutout(null)
    setStatus(idleStatus)
    update({ photo: defaultPhotoAdjust })
  }

  const photo: PhotoState | null = cutout ? { url: cutout.url, aspect: cutout.aspect, ...s.photo } : null

  const dateLabel = s.useCustomDate ? s.dateOverride.replace(/\s+/g, ' ') : formatDateLines(s.date).join(' ')

  const flyer: FlyerProps = {
    title: s.title,
    name: s.name,
    date: s.date,
    dateOverride: s.useCustomDate ? s.dateOverride : undefined,
    headlineText: s.headlineText,
    headlineFont: s.headlineFont,
    nameFont: s.nameFont,
    theme,
    aspect: s.aspect,
    photo,
    confettiSeed: s.confettiSeed,
    showConfetti: s.showConfetti,
    showBlur: s.showBlur,
  }

  // ---- export ----
  const render = async () => {
    const node = flyerRef.current
    if (!node) throw new Error('The flyer is not ready yet.')
    return renderFlyerPng(node, L.width, L.height)
  }
  const nameForFile = [s.title, s.name].filter(Boolean).join(' ')

  const run = async (kind: 'download' | 'share' | 'copy') => {
    if (exporting) return
    setExporting(kind)
    try {
      const blob = await render()
      const name = fileName(nameForFile, dateLabel)
      if (kind === 'copy') {
        await copyPng(blob)
        say('Copied. You can paste it into WhatsApp or a message.')
      } else if (kind === 'download') {
        const r = await downloadPng(blob, name)
        if (r === 'preview') setReady({ blob, name, url: URL.createObjectURL(blob), reason: 'preview' })
        else if (r === 'downloaded') say('Flyer saved.')
      } else {
        try {
          const r = await sharePng(blob, name)
          if (r === 'downloaded') say('Sharing is not available here, so the flyer was saved instead.')
        } catch (e) {
          // Browsers expire the tap permission during a long render; ask for a fresh tap.
          if ((e as DOMException).name === 'NotAllowedError') {
            setReady({ blob, name, url: URL.createObjectURL(blob), reason: 'share' })
          } else throw e
        }
      }
    } catch (e) {
      console.error(e)
      say(e instanceof Error ? e.message : 'The flyer could not be exported. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  const closeReady = () => {
    if (ready) URL.revokeObjectURL(ready.url)
    setReady(null)
  }

  const maxHeight = useMemo(() => (desktop ? vh - 150 : Math.max(220, vh * 0.4)), [desktop, vh])
  const busy = exporting !== null

  const actions = (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2">
      <Button variant="primary" className="min-h-12" onClick={() => run('download')} disabled={busy}>
        {exporting === 'download' ? 'Preparing...' : 'Download PNG'}
      </Button>
      <Button className="min-h-12" onClick={() => run('share')} disabled={busy} aria-label="Share">
        {exporting === 'share' ? '...' : 'Share'}
      </Button>
      <Button className="min-h-12" onClick={() => run('copy')} disabled={busy} aria-label="Copy to clipboard">
        {exporting === 'copy' ? '...' : 'Copy'}
      </Button>
    </div>
  )

  return (
    <div className="flex min-h-full flex-col bg-stone-100">
      <header className="flex items-center justify-between gap-3 bg-[#1f0606] px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] text-white">
        <div className="flex items-center gap-3">
          <img src={brand.logoPath} alt="" className="h-6 w-auto" />
          <div className="leading-tight">
            <p className="text-sm font-semibold">Flyer Studio</p>
            <p className="text-xs text-stone-400">{brand.churchName}</p>
          </div>
        </div>
        <PwaBar />
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-0 lg:grid-cols-[24rem_minmax(0,1fr)] lg:gap-8 lg:pt-6">
        <section className="sticky top-0 z-10 -mx-4 space-y-3 bg-stone-100/95 px-4 pb-3 pt-3 backdrop-blur lg:static lg:order-2 lg:mx-0 lg:bg-transparent lg:p-0">
          <div className="lg:sticky lg:top-6 lg:space-y-4">
            <FlyerPreview
              flyer={flyer}
              flyerRef={flyerRef}
              maxHeight={maxHeight}
              onPan={(dx, dy) => update({ photo: { ...s.photo, offsetX: s.photo.offsetX + dx, offsetY: s.photo.offsetY + dy } })}
            />
            <div className="mx-auto max-w-md">{actions}</div>
          </div>
        </section>

        <aside className="lg:order-1">
          <Controls
            settings={s}
            update={update}
            hasPhoto={!!cutout}
            photoStatus={status}
            onFile={onFile}
            onClearPhoto={clearPhoto}
            onSkipChange={onSkipChange}
          />
          <p className="mt-6 text-center text-xs text-stone-400">
            {brand.churchName} Flyer Studio. Works offline once installed.
          </p>
        </aside>
      </main>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-sm rounded-xl bg-stone-900 px-4 py-3 text-center text-sm text-white shadow-xl"
        >
          {toast}
        </div>
      )}

      {ready && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={closeReady}>
          <div
            role="dialog"
            aria-label="Flyer ready"
            className="max-h-full w-full max-w-sm space-y-3 overflow-auto rounded-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-stone-800">Your flyer is ready</h2>
            <img src={ready.url} alt="Finished flyer" className="w-full rounded-lg" />
            {ready.reason === 'preview' ? (
              <p className="text-sm text-stone-600">Press and hold the image, then choose Save to Photos.</p>
            ) : (
              <Button
                variant="primary"
                className="w-full"
                onClick={async () => {
                  try {
                    await sharePng(ready.blob, ready.name)
                    closeReady()
                  } catch {
                    say('Sharing did not work. Use Download instead.')
                  }
                }}
              >
                Share now
              </Button>
            )}
            <Button
              className="w-full"
              onClick={async () => {
                await downloadPng(ready.blob, ready.name)
                if (ready.reason === 'share') closeReady()
              }}
            >
              Download
            </Button>
            <Button variant="ghost" className="w-full" onClick={closeReady}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

