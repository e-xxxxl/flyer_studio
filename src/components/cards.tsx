import { Copy, Trash2 } from 'lucide-react'
import { themes } from '../config/themes'
import { daysUntil, monthLong, nextOccurrence } from '../lib/date'
import type { FlyerMeta } from '../lib/flyerDb'
import { Link, navigate } from '../lib/router'
import type { Birthday } from '../lib/stores'
import { Button, IconButton } from './ui'

export function timeAgo(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days < 30) return days === 1 ? 'yesterday' : `${days} days ago`
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function FlyerCard({
  flyer,
  onDuplicate,
  onDelete,
}: {
  flyer: FlyerMeta
  onDuplicate: () => void
  onDelete: () => void
}) {
  const swatch = themes.find((t) => t.id === flyer.settings.themeId)
  return (
    <article className="group">
      <Link
        to={`/editor/${flyer.id}`}
        className="block rounded-[3px] bg-canvas ring-1 ring-line transition-shadow duration-150 hover:ring-line-2"
        aria-label={`Open ${flyer.label}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-[3px]">
          {flyer.thumb ? (
            <img src={flyer.thumb} alt="" loading="lazy" className="absolute inset-0 size-full object-contain" />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: swatch ? `linear-gradient(160deg, ${swatch.background} 40%, ${swatch.panelFrom})` : 'var(--color-canvas)' }}
            />
          )}
        </div>
      </Link>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm leading-5 font-semibold text-ink">{flyer.label}</h3>
          <p className="truncate text-xs leading-4 text-ink-3">
            {flyer.templateLabel}. Edited {timeAgo(flyer.updatedAt)}
          </p>
        </div>
        <div className="-mt-1 -mr-2 flex shrink-0">
          <IconButton label={`Duplicate ${flyer.label}`} onClick={onDuplicate}>
            <Copy className="size-4" />
          </IconButton>
          <IconButton label={`Delete ${flyer.label}`} onClick={onDelete}>
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      </div>
    </article>
  )
}

export function whenLabel(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 14) return `In ${days} days`
  if (days < 60) return `In ${Math.round(days / 7)} weeks`
  return `In ${Math.round(days / 30)} months`
}

export function BirthdayRow({
  b,
  flyerId,
  onEdit,
  onDelete,
}: {
  b: Birthday
  /** Id of a saved flyer made for this birthday, if any. */
  flyerId?: string
  onEdit?: () => void
  onDelete?: () => void
}) {
  const iso = nextOccurrence(b.md)
  const [, m, d] = iso.split('-').map(Number)
  const days = daysUntil(iso)
  const full = [b.title, b.name].filter(Boolean).join(' ')
  return (
    <li className="flex items-center gap-4 py-3.5">
      <div className="w-12 shrink-0 text-center leading-none" aria-hidden>
        <span className="block font-display text-[30px] leading-8 text-ink tabular-nums">{d}</span>
        <span className="block text-[11px] leading-4 font-semibold tracking-[0.08em] text-ink-3 uppercase">{monthLong(m).slice(0, 3)}</span>
      </div>
      <div className="min-w-0 flex-1">
        {onEdit ? (
          <button type="button" onClick={onEdit} className="-my-1 block max-w-full truncate rounded-sm py-1 text-left text-[15px] leading-5 font-semibold text-ink hover:underline" aria-label={`Edit ${full}`}>
            {full}
          </button>
        ) : (
          <p className="truncate text-[15px] leading-5 font-semibold text-ink">{full}</p>
        )}
        <p className="text-xs leading-4 text-ink-3">
          <span className="sr-only">{`${d} ${monthLong(m)}. `}</span>
          {whenLabel(days)}
          {flyerId && (
            <>
              {'. '}
              <Link to={`/editor/${flyerId}`} className="font-medium text-accent underline underline-offset-2">
                Flyer saved
              </Link>
            </>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" variant={flyerId ? 'secondary' : 'primary'} onClick={() => navigate(`/editor/new?birthday=${b.id}`)}>
          Make flyer
        </Button>
        {onEdit && (
          <Button size="sm" variant="ghost" onClick={onEdit} aria-label={`Edit ${full}`} className="hidden sm:inline-flex">
            Edit
          </Button>
        )}
        {onDelete && (
          <Button size="sm" variant="ghost" onClick={onDelete} aria-label={`Delete ${full}`} className="hidden text-danger hover:text-danger sm:inline-flex">
            Delete
          </Button>
        )}
      </div>
    </li>
  )
}
