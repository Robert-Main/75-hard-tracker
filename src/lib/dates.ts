export function toDateString(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr)
  date.setDate(date.getDate() + days)
  return toDateString(date)
}

export function daysBetween(start: string, end: string): number {
  const a = parseDate(start).getTime()
  const b = parseDate(end).getTime()
  return Math.round((b - a) / 86_400_000)
}

export function formatDisplayDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
