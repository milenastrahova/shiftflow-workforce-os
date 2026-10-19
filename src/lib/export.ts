import type { Database } from './types.ts'
/** Protect spreadsheet users from formula injection and quote data as needed. */
export function csvEscape(value: string | number, delimiter = ',') {
  const raw = String(value)
  const safe = /^\s*[=+@-]/.test(raw) ? `'${raw}` : raw
  return safe.includes(delimiter) || /["\r\n]/.test(safe)
    ? `"${safe.replace(/"/g, '""')}"`
    : safe
}

/** RFC-style comma CSV by default, optional semicolon for Excel locales. */
export function csvRows(rows: (string | number)[][], delimiter = ',') {
  return rows.map(row => row.map(value => csvEscape(value, delimiter)).join(delimiter)).join('\r\n')
}

export function shiftsCsv(db: Database, delimiter = ',') {
  const lines: (string | number)[][] = [['Date', 'Start', 'End', 'Employee', 'Department', 'Role', 'Location', 'Status', 'Hours', 'Estimated cost (EUR)']]
  db.shifts.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach(s => {
    const e = db.employees.find(e => e.id === s.employeeId)
    const hours = (Number(s.end.slice(0,2)) * 60 + Number(s.end.slice(3)) - Number(s.start.slice(0,2)) * 60 - Number(s.start.slice(3))) / 60
    lines.push([s.date, s.start, s.end, e?.name ?? 'Unassigned', s.department, s.role, s.location, s.status, hours, Math.round(hours * (e?.hourlyRate ?? 0) * 100) / 100])
  })
  return csvRows(lines, delimiter)
}

/** Excel honors sep=; regardless of its region, plus BOM for non-ASCII names. */
export function excelFriendlyCsv(semicolonCsv: string) {
  return `\uFEFFsep=;\r\n${semicolonCsv.replace(/^\uFEFF/, '')}`
}
export function downloadText(name: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
