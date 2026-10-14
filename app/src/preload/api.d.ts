export interface InfoApp {
  version: string
  electron: string
  node: string
  esquemaDb: number
}

export interface ApiAmib {
  info(): Promise<InfoApp>
}

declare global {
  interface Window {
    amib: ApiAmib
  }
}
