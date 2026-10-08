import { ChevronDown, ChevronLeft, Copy, Download, Image as ImageIcon, Palette, Save, Share2, Tag, Type } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { AspectSwitch, EditorPanel, type EditorTab } from '../components/editor/panels'
import { FlyerPreview } from '../components/FlyerPreview'
import { Button, Dialog, IconButton } from '../components/ui'
import { aspectLabels, layouts } from '../config/layouts'
import { EXPORT_PIXEL_RATIO } from '../lib/export'
import { goBack, navigate } from '../lib/router'
import { useEditor, type Editor, type SaveState } from './useEditor'

const TABS: { id: EditorTab; label: string; icon: ReactNode }[] = [
  { id: 'content', label: 'Content', icon: <Type className="size-5" strokeWidth={1.6} /> },
  { id: 'design', label: 'Design', icon: <Palette className="size-5" strokeWidth={1.6} /> },
  { id: 'photo', label: 'Photo', icon: <ImageIcon className="size-5" strokeWidth={1.6} /> },
  { id: 'brand', label: 'Branding', icon: <Tag className="size-5" strokeWidth={1.6} /> },
]

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

const saveText: Record<SaveState, string> = { unsaved: 'Not saved', saving: 'Saving…', saved: 'All changes saved' }

export default function EditorPage({ id, query }: { id: string; query: URLSearchParams }) {
  const ed = useEditor(id, query)
  const desktop = useIsDesktop()
  const [tab, setTab] = useState<EditorTab>('content')
  const [leaving, setLeaving] = useState(false)

  const back = () => {
    if (ed.unsavedNew) setLeaving(true)
    else goBack('/flyers')
  }

  if (ed.loading) {
    return (
      <div className="grid h-dvh place-items-center bg-wash text-sm text-ink-3" role="status">
        Opening flyer…
      </div>
    )
  }

  return (
    <>
      {desktop ? <DesktopEditor ed={ed} tab={tab} setTab={setTab} onBack={back} /> : <MobileEditor ed={ed} tab={tab} setTab={setTab} onBack={back} />}

      <Dialog
        open={leaving}
        onClose={() => setLeaving(false)}
        title="Save this flyer?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLeaving(false)}>
              Keep editing
            </Button>
            <Button
              onClick={() => {
                setLeaving(false)
                navigate('/flyers')
              }}
            >
              Discard
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (await ed.save(true)) {
                  setLeaving(false)
                  navigate('/flyers')
                }
              }}
            >
              Save and close
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">You have changes that have not been saved. Saved flyers appear in Flyers and can be edited later.</p>
      </Dialog>

      <Dialog
        open={!!ed.ready}
        onClose={ed.closeReady}
        title="Your flyer is ready"
        footer={
          <>
            <Button variant="ghost" onClick={ed.closeReady}>
              Close
            </Button>
            {ed.ready?.reason === 'share' && (
              <Button
                variant="primary"
                onClick={async () => {
                  if (!ed.ready) return
                  const { sharePng } = await import('../lib/export')
                  try {
                    await sharePng(ed.ready.blob, ed.ready.name)
                    ed.closeReady()
                  } catch {
                    ed.toast('Sharing did not work. Use Download instead.')
                  }
                }}
              >
                Share now
              </Button>
            )}
          </>
        }
      >
        {ed.ready && (
          <div className="space-y-3">
            <img src={ed.ready.url} alt="Finished flyer" className="mx-auto max-h-[50dvh] w-auto rounded-[2px] ring-1 ring-line-2" />
            {ed.ready.reason === 'preview' && <p className="text-sm text-ink-2">Press and hold the image, then choose Save to Photos.</p>}
          </div>
        )}
      </Dialog>
    </>
  )
}

/* ------------------------------------------------------------------ desktop */

function DesktopEditor({ ed, tab, setTab, onBack }: { ed: Editor; tab: EditorTab; setTab: (t: EditorTab) => void; onBack: () => void }) {
  const L = layouts[ed.s.aspect]
  return (
    <div className="flex h-dvh flex-col bg-wash">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-paper px-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-1 pr-3 pl-2">
          <ChevronLeft className="size-4" aria-hidden /> Flyers
        </Button>
        <span aria-hidden className="h-5 w-px bg-line" />
        <div className="min-w-0">
          <h1 className="truncate text-sm leading-4 font-semibold text-ink">{ed.label}</h1>
          <p className="text-xs leading-4 text-ink-3" aria-live="polite">
            {saveText[ed.saveState]}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={() => ed.save()} disabled={ed.saveState === 'saving'}>
            <Save className="size-4" aria-hidden /> Save
          </Button>
          <Button onClick={() => ed.run('copy')} disabled={!!ed.exporting}>
            <Copy className="size-4" aria-hidden /> {ed.exporting === 'copy' ? 'Copying…' : 'Copy'}
          </Button>
          <Button onClick={() => ed.run('share')} disabled={!!ed.exporting}>
            <Share2 className="size-4" aria-hidden /> {ed.exporting === 'share' ? 'Preparing…' : 'Share'}
          </Button>
          <Button variant="primary" onClick={() => ed.run('download')} disabled={!!ed.exporting}>
            <Download className="size-4" aria-hidden /> {ed.exporting === 'download' ? 'Preparing…' : 'Download PNG'}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav aria-label="Editor sections" className="flex w-[72px] shrink-0 flex-col gap-1 border-r border-line bg-paper py-3">
          {TABS.map((t) => {
            const on = t.id === tab
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={on ? 'page' : undefined}
                className={`relative mx-2 flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[11px] leading-3 font-medium transition-colors duration-150 ${
                  on ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:bg-ink/5 hover:text-ink'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            )
          })}
        </nav>

        <aside className="scroll-thin w-[340px] shrink-0 overflow-y-auto border-r border-line bg-paper" aria-label={`${tab} settings`}>
          <div className="px-5 pt-5 pb-8">
            <h2 className="mb-5 font-display text-2xl leading-8 text-ink">{TABS.find((t) => t.id === tab)?.label}</h2>
            <div key={tab} className="anim-fade">
              <EditorPanel tab={tab} ed={ed} />
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-canvas">
          <div className="min-h-0 flex-1 p-8">
            <FlyerPreview
              flyer={ed.flyer}
              flyerRef={ed.flyerRef}
              fit="contain"
              onPan={(dx, dy) => ed.setPhotoAdjust({ offsetX: ed.s.photo.offsetX + dx, offsetY: ed.s.photo.offsetY + dy })}
            />
          </div>
          <footer className="flex h-14 shrink-0 items-center justify-between gap-6 border-t border-line/70 px-6">
            <p className="text-xs text-ink-2 tabular-nums">
              {aspectLabels[ed.s.aspect]}. Exports at {L.width * EXPORT_PIXEL_RATIO} × {L.height * EXPORT_PIXEL_RATIO} px.
            </p>
            <div className="w-72">
              <AspectSwitch aspect={ed.s.aspect} onChange={(a) => ed.update({ aspect: a })} />
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- mobile */

function MobileEditor({ ed, tab, setTab, onBack }: { ed: Editor; tab: EditorTab; setTab: (t: EditorTab) => void; onBack: () => void }) {
  const [open, setOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const L = layouts[ed.s.aspect]

  const pick = (t: EditorTab) => {
    if (t === tab && open) setOpen(false)
    else {
      setTab(t)
      setOpen(true)
    }
  }

  const doExport = async (kind: 'download' | 'share' | 'copy') => {
    await ed.run(kind)
    setExportOpen(false)
  }

  return (
    <div className="flex h-dvh flex-col bg-wash">
      <header className="flex shrink-0 items-center gap-1 border-b border-line bg-paper px-1 pt-[env(safe-area-inset-top)]">
        <IconButton label="Back to flyers" onClick={onBack}>
          <ChevronLeft className="size-6" />
        </IconButton>
        <div className="min-w-0 flex-1 px-1 py-2">
          <h1 className="truncate text-[15px] leading-5 font-semibold text-ink">{ed.label}</h1>
          <p className="text-xs leading-4 text-ink-3" aria-live="polite">
            {saveText[ed.saveState]}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => ed.save()} disabled={ed.saveState === 'saving'} className="h-11">
          Save
        </Button>
        <Button variant="primary" size="sm" onClick={() => setExportOpen(true)} className="mr-2 h-10">
          Export
        </Button>
      </header>

      <main className="min-h-0 flex-1 bg-canvas p-4">
        <FlyerPreview
          flyer={ed.flyer}
          flyerRef={ed.flyerRef}
          fit="contain"
          onPan={(dx, dy) => ed.setPhotoAdjust({ offsetX: ed.s.photo.offsetX + dx, offsetY: ed.s.photo.offsetY + dy })}
        />
      </main>

      {open && (
        <section aria-label={`${tab} settings`} className="anim-rise flex max-h-[42dvh] shrink-0 flex-col border-t border-line bg-paper">
          <div className="flex items-center justify-between border-b border-line pr-1 pl-4">
            <h2 className="text-sm font-semibold text-ink">{TABS.find((t) => t.id === tab)?.label}</h2>
            <IconButton label="Collapse panel" onClick={() => setOpen(false)}>
              <ChevronDown className="size-5" />
            </IconButton>
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <EditorPanel tab={tab} ed={ed} />
          </div>
        </section>
      )}

      <nav aria-label="Editor sections" className="grid shrink-0 grid-cols-4 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)]">
        {TABS.map((t) => {
          const on = open && t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => pick(t.id)}
              aria-expanded={on}
              className={`relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] leading-3 font-medium transition-colors duration-150 ${
                on ? 'text-accent' : 'text-ink-2'
              }`}
            >
              {on && <span aria-hidden className="absolute top-0 h-0.5 w-8 rounded-b bg-accent" />}
              {t.icon}
              {t.label}
            </button>
          )
        })}
      </nav>

      <Dialog open={exportOpen} onClose={() => setExportOpen(false)} title="Export flyer">
        <div className="space-y-3">
          <p className="text-sm text-ink-2 tabular-nums">
            {aspectLabels[ed.s.aspect]}. PNG, {L.width * EXPORT_PIXEL_RATIO} × {L.height * EXPORT_PIXEL_RATIO} px.
          </p>
          <Button variant="primary" className="w-full" onClick={() => doExport('share')} disabled={!!ed.exporting}>
            <Share2 className="size-4" aria-hidden /> {ed.exporting === 'share' ? 'Preparing…' : 'Share to WhatsApp or Instagram'}
          </Button>
          <Button className="w-full" onClick={() => doExport('download')} disabled={!!ed.exporting}>
            <Download className="size-4" aria-hidden /> {ed.exporting === 'download' ? 'Preparing…' : 'Download PNG'}
          </Button>
          <Button className="w-full" onClick={() => doExport('copy')} disabled={!!ed.exporting}>
            <Copy className="size-4" aria-hidden /> {ed.exporting === 'copy' ? 'Copying…' : 'Copy image'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
