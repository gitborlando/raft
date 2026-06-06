import type { BuildingKind, Item } from './types'

export const buildCosts: Record<'floor' | BuildingKind, Partial<Record<Item, number>>> = {
  floor: { wood: 2 },
  grill: { wood: 4, plastic: 2, rope: 1 },
  storage: { wood: 6, plastic: 2 },
  net: { wood: 3, plastic: 2, rope: 2 },
}

export const craftCosts = {
  rope: { leaf: 2 } satisfies Partial<Record<Item, number>>,
}

export const buildingLabels: Record<'floor' | BuildingKind, string> = {
  floor: '地板',
  grill: '烤架',
  storage: '储物箱',
  net: '收集网',
}
