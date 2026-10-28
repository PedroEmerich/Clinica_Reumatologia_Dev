import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, CalendarPlus, ClipboardCheck, Clock, MapPin, MessageCircle, Phone } from 'lucide-react'
import { Avatar, StatusBadge } from '../components/ui'
import { CHECKLIST, CLINIC, isOpenNow, specialtyById } from '../data/clinic'
import { DEMO_PATIENT_ID } from '../data/seed'
import type { Appointment } from '../data/types'
import { daysBetween, fmtLong, todayISO } from '../lib/date'
import { waLink } from '../lib/ics'
import { useStore } from '../lib/store'
import { AppointmentDetail } from './AppointmentDetail'

export function PatientHome() {
  const { db, patient, doctor } = useStore()
  const me = patient(DEMO_PATIENT_ID)
  const today = todayISO()
  const mine = db.appointments.filter(a => a.patientId === me.id)
  const upcoming = mine.filter(a => a.date >= today && ['pendente', 'confirmado', 'chegou'].includes(a.status))
  const next = upcoming[0]
  const done = mine.filter(a => a.status === 'concluido').length
  const [open, setOpen] = useState<Appointment | null>(null)
  const [checks, setChecks] = useState<boolean[]>(() => CHECKLIST.map(() => false))
  const status = isOpenNow()
  const live = open && db.appointments.find(a => a.id === open.id)
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="stack-lg">
      <section className="hello">
        <p className="eyebrow"><span className="eyebrow__num">01</span>{fmtLong(today)}</p>
        <h1 className="page-title page-title--xl">{hello}, <em>{me.name.split(' ')[0]}</em>.</h1>
      </section>

      <div className="home-grid">
        <section className={`next${next ? '' : ' next--empty'}`}>
          {next ? (
            <>
              <div className="next__head">
                <p className="eyebrow eyebrow--light">Próxima consulta</p>
                <span className="next__count">{daysBetween(today, next.date) === 0 ? 'É hoje' : `Faltam ${daysBetween(today, next.date)} dia${daysBetween(today, next.date) > 1 ? 's' : ''}`}</span>
              </div>
              <p className="next__date">{fmtLong(next.date)}</p>
              <p className="next__time">{next.time}</p>
              <div className="next__doc">
                <Avatar name={doctor(next.doctorId).name} size={42} tone="red" />
                <div>
                  <p>{doctor(next.doctorId).name}</p>
                  <p className="next__sub">{specialtyById(next.specialtyId).name} · {next.type === 'primeira' ? 'Primeira consulta' : 'Retorno'}</p>
                </div>
              </div>
              <div className="next__foot">
                <StatusBadge status={next.status} />
                <button className="btn btn--light btn--sm" onClick={() => setOpen(next)}>Ver detalhes <ArrowRight size={16} /></button>
              </div>
              {!next.precheck && (
                <button className="next__precheck" onClick={() => setOpen(next)}>
                  <ClipboardCheck size={18} /> Responda a pré-consulta antes do dia
                </button>
              )}
            </>
          ) : (
            <>
              <p className="eyebrow eyebrow--light">Próxima consulta</p>
              <p className="next__date">Nenhuma consulta marcada.</p>
              <Link to="/paciente/agendar" className="btn btn--light">Agendar agora <ArrowRight size={16} /></Link>
            </>
          )}
        </section>

        <section className="quick">
          <Link to="/paciente/agendar" className="quick__item quick__item--main">
            <CalendarPlus size={24} strokeWidth={1.6} />
            <span><b>Agendar consulta</b><small>Escolha especialidade, dia e horário</small></span>
            <ArrowRight size={18} />
          </Link>
          <Link to="/paciente/consultas" className="quick__item">
            <CalendarDays size={22} strokeWidth={1.6} />
            <span><b>Minhas consultas</b><small>{upcoming.length} próxima{upcoming.length === 1 ? '' : 's'} · {done} realizada{done === 1 ? '' : 's'}</small></span>
          </Link>
          <a href={waLink('Olá! Vim pelo portal da Creass e gostaria de falar com a recepção.')} target="_blank" rel="noreferrer" className="quick__item">
            <MessageCircle size={22} strokeWidth={1.6} />
            <span><b>WhatsApp</b><small>{CLINIC.phone}</small></span>
          </a>
        </section>
      </div>

      <div className="two-col">
        <section className="card">
          <p className="eyebrow"><span className="eyebrow__num">02</span>Para levar na consulta</p>
          <h2 className="card__title">O que <em>separar</em></h2>
          <ul className="checklist">
            {CHECKLIST.map((c, i) => (
              <li key={c}>
                <label className="check">
                  <input type="checkbox" checked={checks[i]} onChange={() => setChecks(s => s.map((v, j) => (j === i ? !v : v)))} />
                  <span>{c}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="progress" aria-label={`${checks.filter(Boolean).length} de ${CHECKLIST.length} itens`}>
            <span style={{ width: `${(checks.filter(Boolean).length / CHECKLIST.length) * 100}%` }} />
          </div>
          <p className="muted small">{checks.filter(Boolean).length} de {CHECKLIST.length} itens separados</p>
        </section>

        <section className="card card--rose">
          <p className="eyebrow"><span className="eyebrow__num">03</span>A clínica</p>
          <h2 className="card__title">Creass · <em>Centro</em></h2>
          <span className={`open-pill${status.open ? ' is-open' : ''}`}><i />{status.label}</span>
          <ul className="info-list">
            <li><MapPin size={18} /><span>{CLINIC.address}<br /><small>{CLINIC.city} · CEP {CLINIC.cep}</small></span></li>
            <li><Clock size={18} /><span>Seg. a qui. · 8h às 17h<br /><small>Sex. · 8h30 às 17h</small></span></li>
            <li><Phone size={18} /><span>{CLINIC.phone}<br /><small>WhatsApp e ligações</small></span></li>
          </ul>
          <a className="btn btn--ghost btn--sm" href={CLINIC.maps} target="_blank" rel="noreferrer">Abrir no mapa <ArrowRight size={16} /></a>
        </section>
      </div>

      <AppointmentDetail a={live || null} onClose={() => setOpen(null)} />
    </div>
  )
}
