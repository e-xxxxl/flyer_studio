const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE', 'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC']

export function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}TH`
  switch (n % 10) {
    case 1:
      return `${n}ST`
    case 2:
      return `${n}ND`
    case 3:
      return `${n}RD`
    default:
      return `${n}TH`
  }
}

/**
 * "2026-09-20" -> ["20TH", "SEPT", "2026"]. Parsed by hand so the
 * operator's time zone can never shift the day.
 */
export function formatDateLines(iso: string): string[] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return []
  const [, y, mo, d] = m
  const month = MONTHS[Number(mo) - 1]
  if (!month) return []
  return [ordinal(Number(d)), month, y]
}

export function todayIso(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Splits free text typed by the operator into up to 4 date lines. */
export function splitCustomDate(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 4)
}

/** "2026-09-20" -> "09-20" */
export const toMonthDay = (iso: string) => iso.slice(5, 10)

/** The next date (today included) on which a month-day falls, as ISO. Feb 29 falls back to Feb 28. */
export function nextOccurrence(md: string, from: Date = new Date()): string {
  const [m, d] = md.split('-').map(Number)
  const pad = (n: number) => String(n).padStart(2, '0')
  const build = (y: number) => {
    const day = m === 2 && d === 29 && !(y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 28 : d
    return `${y}-${pad(m)}-${pad(day)}`
  }
  const today = `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`
  const thisYear = build(from.getFullYear())
  return thisYear >= today ? thisYear : build(from.getFullYear() + 1)
}

export function daysUntil(iso: string, from: Date = new Date()): number {
  const [y, m, d] = iso.split('-').map(Number)
  const a = Date.UTC(y, m - 1, d)
  const b = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  return Math.round((a - b) / 86_400_000)
}

const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const monthLong = (m: number) => MONTH_LONG[m - 1] ?? ''
