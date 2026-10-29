import { useState } from 'react'
import { CalendarPlus, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Calendar } from '../components/Calendar'
import { Avatar, PageHead, Segmented } from '../components/ui'
import { CLINIC, specialtyById } from '../data/clinic'
import { doctorSlots } from '../data/seed'
import type { Doctor } from '../data/types'
import { addDays, fmtLong, minToTime, nowMin, startOfWeek, timeToMin, todayISO, weekday, weekdayShort } from '../lib/date'
import { STATUS, useStore } from '../lib/store'
import { AppointmentPanel } from './AppointmentPanel'
import { NewAppointment, type Prefill } from './NewAppointment'

const START = 480
const END = 1020
const PX = 1.7

interface Col { key: string; date: string; doc: Doctor; label: string; sub: string }

export function Agenda() {
  const { db, me } = useStore()
  const ownDoc = me?.role === 'medico' ? me.doctorId : undefined
  const today = todayISO()
  const [view, setView] = useState<'dia' | 'semana'>('dia')
  const [date, setDate] = useState(today)
  const [docId, setDocId] = useState(ownDoc ?? 'd1')
  const [pick, setPick] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [prefill, setPrefill] = useState<Prefill | null>(null)

  const works = (d: Doctor, iso: string) => !!d.schedule[weekday(iso) as 0]
  let cols: Col[]
  if (view === 'dia') {
    cols = db.doctors.filter(d => works(d, date) && (!ownDoc || d.id === ownDoc)).map(d => ({ key: d.id, date, doc: d, label: d.short, sub: specialtyById(d.specialtyId).name }))
  } else {
    const doc = db.doctors.find(d => d.id === docId)!
    const mon = startOfWeek(date)
    cols = Array.from({ length: 5 }, (_, i) => addDays(mon, i)).map(iso => ({ key: iso, date: iso, doc, label: `${weekdayShort(weekday(iso))} ${iso.slice(8)}`, sub: works(doc, iso) ? '' : 'Não atende' }))
  }

  const step = view === 'dia' ? 1 : 7
  const hours = Array.from({ length: (END - START) / 60 + 1 }, (_, i) => START + i * 60)
  const now = nowMin()
  const title = view === 'dia' ? fmtLong(date) : `Semana de ${startOfWeek(date).slice(8)}/${startOfWeek(date).slice(5, 7)}`

  return (
    <div className="stack">
      <PageHead index="02" eyebrow="Agenda" title={<>{title.split(',')[0]}<em>{title.includes(',') ? `,${title.split(',')[1]}` : ''}</em></>}>
        <button className="btn btn--primary" onClick={() => setPrefill({})}><CalendarPlus size={18} /> Agendar</button>
      </PageHead>

      <div className="toolbar">
        <div className="toolbar__group">
          <button className="icon-btn icon-btn--soft" onClick={() => setDate(addDays(date, -step))} aria-label="Anterior"><ChevronLeft size={18} /></button>
          <button className="btn btn--sm btn--ghost" onClick={() => setDate(today)}>Hoje</button>
          <button className="icon-btn icon-btn--soft" onClick={() => setDate(addDays(date, step))} aria-label="Próximo"><ChevronRight size={18} /></button>
          <div className="popover-wrap">
            <button className="btn btn--sm btn--ghost" onClick={() => setPick(p => !p)}>Escolher data</button>
            {pick && <div className="popover"><Calendar value={date} onChange={d => { setDate(d); setPick(false) }} /></div>}
          </div>
        </div>
        <div className="toolbar__group">
          {view === 'semana' && !ownDoc && (
            <select className="select-sm" value={docId} onChange={e => setDocId(e.target.value)} aria-label="Profissional">
              {db.doctors.map(d => <option key={d.id} value={d.id}>{d.short}</option>)}
            </select>
          )}
          <Segmented label="Visualização" value={view} onChange={setView} options={[{ value: 'dia', label: 'Dia' }, { value: 'semana', label: 'Semana' }]} />
        </div>
      </div>

      <div className="legend">
        {(['pendente', 'confirmado', 'chegou', 'atendimento', 'concluido', 'faltou'] as const).map(s => (
          <span key={s} className={`legend__item tone-${STATUS[s].tone}`}><i />{STATUS[s].label}</span>
        ))}
      </div>

      {cols.length === 0 ? (
        <div className="card"><p className="muted">{ownDoc ? 'Você não atende neste dia. Veja a semana ou escolha outra data.' : 'Nenhum profissional atende neste dia. A clínica funciona de segunda a sexta.'}</p></div>
      ) : (
        <div className="grid-wrap">
          <div className="sched" style={{ ['--cols' as string]: cols.length }}>
            <div className="sched__corner" />
            {cols.map(c => (
              <div key={c.key} className={`sched__head${c.date === today ? ' is-today' : ''}`}>
                {view === 'dia' && <Avatar name={c.doc.name} size={28} tone="wine" />}
                <span><b>{c.label}</b>{c.sub && <small>{c.sub}</small>}</span>
              </div>
            ))}

            <div className="sched__times" style={{ height: (END - START) * PX }}>
              {hours.map(h => <span key={h} style={{ top: (h - START) * PX }}>{minToTime(h)}</span>)}
            </div>

            {cols.map(c => {
              const appts = db.appointments.filter(a => a.doctorId === c.doc.id && a.date === c.date && a.status !== 'cancelado')
              const taken = new Set(appts.map(a => a.time))
              const blocked = c.doc.blocked.includes(c.date)
              const range = c.doc.schedule[weekday(c.date) as 0]
              const free = doctorSlots(c.doc, c.date).filter(t => !taken.has(t) && (c.date > today || (c.date === today && timeToMin(t) > now)))
              return (
                <div key={c.key} className="sched__col" style={{ height: (END - START) * PX }}>
                  {hours.map(h => <span key={h} className="sched__line" style={{ top: (h - START) * PX }} />)}
                  {range && <span className="sched__on" style={{ top: (range[0] - START) * PX, height: (range[1] - range[0]) * PX }} />}
                  <span className="sched__lunch" style={{ top: (CLINIC.lunch[0] - START) * PX, height: (CLINIC.lunch[1] - CLINIC.lunch[0]) * PX }}>Almoço</span>
                  {blocked && <span className="sched__blocked">Agenda bloqueada</span>}
                  {free.map(t => (
                    <button key={t} className="sched__free" style={{ top: (timeToMin(t) - START) * PX + 2, height: c.doc.slot * PX - 4 }} onClick={() => setPrefill({ doctorId: c.doc.id, date: c.date, time: t })} aria-label={`Agendar ${t}`}>
                      <Plus size={14} /> {t}
                    </button>
                  ))}
                  {appts.map(a => {
                    const p = db.patients.find(x => x.id === a.patientId)!
                    return (
                      <button key={a.id} className={`sched__appt tone-${STATUS[a.status].tone}`} style={{ top: (timeToMin(a.time) - START) * PX + 2, height: a.duration * PX - 4 }} onClick={() => setOpenId(a.id)}>
                        <b>{a.time} · {p.name.split(' ').slice(0, 2).join(' ')}</b>
                        <small>{a.type === 'primeira' ? '1ª consulta' : 'Retorno'} · {a.insurance}</small>
                      </button>
                    )
                  })}
                  {c.date === today && now > START && now < END && <span className="sched__now" style={{ top: (now - START) * PX }} />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <AppointmentPanel id={openId} onClose={() => setOpenId(null)} />
      <NewAppointment open={!!prefill} onClose={() => setPrefill(null)} prefill={prefill ?? undefined} />
    </div>
  )
}
