import { makeAutoObservable } from 'mobx'
import type { PlayerFacing, Vec } from '../game/types'
import type { RootStore } from './RootStore'

export class PlayerStore {
  readonly root: RootStore
  hunger = 100
  facing: PlayerFacing = 'down'
  moving = false
  lastMoveDir: Vec = { x: 0, y: 1 }

  constructor(root: RootStore) {
    this.root = root
    makeAutoObservable(this, { root: false }, { autoBind: true })
  }

  setFacing(facing: PlayerFacing): void {
    this.facing = facing
  }

  setMoving(moving: boolean): void {
    this.moving = moving
  }

  setLastMoveDir(direction: Vec): void {
    this.lastMoveDir = { x: direction.x, y: direction.y }
  }

  reduceHunger(amount: number): void {
    this.hunger = Math.max(0, this.hunger - amount)
  }

  restoreHunger(amount: number): void {
    this.hunger = Math.min(100, this.hunger + amount)
  }

  eatCookedFish(): void {
    if (!this.root.inventory.remove('cookedFish', 1)) {
      this.root.ui.showToast('没有烤鱼')
      return
    }
    this.restoreHunger(28)
    this.root.ui.showToast('吃下烤鱼')
  }
}
