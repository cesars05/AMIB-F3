import { contextBridge, ipcRenderer } from 'electron'
import type { ApiAmib } from './api'

// Superficie mínima y explícita: la interfaz nunca recibe ipcRenderer ni Node.
const api: ApiAmib = {
  info: () => ipcRenderer.invoke('app:info')
}

contextBridge.exposeInMainWorld('amib', api)
