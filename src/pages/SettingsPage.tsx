import { Check } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { FlyerPreview } from '../components/FlyerPreview'
import type { FlyerProps } from '../components/flyer/types'
import { Button, Dialog, Field, PageHeader, TextArea, TextInput } from '../components/ui'
import { brand } from '../config/brand'
import { themes } from '../config/themes'
import { pickTreatment } from '../config/treatments'
import { todayIso } from '../lib/date'
import { lightLogoExists, resolveLogo, type LogoAsset } from '../lib/logo'
import { useInstall } from '../lib/pwa'
import { brandStore, prefsStore } from '../lib/stores'

function Block({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line py-7 first:border-t-0 first:pt-0 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
      <div>
        <h2 className="text-[15px] leading-5 font-semibold text-ink">{title}</h2>
        {intro && <p className="mt-1 text-sm text-ink-2">{intro}</p>}
      </div>
      <div className="max-w-xl space-y-5">{children}</div>
    </section>
  )
}

function LogoTile({ asset, dark, caption }: { asset: LogoAsset | null; dark: boolean; caption: string }) {
  return (
    <figure>
      <div
        className={`grid h-24 place-items-center rounded-md ${dark ? 'bg-[#1f0606]' : 'bg-paper ring-1 ring-line-2'}`}
      >
        {asset ? <img src={asset.url} alt={`Church logo for ${caption.toLowerCase()}`} className="h-7 w-auto" /> : <span className="text-xs text-ink-3">No logo found</span>}
      </div>
      <figcaption className="mt-2 text-xs text-ink-3">{caption}</figcaption>
    </figure>
  )
}

export default function SettingsPage() {
  const [b, setB] = brandStore.use()
  const [prefs] = prefsStore.use()
  const install = useInstall()
  const [onDark, setOnDark] = useState<LogoAsset | null>(null)
  const [onLight, setOnLight] = useState<LogoAsset | null>(null)
  const [hasLight, setHasLight] = useState<boolean | null>(null)
  const [iosHelp, setIosHelp] = useState(false)

  useEffect(() => {
    resolveLogo(false, '#ffffff').then(setOnDark)
    resolveLogo(true, '#7a1410').then(setOnLight)
    lightLogoExists().then(setHasLight)
  }, [])

  const theme = themes.find((t) => t.id === b.defaultThemeId) ?? themes[0]
  const sample: FlyerProps = {
    title: 'Pastor',
    name: 'Daniel Bentley',
    date: todayIso(),
    headlineText: 'HAPPY BIRTHDAY',
    headlineFont: prefs.headlineFont,
    nameFont: prefs.nameFont,
    churchName: b.churchName,
    wish: b.defaultWish,
    theme,
    aspect: '4:5',
    photo: null,
    confettiSeed: 7,
    showConfetti: true,
    showBlur: true,
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Church branding and defaults for new flyers." />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-14">
        <div>
          <Block title="Church" intro="Appears under the logo on every flyer and at the top of the app.">
            <Field label="Church name">
              <TextInput value={b.churchName} onChange={(e) => setB((x) => ({ ...x, churchName: e.target.value }))} />
            </Field>
          </Block>

          <Block title="Logo" intro="One logo, used everywhere. It changes colour to stay readable on each template.">
            <div className="grid grid-cols-2 gap-3">
              <LogoTile asset={onDark} dark caption="On dark artwork" />
              <LogoTile asset={onLight} dark={false} caption="On light artwork" />
            </div>
            <p className="text-xs leading-5 text-ink-3">
              To change the logo, replace <code className="rounded-sm bg-canvas px-1 py-0.5 text-[12px] text-ink">{brand.logoPath.replace(/^\//, '')}</code> with a
              transparent PNG and rebuild. An optional{' '}
              <code className="rounded-sm bg-canvas px-1 py-0.5 text-[12px] text-ink">brand/logo-light.png</code> is used on dark artwork when present
              {hasLight === null ? '' : hasLight ? ' (found).' : ' (not found, so the main logo is recoloured instead).'}
            </p>
          </Block>

          <Block title="Default template" intro="The colours and photo blend new flyers start with.">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {themes.map((t) => {
                const on = t.id === b.defaultThemeId
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setB((x) => ({ ...x, defaultThemeId: t.id }))}
                    className={`block rounded-md p-1.5 text-left transition-colors duration-150 ${on ? 'bg-accent-soft' : 'hover:bg-ink/5'}`}
                  >
                    <span
                      className={`flex h-12 items-end justify-end rounded-[3px] p-1 ring-1 ${on ? 'ring-2 ring-accent' : 'ring-line-2'}`}
                      style={{ background: `linear-gradient(135deg, ${t.background} 0 38%, ${t.glow} 38% 52%, ${t.panelFrom} 52% 76%, ${t.panelTo} 76%)` }}
                    >
                      {on && <Check aria-hidden className="size-4 rounded-full bg-accent p-0.5 text-white" />}
                    </span>
                    <span className="mt-1.5 block truncate text-[13px] leading-4 text-ink">{t.label}</span>
                    <span className="block text-xs leading-4 text-ink-3">{pickTreatment(t.treatment).label} blend</span>
                  </button>
                )
              })}
            </div>
          </Block>

          <Block title="Birthday message" intro="An optional wish or verse added above the logo on new flyers.">
            <Field label="Default message" hint={`${b.defaultWish.length} of 140 characters. Leave empty for none.`}>
              <TextArea
                rows={3}
                maxLength={140}
                value={b.defaultWish}
                onChange={(e) => setB((x) => ({ ...x, defaultWish: e.target.value }))}
                placeholder="Wishing you a blessed new year."
              />
            </Field>
          </Block>

          <Block title="App" intro="Keep Flyer Studio on this device's home screen.">
            {install.installed ? (
              <p className="text-sm text-ink-2">Flyer Studio is installed on this device.</p>
            ) : install.canPrompt ? (
              <Button onClick={install.prompt}>Install Flyer Studio</Button>
            ) : install.manualIos ? (
              <Button onClick={() => setIosHelp(true)}>Add to Home Screen</Button>
            ) : (
              <p className="text-sm text-ink-2">Use your browser menu to install this app when it offers the option.</p>
            )}
          </Block>
        </div>

        <aside aria-label="Preview" className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-[11px] leading-4 font-semibold tracking-[0.08em] text-ink-3 uppercase">Preview</p>
          <div className="mx-auto max-w-[280px]">
            <FlyerPreview flyer={sample} className="pointer-events-none" />
          </div>
          <p className="mt-3 text-xs leading-4 text-ink-3">How your branding looks on a new flyer.</p>
        </aside>
      </div>

      <Dialog
        open={iosHelp}
        onClose={() => setIosHelp(false)}
        title="Add to Home Screen"
        footer={
          <Button variant="primary" onClick={() => setIosHelp(false)}>
            Done
          </Button>
        }
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-2">
          <li>Open this page in Safari.</li>
          <li>
            Tap the <strong className="font-semibold text-ink">Share</strong> button at the bottom of the screen.
          </li>
          <li>
            Choose <strong className="font-semibold text-ink">Add to Home Screen</strong>, then <strong className="font-semibold text-ink">Add</strong>.
          </li>
        </ol>
      </Dialog>
    </>
  )
}
