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
