import { addDays, minToTime, nowMin, todayISO, weekday } from '../lib/date'
import { CLINIC, INSURANCES, specialtyById } from './clinic'
import type { Appointment, DB, Doctor, Patient, Status } from './types'

// Gerador pseudoaleatório com semente fixa: a demo fica igual em todo carregamento
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const DEMO_PATIENT_ID = 'p1'

export const DOCTORS: Doctor[] = [
  {
    id: 'd1', name: 'Dra. Andrea Soares dos Santos', short: 'Dra. Andrea', initials: 'AS',
    title: 'Reumatologista · Fundadora e responsável técnica', council: 'CRM-SP 99852', specialtyId: 'reumato',
    schedule: { 1: [480, 1020], 2: [480, 1020], 3: [480, 1020], 4: [480, 1020], 5: [510, 1020] }, slot: 30, blocked: [],
  },
  {
    id: 'd2', name: 'Dr. Rafael Moura', short: 'Dr. Rafael', initials: 'RM', title: 'Endocrinologista',
    council: 'CRM-SP 000000', specialtyId: 'endocrino', schedule: { 2: [480, 1020], 4: [480, 1020] }, slot: 30, blocked: [], sample: true,
  },
  {
    id: 'd3', name: 'Dra. Camila Ferraz', short: 'Dra. Camila', initials: 'CF', title: 'Angiologista',
    council: 'CRM-SP 000000', specialtyId: 'angio', schedule: { 1: [780, 1020], 3: [780, 1020] }, slot: 30, blocked: [], sample: true,
  },
  {
    id: 'd4', name: 'Dr. Henrique Sato', short: 'Dr. Henrique', initials: 'HS', title: 'Geriatra',
    council: 'CRM-SP 000000', specialtyId: 'geriatria', schedule: { 3: [480, 720], 5: [510, 1020] }, slot: 45, blocked: [], sample: true,
  },
  {
    id: 'd5', name: 'Dra. Lívia Andrade', short: 'Dra. Lívia', initials: 'LA', title: 'Ginecologista',
    council: 'CRM-SP 000000', specialtyId: 'gineco', schedule: { 1: [480, 720], 4: [780, 1020] }, slot: 30, blocked: [], sample: true,
  },
  {
    id: 'd6', name: 'Dr. Marcelo Tavares', short: 'Dr. Marcelo', initials: 'MT', title: 'Clínico geral',
    council: 'CRM-SP 000000', specialtyId: 'clinica', schedule: { 1: [480, 1020], 2: [480, 1020], 5: [510, 1020] }, slot: 30, blocked: [], sample: true,
  },
]

const FIRST = ['Mariana', 'José', 'Ana', 'Carlos', 'Beatriz', 'Antônio', 'Luciana', 'Paulo', 'Fernanda', 'Roberto', 'Cláudia', 'Eduardo',
  'Patrícia', 'Sérgio', 'Juliana', 'Marcos', 'Helena', 'Ricardo', 'Sônia', 'Vitor', 'Teresa', 'Gustavo', 'Renata', 'Aparecida', 'Fábio', 'Lúcia']
const LAST = ['Lopes Ribeiro', 'Almeida', 'Costa', 'Pereira', 'Nakamura', 'Oliveira', 'Santos', 'Barbosa', 'Rocha', 'Yamamoto', 'Martins', 'Souza',
  'Carvalho', 'Fernandes', 'Gomes', 'Lima', 'Araújo', 'Mendes', 'Teixeira', 'Moreira', 'Cardoso', 'Ishikawa', 'Ramos', 'Freitas', 'Dias', 'Prado']
const TAGS = ['Artrite reumatoide', 'Lúpus', 'Osteoporose', 'Fibromialgia', 'Gota', 'Espondiloartrite', 'Artrose', 'Sjögren', 'Diabetes', 'Hipotireoidismo']

function cpf(r: () => number) {
  const d = () => Math.floor(r() * 10)
  return `${d()}${d()}${d()}.${d()}${d()}${d()}.${d()}${d()}${d()}-${d()}${d()}`
}

export function buildPatients(): Patient[] {
  const r = rng(7)
  return FIRST.map((first, i) => {
    const year = 1945 + Math.floor(r() * 60)
    const ins = i === 0 ? 'Unimed' : INSURANCES[Math.floor(r() * INSURANCES.length)]
    const tags = r() > 0.25 ? [TAGS[Math.floor(r() * TAGS.length)]] : []
    return {
      id: `p${i + 1}`,
      name: `${first} ${LAST[i]}`,
      cpf: cpf(r),
      birth: i === 0 ? '1984-05-12' : `${year}-${String(1 + Math.floor(r() * 12)).padStart(2, '0')}-${String(1 + Math.floor(r() * 28)).padStart(2, '0')}`,
      phone: `(11) 9${Math.floor(1000 + r() * 8999)}-${Math.floor(1000 + r() * 8999)}`,
      email: `${first.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${LAST[i].split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@email.com`,
      insurance: ins,
      card: ins === 'Particular' ? undefined : String(Math.floor(1e11 + r() * 9e11)),
      since: `20${18 + Math.floor(r() * 8)}-0${1 + Math.floor(r() * 9)}-1${Math.floor(r() * 9)}`,
      tags: i === 0 ? ['Artrite reumatoide'] : tags,
      notes: i === 0 ? 'Em uso de metotrexato. Prefere atendimento pela manhã.' : undefined,
    }
  })
}

/** Horários de um profissional num dia (sem considerar ocupação) */
export function doctorSlots(doc: Doctor, date: string): string[] {
  const range = doc.schedule[weekday(date) as 0]
  if (!range || doc.blocked.includes(date)) return []
  const out: string[] = []
  for (let m = range[0]; m + doc.slot <= range[1]; m += doc.slot) {
    if (m < CLINIC.lunch[1] && m + doc.slot > CLINIC.lunch[0]) continue
    out.push(minToTime(m))
  }
  return out
}

let seq = 0
export const newId = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`

export function buildDB(): DB {
  const r = rng(42)
  const today = todayISO()
  const patients = buildPatients()
  const appts: Appointment[] = []
  const taken = new Set<string>()
  const key = (d: string, date: string, t: string) => `${d}|${date}|${t}`
  const now = nowMin()

  const add = (a: Omit<Appointment, 'id' | 'createdAt' | 'duration' | 'specialtyId'> & { createdAt?: string }) => {
    const doc = DOCTORS.find(d => d.id === a.doctorId)!
    taken.add(key(a.doctorId, a.date, a.time))
    appts.push({
      ...a,
      id: `a${appts.length + 1}`,
      specialtyId: doc.specialtyId,
      duration: doc.slot,
      createdAt: a.createdAt ?? [addDays(a.date, -7), today].sort()[0],
    })
  }

  // Histórico e próximas consultas da paciente da demonstração
  const nextWd = (from: number, wd: number[]) => {
    let d = addDays(today, from)
    while (!wd.includes(weekday(d))) d = addDays(d, 1)
    return d
  }
  add({ patientId: 'p1', doctorId: 'd1', date: nextWd(-75, [1, 2, 3, 4]), time: '09:00', type: 'primeira', insurance: 'Unimed', status: 'concluido', origin: 'whatsapp' })
  add({ patientId: 'p1', doctorId: 'd1', date: nextWd(-30, [1, 2, 3, 4]), time: '10:30', type: 'retorno', insurance: 'Unimed', status: 'concluido', origin: 'paciente' })
  add({ patientId: 'p1', doctorId: 'd6', date: nextWd(-12, [1, 2]), time: '14:00', type: 'primeira', insurance: 'Unimed', status: 'faltou', origin: 'paciente' })
  add({ patientId: 'p1', doctorId: 'd1', date: nextWd(3, [1, 2, 3, 4]), time: '09:30', type: 'retorno', insurance: 'Unimed', status: 'confirmado', origin: 'paciente', createdAt: addDays(today, -20) })
  add({ patientId: 'p1', doctorId: 'd2', date: nextWd(9, [2, 4]), time: '15:00', type: 'primeira', insurance: 'Unimed', status: 'pendente', origin: 'paciente', createdAt: addDays(today, -1) })

  for (let off = -21; off <= 28; off++) {
    const date = addDays(today, off)
    for (const doc of DOCTORS) {
      const base = doc.id === 'd1' ? 0.62 : 0.4
      const fill = off <= 0 ? base : base * Math.max(0.25, 1 - off / 30)
      for (const time of doctorSlots(doc, date)) {
        if (taken.has(key(doc.id, date, time)) || r() > fill) continue
        const p = patients[1 + Math.floor(r() * (patients.length - 1))]
        const [h, m] = time.split(':').map(Number)
        const min = h * 60 + m
        let status: Status
        const x = r()
        if (off < 0 || (off === 0 && min + doc.slot < now - 20)) status = x < 0.08 ? 'faltou' : x < 0.12 ? 'cancelado' : 'concluido'
        else if (off === 0 && min <= now + 10) status = min + doc.slot < now ? 'atendimento' : 'chegou'
        else if (off === 0) status = x < 0.75 ? 'confirmado' : 'pendente'
        else if (off <= 2) status = x < 0.85 ? 'confirmado' : x < 0.95 ? 'pendente' : 'cancelado'
        else status = x < 0.9 ? 'confirmado' : 'pendente'
        add({
          patientId: p.id, doctorId: doc.id, date, time,
          type: r() < 0.3 ? 'primeira' : 'retorno', insurance: p.insurance, status,
          origin: r() < 0.45 ? 'paciente' : r() < 0.6 ? 'whatsapp' : 'equipe',
          createdAt: [addDays(date, -Math.floor(2 + r() * 20)), addDays(today, -Math.floor(r() * 4))].sort()[0],
        })
      }
    }
  }

  // Hoje: garante que a fila mostre gente esperando, sendo atendida e chegando
  const todays = appts.filter(a => a.date === today && a.doctorId === 'd1').sort((a, b) => a.time.localeCompare(b.time))
  if (todays.length && weekday(today) >= 1 && weekday(today) <= 5) {
    const upcoming = todays.filter(a => ['confirmado', 'pendente', 'chegou'].includes(a.status))
    if (upcoming[0]) upcoming[0].status = 'chegou'
  }

  return {
    seededOn: today,
    doctors: DOCTORS.map(d => ({ ...d, blocked: [...d.blocked] })),
    patients,
    appointments: appts.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    notices: [
      { id: 'n1', to: 'paciente', title: 'Consulta confirmada', body: `Seu retorno com a Dra. Andrea está confirmado. Lembre-se de levar seus exames recentes.`, at: addDays(today, -2), read: false },
      { id: 'n2', to: 'paciente', title: 'Pré-consulta disponível', body: 'Responda o questionário antes da consulta e ganhe tempo no dia.', at: addDays(today, -1), read: false },
      { id: 'n3', to: 'equipe', title: 'Nova solicitação pelo portal', body: 'Mariana Lopes Ribeiro pediu uma primeira consulta de Endocrinologia.', at: addDays(today, -1), read: false },
    ],
  }
}

export const specialtyOf = (doc: Doctor) => specialtyById(doc.specialtyId)
