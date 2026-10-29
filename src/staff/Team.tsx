import { useState } from 'react'
import { CalendarOff, X } from 'lucide-react'
import { useToast } from '../components/Toast'
import { Avatar, PageHead } from '../components/ui'
import { specialtyById } from '../data/clinic'
import type { Doctor, Weekday } from '../data/types'
import { fmtNum, minToTime, todayISO, weekdayShort } from '../lib/date'
import { useStore } from '../lib/store'

const DAYS: Weekday[] = [1, 2, 3, 4, 5]
const TIMES = Array.from({ length: 21 }, (_, i) => 420 + i * 30) // 7h às 17h

export function Team() {
  const { db, me } = useStore()
  const ownDoc = me?.role === 'medico' ? me.doctorId : undefined
  return (
    <div className="stack">
      <PageHead index="05" eyebrow="Corpo clínico" title={ownDoc ? <>Meus <em>horários</em></> : <>Profissionais e <em>horários</em></>} />
      <p className="muted lead">Os dias, horários e bloqueios definidos aqui mudam na hora os horários que o paciente vê no portal.</p>
      <div className="team-grid">{db.doctors.filter(d => !ownDoc || d.id === ownDoc).map(d => <DoctorCard key={d.id} d={d} />)}</div>
    </div>
  )
}

function DoctorCard({ d }: { d: Doctor }) {
  const { updateDoctor } = useStore()
  const toast = useToast()
  const [block, setBlock] = useState('')

  const setDay = (wd: Weekday, range: [number, number] | null) => {
    const schedule = { ...d.schedule }
    if (range) schedule[wd] = range
    else delete schedule[wd]
    updateDoctor(d.id, { schedule })
  }

  return (
    <section className="card doctor">
      <header className="doctor__head">
        <Avatar name={d.name} size={52} tone="wine" />
        <div className="grow">
          <p className="doctor__name">{d.name}</p>
          <p className="muted small">{specialtyById(d.specialtyId).name} · {d.council}</p>
          {d.sample && <span className="chip chip--soft">Profissional de exemplo</span>}
        </div>
      </header>

      <div className="week-edit">
        {DAYS.map(wd => {
          const r = d.schedule[wd]
          return (
            <div key={wd} className={`week-edit__row${r ? ' is-on' : ''}`}>
              <label className="check">
                <input type="checkbox" checked={!!r} onChange={e => { setDay(wd, e.target.checked ? [480, 1020] : null); toast('Horário atualizado', 'info') }} />
                <span>{weekdayShort(wd)}</span>
              </label>
              {r ? (
                <span className="week-edit__times">
                  <select value={r[0]} onChange={e => setDay(wd, [+e.target.value, Math.max(r[1], +e.target.value + 60)])} aria-label="Início">
                    {TIMES.map(t => <option key={t} value={t}>{minToTime(t)}</option>)}
                  </select>
                  <span>às</span>
                  <select value={r[1]} onChange={e => setDay(wd, [r[0], +e.target.value])} aria-label="Fim">
                    {TIMES.filter(t => t > r[0]).map(t => <option key={t} value={t}>{minToTime(t)}</option>)}
                  </select>
                </span>
              ) : <span className="muted small">Não atende</span>}
            </div>
          )
        })}
      </div>

      <label className="field field--inline">
        <span>Duração da consulta</span>
        <select value={d.slot} onChange={e => { updateDoctor(d.id, { slot: +e.target.value }); toast('Duração atualizada', 'info') }}>
          {[20, 30, 40, 45, 60].map(m => <option key={m} value={m}>{m} min</option>)}
        </select>
      </label>

      <div className="field">
        <span>Bloqueios (férias, congressos)</span>
        <form className="inline-form" onSubmit={e => {
          e.preventDefault()
          if (!block || d.blocked.includes(block)) return
          updateDoctor(d.id, { blocked: [...d.blocked, block].sort() })
          toast(`Agenda de ${d.short} bloqueada em ${fmtNum(block)}`)
          setBlock('')
        }}>
          <input type="date" min={todayISO()} value={block} onChange={e => setBlock(e.target.value)} aria-label="Data do bloqueio" />
          <button className="btn btn--sm btn--ghost"><CalendarOff size={16} /> Bloquear</button>
        </form>
        {d.blocked.length > 0 && (
          <p className="tags">
            {d.blocked.map(b => (
              <span key={b} className="chip chip--red">{fmtNum(b)}
                <button onClick={() => updateDoctor(d.id, { blocked: d.blocked.filter(x => x !== b) })} aria-label={`Remover bloqueio de ${fmtNum(b)}`}><X size={12} /></button>
              </span>
            ))}
          </p>
        )}
      </div>
      <p className="muted small">{Object.keys(d.schedule).length} dia(s) por semana · {Object.values(d.schedule).reduce((s, r) => s + Math.floor((r![1] - r![0] - (r![0] < 780 && r![1] > 720 ? 60 : 0)) / d.slot), 0)} consultas/semana</p>
    </section>
  )
}

