import { useState } from 'react'
import { Check, Pencil, UserPlus, X } from 'lucide-react'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { Avatar, PageHead } from '../components/ui'
import { specialtyById } from '../data/clinic'
import type { StaffRole, StaffUser } from '../data/types'
import { fmtNum } from '../lib/date'
import { ROLES, type StaffPage } from '../lib/roles'
import { useStore } from '../lib/store'

const PAGE_LABEL: Record<StaffPage, string> = {
  painel: 'Painel do dia', agenda: 'Agenda', solicitacoes: 'Solicitações', pacientes: 'Pacientes', profissionais: 'Profissionais e horários', relatorios: 'Relatórios', usuarios: 'Usuários da equipe',
}
const ROLE_ORDER: StaffRole[] = ['recepcao', 'medico', 'gestao']
const EMPTY = { name: '', email: '', role: 'recepcao' as StaffRole, doctorId: '' }

export function Users() {
  const { db, me, addStaff, updateStaff } = useStore()
  const toast = useToast()
  const [editing, setEditing] = useState<StaffUser | 'novo' | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const open = (u: StaffUser | 'novo') => {
    setEditing(u)
    setError('')
    setForm(u === 'novo' ? EMPTY : { name: u.name, email: u.email, role: u.role, doctorId: u.doctorId ?? '' })
  }

  // Profissionais que ainda não têm login vinculado
  const freeDoctors = db.doctors.filter(d => !d.inactive && !db.staff.some(u => u.doctorId === d.id && (editing === 'novo' || u.id !== editing?.id)))

  const save = () => {
    const email = form.email.trim().toLowerCase()
    if (db.staff.some(u => u.email === email && (editing === 'novo' || u.id !== editing?.id))) { setError('Já existe um usuário com este e-mail.'); return }
    if (form.role === 'medico' && !form.doctorId) { setError('Escolha o profissional vinculado a este login.'); return }
    const data = { name: form.name.trim(), email, role: form.role, doctorId: form.role === 'medico' ? form.doctorId : undefined }
    if (editing === 'novo') {
      addStaff(data)
      toast(`${data.name.split(' ')[0]} cadastrado(a) · senha provisória enviada por e-mail`)
    } else if (editing) {
      updateStaff(editing.id, data)
      toast('Usuário atualizado')
    }
    setEditing(null)
  }

  return (
    <div className="stack">
      <PageHead index="06" eyebrow="Acessos" title={<>Usuários da <em>equipe</em></>}>
        <button className="btn btn--primary" onClick={() => open('novo')}><UserPlus size={18} /> Novo usuário</button>
      </PageHead>
      <p className="muted lead">Cada pessoa entra só com e-mail e senha. O cargo definido aqui decide o que ela vê depois do login.</p>

      <div className="table-wrap card card--flush">
        <table className="table">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Cargo</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {db.staff.map(u => {
              const doc = u.doctorId ? db.doctors.find(d => d.id === u.doctorId) : null
              const self = u.id === me?.id
              return (
                <tr key={u.id} className={u.active ? '' : 'is-off'} onClick={() => open(u)} tabIndex={0} onKeyDown={e => e.key === 'Enter' && open(u)}>
                  <td data-label="Nome"><span className="cell-who"><Avatar name={u.name} size={34} /><span><b>{u.name}{self && <small className="muted"> (você)</small>}</b><small>{doc ? `${specialtyById(doc.specialtyId).name} · ${doc.council}` : `Desde ${fmtNum(u.createdAt)}`}</small></span></span></td>
                  <td data-label="E-mail">{u.email}</td>
                  <td data-label="Cargo"><span className={`role-chip role-chip--${u.role}`}>{ROLES[u.role].label}</span></td>
                  <td data-label="Situação">{u.active ? 'Ativo' : 'Desativado'}</td>
                  <td data-label="">
                    <span className="queue__act" onClick={e => e.stopPropagation()}>
                      <button className="icon-btn" onClick={() => open(u)} aria-label={`Editar ${u.name}`}><Pencil size={16} /></button>
                      {!self && (
                        <button className="btn btn--sm btn--ghost" onClick={() => { updateStaff(u.id, { active: !u.active }); toast(u.active ? `Acesso de ${u.name.split(' ')[0]} desativado` : `Acesso de ${u.name.split(' ')[0]} reativado`, 'info') }}>
                          {u.active ? <><X size={14} /> Desativar</> : <><Check size={14} /> Reativar</>}
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <section>
        <p className="eyebrow">O que cada cargo vê</p>
        <div className="perm-grid">
          {ROLE_ORDER.map(r => (
            <div key={r} className="card perm">
              <span className={`role-chip role-chip--${r}`}>{ROLES[r].label}</span>
              <p className="muted small">{ROLES[r].desc}</p>
              <ul>
                {(Object.keys(PAGE_LABEL) as StaffPage[]).map(p => (
                  <li key={p} className={ROLES[r].pages.includes(p) ? '' : 'no'}>{ROLES[r].pages.includes(p) ? <Check size={14} /> : <X size={14} />} {PAGE_LABEL[p]}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Modal open={!!editing} onClose={() => setEditing(null)} eyebrow="Acessos" title={editing === 'novo' ? <>Novo <em>usuário</em></> : <>Editar <em>usuário</em></>} footer={<>
        <button className="btn btn--ghost" onClick={() => setEditing(null)}>Cancelar</button>
        <button className="btn btn--primary" form="staff-form">{editing === 'novo' ? 'Cadastrar' : 'Salvar'}</button>
      </>}>
        <form id="staff-form" className="form-grid" onSubmit={e => { e.preventDefault(); save() }}>
          <label className="field span-2"><span>Nome completo</span><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field span-2"><span>E-mail de acesso</span><input required type="email" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setError('') }} placeholder="nome@creass.com.br" /></label>
          <div className="field span-2">
            <span>Cargo</span>
            <div className="role-pick">
              {ROLE_ORDER.map(r => (
                <button key={r} type="button" className={`role-pick__opt${form.role === r ? ' is-on' : ''}`} onClick={() => { setForm({ ...form, role: r }); setError('') }} disabled={editing !== 'novo' && editing?.id === me?.id}>
                  <b>{ROLES[r].label}</b><small>{ROLES[r].desc}</small>
                </button>
              ))}
            </div>
          </div>
          {form.role === 'medico' && (
            <label className="field span-2"><span>Profissional vinculado</span>
              <select value={form.doctorId} onChange={e => { setForm({ ...form, doctorId: e.target.value }); setError('') }}>
                <option value="">Escolha</option>
                {freeDoctors.map(d => <option key={d.id} value={d.id}>{d.name} · {specialtyById(d.specialtyId).name}</option>)}
              </select>
            </label>
          )}
          {error && <p className="form-error span-2" role="alert">{error}</p>}
          {editing === 'novo' && <p className="muted small span-2">Na versão final, a pessoa recebe por e-mail um link para criar a própria senha. Na demonstração, a senha é <code>demonstracao</code>.</p>}
        </form>
      </Modal>
    </div>
  )
}
