import { useState } from 'react'
import type { Appointment, PreCheck } from '../data/types'
import { todayISO } from '../lib/date'

export function PreCheckForm({ a, onSave }: { a: Appointment; onSave: (p: PreCheck) => void }) {
  const [p, setP] = useState<PreCheck>(a.precheck ?? { symptoms: '', meds: '', exams: false, pain: 3, sentAt: '' })
  return (
    <form id="precheck" className="form-grid" onSubmit={e => { e.preventDefault(); onSave({ ...p, sentAt: todayISO() }) }}>
      <p className="muted span-2">Leva dois minutos e ajuda a médica a aproveitar melhor o tempo da consulta.</p>
      <label className="field span-2">
        <span>O que você está sentindo? Desde quando?</span>
        <textarea rows={3} value={p.symptoms} onChange={e => setP({ ...p, symptoms: e.target.value })} placeholder="Ex.: dor e rigidez nas mãos ao acordar, há cerca de 3 meses" required />
      </label>
      <label className="field span-2">
        <span>Medicamentos em uso</span>
        <textarea rows={2} value={p.meds} onChange={e => setP({ ...p, meds: e.target.value })} placeholder="Nome e dose, se souber" />
      </label>
      <div className="field span-2">
        <span>Intensidade da dor hoje: <b className="pain-val">{p.pain}</b>/10</span>
        <input type="range" min={0} max={10} value={p.pain} onChange={e => setP({ ...p, pain: +e.target.value })} className="range" aria-label="Intensidade da dor" />
        <span className="range-scale"><span>Sem dor</span><span>Pior dor possível</span></span>
      </div>
      <label className="check span-2">
        <input type="checkbox" checked={p.exams} onChange={e => setP({ ...p, exams: e.target.checked })} />
        <span>Vou levar exames recentes (laboratoriais ou de imagem)</span>
      </label>
    </form>
  )
}
