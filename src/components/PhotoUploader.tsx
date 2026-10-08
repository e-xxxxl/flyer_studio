import { ImagePlus } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { Button } from './ui'

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
  onFile: (f: File) => void
  onClear: () => void
}

export function PhotoUploader({ status, hasPhoto, onFile, onClear }: Props) {
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
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
        className={`rounded-md border border-dashed px-4 py-5 text-center transition-colors duration-150 ${
          over ? 'border-accent bg-accent-soft' : 'border-line-2 bg-wash'
        }`}
      >
        {status.busy ? (
          <div role="status" aria-live="polite" className="space-y-2.5 text-left">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-ink">{status.label || 'Working on your photo'}</span>
              {status.fraction != null && <span className="text-ink-3 tabular-nums">{Math.round(status.fraction * 100)}%</span>}
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-line">
              <div
                className={`h-full rounded-full bg-accent transition-[width] duration-200 ${status.fraction == null ? 'w-1/3 animate-pulse' : ''}`}
                style={status.fraction == null ? undefined : { width: `${Math.round(status.fraction * 100)}%` }}
              />
            </div>
            {status.firstRun && status.label.startsWith('Downloading') && (
              <p className="text-xs text-ink-3">Preparing the photo tool. This only happens once.</p>
            )}
          </div>
        ) : (
          <>
            <ImagePlus aria-hidden className="mx-auto mb-2 size-6 text-ink-3" strokeWidth={1.5} />
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant={hasPhoto ? 'secondary' : 'primary'} onClick={() => input.current?.click()}>
                {hasPhoto ? 'Replace photo' : 'Choose photo'}
              </Button>
              {hasPhoto && (
                <Button variant="ghost" onClick={onClear}>
                  Remove
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-ink-3">or drop it here. PNG, JPG or WebP.</p>
          </>
        )}
      </div>

      {status.error && (
        <p role="alert" className="rounded-md border border-danger/25 bg-danger/5 px-3 py-2 text-sm text-danger">
          {status.error}
        </p>
      )}
      {status.notice && !status.error && (
        <p role="status" className="rounded-md border border-line-2 bg-wash px-3 py-2 text-sm text-ink-2">
          {status.notice}
        </p>
      )}
    </div>
  )
}
