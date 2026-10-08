import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BirthdayRow } from '../components/cards'
import { Button, ConfirmDialog, Dialog, EmptyState, Field, PageHeader, Select, TextInput, useToast } from '../components/ui'
import { monthLong, nextOccurrence, toMonthDay, todayIso } from '../lib/date'
import { useFlyers } from '../lib/flyerDb'
import { TITLES } from '../lib/settings'
import { birthdayStore, newId, type Birthday } from '../lib/stores'

export function useBirthdayList() {
  const [list] = birthdayStore.use()
  return useMemo(
    () => [...list].map((b) => ({ b, next: nextOccurrence(b.md) })).sort((x, y) => x.next.localeCompare(y.next)),
    [list],
  )
}

/** Id of the newest saved flyer made from each birthday. */
export function useFlyerByBirthday() {
  const { flyers } = useFlyers()
  return useMemo(() => {
    const m = new Map<string, string>()
    for (const f of flyers) if (f.birthdayId && !m.has(f.birthdayId)) m.set(f.birthdayId, f.id)
    return m
  }, [flyers])
}

interface Draft {
  id: string | null
  title: string
  name: string
  date: string
}

export default function BirthdaysPage() {
  const sorted = useBirthdayList()
  const flyerBy = useFlyerByBirthday()
  const toast = useToast()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [removing, setRemoving] = useState<Birthday | null>(null)

  const openNew = () => setDraft({ id: null, title: 'Pastor', name: '', date: todayIso() })
  const openEdit = (b: Birthday) => setDraft({ id: b.id, title: b.title, name: b.name, date: `${new Date().getFullYear()}-${b.md}` })

  const submit = () => {
    if (!draft || !draft.name.trim() || !draft.date) return
    const entry: Birthday = { id: draft.id ?? newId(), title: draft.title, name: draft.name.trim(), md: toMonthDay(draft.date) }
    birthdayStore.set((list) => (draft.id ? list.map((x) => (x.id === draft.id ? entry : x)) : [...list, entry]))
    toast(draft.id ? 'Birthday updated.' : 'Birthday added.')
    setDraft(null)
  }

  // Group by month of the next occurrence so the list reads as a calendar.
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: typeof sorted }[] = []
    for (const row of sorted) {
      const [y, m] = row.next.split('-').map(Number)
      const key = `${y}-${m}`
      let g = out.find((x) => x.key === key)
      if (!g) {
        g = { key, label: `${monthLong(m)} ${y}`, items: [] }
        out.push(g)
      }
      g.items.push(row)
    }
    return out
  }, [sorted])

  return (
    <>
      <PageHeader
        title="Birthdays"
        subtitle={sorted.length ? 'Sorted by what is coming up next.' : undefined}
        actions={
          <Button variant={sorted.length ? 'secondary' : 'primary'} onClick={openNew}>
            <Plus className="size-4" aria-hidden /> Add birthday
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          title="No birthdays yet"
          body="Add the birthdays your church celebrates, then make each flyer in a few taps. Only the month and day are kept."
          action={
            <Button variant="primary" onClick={openNew}>
              <Plus className="size-4" aria-hidden /> Add birthday
            </Button>
          }
        />
      ) : (
        <div className="max-w-2xl space-y-8">
          {groups.map((g) => (
            <section key={g.key} aria-label={g.label}>
              <h2 className="border-b border-line pb-2 text-[11px] leading-4 font-semibold tracking-[0.08em] text-ink-3 uppercase">{g.label}</h2>
              <ul className="divide-y divide-line">
                {g.items.map(({ b }) => (
                  <BirthdayRow key={b.id} b={b} flyerId={flyerBy.get(b.id)} onEdit={() => openEdit(b)} onDelete={() => setRemoving(b)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Dialog
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit birthday' : 'Add birthday'}
        footer={
          <>
            {draft?.id && (
              <Button
                variant="danger"
                className="mr-auto"
                onClick={() => {
                  const b = sorted.find((x) => x.b.id === draft.id)?.b
                  setDraft(null)
                  if (b) setRemoving(b)
                }}
              >
                Delete
              </Button>
            )}
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={!draft?.name.trim()}>
              {draft?.id ? 'Save' : 'Add'}
            </Button>
          </>
        }
      >
        {draft && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <div className="grid grid-cols-[8rem_1fr] gap-3">
              <Field label="Title">
                <Select value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}>
                  {TITLES.map((t) => (
                    <option key={t} value={t}>
                      {t || 'None'}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Name">
                <TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Daniel Bentley" autoFocus autoComplete="off" />
              </Field>
            </div>
            <Field label="Birthday" hint="Only the month and day are kept.">
              <TextInput type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </Field>
            <button type="submit" className="sr-only">
              Save
            </button>
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!removing}
        title="Delete this birthday?"
        body={removing ? `${[removing.title, removing.name].filter(Boolean).join(' ')} will be removed from the list. Saved flyers are not affected.` : ''}
        confirmLabel="Delete"
        danger
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) birthdayStore.set((l) => l.filter((x) => x.id !== removing.id))
          setRemoving(null)
          toast('Birthday deleted.')
        }}
      />
    </>
  )
}
