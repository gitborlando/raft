export type Item = 'wood' | 'plastic' | 'leaf' | 'rope' | 'rawFish' | 'cookedFish'
export type FloatKind = 'wood' | 'plastic' | 'leaf' | 'crate'
export type BuildingKind = 'grill' | 'storage' | 'net'
export type GrillState = 'empty' | 'cooking' | 'done'

export type Vec = {
  x: number
  y: number
}

export type SpriteName =
  | 'chara_front_idle'
  | 'chara_back_idle'
  | 'chara_side_idle_right'
  | 'chara_side_idle_left'
  | 'chara_front_walk'
  | 'chara_back_walk'
  | 'chara_side_walk'
  | 'chara_side_run'
  | 'chara_punch_front'
  | 'chara_punch_side'
  | 'tile_wood_floor'
  | 'tile_wood_edge'
  | 'tile_water_1'
  | 'tile_water_2'
  | 'tile_water_wave'
  | 'item_wood_bundle'
  | 'item_water_bottle'
  | 'item_palm_leaf'
  | 'item_wood_crate'
  | 'prop_grill_empty'
  | 'prop_grill_raw_fish'
  | 'prop_grill_cooked_fish'
  | 'prop_chest_closed'
  | 'prop_chest_open'
  | 'prop_fish_net'
  | 'item_single_plank'
  | 'item_plastic_waste'
  | 'item_small_leaf'
  | 'item_rope_coil'
  | 'item_raw_fish'
  | 'item_cooked_fish'
  | 'prop_small_box'
  | 'tool_iron_hook'
  | 'tool_stone_hammer'
  | 'item_meat_plate'
  | 'ui_frame_plain'
  | 'ui_frame_corners'
  | 'ui_frame_rope'
  | 'ui_frame_large'
  | 'ui_button_wood'
  | 'ui_button_dark'
  | 'ui_progress_blue'

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
  prevX: number
  prevY: number
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
