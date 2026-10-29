import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { can, type StaffPage } from '../lib/roles'
import { useStore } from '../lib/store'

// Bloqueia o acesso direto pela URL a telas que o cargo não pode ver
export function RequirePage({ page, children }: { page: StaffPage; children: ReactNode }) {
  const { me } = useStore()
  return can(me?.role, page) ? <>{children}</> : <Navigate to="/equipe" replace />
}
