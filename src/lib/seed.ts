import { addDays, dateKey, startOfWeek } from './dates.ts'
import type { Database, Department, Employee, Shift, TimeOff } from './types.ts'

const palette = ['#8c7bf5', '#f4a261', '#41b3a3', '#e27e9e', '#73a7f2', '#d4a94d', '#907bce', '#74b9a8', '#dc8f6f', '#6987e7']
const staff: Array<[string, string, string, number, number, number[]]> = [
  ['Olivia Bennett', 'Producer', 'Production', 40, 27, [1,2,3,4,5]],
  ['Noah Carter', 'Camera Operator', 'Production', 40, 22, [1,2,3,4,5,6]],
  ['Sofia Martinez', 'Floor Manager', 'Operations', 40, 24, [1,2,3,4,5]],
  ['Liam Thompson', 'Operations Coordinator', 'Operations', 35, 21, [1,2,3,4,5]],
  ['Emma Wilson', 'Support Specialist', 'Support', 40, 19, [1,2,3,4,5,6]],
  ['Ethan Brooks', 'Support Specialist', 'Support', 30, 19, [1,2,3,4,5,6]],
  ['Isabella Clark', 'Motion Designer', 'Creative', 36, 26, [1,2,3,4,5]],
  ['James Walker', 'Video Editor', 'Creative', 32, 23, [1,2,3,4,5,6]],
  ['Mia Davis', 'Camera Operator', 'Production', 30, 22, [1,2,4,5,6]],
  ['Lucas Reed', 'Producer', 'Production', 38, 27, [1,2,3,4,5]],
]
export function createSeed(today = dateKey(new Date())): Database {
  const start = startOfWeek(today)
  const employees: Employee[] = staff.map((s, i) => ({
    id: `emp_${i + 1}`, name: s[0], role: s[1], department: s[2] as Department,
    email: `${s[0].toLowerCase().replace(' ', '.')}@northstar.studio`,
    weeklyLimit: Number(s[3]), hourlyRate: Number(s[4]), availability: s[5] as number[],
    color: palette[i], active: true,
  }))
  const shifts: Shift[] = []
  let n = 0
  const templates = [
    [0, '09:00', '17:00', 'Studio A'], [1, '08:00', '16:00', 'Studio B'],
    [2, '10:00', '18:00', 'Main floor'], [3, '09:00', '17:00', 'HQ'],
    [4, '08:00', '16:00', 'Support desk'], [5, '12:00', '20:00', 'Support desk'],
    [6, '09:00', '17:00', 'Design studio'], [7, '11:00', '19:00', 'Edit suite'],
    [8, '12:00', '20:00', 'Studio B'], [9, '11:00', '19:00', 'Studio A'],
  ] as const
  for (let d = 0; d < 5; d++) {
    for (let t = 0; t < templates.length; t++) {
      // Create a realistic schedule with free days and intentional open shifts.
      if ((d === 0 && [5,8].includes(t)) || (d === 1 && [0,3,5,6,9].includes(t)) || (d === 2 && [1,4,7,8].includes(t)) || (d === 3 && [2,5,6,9].includes(t)) || (d === 4 && [0,3,7].includes(t))) continue
      const [employeeIndex, startTime, endTime, location] = templates[t]
      const employee = employees[employeeIndex]
      if (!employee.availability.includes(new Date(`${addDays(start, d)}T12:00:00`).getDay())) continue
      shifts.push({
        id: `sh_${++n}`, employeeId: employee.id, role: employee.role,
        department: employee.department, date: addDays(start, d), start: startTime,
        end: endTime, status: 'published', location, note: '',
      })
    }
  }
  // Open positions intentionally demonstrate explainable auto-scheduling.
  for (const [day, employeeIndex, startTime, endTime, location] of [
    [1, 4, '08:00', '16:00', 'Support desk'],
    [2, 0, '09:00', '17:00', 'Studio A'],
    [3, 3, '09:00', '17:00', 'HQ'],
    [4, 6, '11:00', '19:00', 'Design studio'],
  ] as const) {
    const employee = employees[employeeIndex]
    shifts.push({ id: `sh_${++n}`, employeeId: null, role: employee.role, department: employee.department, date: addDays(start, day), start: startTime, end: endTime, status: 'draft', location, note: 'Needs coverage' })
  }
  const timeOff: TimeOff[] = [
    { id: 'leave_1', employeeId: 'emp_8', from: addDays(start, 2), to: addDays(start, 3), reason: 'Personal leave', status: 'pending' },
    { id: 'leave_2', employeeId: 'emp_10', from: addDays(start, 5), to: addDays(start, 6), reason: 'Family commitment', status: 'approved' },
    { id: 'leave_3', employeeId: 'emp_6', from: addDays(start, 6), to: addDays(start, 6), reason: 'Travel', status: 'pending' },
  ]
  return { version: 1, employees, shifts, timeOff, settings: { workspaceName: 'Northstar Studios', weekStartsOn: 1, location: 'Riga, Latvia', coverageTarget: 95 } }
}
