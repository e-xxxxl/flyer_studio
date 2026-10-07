import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { isIos, isStandalone } from '../lib/export'
import { Button } from './ui'

const CACHED_KEY = 'flyer-studio:offline-ready'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Install button, iOS "Add to Home Screen" help, "offline ready" badge and the update toast. */
export function PwaBar() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone())
  const [showIosHelp, setShowIosHelp] = useState(false)
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  // The service worker only announces "offline ready" once, so remember it between visits.
  const [cached, setCached] = useState(() => {
    try {
      return localStorage.getItem(CACHED_KEY) === '1'
    } catch {
      return false
    }
  })
  useEffect(() => {
    if (!offlineReady) return
    setCached(true)
    try {
      localStorage.setItem(CACHED_KEY, '1')
    } catch {
      /* ignore */
    }
  }, [offlineReady])

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setInstallEvent(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const showIosButton = isIos() && !installed
  const canInstall = !!installEvent && !installed

  return (
    <>
      <div className="flex items-center gap-2">
        {cached && (
          <span className="rounded-full bg-emerald-600/20 px-2.5 py-1 text-xs font-medium text-emerald-200">Offline ready</span>
        )}
        {canInstall && (
          <Button
            variant="secondary"
            className="min-h-9 px-3 py-1"
            onClick={async () => {
              await installEvent!.prompt()
              await installEvent!.userChoice
              setInstallEvent(null)
            }}
          >
            Install app
          </Button>
        )}
        {showIosButton && (
          <Button variant="secondary" className="min-h-9 px-3 py-1" onClick={() => setShowIosHelp(true)}>
            Install app
          </Button>
        )}
      </div>

      {showIosHelp && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setShowIosHelp(false)}>
          <div
            role="dialog"
            aria-label="Add to Home Screen"
            className="w-full max-w-sm rounded-2xl bg-white p-5 text-stone-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold">Add to Home Screen</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              <li>Open this page in Safari.</li>
              <li>
                Tap the <strong>Share</strong> button at the bottom of the screen.
              </li>
              <li>
                Scroll down and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
              </li>
            </ol>
            <Button variant="primary" className="mt-4 w-full" onClick={() => setShowIosHelp(false)}>
              Got it
            </Button>
          </div>
        </div>
      )}

      {needRefresh && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-xl bg-stone-900 px-4 py-3 text-sm text-white shadow-xl"
        >
          <span>Update available, tap to refresh</span>
          <div className="flex gap-2">
            <button className="rounded-md px-2 py-1 text-stone-300" onClick={() => setNeedRefresh(false)}>
              Later
            </button>
            <button className="rounded-md bg-amber-600 px-3 py-1 font-semibold" onClick={() => updateServiceWorker(true)}>
              Refresh
            </button>
          </div>
        </div>
      )}
    </>
  )
}

