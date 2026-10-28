import { CLINIC } from '../data/clinic'
import { timeToMin } from './date'

// Arquivo de calendário gerado no navegador (funciona no Google Agenda, iPhone e Outlook)
export function downloadICS(opts: { title: string; date: string; time: string; duration: number; details: string }) {
  const d = opts.date.replace(/-/g, '')
  const s = timeToMin(opts.time)
  const e = s + opts.duration
  const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}00`
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Creass//Portal//PT', 'BEGIN:VEVENT',
    `UID:${Date.now()}@creass`, `DTSTART;TZID=America/Sao_Paulo:${d}T${hm(s)}`, `DTEND;TZID=America/Sao_Paulo:${d}T${hm(e)}`,
    `SUMMARY:${opts.title}`, `LOCATION:${CLINIC.address}\\, ${CLINIC.city}`, `DESCRIPTION:${opts.details}`,
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Lembrete de consulta', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'consulta-creass.ics'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const waLink = (text: string) => `https://wa.me/${CLINIC.whatsapp}?text=${encodeURIComponent(text)}`
