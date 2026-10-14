import { describe, expect, it } from 'vitest'
import {
  AJUSTES_POR_OMISION,
  CLAVES_AJUSTE,
  EsquemaGuardarAjuste,
  EsquemaIntento,
  EsquemaNotaGuardar,
  EsquemaPreguntaIds,
  EsquemaRegistrarIntentos,
  EsquemaSeleccionar,
  EsquemaSimulacro,
  EsquemaSesion,
  remitenteConfiable
} from './ipc-esquemas'

describe('entrada de estudio:seleccionar', () => {
  it('acepta filtros válidos', () => {
    expect(EsquemaSeleccionar.safeParse({ n: 10, filtro: { areas: ['deuda'], tipo: 'calculo', dificultadMin: 2 } }).success).toBe(true)
  })
  it('rechaza áreas desconocidas, n fuera de rango y claves extra', () => {
    expect(EsquemaSeleccionar.safeParse({ n: 10, filtro: { areas: ['x'] } }).success).toBe(false)
    expect(EsquemaSeleccionar.safeParse({ n: 0 }).success).toBe(false)
    expect(EsquemaSeleccionar.safeParse({ n: 211 }).success).toBe(false)
    expect(EsquemaSeleccionar.safeParse({ n: 5, extra: 1 }).success).toBe(false)
  })
})

describe('entrada de estudio:simulacro', () => {
  it('el módulo exige área', () => {
    expect(EsquemaSimulacro.safeParse({ tipo: 'modulo' }).success).toBe(false)
    expect(EsquemaSimulacro.safeParse({ tipo: 'modulo', area: 'etica' }).success).toBe(true)
    expect(EsquemaSimulacro.safeParse({ tipo: 'rapido' }).success).toBe(true)
    expect(EsquemaSimulacro.safeParse({ tipo: 'otro' }).success).toBe(false)
  })
})

describe('entrada de intentos:registrar', () => {
  const base = { preguntaId: 'tipo.01', respuesta: 2, tiempoMs: 5000, modo: 'practica', sesionId: 's-1' }
  it('acepta un intento válido y rechaza datos mal formados', () => {
    expect(EsquemaIntento.safeParse(base).success).toBe(true)
    expect(EsquemaIntento.safeParse({ ...base, respuesta: 4 }).success).toBe(false)
    expect(EsquemaIntento.safeParse({ ...base, tiempoMs: -1 }).success).toBe(false)
    expect(EsquemaIntento.safeParse({ ...base, modo: 'hackeo' }).success).toBe(false)
    expect(EsquemaIntento.safeParse({ ...base, preguntaId: '../../etc/passwd' }).success).toBe(false)
    expect(EsquemaIntento.safeParse({ ...base, correcta: true }).success).toBe(false)
  })
  it('exige al menos un intento y un máximo razonable', () => {
    expect(EsquemaRegistrarIntentos.safeParse([]).success).toBe(false)
    expect(EsquemaRegistrarIntentos.safeParse(Array(301).fill(base)).success).toBe(false)
    expect(EsquemaRegistrarIntentos.safeParse([base]).success).toBe(true)
  })
})

describe('ajustes', () => {
  it('cada clave tiene valor por omisión y esquema', () => {
    for (const k of CLAVES_AJUSTE) expect(k in AJUSTES_POR_OMISION).toBe(true)
  })
  it('valida el valor según la clave', () => {
    expect(EsquemaGuardarAjuste.safeParse({ clave: 'tema', valor: 'terminal' }).success).toBe(true)
    expect(EsquemaGuardarAjuste.safeParse({ clave: 'tema', valor: 'neon' }).success).toBe(false)
    expect(EsquemaGuardarAjuste.safeParse({ clave: 'fechaExamen', valor: '2026-11-29' }).success).toBe(true)
    expect(EsquemaGuardarAjuste.safeParse({ clave: 'fechaExamen', valor: '2026-13-45' }).success).toBe(false)
    expect(EsquemaGuardarAjuste.safeParse({ clave: 'minutosDia', valor: 5 }).success).toBe(false)
    expect(EsquemaGuardarAjuste.safeParse({ clave: 'autoevaluacion', valor: { deuda: 'nunca' } }).success).toBe(true)
    expect(EsquemaGuardarAjuste.safeParse({ clave: 'autoevaluacion', valor: { deuda: 'quizá' } }).success).toBe(false)
  })
  it('rechaza claves fuera de la lista blanca', () => {
    expect(EsquemaGuardarAjuste.safeParse({ clave: '__proto__', valor: 1 }).success).toBe(false)
    expect(EsquemaGuardarAjuste.safeParse({ clave: 'rutaArbitraria', valor: '/etc' }).success).toBe(false)
  })
})

describe('otras entradas', () => {
  it('ids de preguntas', () => {
    expect(EsquemaPreguntaIds.safeParse(['tipo.01', 'g.deuda.12']).success).toBe(true)
    expect(EsquemaPreguntaIds.safeParse(['con espacio']).success).toBe(false)
  })
  it('notas con límite de tamaño', () => {
    expect(EsquemaNotaGuardar.safeParse({ leccionId: 'd.cetes', laminaId: 'que-es', texto: 'hola' }).success).toBe(true)
    expect(EsquemaNotaGuardar.safeParse({ leccionId: 'd.cetes', laminaId: 'que-es', texto: 'x'.repeat(20001) }).success).toBe(false)
  })
  it('sesiones con fechas ISO', () => {
    expect(EsquemaSesion.safeParse({ id: 's1', modo: 'simulacro', inicio: '2026-10-14T10:00:00.000Z' }).success).toBe(true)
    expect(EsquemaSesion.safeParse({ id: 's1', modo: 'simulacro', inicio: 'ayer' }).success).toBe(false)
  })
})

describe('remitenteConfiable', () => {
  it('solo acepta archivos locales o la URL de desarrollo', () => {
    expect(remitenteConfiable('file:///app/out/renderer/index.html', undefined)).toBe(true)
    expect(remitenteConfiable('https://evil.example/', undefined)).toBe(false)
    expect(remitenteConfiable('http://localhost:5173/', 'http://localhost:5173')).toBe(true)
    expect(remitenteConfiable('http://localhost:5173.evil.com/', 'http://localhost:5173')).toBe(false)
    expect(remitenteConfiable('', undefined)).toBe(false)
  })
})
