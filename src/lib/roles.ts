import type { StaffRole } from '../data/types'

export type StaffPage = 'painel' | 'agenda' | 'solicitacoes' | 'pacientes' | 'profissionais' | 'relatorios' | 'usuarios'

export const ROLES: Record<StaffRole, { label: string; desc: string; pages: StaffPage[] }> = {
  recepcao: {
    label: 'Recepção',
    desc: 'Agenda de todos os profissionais, fila do dia, solicitações e cadastro de pacientes.',
    pages: ['painel', 'agenda', 'solicitacoes', 'pacientes'],
  },
  medico: {
    label: 'Corpo clínico',
    desc: 'Somente a própria agenda, os próprios pacientes, horários e relatórios.',
    pages: ['painel', 'agenda', 'pacientes', 'profissionais', 'relatorios'],
  },
  gestao: {
    label: 'Gestão',
    desc: 'Acesso completo, incluindo profissionais, relatórios e usuários da equipe.',
    pages: ['painel', 'agenda', 'solicitacoes', 'pacientes', 'profissionais', 'relatorios', 'usuarios'],
  },
}

export const can = (role: StaffRole | undefined, page: StaffPage) => !!role && ROLES[role].pages.includes(page)
