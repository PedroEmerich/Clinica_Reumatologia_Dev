import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, CalendarPlus, House, LogOut, UserRound } from 'lucide-react'
import { DemoBar } from '../components/DemoBar'
import { Logo } from '../components/Logo'
import { Modal } from '../components/Modal'
import { Avatar, Empty } from '../components/ui'
import { DEMO_PATIENT_ID } from '../data/seed'
import { fmtShort } from '../lib/date'
import { useStore } from '../lib/store'

const NAV = [
  { to: '/paciente', label: 'Início', icon: House, end: true },
  { to: '/paciente/agendar', label: 'Agendar', icon: CalendarPlus },
  { to: '/paciente/consultas', label: 'Consultas', icon: CalendarDays },
  { to: '/paciente/perfil', label: 'Perfil', icon: UserRound },
]

export function PatientLayout() {
  const { patient, db, markRead } = useStore()
  const me = patient(DEMO_PATIENT_ID)
  const nav = useNavigate()
  const [bell, setBell] = useState(false)
  const notices = db.notices.filter(n => n.to === 'paciente')
  const unread = notices.filter(n => !n.read).length

  return (
    <div className="pt">
      <DemoBar side="paciente" />
      <header className="pt__top">
        <div className="pt__top-inner">
          <Link to="/paciente" aria-label="Início"><Logo sub="Portal do paciente" /></Link>
          <nav className="pt__nav" aria-label="Principal">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.end} className="pt__navlink">{n.label}</NavLink>
            ))}
          </nav>
          <div className="pt__me">
            <button className="icon-btn icon-btn--bell" onClick={() => { setBell(true); markRead('paciente') }} aria-label={`Avisos${unread ? `, ${unread} novos` : ''}`}>
              <Bell size={20} />{unread > 0 && <span className="bell-dot">{unread}</span>}
            </button>
            <Link to="/paciente/perfil" className="pt__avatar" aria-label="Meu perfil"><Avatar name={me.name} size={38} tone="red" /></Link>
            <button className="icon-btn hide-sm" onClick={() => nav('/')} aria-label="Sair"><LogOut size={19} /></button>
          </div>
        </div>
      </header>

      <main className="pt__main"><Outlet /></main>

      <nav className="tabbar" aria-label="Principal">
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `tabbar__item${n.label === 'Agendar' ? ' tabbar__item--cta' : ''}${isActive ? ' is-on' : ''}`}>
            <n.icon size={22} strokeWidth={1.7} />
            <span>{n.label}</span>
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
