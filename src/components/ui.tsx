import type { ReactNode } from 'react'
import type { Status } from '../data/types'
import { STATUS } from '../lib/store'

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS[status]
  return <span className={`badge badge--${s.tone}`}><i />{s.label}</span>
}

export function Avatar({ name, size = 40, tone }: { name: string; size?: number; tone?: 'red' | 'wine' | 'soft' }) {
  const parts = name.replace(/^(Dra?\.)\s+/, '').split(' ')
  const ini = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
  return <span className={`avatar avatar--${tone ?? 'soft'}`} style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden="true">{ini}</span>
}

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty__icon">{icon}</span>
      <p className="empty__title">{title}</p>
      {children && <div className="empty__body">{children}</div>}
    </div>
  )
}

export function PageHead({ index, eyebrow, title, children }: { index?: string; eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <p className="eyebrow">{index && <span className="eyebrow__num">{index}</span>}{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
      </div>
      {children && <div className="page-head__actions">{children}</div>}
    </header>
  )
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map(o => (
        <button key={o.value} role="tab" aria-selected={value === o.value} className={value === o.value ? 'is-on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
