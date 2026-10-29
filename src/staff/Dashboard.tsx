import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarPlus, ClipboardCheck, Coffee, MoreHorizontal } from 'lucide-react'
import { useToast } from '../components/Toast'
import { Avatar, Empty, PageHead, StatusBadge } from '../components/ui'
import { specialtyById } from '../data/clinic'
import { doctorSlots } from '../data/seed'
import { addDays, fmtLong, nowMin, startOfWeek, timeToMin, todayISO } from '../lib/date'
import { isActive, useStore } from '../lib/store'
import { NEXT, ORIGIN } from './actions'
import { AppointmentPanel } from './AppointmentPanel'
import { NewAppointment } from './NewAppointment'

export function Dashboard() {
  const { db, doctor, patient, setStatus, me } = useStore()
  const ownDoc = me?.role === 'medico' ? me.doctorId : undefined
  const toast = useToast()
  const today = todayISO()
  const [docFilter, setDocFilter] = useState<string>('todos')
  const [openId, setOpenId] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)

  const todays = db.appointments.filter(a => a.date === today && a.status !== 'cancelado' && (!ownDoc || a.doctorId === ownDoc))
  const queue = todays.filter(a => ownDoc || docFilter === 'todos' || a.doctorId === docFilter)
  const count = (s: string[]) => todays.filter(a => s.includes(a.status)).length
  const pending = db.appointments.filter(a => a.status === 'pendente' && a.date >= today && (!ownDoc || a.doctorId === ownDoc))
  const week7 = db.appointments.filter(a => a.date > today && a.date <= addDays(today, 7) && isActive(a.status) && a.doctorId === ownDoc).length
  const monthStart = today.slice(0, 8) + '01'
  const monthPast = db.appointments.filter(a => a.date >= addDays(monthStart, -1) && a.date < today && ['concluido', 'faltou'].includes(a.status))
  const noShow = monthPast.length ? Math.round((monthPast.filter(a => a.status === 'faltou').length / monthPast.length) * 100) : 0
  const now = nowMin()
  const nextUp = todays.find(a => ['confirmado', 'pendente'].includes(a.status) && timeToMin(a.time) >= now - 15)

  const week = startOfWeek(today)
  const occupancy = db.doctors.filter(d => !ownDoc || d.id === ownDoc).map(d => {
    let total = 0, used = 0
    for (let i = 0; i < 5; i++) {
      const date = addDays(week, i)
      const slots = doctorSlots(d, date)
      total += slots.length
      used += db.appointments.filter(a => a.doctorId === d.id && a.date === date && isActive(a.status)).length
    }
    return { d, total, used, pct: total ? Math.round((used / total) * 100) : 0 }
  }).filter(o => o.total > 0)

  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const docsToday = db.doctors.filter(d => todays.some(a => a.doctorId === d.id))
  const name = ownDoc ? doctor(ownDoc).short : (me?.name.split(' ')[0] ?? '')

  return (
    <div className="stack-lg">
      <PageHead index="01" eyebrow={fmtLong(today)} title={<>{hello}, <em>{name}</em>.</>}>
        <button className="btn btn--primary" onClick={() => setNewOpen(true)}><CalendarPlus size={18} /> Novo agendamento</button>
      </PageHead>

      <section className="kpis" aria-label="Resumo do dia">
        <div className="kpi"><p className="kpi__label">Consultas hoje</p><p className="kpi__value">{todays.filter(a => isActive(a.status)).length}</p><p className="kpi__sub">{ownDoc ? 'na sua agenda' : `${docsToday.length} profissiona${docsToday.length === 1 ? 'l' : 'is'} atendendo`}</p></div>
        <div className="kpi"><p className="kpi__label">Na recepção</p><p className="kpi__value">{count(['chegou'])}</p><p className="kpi__sub">{count(['atendimento'])} em atendimento agora</p></div>
        <div className="kpi"><p className="kpi__label">Atendidos</p><p className="kpi__value">{count(['concluido'])}</p><p className="kpi__sub">{count(['faltou'])} falta{count(['faltou']) === 1 ? '' : 's'} hoje</p></div>
        {ownDoc
          ? <Link to="/equipe/agenda" className="kpi kpi--alert"><p className="kpi__label">Próximos 7 dias</p><p className="kpi__value">{week7}</p><p className="kpi__sub">Ver minha agenda <ArrowRight size={14} /></p></Link>
          : <Link to="/equipe/solicitacoes" className="kpi kpi--alert"><p className="kpi__label">A confirmar</p><p className="kpi__value">{pending.length}</p><p className="kpi__sub">Ver solicitações <ArrowRight size={14} /></p></Link>}
      </section>

      <div className="dash-grid">
        <section className="card card--flush">
          <div className="card__bar">
            <div>
              <p className="eyebrow"><span className="eyebrow__num">02</span>Fila do dia</p>
              <h2 className="card__title">Atendimentos de <em>hoje</em></h2>
            </div>
            {!ownDoc && <select className="select-sm" value={docFilter} onChange={e => setDocFilter(e.target.value)} aria-label="Filtrar por profissional">
              <option value="todos">Todos os profissionais</option>
              {docsToday.map(d => <option key={d.id} value={d.id}>{d.short}</option>)}
            </select>}
          </div>
          {queue.length === 0 ? (
            <Empty icon={<Coffee />} title="Nenhum atendimento hoje.">
              <p className="muted small">A clínica atende de segunda a sexta. Veja a <Link to="/equipe/agenda" className="link">agenda da semana</Link>.</p>
            </Empty>
          ) : (
            <ul className="queue">
              {queue.map(a => {
                const p = patient(a.patientId)
                const next = NEXT[a.status]
                const late = a.status === 'confirmado' && timeToMin(a.time) + 15 < now
                return (
                  <li key={a.id} className={`queue__row queue__row--${a.status}${nextUp?.id === a.id ? ' is-next' : ''}`}>
                    <span className="queue__time">{a.time}{nextUp?.id === a.id && <small>próximo</small>}{late && <small className="late">atrasado</small>}</span>
                    <button className="queue__who" onClick={() => setOpenId(a.id)}>
                      <Avatar name={p.name} size={34} />
                      <span>
                        <b>{p.name}</b>
                        <small>{!ownDoc && <>{doctor(a.doctorId).short} · </>}{specialtyById(a.specialtyId).name} · {a.type === 'primeira' ? '1ª consulta' : 'Retorno'}{a.precheck && <> · <ClipboardCheck size={12} /> pré-consulta</>}</small>
                      </span>
                    </button>
                    <span className="queue__status"><StatusBadge status={a.status} /></span>
                    <span className="queue__act">
                      {next && <button className="btn btn--sm btn--soft" onClick={() => { setStatus(a.id, next.to); toast(`${p.name.split(' ')[0]}: ${next.toast.toLowerCase()}`) }}>{next.label}</button>}
                      {a.status === 'confirmado' && late && <button className="btn btn--sm btn--ghost" onClick={() => { setStatus(a.id, 'faltou'); toast('Falta registrada', 'info') }}>Faltou</button>}
                      <button className="icon-btn" onClick={() => setOpenId(a.id)} aria-label="Mais opções"><MoreHorizontal size={18} /></button>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className="stack">
          <section className="card">
            <p className="eyebrow"><span className="eyebrow__num">03</span>Esta semana</p>
            <h2 className="card__title">Ocupação da <em>agenda</em></h2>
            <ul className="meters">
              {occupancy.map(o => (
                <li key={o.d.id}>
                  <span className="meters__head"><span>{o.d.short} <small className="muted">· {specialtyById(o.d.specialtyId).name}</small></span><b>{o.pct}%</b></span>
                  <span className="meter" role="img" aria-label={`${o.used} de ${o.total} horários ocupados`}><span style={{ width: `${o.pct}%` }} /></span>
                  <small className="muted">{o.used} de {o.total} horários</small>
                </li>
              ))}
            </ul>
            <p className="muted small">Faltas no mês: <b>{noShow}%</b> das consultas realizadas.</p>
          </section>

          {!ownDoc && <section className="card card--rose">
            <p className="eyebrow">Solicitações recentes</p>
            {pending.length === 0 ? <p className="muted">Tudo confirmado.</p> : (
              <ul className="mini-list">
                {[...pending].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4).map(a => (
                  <li key={a.id}>
                    <button onClick={() => setOpenId(a.id)}>
                      <b>{patient(a.patientId).name}</b>
                      <small>{doctor(a.doctorId).short} · {a.date.slice(8)}/{a.date.slice(5, 7)} às {a.time} · {ORIGIN[a.origin]}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/equipe/solicitacoes" className="btn btn--ghost btn--sm">Ver todas <ArrowRight size={16} /></Link>
          </section>}
        </div>
      </div>

      <AppointmentPanel id={openId} onClose={() => setOpenId(null)} />
      <NewAppointment open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  )
}
