import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import { StoreProvider } from './lib/store'
import { Entry } from './pages/Entry'
import { Login } from './pages/Login'
import { Booking } from './patient/Booking'
import { MyAppointments } from './patient/MyAppointments'
import { PatientHome } from './patient/PatientHome'
import { PatientLayout } from './patient/PatientLayout'
import { Profile } from './patient/Profile'
import { Agenda } from './staff/Agenda'
import { Dashboard } from './staff/Dashboard'
import { Patients } from './staff/Patients'
import { Requests } from './staff/Requests'
import { StaffLayout } from './staff/StaffLayout'
import { RequirePage } from './staff/RequirePage'
import { Team } from './staff/Team'
import { Reports } from './staff/Reports'
import { Users } from './staff/Users'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// Recomeça o fluxo quando muda o parâmetro (ex.: remarcar outra consulta)
function BookingRoute() {
  const { search } = useLocation()
  return <Booking key={search} />
}

// HashRouter: as rotas funcionam no GitHub Pages sem configuração de servidor
export function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <HashRouter>
          <ScrollTop />
          <Routes>
            <Route path="/" element={<Entry />} />
            <Route path="/entrar/:role" element={<Login />} />
            <Route path="/paciente" element={<PatientLayout />}>
              <Route index element={<PatientHome />} />
              <Route path="agendar" element={<BookingRoute />} />
              <Route path="consultas" element={<MyAppointments />} />
              <Route path="perfil" element={<Profile />} />
            </Route>
            <Route path="/equipe" element={<StaffLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="agenda" element={<RequirePage page="agenda"><Agenda /></RequirePage>} />
              <Route path="solicitacoes" element={<RequirePage page="solicitacoes"><Requests /></RequirePage>} />
              <Route path="pacientes" element={<RequirePage page="pacientes"><Patients /></RequirePage>} />
              <Route path="profissionais" element={<RequirePage page="profissionais"><Team /></RequirePage>} />
              <Route path="relatorios" element={<RequirePage page="relatorios"><Reports /></RequirePage>} />
              <Route path="usuarios" element={<RequirePage page="usuarios"><Users /></RequirePage>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  )
}
