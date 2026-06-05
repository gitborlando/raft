import './style.css'
import spriteUrl from './assets/spirte.png'

type Item = 'wood' | 'plastic' | 'leaf' | 'rope' | 'rawFish' | 'cookedFish'
type FloatKind = 'wood' | 'plastic' | 'leaf' | 'crate'
type BuildingKind = 'grill' | 'storage' | 'net'
type GrillState = 'empty' | 'cooking' | 'done'

type Vec = {
  x: number
  y: number
}

type SpriteName =
  | 'char_idle_front'
  | 'char_idle_back'
  | 'char_side_stand'
  | 'char_front_walk'
  | 'char_back_walk'
  | 'char_side_walk'
  | 'logs_pile'
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

type SpriteFrame = {
  x: number
  y: number
  w: number
  h: number
}

type Floating = {
  id: number
  kind: FloatKind
  x: number
  y: number
  vx: number
  vy: number
  size: number
  captured: boolean
}

type Hook = {
  state: 'idle' | 'flying' | 'returning'
  x: number
  y: number
  dir: Vec
  maxX: number
  maxY: number
  attachedId: number | null
}

type Building = {
  kind: BuildingKind
  grill?: {
    state: GrillState
    timer: number
  }
}

const TILE = 64
const PLAYER_RADIUS = 20
const HOOK_MAX = 280
const HOOK_OUT_SPEED = 520
const HOOK_BACK_SPEED = 470
const FLOAT_RADIUS = 30
const HUNGER_DROP = 0.3
const INVENTORY_ITEMS: Item[] = ['wood', 'plastic', 'leaf', 'rope', 'rawFish', 'cookedFish']

const itemLabels: Record<Item, string> = {
  wood: '木板',
  plastic: '塑料',
  leaf: '树叶',
  rope: '绳子',
  rawFish: '生鱼',
  cookedFish: '烤鱼',
}

const floatLabels: Record<FloatKind, string> = {
  wood: '木板',
  plastic: '塑料',
  leaf: '树叶',
  crate: '漂流箱',
}

const frames: Record<SpriteName, SpriteFrame> = {
  char_idle_front: { x: 0.043575, y: 0.018933, w: 0.083456, h: 0.141997 },
  char_idle_back: { x: 0.189808, y: 0.018933, w: 0.080502, h: 0.141997 },
  char_side_stand: { x: 0.337518, y: 0.019793, w: 0.080502, h: 0.141997 },
  char_front_walk: { x: 0.607829, y: 0.019793, w: 0.081241, h: 0.143718 },
  char_back_walk: { x: 0.745199, y: 0.018933, w: 0.078287, h: 0.141997 },
  char_side_walk: { x: 0.467504, y: 0.018072, w: 0.078287, h: 0.142857 },
  logs_pile: { x: 0.177253, y: 0.385542, w: 0.091581, h: 0.089501 },
  water_bottle: { x: 0.311669, y: 0.375215, w: 0.089365, h: 0.104131 },
  palm_leaf: { x: 0.463811, y: 0.376936, w: 0.081241, h: 0.095525 },
  wooden_crate: { x: 0.595273, y: 0.366609, w: 0.084195, h: 0.114458 },
  grill_empty: { x: 0.722304, y: 0.370912, w: 0.119645, h: 0.121343 },
  grill_fish: { x: 0.862629, y: 0.370912, w: 0.118907, h: 0.121343 },
  grill_fire: { x: 0.019202, y: 0.532702, w: 0.121861, h: 0.120482 },
  chest_closed: { x: 0.17356, y: 0.54389, w: 0.101182, h: 0.120482 },
  fishing_trap: { x: 0.450517, y: 0.536145, w: 0.114476, h: 0.124785 },
  wooden_plank_single: { x: 0.601182, y: 0.543029, w: 0.085672, h: 0.105852 },
  paper_scrap: { x: 0.731905, y: 0.540448, w: 0.095273, h: 0.104991 },
  leaf: { x: 0.884047, y: 0.540448, w: 0.076071, h: 0.107573 },
  rope_coil: { x: 0.031019, y: 0.709122, w: 0.086411, h: 0.08778 },
  fish_raw: { x: 0.17356, y: 0.704819, w: 0.100443, h: 0.092943 },
  fish_cooked: { x: 0.316839, y: 0.70568, w: 0.099705, h: 0.096386 },
  hook_tool: { x: 0.59675, y: 0.694492, w: 0.079025, h: 0.113597 },
  hammer_tool: { x: 0.732644, y: 0.695353, w: 0.085672, h: 0.112737 },
  food_icon: { x: 0.872969, y: 0.695353, w: 0.095273, h: 0.112737 },
}

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing #app element')
}

app.innerHTML = `
  <canvas id="game" aria-label="Raft mobile MVP"></canvas>
  <div class="top-hud">
    <div class="hunger">
      <span>饥饿</span>
      <div class="bar"><i id="hunger-fill"></i></div>
      <strong id="hunger-value">100</strong>
    </div>
    <button id="bag-toggle" class="icon-button" type="button" aria-label="打开背包">包</button>
  </div>
  <div id="toast" class="toast"></div>
  <section id="goal-panel" class="goal-panel">
    <strong>V0.5 目标</strong>
    <span id="goal-text"></span>
  </section>
  <section id="inventory-panel" class="panel inventory-panel hidden">
    <header><strong>背包</strong><button class="close-panel" data-close="inventory" type="button">关闭</button></header>
    <div id="inventory-grid" class="inventory-grid"></div>
  </section>
  <section id="build-panel" class="panel build-panel hidden">
    <header><strong>建造 / 合成</strong><button class="close-panel" data-close="build" type="button">关闭</button></header>
    <div class="build-actions">
      <button data-craft="rope" type="button">合成绳子<br><small>树叶 x2</small></button>
      <button data-craft="floor" type="button">扩建地板<br><small>木板 x2</small></button>
      <button data-craft="grill" type="button">烤架<br><small>木板 x4 塑料 x2 绳子 x1</small></button>
      <button data-craft="storage" type="button">储物箱<br><small>木板 x6 塑料 x2</small></button>
      <button data-craft="net" type="button">收集网<br><small>木板 x3 塑料 x2 绳子 x2</small></button>
    </div>
  </section>
  <div class="bottom-controls">
    <div id="stick" class="stick"><i></i></div>
    <div class="action-cluster">
      <button id="hook-button" class="action primary" type="button">投钩</button>
      <button id="interact-button" class="action" type="button">互动</button>
      <button id="eat-button" class="action" type="button">吃鱼</button>
      <button id="build-toggle" class="action" type="button">建造</button>
    </div>
  </div>
`

function queryRequired<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) {
    throw new Error(`Missing element: ${selector}`)
  }
  return element
}

const canvas = queryRequired<HTMLCanvasElement>('#game')
const hungerFill = queryRequired<HTMLElement>('#hunger-fill')
const hungerValue = queryRequired<HTMLElement>('#hunger-value')
const toast = queryRequired<HTMLElement>('#toast')
const inventoryGrid = queryRequired<HTMLElement>('#inventory-grid')
const inventoryPanel = queryRequired<HTMLElement>('#inventory-panel')
const buildPanel = queryRequired<HTMLElement>('#build-panel')
const goalText = queryRequired<HTMLElement>('#goal-text')
const stick = queryRequired<HTMLElement>('#stick')
const context = canvas.getContext('2d')

if (!context) {
  throw new Error('Canvas is unavailable')
}

const ctx: CanvasRenderingContext2D = context

const sprite = new Image()
sprite.src = spriteUrl

const inventory: Record<Item, number> = {
  wood: 8,
  plastic: 4,
  leaf: 6,
  rope: 0,
  rawFish: 1,
  cookedFish: 0,
}

const raft = new Set<string>()
const buildings = new Map<string, Building>()
const floats: Floating[] = []
const keys = new Set<string>()
const camera: Vec = { x: 0, y: 0 }
const pointerAim: Vec = { x: 1, y: 0 }
const moveInput: Vec = { x: 0, y: 0 }
const player: Vec & { facing: 'down' | 'up' | 'left' | 'right'; moving: boolean } = {
  x: 0,
  y: 0,
  facing: 'down',
  moving: false,
}
const hook: Hook = {
  state: 'idle',
  x: 0,
  y: 0,
  dir: { x: 1, y: 0 },
  maxX: 0,
  maxY: 0,
  attachedId: null,
}

let nextFloatId = 1
let width = 0
let height = 0
let dpr = 1
let lastTime = performance.now()
let spawnTimer = 0
let hunger = 100
let lastMoveDir: Vec = { x: 0, y: 1 }
let toastTimer = 0
let completed = false
let joystickPointer: number | null = null

for (let gx = -1; gx <= 1; gx += 1) {
  for (let gy = -1; gy <= 1; gy += 1) {
    raft.add(tileKey(gx, gy))
  }
}

function tileKey(x: number, y: number): string {
  return `${x},${y}`
}

function tileFromWorld(x: number, y: number): Vec {
  return {
    x: Math.round(x / TILE),
    y: Math.round(y / TILE),
  }
}

function tileCenter(x: number, y: number): Vec {
  return {
    x: x * TILE,
    y: y * TILE,
  }
}

function dist(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function normalize(v: Vec): Vec {
  const length = Math.hypot(v.x, v.y)
  if (length < 0.001) {
    return { x: 1, y: 0 }
  }
  return { x: v.x / length, y: v.y / length }
}

function resize(): void {
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = window.innerWidth
  height = window.innerHeight
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function worldToScreen(pos: Vec): Vec {
  return {
    x: pos.x - camera.x + width / 2,
    y: pos.y - camera.y + height / 2,
  }
}

function screenToWorld(x: number, y: number): Vec {
  return {
    x: x + camera.x - width / 2,
    y: y + camera.y - height / 2,
  }
}

function drawSprite(name: SpriteName, x: number, y: number, size: number, flip = false): void {
  if (!sprite.complete || sprite.naturalWidth === 0) {
    drawFallback(name, x, y, size)
    return
  }

  const frame = frames[name]
  const sx = frame.x * sprite.naturalWidth
  const sy = frame.y * sprite.naturalHeight
  const sw = frame.w * sprite.naturalWidth
  const sh = frame.h * sprite.naturalHeight
  const aspect = sw / sh
  const drawW = size * aspect
  const drawH = size

  ctx.save()
  if (flip) {
    ctx.translate(x, y)
    ctx.scale(-1, 1)
    ctx.drawImage(sprite, sx, sy, sw, sh, -drawW / 2, -drawH / 2, drawW, drawH)
  } else {
    ctx.drawImage(sprite, sx, sy, sw, sh, x - drawW / 2, y - drawH / 2, drawW, drawH)
  }
  ctx.restore()
}

function drawFallback(name: SpriteName, x: number, y: number, size: number): void {
  const color = name.includes('water') ? '#45a7cf' : name.includes('fish') ? '#e8784f' : '#c78b4d'
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, size / 2, 0, Math.PI * 2)
  ctx.fill()
}

function showToast(message: string): void {
  toast.textContent = message
  toast.classList.add('visible')
  toastTimer = 2.2
}

function addItem(item: Item, count: number): void {
  inventory[item] += count
  renderInventory()
}

function canPay(cost: Partial<Record<Item, number>>): boolean {
  return Object.entries(cost).every(([item, count]) => inventory[item as Item] >= (count ?? 0))
}

function pay(cost: Partial<Record<Item, number>>): boolean {
  if (!canPay(cost)) {
    showToast('材料不足')
    return false
  }
  Object.entries(cost).forEach(([item, count]) => {
    inventory[item as Item] -= count ?? 0
  })
  renderInventory()
  return true
}

function collectFloat(kind: FloatKind): void {
  if (kind === 'crate') {
    const wood = 2 + Math.floor(Math.random() * 4)
    const plastic = 1 + Math.floor(Math.random() * 3)
    const leaves = 2 + Math.floor(Math.random() * 4)
    addItem('wood', wood)
    addItem('plastic', plastic)
    addItem('leaf', leaves)
    if (Math.random() < 0.65) {
      addItem('rawFish', 1 + Math.floor(Math.random() * 2))
    }
    showToast('打开漂流箱，获得一批资源')
    return
  }

  const item: Item = kind === 'wood' ? 'wood' : kind === 'plastic' ? 'plastic' : 'leaf'
  addItem(item, 1)
  showToast(`获得${floatLabels[kind]} x1`)
}

function spawnFloat(): void {
  const kind = weightedFloat()
  const fromTop = Math.random() < 0.65
  const margin = 160
  const worldTopLeft = screenToWorld(0, 0)
  const worldBottomRight = screenToWorld(width, height)
  const x = fromTop
    ? worldTopLeft.x - margin + Math.random() * (width + margin * 2)
    : worldBottomRight.x + margin
  const y = fromTop
    ? worldTopLeft.y - margin
    : worldTopLeft.y - margin + Math.random() * (height + margin * 2)
  const speed = 62 + Math.random() * 40

  floats.push({
    id: nextFloatId,
    kind,
    x,
    y,
    vx: -speed * 0.35,
    vy: speed,
    size: kind === 'crate' ? 58 : 46,
    captured: false,
  })
  nextFloatId += 1
}

function weightedFloat(): FloatKind {
  const roll = Math.random() * 100
  if (roll < 40) return 'wood'
  if (roll < 70) return 'plastic'
  if (roll < 95) return 'leaf'
  return 'crate'
}

function throwHook(target: Vec): void {
  if (hook.state !== 'idle') {
    return
  }
  const dir = normalize({ x: target.x - player.x, y: target.y - player.y })
  hook.state = 'flying'
  hook.x = player.x
  hook.y = player.y
  hook.dir = dir
  hook.maxX = player.x + dir.x * HOOK_MAX
  hook.maxY = player.y + dir.y * HOOK_MAX
  hook.attachedId = null
  pointerAim.x = dir.x
  pointerAim.y = dir.y
}

function currentPlayerTile(): Vec {
  return tileFromWorld(player.x, player.y)
}

function hasRaftTile(pos: Vec): boolean {
  return raft.has(tileKey(pos.x, pos.y))
}

function isEdgeTile(pos: Vec): boolean {
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ]
  return dirs.some((dir) => !hasRaftTile({ x: pos.x + dir.x, y: pos.y + dir.y }))
}

function buildFloor(): void {
  const target = findFloorTarget()
  if (!target) {
    showToast('站到木筏边缘再扩建')
    return
  }
  if (!pay({ wood: 2 })) {
    return
  }
  raft.add(tileKey(target.x, target.y))
  showToast('扩建了一块地板')
  checkGoal()
}

function findFloorTarget(): Vec | null {
  const playerTile = currentPlayerTile()
  const primary = normalize(lastMoveDir)
  const dirs = [
    axisDir(primary),
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ]

  for (const dir of dirs) {
    const target = { x: playerTile.x + dir.x, y: playerTile.y + dir.y }
    if (!hasRaftTile(target) && adjacentToRaft(target)) {
      return target
    }
  }

  let best: Vec | null = null
  let bestDist = Number.POSITIVE_INFINITY
  raft.forEach((key) => {
    const [xRaw, yRaw] = key.split(',')
    const tile = { x: Number(xRaw), y: Number(yRaw) }
    for (const dir of dirs.slice(1)) {
      const target = { x: tile.x + dir.x, y: tile.y + dir.y }
      const targetKey = tileKey(target.x, target.y)
      if (!raft.has(targetKey) && adjacentToRaft(target)) {
        const center = tileCenter(target.x, target.y)
        const distance = dist(center, player)
        if (distance < bestDist) {
          best = target
          bestDist = distance
        }
      }
    }
  })

  return best
}

function adjacentToRaft(pos: Vec): boolean {
  return (
    hasRaftTile({ x: pos.x + 1, y: pos.y }) ||
    hasRaftTile({ x: pos.x - 1, y: pos.y }) ||
    hasRaftTile({ x: pos.x, y: pos.y + 1 }) ||
    hasRaftTile({ x: pos.x, y: pos.y - 1 })
  )
}

function axisDir(v: Vec): Vec {
  if (Math.abs(v.x) > Math.abs(v.y)) {
    return { x: v.x >= 0 ? 1 : -1, y: 0 }
  }
  return { x: 0, y: v.y >= 0 ? 1 : -1 }
}

function buildOnCurrentTile(kind: BuildingKind): void {
  const pos = currentPlayerTile()
  const key = tileKey(pos.x, pos.y)
  if (!hasRaftTile(pos)) {
    showToast('只能建在木筏上')
    return
  }
  if (buildings.has(key)) {
    showToast('这里已经有建筑')
    return
  }
  if (kind === 'net' && !isEdgeTile(pos)) {
    showToast('收集网要建在木筏边缘')
    return
  }

  const cost: Record<BuildingKind, Partial<Record<Item, number>>> = {
    grill: { wood: 4, plastic: 2, rope: 1 },
    storage: { wood: 6, plastic: 2 },
    net: { wood: 3, plastic: 2, rope: 2 },
  }

  if (!pay(cost[kind])) {
    return
  }

  buildings.set(key, {
    kind,
    grill: kind === 'grill' ? { state: 'empty', timer: 0 } : undefined,
  })
  showToast(kind === 'grill' ? '建造了烤架' : kind === 'storage' ? '建造了储物箱' : '建造了收集网')
  checkGoal()
}

function craftRope(): void {
  if (!pay({ leaf: 2 })) {
    return
  }
  addItem('rope', 1)
  showToast('合成绳子 x1')
}

function nearestGrill(): Building | null {
  let found: Building | null = null
  let best = 999
  buildings.forEach((building, key) => {
    if (building.kind !== 'grill') {
      return
    }
    const [xRaw, yRaw] = key.split(',')
    const center = tileCenter(Number(xRaw), Number(yRaw))
    const distance = dist(center, player)
    if (distance < best && distance < TILE * 1.4) {
      found = building
      best = distance
    }
  })
  return found
}

function interact(): void {
  const grill = nearestGrill()
  if (grill?.grill) {
    if (grill.grill.state === 'done') {
      grill.grill.state = 'empty'
      grill.grill.timer = 0
      addItem('cookedFish', 1)
      showToast('取出烤鱼 x1')
      return
    }
    if (grill.grill.state === 'empty') {
      if (inventory.rawFish <= 0) {
        showToast('没有生鱼')
        return
      }
      inventory.rawFish -= 1
      grill.grill.state = 'cooking'
      grill.grill.timer = 8
      renderInventory()
      showToast('开始烤鱼')
      return
    }
    showToast('鱼还在烤')
    return
  }

  const playerTile = currentPlayerTile()
  const key = tileKey(playerTile.x, playerTile.y)
  if (buildings.get(key)?.kind === 'storage') {
    togglePanel(inventoryPanel)
    showToast('打开储物箱')
    return
  }
  showToast('附近没有可互动建筑')
}

function eatFish(): void {
  if (inventory.cookedFish <= 0) {
    showToast('没有烤鱼')
    return
  }
  inventory.cookedFish -= 1
  hunger = Math.min(100, hunger + 35)
  renderInventory()
  showToast('吃下烤鱼，恢复饥饿值')
}

function update(dt: number): void {
  const keyboardInput = getKeyboardInput()
  const input = normalizeInput({
    x: keyboardInput.x + moveInput.x,
    y: keyboardInput.y + moveInput.y,
  })
  const speed = hunger <= 0 ? 92 : 132
  player.moving = Math.abs(input.x) > 0.01 || Math.abs(input.y) > 0.01
  if (player.moving) {
    lastMoveDir = { x: input.x, y: input.y }
    if (Math.abs(input.x) > Math.abs(input.y)) {
      player.facing = input.x > 0 ? 'right' : 'left'
    } else {
      player.facing = input.y > 0 ? 'down' : 'up'
    }
    movePlayer(input.x * speed * dt, input.y * speed * dt)
  }

  hunger = Math.max(0, hunger - HUNGER_DROP * dt)
  if (hunger === 0 && Math.random() < dt * 0.3) {
    showToast('太饿了，需要吃点东西')
  }

  updateFloats(dt)
  updateHook(dt)
  updateGrills(dt)
  updateHud(dt)

  camera.x += (player.x - camera.x) * Math.min(1, dt * 7)
  camera.y += (player.y - camera.y) * Math.min(1, dt * 7)
}

function normalizeInput(input: Vec): Vec {
  const length = Math.hypot(input.x, input.y)
  if (length <= 1) {
    return input
  }
  return { x: input.x / length, y: input.y / length }
}

function getKeyboardInput(): Vec {
  return {
    x: (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0),
    y: (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0),
  }
}

function movePlayer(dx: number, dy: number): void {
  const nextX = player.x + dx
  const nextY = player.y + dy
  if (canStandAt(nextX, player.y)) {
    player.x = nextX
  }
  if (canStandAt(player.x, nextY)) {
    player.y = nextY
  }
}

function canStandAt(x: number, y: number): boolean {
  const tile = tileFromWorld(x, y)
  if (!hasRaftTile(tile)) {
    return false
  }
  const center = tileCenter(tile.x, tile.y)
  return Math.abs(x - center.x) <= TILE / 2 - PLAYER_RADIUS / 2 && Math.abs(y - center.y) <= TILE / 2 - PLAYER_RADIUS / 2
}

function updateFloats(dt: number): void {
  spawnTimer -= dt
  if (spawnTimer <= 0) {
    spawnFloat()
    spawnTimer = 1.05 + Math.random() * 0.75
  }

  for (const floating of floats) {
    if (!floating.captured) {
      floating.x += floating.vx * dt
      floating.y += floating.vy * dt
    }
  }

  buildings.forEach((building, key) => {
    if (building.kind !== 'net') {
      return
    }
    const [xRaw, yRaw] = key.split(',')
    const center = tileCenter(Number(xRaw), Number(yRaw))
    for (const floating of floats) {
      if (!floating.captured && dist(floating, center) < TILE * 0.72) {
        floating.captured = true
        collectFloat(floating.kind)
      }
    }
  })

  for (let i = floats.length - 1; i >= 0; i -= 1) {
    const floating = floats[i]
    const screen = worldToScreen(floating)
    if (floating.captured || screen.y > height + 260 || screen.x < -260) {
      floats.splice(i, 1)
    }
  }
}

function updateHook(dt: number): void {
  if (hook.state === 'idle') {
    hook.x = player.x
    hook.y = player.y
    return
  }

  if (hook.state === 'flying') {
    hook.x += hook.dir.x * HOOK_OUT_SPEED * dt
    hook.y += hook.dir.y * HOOK_OUT_SPEED * dt
    for (const floating of floats) {
      if (!floating.captured && dist(hook, floating) < FLOAT_RADIUS) {
        hook.attachedId = floating.id
        floating.captured = true
        hook.state = 'returning'
        break
      }
    }
    if (dist(hook, player) >= HOOK_MAX || dist(hook, { x: hook.maxX, y: hook.maxY }) < 10) {
      hook.state = 'returning'
    }
  } else {
    const toPlayer = normalize({ x: player.x - hook.x, y: player.y - hook.y })
    hook.x += toPlayer.x * HOOK_BACK_SPEED * dt
    hook.y += toPlayer.y * HOOK_BACK_SPEED * dt
    const attached = floats.find((floating) => floating.id === hook.attachedId)
    if (attached) {
      attached.x = hook.x
      attached.y = hook.y
    }
    if (dist(hook, player) < 18) {
      if (attached) {
        collectFloat(attached.kind)
        floats.splice(floats.indexOf(attached), 1)
      }
      hook.state = 'idle'
      hook.attachedId = null
    }
  }
}

function updateGrills(dt: number): void {
  buildings.forEach((building) => {
    if (building.grill?.state === 'cooking') {
      building.grill.timer -= dt
      if (building.grill.timer <= 0) {
        building.grill.timer = 0
        building.grill.state = 'done'
        showToast('烤鱼完成')
      }
    }
  })
}

function updateHud(dt: number): void {
  hungerFill.style.width = `${hunger}%`
  hungerValue.textContent = String(Math.round(hunger))
  if (toastTimer > 0) {
    toastTimer -= dt
    if (toastTimer <= 0) {
      toast.classList.remove('visible')
    }
  }
}

function draw(): void {
  ctx.clearRect(0, 0, width, height)
  drawOcean()
  drawRaft()
  drawFloats()
  drawHook()
  drawPlayer()
}

function drawOcean(): void {
  const offsetX = ((-camera.x * 0.2) % 96) - 96
  const offsetY = ((-camera.y * 0.2) % 96) - 96
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#42c5d8')
  gradient.addColorStop(0.55, '#258cb9')
  gradient.addColorStop(1, '#176c98')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = 'rgba(255,255,255,0.16)'
  ctx.lineWidth = 2
  for (let y = offsetY; y < height + 120; y += 96) {
    for (let x = offsetX; x < width + 120; x += 96) {
      ctx.beginPath()
      ctx.arc(x, y, 22, 0.2, Math.PI - 0.2)
      ctx.stroke()
    }
  }
}

function drawRaft(): void {
  raft.forEach((key) => {
    const [xRaw, yRaw] = key.split(',')
    const tile = tileCenter(Number(xRaw), Number(yRaw))
    const screen = worldToScreen(tile)
    drawFloorTile(screen.x, screen.y)
  })

  buildings.forEach((building, key) => {
    const [xRaw, yRaw] = key.split(',')
    const screen = worldToScreen(tileCenter(Number(xRaw), Number(yRaw)))
    if (building.kind === 'grill') {
      const state = building.grill?.state ?? 'empty'
      drawSprite(state === 'empty' ? 'grill_empty' : state === 'cooking' ? 'grill_fire' : 'grill_fish', screen.x, screen.y - 5, 58)
      if (state === 'cooking' && building.grill) {
        drawProgress(screen.x - 25, screen.y + 27, 50, building.grill.timer / 8)
      }
    } else if (building.kind === 'storage') {
      drawSprite('chest_closed', screen.x, screen.y - 4, 54)
    } else {
      drawSprite('fishing_trap', screen.x, screen.y, 58)
    }
  })
}

function drawFloorTile(x: number, y: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#b98249'
  roundRect(-TILE / 2 + 2, -TILE / 2 + 2, TILE - 4, TILE - 4, 8)
  ctx.fill()
  ctx.strokeStyle = '#714629'
  ctx.lineWidth = 2
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath()
    ctx.moveTo(-TILE / 2 + 8, i * 16)
    ctx.lineTo(TILE / 2 - 8, i * 16 + 5)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.strokeRect(-TILE / 2 + 5, -TILE / 2 + 5, TILE - 10, TILE - 10)
  ctx.restore()
}

function roundRect(x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawProgress(x: number, y: number, w: number, ratio: number): void {
  ctx.fillStyle = 'rgba(20, 26, 31, 0.8)'
  roundRect(x, y, w, 7, 4)
  ctx.fill()
  ctx.fillStyle = '#ffb347'
  roundRect(x + 1, y + 1, (w - 2) * (1 - ratio), 5, 3)
  ctx.fill()
}

function drawFloats(): void {
  for (const floating of floats) {
    const screen = worldToScreen(floating)
    const name: SpriteName =
      floating.kind === 'wood'
        ? 'logs_pile'
        : floating.kind === 'plastic'
          ? 'water_bottle'
          : floating.kind === 'leaf'
            ? 'palm_leaf'
            : 'wooden_crate'
    drawSprite(name, screen.x, screen.y, floating.size)
  }
}

function drawHook(): void {
  if (hook.state === 'idle') {
    return
  }
  const playerScreen = worldToScreen(player)
  const hookScreen = worldToScreen(hook)
  ctx.strokeStyle = '#463225'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(playerScreen.x, playerScreen.y)
  ctx.lineTo(hookScreen.x, hookScreen.y)
  ctx.stroke()
  drawSprite('hook_tool', hookScreen.x, hookScreen.y, 38)
}

function drawPlayer(): void {
  const screen = worldToScreen(player)
  const spriteName: SpriteName =
    player.facing === 'up'
      ? player.moving
        ? 'char_back_walk'
        : 'char_idle_back'
      : player.facing === 'down'
        ? player.moving
          ? 'char_front_walk'
          : 'char_idle_front'
        : player.moving
          ? 'char_side_walk'
          : 'char_side_stand'

  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'
  ctx.beginPath()
  ctx.ellipse(screen.x, screen.y + 23, 18, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  drawSprite(spriteName, screen.x, screen.y - 10, 74, player.facing === 'left')
}

function renderInventory(): void {
  inventoryGrid.innerHTML = INVENTORY_ITEMS.map((item) => {
    const icon = item === 'wood' ? 'wooden_plank_single' : item === 'plastic' ? 'paper_scrap' : item === 'leaf' ? 'leaf' : item === 'rope' ? 'rope_coil' : item === 'rawFish' ? 'fish_raw' : 'fish_cooked'
    return `
      <div class="slot">
        <canvas class="slot-icon" data-sprite="${icon}" width="44" height="44"></canvas>
        <span>${itemLabels[item]}</span>
        <strong>${inventory[item]}</strong>
      </div>
    `
  }).join('')

  inventoryGrid.querySelectorAll<HTMLCanvasElement>('.slot-icon').forEach((slotCanvas) => {
    const slotCtx = slotCanvas.getContext('2d')
    const name = slotCanvas.dataset.sprite as SpriteName | undefined
    if (!slotCtx || !name || !sprite.complete) {
      return
    }
    const oldCtx = ctx.getTransform()
    const frame = frames[name]
    slotCtx.clearRect(0, 0, 44, 44)
    slotCtx.drawImage(
      sprite,
      frame.x * sprite.naturalWidth,
      frame.y * sprite.naturalHeight,
      frame.w * sprite.naturalWidth,
      frame.h * sprite.naturalHeight,
      4,
      4,
      36,
      36,
    )
    ctx.setTransform(oldCtx)
  })
}

function checkGoal(): void {
  const counts = countBuildings()
  completed = raft.size >= 25 && counts.grill >= 1 && counts.storage >= 1 && counts.net >= 2
  if (completed) {
    showToast('木筏已经稳定下来啦！V0.5 目标完成')
  }
}

function countBuildings(): Record<BuildingKind, number> {
  const counts: Record<BuildingKind, number> = { grill: 0, storage: 0, net: 0 }
  buildings.forEach((building) => {
    counts[building.kind] += 1
  })
  return counts
}

function updateGoalText(): void {
  const counts = countBuildings()
  goalText.textContent = completed
    ? '完成'
    : `地板 ${raft.size}/25  烤架 ${counts.grill}/1  箱 ${counts.storage}/1  网 ${counts.net}/2`
}

function togglePanel(panel: HTMLElement): void {
  panel.classList.toggle('hidden')
}

function loop(now: number): void {
  const dt = Math.min(0.033, (now - lastTime) / 1000)
  lastTime = now
  update(dt)
  updateGoalText()
  draw()
  requestAnimationFrame(loop)
}

function setupEvents(): void {
  window.addEventListener('resize', resize)
  window.addEventListener('keydown', (event) => {
    keys.add(event.code)
    if (event.code === 'KeyB') togglePanel(buildPanel)
    if (event.code === 'Tab') {
      event.preventDefault()
      togglePanel(inventoryPanel)
    }
    if (event.code === 'KeyE') interact()
    if (event.code === 'Space') throwHook({ x: player.x + pointerAim.x * HOOK_MAX, y: player.y + pointerAim.y * HOOK_MAX })
  })
  window.addEventListener('keyup', (event) => keys.delete(event.code))

  canvas.addEventListener('pointerdown', (event) => {
    const target = event.target
    if (!(target instanceof HTMLCanvasElement)) {
      return
    }
    const world = screenToWorld(event.clientX, event.clientY)
    pointerAim.x = world.x - player.x
    pointerAim.y = world.y - player.y
    throwHook(world)
  })

  document.querySelector('#bag-toggle')?.addEventListener('click', () => togglePanel(inventoryPanel))
  document.querySelector('#build-toggle')?.addEventListener('click', () => togglePanel(buildPanel))
  document.querySelector('#hook-button')?.addEventListener('click', () => {
    throwHook({ x: player.x + pointerAim.x * HOOK_MAX, y: player.y + pointerAim.y * HOOK_MAX })
  })
  document.querySelector('#interact-button')?.addEventListener('click', interact)
  document.querySelector('#eat-button')?.addEventListener('click', eatFish)
  document.querySelectorAll<HTMLElement>('[data-close]').forEach((button) => {
    button.addEventListener('click', () => {
      inventoryPanel.classList.add('hidden')
      buildPanel.classList.add('hidden')
    })
  })
  document.querySelectorAll<HTMLButtonElement>('[data-craft]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.craft
      if (action === 'rope') craftRope()
      if (action === 'floor') buildFloor()
      if (action === 'grill') buildOnCurrentTile('grill')
      if (action === 'storage') buildOnCurrentTile('storage')
      if (action === 'net') buildOnCurrentTile('net')
    })
  })

  stick.addEventListener('pointerdown', (event) => {
    joystickPointer = event.pointerId
    stick.setPointerCapture(event.pointerId)
    updateStick(event)
  })
  stick.addEventListener('pointermove', (event) => {
    if (event.pointerId === joystickPointer) {
      updateStick(event)
    }
  })
  stick.addEventListener('pointerup', resetStick)
  stick.addEventListener('pointercancel', resetStick)
}

function updateStick(event: PointerEvent): void {
  const rect = stick.getBoundingClientRect()
  const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  const raw = { x: event.clientX - center.x, y: event.clientY - center.y }
  const max = rect.width * 0.34
  const length = Math.min(max, Math.hypot(raw.x, raw.y))
  const dir = normalize(raw)
  moveInput.x = dir.x * (length / max)
  moveInput.y = dir.y * (length / max)
  const nub = stick.querySelector<HTMLElement>('i')
  if (nub) {
    nub.style.transform = `translate(${moveInput.x * max}px, ${moveInput.y * max}px)`
  }
}

function resetStick(event: PointerEvent): void {
  if (event.pointerId !== joystickPointer) {
    return
  }
  joystickPointer = null
  moveInput.x = 0
  moveInput.y = 0
  const nub = stick.querySelector<HTMLElement>('i')
  if (nub) {
    nub.style.transform = 'translate(0, 0)'
  }
}

resize()
setupEvents()
renderInventory()
sprite.addEventListener('load', renderInventory)
requestAnimationFrame(loop)
