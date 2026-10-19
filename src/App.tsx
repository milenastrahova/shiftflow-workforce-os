import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AlertCircle, CalendarDays, Trash2 } from 'lucide-react'
import { dateKey, formatDate, startOfWeek, uid } from './lib/dates.ts'
import { generateSuggestions, preventApprovedLeaveConflicts, validateShift } from './lib/engine.ts'
import { loadDatabase, resetDatabase, saveDatabase } from './lib/storage.ts'
import type { Database, Department, Employee, Shift, Suggestion, TimeOff, View } from './lib/types.ts'
import { Shell } from './components/Shell.tsx'
import { Field, Modal, Tag } from './components/UI.tsx'
import { Dashboard } from './pages/Dashboard.tsx'
import { Schedule } from './pages/Schedule.tsx'
import { Team } from './pages/Team.tsx'
import { TimeOffPage } from './pages/TimeOff.tsx'
import { Reports } from './pages/Reports.tsx'
import { SettingsPage } from './pages/Settings.tsx'

const departments: Department[]=['Production','Operations','Support','Creative']
const weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
type Dialog = { kind:'shift'; value?:Shift; date?:string } | {kind:'employee';value?:Employee} | {kind:'leave'} | null

export default function App() {
  const [db,setDb] = useState<Database>(loadDatabase)
  const [view,setView] = useState<View>('dashboard')
  const [week,setWeek] = useState(()=>startOfWeek(dateKey(new Date())))
  const [dialog,setDialog] = useState<Dialog>(null)
  const [notice,setNotice] = useState('')
  useEffect(()=>saveDatabase(db),[db])
  useEffect(()=>{document.title=`${view==='dashboard'?'Overview':view[0].toUpperCase()+view.slice(1)} | ShiftFlow`},[view])
  const shownWeek = useMemo(()=>startOfWeek(week,db.settings.weekStartsOn),[week,db.settings.weekStartsOn])
  function toast(text:string){setNotice(text)}
  function navigate(v:View){setView(v);window.scrollTo({top:0,behavior:'smooth'})}
  function putShift(value:Shift) {
    const violations=validateShift(value,db)
    if(violations.length) return violations.map(v=>v.message).join('\n')
    setDb(prev=>({...prev,shifts:prev.shifts.some(s=>s.id===value.id)?prev.shifts.map(s=>s.id===value.id?value:s):[...prev.shifts,value]}))
    setDialog(null);toast('Shift saved successfully.');return ''
  }
  function deleteShift(id:string) {setDb(prev=>({...prev,shifts:prev.shifts.filter(s=>s.id!==id)}));setDialog(null);toast('Shift deleted.')}
  function putEmployee(e:Employee){
    const emailTaken=db.employees.some(x=>x.email.toLowerCase()===e.email.toLowerCase()&&x.id!==e.id)
    if(emailTaken)return 'This email is already used by another member.'
    const original=db.employees.find(x=>x.id===e.id)
    const today=dateKey(new Date())
    const releasing=Boolean(original?.active && !e.active)
    // Archiving does not delete history; it makes future scheduled shifts open for reassignment.
    const candidateShifts=releasing?db.shifts.map(s=>s.employeeId===e.id&&s.date>=today?{...s,employeeId:null,status:'draft' as const}:s):db.shifts
    const employees=original?db.employees.map(x=>x.id===e.id?e:x):[...db.employees,e]
    const next={...db,employees,shifts:candidateShifts}
    if(e.active && original){
      const problem=next.shifts.filter(s=>s.employeeId===e.id&&s.date>=today).flatMap(s=>validateShift(s,next))[0]
      if(problem)return `This change conflicts with assigned shifts: ${problem.message} Reassign those shifts first.`
    }
    setDb(next)
    setDialog(null)
    toast(releasing?'Member archived. Future shifts were reopened for coverage.':'Team member saved.')
    return ''
  }
  function putLeave(t:TimeOff){setDb(prev=>({...prev,timeOff:[...prev.timeOff,t]}));setDialog(null);toast('Time off request submitted.')}
  function updateLeave(id:string,status:TimeOff['status']) {
    const request=db.timeOff.find(t=>t.id===id)
    if(!request)return
    if(status==='approved'){
      const count=preventApprovedLeaveConflicts(db,request.employeeId,request.from,request.to)
      if(count){toast(`Cannot approve: ${count} scheduled shift(s) overlap. Reassign them first.`);return}
    }
    setDb(prev=>({...prev,timeOff:prev.timeOff.map(t=>t.id===id?{...t,status}:t)}));toast(`Request ${status}.`)
  }
  function assign(shiftId:string,employeeId:string) {
    const shift=db.shifts.find(s=>s.id===shiftId)
    if(!shift) return
    const candidate={...shift,employeeId,status:'published' as const}
    const problems=validateShift(candidate,db)
    if(problems.length){toast(problems[0].message);return}
    setDb(prev=>({...prev,shifts:prev.shifts.map(s=>s.id===shiftId?candidate:s)}));toast('Recommended teammate assigned.')
  }
  function autoFill(suggestions:Suggestion[]) {
    if(!suggestions.length)return
    const lines=suggestions.map(s=>{
      const e=db.employees.find(e=>e.id===s.employeeId)
      const shift=db.shifts.find(v=>v.id===s.shiftId)
      return `${formatDate(shift!.date)} · ${shift?.role} → ${e?.name} (${s.score}%)`
    })
    if(!window.confirm(`Apply these ${suggestions.length} recommendations?\n\n${lines.join('\n')}`))return
    // Regenerate against current data so every assignment respects preceding assignments.
    const latest=generateSuggestions(db)
    const chosen=new Map(latest.filter(s=>suggestions.some(o=>o.shiftId===s.shiftId)).map(s=>[s.shiftId,s.employeeId]))
    setDb(prev=>({...prev,shifts:prev.shifts.map(s=>chosen.has(s.id)?{...s,employeeId:chosen.get(s.id)!,status:'published'}:s)}))
    toast(`${chosen.size} shifts assigned. Review them in the calendar.`)
  }
  return <Shell db={db} view={view} setView={navigate} notice={notice} noticeClose={()=>setNotice('')}>
    {view==='dashboard'&&<Dashboard db={db} week={shownWeek} onNavigate={navigate} onAddShift={()=>setDialog({kind:'shift'})}/>}
    {view==='schedule'&&<Schedule db={db} week={shownWeek} setWeek={setWeek} onShift={value=>setDialog({kind:'shift',value})} onCreate={date=>setDialog({kind:'shift',date})} onApplySuggestions={autoFill} onAssign={assign}/>}
    {view==='team'&&<Team db={db} week={shownWeek} onEdit={value=>setDialog({kind:'employee',value})} onCreate={()=>setDialog({kind:'employee'})}/>}
    {view==='timeoff'&&<TimeOffPage db={db} onCreate={()=>setDialog({kind:'leave'})} onUpdate={updateLeave}/>}
    {view==='reports'&&<Reports db={db} week={shownWeek}/>}
    {view==='settings'&&<SettingsPage key={`${db.settings.workspaceName}:${db.settings.location}:${db.settings.weekStartsOn}:${db.settings.coverageTarget}`} db={db} saveSettings={s=>{setDb(prev=>({...prev,settings:s}));toast('Workspace settings saved.')}} importDb={data=>{setDb(data);toast('Backup imported successfully.')}} reset={()=>{setDb(resetDatabase());toast('Demo workspace restored.')}}/>}
    {dialog?.kind==='shift'&&<ShiftDialog db={db} date={dialog.date} shift={dialog.value} onClose={()=>setDialog(null)} onSave={putShift} onDelete={deleteShift}/>}
    {dialog?.kind==='employee'&&<EmployeeDialog employee={dialog.value} onClose={()=>setDialog(null)} onSave={putEmployee}/>}
    {dialog?.kind==='leave'&&<LeaveDialog db={db} onClose={()=>setDialog(null)} onSave={putLeave}/>}
  </Shell>
}

function ShiftDialog({db,shift,date,onClose,onSave,onDelete}:{db:Database;shift?:Shift;date?:string;onClose:()=>void;onSave:(s:Shift)=>string;onDelete:(id:string)=>void}){
  const [value,setValue]=useState<Shift>(shift??{id:uid('sh'),employeeId:null,date:date??dateKey(new Date()),start:'09:00',end:'17:00',role:'Producer',department:'Production',status:'draft',location:'Studio A',note:''})
  const [error,setError]=useState('')
  const matches=db.employees.filter(e=>e.active&&e.department===value.department)
  function save(e:FormEvent){e.preventDefault();setError(onSave(value))}
  return <Modal title={shift?'Edit shift':'Create a new shift'} subtitle="Build a compliant, conflict-free team schedule." onClose={onClose}><form onSubmit={save} className="space-y-4"><div className="grid grid-cols-2 gap-3"><Field label="Date"><input required type="date" className="field" value={value.date} onChange={e=>setValue({...value,date:e.target.value})}/></Field><Field label="Department"><select className="field" value={value.department} onChange={e=>{const department=e.target.value as Department;setValue({...value,department,employeeId:null,role:db.employees.find(p=>p.department===department)?.role??'Coordinator'})}}>{departments.map(d=><option key={d}>{d}</option>)}</select></Field><Field label="Start time"><input className="field" required type="time" value={value.start} onChange={e=>setValue({...value,start:e.target.value})}/></Field><Field label="End time"><input className="field" required type="time" value={value.end} onChange={e=>setValue({...value,end:e.target.value})}/></Field></div><Field label="Required role"><input className="field" required maxLength={70} value={value.role} onChange={e=>setValue({...value,role:e.target.value})}/></Field><Field label="Assign employee"><select className="field" value={value.employeeId??''} onChange={e=>setValue({...value,employeeId:e.target.value||null})}><option value="">Unassigned — open shift</option>{matches.map(e=><option key={e.id} value={e.id}>{e.name} · {e.role}</option>)}</select></Field><div className="grid grid-cols-2 gap-3"><Field label="Location"><input className="field" required maxLength={80} value={value.location} onChange={e=>setValue({...value,location:e.target.value})}/></Field><Field label="Status"><select className="field" value={value.status} onChange={e=>setValue({...value,status:e.target.value as Shift['status']})}><option value="draft">Draft</option><option value="published">Published</option></select></Field></div><Field label="Notes (optional)"><textarea className="field" rows={2} maxLength={400} value={value.note} onChange={e=>setValue({...value,note:e.target.value})}/></Field>
    {error&&<p role="alert" className="whitespace-pre-wrap rounded-xl bg-rose-50 p-3 text-[12px] leading-5 text-rose-600"><AlertCircle size={15} className="mr-1 inline"/>{error}</p>}
    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">{shift?<button type="button" className="btn btn-danger" onClick={()=>{if(confirm('Delete this shift?'))onDelete(shift.id)}}><Trash2 size={15}/> Delete shift</button>:<Tag tone="purple"><CalendarDays size={12} className="mr-1"/> Schedule</Tag>}<div className="flex gap-2"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary">Save shift</button></div></div></form></Modal>
}

function EmployeeDialog({employee,onClose,onSave}:{employee?:Employee;onClose:()=>void;onSave:(e:Employee)=>string}){
  const [form,setForm]=useState<Employee>(employee??{id:uid('emp'),name:'',email:'',role:'',department:'Production',color:'#8c7bf5',weeklyLimit:40,hourlyRate:20,active:true,availability:[1,2,3,4,5]})
  const [error,setError]=useState('')
  function save(e:FormEvent){e.preventDefault();if(!form.availability.length){setError('Select at least one available weekday.');return}setError(onSave({...form,name:form.name.trim(),email:form.email.trim().toLowerCase(),role:form.role.trim()}))}
  return <Modal title={employee?'Edit team member':'Add team member'} subtitle="Set your teammate's role and working capacity." onClose={onClose}><form onSubmit={save} className="space-y-4"><div className="grid grid-cols-2 gap-3"><Field label="Full name"><input autoFocus required className="field" maxLength={80} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field><Field label="Department"><select className="field" value={form.department} onChange={e=>setForm({...form,department:e.target.value as Department})}>{departments.map(d=><option key={d}>{d}</option>)}</select></Field></div><Field label="Email address"><input required type="email" maxLength={120} className="field" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field><Field label="Job title / role"><input required maxLength={80} className="field" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}/></Field><div className="grid grid-cols-2 gap-3"><Field label="Weekly hours limit"><input className="field" required min={1} max={80} type="number" value={form.weeklyLimit} onChange={e=>setForm({...form,weeklyLimit:Number(e.target.value)})}/></Field><Field label="Hourly cost (€)"><input className="field" required min={0} max={1000} type="number" step="0.5" value={form.hourlyRate} onChange={e=>setForm({...form,hourlyRate:Number(e.target.value)})}/></Field></div><div><span className="field-label">Working days</span><div className="flex flex-wrap gap-2">{weekdays.map((d,i)=><label key={d} className={`flex h-9 min-w-10 cursor-pointer items-center justify-center rounded-lg border px-2 text-[11px] font-bold ${form.availability.includes(i)?'border-violet-300 bg-violet-50 text-brand':'border-slate-200 text-muted'}`}><input type="checkbox" className="sr-only" checked={form.availability.includes(i)} onChange={e=>setForm({...form,availability:e.target.checked?[...form.availability,i].sort():form.availability.filter(v=>v!==i)})}/>{d}</label>)}</div></div><div className="flex items-center gap-2"><input type="checkbox" id="active-member" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/><label htmlFor="active-member" className="text-xs font-semibold text-[#666a7d]">Member is active and available for scheduling</label></div>{error&&<p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-600" role="alert">{error}</p>}<div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary">Save member</button></div></form></Modal>
}

function LeaveDialog({db,onClose,onSave}:{db:Database;onClose:()=>void;onSave:(t:TimeOff)=>void}){
  const [employeeId,setEmployeeId]=useState(db.employees.find(e=>e.active)?.id??'')
  const [from,setFrom]=useState(dateKey(new Date()))
  const [to,setTo]=useState(dateKey(new Date()))
  const [reason,setReason]=useState('Personal leave')
  const [error,setError]=useState('')
  function save(e:FormEvent){e.preventDefault();if(to<from){setError('End date must be on or after start date.');return}if(!employeeId){setError('Select a team member.');return}onSave({id:uid('leave'),employeeId,from,to,reason:reason.trim(),status:'pending'})}
  return <Modal title="Request time off" subtitle="Leave requests are reviewed by a workspace administrator." onClose={onClose}><form onSubmit={save} className="space-y-4"><Field label="Team member"><select required className="field" value={employeeId} onChange={e=>setEmployeeId(e.target.value)}>{db.employees.filter(e=>e.active).map(e=><option key={e.id} value={e.id}>{e.name} · {e.department}</option>)}</select></Field><div className="grid grid-cols-2 gap-3"><Field label="From"><input required className="field" type="date" value={from} onChange={e=>setFrom(e.target.value)}/></Field><Field label="To"><input required className="field" type="date" value={to} min={from} onChange={e=>setTo(e.target.value)}/></Field></div><Field label="Reason"><input className="field" required maxLength={160} value={reason} onChange={e=>setReason(e.target.value)}/></Field>{error&&<p role="alert" className="text-xs text-rose-600">{error}</p>}<div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary">Submit request</button></div></form></Modal>
}
