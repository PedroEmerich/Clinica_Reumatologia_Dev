import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { buildDB, doctorSlots, newId } from '../data/seed'
import type { Appointment, DB, Doctor, Notice, Patient, PreCheck, Status } from '../data/types'
import { nowMin, timeToMin, todayISO } from './date'

const KEY = 'creass-demo-v1'

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const db = JSON.parse(raw) as DB
      // A demo é recriada a cada dia para que as datas continuem fazendo sentido
      if (db.seededOn === todayISO()) return db
    }
  } catch { /* armazenamento indisponível: segue só em memória */ }
  return buildDB()
}

function save(db: DB) {
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* ignora */ }
}

export type NewAppointment = Omit<Appointment, 'id' | 'createdAt' | 'status' | 'duration' | 'specialtyId'> & { status?: Status }

interface Store {
  db: DB
  doctor: (id: string) => Doctor
  patient: (id: string) => Patient
  freeSlots: (doctorId: string, date: string, ignoreId?: string) => string[]
  book: (a: NewAppointment) => Appointment
  setStatus: (id: string, status: Status, reason?: string) => void
  reschedule: (id: string, date: string, time: string, doctorId?: string) => void
  savePrecheck: (id: string, p: PreCheck) => void
  updateAppointment: (id: string, patch: Partial<Appointment>) => void
  addPatient: (p: Omit<Patient, 'id' | 'since'>) => Patient
  updatePatient: (id: string, patch: Partial<Patient>) => void
  updateDoctor: (id: string, patch: Partial<Doctor>) => void
  notify: (n: Omit<Notice, 'id' | 'at' | 'read'>) => void
  markRead: (to: Notice['to']) => void
  reset: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load)
  const skipSave = useRef(false)

  useEffect(() => {
    if (skipSave.current) { skipSave.current = false; return }
    save(db)
  }, [db])

  // Sincroniza abas abertas: paciente numa aba e recepção na outra veem a mesma agenda
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue) return
      try { skipSave.current = true; setDb(JSON.parse(e.newValue)) } catch { /* ignora */ }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = useCallback((fn: (d: DB) => DB) => setDb(prev => fn(prev)), [])

  const store = useMemo<Store>(() => {
    const doctor = (id: string) => db.doctors.find(d => d.id === id)!
    const patient = (id: string) => db.patients.find(p => p.id === id)!
    const mapAppt = (id: string, fn: (a: Appointment) => Appointment) =>
      update(d => ({ ...d, appointments: d.appointments.map(a => (a.id === id ? fn(a) : a)) }))
    const notice = (n: Omit<Notice, 'id' | 'at' | 'read'>): Notice => ({ ...n, id: newId('n'), at: todayISO(), read: false })

    return {
      db,
      doctor,
      patient,
      freeSlots(doctorId, date, ignoreId) {
        const doc = doctor(doctorId)
        const busy = new Set(
          db.appointments
            .filter(a => a.doctorId === doctorId && a.date === date && a.status !== 'cancelado' && a.id !== ignoreId)
            .map(a => a.time),
        )
        const isToday = date === todayISO()
        const now = nowMin()
        return doctorSlots(doc, date).filter(t => !busy.has(t) && (!isToday || timeToMin(t) > now + 30))
      },
      book(input) {
        const doc = doctor(input.doctorId)
        const appt: Appointment = {
          ...input,
          id: newId('a'),
          specialtyId: doc.specialtyId,
          duration: doc.slot,
          status: input.status ?? (input.origin === 'paciente' ? 'pendente' : 'confirmado'),
          createdAt: todayISO(),
        }
        update(d => ({
          ...d,
          appointments: [...d.appointments, appt].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
          notices: input.origin === 'paciente'
            ? [notice({ to: 'equipe', title: 'Nova solicitação pelo portal', body: `${patient(input.patientId).name} pediu ${input.type === 'primeira' ? 'uma primeira consulta' : 'um retorno'} com ${doc.short}.` }), ...d.notices]
            : d.notices,
        }))
        return appt
      },
      setStatus(id, status, reason) {
        const a = db.appointments.find(x => x.id === id)
        mapAppt(id, x => ({ ...x, status, cancelReason: reason ?? x.cancelReason }))
        if (!a) return
        if (status === 'confirmado' && a.status === 'pendente') {
          update(d => ({ ...d, notices: [notice({ to: 'paciente', title: 'Consulta confirmada', body: `A clínica confirmou sua consulta com ${doctor(a.doctorId).short}.` }), ...d.notices] }))
        }
        if (status === 'cancelado' && reason === 'Cancelado pelo paciente') {
          update(d => ({ ...d, notices: [notice({ to: 'equipe', title: 'Cancelamento pelo portal', body: `${patient(a.patientId).name} cancelou a consulta com ${doctor(a.doctorId).short}. O horário foi liberado.` }), ...d.notices] }))
        }
      },
      reschedule(id, date, time, doctorId) {
        mapAppt(id, a => {
          const doc = doctor(doctorId ?? a.doctorId)
          return { ...a, date, time, doctorId: doc.id, specialtyId: doc.specialtyId, duration: doc.slot, status: a.status === 'cancelado' ? 'pendente' : a.status }
        })
      },
      savePrecheck(id, p) { mapAppt(id, a => ({ ...a, precheck: p })) },
      updateAppointment(id, patch) { mapAppt(id, a => ({ ...a, ...patch })) },
      addPatient(p) {
        const np: Patient = { ...p, id: newId('p'), since: todayISO() }
        update(d => ({ ...d, patients: [...d.patients, np] }))
        return np
      },
      updatePatient(id, patch) { update(d => ({ ...d, patients: d.patients.map(p => (p.id === id ? { ...p, ...patch } : p)) })) },
      updateDoctor(id, patch) { update(d => ({ ...d, doctors: d.doctors.map(x => (x.id === id ? { ...x, ...patch } : x)) })) },
      notify(n) { update(d => ({ ...d, notices: [notice(n), ...d.notices] })) },
      markRead(to) { update(d => ({ ...d, notices: d.notices.map(n => (n.to === to ? { ...n, read: true } : n)) })) },
      reset() {
        try { localStorage.removeItem(KEY) } catch { /* ignora */ }
        setDb(buildDB())
      },
    }
  }, [db, update])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore fora do StoreProvider')
  return s
}

export const STATUS: Record<Status, { label: string; tone: string }> = {
  pendente: { label: 'Aguardando confirmação', tone: 'amber' },
  confirmado: { label: 'Confirmada', tone: 'green' },
  chegou: { label: 'Na recepção', tone: 'blue' },
  atendimento: { label: 'Em atendimento', tone: 'red' },
  concluido: { label: 'Concluída', tone: 'muted' },
  faltou: { label: 'Faltou', tone: 'wine' },
  cancelado: { label: 'Cancelada', tone: 'muted' },
}

export const isActive = (s: Status) => s !== 'cancelado' && s !== 'faltou'
