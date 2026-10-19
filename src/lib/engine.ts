import { addDays, coversDate, durationHours, overlaps, parseDate, startOfWeek, weekDays } from './dates.ts'
import type { Database, Employee, Shift, Suggestion } from './types.ts'

export type Violation = { code: 'invalid-time' | 'inactive' | 'unavailable' | 'time-off' | 'overlap' | 'weekly-limit' | 'rest'; message: string }

export function employeeHours(shifts: Shift[], employeeId: string, start: string): number {
  const end = addDays(start, 6)
  return shifts.filter(s => s.employeeId === employeeId && s.date >= start && s.date <= end)
    .reduce((sum, s) => sum + durationHours(s.start, s.end), 0)
}

export function validateShift(shift: Shift, db: Database): Violation[] {
  const violations: Violation[] = []
  const hours = durationHours(shift.start, shift.end)
  if (hours <= 0 || hours > 16) violations.push({ code: 'invalid-time', message: 'Shift must be between 1 minute and 16 hours and end on the same day.' })
  if (!shift.employeeId) return violations
  const employee = db.employees.find(e => e.id === shift.employeeId)
  if (!employee || !employee.active) return [...violations, { code: 'inactive', message: 'Employee is unavailable or inactive.' }]
  if (!employee.availability.includes(parseDate(shift.date).getDay())) violations.push({ code: 'unavailable', message: `${employee.name} is not available on this weekday.` })
  if (db.timeOff.some(r => r.employeeId === employee.id && r.status === 'approved' && coversDate(shift.date, r.from, r.to))) {
    violations.push({ code: 'time-off', message: `${employee.name} has approved time off on this date.` })
  }
  const existing = db.shifts.filter(s => s.employeeId === employee.id && s.id !== shift.id)
  if (existing.some(s => s.date === shift.date && overlaps(s, shift))) violations.push({ code: 'overlap', message: `${employee.name} already has an overlapping shift.` })
  const monday = startOfWeek(shift.date, 1)
  if (employeeHours(existing, employee.id, monday) + hours > employee.weeklyLimit) violations.push({ code: 'weekly-limit', message: `Exceeds ${employee.name}'s ${employee.weeklyLimit}h weekly limit.` })
  // Minimum 11-hour rest before/after an adjacent-day shift.
  const adjacent = existing.filter(s => s.date === addDays(shift.date, -1) || s.date === addDays(shift.date, 1))
  const minute = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3))
  if (adjacent.some(s => s.date < shift.date ? 1440 - minute(s.end) + minute(shift.start) < 660 : 1440 - minute(shift.end) + minute(s.start) < 660)) {
    violations.push({ code: 'rest', message: `Less than 11 hours of rest between adjacent shifts for ${employee.name}.` })
  }
  return violations
}

export function suggestForOpenShift(shift: Shift, db: Database): Suggestion[] {
  if (shift.employeeId) return []
  const week = startOfWeek(shift.date)
  return db.employees.filter(e => e.active && e.department === shift.department).flatMap(e => {
    if (validateShift({ ...shift, employeeId: e.id }, db).length) return []
    const assignedHours = employeeHours(db.shifts, e.id, week)
    const roleMatch = e.role.toLowerCase() === shift.role.toLowerCase()
    const loadRatio = assignedHours / Math.max(e.weeklyLimit, 1)
    const score = Math.round(100 - loadRatio * 30 + (roleMatch ? 12 : 0))
    const reasons = [`Available ${new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(parseDate(shift.date))}`, `${assignedHours.toFixed(1)}h / ${e.weeklyLimit}h assigned`]
    if (roleMatch) reasons.unshift('Exact role match')
    else reasons.unshift('Same department')
    return [{ shiftId: shift.id, employeeId: e.id, score, reasons }]
  }).sort((a, b) => b.score - a.score || a.employeeId.localeCompare(b.employeeId))
}

export function generateSuggestions(db: Database, dateFrom?: string, dateTo?: string): Suggestion[] {
  const working = structuredClone(db)
  const results: Suggestion[] = []
  const openShifts = [...working.shifts].filter(s => !s.employeeId && (!dateFrom || s.date >= dateFrom) && (!dateTo || s.date <= dateTo)).sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
  for (const shift of openShifts) {
    const best = suggestForOpenShift(shift, working)[0]
    if (best) {
      results.push(best)
      working.shifts = working.shifts.map(s => s.id === shift.id ? { ...s, employeeId: best.employeeId } : s)
    }
  }
  return results
}

export function getMetrics(db: Database, week: string) {
  const dates = weekDays(week)
  const shifts = db.shifts.filter(s => dates.includes(s.date))
  const assigned = shifts.filter(s => Boolean(s.employeeId))
  const totalHours = assigned.reduce((n, s) => n + durationHours(s.start, s.end), 0)
  const open = shifts.filter(s => !s.employeeId).length
  const laborCost = assigned.reduce((n, s) => n + durationHours(s.start, s.end) * (db.employees.find(e => e.id === s.employeeId)?.hourlyRate ?? 0), 0)
  return {
    totalShifts: shifts.length, assigned: assigned.length, open, totalHours,
    coverage: shifts.length ? Math.round(assigned.length / shifts.length * 100) : 100,
    laborCost,
    activeEmployees: db.employees.filter(e => e.active).length,
  }
}

export function getWeeklyDepartmentHours(db: Database, week: string) {
  return weekDays(week).map(date => ({
    date,
    hours: db.shifts.filter(s => s.date === date && s.employeeId).reduce((n, s) => n + durationHours(s.start, s.end), 0),
  }))
}

export function getConflicts(db: Database, week: string) {
  const end = addDays(week, 6)
  return db.shifts.filter(s => s.employeeId && s.date >= week && s.date <= end).flatMap(s => validateShift(s, db).map(v => ({ shift: s, ...v })))
}

export function preventApprovedLeaveConflicts(db: Database, employeeId: string, from: string, to: string) {
  return db.shifts.filter(s => s.employeeId === employeeId && coversDate(s.date, from, to)).length
}

export function nextWorkdayFor(employee: Employee, from: string) {
  for (let i = 0; i < 7; i++) {
    const key = addDays(from, i)
    if (employee.availability.includes(parseDate(key).getDay())) return key
  }
  return null
}
