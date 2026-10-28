import { Link } from 'react-router-dom'
import { RotateCcw, Repeat } from 'lucide-react'
import { useStore } from '../lib/store'
import { useToast } from './Toast'

export function DemoBar({ side }: { side: 'paciente' | 'equipe' }) {
  const { reset } = useStore()
  const toast = useToast()
  const other = side === 'paciente' ? 'equipe' : 'paciente'
  return (
    <div className="demobar">
      <span className="demobar__tag">Demonstração</span>
      <span className="demobar__text">Dados fictícios, salvos só neste navegador.</span>
      <span className="demobar__actions">
        <Link to={`/${other}`} className="demobar__btn"><Repeat size={14} /> Ver como {other === 'equipe' ? 'equipe' : 'paciente'}</Link>
        <button className="demobar__btn" onClick={() => { reset(); toast('Dados da demonstração restaurados', 'info') }}><RotateCcw size={14} /> Restaurar</button>
      </span>
    </div>
  )
}
