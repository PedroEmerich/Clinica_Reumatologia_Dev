import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, Inbox, LayoutDashboard, LogOut, Stethoscope, Users } from 'lucide-react'
import { DemoBar } from '../components/DemoBar'
import { Logo } from '../components/Logo'
import { Modal } from '../components/Modal'
import { Avatar, Empty } from '../components/ui'
import { fmtShort, todayISO } from '../lib/date'
import { useStore } from '../lib/store'

export function StaffLayout() {
  const { db, markRead } = useStore()
  const nav = useNavigate()
  const [bell, setBell] = useState(false)
  const pending = db.appointments.filter(a => a.status === 'pendente' && a.date >= todayISO()).length
  const notices = db.notices.filter(n => n.to === 'equipe')
  const unread = notices.filter(n => !n.read).length

  const NAV = [
    { to: '/equipe', label: 'Painel', icon: LayoutDashboard, end: true },
    { to: '/equipe/agenda', label: 'Agenda', icon: CalendarDays },
    { to: '/equipe/solicitacoes', label: 'Solicitações', short: 'Pedidos', icon: Inbox, badge: pending },
    { to: '/equipe/pacientes', label: 'Pacientes', icon: Users },
    { to: '/equipe/profissionais', label: 'Profissionais', short: 'Equipe', icon: Stethoscope },
  ]

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
            <Avatar name="Juliana Prado" size={36} tone="red" />
            <span className="grow"><b>Juliana Prado</b><small>Recepção</small></span>
            <button className="icon-btn" onClick={() => nav('/')} aria-label="Sair"><LogOut size={18} /></button>
          </div>
        </aside>

        <div className="st__content">
          <header className="st__top">
            <span className="st__top-logo"><Logo sub="Área da equipe" /></span>
            <span className="st__top-date">{fmtShort(todayISO())}</span>
            <button className="icon-btn icon-btn--bell" onClick={() => { setBell(true); markRead('equipe') }} aria-label={`Avisos${unread ? `, ${unread} novos` : ''}`}>
              <Bell size={20} />{unread > 0 && <span className="bell-dot">{unread}</span>}
            </button>
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
