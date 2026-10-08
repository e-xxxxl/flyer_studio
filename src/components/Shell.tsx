import { CalendarDays, House, Images, Plus, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLogo } from '../lib/logo'
import { Link, navigate, useRoute, type Route } from '../lib/router'
import { brandStore } from '../lib/stores'
import { Button } from './ui'

const ACCENT = '#7a1410'

export function BrandMark() {
  const [brand] = brandStore.use()
  const logo = useLogo(true, ACCENT)
  return (
    <Link to="/" className="flex min-w-0 items-center gap-3 rounded-md py-1 pr-2" aria-label={`${brand.churchName} Flyer Studio, home`}>
      {logo ? <img src={logo.url} alt="" className="h-[18px] w-auto shrink-0" /> : <span className="h-[18px] w-12 shrink-0" />}
      <span className="min-w-0 leading-none">
        <span className="block truncate text-[14px] leading-[18px] font-semibold text-ink">{brand.churchName}</span>
        <span className="block text-[11px] leading-[14px] tracking-[0.04em] text-ink-3">Flyer Studio</span>
      </span>
    </Link>
  )
}

const DESKTOP_LINKS: { to: string; label: string; match: Route['name'] }[] = [
  { to: '/flyers', label: 'Flyers', match: 'flyers' },
  { to: '/templates', label: 'Templates', match: 'templates' },
  { to: '/birthdays', label: 'Birthdays', match: 'birthdays' },
  { to: '/settings', label: 'Settings', match: 'settings' },
]

const BOTTOM_LINKS: { to: string; label: string; match: Route['name']; icon: ReactNode }[] = [
  { to: '/', label: 'Home', match: 'home', icon: <House className="size-[22px]" strokeWidth={1.6} /> },
  { to: '/flyers', label: 'Flyers', match: 'flyers', icon: <Images className="size-[22px]" strokeWidth={1.6} /> },
  { to: '/birthdays', label: 'Birthdays', match: 'birthdays', icon: <CalendarDays className="size-[22px]" strokeWidth={1.6} /> },
  { to: '/settings', label: 'Settings', match: 'settings', icon: <Settings className="size-[22px]" strokeWidth={1.6} /> },
]

export const startFlyer = () => navigate('/editor/new')

/** Chrome for every page except the editor, which is full screen. */
export function Shell({ children }: { children: ReactNode }) {
  const route = useRoute()
  const showCreate = route.name === 'home' || route.name === 'flyers'

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Desktop */}
      <header className="sticky top-0 z-30 hidden h-14 shrink-0 border-b border-line bg-paper lg:block">
        <div className="mx-auto flex h-full max-w-6xl items-center gap-10 px-8">
          <BrandMark />
          <nav aria-label="Main" className="flex h-full items-stretch gap-7">
            {DESKTOP_LINKS.map((l) => {
              const on = route.name === l.match
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  aria-current={on ? 'page' : undefined}
                  className={`relative flex items-center text-sm font-medium transition-colors duration-150 ${on ? 'text-ink' : 'text-ink-2 hover:text-ink'}`}
                >
                  {l.label}
                  {on && <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />}
                </Link>
              )
            })}
          </nav>
          <Button variant="primary" size="sm" className="ml-auto" onClick={startFlyer}>
            <Plus className="size-4" aria-hidden /> Create Flyer
          </Button>
        </div>
      </header>

      {/* Phone */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper pt-[env(safe-area-inset-top)] lg:hidden">
        <div className="flex h-12 items-center px-4">
          <BrandMark />
        </div>
      </header>

      <main
        className={`mx-auto w-full max-w-6xl flex-1 px-4 pt-6 lg:px-8 lg:pt-10 lg:pb-16 ${
          showCreate
            ? 'pb-[calc(var(--bottom-nav-h)+4.5rem+env(safe-area-inset-bottom))]'
            : 'pb-[calc(var(--bottom-nav-h)+1.5rem+env(safe-area-inset-bottom))]'
        }`}
      >
        {children}
      </main>

      {/* Phone: the one primary action sits above the tab bar, within thumb reach. */}
      {showCreate && (
        <div className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] z-30 px-4 pb-3 lg:hidden">
          <Button variant="primary" className="w-full shadow-[0_6px_16px_-8px_rgba(94,15,11,0.7)]" onClick={startFlyer}>
            <Plus className="size-[18px]" aria-hidden /> Create Flyer
          </Button>
        </div>
      )}

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {BOTTOM_LINKS.map((l) => {
          const on = route.name === l.match
          return (
            <Link
              key={l.to}
              to={l.to}
              aria-current={on ? 'page' : undefined}
              className={`relative flex h-[var(--bottom-nav-h)] flex-col items-center justify-center gap-1 text-[11px] leading-3 font-medium transition-colors duration-150 ${
                on ? 'text-accent' : 'text-ink-2'
              }`}
            >
              {on && <span aria-hidden className="absolute top-0 h-0.5 w-8 rounded-b bg-accent" />}
              {l.icon}
              {l.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
