import { useSyncExternalStore, type AnchorHTMLAttributes, type ReactNode } from 'react'

/**
 * A tiny hash router. Hash URLs keep every deployment host working with no rewrite rules
 * and play nicely with the installed app.
 *
 *   #/            home
 *   #/flyers      saved flyers
 *   #/templates   templates
 *   #/birthdays   birthdays
 *   #/settings    branding and app settings
 *   #/editor/new  new flyer   (?template=ID, ?birthday=ID)
 *   #/editor/ID   open a saved flyer
 */
export type Route =
  | { name: 'home' }
  | { name: 'flyers' }
  | { name: 'templates' }
  | { name: 'birthdays' }
  | { name: 'settings' }
  | { name: 'editor'; id: string; query: URLSearchParams }

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/'
  const [path, search = ''] = raw.split('?')
  const parts = path.split('/').filter(Boolean)
  switch (parts[0]) {
    case 'flyers':
      return { name: 'flyers' }
    case 'templates':
      return { name: 'templates' }
    case 'birthdays':
      return { name: 'birthdays' }
    case 'settings':
      return { name: 'settings' }
    case 'editor':
      return { name: 'editor', id: parts[1] ?? 'new', query: new URLSearchParams(search) }
    default:
      return { name: 'home' }
  }
}

const subscribe = (fn: () => void) => {
  window.addEventListener('hashchange', fn)
  return () => window.removeEventListener('hashchange', fn)
}
const snapshot = () => window.location.hash

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, snapshot)
  // parseHash returns a fresh object each call; callers compare by name and id.
  return parseHash(hash)
}

export const navigate = (to: string) => {
  window.location.hash = to
}

export const replace = (to: string) => {
  window.history.replaceState(null, '', `#${to}`)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

/** Back to where the user came from, or to a sensible page when the app was opened directly. */
export function goBack(fallback: string) {
  if (window.history.length > 1) window.history.back()
  else navigate(fallback)
}

export function Link({
  to,
  children,
  ...rest
}: { to: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return (
    <a href={`#${to}`} {...rest}>
      {children}
    </a>
  )
}
