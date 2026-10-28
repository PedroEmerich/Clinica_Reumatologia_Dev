import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, CalendarX } from 'lucide-react'
import { Empty, PageHead, Segmented } from '../components/ui'
import { DEMO_PATIENT_ID } from '../data/seed'
import type { Appointment } from '../data/types'
import { todayISO } from '../lib/date'
import { useStore } from '../lib/store'
import { AppointmentCard } from './AppointmentCard'
import { AppointmentDetail } from './AppointmentDetail'

export function MyAppointments() {
  const { db } = useStore()
  const [tab, setTab] = useState<'proximas' | 'anteriores'>('proximas')
  const [open, setOpen] = useState<Appointment | null>(null)
  const today = todayISO()
  const mine = db.appointments.filter(a => a.patientId === DEMO_PATIENT_ID)
  const isNext = (a: Appointment) => a.date >= today && ['pendente', 'confirmado', 'chegou', 'atendimento'].includes(a.status)
  const list = tab === 'proximas' ? mine.filter(isNext) : mine.filter(a => !isNext(a)).reverse()
  const live = open && db.appointments.find(a => a.id === open.id)

  return (
    <div className="stack">
      <PageHead index="02" eyebrow="Histórico" title={<>Minhas <em>consultas</em></>}>
        <Link to="/paciente/agendar" className="btn btn--primary btn--sm"><CalendarPlus size={16} /> Nova consulta</Link>
      </PageHead>
      <Segmented label="Filtrar consultas" value={tab} onChange={setTab} options={[
        { value: 'proximas', label: `Próximas (${mine.filter(isNext).length})` },
        { value: 'anteriores', label: 'Anteriores' },
      ]} />
      {list.length === 0 ? (
        <Empty icon={<CalendarX />} title={tab === 'proximas' ? 'Você não tem consultas marcadas.' : 'Nenhuma consulta anterior.'}>
          {tab === 'proximas' && <Link to="/paciente/agendar" className="btn btn--primary btn--sm">Agendar consulta</Link>}
        </Empty>
      ) : (
        <div className="appt-list">{list.map(a => <AppointmentCard key={a.id} a={a} onOpen={() => setOpen(a)} />)}</div>
      )}
      <AppointmentDetail a={live || null} onClose={() => setOpen(null)} />
    </div>
  )
}
