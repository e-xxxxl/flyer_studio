import { useSyncExternalStore } from 'react'
import { isIos, isStandalone } from './export'

/**
 * Install support. The browser fires `beforeinstallprompt` once, early, so it is captured here at
 * module load and handed to whichever screen (Settings) wants to offer the install action.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
let installed = typeof window !== 'undefined' ? isStandalone() : false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    snap = compute()
    emit()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    snap = compute()
    emit()
  })
}

export interface InstallState {
  /** The browser can show its own install prompt. */
  canPrompt: boolean
  /** iPhone or iPad in Safari: installing is manual (Share, then Add to Home Screen). */
  manualIos: boolean
  installed: boolean
}

const compute = (): InstallState => ({
  canPrompt: !!deferred && !installed,
  manualIos: isIos() && !installed,
  installed,
})
let snap = compute()

export function useInstall() {
  const state = useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => snap,
  )
  const prompt = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    deferred = null
    snap = compute()
    emit()
  }
  return { ...state, prompt }
}
