export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function parseDate(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}
export function addDays(key: string, days: number): string {
  const d = parseDate(key)
  d.setDate(d.getDate() + days)
  return dateKey(d)
}
export function startOfWeek(key: string, weekStartsOn: 0 | 1 = 1): string {
  const d = parseDate(key)
  const back = (d.getDay() - weekStartsOn + 7) % 7
  return addDays(key, -back)
}
export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}
export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}
export function durationHours(start: string, end: string): number {
  return Math.max(0, (timeToMinutes(end) - timeToMinutes(start)) / 60)
}
export function overlaps(a: { start: string; end: string }, b: { start: string; end: string }): boolean {
  return timeToMinutes(a.start) < timeToMinutes(b.end) && timeToMinutes(b.start) < timeToMinutes(a.end)
}
export function coversDate(date: string, from: string, to: string) { return date >= from && date <= to }
export function formatDate(key: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return new Intl.DateTimeFormat('en-US', options).format(parseDate(key))
}
export function formatClock(clock: string) {
  const [hours, minutes] = clock.split(':').map(Number)
  return `${String(hours % 12 || 12)}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`
}
export function uid(prefix = 'id') {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
}
