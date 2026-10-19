import test from 'node:test'
import assert from 'node:assert/strict'
import { addDays, dateKey, durationHours, overlaps, parseDate, startOfWeek, weekDays } from '../src/lib/dates.ts'
import { employeeHours, generateSuggestions, getMetrics, suggestForOpenShift, validateShift, preventApprovedLeaveConflicts } from '../src/lib/engine.ts'
import { createSeed } from '../src/lib/seed.ts'
import { csvEscape, csvRows, excelFriendlyCsv, shiftsCsv } from '../src/lib/export.ts'
import { exportDatabase, isDatabase } from '../src/lib/storage.ts'
import type { Shift } from '../src/lib/types.ts'

const monday='2026-10-19'
const mondayDb=()=>createSeed(monday)
const draft=(overrides:Partial<Shift>={}):Shift=>({id:'test_new',employeeId:null,role:'Producer',department:'Production',date:monday,start:'09:00',end:'17:00',status:'draft',location:'Studio A',note:'',...overrides})

test('date helpers preserve local calendar days and weekdays',()=>{
  assert.equal(dateKey(parseDate('2026-10-19')),'2026-10-19')
  assert.equal(startOfWeek('2026-10-23'),'2026-10-19')
  assert.equal(startOfWeek('2026-10-23',0),'2026-10-18')
  assert.equal(weekDays(monday)[6],'2026-10-25')
  assert.equal(addDays('2026-12-31',1),'2027-01-01')
})
test('durations and overlap are correct including edge touching',()=>{
  assert.equal(durationHours('09:00','17:30'),8.5)
  assert.equal(durationHours('18:00','09:00'),0)
  assert.equal(overlaps({start:'09:00',end:'12:00'},{start:'12:00',end:'15:00'}),false)
  assert.equal(overlaps({start:'09:00',end:'12:00'},{start:'11:59',end:'15:00'}),true)
})
test('demo creates a coherent, repeatable workforce',()=>{
  const db=mondayDb()
  assert.equal(db.employees.length,10)
  assert.ok(db.shifts.length>15)
  assert.ok(db.shifts.some(s=>!s.employeeId))
  assert.deepEqual(createSeed(monday),db)
  assert.ok(db.shifts.every(s=>s.date>=monday))
})
test('invalid times are refused including overnight shifts',()=>{
  const db=mondayDb()
  assert.ok(validateShift(draft({start:'20:00',end:'08:00'}),db).some(x=>x.code==='invalid-time'))
  assert.ok(validateShift(draft({start:'09:00',end:'09:00'}),db).some(x=>x.code==='invalid-time'))
})
test('double booking the same employee is rejected',()=>{
  const db=mondayDb()
  const existing=db.shifts.find(s=>s.employeeId)!
  assert.ok(validateShift(draft({date:existing.date,employeeId:existing.employeeId,start:existing.start,end:existing.end}),db).some(x=>x.code==='overlap'))
})
test('approved leave blocks assignment but pending leave does not',()=>{
  const db=mondayDb()
  const id='emp_1'
  const s=draft({employeeId:id,date:addDays(monday,6),start:'09:00',end:'17:00'})
  db.timeOff=[{id:'leave_test',employeeId:id,from:s.date,to:s.date,reason:'Test',status:'pending'}]
  assert.ok(!validateShift(s,db).some(x=>x.code==='time-off'))
  db.timeOff[0].status='approved'
  assert.ok(validateShift(s,db).some(x=>x.code==='time-off'))
})
test('unavailable weekday, inactive employee and weekly hours cap block assignment',()=>{
  const db=mondayDb()
  const employee=db.employees[0]
  assert.ok(validateShift(draft({date:addDays(monday,6),employeeId:employee.id}),db).some(x=>x.code==='unavailable'))
  employee.active=false
  assert.ok(validateShift(draft({employeeId:employee.id}),db).some(x=>x.code==='inactive'))
  employee.active=true
  employee.weeklyLimit=1
  assert.ok(validateShift(draft({date:addDays(monday,5),employeeId:employee.id}),db).some(x=>x.code==='weekly-limit'))
})
test('11 hour minimum rest blocks adjacent days',()=>{
  const db=mondayDb()
  db.shifts=[]
  db.timeOff=[]
  const employee=db.employees[0]
  db.shifts=[draft({id:'a',date:monday,employeeId:employee.id,start:'14:00',end:'23:00'})]
  const s=draft({id:'b',date:addDays(monday,1),employeeId:employee.id,start:'08:00',end:'16:00'})
  assert.ok(validateShift(s,db).some(x=>x.code==='rest'))
  assert.ok(!validateShift({...s,start:'10:00',end:'18:00'},db).some(x=>x.code==='rest'))
})
test('recommendations are deterministic, eligible and update capacity sequentially',()=>{
  const db=mondayDb()
  const open=db.shifts.find(s=>!s.employeeId)!
  const choices=suggestForOpenShift(open,db)
  assert.ok(choices.length>0)
  assert.equal(choices[0].shiftId,open.id)
  assert.ok(choices[0].reasons.length>0)
  assert.deepEqual(choices,suggestForOpenShift(open,db))
  for(const pick of choices)assert.equal(validateShift({...open,employeeId:pick.employeeId},db).length,0)
  const all=generateSuggestions(db,monday,addDays(monday,6))
  assert.ok(all.length>0)
  const seen=new Set<string>()
  const clone=structuredClone(db)
  for(const pick of all){
    assert.ok(!seen.has(pick.shiftId))
    const shift=clone.shifts.find(s=>s.id===pick.shiftId)!
    assert.equal(validateShift({...shift,employeeId:pick.employeeId},clone).length,0)
    shift.employeeId=pick.employeeId
    seen.add(pick.shiftId)
  }
})
test('metrics calculate real coverage, cost and assigned hours',()=>{
  const db=mondayDb()
  const metrics=getMetrics(db,monday)
  assert.equal(metrics.open,db.shifts.filter(s=>!s.employeeId).length)
  assert.equal(metrics.totalShifts,db.shifts.length)
  assert.equal(metrics.assigned+metrics.open,metrics.totalShifts)
  assert.ok(metrics.totalHours>0)
  assert.ok(metrics.laborCost>0)
  assert.ok(employeeHours(db.shifts,'emp_1',monday)>=0)
})
test('approving leave is guarded when employee has assignments',()=>{
  const db=mondayDb()
  const s=db.shifts.find(s=>s.employeeId)!
  assert.ok(preventApprovedLeaveConflicts(db,s.employeeId!,s.date,s.date)>=1)
})
test('CSV escapes quotes, commas and lines; JSON backup validates',()=>{
  assert.equal(csvEscape('Smith, Ava'),'"Smith, Ava"')
  assert.equal(csvEscape('=SUM(A1:A3)'),"'=SUM(A1:A3)")
  assert.equal(csvEscape('quote "inside"'),'"quote ""inside"""')
  const db=mondayDb()
  const csv=shiftsCsv(db)
  assert.ok(csv.startsWith('Date,Start,End'))
  assert.ok(csv.includes('Unassigned'))
  assert.equal(isDatabase(JSON.parse(exportDatabase(db))),true)
  assert.equal(isDatabase({version:1,employees:[{name:123}],shifts:[],timeOff:[],settings:db.settings}),false)
})

test('European Excel export uses BOM, sep directive and semicolon-separated columns',()=>{
  const db=mondayDb()
  const output=excelFriendlyCsv(shiftsCsv(db,';'))
  assert.ok(output.startsWith('\uFEFFsep=;\r\nDate;Start;End;Employee;'))
  assert.ok(output.includes('2026-10-19;'))
  assert.ok(!output.includes('Date,Start,End'))
  assert.equal(csvEscape('Ops; Design',';'),'"Ops; Design"')
  assert.equal(csvEscape('Ops, Design',';'),'Ops, Design')
  assert.equal(csvRows([['a','b'],['c;d','e']],';'),'a;b\r\n"c;d";e')
})
test('standard CSV export remains unmodified and safe for spreadsheet imports',()=>{
  const db=mondayDb()
  const raw=shiftsCsv(db)
  assert.ok(raw.startsWith('Date,Start,End,Employee,'))
  assert.ok(!raw.includes('sep=;'))
  assert.equal(csvEscape('\r\n=1+1'), '"\'\r\n=1+1"')
})
