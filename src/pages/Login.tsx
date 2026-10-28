import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { Logo } from '../components/Logo'
import { useToast } from '../components/Toast'

export function Login() {
  const { role } = useParams()
  const staff = role === 'equipe'
  const nav = useNavigate()
  const toast = useToast()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => nav(staff ? '/equipe' : '/paciente'), 650)
  }

  return (
    <div className={`login${staff ? ' login--staff' : ''}`}>
      <aside className="login__art">
        <Logo sub={staff ? 'Área da equipe' : 'Portal do paciente'} />
        <blockquote>
          {staff
            ? <>A agenda inteira da clínica, <em>organizada</em> em uma tela.</>
            : <>Cuidado preciso para uma vida <em>em movimento</em>.</>}
        </blockquote>
        <p className="login__art-foot">Creass · Mogi das Cruzes</p>
      </aside>

      <main className="login__main">
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Voltar</Link>
        <form className="login__form" onSubmit={submit}>
          <p className="eyebrow">{staff ? 'Área da equipe' : 'Portal do paciente'}</p>
          <h1 className="page-title">{staff ? <>Bom trabalho, <em>equipe</em>.</> : <>Que bom te <em>ver</em>.</>}</h1>
          <p className="muted">Na demonstração os campos já vêm preenchidos. É só entrar.</p>

          <label className="field">
            <span>{staff ? 'E-mail corporativo' : 'CPF'}</span>
            <input defaultValue={staff ? 'recepcao@creass.com.br' : '123.456.789-09'} inputMode={staff ? 'email' : 'numeric'} />
          </label>
          <label className="field">
            <span>Senha</span>
            <span className="field__wrap">
              <input type={show ? 'text' : 'password'} defaultValue="demonstracao" />
              <button type="button" className="field__icon" onClick={() => setShow(s => !s)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {staff && (
            <label className="field">
              <span>Perfil de acesso</span>
              <select defaultValue="recepcao">
                <option value="recepcao">Recepção</option>
                <option value="medico">Corpo clínico</option>
                <option value="gestao">Gestão</option>
              </select>
            </label>
          )}

          <button className="btn btn--primary btn--block" disabled={loading}>
            {loading ? 'Entrando…' : <>Entrar <ArrowRight size={18} /></>}
          </button>

          <div className="login__links">
            <button type="button" onClick={() => toast('Na versão final, enviamos um link de recuperação por e-mail ou WhatsApp.', 'info')}>Esqueci minha senha</button>
            {!staff && <button type="button" onClick={() => toast('Na versão final, o primeiro acesso é feito com CPF e código por WhatsApp.', 'info')}>Primeiro acesso</button>}
          </div>
          <p className="login__secure"><LockKeyhole size={14} /> Dados de saúde protegidos conforme a LGPD.</p>
        </form>
      </main>
    </div>
  )
}
