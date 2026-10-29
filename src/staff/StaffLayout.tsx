import { useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, ChartColumn, Inbox, LayoutDashboard, LogOut, ShieldCheck, Stethoscope, Users } from 'lucide-react'
import { DemoBar } from '../components/DemoBar'
import { Logo } from '../components/Logo'
import { Modal } from '../components/Modal'
import { Avatar, Empty } from '../components/ui'
import { fmtShort, todayISO } from '../lib/date'
import { can, ROLES, type StaffPage } from '../lib/roles'
import { useStore } from '../lib/store'

export function StaffLayout() {
  const { db, markRead, me, logout } = useStore()
  const nav = useNavigate()
  const [bell, setBell] = useState(false)
  const pending = db.appointments.filter(a => a.status === 'pendente' && a.date >= todayISO()).length
  const notices = db.notices.filter(n => n.to === 'equipe')
  const unread = notices.filter(n => !n.read).length

  if (!me) return <Navigate to="/entrar/equipe" replace />
  const medico = me.role === 'medico'
  const ALL: { page: StaffPage; to: string; label: string; short?: string; icon: typeof Bell; end?: boolean; badge?: number }[] = [
    { page: 'painel', to: '/equipe', label: medico ? 'Meu dia' : 'Painel', icon: LayoutDashboard, end: true },
    { page: 'agenda', to: '/equipe/agenda', label: medico ? 'Minha agenda' : 'Agenda', short: 'Agenda', icon: CalendarDays },
    { page: 'solicitacoes', to: '/equipe/solicitacoes', label: 'Solicitações', short: 'Pedidos', icon: Inbox, badge: pending },
    { page: 'pacientes', to: '/equipe/pacientes', label: medico ? 'Meus pacientes' : 'Pacientes', short: 'Pacientes', icon: Users },
    { page: 'profissionais', to: '/equipe/profissionais', label: medico ? 'Meus horários' : 'Profissionais', short: medico ? 'Horários' : 'Equipe', icon: Stethoscope },
    { page: 'relatorios', to: '/equipe/relatorios', label: medico ? 'Meus relatórios' : 'Relatórios', short: 'Relatórios', icon: ChartColumn },
    { page: 'usuarios', to: '/equipe/usuarios', label: 'Usuários', icon: ShieldCheck },
  ]
  const NAV = ALL.filter(n => can(me.role, n.page))
  const exit = () => { logout(); nav('/') }

  return (
    <div className="st">
      <DemoBar side="equipe" />
      <div className="st__shell">
        <aside className="st__side">
          <Logo sub="Área da equipe" />
          <nav className="st__nav" aria-label="Principal">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.end} className="st__link">
                <n.icon size={19} strokeWidth={1.7} /><span>{n.label}</span>
                {!!n.badge && <span className="st__badge">{n.badge}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="st__user">
            <Avatar name={me.name} size={36} tone="red" />
            <span className="grow"><b>{me.name.replace(/ (dos|da|de) .*/, '')}</b><small>{ROLES[me.role].label}</small></span>
            <button className="icon-btn" onClick={exit} aria-label="Sair"><LogOut size={18} /></button>
          </div>
        </aside>

        <div className="st__content">
          <header className="st__top">
            <span className="st__top-logo"><Logo sub="Área da equipe" /></span>
            <span className="st__top-date">{fmtShort(todayISO())}</span>
            <span className={`role-chip role-chip--${me.role} st__top-role`}>{ROLES[me.role].label}</span>
            <button className="icon-btn icon-btn--bell" onClick={() => { setBell(true); markRead('equipe') }} aria-label={`Avisos${unread ? `, ${unread} novos` : ''}`}>
              <Bell size={20} />{unread > 0 && <span className="bell-dot">{unread}</span>}
            </button>
            <button className="icon-btn st__top-exit" onClick={exit} aria-label="Sair"><LogOut size={19} /></button>
          </header>
          <main className="st__main"><Outlet /></main>
        </div>
      </div>

      <nav className="tabbar tabbar--staff" aria-label="Principal">
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `tabbar__item${isActive ? ' is-on' : ''}`}>
            <span className="tabbar__icon"><n.icon size={22} strokeWidth={1.7} />{!!n.badge && <span className="bell-dot">{n.badge}</span>}</span>
            <span>{n.short ?? n.label}</span>
          </NavLink>
        ))}
      </nav>

      <Modal open={bell} onClose={() => setBell(false)} title="Avisos" eyebrow="Notificações">
        {notices.length === 0 ? <Empty icon={<Bell />} title="Nenhum aviso por aqui." /> : (
          <ul className="notice-list">
            {notices.map(n => (
              <li key={n.id}>
                <p className="notice-list__title">{n.title}<span>{fmtShort(n.at)}</span></p>
                <p className="muted">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  )
}
