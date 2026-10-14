import { contextBridge, ipcRenderer } from 'electron'
import type { ApiAmib } from './api'

// Superficie mínima y explícita: la interfaz nunca recibe ipcRenderer ni Node.
// Solo los canales del ADR-002 (más respaldo y sesiones); cada uno se valida de nuevo en el proceso principal.
const api: ApiAmib = {
  info: () => ipcRenderer.invoke('app:info'),
  contenido: {
    resumen: () => ipcRenderer.invoke('contenido:resumen'),
    leccion: (id) => ipcRenderer.invoke('contenido:leccion', id),
    preguntas: (ids) => ipcRenderer.invoke('contenido:preguntas', ids)
  },
  estudio: {
    seleccionar: (e) => ipcRenderer.invoke('estudio:seleccionar', e),
    simulacro: (e) => ipcRenderer.invoke('estudio:simulacro', e)
  },
  intentos: {
    registrar: (intentos) => ipcRenderer.invoke('intentos:registrar', intentos)
  },
  perfil: {
    obtener: () => ipcRenderer.invoke('perfil:obtener')
  },
  plan: {
    hoy: () => ipcRenderer.invoke('plan:hoy')
  },
  ajustes: {
    obtener: () => ipcRenderer.invoke('ajustes:obtener'),
    guardar: (a) => ipcRenderer.invoke('ajustes:guardar', a)
  },
  notas: {
    obtener: (e) => ipcRenderer.invoke('notas:obtener', e),
    guardar: (e) => ipcRenderer.invoke('notas:guardar', e)
  },
  sesiones: {
    registrar: (e) => ipcRenderer.invoke('sesiones:registrar', e)
  },
  respaldo: {
    exportar: () => ipcRenderer.invoke('respaldo:exportar'),
    importar: () => ipcRenderer.invoke('respaldo:importar')
  }
}

contextBridge.exposeInMainWorld('amib', api)
