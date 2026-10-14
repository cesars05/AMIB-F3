import { describe, expect, it } from 'vitest'
import { dominioEstimado, dominioPorArea, dominioPorSubtema, erroresFrecuentes, estadoSubtema, evaluarNivel, indiceNivel, nivelDe } from './dominio'
import { DIA_MS, cuentaComoAcierto, semanaISO, type Intento, type ModoIntento } from './intentos'

const T0 = Date.UTC(2026, 8, 1, 12)
const dia = (n: number) => new Date(T0 + n * DIA_MS).toISOString()

function sesion(id: string, d: number, modo: ModoIntento, aciertos: number, total: number, extra: Partial<Intento> = {}): Intento[] {
  return Array.from({ length: total }, (_, k) => ({
    preguntaId: `${id}-${k}`,
    area: 'deuda',
    subtemaId: 'deuda.reporto',
    tipo: 'teoria' as const,
    dificultad: 3 as const,
    correcta: k < aciertos,
    tiempoMs: 50_000,
    modo,
    sesionId: id,
    fecha: dia(d),
    ...extra
  }))
}

describe('nivelDe', () => {
  it('sin intentos es sin-ver y con cualquier intento es visto', () => {
    expect(nivelDe([], new Date(T0))).toBe('sin-ver')
    expect(nivelDe(sesion('a', 0, 'practica', 1, 2), new Date(T0))).toBe('visto')
  })

  it('familiar exige al menos 4 preguntas con 80% y dificultad 3 o menos', () => {
    const ahora = new Date(T0 + DIA_MS)
    expect(nivelDe(sesion('a', 0, 'mini', 3, 3), ahora)).toBe('visto')
    expect(nivelDe(sesion('a', 0, 'mini', 4, 5), ahora)).toBe('familiar')
    expect(nivelDe(sesion('a', 0, 'mini', 3, 5), ahora)).toBe('visto')
    expect(nivelDe(sesion('a', 0, 'mini', 5, 5, { dificultad: 4 }), ahora)).toBe('visto')
    expect(nivelDe(sesion('a', 0, 'reto', 5, 5), ahora)).toBe('visto')
  })

  it('los aciertos adivinados no cuentan', () => {
    const i = sesion('a', 0, 'mini', 5, 5).map((x, k) => (k < 2 ? { ...x, confianza: 'adivine' as const } : x))
    expect(nivelDe(i, new Date(T0 + DIA_MS))).toBe('visto')
    expect(cuentaComoAcierto(i[0]!)).toBe(false)
  })

  it('competente exige otra sesión 2 días después con dificultad 3 o más', () => {
    const ahora = new Date(T0 + 4 * DIA_MS)
    const f = sesion('a', 0, 'mini', 5, 5)
    expect(nivelDe([...f, ...sesion('b', 1, 'practica', 5, 5)], ahora)).toBe('familiar')
    expect(nivelDe([...f, ...sesion('b', 2, 'practica', 5, 5, { dificultad: 2 })], ahora)).toBe('familiar')
    expect(nivelDe([...f, ...sesion('b', 2, 'practica', 5, 5, { dificultad: 4 })], ahora)).toBe('competente')
    expect(nivelDe([...f, ...sesion('b', 2, 'practica', 3, 5)], ahora)).toBe('familiar')
  })

  it('competente incluye cálculo cuando el subtema lo tiene', () => {
    const ahora = new Date(T0 + 4 * DIA_MS)
    const f = sesion('a', 0, 'mini', 5, 5).map((x, k) => (k === 0 ? { ...x, tipo: 'calculo' as const } : x))
    expect(nivelDe([...f, ...sesion('b', 2, 'practica', 5, 5)], ahora)).toBe('familiar')
    const b = sesion('b', 2, 'practica', 5, 5).map((x, k) => (k === 0 ? { ...x, tipo: 'calculo' as const } : x))
    expect(nivelDe([...f, ...b], ahora)).toBe('competente')
  })

  const base = [...sesion('a', 0, 'mini', 5, 5), ...sesion('b', 2, 'practica', 5, 5)]
  it('dominado exige 7 días, dificultad 4 o más, 80%, 74 s y sin pistas', () => {
    const ahora = new Date(T0 + 10 * DIA_MS)
    const reto = (d: number, extra: Partial<Intento> = {}, aciertos = 5) => sesion('c', d, 'reto', aciertos, 5, { dificultad: 4, ...extra })
    expect(nivelDe([...base, ...reto(9)], ahora)).toBe('dominado')
    expect(nivelDe([...base, ...reto(8)], ahora)).toBe('competente')
    expect(nivelDe([...base, ...reto(9, { tiempoMs: 80_000 })], ahora)).toBe('competente')
    expect(nivelDe([...base, ...reto(9, { conPistas: true })], ahora)).toBe('competente')
    expect(nivelDe([...base, ...reto(9, {}, 3)], ahora)).toBe('competente')
    expect(nivelDe([...base, ...reto(9, { dificultad: 3 })], ahora)).toBe('competente')
  })

  it('decae un nivel tras más de 21 días sin intentos y nunca baja de visto', () => {
    const todo = [...base, ...sesion('c', 9, 'reto', 5, 5, { dificultad: 4 })]
    expect(nivelDe(todo, new Date(T0 + 30 * DIA_MS))).toBe('dominado')
    const d = evaluarNivel(todo, new Date(T0 + 31 * DIA_MS))
    expect(d).toMatchObject({ nivel: 'competente', nivelBruto: 'dominado', decaidoPorOlvido: true })
    expect(nivelDe(sesion('a', 0, 'practica', 1, 1), new Date(T0 + 90 * DIA_MS))).toBe('visto')
  })

  it('una sesión reciente con menos de 50% baja un nivel (con al menos 3 preguntas)', () => {
    const f = sesion('a', 0, 'mini', 5, 5)
    const mala = sesion('m', 1, 'practica', 1, 4)
    const d = evaluarNivel([...f, ...mala], new Date(T0 + 2 * DIA_MS))
    expect(d).toMatchObject({ nivel: 'visto', nivelBruto: 'familiar', decaidoPorSesionMala: true })
    expect(nivelDe([...f, ...sesion('m', 1, 'practica', 0, 2)], new Date(T0 + 2 * DIA_MS))).toBe('familiar')
  })

  it('indiceNivel ordena los niveles', () => {
    expect(indiceNivel('dominado')).toBeGreaterThan(indiceNivel('visto'))
  })
})

describe('dominioEstimado', () => {
  it('sin datos es 0.5 con banda ancha', () => {
    const d = dominioEstimado([], new Date(T0))
    expect(d.media).toBe(0.5)
    expect(d.banda[1] - d.banda[0]).toBeGreaterThan(0.4)
  })
  it('más aciertos suben la media y estrechan la banda', () => {
    const pocos = dominioEstimado(sesion('a', 0, 'practica', 4, 5), new Date(T0))
    const muchos = dominioEstimado(sesion('a', 0, 'practica', 40, 50), new Date(T0))
    expect(muchos.media).toBeGreaterThan(0.7)
    expect(muchos.banda[1] - muchos.banda[0]).toBeLessThan(pocos.banda[1] - pocos.banda[0])
    expect(muchos.banda[0]).toBeGreaterThanOrEqual(0)
    expect(muchos.banda[1]).toBeLessThanOrEqual(1)
  })
  it('lo reciente pesa más que lo antiguo (vida media de 14 días)', () => {
    const viejo = sesion('v', 0, 'practica', 0, 10)
    const nuevo = sesion('n', 28, 'practica', 10, 10)
    const d = dominioEstimado([...viejo, ...nuevo], new Date(T0 + 28 * DIA_MS))
    expect(d.media).toBeGreaterThan(0.7)
    const sinPeso = dominioEstimado([...viejo, ...nuevo], new Date(T0 + 28 * DIA_MS), 1e9)
    expect(sinPeso.media).toBeCloseTo(0.5, 1)
  })
  it('un acierto adivinado vale la mitad', () => {
    const a = dominioEstimado(sesion('a', 0, 'practica', 10, 10, { confianza: 'adivine' }), new Date(T0))
    const b = dominioEstimado(sesion('a', 0, 'practica', 10, 10), new Date(T0))
    expect(a.media).toBeLessThan(b.media)
  })
  it('agrupa por área y por subtema', () => {
    const i = [...sesion('a', 0, 'practica', 3, 4), ...sesion('b', 0, 'practica', 1, 4, { area: 'etica', subtemaId: undefined })]
    expect(dominioPorArea(i, new Date(T0)).size).toBe(2)
    expect([...dominioPorSubtema(i, new Date(T0)).keys()]).toEqual(['deuda.reporto'])
  })
})

describe('estadoSubtema y errores', () => {
  it('resume intentos, tiempos, errores y adivinadas', () => {
    const i: Intento[] = [
      ...sesion('a', 0, 'practica', 0, 2, { etiquetaError: 'usa-365' }),
      ...sesion('b', 1, 'practica', 0, 1, { etiquetaError: 'limpio-sucio', preguntaId: 'z' }),
      ...sesion('c', 2, 'practica', 2, 2, { confianza: 'adivine', preguntaId: 'y' }),
      ...sesion('d', 2, 'practica', 1, 1, { preguntaId: 'w' })
    ]
    const e = estadoSubtema(i, new Date(T0 + 3 * DIA_MS))
    expect(e).toMatchObject({ intentos: 6, aciertos: 1, adivinadas: 2, tiempoPromedioMs: 50_000 })
    expect(e.erroresFrecuentes).toEqual([
      { etiqueta: 'usa-365', n: 2 },
      { etiqueta: 'limpio-sucio', n: 1 }
    ])
    expect(e.ultimaVez).toBe(dia(2))
    expect(e.banda[0]).toBeLessThan(e.dominio)
  })
  it('subtema sin intentos', () => {
    const e = estadoSubtema([], new Date(T0))
    expect(e).toMatchObject({ nivel: 'sin-ver', intentos: 0, tiempoPromedioMs: null, ultimaVez: null })
  })
  it('limita a los 3 errores más frecuentes', () => {
    const i = ['a', 'b', 'c', 'd'].flatMap((e, k) => sesion(`s${e}`, 0, 'practica', 0, k + 1, { etiquetaError: e, preguntaId: e }))
    expect(erroresFrecuentes(i)).toHaveLength(3)
    expect(erroresFrecuentes(i)[0]!.etiqueta).toBe('d')
  })
})

describe('semanaISO', () => {
  it('calcula la semana ISO', () => {
    expect(semanaISO('2026-01-01T10:00:00Z')).toBe('2026-W01')
    expect(semanaISO('2026-10-14T10:00:00Z')).toBe('2026-W42')
    expect(semanaISO('2021-01-03T10:00:00Z')).toBe('2020-W53')
  })
  it('rechaza fechas inválidas', () => {
    expect(() => semanaISO('no')).toThrow(RangeError)
  })
})
