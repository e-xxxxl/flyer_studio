import { RotateCcw, FlipHorizontal2, Shuffle } from 'lucide-react'
import { useState } from 'react'
import { fontCss, headlineFonts, nameFonts, type FontOption } from '../../config/fonts'
import { aspectLabels, layouts, type Aspect } from '../../config/layouts'
import { CUSTOM_THEME_ID, themeColorFields, themes, type Theme, type ThemeColorKey } from '../../config/themes'
import { treatments } from '../../config/treatments'
import { formatDateLines } from '../../lib/date'
import { Link } from '../../lib/router'
import { colorsOf, defaultPhotoAdjust, TITLES } from '../../lib/settings'
import { brandStore, newId, savedThemeStore } from '../../lib/stores'
import { useLogo } from '../../lib/logo'
import type { Editor } from '../../pages/useEditor'
import { PhotoUploader } from '../PhotoUploader'
import { Button, Disclosure, Field, Group, Segmented, Select, Slider, TextArea, TextInput, Toggle } from '../ui'

export type EditorTab = 'content' | 'design' | 'photo' | 'brand'

/* ------------------------------------------------------------------ content */

export function ContentPanel({ ed }: { ed: Editor }) {
  const { s, update } = ed
  const dateLines = formatDateLines(s.date)
  return (
    <div className="space-y-6">
      <Group title="Celebrant">
        <div className="grid grid-cols-[8rem_1fr] gap-3">
          <Field label="Title">
            <Select value={s.title} onChange={(e) => update({ title: e.target.value })}>
              {TITLES.map((t) => (
                <option key={t} value={t}>
                  {t || 'None'}
                </option>
              ))}
              {!TITLES.includes(s.title) && <option value={s.title}>{s.title}</option>}
            </Select>
          </Field>
          <Field label="Name">
            <TextInput value={s.name} onChange={(e) => update({ name: e.target.value })} placeholder="Daniel Bentley" autoComplete="off" />
          </Field>
        </div>
      </Group>

      <Group title="Headline">
        <Field label="Text" hint="Change it for other occasions, like HAPPY ANNIVERSARY.">
          <TextInput value={s.headlineText} onChange={(e) => update({ headlineText: e.target.value })} />
        </Field>
      </Group>

      <Group title="Date">
        <Field label="Date" hint={!s.useCustomDate && dateLines.length ? `Shown as ${dateLines.join(' ')}` : undefined}>
          <TextInput type="date" value={s.date} onChange={(e) => update({ date: e.target.value })} />
        </Field>
        <Toggle checked={s.useCustomDate} onChange={(v) => update({ useCustomDate: v })} label="Write the date myself" />
        {s.useCustomDate && (
          <Field label="Date text" hint="One line per row, up to four rows.">
            <TextArea rows={3} value={s.dateOverride} onChange={(e) => update({ dateOverride: e.target.value })} placeholder={'SUN\n20 SEPT\n2026'} />
          </Field>
        )}
      </Group>

      <Group title="Message">
        <Field label="Wish or verse" hint="Printed above the logo. Leave empty for none.">
          <TextArea
            rows={2}
            maxLength={140}
            value={s.wish}
            onChange={(e) => update({ wish: e.target.value })}
            placeholder="Wishing you a blessed new year."
          />
        </Field>
      </Group>
    </div>
  )
}

/* ------------------------------------------------------------------- design */

function FontSelect({
  label,
  options,
  value,
  sample,
  onChange,
}: {
  label: string
  options: FontOption[]
  value: string
  sample: string
  onChange: (id: string) => void
}) {
  const current = options.find((o) => o.id === value) ?? options[0]
  return (
    <div>
      <Field label={label}>
        <Select value={current.id} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <p className="mt-2 truncate rounded-md bg-wash px-3 py-2 text-xl leading-7 text-ink" style={fontCss(current.spec, 'serif')} aria-hidden>
        {sample}
      </p>
    </div>
  )
}

function TemplateTile({ theme, selected, onSelect }: { theme: Theme; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group block rounded-md p-1 text-left transition-colors duration-150 ${selected ? 'bg-accent-soft' : 'hover:bg-ink/5'}`}
    >
      <span
        className={`block h-12 rounded-[3px] ring-1 transition-shadow duration-150 ${selected ? 'ring-2 ring-accent' : 'ring-line-2'}`}
        style={{
          background: `linear-gradient(135deg, ${theme.background} 0 38%, ${theme.glow} 38% 52%, ${theme.panelFrom} 52% 76%, ${theme.panelTo} 76%)`,
        }}
      />
      <span className={`mt-1.5 block truncate px-0.5 text-[13px] leading-4 ${selected ? 'font-medium text-ink' : 'text-ink-2'}`}>{theme.label}</span>
    </button>
  )
}

export function DesignPanel({ ed }: { ed: Editor }) {
  const { s, update, theme } = ed
  const [savedThemes, setSaved] = savedThemeStore.use()
  const [saveName, setSaveName] = useState('')

  const choose = (t: Theme) => update({ themeId: t.id, customColors: colorsOf(t), treatmentId: undefined })
  const setColor = (key: ThemeColorKey, value: string) =>
    update({ themeId: CUSTOM_THEME_ID, customColors: { ...colorsOf(theme), [key]: value } })

  const saveTheme = () => {
    const label = saveName.trim()
    if (!label) return
    const id = `saved-${newId()}`
    setSaved((list) => [...list, { id, label, colors: colorsOf(theme), treatment: ed.treatmentId }])
    update({ themeId: id, customColors: colorsOf(theme) })
    setSaveName('')
    ed.toast(`Saved "${label}".`)
  }

  const savedAsThemes: Theme[] = savedThemes.map((t) => ({ id: t.id, label: t.label, treatment: t.treatment ?? 'editorial', ...t.colors }))

  return (
    <div className="space-y-6">
      <Group title="Template">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-2">
          {[...themes, ...savedAsThemes].map((t) => (
            <TemplateTile key={t.id} theme={t} selected={s.themeId === t.id} onSelect={() => choose(t)} />
          ))}
        </div>
        {s.themeId === CUSTOM_THEME_ID && <p className="text-xs text-ink-3">Custom colours in use. Save them below to reuse them.</p>}
      </Group>

      <Group title="Typography">
        <FontSelect
          label="Headline font"
          options={headlineFonts}
          value={s.headlineFont}
          sample="Happy Birthday"
          onChange={(id) => update({ headlineFont: id })}
        />
        <FontSelect label="Name font" options={nameFonts} value={s.nameFont} sample="Daniel Bentley" onChange={(id) => update({ nameFont: id })} />
      </Group>

      <Group title="Format">
        {/* On desktop the format switch lives under the canvas. */}
        <div className="lg:hidden">
          <AspectSwitch aspect={s.aspect} onChange={(a) => update({ aspect: a })} />
        </div>
        <Toggle checked={s.showConfetti} onChange={(v) => update({ showConfetti: v })} label="Confetti" />
        {s.showConfetti && (
          <Button size="sm" onClick={() => update({ confettiSeed: Math.floor(Math.random() * 1e9) })}>
            <Shuffle className="size-4" aria-hidden /> Shuffle confetti
          </Button>
        )}
        <Toggle checked={s.showBlur} onChange={(v) => update({ showBlur: v })} label="Foreground haze" hint="Soft light over the lower part of the portrait." />
      </Group>

      <Disclosure title="Custom colours">
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
          {themeColorFields.map((f) => (
            <label key={f.key} className="flex items-center gap-2.5 text-[13px] text-ink-2">
              <input
                type="color"
                value={theme[f.key]}
                onChange={(e) => setColor(f.key, e.target.value)}
                className="size-10 shrink-0 lg:size-9"
                aria-label={f.label}
              />
              {f.label}
            </label>
          ))}
        </div>
        <div className="flex gap-2 border-t border-line pt-4">
          <TextInput
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveTheme()}
            placeholder="Name these colours"
            aria-label="Name for the saved colours"
          />
          <Button onClick={saveTheme} disabled={!saveName.trim()}>
            Save
          </Button>
        </div>
        {savedThemes.length > 0 && (
          <ul className="divide-y divide-line rounded-md border border-line">
            {savedThemes.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-3 py-1.5 text-sm">
                {t.label}
                <button
                  type="button"
                  className="h-8 px-1 text-xs text-danger hover:underline"
                  onClick={() => {
                    setSaved((list) => list.filter((x) => x.id !== t.id))
                    if (s.themeId === t.id) update({ themeId: CUSTOM_THEME_ID, customColors: t.colors })
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </Disclosure>
    </div>
  )
}

export function AspectSwitch({ aspect, onChange }: { aspect: Aspect; onChange: (a: Aspect) => void }) {
  return (
    <Segmented<Aspect>
      label="Flyer format"
      value={aspect}
      onChange={onChange}
      options={(Object.keys(aspectLabels) as Aspect[]).map((a) => ({ value: a, label: aspectLabels[a] }))}
    />
  )
}

/* -------------------------------------------------------------------- photo */

export function PhotoPanel({ ed }: { ed: Editor }) {
  const { s, update, setPhotoAdjust, status, cutout, treatment } = ed
  const L = layouts[s.aspect]
  const p = s.photo
  const hasPhoto = !!cutout
  return (
    <div className="space-y-6">
      <Group title="Portrait">
        <PhotoUploader status={status} hasPhoto={hasPhoto} onFile={ed.onFile} onClear={ed.clearPhoto} />
        <Toggle
          checked={s.skipRemoval}
          onChange={ed.onSkipChange}
          label="Already cut out"
          hint="Turn on if the photo has a transparent background."
        />
      </Group>

      {hasPhoto && (
        <>
          <Group title="Position">
            <p className="text-xs text-ink-3">Drag the photo on the flyer, or use the sliders.</p>
            <Slider label="Size" min={0.5} max={1.8} step={0.01} value={p.scale} display={`${Math.round(p.scale * 100)}%`} onChange={(v) => setPhotoAdjust({ scale: v })} />
            <Slider label="Horizontal" min={-0.3} max={0.3} step={0.002} value={p.offsetX} display={signed(p.offsetX)} onChange={(v) => setPhotoAdjust({ offsetX: v })} />
            <Slider label="Vertical" min={-0.2} max={0.3} step={0.002} value={p.offsetY} display={signed(p.offsetY)} onChange={(v) => setPhotoAdjust({ offsetY: v })} />
            <Slider
              label="Overlap with headline"
              min={-0.04}
              max={0.16}
              step={0.002}
              value={p.overlap ?? L.photo.overlap}
              display={`${Math.round((p.overlap ?? L.photo.overlap) * 1000) / 10}%`}
              onChange={(v) => setPhotoAdjust({ overlap: v })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setPhotoAdjust({ flip: !p.flip })}>
                <FlipHorizontal2 className="size-4" aria-hidden /> Flip
              </Button>
              <Button onClick={() => update({ photo: defaultPhotoAdjust })}>
                <RotateCcw className="size-4" aria-hidden /> Reset
              </Button>
            </div>
          </Group>

          <Group title="Blend">
            <Field label="Edge treatment" hint={treatment.note}>
              <Select value={ed.treatmentId} onChange={(e) => update({ treatmentId: e.target.value })}>
                {treatments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            {cutout?.rect && (
              <p className="rounded-md border border-line bg-wash px-3 py-2 text-xs text-ink-2">
                This photo still has its background, so its edges are feathered into an oval. Use a cut-out for the cleanest result.
              </p>
            )}
          </Group>

          <Disclosure title="Crop">
            <Slider label="Top" min={0} max={0.4} step={0.005} value={p.cropTop} display={pct(p.cropTop)} onChange={(v) => setPhotoAdjust({ cropTop: v })} />
            <Slider label="Bottom" min={0} max={0.4} step={0.005} value={p.cropBottom} display={pct(p.cropBottom)} onChange={(v) => setPhotoAdjust({ cropBottom: v })} />
            <Slider label="Left" min={0} max={0.4} step={0.005} value={p.cropLeft} display={pct(p.cropLeft)} onChange={(v) => setPhotoAdjust({ cropLeft: v })} />
            <Slider label="Right" min={0} max={0.4} step={0.005} value={p.cropRight} display={pct(p.cropRight)} onChange={(v) => setPhotoAdjust({ cropRight: v })} />
          </Disclosure>
        </>
      )}
    </div>
  )
}

const pct = (v: number) => `${Math.round(v * 100)}%`
const signed = (v: number) => `${v > 0 ? '+' : ''}${(v * 100).toFixed(1)}`

/* ----------------------------------------------------------------- branding */

export function BrandPanel({ ed }: { ed: Editor }) {
  const [brandSettings, setBrand] = brandStore.use()
  const lightBackdrop = true
  const logo = useLogo(lightBackdrop, '#7a1410')
  const isPreset = themes.some((t) => t.id === ed.s.themeId)
  return (
    <div className="space-y-6">
      <Group title="Church">
        <Field label="Church name" hint="Printed under the logo on every flyer.">
          <TextInput value={brandSettings.churchName} onChange={(e) => setBrand((b) => ({ ...b, churchName: e.target.value }))} />
        </Field>
        <div className="flex items-center gap-4 rounded-md border border-line bg-paper px-4 py-3">
          {logo ? <img src={logo.url} alt="" className="h-7 w-auto" /> : <span className="h-7 w-16 rounded-sm bg-line" />}
          <p className="text-xs leading-4 text-ink-3">The logo is the same on every flyer. It adapts its colour to the template.</p>
        </div>
      </Group>

      <Group title="Defaults">
        <Button
          disabled={!isPreset || brandSettings.defaultThemeId === ed.s.themeId}
          onClick={() => {
            setBrand((b) => ({ ...b, defaultThemeId: ed.s.themeId }))
            ed.toast('New flyers will start with this template.')
          }}
        >
          Use this template for new flyers
        </Button>
        <p className="text-xs text-ink-3">
          More branding options, including the default message, are in{' '}
          <Link to="/settings" className="font-medium text-accent underline underline-offset-2">
            Settings
          </Link>
          .
        </p>
      </Group>
    </div>
  )
}

export function EditorPanel({ tab, ed }: { tab: EditorTab; ed: Editor }) {
  if (tab === 'content') return <ContentPanel ed={ed} />
  if (tab === 'design') return <DesignPanel ed={ed} />
  if (tab === 'photo') return <PhotoPanel ed={ed} />
  return <BrandPanel ed={ed} />
}

