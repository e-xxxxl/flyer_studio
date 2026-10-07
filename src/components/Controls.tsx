import { useState } from 'react'
import { fontCss, headlineFonts, nameFonts, type FontOption } from '../config/fonts'
import { aspectLabels, layouts, type Aspect } from '../config/layouts'
import { CUSTOM_THEME_ID, themeColorFields, themes, type ThemeColorKey } from '../config/themes'
import { formatDateLines } from '../lib/date'
import {
  colorsOf,
  defaultPhotoAdjust,
  resolveTheme,
  TITLES,
  type PhotoAdjust,
  type Settings,
} from '../lib/settings'
import { PhotoUploader, type PhotoStatus } from './PhotoUploader'
import { Button, Field, Section, Segmented, Select, Slider, TextArea, TextInput, Toggle } from './ui'

interface Props {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  hasPhoto: boolean
  photoStatus: PhotoStatus
  onFile: (f: File) => void
  onClearPhoto: () => void
  onSkipChange: (v: boolean) => void
}

export function Controls({ settings: s, update, hasPhoto, photoStatus, onFile, onClearPhoto, onSkipChange }: Props) {
  const theme = resolveTheme(s)
  const [saveName, setSaveName] = useState('')
  const L = layouts[s.aspect]
  const setPhoto = (patch: Partial<PhotoAdjust>) => update({ photo: { ...s.photo, ...patch } })

  const setColor = (key: ThemeColorKey, value: string) =>
    update({ themeId: CUSTOM_THEME_ID, customColors: { ...colorsOf(theme), [key]: value } })

  const saveTheme = () => {
    const label = saveName.trim()
    if (!label) return
    const id = `saved-${Date.now()}`
    update({
      savedThemes: [...s.savedThemes, { id, label, colors: colorsOf(theme) }],
      themeId: id,
    })
    setSaveName('')
  }

  const dateLines = formatDateLines(s.date)

  return (
    <div className="space-y-3">
      <Section title="Celebrant">
        <div className="grid grid-cols-[7.5rem_1fr] gap-3">
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
            <TextInput
              value={s.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Daniel Bentley"
              autoComplete="off"
            />
          </Field>
        </div>
        <Field label="Headline" hint="Change it for other occasions, like HAPPY ANNIVERSARY.">
          <TextInput value={s.headlineText} onChange={(e) => update({ headlineText: e.target.value })} />
        </Field>
      </Section>

      <Section title="Date">
        <Field label="Date" hint={dateLines.length ? `Shows as ${dateLines.join(' ')}` : undefined}>
          <TextInput type="date" value={s.date} onChange={(e) => update({ date: e.target.value })} />
        </Field>
        <Toggle checked={s.useCustomDate} onChange={(v) => update({ useCustomDate: v })} label="Use my own date text" />
        {s.useCustomDate && (
          <Field label="Custom date text" hint="One line per row, up to 4 rows.">
            <TextArea
              rows={3}
              value={s.dateOverride}
              onChange={(e) => update({ dateOverride: e.target.value })}
              placeholder={'SUN\n20 SEPT\n2026'}
            />
          </Field>
        )}
      </Section>

      <Section title="Photo">
        <PhotoUploader
          status={photoStatus}
          hasPhoto={hasPhoto}
          skipRemoval={s.skipRemoval}
          onSkipChange={onSkipChange}
          onFile={onFile}
          onClear={onClearPhoto}
        />
        {hasPhoto && (
          <div className="space-y-3 border-t border-stone-100 pt-4">
            <p className="text-xs text-stone-500">Drag the photo on the flyer to move it.</p>
            <Slider
              label="Size"
              min={0.5}
              max={1.8}
              step={0.01}
              value={s.photo.scale}
              display={`${Math.round(s.photo.scale * 100)}%`}
              onChange={(v) => setPhoto({ scale: v })}
            />
            <Slider
              label="Headline overlap"
              min={-0.04}
              max={0.16}
              step={0.002}
              value={s.photo.overlap ?? L.photo.overlap}
              display={`${Math.round((s.photo.overlap ?? L.photo.overlap) * 1000) / 10}%`}
              onChange={(v) => setPhoto({ overlap: v })}
            />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setPhoto({ flip: !s.photo.flip })}>
                Flip
              </Button>
              <Button className="flex-1" onClick={() => update({ photo: defaultPhotoAdjust })}>
                Reset photo
              </Button>
            </div>
          </div>
        )}
      </Section>

      <Section title="Fonts" defaultOpen={false}>
        <FontPicker label="Headline font" sample="HAPPY BIRTHDAY" options={headlineFonts} value={s.headlineFont} onChange={(id) => update({ headlineFont: id })} />
        <FontPicker label="Name font" sample="DANIEL BENTLEY" options={nameFonts} value={s.nameFont} onChange={(id) => update({ nameFont: id })} />
      </Section>

      <Section title="Theme and colors">
        <div className="grid grid-cols-2 gap-2">
          {[...themes, ...s.savedThemes.map((t) => ({ id: t.id, label: t.label, ...t.colors }))].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => update({ themeId: t.id })}
              aria-pressed={s.themeId === t.id}
              className={`flex min-h-12 items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs font-medium transition ${
                s.themeId === t.id ? 'border-amber-700 bg-amber-50 ring-1 ring-amber-700' : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span
                className="size-8 shrink-0 rounded-md ring-1 ring-black/10"
                style={{ background: `linear-gradient(135deg, ${t.background} 0 45%, ${t.panelFrom} 45% 70%, ${t.panelTo} 70%)` }}
              />
              <span className="leading-tight">{t.label}</span>
            </button>
          ))}
          {s.themeId === CUSTOM_THEME_ID && (
            <div className="flex min-h-12 items-center gap-2 rounded-lg border border-amber-700 bg-amber-50 px-2 py-1.5 text-xs font-medium ring-1 ring-amber-700">
              <span className="size-8 shrink-0 rounded-md" style={{ background: 'conic-gradient(#f7b22e, #ff4d12, #7b2cff, #1f6cff, #14b37a, #f7b22e)' }} />
              Custom
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-3 pt-1">
          {themeColorFields.map((f) => (
            <label key={f.key} className="flex items-center gap-2 text-xs font-medium text-stone-600">
              <input
                type="color"
                value={theme[f.key]}
                onChange={(e) => setColor(f.key, e.target.value)}
                className="size-9 shrink-0 cursor-pointer rounded-md border border-stone-300 bg-white p-0.5"
              />
              {f.label}
            </label>
          ))}
        </div>

        <div className="flex gap-2 border-t border-stone-100 pt-4">
          <TextInput
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveTheme()}
            placeholder="Name this theme"
            aria-label="Theme name"
          />
          <Button onClick={saveTheme} disabled={!saveName.trim()}>
            Save
          </Button>
        </div>
        {s.savedThemes.length > 0 && (
          <ul className="space-y-1">
            {s.savedThemes.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-1.5 text-sm">
                {t.label}
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline"
                  onClick={() =>
                    update({
                      savedThemes: s.savedThemes.filter((x) => x.id !== t.id),
                      themeId: s.themeId === t.id ? CUSTOM_THEME_ID : s.themeId,
                      customColors: s.themeId === t.id ? t.colors : s.customColors,
                    })
                  }
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Layout">
        <Segmented<Aspect>
          value={s.aspect}
          onChange={(a) => update({ aspect: a })}
          options={(Object.keys(aspectLabels) as Aspect[]).map((a) => ({ value: a, label: aspectLabels[a] }))}
        />
        <Toggle checked={s.showConfetti} onChange={(v) => update({ showConfetti: v })} label="Confetti" />
        {s.showConfetti && (
          <Button onClick={() => update({ confettiSeed: Math.floor(Math.random() * 1e9) })}>Shuffle confetti</Button>
        )}
        <Toggle checked={s.showBlur} onChange={(v) => update({ showBlur: v })} label="Foreground blur" />
      </Section>
    </div>
  )
}

function FontPicker({
  label,
  sample,
  options,
  value,
  onChange,
}: {
  label: string
  sample: string
  options: FontOption[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-stone-600">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={`flex min-h-16 flex-col justify-center rounded-lg border px-2 py-1.5 text-left transition ${
              value === o.id ? 'border-amber-700 bg-amber-50 ring-1 ring-amber-700' : 'border-stone-200 hover:bg-stone-50'
            }`}
          >
            <span className="truncate text-lg leading-tight text-stone-900" style={fontCss(o.spec, 'serif')}>
              {sample}
            </span>
            <span className="mt-0.5 text-[11px] text-stone-500">{o.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
