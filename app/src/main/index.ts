import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, dialog, ipcMain, shell, session } from 'electron'
import { cargarContenido, resolverRaizContenido } from './contenido-loader'
import { abrirBaseDeDatos } from './db'
import { registrarIpc, type Dialogos, type EventoIpc } from './ipc'
import { remitenteConfiable } from './ipc-esquemas'
import { crearServicios } from './servicios'
import type { InfoApp } from '../preload/api'

const __dirname = dirname(fileURLToPath(import.meta.url))

let db: ReturnType<typeof abrirBaseDeDatos> | undefined

function ventanaDe(ev: EventoIpc): BrowserWindow | null {
  const wc = ev.sender as Electron.WebContents | undefined
  return wc ? BrowserWindow.fromWebContents(wc) : null
}

const dialogos: Dialogos = {
  async guardar(ev, nombreSugerido) {
    const opciones: Electron.SaveDialogOptions = { title: 'Exportar respaldo del progreso', defaultPath: nombreSugerido, filters: [{ name: 'Respaldo AMIB F3', extensions: ['json'] }] }
    const win = ventanaDe(ev)
    const r = win ? await dialog.showSaveDialog(win, opciones) : await dialog.showSaveDialog(opciones)
    return r.canceled || !r.filePath ? null : r.filePath
  },
  async abrir(ev) {
    const opciones: Electron.OpenDialogOptions = { title: 'Importar respaldo del progreso', properties: ['openFile'], filters: [{ name: 'Respaldo AMIB F3', extensions: ['json'] }] }
    const win = ventanaDe(ev)
    const r = win ? await dialog.showOpenDialog(win, opciones) : await dialog.showOpenDialog(opciones)
    return r.canceled || r.filePaths.length === 0 ? null : r.filePaths[0]!
  },
  async confirmarReemplazo(ev) {
    const opciones: Electron.MessageBoxOptions = {
      type: 'warning',
      buttons: ['Reemplazar mi progreso', 'Cancelar'],
      defaultId: 1,
      cancelId: 1,
      title: 'Importar respaldo',
      message: 'El respaldo reemplazará todo el progreso actual (intentos, notas y ajustes).',
      detail: 'Esta acción no se puede deshacer. Exporta un respaldo primero si dudas.'
    }
    const win = ventanaDe(ev)
    const r = win ? await dialog.showMessageBox(win, opciones) : await dialog.showMessageBox(opciones)
    return r.response === 0
  }
}

function crearVentana(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#ffffff',
    title: 'AMIB F3',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })
  win.once('ready-to-show', () => win.show())

  // Seguridad: la interfaz es una sola página; cualquier navegación distinta de la actual se bloquea.
  win.webContents.on('will-navigate', (e, url) => {
    if (url !== win.webContents.getURL()) e.preventDefault()
  })
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  else void win.loadFile(join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, _permiso, cb) => cb(false))
  db = abrirBaseDeDatos(join(app.getPath('userData'), 'amib.db'))

  const raiz = resolverRaizContenido({ empaquetado: app.isPackaged, recursos: process.resourcesPath, raizApp: app.getAppPath(), entorno: process.env['AMIB_CONTENT_DIR'] })
  const contenido = cargarContenido(raiz, (m) => console.warn(`[contenido] ${m}`))
  const servicios = crearServicios({ db, contenido })

  registrarIpc(ipcMain, {
    servicios,
    urlDev: process.env['ELECTRON_RENDERER_URL'],
    dialogos,
    info: (): InfoApp => ({
      version: app.getVersion(),
      electron: process.versions.electron,
      node: process.versions.node,
      esquemaDb: Number((db!.prepare('PRAGMA user_version').get() as { user_version: number }).user_version)
    })
  })

  // Defensa en profundidad: la sesión solo acepta contenido de la propia app (el permiso de red ya está cerrado por la CSP).
  session.defaultSession.webRequest.onBeforeRequest((detalles, cb) => {
    const u = detalles.url
    const permitido = u.startsWith('file://') || u.startsWith('devtools://') || u.startsWith('data:') || remitenteConfiable(u, process.env['ELECTRON_RENDERER_URL']) || u.startsWith('ws://localhost')
    cb({ cancel: !permitido })
  })

  crearVentana()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
})

app.on('window-all-closed', () => {
  db?.close()
  if (process.platform !== 'darwin') app.quit()
})
