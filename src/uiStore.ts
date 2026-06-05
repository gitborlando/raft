import { makeAutoObservable } from 'mobx'

export class UiStore {
  landscapePromptSeen = window.localStorage.getItem('raft-landscape-prompt-seen') === '1'

  constructor() {
    makeAutoObservable(this)
  }

  markLandscapePromptSeen(): void {
    this.landscapePromptSeen = true
    window.localStorage.setItem('raft-landscape-prompt-seen', '1')
  }
}

export const uiStore = new UiStore()
