export type Item = 'wood' | 'plastic' | 'leaf' | 'rope' | 'rawFish' | 'cookedFish'
export type FloatKind = 'wood' | 'plastic' | 'leaf' | 'crate'
export type BuildingKind = 'grill' | 'storage' | 'net'
export type GrillState = 'empty' | 'cooking' | 'done'
export type PlayerFacing = 'down' | 'up' | 'left' | 'right'

export type Vec = {
  x: number
  y: number
}

export type SpriteName =
  | 'chara_front_idle'
  | 'chara_back_idle'
  | 'chara_left_idle'
  | 'chara_right_idle'
  | 'chara_front_walk'
  | 'chara_back_walk'
  | 'chara_right_run'
  | 'chara_left_run'
  | 'chara_reach_side'
  | 'chara_hold_side'
  | 'raft_floor_tile'
  | 'raft_frame_tile'
  | 'sea_tile_a'
  | 'sea_tile_b'
  | 'sea_wave_hazard'
  | 'resource_driftwood_bundle'
  | 'resource_plastic_bottle'
  | 'resource_palm_leaf_big'
  | 'loot_crate_closed'
  | 'grill_empty'
  | 'grill_fish_pink'
  | 'grill_fish_cooked'
  | 'chest_closed'
  | 'chest_open'
  | 'raft_collect_net'
  | 'resource_wood_plank'
  | 'resource_plastic_scrap'
  | 'resource_leaf_small'
  | 'resource_rope_coil'
  | 'food_fish_raw_blue'
  | 'food_fish_cooked_orange'
  | 'item_supply_crate'
  | 'tool_hook'
  | 'tool_hammer'
  | 'ui_food_icon'
  | 'ui_slot_empty'
  | 'ui_slot_selected'
  | 'ui_wood_label_panel'
  | 'ui_orange_button'
  | 'ui_large_slot_panel'
  | 'ui_progress_bar_empty'
  | 'ui_progress_bar_blue'

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
