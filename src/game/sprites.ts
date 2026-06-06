import spriteDesc from '../assets/spirte-desc.json'
import type { SpriteFrame, SpriteName } from './types'

type SpriteDescItem = {
  name: SpriteName
  bound: SpriteFrame
}

export const frames = Object.fromEntries(
  (spriteDesc as SpriteDescItem[]).map(({ name, bound }) => [name, bound]),
) as Record<SpriteName, SpriteFrame>
