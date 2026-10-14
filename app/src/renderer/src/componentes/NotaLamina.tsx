import { useEffect, useRef, useState } from 'react'
import { mensajeError } from '../lib/formato'

type Estado = 'cargando' | 'listo' | 'guardando' | 'guardado' | 'error'

/** Nota personal de una lámina: se carga por IPC y se guarda sola con un retardo breve (y al salir de la lámina). */
export function NotaLamina({ leccionId, laminaId }: { leccionId: string; laminaId: string }) {
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<Estado>('cargando')
  const [error, setError] = useState<string | null>(null)
  const pendiente = useRef<string | null>(null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  const guardar = async (valor: string) => {
    pendiente.current = null
    setEstado('guardando')
    try {
      await window.amib.notas.guardar({ leccionId, laminaId, texto: valor })
      setEstado('guardado')
      setError(null)
    } catch (e) {
      setEstado('error')
      setError(mensajeError(e))
    }
  }

  useEffect(() => {
    let vivo = true
    window.amib.notas
      .obtener({ leccionId, laminaId })
      .then((t) => {
        if (!vivo) return
        setTexto(t)
        setEstado('listo')
      })
      .catch((e) => {
        if (!vivo) return
        setEstado('error')
        setError(mensajeError(e))
      })
    return () => {
      vivo = false
      if (temporizador.current) clearTimeout(temporizador.current)
      // Al cambiar de lámina o salir, lo pendiente se guarda sin esperar.
      if (pendiente.current !== null) void window.amib.notas.guardar({ leccionId, laminaId, texto: pendiente.current }).catch(() => undefined)
    }
  }, [leccionId, laminaId])

  const alEscribir = (valor: string) => {
    setTexto(valor)
    pendiente.current = valor
    setEstado('guardando')
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => void guardar(valor), 500)
  }

  const mensaje = estado === 'guardando' ? 'Guardando' : estado === 'guardado' ? 'Guardado' : estado === 'error' ? `No se pudo guardar: ${error ?? ''}` : texto ? 'Guardado' : 'Sin nota todavía'
  return (
    <section aria-label="Mis notas de esta lámina">
      <h3>Mis notas de esta lámina</h3>
      <textarea aria-label="Nota personal de la lámina" value={texto} disabled={estado === 'cargando'} placeholder="Escribe aquí tu nota. Se guarda sola." onChange={(e) => alEscribir(e.target.value)} data-testid="nota-texto" />
      <small role="status" data-testid="nota-estado">
        {mensaje}
      </small>
    </section>
  )
}
