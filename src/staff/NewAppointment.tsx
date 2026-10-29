import { useEffect, useMemo, useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { Avatar } from '../components/ui'
import { INSURANCES, SPECIALTIES } from '../data/clinic'
import type { VisitType } from '../data/types'
import { fmtLong, todayISO } from '../lib/date'
import { useStore } from '../lib/store'

export interface Prefill { doctorId?: string; date?: string; time?: string; patientId?: string }

export function NewAppointment({ open, onClose, prefill }: { open: boolean; onClose: () => void; prefill?: Prefill }) {
  const { db, doctor, patient, freeSlots, book, addPatient, me } = useStore()
  const ownDoc = me?.role === 'medico' ? me.doctorId : undefined
  const toast = useToast()
  const [q, setQ] = useState('')
  const [patientId, setPatientId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [np, setNp] = useState({ name: '', phone: '', cpf: '', birth: '' })
  const [specId, setSpecId] = useState('reumato')
  const [docId, setDocId] = useState('d1')
  const [date, setDate] = useState(todayISO())
  const [time, setTime] = useState('')
  const [type, setType] = useState<VisitType>('retorno')
  const [insurance, setInsurance] = useState('Particular')
  const [origin, setOrigin] = useState<'equipe' | 'whatsapp'>('whatsapp')

  useEffect(() => {
    if (!open) return
    const d = prefill?.doctorId ? doctor(prefill.doctorId) : ownDoc ? doctor(ownDoc) : null
    setQ(''); setCreating(false); setNp({ name: '', phone: '', cpf: '', birth: '' })
    setPatientId(prefill?.patientId ?? null)
    if (prefill?.patientId) setInsurance(patient(prefill.patientId).insurance)
    setSpecId(d?.specialtyId ?? 'reumato'); setDocId(d?.id ?? 'd1')
    setDate(prefill?.date ?? todayISO()); setTime(prefill?.time ?? '')
  }, [open])

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return db.patients.slice(0, 5)
    return db.patients.filter(p => p.name.toLowerCase().includes(s) || p.cpf.includes(s) || p.phone.includes(s)).slice(0, 6)
  }, [q, db.patients])

  const docs = db.doctors.filter(d => d.specialtyId === specId && !d.inactive)
  const slots = freeSlots(docId, date)
  const slotOptions = time && !slots.includes(time) ? [time, ...slots] : slots
  const ready = (patientId || (creating && np.name.trim())) && time

  const submit = () => {
    let pid = patientId
    if (!pid) pid = addPatient({ name: np.name.trim(), phone: np.phone, cpf: np.cpf, birth: np.birth || '1980-01-01', email: '', insurance }).id
    book({ patientId: pid, doctorId: docId, date, time, type, insurance, origin, status: 'confirmado' })
    toast(`Consulta marcada · ${fmtLong(date)} às ${time}`)
    onClose()
  }

  const chosen = patientId ? patient(patientId) : null
  return (
    <Modal open={open} onClose={onClose} wide eyebrow="Agenda" title={<>Novo <em>agendamento</em></>} footer={<>
      <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn--primary" disabled={!ready} onClick={submit}>Agendar</button>
    </>}>
      <div className="form-grid">
        <div className="field span-2">
          <span>Paciente</span>
          {chosen ? (
            <div className="picked">
              <Avatar name={chosen.name} size={36} />
              <span className="grow"><b>{chosen.name}</b><small className="muted"> · {chosen.phone} · {chosen.insurance}</small></span>
              <button className="link" onClick={() => setPatientId(null)}>Trocar</button>
            </div>
          ) : creating ? (
            <div className="form-grid form-grid--inner">
              <input placeholder="Nome completo" value={np.name} onChange={e => setNp({ ...np, name: e.target.value })} autoFocus />
              <input placeholder="Celular" value={np.phone} onChange={e => setNp({ ...np, phone: e.target.value })} />
              <input placeholder="CPF" value={np.cpf} onChange={e => setNp({ ...np, cpf: e.target.value })} />
              <input type="date" aria-label="Nascimento" value={np.birth} onChange={e => setNp({ ...np, birth: e.target.value })} />
              <button className="link span-2" onClick={() => setCreating(false)}>Buscar paciente cadastrado</button>
            </div>
          ) : (
            <div className="search-pick">
              <span className="field__wrap"><Search size={16} className="field__lead" /><input placeholder="Buscar por nome, CPF ou telefone" value={q} onChange={e => setQ(e.target.value)} autoFocus /></span>
              <ul>
                {matches.map(p => (
                  <li key={p.id}><button onClick={() => { setPatientId(p.id); setInsurance(p.insurance) }}><Avatar name={p.name} size={28} /><span>{p.name}</span><small>{p.phone}</small></button></li>
                ))}
                <li><button className="search-pick__new" onClick={() => { setCreating(true); setNp(n => ({ ...n, name: q })) }}><UserPlus size={16} /> Cadastrar novo paciente{q && ` "${q}"`}</button></li>
              </ul>
            </div>
          )}
        </div>

        <label className="field"><span>Especialidade</span>
          <select value={specId} disabled={!!ownDoc} onChange={e => { setSpecId(e.target.value); const d = db.doctors.find(x => x.specialtyId === e.target.value && !x.inactive); if (d) setDocId(d.id); setTime('') }}>
            {SPECIALTIES.filter(s => db.doctors.some(d => d.specialtyId === s.id && !d.inactive)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="field"><span>Profissional</span>
          <select value={docId} disabled={!!ownDoc} onChange={e => { setDocId(e.target.value); setTime('') }}>{docs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        </label>
        <label className="field"><span>Data</span><input type="date" value={date} min={todayISO()} onChange={e => { setDate(e.target.value); setTime('') }} /></label>
        <label className="field"><span>Horário</span>
          <select value={time} onChange={e => setTime(e.target.value)}>
            <option value="">{slotOptions.length ? 'Escolha' : 'Sem horários livres'}</option>
            {slotOptions.map(t => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="field"><span>Tipo</span>
          <select value={type} onChange={e => setType(e.target.value as VisitType)}><option value="primeira">Primeira consulta</option><option value="retorno">Retorno</option></select>
        </label>
        <label className="field"><span>Atendimento</span>
          <select value={insurance} onChange={e => setInsurance(e.target.value)}>{INSURANCES.map(i => <option key={i}>{i}</option>)}</select>
        </label>
        <label className="field span-2"><span>Canal do pedido</span>
          <select value={origin} onChange={e => setOrigin(e.target.value as 'equipe' | 'whatsapp')}><option value="whatsapp">WhatsApp</option><option value="equipe">Telefone / balcão</option></select>
        </label>
      </div>
    </Modal>
  )
}
