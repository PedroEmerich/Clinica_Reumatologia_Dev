import { CalendarDays, ChevronRight, Clock } from 'lucide-react'
import type { Appointment } from '../data/types'
import { specialtyById } from '../data/clinic'
import { fmtLong, relativeDay } from '../lib/date'
import { useStore } from '../lib/store'
import { Avatar, StatusBadge } from '../components/ui'

export function AppointmentCard({ a, onOpen }: { a: Appointment; onOpen: () => void }) {
  const { doctor } = useStore()
  const doc = doctor(a.doctorId)
  const rel = relativeDay(a.date)
  return (
    <button className="appt-card" onClick={onOpen}>
      <span className="appt-card__date">
        <b>{a.date.slice(8)}</b>
        <span>{fmtLong(a.date).split(' de ')[1]?.slice(0, 3)}</span>
      </span>
      <span className="appt-card__body">
        <span className="appt-card__top"><StatusBadge status={a.status} />{rel && <span className="chip chip--soft">{rel}</span>}</span>
        <span className="appt-card__title">{specialtyById(a.specialtyId).name} · {a.type === 'primeira' ? 'Primeira consulta' : 'Retorno'}</span>
        <span className="appt-card__meta">
          <span><Avatar name={doc.name} size={20} /> {doc.short}</span>
          <span><CalendarDays size={14} /> {fmtLong(a.date).split(',')[0]}</span>
          <span><Clock size={14} /> {a.time}</span>
        </span>
      </span>
      <ChevronRight className="appt-card__chev" size={20} />
    </button>
  )
}
