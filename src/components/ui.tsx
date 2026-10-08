import { ChevronDown, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

/* ------------------------------------------------------------------ buttons */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm'

const variantCls: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-2 active:bg-accent-2 disabled:bg-line-2 disabled:text-ink-3',
  secondary: 'border border-line-2 bg-paper text-ink hover:bg-wash active:bg-line disabled:text-ink-3 disabled:hover:bg-paper',
  ghost: 'text-ink-2 hover:bg-ink/5 hover:text-ink active:bg-ink/10 disabled:text-ink-3 disabled:hover:bg-transparent',
  danger: 'border border-line-2 bg-paper text-danger hover:bg-danger/5 active:bg-danger/10',
}
const sizeCls: Record<Size, string> = {
  md: 'h-11 px-4 lg:h-10',
  sm: 'h-10 px-3 lg:h-9',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type={type}
      {...rest}
      className={`inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed ${sizeCls[size]} ${variantCls[variant]} ${className}`}
    />
  )
}

export function IconButton({
  label,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      {...rest}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors duration-150 hover:bg-ink/5 hover:text-ink active:bg-ink/10 disabled:cursor-not-allowed disabled:text-ink-3 lg:size-9 ${className}`}
    >
      {children}
    </button>
  )
}

/* -------------------------------------------------------------------- forms */

const controlCls =
  'block w-full rounded-md border border-line-2 bg-paper px-3 text-base text-ink transition-colors duration-150 placeholder:text-ink-3 hover:border-ink-3 focus:border-accent focus:outline-none focus-visible:outline-none focus:ring-1 focus:ring-accent disabled:bg-wash disabled:text-ink-3 sm:text-sm'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] leading-4 font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-4 text-ink-3">{hint}</span>}
    </label>
  )
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${controlCls} h-11 lg:h-10 ${className}`} />
}

export function TextArea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${controlCls} resize-none py-2.5 leading-5 ${className}`} />
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select {...props} className={`${controlCls} h-11 appearance-none pr-9 lg:h-10 ${className}`}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3" />
    </span>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  const id = useId()
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 lg:min-h-9">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm text-ink">{label}</span>
        {hint && <span className="block text-xs leading-4 text-ink-3">{hint}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150 ${checked ? 'bg-accent' : 'bg-line-2'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${checked ? 'translate-x-4' : ''}`}
        />
      </button>
    </div>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  display?: string
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-[13px] leading-4 font-medium text-ink-2">
        {label}
        {display && <span className="font-normal text-ink-3 tabular-nums">{display}</span>}
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-md bg-ink/[0.07] p-0.5">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`h-10 rounded-[5px] px-2 text-[13px] font-medium transition-colors duration-150 lg:h-8 ${
              on ? 'bg-paper text-ink shadow-[0_0_0_1px_var(--color-line-2)]' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* --------------------------------------------------------------- structure */

/** A labelled group inside a panel. */
export function Group({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-line pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] leading-4 font-semibold tracking-[0.08em] text-ink-3 uppercase">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** Advanced controls stay folded until asked for. */
export function Disclosure({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div className="rounded-md border border-line">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between px-3 text-sm font-medium text-ink lg:h-10"
      >
        {title}
        <ChevronDown aria-hidden className={`size-4 text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div id={id} className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-line p-3" inert={!open}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4 lg:mb-8">
      <div className="min-w-0">
        <h1 className="font-display text-[32px] leading-9 tracking-[-0.01em] text-ink lg:text-[40px] lg:leading-[44px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4 border-b border-line pb-2">
      <h2 className="text-[15px] leading-5 font-semibold text-ink">{title}</h2>
      {action}
    </div>
  )
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-lg border border-dashed border-line-2 px-6 py-12 text-center">
      <h2 className="font-display text-2xl leading-8 text-ink">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-2">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

/* ----------------------------------------------------------------- overlays */

/** Modal that is a bottom sheet on phones and a centred dialog on larger screens. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  // Callers pass fresh inline handlers on every render; keep the latest one without re-running the focus logic.
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    // Let an autofocused field keep focus; otherwise focus the dialog itself.
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="anim-fade absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="anim-rise relative flex max-h-[88dvh] w-full flex-col rounded-t-lg bg-paper shadow-[0_-8px_32px_-12px_rgba(29,24,21,0.35)] outline-none sm:max-w-md sm:rounded-lg sm:shadow-[0_12px_40px_-12px_rgba(29,24,21,0.4)]"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2 pl-5">
          <h2 id={titleId} className="text-[15px] font-semibold text-ink">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-line px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">{footer}</div>
        )}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
  extra,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
  extra?: ReactNode
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {extra}
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-2">{body}</p>
    </Dialog>
  )
}

/* -------------------------------------------------------------------- toast */

const ToastCtx = createContext<(msg: string) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; n: number } | null>(null)
  const n = useRef(0)
  const show = useCallback((text: string) => {
    const id = ++n.current
    setMsg({ text, n: id })
    window.setTimeout(() => setMsg((m) => (m && m.n === id ? null : m)), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.25rem)] z-[60] flex justify-center px-4">
        {msg && (
          <div key={msg.n} role="status" className="anim-rise pointer-events-auto max-w-sm rounded-md bg-ink px-4 py-2.5 text-sm text-white shadow-lg">
            {msg.text}
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  )
}
