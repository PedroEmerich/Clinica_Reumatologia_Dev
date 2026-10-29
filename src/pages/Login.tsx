import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { Logo } from '../components/Logo'
import { useToast } from '../components/Toast'
import { STAFF } from '../data/seed'
import { ROLES } from '../lib/roles'
import { useStore } from '../lib/store'

const DEMO_ACCOUNTS = STAFF.filter(u => ['u1', 'u2', 'u3'].includes(u.id))

export function Login() {
  const { role } = useParams()
  const staff = role === 'equipe'
  const nav = useNavigate()
  const toast = useToast()
  const { login } = useStore()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0].email)
  const [password, setPassword] = useState('demonstracao')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (staff) {
      const res = login(email, password)
      if (!res.ok) { setError(res.error); return }
      setLoading(true)
      setTimeout(() => { nav('/equipe'); toast(`Bem-vindo(a), ${res.user.name.replace(/^Dra?\. /, '').split(' ')[0]} · ${ROLES[res.user.role].label}`, 'info') }, 500)
      return
    }
    setLoading(true)
    setTimeout(() => nav('/paciente'), 650)
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
          <p className="muted">
            {staff
              ? 'O que aparece depois do login depende do cargo cadastrado para o seu e-mail.'
              : 'Na demonstração os campos já vêm preenchidos. É só entrar.'}
          </p>

          <label className="field">
            <span>{staff ? 'E-mail' : 'CPF'}</span>
            {staff
              ? <input type="email" autoComplete="username" value={email} onChange={e => { setEmail(e.target.value); setError('') }} required />
              : <input defaultValue="123.456.789-09" inputMode="numeric" />}
          </label>
          <label className="field">
            <span>Senha</span>
            <span className="field__wrap">
              <input type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => { setPassword(e.target.value); setError('') }} />
              <button type="button" className="field__icon" onClick={() => setShow(s => !s)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="btn btn--primary btn--block" disabled={loading}>
            {loading ? 'Entrando…' : <>Entrar <ArrowRight size={18} /></>}
          </button>

          <div className="login__links">
            <button type="button" onClick={() => toast('Na versão final, enviamos um link de recuperação por e-mail ou WhatsApp.', 'info')}>Esqueci minha senha</button>
            {!staff && <button type="button" onClick={() => toast('Na versão final, o primeiro acesso é feito com CPF e código por WhatsApp.', 'info')}>Primeiro acesso</button>}
          </div>

          {staff && (
            <div className="demo-accounts">
              <p className="eyebrow">Contas de demonstração</p>
              {DEMO_ACCOUNTS.map(u => (
                <button type="button" key={u.id} className={`demo-account${email === u.email ? ' is-on' : ''}`} onClick={() => { setEmail(u.email); setPassword('demonstracao'); setError('') }}>
                  <b>{ROLES[u.role].label}</b>
                  <small>{u.email}</small>
                </button>
              ))}
              <p className="muted small">Senha de todas: <code>demonstracao</code></p>
            </div>
          )}

          <p className="login__secure"><LockKeyhole size={14} /> Dados de saúde protegidos conforme a LGPD.</p>
        </form>
      </main>
    </div>
  )
}
