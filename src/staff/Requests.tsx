import { useState } from 'react'
import { Check, CheckCheck, Inbox } from 'lucide-react'
import { useToast } from '../components/Toast'
import { Avatar, Empty, PageHead, Segmented } from '../components/ui'
import { specialtyById } from '../data/clinic'
import { fmtLong, todayISO } from '../lib/date'
import { useStore } from '../lib/store'
import { ORIGIN } from './actions'
import { AppointmentPanel } from './AppointmentPanel'

export function Requests() {
  const { db, doctor, patient, setStatus } = useStore()
  const toast = useToast()
  const [origin, setOrigin] = useState<'todas' | 'paciente' | 'whatsapp'>('todas')
  const [openId, setOpenId] = useState<string | null>(null)
  const today = todayISO()
  const all = db.appointments
    .filter(a => a.status === 'pendente' && a.date >= today)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.date.localeCompare(b.date))
  const list = all.filter(a => origin === 'todas' || a.origin === origin)

  return (
    <div className="stack">
      <PageHead index="03" eyebrow="Solicitações" title={<>Pedidos a <em>confirmar</em></>}>
        {list.length > 0 && (
          <button className="btn btn--ghost" onClick={() => { list.forEach(a => setStatus(a.id, 'confirmado')); toast(`${list.length} consultas confirmadas · pacientes avisados`) }}>
            <CheckCheck size={18} /> Confirmar todas ({list.length})
          </button>
        )}
      </PageHead>
      <p className="muted lead">Pedidos feitos pelo portal e pelo WhatsApp. Ao confirmar, o paciente recebe o aviso na hora.</p>
      <Segmented label="Origem" value={origin} onChange={setOrigin} options={[
        { value: 'todas', label: `Todas (${all.length})` },
        { value: 'paciente', label: `Portal (${all.filter(a => a.origin === 'paciente').length})` },
        { value: 'whatsapp', label: `WhatsApp (${all.filter(a => a.origin === 'whatsapp').length})` },
      ]} />

      {list.length === 0 ? <Empty icon={<Inbox />} title="Nenhum pedido aguardando confirmação." /> : (
        <ul className="req-list">
          {list.map(a => {
            const p = patient(a.patientId)
            const isNew = a.createdAt >= today
            return (
              <li key={a.id} className="req">
                <button className="req__who" onClick={() => setOpenId(a.id)}>
                  <Avatar name={p.name} size={42} />
                  <span>
                    <b>{p.name}{isNew && <span className="chip chip--red">novo</span>}</b>
                    <small>{p.phone} · {a.insurance}</small>
                  </span>
                </button>
                <div className="req__when">
                  <b>{fmtLong(a.date)}</b>
                  <small>{a.time} · {doctor(a.doctorId).short} · {specialtyById(a.specialtyId).name}</small>
                </div>
                <div className="req__meta">
                  <span className="chip">{ORIGIN[a.origin]}</span>
                  <span className="chip chip--soft">{a.type === 'primeira' ? '1ª consulta' : 'Retorno'}</span>
                </div>
                {a.notes && <p className="req__note">“{a.notes}”</p>}
                <div className="req__act">
                  <button className="btn btn--sm btn--ghost" onClick={() => setOpenId(a.id)}>Outro horário</button>
                  <button className="btn btn--sm btn--primary" onClick={() => { setStatus(a.id, 'confirmado'); toast(`Consulta de ${p.name.split(' ')[0]} confirmada`) }}><Check size={16} /> Confirmar</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <AppointmentPanel id={openId} onClose={() => setOpenId(null)} />
    </div>
  )
}
