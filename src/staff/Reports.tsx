import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Download, Printer } from 'lucide-react'
import { PageHead, Segmented } from '../components/ui'
import { INSURANCES, SPECIALTIES, specialtyById } from '../data/clinic'
import { doctorSlots } from '../data/seed'
import type { Appointment } from '../data/types'
import { addDays, fmtNum, startOfWeek, todayISO, weekdayShort, weekday } from '../lib/date'
import { STATUS, isActive, useStore } from '../lib/store'
import { ORIGIN } from './actions'

type Period = '7' | '30' | '90'
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0)

interface Bar { label: string; value: number; tip: string }

export function Reports() {
  const { db, doctor, patient, me } = useStore()
  const ownDoc = me?.role === 'medico' ? me.doctorId : undefined
  const [period, setPeriod] = useState<Period>('30')
  const [docId, setDocId] = useState(ownDoc ?? 'todos')
  const today = todayISO()
  const days = +period
  const start = addDays(today, -(days - 1))
  const prevStart = addDays(start, -days)
  const doc = ownDoc ?? (docId === 'todos' ? undefined : docId)

  const r = useMemo(() => {
    const scope = db.appointments.filter(a => !doc || a.doctorId === doc)
    const inRange = (a: Appointment, s: string, e: string) => a.date >= s && a.date <= e
    const cur = scope.filter(a => inRange(a, start, today))
    const prev = scope.filter(a => inRange(a, prevStart, addDays(start, -1)))
    // há 90 dias de histórico: o período anterior só existe para 7 e 30 dias
    const hasPrev = days < 90

    const stats = (list: Appointment[]) => {
      const done = list.filter(a => a.status === 'concluido')
      const noShow = list.filter(a => a.status === 'faltou').length
      return {
        done: done.length,
        noShow,
        noShowRate: pct(noShow, done.length + noShow),
        canceled: list.filter(a => a.status === 'cancelado').length,
        firsts: done.filter(a => a.type === 'primeira').length,
        portal: pct(list.filter(a => a.origin === 'paciente').length, list.length),
      }
    }

    // Série no tempo: por dia (7 dias) ou por semana (30 e 90 dias)
    const series: Bar[] = []
    if (days === 7) {
      for (let i = 0; i < 7; i++) {
        const d = addDays(start, i)
        const list = cur.filter(a => a.date === d)
        const done = list.filter(a => a.status === 'concluido').length
        const miss = list.filter(a => a.status === 'faltou').length
        series.push({ label: `${weekdayShort(weekday(d))} ${d.slice(8)}`, value: done, tip: `${fmtNum(d)} · ${done} realizadas · ${miss} faltas` })
      }
    } else {
      for (let w = startOfWeek(start); w <= today; w = addDays(w, 7)) {
        const end = addDays(w, 6)
        const list = cur.filter(a => a.date >= w && a.date <= end)
        const done = list.filter(a => a.status === 'concluido').length
        const miss = list.filter(a => a.status === 'faltou').length
        series.push({ label: `${w.slice(8)}/${w.slice(5, 7)}`, value: done, tip: `Semana de ${fmtNum(w)} · ${done} realizadas · ${miss} faltas` })
      }
    }

    const done = cur.filter(a => a.status === 'concluido')
    const group = (keys: string[], key: (a: Appointment) => string, label: (k: string) => string): Bar[] =>
      keys.map(k => {
        const n = done.filter(a => key(a) === k).length
        return { label: label(k), value: n, tip: `${label(k)} · ${n} consultas · ${pct(n, done.length)}%` }
      }).filter(b => b.value > 0).sort((a, b) => b.value - a.value)

    const bySpecialty = group(SPECIALTIES.map(s => s.id), a => a.specialtyId, k => specialtyById(k).name)
    const byInsurance = group(INSURANCES, a => a.insurance, k => k)
    const byOrigin = (['paciente', 'whatsapp', 'equipe'] as const).map(k => {
      const n = cur.filter(a => a.origin === k).length
      return { label: ORIGIN[k], value: n, tip: `${ORIGIN[k]} · ${n} agendamentos · ${pct(n, cur.length)}%` }
    })

    const docs = db.doctors.filter(d => !doc || d.id === doc).map(d => {
      const list = cur.filter(a => a.doctorId === d.id)
      const s = stats(list)
      let slots = 0
      for (let i = 0; i < days; i++) slots += doctorSlots(d, addDays(start, i)).length
      return { d, ...s, occupancy: pct(list.filter(a => isActive(a.status)).length, slots) }
    }).filter(x => x.done + x.noShow + x.canceled > 0 || !x.d.inactive)

    return { cur, now: stats(cur), before: hasPrev ? stats(prev) : null, series, bySpecialty, byInsurance, byOrigin, docs }
  }, [db, doc, start, prevStart, today, days])

  const exportCSV = () => {
    const head = ['Data', 'Hora', 'Paciente', 'Profissional', 'Especialidade', 'Tipo', 'Atendimento', 'Canal', 'Status']
    const rows = r.cur.map(a => [fmtNum(a.date), a.time, patient(a.patientId).name, doctor(a.doctorId).name, specialtyById(a.specialtyId).name,
      a.type === 'primeira' ? 'Primeira consulta' : 'Retorno', a.insurance, ORIGIN[a.origin], STATUS[a.status].label])
    const csv = [head, ...rows].map(l => l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `creass-relatorio-${start}-a-${today}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const k = r.now, b = r.before
  return (
    <div className="stack-lg reports">
      <PageHead index="06" eyebrow={`${fmtNum(start)} a ${fmtNum(today)}`} title={ownDoc ? <>Meus <em>relatórios</em></> : <><em>Relatórios</em></>}>
        <button className="btn btn--ghost btn--sm no-print" onClick={exportCSV}><Download size={16} /> Exportar planilha</button>
        <button className="btn btn--ghost btn--sm no-print" onClick={() => window.print()}><Printer size={16} /> Imprimir / PDF</button>
      </PageHead>

      <div className="toolbar no-print">
        <Segmented label="Período" value={period} onChange={setPeriod} options={[
          { value: '7', label: '7 dias' }, { value: '30', label: '30 dias' }, { value: '90', label: '90 dias' },
        ]} />
        {!ownDoc && (
          <select className="select-sm" value={docId} onChange={e => setDocId(e.target.value)} aria-label="Profissional">
            <option value="todos">Todos os profissionais</option>
            {db.doctors.map(d => <option key={d.id} value={d.id}>{d.short} · {specialtyById(d.specialtyId).name}</option>)}
          </select>
        )}
      </div>

      <section className="kpis kpis--5" aria-label="Indicadores do período">
        <Kpi label="Consultas realizadas" value={k.done} prev={b?.done} />
        <Kpi label="Primeiras consultas" value={k.firsts} prev={b?.firsts} sub="pacientes novos" />
        <Kpi label="Taxa de faltas" value={k.noShowRate} prev={b?.noShowRate} unit="%" lowerIsBetter sub={`${k.noShow} faltas`} />
        <Kpi label="Cancelamentos" value={k.canceled} prev={b?.canceled} lowerIsBetter />
        <Kpi label="Agendados pelo portal" value={k.portal} prev={b?.portal} unit="%" sub="do total de agendamentos" />
      </section>

      <section className="card">
        <p className="eyebrow"><span className="eyebrow__num">01</span>Volume</p>
        <h2 className="card__title">Consultas realizadas por <em>{days === 7 ? 'dia' : 'semana'}</em></h2>
        <Columns bars={r.series} />
      </section>

      <div className="two-col">
        {!doc && (
          <section className="card">
            <p className="eyebrow"><span className="eyebrow__num">02</span>Especialidades</p>
            <h2 className="card__title">Realizadas por <em>especialidade</em></h2>
            <HBars bars={r.bySpecialty} />
          </section>
        )}
        <section className="card">
          <p className="eyebrow"><span className="eyebrow__num">{doc ? '02' : '03'}</span>Convênios</p>
          <h2 className="card__title">Realizadas por <em>convênio</em></h2>
          <HBars bars={r.byInsurance} />
        </section>
        <section className="card">
          <p className="eyebrow"><span className="eyebrow__num">{doc ? '03' : '04'}</span>Canais</p>
          <h2 className="card__title">Como os pacientes <em>agendam</em></h2>
          <HBars bars={r.byOrigin} />
          <p className="muted small">Inclui todas as consultas do período, realizadas ou não.</p>
        </section>
      </div>

      <section className="card card--flush">
        <div className="card__bar">
          <div>
            <p className="eyebrow"><span className="eyebrow__num">{doc ? '04' : '05'}</span>Profissionais</p>
            <h2 className="card__title">Desempenho por <em>profissional</em></h2>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table table--static">
            <thead><tr><th>Profissional</th><th className="num">Realizadas</th><th className="num">Faltas</th><th className="num">Taxa de faltas</th><th className="num">Cancelamentos</th><th className="num">Ocupação</th></tr></thead>
            <tbody>
              {r.docs.map(x => (
                <tr key={x.d.id}>
                  <td data-label="Profissional"><b>{x.d.short}</b> <small className="muted">· {specialtyById(x.d.specialtyId).name}</small></td>
                  <td data-label="Realizadas" className="num">{x.done}</td>
                  <td data-label="Faltas" className="num">{x.noShow}</td>
                  <td data-label="Taxa de faltas" className="num">{x.noShowRate}%</td>
                  <td data-label="Cancelamentos" className="num">{x.canceled}</td>
                  <td data-label="Ocupação" className="num"><span className="occ"><span className="meter"><span style={{ width: `${Math.min(100, x.occupancy)}%` }} /></span>{x.occupancy}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="muted small">Ocupação = consultas marcadas (exceto canceladas) sobre os horários disponíveis no período. Dados fictícios da demonstração.</p>
    </div>
  )
}

function Kpi({ label, value, prev, unit = '', sub, lowerIsBetter }: { label: string; value: number; prev?: number; unit?: string; sub?: string; lowerIsBetter?: boolean }) {
  const diff = prev === undefined ? null : value - prev
  const good = diff === null || diff === 0 ? null : lowerIsBetter ? diff < 0 : diff > 0
  return (
    <div className="kpi">
      <p className="kpi__label">{label}</p>
      <p className="kpi__value">{value}{unit && <small className="kpi__unit">{unit}</small>}</p>
      <p className="kpi__sub">
        {diff !== null && diff !== 0 && (
          <span className={`delta ${good ? 'delta--good' : 'delta--bad'}`}>
            {diff > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{diff > 0 ? '+' : ''}{diff}{unit === '%' ? ' p.p.' : ''}
          </span>
        )}
        {diff === 0 && <span className="muted">igual</span>}
        {diff !== null && <span className="muted">vs. período anterior</span>}
        {diff === null && sub && <span>{sub}</span>}
      </p>
    </div>
  )
}

// Colunas verticais, uma série só: cor única, rótulo de valor no topo e dica no foco/hover
function Columns({ bars }: { bars: Bar[] }) {
  const max = Math.max(1, ...bars.map(b => b.value))
  return (
    <>
      <div className="cols" role="list">
        {bars.map(b => (
          <div key={b.label} className="cols__item" role="listitem" tabIndex={0} aria-label={b.tip}>
            <span className="cols__val">{b.value}</span>
            <span className="cols__bar" style={{ height: `${(b.value / max) * 100}%` }} />
            <span className="cols__label">{b.label}</span>
            <span className="tip" role="tooltip">{b.tip}</span>
          </div>
        ))}
      </div>
      <DataTable bars={bars} />
    </>
  )
}

function HBars({ bars }: { bars: Bar[] }) {
  const max = Math.max(1, ...bars.map(b => b.value))
  if (!bars.some(b => b.value)) return <p className="muted">Sem dados no período.</p>
  return (
    <>
      <ul className="hbars">
        {bars.map(b => (
          <li key={b.label} tabIndex={0} aria-label={b.tip}>
            <span className="hbars__label">{b.label}</span>
            <span className="hbars__track"><span className="hbars__bar" style={{ width: `${(b.value / max) * 100}%` }} /></span>
            <span className="hbars__val">{b.value}</span>
            <span className="tip" role="tooltip">{b.tip}</span>
          </li>
        ))}
      </ul>
      <DataTable bars={bars} />
    </>
  )
}

function DataTable({ bars }: { bars: Bar[] }) {
  return (
    <details className="data-table no-print">
      <summary>Ver como tabela</summary>
      <table className="table table--static">
        <tbody>{bars.map(b => <tr key={b.label}><td>{b.label}</td><td className="num">{b.value}</td></tr>)}</tbody>
      </table>
    </details>
  )
}
