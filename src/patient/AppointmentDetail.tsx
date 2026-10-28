import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, ClipboardCheck, MapPin, MessageCircle, Repeat, X } from 'lucide-react'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { Avatar, StatusBadge } from '../components/ui'
import { CLINIC, specialtyById } from '../data/clinic'
import type { Appointment } from '../data/types'
import { fmtLong, todayISO } from '../lib/date'
import { downloadICS, waLink } from '../lib/ics'
import { useStore } from '../lib/store'
import { PreCheckForm } from './PreCheckForm'

export function AppointmentDetail({ a, onClose }: { a: Appointment | null; onClose: () => void }) {
  const { doctor, setStatus, savePrecheck } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const [mode, setMode] = useState<'view' | 'cancel' | 'precheck'>('view')
  const close = () => { setMode('view'); onClose() }
  if (!a) return null
  const doc = doctor(a.doctorId)
  const spec = specialtyById(a.specialtyId)
  const upcoming = a.date >= todayISO() && ['pendente', 'confirmado'].includes(a.status)

  if (mode === 'cancel') {
    return (
      <Modal open onClose={close} eyebrow="Cancelar consulta" title="Tem certeza?" footer={<>
        <button className="btn btn--ghost" onClick={() => setMode('view')}>Manter consulta</button>
        <button className="btn btn--danger" onClick={() => { setStatus(a.id, 'cancelado', 'Cancelado pelo paciente'); toast('Consulta cancelada. O horário foi liberado.'); close() }}>Cancelar consulta</button>
      </>}>
        <p>A consulta de <b>{spec.name}</b> com <b>{doc.short}</b> em <b>{fmtLong(a.date)}, às {a.time}</b> será cancelada e o horário ficará disponível para outra pessoa.</p>
        <p className="muted" style={{ marginTop: '.75rem' }}>Se preferir, você pode remarcar para outra data.</p>
      </Modal>
    )
  }

  if (mode === 'precheck') {
    return (
      <Modal open onClose={close} eyebrow={`${spec.name} · ${fmtLong(a.date)}`} title="Pré-consulta" footer={<>
        <button className="btn btn--ghost" onClick={() => setMode('view')}>Voltar</button>
        <button className="btn btn--primary" form="precheck">Enviar respostas</button>
      </>}>
        <PreCheckForm a={a} onSave={p => { savePrecheck(a.id, p); toast('Pré-consulta enviada para a clínica'); setMode('view') }} />
      </Modal>
    )
  }

  return (
    <Modal open onClose={close} eyebrow={a.type === 'primeira' ? 'Primeira consulta' : 'Retorno'} title={spec.name} footer={upcoming ? <>
      <button className="btn btn--ghost btn--danger-text" onClick={() => setMode('cancel')}><X size={16} /> Cancelar</button>
      <button className="btn btn--ghost" onClick={() => nav(`/paciente/agendar?remarcar=${a.id}`)}><Repeat size={16} /> Remarcar</button>
    </> : undefined}>
      <div className="detail">
        <div className="detail__when">
          <p className="detail__date">{fmtLong(a.date)}</p>
          <p className="detail__time">{a.time}</p>
          <StatusBadge status={a.status} />
        </div>
        <div className="detail__doc">
          <Avatar name={doc.name} size={44} tone="wine" />
          <div><p><b>{doc.name}</b></p><p className="muted small">{doc.title} · {doc.council}</p></div>
        </div>
        <dl className="detail__list">
          <div><dt>Atendimento</dt><dd>{a.insurance}</dd></div>
          <div><dt>Duração</dt><dd>{a.duration} min</dd></div>
          <div><dt>Local</dt><dd>{CLINIC.address}</dd></div>
        </dl>
        {a.status === 'pendente' && <p className="note note--amber">A clínica vai confirmar seu horário em breve. Você recebe um aviso aqui e no WhatsApp.</p>}
        {a.cancelReason && a.status === 'cancelado' && <p className="note">{a.cancelReason}.</p>}

        {upcoming && (
          <div className="action-grid">
            <button className={`action${a.precheck ? ' is-done' : ''}`} onClick={() => setMode('precheck')}>
              <ClipboardCheck size={20} /><span>{a.precheck ? 'Pré-consulta enviada' : 'Responder pré-consulta'}</span>
            </button>
            <button className="action" onClick={() => { downloadICS({ title: `Consulta · ${spec.name} (Creass)`, date: a.date, time: a.time, duration: a.duration, details: `${doc.name}` }); toast('Evento salvo. Abra o arquivo para adicionar à sua agenda.', 'info') }}>
              <CalendarPlus size={20} /><span>Adicionar à agenda</span>
            </button>
            <a className="action" href={CLINIC.maps} target="_blank" rel="noreferrer"><MapPin size={20} /><span>Como chegar</span></a>
            <a className="action" href={waLink(`Olá! Tenho uma consulta de ${spec.name} em ${fmtLong(a.date)} às ${a.time} e gostaria de falar com a recepção.`)} target="_blank" rel="noreferrer">
              <MessageCircle size={20} /><span>Falar com a recepção</span>
            </a>
          </div>
        )}
      </div>
    </Modal>
  )
}
