import { useState } from 'react'
import type { ReactNode } from 'react'
import { Activity, ArrowRight, BarChart3, Bell, CalendarDays, ChevronDown, CircleHelp, Clock3, LayoutDashboard, Menu, Settings2, Sparkles, UsersRound, X } from 'lucide-react'
import type { Database, View } from '../lib/types.ts'
import { Avatar } from './UI.tsx'

const navigation: { view: View; text: string; icon: typeof LayoutDashboard }[] = [
  { view:'dashboard', text:'Overview', icon:LayoutDashboard },
  { view:'schedule', text:'Schedule', icon:CalendarDays },
  { view:'team', text:'Team members', icon:UsersRound },
  { view:'timeoff', text:'Time off', icon:Clock3 },
  { view:'reports', text:'Reports', icon:BarChart3 },
  { view:'settings', text:'Settings', icon:Settings2 },
]
export function Shell({ children, db, view, setView, notice, noticeClose }: { children: ReactNode; db: Database; view: View; setView: (v: View) => void; notice: string; noticeClose: () => void }) {
  const [mobileOpen,setMobileOpen] = useState(false)
  const [notificationsOpen,setNotificationsOpen] = useState(false)
  const pending = db.timeOff.filter(t => t.status === 'pending').length
  const open = db.shifts.filter(s => !s.employeeId).length
  function navigate(v: View) { setView(v); setMobileOpen(false) }
  return <div className="min-h-screen bg-canvas lg:flex">
    {mobileOpen && <button onClick={()=>setMobileOpen(false)} className="fixed inset-0 z-30 bg-black/30 lg:hidden" aria-label="Close navigation"/>}
    <aside className={`${mobileOpen?'translate-x-0':'-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-[239px] shrink-0 flex-col border-r border-[#e9eaf2] bg-white px-4 py-6 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0`}>
      <div className="mb-10 flex items-center gap-3 px-3"><div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-brand text-white shadow-[0_6px_15px_#6d5ce838]"><Activity size={22} strokeWidth={2.7}/></div><div><div className="font-display text-[19px] font-extrabold leading-5 tracking-[-.7px] text-ink">shift<span className="text-brand">flow.</span></div><div className="mt-1 text-[10px] font-semibold tracking-[1.6px] text-muted">WORKFORCE OS</div></div></div>
      <p className="mb-3 px-3 text-[10px] font-extrabold tracking-[1.9px] text-[#a5a8b6]">WORKSPACE</p>
      <nav className="space-y-1" aria-label="Main navigation">{navigation.map(({view:item,text,icon:Icon}) => <button key={item} onClick={()=>navigate(item)} className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13px] font-semibold transition-colors ${view===item?'bg-[#f1efff] text-[#6656da]':'text-[#7c8095] hover:bg-[#f8f7fc] hover:text-ink'}`}><Icon size={18} strokeWidth={view===item?2.3:1.8}/><span className="flex-1">{text}</span>{item==='timeoff'&&pending>0&&<span className="rounded-full bg-[#fff0e8] px-1.5 text-[10px] text-[#ca8851]">{pending}</span>}</button>)}</nav>
      <div className="mt-auto"><div className="mb-5 rounded-2xl bg-[linear-gradient(145deg,#f2f0ff,#faf8ff)] p-4"><div className="mb-2 flex items-center gap-2 text-brand"><Sparkles size={16}/><span className="text-xs font-extrabold">Smart scheduling</span></div><p className="mb-3 text-[11px] leading-[1.65] text-[#777795]">Let ShiftFlow find the best fit for your open shifts.</p><button className="flex items-center gap-2 text-xs font-bold text-brand" onClick={()=>navigate('schedule')}>Explore planner <ArrowRight size={13}/></button></div><button onClick={()=>navigate('settings')} className="flex w-full items-center gap-3 border-t border-slate-100 px-2 pt-5 text-left"><Avatar name="Workspace Admin" color="#786ada" size={36}/><span className="flex-1"><span className="block text-[12px] font-bold text-ink">Workspace admin</span><span className="block text-[11px] text-muted">Administrator</span></span><ChevronDown size={15} className="text-muted"/></button></div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#ededf3] bg-white/95 px-5 backdrop-blur lg:px-9"><div className="flex items-center gap-4"><button className="text-ink lg:hidden" onClick={()=>setMobileOpen(true)} aria-label="Open navigation"><Menu size={22}/></button><div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-[#f2f0ff] text-brand sm:flex"><Activity size={18}/></div><div><div className="font-display text-[13px] font-extrabold text-ink">{db.settings.workspaceName}</div><div className="text-[11px] text-muted">Operations workspace · {db.settings.location}</div></div></div>
        <div className="flex items-center gap-3"><span className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 md:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>Demo workspace</span><button className="hidden rounded-lg p-2 text-muted hover:bg-slate-100 sm:block" title="Help" onClick={()=>navigate('settings')}><CircleHelp size={19}/></button><div className="relative"><button className="relative rounded-lg p-2 text-muted hover:bg-slate-100" aria-label="Notifications" onClick={()=>setNotificationsOpen(!notificationsOpen)}><Bell size={19}/>{(pending+open)>0&&<span className="absolute right-1 top-1 h-[7px] w-[7px] rounded-full border border-white bg-[#ed8299]"/>}</button>{notificationsOpen && <div className="absolute right-0 top-11 z-30 w-[282px] rounded-xl border border-slate-100 bg-white p-4 shadow-xl"><h3 className="mb-3 text-sm font-extrabold text-ink">Notifications</h3><button className="mb-2 block w-full text-left text-xs text-slate-600" onClick={()=>{navigate('schedule');setNotificationsOpen(false)}}><span className="font-bold text-violet-600">{open} open shifts</span> need coverage</button><button className="block w-full text-left text-xs text-slate-600" onClick={()=>{navigate('timeoff');setNotificationsOpen(false)}}><span className="font-bold text-amber-600">{pending} time-off requests</span> awaiting review</button></div>}</div><div className="h-7 border-l border-slate-200"/><Avatar name="Workspace Admin" color="#8477eb" size={34}/></div></header>
      <main className="mx-auto max-w-[1540px] px-5 py-7 lg:px-9 lg:py-9">{children}</main>
    </div>
    {notice && <div role="status" className="fixed bottom-5 right-5 z-[60] flex max-w-[390px] items-center gap-3 rounded-xl bg-[#29283e] px-4 py-3 text-sm font-semibold text-white shadow-2xl"><span className="flex-1">{notice}</span><button onClick={noticeClose} aria-label="Dismiss notification"><X size={16}/></button></div>}
  </div>
}
