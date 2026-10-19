import type { ReactNode } from 'react'
import { X, ArrowUpRight } from 'lucide-react'

export function Avatar({ name, color = '#8c7bf5', size = 36 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(' ').map(s => s[0]).slice(0,2).join('')
  return <span className="inline-flex shrink-0 items-center justify-center rounded-full font-bold" style={{ width: size, height: size, backgroundColor: color + '21', color, fontSize: size <= 30 ? 10 : 12 }} aria-label={name}>{initials}</span>
}
export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral'|'green'|'purple'|'amber'|'red'|'blue' }) {
  const tones = { neutral: 'bg-slate-100 text-slate-600', green: 'bg-emerald-50 text-emerald-600', purple: 'bg-violet-50 text-violet-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-rose-50 text-rose-600', blue: 'bg-blue-50 text-blue-600' }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</span>
}
export function SectionTitle({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  return <div className="mb-5 flex items-center justify-between gap-3"><div>{eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}<h2 className="font-display text-[16px] font-extrabold tracking-[-.3px] text-ink">{title}</h2></div>{action}</div>
}
export function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1a36]/50 p-4 backdrop-blur-[2px]" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-[540px] max-h-[92vh] overflow-y-auto rounded-[20px] border border-white/60 bg-white p-6 shadow-2xl scrollbar-thin">
      <div className="mb-6 flex justify-between gap-4"><div><h2 className="font-display text-xl font-extrabold text-ink">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div><button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-slate-500" onClick={onClose} aria-label="Close dialog"><X size={17}/></button></div>
      {children}
    </section>
  </div>
}
export function MiniLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-violet-800">{children}<ArrowUpRight size={13}/></button>
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0"><span className="field-label">{label}</span>{children}</label>
}
export function Empty({ title, description }: { title: string; description: string }) {
  return <div className="px-5 py-12 text-center"><div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-violet-50 text-2xl leading-[48px] text-brand">✳</div><h3 className="font-display text-sm font-bold text-ink">{title}</h3><p className="mt-2 text-xs text-muted">{description}</p></div>
}
