import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarPlus, Check, Clock, MessageCircle, Moon, Sun } from 'lucide-react'
import { Calendar } from '../components/Calendar'
import { useToast } from '../components/Toast'
import { Avatar } from '../components/ui'
import { INSURANCES, SPECIALTIES, specialtyById } from '../data/clinic'
import { DEMO_PATIENT_ID } from '../data/seed'
import type { Appointment, VisitType } from '../data/types'
import { addDays, fmtLong, todayISO, weekdayName } from '../lib/date'
import { downloadICS, waLink } from '../lib/ics'
import { useStore } from '../lib/store'

const STEPS = ['Especialidade', 'Profissional', 'Data e horário', 'Detalhes', 'Revisão']

export function Booking() {
  const { db, doctor, patient, freeSlots, book, reschedule } = useStore()
  const toast = useToast()
  const [params] = useSearchParams()
  const me = patient(DEMO_PATIENT_ID)
  const original = db.appointments.find(a => a.id === params.get('remarcar'))
  const presetSpec = original?.specialtyId ?? params.get('esp')

  const [step, setStep] = useState(original ? 2 : presetSpec ? 1 : 0)
  const [specId, setSpecId] = useState<string | null>(presetSpec)
  const [docId, setDocId] = useState<string | null>(original?.doctorId ?? null)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [type, setType] = useState<VisitType>(original?.type ?? 'primeira')
  const [insurance, setInsurance] = useState(original?.insurance ?? me.insurance)
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState<Appointment | null>(null)

  const today = todayISO()
  const maxDate = addDays(today, 60)
  const doctors = db.doctors.filter(d => d.specialtyId === specId)
  const slots = docId && date ? freeSlots(docId, date, original?.id) : []
  const firstFree = useMemo(() => {
    const out: Record<string, string | null> = {}
    for (const d of db.doctors) {
      out[d.id] = null
      for (let i = 0; i <= 60 && !out[d.id]; i++) {
        const iso = addDays(today, i)
        const s = freeSlots(d.id, iso)
        if (s.length) out[d.id] = `${fmtLong(iso).split(',')[0]}, ${iso.slice(8)}/${iso.slice(5, 7)} · ${s[0]}`
      }
    }
    return out
  }, [db, freeSlots, today])

  const canNext = [!!specId, !!docId, !!date && !!time, !!insurance, true][step]
  const go = (n: number) => {
    let s = step + n
    if (original && s === 3) s += n // remarcação não pede os detalhes de novo
    setStep(Math.max(0, Math.min(4, s)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const confirm = () => {
    if (!docId || !date || !time) return
    if (original) {
      reschedule(original.id, date, time, docId)
      toast('Consulta remarcada')
      setDone({ ...original, date, time, doctorId: docId })
    } else {
      const a = book({ patientId: me.id, doctorId: docId, date, time, type, insurance, notes: notes || undefined, origin: 'paciente' })
      toast('Solicitação enviada para a clínica')
      setDone(a)
    }
  }

  if (done) {
    const doc = doctor(done.doctorId)
    const spec = specialtyById(doc.specialtyId)
    return (
      <div className="done">
        <span className="done__icon"><Check size={34} /></span>
        <p className="eyebrow">{original ? 'Consulta remarcada' : 'Pedido enviado'}</p>
        <h1 className="page-title">{original ? <>Tudo certo, <em>até lá</em>.</> : <>Recebemos seu <em>pedido</em>.</>}</h1>
        <p className="muted done__text">
          {original
            ? 'Seu novo horário já está reservado.'
            : 'A recepção confirma o horário em instantes. Você recebe um aviso aqui no portal e no WhatsApp.'}
        </p>
        <div className="done__card">
          <p className="done__date">{fmtLong(done.date)} · <b>{done.time}</b></p>
          <p>{spec.name} com {doc.name}</p>
        </div>
        <div className="done__actions">
          <button className="btn btn--ghost" onClick={() => downloadICS({ title: `Consulta · ${spec.name} (Creass)`, date: done.date, time: done.time, duration: doc.slot, details: doc.name })}>
            <CalendarPlus size={18} /> Adicionar à agenda
          </button>
          <a className="btn btn--ghost" href={waLink(`Olá! Acabei de solicitar pelo portal uma consulta de ${spec.name} com ${doc.short} em ${fmtLong(done.date)} às ${done.time}.`)} target="_blank" rel="noreferrer">
            <MessageCircle size={18} /> Avisar no WhatsApp
          </a>
          <Link to="/paciente/consultas" className="btn btn--primary">Ver minhas consultas <ArrowRight size={18} /></Link>
        </div>
      </div>
    )
  }

  const doc = docId ? doctor(docId) : null
  const morning = slots.filter(s => s < '12:00')
  const afternoon = slots.filter(s => s >= '12:00')

  return (
    <div className="booking">
      <div className="booking__main">
        <div className="booking__head">
          {step > (original ? 2 : 0)
            ? <button className="back-link" onClick={() => go(-1)}><ArrowLeft size={16} /> Voltar</button>
            : <Link className="back-link" to="/paciente"><ArrowLeft size={16} /> Início</Link>}
          <p className="eyebrow"><span className="eyebrow__num">{String(step + 1).padStart(2, '0')}</span>{original ? 'Remarcar consulta' : 'Agendar consulta'} · {STEPS[step]}</p>
          <ol className="steps" aria-label="Etapas">
            {STEPS.map((s, i) => (original && (i < 2 || i === 3)) ? null : <li key={s} className={i < step ? 'is-done' : i === step ? 'is-on' : ''}><span>{s}</span></li>)}
          </ol>
        </div>

        {step === 0 && (
          <section>
            <h1 className="page-title">Qual <em>especialidade</em>?</h1>
            <div className="spec-grid">
              {SPECIALTIES.map((s, i) => (
                <button key={s.id} className={`spec${specId === s.id ? ' is-on' : ''}`} onClick={() => { setSpecId(s.id); setDocId(null); setDate(null); setTime(null); setStep(1) }}>
                  <span className="spec__num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="spec__name">{s.name}</span>
                  <span className="spec__desc">{s.desc}</span>
                  <ArrowRight className="spec__go" size={18} />
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <h1 className="page-title">Com <em>quem</em>?</h1>
            <div className="doc-list">
              {doctors.map(d => (
                <button key={d.id} className={`doc${docId === d.id ? ' is-on' : ''}`} onClick={() => { setDocId(d.id); setDate(null); setTime(null); setStep(2) }}>
                  <Avatar name={d.name} size={52} tone={docId === d.id ? 'red' : 'wine'} />
                  <span className="doc__body">
                    <b>{d.name}</b>
                    <span className="muted small">{d.title} · {d.council}</span>
                    <span className="doc__days">{Object.keys(d.schedule).map(k => weekdayName(addDays('2026-01-04', +k)).slice(0, 3)).join(' · ')}</span>
                  </span>
                  <span className="doc__next">
                    <small>Próximo horário</small>
                    <b>{firstFree[d.id] ?? 'Sem vagas'}</b>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && docId && (
          <section>
            <h1 className="page-title">Escolha o <em>dia</em> e o <em>horário</em></h1>
            <div className="date-time">
              <Calendar
                value={date}
                onChange={d => { setDate(d); setTime(null) }}
                minDate={today}
                maxDate={maxDate}
                availability={iso => freeSlots(docId, iso, original?.id).length}
              />
              <div className="slots">
                {!date ? (
                  <p className="slots__hint"><Clock size={18} /> Escolha um dia no calendário para ver os horários livres.</p>
                ) : (
                  <>
                    <p className="slots__day">{fmtLong(date)}</p>
                    {[['Manhã', morning, Sun], ['Tarde', afternoon, Moon]].map(([label, list, Icon]) => {
                      const L = list as string[]
                      const I = Icon as typeof Sun
                      if (!L.length) return null
                      return (
                        <div key={label as string} className="slots__group">
                          <p className="slots__label"><I size={14} /> {label as string}</p>
                          <div className="slots__grid">
                            {L.map(t => <button key={t} className={`slot${time === t ? ' is-on' : ''}`} onClick={() => setTime(t)}>{t}</button>)}
                          </div>
                        </div>
                      )
                    })}
                    {!slots.length && <p className="slots__hint">Sem horários livres neste dia.</p>}
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="page-title">Só mais <em>alguns detalhes</em></h1>
            <div className="form-grid form-grid--narrow">
              <div className="field span-2">
                <span>Tipo de consulta</span>
                <div className="choice">
                  {([['primeira', 'Primeira consulta', 'Nunca fui atendido(a) nesta especialidade'], ['retorno', 'Retorno', 'Já faço acompanhamento']] as const).map(([v, l, d]) => (
                    <button key={v} type="button" className={`choice__opt${type === v ? ' is-on' : ''}`} onClick={() => setType(v)}><b>{l}</b><small>{d}</small></button>
                  ))}
                </div>
              </div>
              <label className="field span-2">
                <span>Atendimento</span>
                <select value={insurance} onChange={e => setInsurance(e.target.value)}>{INSURANCES.map(i => <option key={i}>{i}</option>)}</select>
              </label>
              <label className="field span-2">
                <span>Quer contar algo para a clínica? <small>(opcional)</small></span>
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex.: encaminhamento do clínico, preciso de acessibilidade…" />
              </label>
            </div>
          </section>
        )}

        {step === 4 && doc && date && time && (
          <section>
            <h1 className="page-title">Confira e <em>confirme</em></h1>
            <dl className="review">
              <div><dt>Especialidade</dt><dd>{specialtyById(doc.specialtyId).name}</dd><button onClick={() => setStep(0)} hidden={!!original}>Alterar</button></div>
              <div><dt>Profissional</dt><dd>{doc.name}</dd><button onClick={() => setStep(1)} hidden={!!original}>Alterar</button></div>
              <div><dt>Data</dt><dd>{fmtLong(date)}</dd><button onClick={() => setStep(2)}>Alterar</button></div>
              <div><dt>Horário</dt><dd>{time} <small className="muted">· {doc.slot} min</small></dd><button onClick={() => setStep(2)}>Alterar</button></div>
              <div><dt>Tipo</dt><dd>{type === 'primeira' ? 'Primeira consulta' : 'Retorno'}</dd>{!original && <button onClick={() => setStep(3)}>Alterar</button>}</div>
              <div><dt>Atendimento</dt><dd>{insurance}</dd>{!original && <button onClick={() => setStep(3)}>Alterar</button>}</div>
            </dl>
            {original && <p className="note">Horário anterior: {fmtLong(original.date)}, às {original.time}. Ele será liberado.</p>}
          </section>
        )}
      </div>

      <aside className="booking__side">
        <div className="summary">
          <p className="eyebrow">Resumo</p>
          <ul>
            <li className={specId ? 'is-set' : ''}><small>Especialidade</small>{specId ? specialtyById(specId).name : '—'}</li>
            <li className={doc ? 'is-set' : ''}><small>Profissional</small>{doc?.name ?? '—'}</li>
            <li className={date ? 'is-set' : ''}><small>Data</small>{date ? fmtLong(date) : '—'}</li>
            <li className={time ? 'is-set' : ''}><small>Horário</small>{time ?? '—'}</li>
          </ul>
        </div>
      </aside>

      {step >= 2 && (
        <div className="booking__bar">
          <span className="booking__bar-sum">{date && time ? <><b>{fmtLong(date).split(',')[0].slice(0, 3)}, {date.slice(8)}/{date.slice(5, 7)}</b> às <b>{time}</b></> : 'Escolha um horário'}</span>
          {step < 4
            ? <button className="btn btn--primary" disabled={!canNext} onClick={() => go(1)}>Continuar <ArrowRight size={18} /></button>
            : <button className="btn btn--primary" onClick={confirm}>{original ? 'Confirmar remarcação' : 'Solicitar consulta'} <Check size={18} /></button>}
        </div>
      )}
    </div>
  )
}
