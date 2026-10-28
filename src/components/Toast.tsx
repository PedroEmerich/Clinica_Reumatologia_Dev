import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CircleCheck, Info } from 'lucide-react'

interface Toast { id: number; text: string; tone: 'ok' | 'info' }
const Ctx = createContext<(text: string, tone?: Toast['tone']) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const push = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random()
    setItems(t => [...t, { id, text, tone }])
    setTimeout(() => setItems(t => t.filter(x => x.id !== id)), 3600)
  }, [])
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map(t => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            {t.tone === 'ok' ? <CircleCheck size={18} /> : <Info size={18} />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
