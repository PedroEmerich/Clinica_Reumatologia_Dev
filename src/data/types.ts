export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface Specialty {
  id: string
  name: string
  desc: string
  /** duração padrão da consulta, em minutos */
  duration: number
}

export interface Doctor {
  id: string
  name: string
  short: string
  initials: string
  title: string
  council: string
  specialtyId: string
  /** dia da semana → [início, fim] em minutos; ausente = não atende */
  schedule: Partial<Record<Weekday, [number, number]>>
  slot: number
  blocked: string[]
  /** apenas para dados de exemplo (profissionais fictícios) */
  sample?: boolean
  /** desativado: some do agendamento, mas o histórico continua */
  inactive?: boolean
}

export interface Patient {
  id: string
  name: string
  cpf: string
  birth: string
  phone: string
  email: string
  insurance: string
  card?: string
  since: string
  notes?: string
  tags?: string[]
}

export type Status =
  | 'pendente'
  | 'confirmado'
  | 'chegou'
  | 'atendimento'
  | 'concluido'
  | 'faltou'
  | 'cancelado'

export type VisitType = 'primeira' | 'retorno'

export interface PreCheck {
  symptoms: string
  meds: string
  exams: boolean
  pain: number
  sentAt: string
}

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  specialtyId: string
  date: string
  time: string
  duration: number
  type: VisitType
  insurance: string
  status: Status
  origin: 'paciente' | 'equipe' | 'whatsapp'
  notes?: string
  createdAt: string
  precheck?: PreCheck
  cancelReason?: string
}

export interface Notice {
  id: string
  to: 'paciente' | 'equipe'
  title: string
  body: string
  at: string
  read: boolean
}

export type StaffRole = 'recepcao' | 'medico' | 'gestao'

export interface StaffUser {
  id: string
  name: string
  email: string
  role: StaffRole
  /** profissional vinculado, quando o cargo é médico */
  doctorId?: string
  active: boolean
  createdAt: string
}

export interface DB {
  seededOn: string
  staff: StaffUser[]
  doctors: Doctor[]
  patients: Patient[]
  appointments: Appointment[]
  notices: Notice[]
}
