import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FlyerProps, PhotoState } from '../components/flyer/types'
import type { PhotoStatus } from '../components/PhotoUploader'
import { useToast } from '../components/ui'
import { layouts } from '../config/layouts'
import { pickTreatment } from '../config/treatments'
import { formatDateLines, nextOccurrence } from '../lib/date'
import { copyPng, downloadPng, fileName, renderFlyerPng, renderFlyerThumb, sharePng } from '../lib/export'
import { getCutout, getFlyer, saveFlyer, type FlyerMeta } from '../lib/flyerDb'
import { bgModelReady, PhotoError, processPhoto, type Cutout } from '../lib/photo'
import { replace, navigate } from '../lib/router'
import {
  defaultPhotoAdjust,
  newSettings,
  normaliseSettings,
  resolveTheme,
  type Prefs,
  type Settings,
} from '../lib/settings'
import { birthdayStore, brandStore, newId, prefsStore, savedThemeStore } from '../lib/stores'

const idle: PhotoStatus = { busy: false, fraction: null, label: '', error: null, notice: null, firstRun: false }

export type ExportKind = 'download' | 'share' | 'copy'
export type SaveState = 'unsaved' | 'saving' | 'saved'

export interface ReadyFlyer {
  blob: Blob
  name: string
  url: string
  reason: 'share' | 'preview'
}

const PREF_KEYS: (keyof Prefs)[] = ['headlineFont', 'nameFont', 'aspect', 'showConfetti', 'showBlur', 'skipRemoval']

/** All editor state and actions. The page components only lay it out. */
export function useEditor(routeId: string, query: URLSearchParams) {
  const toast = useToast()
  const [brandSettings] = brandStore.use()
  const [prefs] = prefsStore.use()
  const [savedThemes] = savedThemeStore.use()
  const [birthdays] = birthdayStore.use()

  const [flyerId, setFlyerId] = useState<string | null>(routeId === 'new' ? null : routeId)
  const [loading, setLoading] = useState(routeId !== 'new')
  const [createdAt, setCreatedAt] = useState<number | null>(null)
  const [birthdayId, setBirthdayId] = useState<string | undefined>(query.get('birthday') ?? undefined)
  const [s, setS] = useState<Settings>(() => {
    const b = birthdays.find((x) => x.id === query.get('birthday'))
    return newSettings(
      {
        themeId: query.get('template') ?? brandSettings.defaultThemeId,
        wish: brandSettings.defaultWish,
        prefs,
        ...(b ? { title: b.title, name: b.name, date: nextOccurrence(b.md) } : {}),
      },
      savedThemes,
    )
  })
  const [cutout, setCutout] = useState<Cutout | null>(null)
  const [photoVersion, setPhotoVersion] = useState(0)
  const [status, setStatus] = useState<PhotoStatus>(idle)
  const [saveState, setSaveState] = useState<SaveState>('unsaved')
  const [exporting, setExporting] = useState<ExportKind | null>(null)
  const [ready, setReady] = useState<ReadyFlyer | null>(null)
  const flyerRef = useRef<HTMLDivElement>(null)
  const lastFile = useRef<File | null>(null)
  const job = useRef(0)
  const savedKey = useRef<string>('')
  const initialKey = useRef(JSON.stringify(s))

  // ---- load a saved flyer ----
  useEffect(() => {
    if (routeId === 'new') {
      savedKey.current = ''
      return
    }
    let alive = true
    ;(async () => {
      const meta = await getFlyer(routeId).catch(() => undefined)
      if (!alive) return
      if (!meta) {
        toast('That flyer could not be found.')
        navigate('/flyers')
        return
      }
      const stored = await getCutout(routeId).catch(() => undefined)
      if (!alive) return
      const settings = normaliseSettings(meta.settings)
      setS(settings)
      setCreatedAt(meta.createdAt)
      setBirthdayId(meta.birthdayId)
      if (stored) setCutout({ url: stored.url, aspect: stored.aspect, rect: stored.rect, removed: true })
      setPhotoVersion((v) => v + 1)
      savedKey.current = JSON.stringify(settings) + (stored ? 'p1' : 'p0')
      setSaveState('saved')
      setLoading(false)
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId])

  // ---- edits ----
  const update = useCallback((patch: Partial<Settings>) => {
    setS((cur) => ({ ...cur, ...patch }))
    const prefPatch: Partial<Prefs> = {}
    for (const k of PREF_KEYS) if (k in patch) (prefPatch as Record<string, unknown>)[k] = (patch as Record<string, unknown>)[k]
    if (Object.keys(prefPatch).length) prefsStore.set((p) => ({ ...p, ...prefPatch }))
  }, [])

  const setPhotoAdjust = useCallback((patch: Partial<Settings['photo']>) => {
    setS((cur) => ({ ...cur, photo: { ...cur.photo, ...patch } }))
  }, [])

  const theme = useMemo(() => resolveTheme(s, savedThemes), [s, savedThemes])
  const treatmentId = s.treatmentId ?? theme.treatment
  const treatment = pickTreatment(treatmentId)

  // ---- photo ----
  const runPhoto = useCallback(async (file: File, skipRemoval: boolean) => {
    const id = ++job.current
    lastFile.current = file
    const firstRun = !skipRemoval && !bgModelReady()
    setStatus({ ...idle, busy: true, label: 'Reading your photo', firstRun })
    try {
      const c = await processPhoto(file, {
        skipRemoval,
        onProgress: (fraction, label) => {
          if (id === job.current) setStatus((st) => ({ ...st, fraction, label }))
        },
      })
      if (id !== job.current) return
      setCutout(c)
      setPhotoVersion((v) => v + 1)
      setStatus({ ...idle, notice: c.notice ?? null })
    } catch (e) {
      if (id !== job.current) return
      setStatus({
        ...idle,
        error: e instanceof PhotoError ? e.message : 'Something went wrong with that photo. Please try another one.',
      })
    }
  }, [])

  const onFile = (file: File) => {
    setPhotoAdjust(defaultPhotoAdjust)
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
    setPhotoVersion((v) => v + 1)
    setStatus(idle)
    setPhotoAdjust(defaultPhotoAdjust)
  }

  // ---- derived flyer props ----
  const label = [s.title, s.name].filter(Boolean).join(' ').trim() || 'Untitled flyer'
  const dateLabel = s.useCustomDate ? s.dateOverride.replace(/\s+/g, ' ') : formatDateLines(s.date).join(' ')
  const photo: PhotoState | null = cutout ? { url: cutout.url, aspect: cutout.aspect, rect: cutout.rect, ...s.photo } : null

  const flyer: FlyerProps = {
    title: s.title,
    name: s.name,
    date: s.date,
    dateOverride: s.useCustomDate ? s.dateOverride : undefined,
    headlineText: s.headlineText,
    headlineFont: s.headlineFont,
    nameFont: s.nameFont,
    wish: s.wish,
    churchName: brandSettings.churchName,
    treatmentId,
    theme,
    aspect: s.aspect,
    photo,
    confettiSeed: s.confettiSeed,
    showConfetti: s.showConfetti,
    showBlur: s.showBlur,
  }
  const L = layouts[s.aspect]

  // ---- saving ----
  const key = JSON.stringify(s) + (cutout ? `p${photoVersion}` : 'p0')
  const dirty = key !== savedKey.current
  /** A brand-new flyer the operator has started editing but never saved. */
  const unsavedNew = !flyerId && (JSON.stringify(s) !== initialKey.current || !!cutout)

  const save = useCallback(
    async (silent = false) => {
      const node = flyerRef.current
      setSaveState('saving')
      try {
        const id = flyerId ?? newId()
        const thumb = node ? await renderFlyerThumb(node, L.width, L.height) : undefined
        const now = Date.now()
        const meta: FlyerMeta = {
          id,
          label,
          templateLabel: theme.label,
          birthdayId,
          createdAt: createdAt ?? now,
          updatedAt: now,
          settings: s,
          thumb,
          hasPhoto: !!cutout,
        }
        await saveFlyer(meta, cutout ? { url: cutout.url, aspect: cutout.aspect, rect: cutout.rect } : null)
        savedKey.current = key
        setCreatedAt(meta.createdAt)
        setSaveState('saved')
        if (!flyerId) {
          setFlyerId(id)
          replace(`/editor/${id}`)
        }
        if (!silent) toast('Flyer saved.')
        return true
      } catch (e) {
        console.error(e)
        setSaveState('unsaved')
        toast('The flyer could not be saved. Your browser may be blocking storage.')
        return false
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flyerId, label, theme.label, birthdayId, createdAt, s, cutout, key, L.width, L.height],
  )

  // Once a flyer has been saved, further edits save themselves.
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => {
    if (!flyerId || loading || !dirty) {
      if (!dirty && saveState !== 'saving') setSaveState(flyerId ? 'saved' : 'unsaved')
      return
    }
    setSaveState('unsaved')
    const t = window.setTimeout(() => void saveRef.current(true), 1600)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, flyerId, loading])

  // ---- export ----
  const run = async (kind: ExportKind) => {
    if (exporting) return
    const node = flyerRef.current
    if (!node) return
    setExporting(kind)
    try {
      const blob = await renderFlyerPng(node, L.width, L.height)
      const name = fileName(label, dateLabel)
      if (kind === 'copy') {
        await copyPng(blob)
        toast('Copied. Paste it into WhatsApp or a message.')
      } else if (kind === 'download') {
        const r = await downloadPng(blob, name)
        if (r === 'preview') setReady({ blob, name, url: URL.createObjectURL(blob), reason: 'preview' })
        else if (r === 'downloaded') toast('Flyer downloaded.')
      } else {
        try {
          const r = await sharePng(blob, name)
          if (r === 'downloaded') toast('Sharing is not available here, so the flyer was downloaded.')
        } catch (e) {
          // Browsers expire the tap permission during a long render; ask for a fresh tap.
          if ((e as DOMException).name === 'NotAllowedError') {
            setReady({ blob, name, url: URL.createObjectURL(blob), reason: 'share' })
          } else throw e
        }
      }
    } catch (e) {
      console.error(e)
      toast(e instanceof Error ? e.message : 'The flyer could not be exported. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  const closeReady = () => {
    if (ready) URL.revokeObjectURL(ready.url)
    setReady(null)
  }

  return {
    s,
    update,
    setPhotoAdjust,
    theme,
    treatment,
    treatmentId,
    flyer,
    flyerRef,
    label,
    cutout,
    status,
    onFile,
    onSkipChange,
    clearPhoto,
    save,
    saveState,
    dirty,
    unsavedNew,
    flyerId,
    loading,
    exporting,
    run,
    ready,
    closeReady,
    toast,
  }
}

export type Editor = ReturnType<typeof useEditor>
