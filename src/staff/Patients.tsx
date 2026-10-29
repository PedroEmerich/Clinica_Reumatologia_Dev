import { useMemo, useState } from 'react'
import { CalendarPlus, Search, UserPlus, Users } from 'lucide-react'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { Avatar, Empty, PageHead, StatusBadge } from '../components/ui'
import { INSURANCES, specialtyById } from '../data/clinic'
import { ageFrom, fmtNum, todayISO } from '../lib/date'
import { useStore } from '../lib/store'
import { AppointmentPanel } from './AppointmentPanel'
import { NewAppointment } from './NewAppointment'

export function Patients() {
  const { db, doctor, addPatient, me } = useStore()
  const ownDoc = me?.role === 'medico' ? me.doctorId : undefined
  const toast = useToast()
  const [q, setQ] = useState('')
  const [ins, setIns] = useState('todos')
  const [openId, setOpenId] = useState<string | null>(null)
  const [apptId, setApptId] = useState<string | null>(null)
  const [bookFor, setBookFor] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [np, setNp] = useState({ name: '', phone: '', email: '', cpf: '', birth: '', insurance: 'Particular' })
  const today = todayISO()

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return db.patients
      .filter(p => !ownDoc || db.appointments.some(a => a.patientId === p.id && a.doctorId === ownDoc))
      .filter(p => (ins === 'todos' || p.insurance === ins) && (!s || p.name.toLowerCase().includes(s) || p.cpf.includes(s) || p.phone.includes(s)))
      .map(p => {
        const appts = db.appointments.filter(a => a.patientId === p.id)
        const last = [...appts].reverse().find(a => a.date < today && a.status === 'concluido')
        const next = appts.find(a => a.date >= today && ['pendente', 'confirmado'].includes(a.status))
        return { p, last, next, total: appts.filter(a => a.status === 'concluido').length }
      })
      .sort((a, b) => a.p.name.localeCompare(b.p.name))
  }, [db, q, ins, today, ownDoc])

  const sel = openId ? db.patients.find(p => p.id === openId) : null
  const history = sel ? db.appointments.filter(a => a.patientId === sel.id).slice().reverse() : []

  return (
    <div className="stack">
      <PageHead index="04" eyebrow="Cadastro" title={ownDoc ? <>Meus <em>pacientes</em></> : <><em>Pacientes</em></>}>
        <button className="btn btn--primary" onClick={() => setCreating(true)}><UserPlus size={18} /> Novo paciente</button>
      </PageHead>

      <div className="toolbar">
        <span className="field__wrap search"><Search size={16} className="field__lead" /><input placeholder="Buscar por nome, CPF ou telefone" value={q} onChange={e => setQ(e.target.value)} /></span>
        <select className="select-sm" value={ins} onChange={e => setIns(e.target.value)} aria-label="Convênio">
          <option value="todos">Todos os convênios</option>
          {INSURANCES.map(i => <option key={i}>{i}</option>)}
        </select>
      </div>

      {rows.length === 0 ? <Empty icon={<Users />} title="Nenhum paciente encontrado." /> : (
        <div className="table-wrap card card--flush">
          <table className="table">
            <thead><tr><th>Paciente</th><th>Contato</th><th>Convênio</th><th>Última consulta</th><th>Próxima</th></tr></thead>
            <tbody>
              {rows.map(({ p, last, next, total }) => (
                <tr key={p.id} onClick={() => setOpenId(p.id)} tabIndex={0} onKeyDown={e => e.key === 'Enter' && setOpenId(p.id)}>
                  <td data-label="Paciente"><span className="cell-who"><Avatar name={p.name} size={34} /><span><b>{p.name}</b><small>{ageFrom(p.birth)} anos · {total} consulta{total === 1 ? '' : 's'}</small></span></span></td>
                  <td data-label="Contato">{p.phone}</td>
                  <td data-label="Convênio">{p.insurance}</td>
                  <td data-label="Última">{last ? `${fmtNum(last.date)} · ${doctor(last.doctorId).short}` : '—'}</td>
                  <td data-label="Próxima">{next ? <span className="chip chip--soft">{fmtNum(next.date)} · {next.time}</span> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!sel} onClose={() => setOpenId(null)} wide eyebrow="Ficha do paciente" title={sel?.name ?? ''} footer={sel && <button className="btn btn--primary" onClick={() => { setBookFor(sel.id) }}><CalendarPlus size={16} /> Agendar consulta</button>}>
        {sel && (
          <div className="stack">
            <dl className="panel__grid panel__grid--3">
              <div><dt>Idade</dt><dd>{ageFrom(sel.birth)} anos · {fmtNum(sel.birth)}</dd></div>
              <div><dt>CPF</dt><dd>{sel.cpf}</dd></div>
              <div><dt>Celular</dt><dd>{sel.phone}</dd></div>
              <div><dt>E-mail</dt><dd>{sel.email || '—'}</dd></div>
              <div><dt>Convênio</dt><dd>{sel.insurance}{sel.card ? ` · ${sel.card}` : ''}</dd></div>
              <div><dt>Paciente desde</dt><dd>{fmtNum(sel.since)}</dd></div>
            </dl>
            {sel.tags && sel.tags.length > 0 && <p className="tags">{sel.tags.map(t => <span key={t} className="chip">{t}</span>)}</p>}
            {sel.notes && <p className="note">{sel.notes}</p>}
            <div>
              <p className="eyebrow">Histórico de consultas</p>
              {history.length === 0 ? <p className="muted">Sem consultas registradas.</p> : (
                <ul className="history">
                  {history.map(a => (
                    <li key={a.id}>
                      <button onClick={() => setApptId(a.id)}>
                        <span className="history__date">{fmtNum(a.date)} · {a.time}</span>
                        <span className="grow">{specialtyById(a.specialtyId).name} · {doctor(a.doctorId).short}</span>
                        <StatusBadge status={a.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={creating} onClose={() => setCreating(false)} eyebrow="Cadastro" title={<>Novo <em>paciente</em></>} footer={<>
        <button className="btn btn--ghost" onClick={() => setCreating(false)}>Cancelar</button>
        <button className="btn btn--primary" form="np">Cadastrar</button>
      </>}>
        <form id="np" className="form-grid" onSubmit={e => {
          e.preventDefault()
          const p = addPatient({ ...np, birth: np.birth || '1980-01-01' })
          toast(`${p.name} cadastrado(a)`)
          setCreating(false)
          setNp({ name: '', phone: '', email: '', cpf: '', birth: '', insurance: 'Particular' })
          setOpenId(p.id)
        }}>
          <label className="field span-2"><span>Nome completo</span><input required value={np.name} onChange={e => setNp({ ...np, name: e.target.value })} /></label>
          <label className="field"><span>CPF</span><input value={np.cpf} onChange={e => setNp({ ...np, cpf: e.target.value })} /></label>
          <label className="field"><span>Nascimento</span><input type="date" value={np.birth} onChange={e => setNp({ ...np, birth: e.target.value })} /></label>
          <label className="field"><span>Celular</span><input required value={np.phone} onChange={e => setNp({ ...np, phone: e.target.value })} /></label>
          <label className="field"><span>E-mail</span><input type="email" value={np.email} onChange={e => setNp({ ...np, email: e.target.value })} /></label>
          <label className="field span-2"><span>Convênio</span><select value={np.insurance} onChange={e => setNp({ ...np, insurance: e.target.value })}>{INSURANCES.map(i => <option key={i}>{i}</option>)}</select></label>
        </form>
      </Modal>

      <AppointmentPanel id={apptId} onClose={() => setApptId(null)} />
      <NewAppointment open={!!bookFor} onClose={() => setBookFor(null)} prefill={bookFor ? { patientId: bookFor } : undefined} />
    </div>
  )
}
