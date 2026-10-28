// Símbolo provisório de vértebras (o mesmo da landing page)
export function Mark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7.5" fill="var(--red)" />
      <g fill="#fff" transform="translate(16 16) scale(.82) translate(-16 -16)">
        <rect opacity=".6" x="9.07" y="3.6" width="15.46" height="1.3" rx=".65" />
        <rect x="13.1" y="2.84" width="7.39" height="3.53" rx="1.62" />
        <rect opacity=".6" x="7.58" y="9.2" width="16.84" height="1.3" rx=".65" />
        <rect x="11.97" y="8.28" width="8.05" height="3.84" rx="1.77" />
        <rect opacity=".6" x="6.29" y="14.8" width="18.22" height="1.3" rx=".65" />
        <rect x="11.04" y="13.72" width="8.71" height="4.16" rx="1.91" />
        <rect opacity=".6" x="6" y="20.4" width="19.6" height="1.3" rx=".65" />
        <rect x="11.11" y="19.16" width="9.37" height="4.47" rx="2.06" />
        <rect opacity=".6" x="6.11" y="26.2" width="20.98" height="1.3" rx=".65" />
        <rect x="11.58" y="24.81" width="10.03" height="4.79" rx="2.2" />
      </g>
    </svg>
  )
}

export function Logo({ sub = 'Reumatologia & Especialidades' }: { sub?: string }) {
  return (
    <span className="logo">
      <Mark />
      <span className="logo__text">
        <span className="logo__name">Creass</span>
        <span className="logo__sub">{sub}</span>
      </span>
    </span>
  )
}
