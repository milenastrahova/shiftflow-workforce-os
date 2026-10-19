import { createSeed } from './seed.ts'
import type { Database, Department } from './types.ts'

const KEY = 'shiftflow.workspace.v1'
const DEPARTMENTS: Department[] = ['Production', 'Operations', 'Support', 'Creative']

export function isDatabase(data: unknown): data is Database {
  if (!data || typeof data !== 'object') return false
  const d = data as Partial<Database>
  return d.version === 1 && Array.isArray(d.employees) && Array.isArray(d.shifts) && Array.isArray(d.timeOff) &&
    Boolean(d.settings && typeof d.settings.workspaceName === 'string' && typeof d.settings.location === 'string' &&
      (d.settings.weekStartsOn === 0 || d.settings.weekStartsOn === 1) && typeof d.settings.coverageTarget === 'number') &&
    d.employees.every(e => e && typeof e.id === 'string' && typeof e.name === 'string' && typeof e.email === 'string' && typeof e.role === 'string' && DEPARTMENTS.includes(e.department) && typeof e.color === 'string' && typeof e.weeklyLimit === 'number' && typeof e.hourlyRate === 'number' && Array.isArray(e.availability) && e.availability.every(v => Number.isInteger(v) && v >= 0 && v <= 6) && typeof e.active === 'boolean') &&
    d.shifts.every(s => s && typeof s.id === 'string' && (s.employeeId === null || typeof s.employeeId === 'string') && typeof s.role === 'string' && DEPARTMENTS.includes(s.department) && /^\d{4}-\d{2}-\d{2}$/.test(s.date) && /^\d{2}:\d{2}$/.test(s.start) && /^\d{2}:\d{2}$/.test(s.end) && (s.status === 'draft' || s.status === 'published') && typeof s.note === 'string' && typeof s.location === 'string') &&
    d.timeOff.every(t => t && typeof t.id === 'string' && typeof t.employeeId === 'string' && typeof t.from === 'string' && typeof t.to === 'string' && typeof t.reason === 'string' && ['pending','approved','rejected'].includes(t.status))
}

export function loadDatabase(): Database {
  try {
    const json = localStorage.getItem(KEY)
    if (!json) return createSeed()
    const value: unknown = JSON.parse(json)
    return isDatabase(value) ? value : createSeed()
  } catch { return createSeed() }
}
export function saveDatabase(db: Database) {
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* quota or privacy mode */ }
}
export function resetDatabase() {
  const fresh = createSeed()
  saveDatabase(fresh)
  return fresh
}
export function exportDatabase(db: Database) { return JSON.stringify(db, null, 2) }
