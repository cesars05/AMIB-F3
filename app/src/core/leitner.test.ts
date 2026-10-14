import { describe, expect, it } from 'vitest'
import { INTERVALOS_DIAS, actualizarCaja, cajasDesdeIntentos, estaVencida, proximaRevision, vencidas } from './leitner'
import { DIA_MS, type Intento } from './intentos'

const T0 = Date.UTC(2026, 8, 1)
const d = (n: number) => new Date(T0 + n * DIA_MS)

describe('Leitner', () => {
  it('los intervalos son 1, 2, 4, 8 y 16 días', () => {
    expect([...INTERVALOS_DIAS]).toEqual([1, 2, 4, 8, 16])
  })
  it('acierto sube de caja hasta 5 y error vuelve a la 1', () => {
    let it = actualizarCaja('q', undefined, true, d(0))
    expect(it.caja).toBe(2)
    for (let k = 1; k < 8; k++) it = actualizarCaja('q', it, true, d(k))
    expect(it.caja).toBe(5)
    expect(actualizarCaja('q', it, false, d(9)).caja).toBe(1)
    expect(actualizarCaja('q', undefined, false, d(0)).caja).toBe(1)
  })
  it('calcula la próxima revisión y el vencimiento', () => {
    const it = { id: 'q', caja: 3 as const, ultimaRevision: d(0).toISOString() }
    expect(proximaRevision(it).getTime()).toBe(d(4).getTime())
    expect(estaVencida(it, d(3))).toBe(false)
    expect(estaVencida(it, d(4))).toBe(true)
  })
  it('vencidas ordena de la más atrasada a la menos', () => {
    const items = [
      { id: 'b', caja: 1 as const, ultimaRevision: d(5).toISOString() },
      { id: 'a', caja: 1 as const, ultimaRevision: d(0).toISOString() },
      { id: 'c', caja: 5 as const, ultimaRevision: d(5).toISOString() },
      { id: 'a2', caja: 1 as const, ultimaRevision: d(0).toISOString() }
    ]
    expect(vencidas(items, d(7)).map((x) => x.id)).toEqual(['a', 'a2', 'b'])
  })
  it('reconstruye cajas desde intentos (adivine no cuenta como acierto)', () => {
    const base = { area: 'deuda', tipo: 'teoria', modo: 'practica', sesionId: 's', tiempoMs: 1 } as const
    const intentos: Intento[] = [
      { ...base, preguntaId: 'q1', correcta: true, fecha: d(1).toISOString() },
      { ...base, preguntaId: 'q1', correcta: true, fecha: d(0).toISOString() },
      { ...base, preguntaId: 'q2', correcta: true, confianza: 'adivine', fecha: d(0).toISOString() }
    ]
    const m = cajasDesdeIntentos(intentos)
    expect(m.get('q1')).toMatchObject({ caja: 3, ultimaRevision: d(1).toISOString() })
    expect(m.get('q2')!.caja).toBe(1)
  })
})
