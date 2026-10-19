export type Department = 'Production' | 'Operations' | 'Support' | 'Creative'
export type ShiftStatus = 'published' | 'draft'
export type TimeOffStatus = 'pending' | 'approved' | 'rejected'
export type View = 'dashboard' | 'schedule' | 'team' | 'timeoff' | 'reports' | 'settings'

export interface Employee {
  id: string
  name: string
  email: string
  role: string
  department: Department
  color: string
  weeklyLimit: number
  hourlyRate: number
  active: boolean
  availability: number[] // weekday: 0 (Sunday) through 6 (Saturday)
}
export interface Shift {
  id: string
  employeeId: string | null // null means open/unassigned
  role: string
  department: Department
  date: string // local YYYY-MM-DD
  start: string // HH:mm
  end: string // HH:mm; same-day shifts only
  status: ShiftStatus
  location: string
  note: string
}
export interface TimeOff {
  id: string
  employeeId: string
  from: string
  to: string
  reason: string
  status: TimeOffStatus
}
export interface Settings {
  workspaceName: string
  weekStartsOn: 0 | 1
  location: string
  coverageTarget: number
}
export interface Database {
  version: 1
  employees: Employee[]
  shifts: Shift[]
  timeOff: TimeOff[]
  settings: Settings
}
export interface Suggestion {
  shiftId: string
  employeeId: string
  score: number
  reasons: string[]
}
