import { GameBridge } from '../game/phaser/GameBridge'
import { InventoryStore } from './InventoryStore'
import { PlayerStore } from './PlayerStore'
import { SessionStore } from './SessionStore'
import { UiStore } from './UiStore'
import { WorldStore } from './WorldStore'

export class RootStore {
  readonly bridge: GameBridge
  readonly inventory: InventoryStore
  readonly player: PlayerStore
  readonly session: SessionStore
  readonly ui: UiStore
  readonly world: WorldStore

  constructor() {
    this.bridge = new GameBridge()
    this.inventory = new InventoryStore(this)
    this.player = new PlayerStore(this)
    this.session = new SessionStore(this)
    this.ui = new UiStore(this)
    this.world = new WorldStore(this)
  }
}

export const rootStore = new RootStore()
