import { useEffect, useState } from 'react'
import { CalendarClock, ClipboardCheck, MessageCircle, Phone, UserRound } from 'lucide-react'
import { Calendar } from '../components/Calendar'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { Avatar, StatusBadge } from '../components/ui'
import { specialtyById } from '../data/clinic'
import type { Status } from '../data/types'
import { addDays, ageFrom, fmtLong, todayISO } from '../lib/date'
import { STATUS, useStore } from '../lib/store'
import { NEXT, ORIGIN } from './actions'

interface Props { id: string | null; onClose: () => void; onPatient?: (id: string) => void }

export function AppointmentPanel({ id, onClose, onPatient }: Props) {
  const { db, doctor, patient, setStatus, reschedule, updateAppointment, freeSlots } = useStore()
  const toast = useToast()
  const a = db.appointments.find(x => x.id === id) ?? null
  const [mode, setMode] = useState<'view' | 'move' | 'cancel'>('view')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [reason, setReason] = useState('Pedido do paciente')

  useEffect(() => { setMode('view'); setNotes(a?.notes ?? ''); setDate(null); setTime(null) }, [id])
  if (!a) return null
  const p = patient(a.patientId)
  const doc = doctor(a.doctorId)
  const next = NEXT[a.status]
  const close = () => { if (notes !== (a.notes ?? '')) updateAppointment(a.id, { notes }); onClose() }
  const act = (s: Status, msg: string) => { setStatus(a.id, s); toast(msg) }

  if (mode === 'move') {
    const slots = date ? freeSlots(a.doctorId, date, a.id) : []
    return (
      <Modal open wide onClose={close} eyebrow={`${p.name} · ${doc.short}`} title="Remarcar consulta" footer={<>
        <button className="btn btn--ghost" onClick={() => setMode('view')}>Voltar</button>
        <button className="btn btn--primary" disabled={!date || !time} onClick={() => { reschedule(a.id, date!, time!); toast('Consulta remarcada'); setMode('view') }}>Salvar novo horário</button>
      </>}>
        <div className="date-time date-time--compact">
          <Calendar value={date} onChange={d => { setDate(d); setTime(null) }} minDate={todayISO()} maxDate={addDays(todayISO(), 90)} availability={iso => freeSlots(a.doctorId, iso, a.id).length} />
          <div className="slots">
            {date ? <>
              <p className="slots__day">{fmtLong(date)}</p>
              <div className="slots__grid">{slots.map(t => <button key={t} className={`slot${time === t ? ' is-on' : ''}`} onClick={() => setTime(t)}>{t}</button>)}</div>
              {!slots.length && <p className="slots__hint">Sem horários livres.</p>}
            </> : <p className="slots__hint">Escolha um dia.</p>}
          </div>
        </div>
      </Modal>
    )
  }

  if (mode === 'cancel') {
    return (
      <Modal open onClose={close} eyebrow={p.name} title="Cancelar consulta" footer={<>
        <button className="btn btn--ghost" onClick={() => setMode('view')}>Voltar</button>
        <button className="btn btn--danger" onClick={() => { setStatus(a.id, 'cancelado', reason); toast('Consulta cancelada · horário liberado'); setMode('view') }}>Cancelar consulta</button>
      </>}>
        <label className="field">
          <span>Motivo</span>
          <select value={reason} onChange={e => setReason(e.target.value)}>
            {['Pedido do paciente', 'Ausência do profissional', 'Convênio não autorizou', 'Horário duplicado', 'Outro motivo'].map(r => <option key={r}>{r}</option>)}
          </select>
        </label>
        <p className="muted small" style={{ marginTop: '.75rem' }}>O paciente recebe um aviso com a opção de remarcar.</p>
      </Modal>
    )
  }

  const editable = !['concluido', 'cancelado', 'faltou'].includes(a.status)
  return (
    <Modal open onClose={close} wide eyebrow={`${specialtyById(a.specialtyId).name} · ${a.type === 'primeira' ? 'Primeira consulta' : 'Retorno'}`} title={<>{a.time} · <em>{fmtLong(a.date)}</em></>} footer={editable ? <>
      <button className="btn btn--ghost btn--danger-text" onClick={() => setMode('cancel')}>Cancelar</button>
      {a.status !== 'atendimento' && a.date >= todayISO() && <button className="btn btn--ghost" onClick={() => setMode('move')}><CalendarClock size={16} /> Remarcar</button>}
      {next && <button className="btn btn--primary" onClick={() => act(next.to, next.toast)}>{next.label}</button>}
    </> : undefined}>
      <div className="panel">
        <div className="panel__patient">
          <Avatar name={p.name} size={52} tone="wine" />
          <div className="grow">
            <p className="panel__name">{p.name}</p>
            <p className="muted small">{ageFrom(p.birth)} anos · {p.insurance}{p.card ? ` · ${p.card}` : ''}</p>
            {p.tags && p.tags.length > 0 && <p className="tags">{p.tags.map(t => <span key={t} className="chip">{t}</span>)}</p>}
          </div>
          <div className="panel__contact">
            <a className="icon-btn icon-btn--soft" href={`tel:${p.phone.replace(/\D/g, '')}`} aria-label="Ligar"><Phone size={18} /></a>
            <a className="icon-btn icon-btn--soft" href={`https://wa.me/55${p.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={18} /></a>
            {onPatient && <button className="icon-btn icon-btn--soft" onClick={() => onPatient(p.id)} aria-label="Ficha do paciente"><UserRound size={18} /></button>}
          </div>
        </div>

        <dl className="panel__grid">
          <div><dt>Status</dt><dd><StatusBadge status={a.status} /></dd></div>
          <div><dt>Profissional</dt><dd>{doc.short}</dd></div>
          <div><dt>Atendimento</dt><dd>{a.insurance}</dd></div>
          <div><dt>Origem</dt><dd>{ORIGIN[a.origin]} · {a.createdAt.slice(8)}/{a.createdAt.slice(5, 7)}</dd></div>
        </dl>

        {editable && (
          <div className="status-row" role="group" aria-label="Alterar status">
            {(['pendente', 'confirmado', 'chegou', 'atendimento', 'concluido', 'faltou'] as Status[]).map(s => (
              <button key={s} className={`status-chip${a.status === s ? ' is-on' : ''}`} onClick={() => act(s, `Status: ${STATUS[s].label}`)}>{STATUS[s].label}</button>
            ))}
          </div>
        )}

        {a.precheck ? (
          <div className="precheck">
            <p className="precheck__title"><ClipboardCheck size={16} /> Pré-consulta respondida</p>
            <p><b>Sintomas:</b> {a.precheck.symptoms}</p>
            {a.precheck.meds && <p><b>Medicamentos:</b> {a.precheck.meds}</p>}
            <p><b>Dor:</b> {a.precheck.pain}/10 · {a.precheck.exams ? 'Trará exames' : 'Sem exames'}</p>
          </div>
        ) : editable && <p className="note">Pré-consulta ainda não respondida pelo paciente.</p>}

        {a.cancelReason && a.status === 'cancelado' && <p className="note">Motivo do cancelamento: {a.cancelReason}</p>}

        <label className="field">
          <span>Observações internas</span>
          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Visível só para a equipe" />
        </label>
      </div>
    </Modal>
  )
}
