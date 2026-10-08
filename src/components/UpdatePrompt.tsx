import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from './ui'

/** Appears only when a new version of the app has been downloaded and is waiting. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  if (!needRefresh) return null
  return (
    <div
      role="status"
      className="anim-rise fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[60] mx-auto flex max-w-sm items-center justify-between gap-3 rounded-md bg-ink py-2 pr-2 pl-4 text-sm text-white shadow-lg"
    >
      <span>A new version is ready.</span>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className="text-white/70 hover:bg-white/10 hover:text-white" onClick={() => setNeedRefresh(false)}>
          Later
        </Button>
        <Button variant="primary" size="sm" onClick={() => updateServiceWorker(true)}>
          Refresh
        </Button>
      </div>
    </div>
  )
}
