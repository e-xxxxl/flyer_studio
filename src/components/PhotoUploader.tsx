import { useRef, useState, type DragEvent } from 'react'
import { Button, Toggle } from './ui'

export interface PhotoStatus {
  busy: boolean
  fraction: number | null
  label: string
  error: string | null
  notice: string | null
  firstRun: boolean
}

interface Props {
  status: PhotoStatus
  hasPhoto: boolean
  skipRemoval: boolean
  onSkipChange: (v: boolean) => void
  onFile: (f: File) => void
  onClear: () => void
}

export function PhotoUploader({ status, hasPhoto, skipRemoval, onSkipChange, onFile, onClear }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const drop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) onFile(f)
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
        className={`rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
          over ? 'border-amber-600 bg-amber-50' : 'border-stone-300 bg-stone-50'
        }`}
      >
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
            e.target.value = ''
          }}
        />
        {status.busy ? (
          <div className="space-y-2" role="status" aria-live="polite">
            <p className="text-sm font-medium text-stone-700">{status.label || 'Working on your photo'}</p>
            <div className="h-2 overflow-hidden rounded-full bg-stone-200">
              <div
                className={`h-full rounded-full bg-amber-700 transition-all ${status.fraction == null ? 'w-1/3 animate-pulse' : ''}`}
                style={status.fraction == null ? undefined : { width: `${Math.round(status.fraction * 100)}%` }}
              />
            </div>
            {status.firstRun && status.label.startsWith('Downloading') && (
              <p className="text-xs text-stone-500">Preparing the photo tool. This only happens once.</p>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-600">Drag a photo here, or</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Button variant="primary" onClick={() => input.current?.click()}>
                {hasPhoto ? 'Change photo' : 'Choose photo'}
              </Button>
              {hasPhoto && (
                <Button variant="ghost" onClick={onClear}>
                  Remove
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-stone-400">PNG, JPG or WebP</p>
          </>
        )}
      </div>

      {status.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {status.error}
        </p>
      )}
      {status.notice && !status.error && (
        <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {status.notice}
        </p>
      )}

      <Toggle checked={skipRemoval} onChange={onSkipChange} label="My photo already has a transparent background" />
    </div>
  )
}
