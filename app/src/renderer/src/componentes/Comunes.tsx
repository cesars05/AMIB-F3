import type { ReactNode } from 'react'
import type { Nivel } from '@core/dominio'
import { ETIQUETA_NIVEL } from '../lib/formato'

export function Insignia({ nivel }: { nivel: Nivel }) {
  return (
    <span className="insignia" data-nivel={nivel}>
      {ETIQUETA_NIVEL[nivel]}
    </span>
  )
}

export function Obligatoria() {
  return <span className="insignia obl">Obligatoria</span>
}

export function EstadoVacio({ titulo, texto, children, icono = 'grafica' }: { titulo: string; texto: string; children?: ReactNode; icono?: 'grafica' | 'libro' | 'lupa' }) {
  return (
    <div className="vacio" role="status">
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icono === 'grafica' && (
          <>
            <path d="M6 38V6" />
            <path d="M6 38h32" />
            <path d="M13 30l7-9 6 5 9-13" />
          </>
        )}
        {icono === 'libro' && (
          <>
            <path d="M8 8h13a3 3 0 0 1 3 3v26a3 3 0 0 0-3-3H8z" />
            <path d="M36 8H23" />
            <path d="M36 8v26H26" />
          </>
        )}
        {icono === 'lupa' && (
          <>
            <circle cx="19" cy="19" r="11" />
            <path d="M28 28l10 10" />
          </>
        )}
      </svg>
      <strong>{titulo}</strong>
      <p>{texto}</p>
      {children}
    </div>
  )
}

export function Cargando({ texto = 'Cargando' }: { texto?: string }) {
  return (
    <p className="tenue" role="status">
      {texto}…
    </p>
  )
}

export function BarraProgreso({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  const v = Math.min(1, Math.max(0, valor))
  return (
    <div className="barra-progreso" role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)}>
      <b style={{ transform: `scaleX(${v})` }} />
    </div>
  )
}
