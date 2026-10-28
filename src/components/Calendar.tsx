import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { fromISO, monthName, pad, toISO, todayISO } from '../lib/date'

interface Props {
  value: string | null
  onChange: (iso: string) => void
  /** número de horários livres no dia; 0 = indisponível */
  availability?: (iso: string) => number
  minDate?: string
  maxDate?: string
}

export function Calendar({ value, onChange, availability, minDate, maxDate }: Props) {
  const start = fromISO(value ?? minDate ?? todayISO())
  const [ym, setYm] = useState({ y: start.getFullYear(), m: start.getMonth() })
  const first = new Date(ym.y, ym.m, 1)
  const lead = first.getDay()
  const days = new Date(ym.y, ym.m + 1, 0).getDate()
  const today = todayISO()
  const shift = (n: number) => setYm(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  const firstISO = `${ym.y}-${pad(ym.m + 1)}-01`
  const canPrev = !minDate || firstISO > minDate
  const canNext = !maxDate || toISO(new Date(ym.y, ym.m + 1, 1)) <= maxDate

  return (
    <div className="cal">
      <div className="cal__head">
        <button className="icon-btn" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Mês anterior"><ChevronLeft size={18} /></button>
        <p className="cal__month">{monthName(ym.m)} <span>{ym.y}</span></p>
        <button className="icon-btn" onClick={() => shift(1)} disabled={!canNext} aria-label="Próximo mês"><ChevronRight size={18} /></button>
      </div>
      <div className="cal__grid" role="grid">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i} className="cal__dow">{d}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const iso = toISO(new Date(ym.y, ym.m, i + 1))
          const out = (minDate && iso < minDate) || (maxDate && iso > maxDate)
          const n = availability ? availability(iso) : 1
          const disabled = !!out || n === 0
          return (
            <button
              key={iso}
              className={`cal__day${iso === value ? ' is-on' : ''}${iso === today ? ' is-today' : ''}${!disabled && availability ? (n <= 3 ? ' is-few' : ' is-free') : ''}`}
              disabled={disabled}
              onClick={() => onChange(iso)}
              aria-pressed={iso === value}
              aria-label={`${i + 1} de ${monthName(ym.m)}${availability && !disabled ? `, ${n} horários` : ''}`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
      {availability && (
        <p className="cal__legend"><span className="dot dot--free" /> Vários horários <span className="dot dot--few" /> Poucos horários</p>
      )}
    </div>
  )
}
