import * as Phaser from 'phaser'
import type { RootStore } from '../../stores/RootStore'
import { MainScene } from './MainScene'

const MAX_RENDER_SCALE = 3

function getRenderScale(): number {
  return Math.min(MAX_RENDER_SCALE, Math.max(1, window.devicePixelRatio || 1))
}

function getRenderSize(parent: HTMLElement): { width: number; height: number } {
  const scale = getRenderScale()
  return {
    width: Math.max(1, Math.round((parent.clientWidth || window.innerWidth) * scale)),
    height: Math.max(1, Math.round((parent.clientHeight || window.innerHeight) * scale)),
  }
}

function fitCanvasToParent(game: Phaser.Game, parent: HTMLElement): void {
  const { width, height } = getRenderSize(parent)

  if (game.scale.width !== width || game.scale.height !== height) {
    game.scale.resize(width, height)
  }

  game.canvas.style.width = '100%'
  game.canvas.style.height = '100%'
}

export function createGame(parent: HTMLElement, store: RootStore): Phaser.Game {
  const { width, height } = getRenderSize(parent)
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0f6e92',
    render: {
      antialias: true,
      antialiasGL: true,
      pixelArt: false,
      roundPixels: false,
      powerPreference: 'high-performance',
    },
    scale: {
      mode: Phaser.Scale.NONE,
      width,
      height,
    },
    scene: [new MainScene(store)],
  })

  fitCanvasToParent(game, parent)

  const resize = () => fitCanvasToParent(game, parent)
  const observer = new ResizeObserver(resize)
  observer.observe(parent)
  window.addEventListener('resize', resize)

  const destroy = game.destroy.bind(game)
  game.destroy = (removeCanvas = false, noReturn?: boolean) => {
    observer.disconnect()
    window.removeEventListener('resize', resize)
    destroy(removeCanvas, noReturn)
  }

  return game
}
