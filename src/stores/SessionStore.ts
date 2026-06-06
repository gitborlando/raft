import { makeAutoObservable } from 'mobx'
import type { RootStore } from './RootStore'

export class SessionStore {
  readonly root: RootStore
  ready = false

  constructor(root: RootStore) {
    this.root = root
    makeAutoObservable(this, { root: false }, { autoBind: true })
  }

  setReady(ready: boolean): void {
    this.ready = ready
  }
}
