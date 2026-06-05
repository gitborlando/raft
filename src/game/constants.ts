import type { FloatKind, Item } from './types'

export const TILE = 64
export const PLAYER_RADIUS = 20
export const HOOK_MAX = 280
export const HOOK_OUT_SPEED = 520
export const HOOK_BACK_SPEED = 470
export const FLOAT_RADIUS = 30

export const INVENTORY_ITEMS: Item[] = ['wood', 'plastic', 'leaf', 'rope', 'rawFish', 'cookedFish']

export const itemLabels: Record<Item, string> = {
  wood: '木板',
  plastic: '塑料',
  leaf: '树叶',
  rope: '绳子',
  rawFish: '生鱼',
  cookedFish: '烤鱼',
}

export const floatLabels: Record<FloatKind, string> = {
  wood: '木板',
  plastic: '塑料',
  leaf: '树叶',
  crate: '漂流箱',
}
