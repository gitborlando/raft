import { makeAutoObservable } from 'mobx'
import type { RootStore } from './RootStore'

type ToastState = {
  id: number
  message: string
}

function readNumber(key: string, fallback: number): number {
  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return fallback
  }
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function readBool(key: string, fallback: boolean): boolean {
  const raw = window.localStorage.getItem(key)
  if (raw == null) {
    return fallback
  }
  return raw === '1'
}

export class UiStore {
  readonly root: RootStore
  inventoryOpen = false
  buildOpen = false
  portraitLayout = readBool('raft-portrait-layout', false)
  displayScale = readNumber('raft-display-scale', 0.6)
  currentToast: ToastState | null = null
  fullscreenPromptVisible = false
  readonly skipFullscreenPrompt = /SM-/i.test(navigator.userAgent)
  private toastHandle: number | null = null
  private nextToastId = 1

  constructor(root: RootStore) {
    this.root = root
    this.fullscreenPromptVisible = !this.skipFullscreenPrompt && !Boolean(document.fullscreenElement)
    makeAutoObservable(this, {}, { autoBind: true })
  }

  openInventory(): void {
    this.inventoryOpen = true
  }

  closeInventory(): void {
    this.inventoryOpen = false
  }

  toggleInventory(): void {
    this.inventoryOpen = !this.inventoryOpen
  }

  openBuild(): void {
    this.buildOpen = true
  }

  closeBuild(): void {
    this.buildOpen = false
  }

  toggleBuild(): void {
    this.buildOpen = !this.buildOpen
  }

  closePanels(): void {
    this.inventoryOpen = false
    this.buildOpen = false
  }

  setDisplayScale(value: number): void {
    this.displayScale = Math.min(1, Math.max(0.35, value))
    window.localStorage.setItem('raft-display-scale', String(this.displayScale))
  }

  toggleOrientationLayout(): void {
    this.portraitLayout = !this.portraitLayout
    window.localStorage.setItem('raft-portrait-layout', this.portraitLayout ? '1' : '0')
  }

  showToast(message: string): void {
    this.currentToast = { id: this.nextToastId, message }
    this.nextToastId += 1

    if (this.toastHandle != null) {
      window.clearTimeout(this.toastHandle)
    }

    const toastId = this.currentToast.id
    this.toastHandle = window.setTimeout(() => {
      this.clearToast(toastId)
    }, 2200)
  }

  clearToast(id?: number): void {
    if (id != null && this.currentToast?.id !== id) {
      return
    }
    this.currentToast = null
    this.toastHandle = null
  }

  syncFullscreenState(): void {
    if (this.skipFullscreenPrompt) {
      this.fullscreenPromptVisible = false
      return
    }
    this.fullscreenPromptVisible = !Boolean(document.fullscreenElement)
  }

  async requestFullscreen(): Promise<void> {
    if (this.skipFullscreenPrompt || document.fullscreenElement) {
      this.syncFullscreenState()
      return
    }

    try {
      await document.documentElement.requestFullscreen()
    } catch {
      this.showToast('全屏请求被浏览器拦截')
    } finally {
      this.syncFullscreenState()
    }
  }
}
