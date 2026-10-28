import { Link } from 'react-router-dom'
import { ArrowRight, CalendarHeart, ClipboardList, MapPin } from 'lucide-react'
import { Logo } from '../components/Logo'
import { CLINIC, isOpenNow } from '../data/clinic'

export function Entry() {
  const status = isOpenNow()
  return (
    <div className="entry">
      <header className="entry__top">
        <Logo />
        <span className={`open-pill${status.open ? ' is-open' : ''}`}><i />{status.label}</span>
      </header>

      <main className="entry__main">
        <p className="eyebrow"><span className="eyebrow__num">00</span>Portal Creass · versão demonstrativa</p>
        <h1 className="entry__title">Agendar, acompanhar e cuidar — <em>em um só lugar</em>.</h1>
        <p className="entry__lead">
          Um portal com duas faces: o paciente marca e acompanha as consultas pelo celular, e a equipe da clínica organiza a agenda, a recepção e os profissionais.
        </p>

        <div className="entry__cards">
          <Link to="/entrar/paciente" className="role-card role-card--patient">
            <span className="role-card__num">01</span>
            <CalendarHeart size={30} strokeWidth={1.5} />
            <h2>Sou <em>paciente</em></h2>
            <p>Agende consultas, confirme presença, responda a pré-consulta e veja seu histórico.</p>
            <span className="role-card__go">Entrar como paciente <ArrowRight size={18} /></span>
          </Link>
          <Link to="/entrar/equipe" className="role-card role-card--staff">
            <span className="role-card__num">02</span>
            <ClipboardList size={30} strokeWidth={1.5} />
            <h2>Sou da <em>equipe</em></h2>
            <p>Recepção e corpo clínico: agenda do dia, fila de atendimento, solicitações, pacientes e horários.</p>
            <span className="role-card__go">Entrar como equipe <ArrowRight size={18} /></span>
          </Link>
        </div>

        <p className="entry__tip">
          Dica para a apresentação: abra o paciente e a equipe em duas abas lado a lado. Um agendamento feito pelo paciente aparece na hora para a recepção.
        </p>
      </main>

      <footer className="entry__foot">
        <span><MapPin size={14} /> {CLINIC.address} · {CLINIC.city}</span>
        <a href={CLINIC.landing} target="_blank" rel="noreferrer">Ver o site da clínica ↗</a>
      </footer>
    </div>
  )
}
