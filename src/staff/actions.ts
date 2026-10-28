import type { Status } from '../data/types'

// Próximo passo do fluxo da recepção para cada status
export const NEXT: Partial<Record<Status, { to: Status; label: string; toast: string }>> = {
  pendente: { to: 'confirmado', label: 'Confirmar', toast: 'Consulta confirmada · paciente avisado' },
  confirmado: { to: 'chegou', label: 'Registrar chegada', toast: 'Chegada registrada' },
  chegou: { to: 'atendimento', label: 'Chamar', toast: 'Paciente chamado para o consultório' },
  atendimento: { to: 'concluido', label: 'Finalizar', toast: 'Atendimento finalizado' },
}

export const ORIGIN: Record<string, string> = { paciente: 'Portal', whatsapp: 'WhatsApp', equipe: 'Recepção' }
