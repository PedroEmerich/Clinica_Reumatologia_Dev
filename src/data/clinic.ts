import type { Specialty } from './types'

export const CLINIC = {
  name: 'Creass',
  full: 'Creass Reumatologia e Especialidades Médicas',
  address: 'R. Santana, 187 — Centro',
  city: 'Mogi das Cruzes · SP',
  cep: '08710-610',
  phone: '(11) 93377-1629',
  whatsapp: '5511933771629',
  email: 'creass.reumatologia@gmail.com',
  maps: 'https://www.google.com/maps/search/?api=1&query=Creass%20Reumatologia%20e%20Especialidades%20M%C3%A9dicas',
  landing: 'https://pedroemerich.github.io/Clinica_Reumatologia_LG/',
  /** dia da semana → [abre, fecha] em minutos */
  hours: { 1: [480, 1020], 2: [480, 1020], 3: [480, 1020], 4: [480, 1020], 5: [510, 1020] } as Record<number, [number, number]>,
  lunch: [720, 780] as [number, number],
}

export const SPECIALTIES: Specialty[] = [
  { id: 'reumato', name: 'Reumatologia', desc: 'Doenças articulares, autoimunes e osteometabólicas.', duration: 30 },
  { id: 'endocrino', name: 'Endocrinologia', desc: 'Diabetes, tireoide, obesidade e equilíbrio hormonal.', duration: 30 },
  { id: 'angio', name: 'Angiologia', desc: 'Saúde vascular, circulação e prevenção de tromboses.', duration: 30 },
  { id: 'geriatria', name: 'Geriatria', desc: 'Envelhecimento ativo, com autonomia e qualidade de vida.', duration: 45 },
  { id: 'gineco', name: 'Ginecologia', desc: 'Saúde da mulher em todas as fases da vida.', duration: 30 },
  { id: 'clinica', name: 'Clínica médica', desc: 'Avaliação global, prevenção e coordenação do cuidado.', duration: 30 },
]

export const specialtyById = (id: string) => SPECIALTIES.find(s => s.id === id)!

// Lista de exemplo: os convênios aceitos ainda precisam ser confirmados com a clínica
export const INSURANCES = ['Particular', 'Unimed', 'Bradesco Saúde', 'SulAmérica', 'Amil', 'Porto Seguro', 'NotreDame Intermédica']

export const CHECKLIST = [
  'Documento com foto',
  'Carteirinha do convênio (se houver)',
  'Exames anteriores, laboratoriais e de imagem',
  'Lista dos medicamentos em uso',
  'Anotações sobre os sintomas e quando começaram',
]

export function isOpenNow(): { open: boolean; label: string } {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const wd = now.getDay()
  const min = now.getHours() * 60 + now.getMinutes()
  const h = CLINIC.hours[wd]
  if (h && min >= h[0] && min < h[1]) return { open: true, label: 'Aberto agora · até as 17h' }
  if (h && min < h[0]) return { open: false, label: `Fechado · abre hoje às ${fmtHour(h[0])}` }
  for (let i = 1; i <= 7; i++) {
    const n = (wd + i) % 7
    const t = CLINIC.hours[n]
    if (t) return { open: false, label: `Fechado · abre ${i === 1 ? 'amanhã' : weekdayLabel(n)} às ${fmtHour(t[0])}` }
  }
  return { open: false, label: 'Fechado' }
}

const fmtHour = (m: number) => (m % 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m / 60}h`)
const weekdayLabel = (n: number) => ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][n]
