// Datas no formato ISO local (YYYY-MM-DD) e horários em minutos desde 00:00

export const pad = (n: number) => String(n).padStart(2, '0')

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO(): string {
  return toISO(new Date())
}

export function addDays(iso: string, days: number): string {
  const d = fromISO(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export function weekday(iso: string): number {
  return fromISO(iso).getDay()
}

export function minToTime(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
}

export function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function nowMin(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export const weekdayName = (iso: string) => WEEKDAYS[weekday(iso)]
export const weekdayShort = (i: number) => WEEKDAYS_SHORT[i]
export const monthName = (m: number) => MONTHS[m]

/** "qui., 30 de out." */
export function fmtShort(iso: string): string {
  const d = fromISO(iso)
  return `${WEEKDAYS_SHORT[d.getDay()]}., ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}.`
}

/** "quinta-feira, 30 de outubro" */
export function fmtLong(iso: string): string {
  const d = fromISO(iso)
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

/** "30/10/2026" */
export function fmtNum(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function relativeDay(iso: string): string | null {
  const t = todayISO()
  if (iso === t) return 'Hoje'
  if (iso === addDays(t, 1)) return 'Amanhã'
  if (iso === addDays(t, -1)) return 'Ontem'
  return null
}

export function daysBetween(a: string, b: string): number {
  return Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86400000)
}

export function ageFrom(birthISO: string): number {
  const b = fromISO(birthISO)
  const n = new Date()
  let age = n.getFullYear() - b.getFullYear()
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) age--
  return age
}

/** Segunda-feira da semana que contém a data */
export function startOfWeek(iso: string): string {
  const wd = weekday(iso)
  return addDays(iso, wd === 0 ? -6 : 1 - wd)
}
