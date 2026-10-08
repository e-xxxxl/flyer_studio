import { useEffect, useState } from 'react'
import type { Settings } from './settings'

/** Saved flyers live in IndexedDB so portraits (several MB each) do not hit localStorage limits. */

export interface FlyerMeta {
  id: string
  /** Shown in lists, e.g. "Pastor Daniel Bentley". */
  label: string
  /** Template label at the time of saving. */
  templateLabel: string
  birthdayId?: string
  createdAt: number
  updatedAt: number
  settings: Settings
  /** Small JPEG data URL for list views. */
  thumb?: string
  hasPhoto: boolean
}

export interface StoredCutout {
  id: string
  url: string
  aspect: number
  rect: boolean
}

const DB = 'flyer-studio'
const FLYERS = 'flyers'
const CUTOUTS = 'cutouts'

let dbPromise: Promise<IDBDatabase> | null = null
function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(FLYERS, { keyPath: 'id' })
      req.result.createObjectStore(CUTOUTS, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(store, mode).objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

const listeners = new Set<() => void>()
const changed = () => listeners.forEach((l) => l())

export async function listFlyers(): Promise<FlyerMeta[]> {
  const all = await run<FlyerMeta[]>(FLYERS, 'readonly', (s) => s.getAll())
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export const getFlyer = (id: string) => run<FlyerMeta | undefined>(FLYERS, 'readonly', (s) => s.get(id))
export const getCutout = (id: string) => run<StoredCutout | undefined>(CUTOUTS, 'readonly', (s) => s.get(id))

export async function saveFlyer(meta: FlyerMeta, cutout: Omit<StoredCutout, 'id'> | null): Promise<void> {
  await run(FLYERS, 'readwrite', (s) => s.put(meta))
  if (cutout) await run(CUTOUTS, 'readwrite', (s) => s.put({ ...cutout, id: meta.id }))
  else await run(CUTOUTS, 'readwrite', (s) => s.delete(meta.id))
  changed()
}

export async function deleteFlyer(id: string): Promise<void> {
  await run(FLYERS, 'readwrite', (s) => s.delete(id))
  await run(CUTOUTS, 'readwrite', (s) => s.delete(id))
  changed()
}

/** Live list of saved flyers. `ready` is false until the first read finishes. */
export function useFlyers() {
  const [state, setState] = useState<{ flyers: FlyerMeta[]; ready: boolean }>({ flyers: [], ready: false })
  useEffect(() => {
    let alive = true
    const load = () =>
      listFlyers()
        .then((flyers) => alive && setState({ flyers, ready: true }))
        .catch(() => alive && setState({ flyers: [], ready: true }))
    load()
    listeners.add(load)
    return () => {
      alive = false
      listeners.delete(load)
    }
  }, [])
  return state
}
