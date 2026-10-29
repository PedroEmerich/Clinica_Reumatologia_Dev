import { useState } from 'react'
import { CalendarOff, Pencil, Power, UserPlus, X } from 'lucide-react'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { Avatar, PageHead } from '../components/ui'
import { SPECIALTIES, specialtyById } from '../data/clinic'
import type { Doctor, Weekday } from '../data/types'
import { fmtNum, minToTime, todayISO, weekdayShort } from '../lib/date'
import { useStore } from '../lib/store'

const DAYS: Weekday[] = [1, 2, 3, 4, 5]
const TIMES = Array.from({ length: 21 }, (_, i) => 420 + i * 30) // 7h às 17h
const SLOTS = [20, 30, 40, 45, 60]
const PREFIXES = ['Dra.', 'Dr.', '']

export function Team() {
  const { db, me } = useStore()
  const ownDoc = me?.role === 'medico' ? me.doctorId : undefined
  const manager = me?.role === 'gestao'
  const [editing, setEditing] = useState<Doctor | 'novo' | null>(null)
  const list = db.doctors.filter(d => !ownDoc || d.id === ownDoc).sort((a, b) => Number(!!a.inactive) - Number(!!b.inactive))

  return (
    <div className="stack">
      <PageHead index="05" eyebrow="Corpo clínico" title={ownDoc ? <>Meus <em>horários</em></> : <>Profissionais e <em>horários</em></>}>
        {manager && <button className="btn btn--primary" onClick={() => setEditing('novo')}><UserPlus size={18} /> Novo profissional</button>}
      </PageHead>
      <p className="muted lead">Os dias, horários e bloqueios definidos aqui mudam na hora os horários que o paciente vê no portal.</p>
      <div className="team-grid">{list.map(d => <DoctorCard key={d.id} d={d} manager={manager} onEdit={() => setEditing(d)} />)}</div>
      <DoctorForm editing={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function DoctorCard({ d, manager, onEdit }: { d: Doctor; manager: boolean; onEdit: () => void }) {
  const { updateDoctor, db } = useStore()
  const toast = useToast()
  const [block, setBlock] = useState('')
  const login = db.staff.find(u => u.doctorId === d.id)

  const setDay = (wd: Weekday, range: [number, number] | null) => {
    const schedule = { ...d.schedule }
    if (range) schedule[wd] = range
    else delete schedule[wd]
    updateDoctor(d.id, { schedule })
  }

  return (
    <section className={`card doctor${d.inactive ? ' doctor--off' : ''}`}>
      <header className="doctor__head">
        <Avatar name={d.name} size={52} tone="wine" />
        <div className="grow">
          <p className="doctor__name">{d.name}</p>
          <p className="muted small">{specialtyById(d.specialtyId).name} · {d.council}</p>
          <p className="tags">
            {d.inactive && <span className="chip">Desativado</span>}
            {d.sample && <span className="chip chip--soft">Profissional de exemplo</span>}
            {manager && <span className="chip">{login ? `Acesso: ${login.email}` : 'Sem acesso ao sistema'}</span>}
          </p>
        </div>
        {manager && <button className="icon-btn" onClick={onEdit} aria-label={`Editar ${d.name}`}><Pencil size={17} /></button>}
      </header>

      {d.inactive ? (
        <p className="note">Não aparece para agendamento. O histórico de consultas continua disponível.</p>
      ) : (
        <>
          <div className="week-edit">
            {DAYS.map(wd => {
              const r = d.schedule[wd]
              return (
                <div key={wd} className={`week-edit__row${r ? ' is-on' : ''}`}>
                  <label className="check">
                    <input type="checkbox" checked={!!r} onChange={e => { setDay(wd, e.target.checked ? [480, 1020] : null); toast('Horário atualizado', 'info') }} />
                    <span>{weekdayShort(wd)}</span>
                  </label>
                  {r ? (
                    <span className="week-edit__times">
                      <select value={r[0]} onChange={e => setDay(wd, [+e.target.value, Math.max(r[1], +e.target.value + 60)])} aria-label="Início">
                        {TIMES.map(t => <option key={t} value={t}>{minToTime(t)}</option>)}
                      </select>
                      <span>às</span>
                      <select value={r[1]} onChange={e => setDay(wd, [r[0], +e.target.value])} aria-label="Fim">
                        {TIMES.filter(t => t > r[0]).map(t => <option key={t} value={t}>{minToTime(t)}</option>)}
                      </select>
                    </span>
                  ) : <span className="muted small">Não atende</span>}
                </div>
              )
            })}
          </div>

          <label className="field field--inline">
            <span>Duração da consulta</span>
            <select value={d.slot} onChange={e => { updateDoctor(d.id, { slot: +e.target.value }); toast('Duração atualizada', 'info') }}>
              {SLOTS.map(m => <option key={m} value={m}>{m} min</option>)}
            </select>
          </label>

          <div className="field">
            <span>Bloqueios (férias, congressos)</span>
            <form className="inline-form" onSubmit={e => {
              e.preventDefault()
              if (!block || d.blocked.includes(block)) return
              updateDoctor(d.id, { blocked: [...d.blocked, block].sort() })
              toast(`Agenda de ${d.short} bloqueada em ${fmtNum(block)}`)
              setBlock('')
            }}>
              <input type="date" min={todayISO()} value={block} onChange={e => setBlock(e.target.value)} aria-label="Data do bloqueio" />
              <button className="btn btn--sm btn--ghost"><CalendarOff size={16} /> Bloquear</button>
            </form>
            {d.blocked.length > 0 && (
              <p className="tags">
                {d.blocked.map(b => (
                  <span key={b} className="chip chip--red">{fmtNum(b)}
                    <button onClick={() => updateDoctor(d.id, { blocked: d.blocked.filter(x => x !== b) })} aria-label={`Remover bloqueio de ${fmtNum(b)}`}><X size={12} /></button>
                  </span>
                ))}
              </p>
            )}
          </div>
          <p className="muted small">{Object.keys(d.schedule).length} dia(s) por semana · {Object.values(d.schedule).reduce((s, r) => s + Math.floor((r![1] - r![0] - (r![0] < 780 && r![1] > 720 ? 60 : 0)) / d.slot), 0)} consultas/semana</p>
        </>
      )}
    </section>
  )
}

const EMPTY = { prefix: 'Dra.', name: '', specialtyId: 'reumato', council: '', title: '', slot: 30, days: [1, 2, 3, 4, 5] as Weekday[], start: 480, end: 1020, access: true, email: '' }

function DoctorForm({ editing, onClose }: { editing: Doctor | 'novo' | null; onClose: () => void }) {
  const { db, addDoctor, updateDoctor, addStaff } = useStore()
  const toast = useToast()
  const [f, setF] = useState(EMPTY)
  const [error, setError] = useState('')
  const [key, setKey] = useState<string | null>(null)
  const isNew = editing === 'novo'

  // Preenche o formulário quando abre
  const k = editing === null ? null : isNew ? 'novo' : editing.id
  if (k !== key) {
    setKey(k)
    setError('')
    if (editing && !isNew) {
      const prefix = PREFIXES.find(p => p && editing.name.startsWith(p + ' ')) ?? ''
      setF({ ...EMPTY, prefix, name: prefix ? editing.name.slice(prefix.length + 1) : editing.name, specialtyId: editing.specialtyId, council: editing.council, title: editing.title, slot: editing.slot, access: false })
    } else setF(EMPTY)
  }

  const save = () => {
    const name = f.name.trim()
    const full = f.prefix ? `${f.prefix} ${name}` : name
    const parts = name.split(/\s+/)
    const short = f.prefix ? `${f.prefix} ${parts[0]}` : parts[0]
    const initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
    const title = f.title.trim() || specialtyById(f.specialtyId).name
    const email = f.email.trim().toLowerCase()
    if (isNew && f.access && db.staff.some(u => u.email === email)) { setError('Já existe um usuário com este e-mail.'); return }
    if (isNew && !f.days.length) { setError('Escolha pelo menos um dia de atendimento.'); return }

    if (isNew) {
      const schedule: Doctor['schedule'] = {}
      for (const d of f.days) schedule[d] = [d === 5 ? Math.max(f.start, 510) : f.start, f.end]
      const doc = addDoctor({ name: full, short, initials, title, council: f.council.trim() || 'Registro a informar', specialtyId: f.specialtyId, schedule, slot: f.slot })
      if (f.access && email) addStaff({ name: full, email, role: 'medico', doctorId: doc.id })
      toast(`${short} cadastrado(a)${f.access && email ? ' · acesso criado' : ''}. Já aparece no agendamento.`)
    } else if (editing) {
      updateDoctor(editing.id, { name: full, short, initials, title, council: f.council.trim(), specialtyId: f.specialtyId, slot: f.slot })
      toast('Dados do profissional atualizados')
    }
    onClose()
  }

  const doc = editing && !isNew ? editing : null
  return (
    <Modal open={!!editing} onClose={onClose} wide eyebrow="Corpo clínico" title={isNew ? <>Novo <em>profissional</em></> : <>Editar <em>profissional</em></>} footer={<>
      {doc && (
        <button className="btn btn--ghost btn--danger-text" onClick={() => { updateDoctor(doc.id, { inactive: !doc.inactive }); toast(doc.inactive ? `${doc.short} reativado(a)` : `${doc.short} desativado(a) · não aparece mais para agendamento`, 'info'); onClose() }}>
          <Power size={16} /> {doc.inactive ? 'Reativar' : 'Desativar'}
        </button>
      )}
      <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn--primary" form="doc-form">{isNew ? 'Cadastrar' : 'Salvar'}</button>
    </>}>
      <form id="doc-form" className="form-grid" onSubmit={e => { e.preventDefault(); save() }}>
        <label className="field"><span>Tratamento</span>
          <select value={f.prefix} onChange={e => setF({ ...f, prefix: e.target.value })}>
            {PREFIXES.map(p => <option key={p} value={p}>{p || 'Sem tratamento'}</option>)}
          </select>
        </label>
        <label className="field"><span>Nome completo</span><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Ex.: Paula Nogueira" /></label>
        <label className="field"><span>Especialidade</span>
          <select value={f.specialtyId} onChange={e => setF({ ...f, specialtyId: e.target.value })}>
            {SPECIALTIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="field"><span>Registro profissional</span><input value={f.council} onChange={e => setF({ ...f, council: e.target.value })} placeholder="Ex.: CRM-SP 123456 · RQE 7890" /></label>
        <label className="field"><span>Descrição <small>(aparece para o paciente)</small></span><input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder={`Ex.: ${specialtyById(f.specialtyId).name.replace(/ia$/, 'ista')}`} /></label>
        <label className="field"><span>Duração da consulta</span>
          <select value={f.slot} onChange={e => setF({ ...f, slot: +e.target.value })}>{SLOTS.map(m => <option key={m} value={m}>{m} min</option>)}</select>
        </label>

        {isNew && (
          <>
            <div className="field span-2">
              <span>Dias de atendimento</span>
              <div className="day-pick">
                {DAYS.map(d => (
                  <button key={d} type="button" className={f.days.includes(d) ? 'is-on' : ''} aria-pressed={f.days.includes(d)}
                    onClick={() => setF({ ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d].sort() as Weekday[] })}>
                    {weekdayShort(d)}
                  </button>
                ))}
              </div>
            </div>
            <label className="field"><span>Das</span>
              <select value={f.start} onChange={e => setF({ ...f, start: +e.target.value, end: Math.max(f.end, +e.target.value + 60) })}>{TIMES.map(t => <option key={t} value={t}>{minToTime(t)}</option>)}</select>
            </label>
            <label className="field"><span>Até</span>
              <select value={f.end} onChange={e => setF({ ...f, end: +e.target.value })}>{TIMES.filter(t => t > f.start).map(t => <option key={t} value={t}>{minToTime(t)}</option>)}</select>
            </label>
            <p className="muted small span-2">Depois do cadastro, dá para ajustar o horário de cada dia e os bloqueios no cartão do profissional.</p>

            <label className="check span-2">
              <input type="checkbox" checked={f.access} onChange={e => setF({ ...f, access: e.target.checked })} />
              <span>Criar acesso ao sistema (cargo Corpo clínico, vê só a própria agenda)</span>
            </label>
            {f.access && <label className="field span-2"><span>E-mail de acesso</span><input type="email" required value={f.email} onChange={e => { setF({ ...f, email: e.target.value }); setError('') }} placeholder="nome@creass.com.br" /></label>}
          </>
        )}
        {error && <p className="form-error span-2" role="alert">{error}</p>}
      </form>
    </Modal>
  )
}
