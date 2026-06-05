export type Item = 'wood' | 'plastic' | 'leaf' | 'rope' | 'rawFish' | 'cookedFish'
export type FloatKind = 'wood' | 'plastic' | 'leaf' | 'crate'
export type BuildingKind = 'grill' | 'storage' | 'net'
export type GrillState = 'empty' | 'cooking' | 'done'

export type Vec = {
  x: number
  y: number
}

export type SpriteName =
  | 'char_idle_front'
  | 'char_idle_back'
  | 'char_side_stand'
  | 'char_front_walk'
  | 'char_back_walk'
  | 'char_side_walk'
  | 'wood_planks'
  | 'logs_pile'
  | 'water_tile_1'
  | 'water_tile_2'
  | 'water_bottle'
  | 'palm_leaf'
  | 'wooden_crate'
  | 'grill_empty'
  | 'grill_fish'
  | 'grill_fire'
  | 'chest_closed'
  | 'fishing_trap'
  | 'wooden_plank_single'
  | 'paper_scrap'
  | 'leaf'
  | 'rope_coil'
  | 'fish_raw'
  | 'fish_cooked'
  | 'hook_tool'
  | 'hammer_tool'
  | 'food_icon'

export type SpriteFrame = {
  x: number
  y: number
  w: number
  h: number
}

export type SourceRect = {
  x: number
  y: number
  w: number
  h: number
}

export type Floating = {
  id: number
  kind: FloatKind
  x: number
  y: number
  vx: number
  vy: number
  size: number
  captured: boolean
}

export type Hook = {
  state: 'idle' | 'flying' | 'returning'
  x: number
  y: number
  dir: Vec
  maxX: number
  maxY: number
  attachedId: number | null
}

export type Building = {
  kind: BuildingKind
  grill?: {
    state: GrillState
    timer: number
  }
}
