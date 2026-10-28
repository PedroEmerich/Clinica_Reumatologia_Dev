import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: ReactNode
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}

// Folha inferior no celular, janela centralizada no desktop
export function Modal({ open, onClose, title, eyebrow, children, footer, wide }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.documentElement.classList.add('no-scroll')
    ref.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('no-scroll')
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal__panel${wide ? ' modal__panel--wide' : ''}`} role="dialog" aria-modal="true" tabIndex={-1} ref={ref}>
        <header className="modal__head">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 className="modal__title">{title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>
  )
}
