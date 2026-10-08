import { FlyerPreview } from '../components/FlyerPreview'
import type { FlyerProps } from '../components/flyer/types'
import { Button, PageHeader } from '../components/ui'
import { themes } from '../config/themes'
import { pickTreatment } from '../config/treatments'
import { todayIso } from '../lib/date'
import { navigate } from '../lib/router'
import { brandStore, prefsStore } from '../lib/stores'

export default function TemplatesPage() {
  const [brand] = brandStore.use()
  const [prefs] = prefsStore.use()
  return (
    <>
      <PageHeader title="Templates" subtitle="Each template sets the colours and how the portrait blends into the artwork." />
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
        {themes.map((t) => {
          const treatment = pickTreatment(t.treatment)
          const flyer: FlyerProps = {
            title: 'Pastor',
            name: 'Daniel Bentley',
            date: todayIso(),
            headlineText: 'HAPPY BIRTHDAY',
            headlineFont: prefs.headlineFont,
            nameFont: prefs.nameFont,
            churchName: brand.churchName,
            wish: '',
            theme: t,
            aspect: '4:5',
            photo: null,
            confettiSeed: 7,
            showConfetti: true,
            showBlur: true,
          }
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => navigate(`/editor/new?template=${t.id}`)}
                className="block w-full rounded-[3px] text-left"
                aria-label={`Use the ${t.label} template`}
              >
                <FlyerPreview flyer={flyer} className="pointer-events-none" />
              </button>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm leading-5 font-semibold text-ink">{t.label}</h2>
                  <p className="text-xs leading-4 text-ink-3">
                    {treatment.label} blend{brand.defaultThemeId === t.id ? '. Default for new flyers' : ''}
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate(`/editor/new?template=${t.id}`)}>
                  Use
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
