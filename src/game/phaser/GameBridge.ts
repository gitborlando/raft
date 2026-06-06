import type { BuildingKind, Vec } from '../types'
import type { MainScene } from './MainScene'

export class GameBridge {
  moveInput: Vec = { x: 0, y: 0 }
  private scene?: MainScene

  attachScene(scene: MainScene): void {
    this.scene = scene
  }

  detachScene(scene: MainScene): void {
    if (this.scene === scene) {
      this.scene = undefined
    }
  }

  setMoveInput(x: number, y: number): void {
    this.moveInput.x = x
    this.moveInput.y = y
  }

  throwHook(): void {
    this.scene?.throwHookForward()
  }

  interact(): void {
    this.scene?.interact()
  }

  requestBuildFloor(): void {
    this.scene?.buildFloor()
  }

  requestBuild(kind: BuildingKind): void {
    this.scene?.buildOnCurrentTile(kind)
  }
}
