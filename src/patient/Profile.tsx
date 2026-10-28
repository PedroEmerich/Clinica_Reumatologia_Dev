import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useToast } from '../components/Toast'
import { Avatar, PageHead } from '../components/ui'
import { INSURANCES } from '../data/clinic'
import { DEMO_PATIENT_ID } from '../data/seed'
import { ageFrom, fmtNum } from '../lib/date'
import { useStore } from '../lib/store'

export function Profile() {
  const { patient, updatePatient } = useStore()
  const me = patient(DEMO_PATIENT_ID)
  const toast = useToast()
  const nav = useNavigate()
  const [form, setForm] = useState({ phone: me.phone, email: me.email, insurance: me.insurance, card: me.card ?? '' })
  const [prefs, setPrefs] = useState({ whats: true, email: true, d1: true, h2: false })

  return (
    <div className="stack">
      <PageHead index="03" eyebrow="Minha conta" title={<>Meu <em>perfil</em></>} />
      <div className="profile-head card">
        <Avatar name={me.name} size={64} tone="red" />
        <div>
          <p className="profile-head__name">{me.name}</p>
          <p className="muted small">{ageFrom(me.birth)} anos · nascimento {fmtNum(me.birth)} · CPF {me.cpf}</p>
          <p className="muted small">Paciente desde {me.since.slice(0, 4)}</p>
        </div>
      </div>

      <div className="two-col">
        <form className="card form-grid" onSubmit={e => { e.preventDefault(); updatePatient(me.id, { ...form, card: form.card || undefined }); toast('Dados atualizados') }}>
          <h2 className="card__title span-2">Contato e <em>convênio</em></h2>
          <label className="field"><span>Celular / WhatsApp</span><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
          <label className="field"><span>E-mail</span><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label className="field"><span>Convênio</span>
            <select value={form.insurance} onChange={e => setForm({ ...form, insurance: e.target.value })}>{INSURANCES.map(i => <option key={i}>{i}</option>)}</select>
          </label>
          <label className="field"><span>Nº da carteirinha</span><input value={form.card} disabled={form.insurance === 'Particular'} onChange={e => setForm({ ...form, card: e.target.value })} /></label>
          <div className="span-2"><button className="btn btn--primary">Salvar alterações</button></div>
        </form>

        <section className="card">
          <h2 className="card__title">Lembretes</h2>
          <p className="muted small">Como você quer ser avisado sobre suas consultas.</p>
          <ul className="toggles">
            {([
              ['whats', 'Pelo WhatsApp'],
              ['email', 'Por e-mail'],
              ['d1', 'Um dia antes da consulta'],
              ['h2', 'Duas horas antes'],
            ] as const).map(([k, l]) => (
              <li key={k}>
                <span>{l}</span>
                <button role="switch" aria-checked={prefs[k]} className={`switch${prefs[k] ? ' is-on' : ''}`} onClick={() => { setPrefs(p => ({ ...p, [k]: !p[k] })); toast('Preferência salva', 'info') }}><i /></button>
              </li>
            ))}
          </ul>
          <button className="btn btn--ghost btn--sm" onClick={() => nav('/')}><LogOut size={16} /> Sair do portal</button>
        </section>
      </div>
    </div>
  )
}
