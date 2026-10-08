import { Plus } from 'lucide-react'
import { BirthdayRow, FlyerCard } from '../components/cards'
import { startFlyer } from '../components/Shell'
import { Button, EmptyState, PageHeader, SectionHeader, useToast } from '../components/ui'
import { themes } from '../config/themes'
import { pickTreatment } from '../config/treatments'
import { useFlyers, deleteFlyer } from '../lib/flyerDb'
import { Link, navigate } from '../lib/router'
import { brandStore } from '../lib/stores'
import { useBirthdayList, useFlyerByBirthday } from './BirthdaysPage'
import { duplicateFlyer } from './FlyersPage'

export default function HomePage() {
  const [brand] = brandStore.use()
  const birthdays = useBirthdayList()
  const flyerBy = useFlyerByBirthday()
  const { flyers, ready } = useFlyers()
  const toast = useToast()
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <PageHeader title="Home" subtitle={`${brand.churchName}. ${today}.`} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
        <div className="space-y-12">
          <section aria-labelledby="up-title">
            <SectionHeader
              title="Upcoming birthdays"
              action={
                <Link to="/birthdays" className="-my-3 inline-flex min-h-11 items-center text-sm font-medium text-accent hover:underline lg:my-0 lg:min-h-0">
                  All birthdays
                </Link>
              }
            />
            {birthdays.length === 0 ? (
              <EmptyState
                title="No birthdays yet"
                body="Add the birthdays your church celebrates and make each flyer in a few taps."
                action={<Button onClick={() => navigate('/birthdays')}>Add birthdays</Button>}
              />
            ) : (
              <ul className="divide-y divide-line">
                {birthdays.slice(0, 4).map(({ b }) => (
                  <BirthdayRow key={b.id} b={b} flyerId={flyerBy.get(b.id)} />
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="recent-title">
            <SectionHeader
              title="Recent flyers"
              action={
                <Link to="/flyers" className="-my-3 inline-flex min-h-11 items-center text-sm font-medium text-accent hover:underline lg:my-0 lg:min-h-0">
                  All flyers
                </Link>
              }
            />
            {!ready ? null : flyers.length === 0 ? (
              <EmptyState
                title="No saved flyers yet"
                body="Create your first flyer to get started."
                action={
                  <Button variant="primary" className="hidden lg:inline-flex" onClick={startFlyer}>
                    <Plus className="size-4" aria-hidden /> Create Flyer
                  </Button>
                }
              />
            ) : (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:gap-x-6">
                {flyers.slice(0, 3).map((f) => (
                  <li key={f.id}>
                    <FlyerCard
                      flyer={f}
                      onDuplicate={async () => {
                        await duplicateFlyer(f)
                        toast('Flyer duplicated.')
                      }}
                      onDelete={async () => {
                        await deleteFlyer(f.id)
                        toast('Flyer deleted.')
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside aria-label="Templates">
          <SectionHeader
            title="Start from a template"
            action={
              <Link to="/templates" className="-my-3 inline-flex min-h-11 items-center text-sm font-medium text-accent hover:underline lg:my-0 lg:min-h-0">
                Browse
              </Link>
            }
          />
          <ul className="divide-y divide-line">
            {themes.map((t) => (
              <li key={t.id}>
                <Link to={`/editor/new?template=${t.id}`} className="flex items-center gap-3 py-2.5 transition-colors duration-150 hover:bg-ink/[0.03]">
                  <span
                    aria-hidden
                    className="h-9 w-12 shrink-0 rounded-[3px] ring-1 ring-line-2"
                    style={{ background: `linear-gradient(135deg, ${t.background} 0 38%, ${t.glow} 38% 52%, ${t.panelFrom} 52% 76%, ${t.panelTo} 76%)` }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm leading-5 font-medium text-ink">{t.label}</span>
                    <span className="block text-xs leading-4 text-ink-3">{pickTreatment(t.treatment).label} photo blend</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  )
}
