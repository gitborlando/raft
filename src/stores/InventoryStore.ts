import { makeAutoObservable } from 'mobx'
import { INVENTORY_ITEMS } from '../game/constants'
import { craftCosts } from '../game/recipes'
import type { Item } from '../game/types'
import type { RootStore } from './RootStore'

export class InventoryStore {
  readonly root: RootStore
  items: Record<Item, number> = {
    wood: 12,
    plastic: 10,
    leaf: 10,
    rope: 1,
    rawFish: 2,
    cookedFish: 0,
  }

  constructor(root: RootStore) {
    this.root = root
    makeAutoObservable(this, { root: false }, { autoBind: true })
  }

  get entries(): Array<{ item: Item; count: number }> {
    return INVENTORY_ITEMS.map((item) => ({ item, count: this.items[item] }))
  }

  canAfford(cost: Partial<Record<Item, number>>): boolean {
    return Object.entries(cost).every(([item, count]) => this.items[item as Item] >= (count ?? 0))
  }

  pay(cost: Partial<Record<Item, number>>): boolean {
    if (!this.canAfford(cost)) {
      return false
    }
    for (const [item, count] of Object.entries(cost)) {
      this.items[item as Item] -= count ?? 0
    }
    return true
  }

  add(item: Item, count: number): void {
    this.items[item] += count
  }

  remove(item: Item, count: number): boolean {
    if (this.items[item] < count) {
      return false
    }
    this.items[item] -= count
    return true
  }

  craftRope(): void {
    if (!this.pay(craftCosts.rope)) {
      this.root.ui.showToast('材料不足')
      return
    }
    this.add('rope', 1)
    this.root.ui.showToast('合成绳子 x1')
  }
}
