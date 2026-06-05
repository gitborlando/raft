import spriteUrl from '../assets/spirte.png'
import { SpriteRenderer } from './SpriteRenderer'
import { frames } from './sprites'
import {
  FLOAT_RADIUS,
  HOOK_BACK_SPEED,
  HOOK_MAX,
  HOOK_OUT_SPEED,
  INVENTORY_ITEMS,
  PLAYER_RADIUS,
  TILE,
  floatLabels,
  itemLabels,
} from './constants'
import { queryRequired } from './dom'
import { axisDir, dist, distanceToSegment, normalize, normalizeInput, tileCenter, tileFromWorld, tileKey } from './geometry'
import type { Building, BuildingKind, FloatKind, Floating, Hook, Item, SpriteName, Vec } from './types'


const canvas = queryRequired<HTMLCanvasElement>('#game')
const gameStage = queryRequired<HTMLElement>('#game-stage')
const hungerFill = queryRequired<HTMLElement>('#hunger-fill')
const hungerValue = queryRequired<HTMLElement>('#hunger-value')
const toast = queryRequired<HTMLElement>('#toast')
const inventoryGrid = queryRequired<HTMLElement>('#inventory-grid')
const inventoryPanel = queryRequired<HTMLElement>('#inventory-panel')
const buildPanel = queryRequired<HTMLElement>('#build-panel')
const goalText = queryRequired<HTMLElement>('#goal-text')
const stick = queryRequired<HTMLElement>('#stick')
const displayScaleInput = queryRequired<HTMLInputElement>('#display-scale')
const displayScaleValue = queryRequired<HTMLElement>('#display-scale-value')
const orientationToggle = queryRequired<HTMLButtonElement>('#orientation-toggle')
const fullscreenPrompt = queryRequired<HTMLElement>('#fullscreen-prompt')
const fullscreenButton = queryRequired<HTMLButtonElement>('#fullscreen-button')
const context = canvas.getContext('2d')

if (!context) {
  throw new Error('Canvas is unavailable')
}

const ctx: CanvasRenderingContext2D = context

const sprite = new Image()
sprite.src = spriteUrl
const spriteRenderer = new SpriteRenderer(ctx, sprite)
const RAFT_DRIFT: Vec = { x: 0, y: -28 }

const inventory: Record<Item, number> = {
  wood: 999,
  plastic: 999,
  leaf: 999,
  rope: 999,
  rawFish: 999,
  cookedFish: 999,
}

const raft = new Set<string>()
const buildings = new Map<string, Building>()
const floats: Floating[] = []
const keys = new Set<string>()
const camera: Vec = { x: 0, y: 0 }
const driftOffset: Vec = { x: 0, y: 0 }
const skipFullscreenPrompt = /SM-/i.test(navigator.userAgent)
const pointerAim: Vec = { x: 1, y: 0 }
const moveInput: Vec = { x: 0, y: 0 }
const player: Vec & { facing: 'down' | 'up' | 'left' | 'right'; moving: boolean; walkTime: number } = {
  x: 0,
  y: 0,
  facing: 'down',
  moving: false,
  walkTime: 0,
}
const hook: Hook = {
  state: 'idle',
  x: 0,
  y: 0,
  prevX: 0,
  prevY: 0,
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
let displayScale = Number(displayScaleInput.value) || 0.6
let fullscreenRequested = false

for (let gx = -1; gx <= 1; gx += 1) {
  for (let gy = -1; gy <= 1; gy += 1) {
    raft.add(tileKey(gx, gy))
  }
}

function resize(): void {
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = gameStage.clientWidth
  height = gameStage.clientHeight
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function worldToScreen(pos: Vec): Vec {
  return {
    x: (pos.x - camera.x) * displayScale + width / 2,
    y: (pos.y - camera.y) * displayScale + height / 2,
  }
}

function screenToWorld(x: number, y: number): Vec {
  return {
    x: (x - width / 2) / displayScale + camera.x + driftOffset.x,
    y: (y - height / 2) / displayScale + camera.y + driftOffset.y,
  }
}

function screenSize(value: number): number {
  return value * displayScale
}

function raftToSea(pos: Vec): Vec {
  return {
    x: pos.x + driftOffset.x,
    y: pos.y + driftOffset.y,
  }
}

function seaToScreen(pos: Vec): Vec {
  return {
    x: (pos.x - driftOffset.x - camera.x) * displayScale + width / 2,
    y: (pos.y - driftOffset.y - camera.y) * displayScale + height / 2,
  }
}

function setDisplayScale(value: number): void {
  displayScale = Math.min(1, Math.max(0.35, value))
  document.documentElement.style.setProperty('--display-scale', String(displayScale))
  displayScaleInput.value = String(displayScale)
  displayScaleValue.textContent = `${Math.round(displayScale * 100)}%`
}

function toggleOrientationLayout(): void {
  document.body.classList.toggle('portrait-layout')
  requestAnimationFrame(resize)
}

async function requestFullscreenIfNeeded(): Promise<void> {
  if (skipFullscreenPrompt) {
    fullscreenPrompt.classList.add('hidden')
    fullscreenRequested = false
    return
  }

  if (fullscreenRequested) {
    return
  }

  fullscreenRequested = true

  if (document.fullscreenElement) {
    fullscreenPrompt.classList.add('hidden')
    return
  }

  try {
    await document.documentElement.requestFullscreen()
    fullscreenPrompt.classList.add('hidden')
  } catch {
    fullscreenRequested = false
    fullscreenPrompt.classList.remove('hidden')
  }
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

function canPay(_cost: Partial<Record<Item, number>>): boolean {
  return true
}

function pay(cost: Partial<Record<Item, number>>): boolean {
  if (!canPay(cost)) {
    showToast('鏉愭枡涓嶈冻')
    return false
  }
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
  const margin = 160 / displayScale
  const worldTopLeft = screenToWorld(0, 0)
  const worldBottomRight = screenToWorld(width, height)
  const worldViewWidth = worldBottomRight.x - worldTopLeft.x
  const worldViewHeight = worldBottomRight.y - worldTopLeft.y
  const x = fromTop
    ? worldTopLeft.x - margin + Math.random() * (worldViewWidth + margin * 2)
    : worldBottomRight.x + margin
  const y = fromTop
    ? worldTopLeft.y - margin
    : worldTopLeft.y - margin + Math.random() * (worldViewHeight + margin * 2)

  floats.push({
    id: nextFloatId,
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
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
  const playerSea = raftToSea(player)
  const dir = normalize({ x: target.x - playerSea.x, y: target.y - playerSea.y })
  hook.state = 'flying'
  hook.x = playerSea.x
  hook.y = playerSea.y
  hook.prevX = playerSea.x
  hook.prevY = playerSea.y
  hook.dir = dir
  hook.maxX = playerSea.x + dir.x * HOOK_MAX
  hook.maxY = playerSea.y + dir.y * HOOK_MAX
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
    showToast('娌℃湁鐑ら奔')
    return
  }
  renderInventory()
  showToast('鍚冧笅鐑ら奔')
}

function update(dt: number): void {
  driftOffset.x += RAFT_DRIFT.x * dt
  driftOffset.y += RAFT_DRIFT.y * dt

  const keyboardInput = getKeyboardInput()
  const input = normalizeInput({
    x: keyboardInput.x + moveInput.x,
    y: keyboardInput.y + moveInput.y,
  })
  const speed = 132
  player.moving = Math.abs(input.x) > 0.01 || Math.abs(input.y) > 0.01
  if (player.moving) {
    player.walkTime += dt
    lastMoveDir = { x: input.x, y: input.y }
    if (Math.abs(input.x) > Math.abs(input.y)) {
      player.facing = input.x > 0 ? 'right' : 'left'
    } else {
      player.facing = input.y > 0 ? 'down' : 'up'
    }
    movePlayer(input.x * speed * dt, input.y * speed * dt)
  } else {
    player.walkTime = 0
  }

  updateFloats(dt)
  updateHook(dt)
  updateGrills(dt)
  updateHud(dt)

  camera.x += (player.x - camera.x) * Math.min(1, dt * 7)
  camera.y += (player.y - camera.y) * Math.min(1, dt * 7)
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
  const samples = [
    { x, y },
    { x: x - PLAYER_RADIUS, y },
    { x: x + PLAYER_RADIUS, y },
    { x, y: y - PLAYER_RADIUS },
    { x, y: y + PLAYER_RADIUS },
  ]
  return samples.every((sample) => hasRaftTile(tileFromWorld(sample.x, sample.y)))
}

function updateFloats(dt: number): void {
  spawnTimer -= dt
  if (spawnTimer <= 0) {
    spawnFloat()
    spawnTimer = 1.05 + Math.random() * 0.75
  }

  buildings.forEach((building, key) => {
    if (building.kind !== 'net') {
      return
    }
    const [xRaw, yRaw] = key.split(',')
    const center = raftToSea(tileCenter(Number(xRaw), Number(yRaw)))
    for (const floating of floats) {
      if (!floating.captured && dist(floating, center) < TILE * 0.72) {
        floating.captured = true
        collectFloat(floating.kind)
      }
    }
  })

  for (let i = floats.length - 1; i >= 0; i -= 1) {
    const floating = floats[i]
    const screen = seaToScreen(floating)
    const collectedByHook = hook.attachedId === floating.id
    if ((!collectedByHook && floating.captured) || screen.y > height + screenSize(260) || screen.x < -screenSize(260)) {
      floats.splice(i, 1)
    }
  }
}

function updateHook(dt: number): void {
  const playerSea = raftToSea(player)

  if (hook.state === 'idle') {
    hook.x = playerSea.x
    hook.y = playerSea.y
    hook.prevX = playerSea.x
    hook.prevY = playerSea.y
    return
  }

  if (hook.state === 'flying') {
    hook.prevX = hook.x
    hook.prevY = hook.y
    hook.x += hook.dir.x * HOOK_OUT_SPEED * dt
    hook.y += hook.dir.y * HOOK_OUT_SPEED * dt
    for (const floating of floats) {
      if (!floating.captured && distanceToSegment(floating, { x: hook.prevX, y: hook.prevY }, hook) < FLOAT_RADIUS) {
        hook.attachedId = floating.id
        floating.captured = true
        hook.state = 'returning'
        break
      }
    }
    if (dist(hook, playerSea) >= HOOK_MAX || dist(hook, { x: hook.maxX, y: hook.maxY }) < 10) {
      hook.state = 'returning'
    }
  } else {
    hook.prevX = hook.x
    hook.prevY = hook.y
    const toPlayer = normalize({ x: playerSea.x - hook.x, y: playerSea.y - hook.y })
    hook.x += toPlayer.x * HOOK_BACK_SPEED * dt
    hook.y += toPlayer.y * HOOK_BACK_SPEED * dt
    const attached = floats.find((floating) => floating.id === hook.attachedId)
    if (attached) {
      attached.x = hook.x
      attached.y = hook.y
    }
    if (dist(hook, playerSea) < 18) {
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
        showToast('鐑ら奔瀹屾垚')
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
  drawFloats()
  drawRaft()
  drawHook()
  drawPlayer()
}

function drawOcean(): void {
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#42c5d8')
  gradient.addColorStop(0.55, '#258cb9')
  gradient.addColorStop(1, '#176c98')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  const tileSize = screenSize(104)
  const seaX = camera.x + driftOffset.x
  const seaY = camera.y + driftOffset.y
  const offsetX = ((-seaX * displayScale) % tileSize) - tileSize
  const offsetY = ((-seaY * displayScale) % tileSize) - tileSize
  for (let y = offsetY; y < height + tileSize; y += tileSize) {
    for (let x = offsetX; x < width + tileSize; x += tileSize) {
      const frameName = (Math.floor((x - offsetX) / tileSize) + Math.floor((y - offsetY) / tileSize)) % 2 === 0 ? 'tile_water_1' : 'tile_water_2'
      ctx.globalAlpha = 0.38
      spriteRenderer.drawRect(frameName, x - 1, y - 1, tileSize + 2, tileSize + 2)
      ctx.globalAlpha = 1
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
      spriteRenderer.draw(state === 'empty' ? 'prop_grill_empty' : state === 'cooking' ? 'prop_grill_raw_fish' : 'prop_grill_cooked_fish', screen.x, screen.y - screenSize(5), screenSize(58))
      if (state === 'cooking' && building.grill) {
        drawProgress(screen.x - screenSize(25), screen.y + screenSize(27), screenSize(50), building.grill.timer / 8)
      }
    } else if (building.kind === 'storage') {
      spriteRenderer.draw('prop_chest_closed', screen.x, screen.y - screenSize(4), screenSize(54))
    } else {
      spriteRenderer.draw('prop_fish_net', screen.x, screen.y, screenSize(58))
    }
  })
}

function drawFloorTile(x: number, y: number): void {
  ctx.save()
  ctx.translate(x, y)
  const tileSize = screenSize(TILE)
  spriteRenderer.drawRect('tile_wood_floor', -tileSize / 2, -tileSize / 2, tileSize, tileSize)
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
  roundRect(x, y, w, screenSize(7), screenSize(4))
  ctx.fill()
  ctx.fillStyle = '#ffb347'
  roundRect(x + screenSize(1), y + screenSize(1), (w - screenSize(2)) * (1 - ratio), screenSize(5), screenSize(3))
  ctx.fill()
}

function drawFloats(): void {
  for (const floating of floats) {
    const screen = seaToScreen(floating)
    const name: SpriteName =
      floating.kind === 'wood'
        ? 'item_single_plank'
        : floating.kind === 'plastic'
          ? 'item_plastic_waste'
          : floating.kind === 'leaf'
            ? 'item_palm_leaf'
            : 'item_wood_crate'
    spriteRenderer.draw(name, screen.x, screen.y, screenSize(floating.size))
  }
}

function drawHook(): void {
  if (hook.state === 'idle') {
    return
  }
  const playerScreen = worldToScreen(player)
  const hookScreen = seaToScreen(hook)
  ctx.strokeStyle = '#463225'
  ctx.lineWidth = screenSize(3)
  ctx.beginPath()
  ctx.moveTo(playerScreen.x, playerScreen.y)
  ctx.lineTo(hookScreen.x, hookScreen.y)
  ctx.stroke()
  spriteRenderer.drawRotated('tool_iron_hook', hookScreen.x, hookScreen.y, screenSize(38), Math.atan2(hook.dir.y, hook.dir.x) + Math.PI / 2)
}

function drawPlayer(): void {
  const screen = worldToScreen(player)
  const showWalkFrame = player.moving && Math.floor(player.walkTime / 0.16) % 2 === 0
  const spriteName: SpriteName =
    player.facing === 'up'
      ? showWalkFrame
        ? 'chara_back_walk'
        : 'chara_back_idle'
      : player.facing === 'down'
        ? showWalkFrame
          ? 'chara_front_walk'
          : 'chara_front_idle'
        : player.facing === 'left'
          ? showWalkFrame
            ? 'chara_side_walk'
            : 'chara_side_idle_right'
          : showWalkFrame
            ? 'chara_side_walk'
            : 'chara_side_idle_left'
  const flipPlayer = player.facing === 'left' && spriteName === 'chara_side_walk'

  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'
  ctx.beginPath()
  ctx.ellipse(screen.x, screen.y + screenSize(23), screenSize(18), screenSize(8), 0, 0, Math.PI * 2)
  ctx.fill()
  spriteRenderer.draw(spriteName, screen.x, screen.y - screenSize(10), screenSize(74), flipPlayer)
}

function renderInventory(): void {
  inventoryGrid.innerHTML = INVENTORY_ITEMS.map((item) => {
    const icon = item === 'wood' ? 'item_single_plank' : item === 'plastic' ? 'item_plastic_waste' : item === 'leaf' ? 'item_small_leaf' : item === 'rope' ? 'item_rope_coil' : item === 'rawFish' ? 'item_raw_fish' : 'item_cooked_fish'
    const spriteStyle = getSpriteBackgroundStyle(icon)
    return `
      <div class="slot">
        <div class="slot-icon" style="${spriteStyle}"></div>
        <span>${itemLabels[item]}</span>
        <strong>${inventory[item]}</strong>
      </div>
    `
  }).join('')
}

function getSpriteBackgroundStyle(name: SpriteName): string {
  const frame = frames[name]
  const positionX = frame.x / (1 - frame.w) * 100
  const positionY = frame.y / (1 - frame.h) * 100
  const sizeX = 100 / frame.w
  const sizeY = 100 / frame.h

  return [
    `--slot-sprite: url(${spriteUrl})`,
    `--slot-position: ${positionX.toFixed(4)}% ${positionY.toFixed(4)}%`,
    `--slot-size: ${sizeX.toFixed(4)}% ${sizeY.toFixed(4)}%`,
  ].join(';')
}

function checkGoal(): void {
  const counts = countBuildings()
  completed = raft.size >= 25 && counts.grill >= 1 && counts.storage >= 1 && counts.net >= 2
  if (completed) {
    showToast('鏈ㄧ瓘宸茬粡绋冲畾涓嬫潵鍟︼紒V0.5 鐩爣瀹屾垚')
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
    ? '瀹屾垚'
    : `鍦版澘 ${raft.size}/25  鐑ゆ灦 ${counts.grill}/1  绠?${counts.storage}/1  缃?${counts.net}/2`
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
  if (!skipFullscreenPrompt) {
    window.addEventListener('pointerdown', () => void requestFullscreenIfNeeded(), { once: true })
    window.addEventListener('keydown', () => void requestFullscreenIfNeeded(), { once: true })
  }
  document.addEventListener('fullscreenchange', () => {
    if (skipFullscreenPrompt) {
      fullscreenPrompt.classList.add('hidden')
      fullscreenRequested = false
      return
    }
    fullscreenPrompt.classList.toggle('hidden', Boolean(document.fullscreenElement))
    fullscreenRequested = Boolean(document.fullscreenElement)
  })
  window.addEventListener('keydown', (event) => {
    keys.add(event.code)
    if (event.code === 'KeyB') togglePanel(buildPanel)
    if (event.code === 'Tab') {
      event.preventDefault()
      togglePanel(inventoryPanel)
    }
    if (event.code === 'KeyE') interact()
    if (event.code === 'Space') {
      const playerSea = raftToSea(player)
      throwHook({ x: playerSea.x + pointerAim.x * HOOK_MAX, y: playerSea.y + pointerAim.y * HOOK_MAX })
    }
  })
  window.addEventListener('keyup', (event) => keys.delete(event.code))

  canvas.addEventListener('pointerdown', (event) => {
    const target = event.target
    if (!(target instanceof HTMLCanvasElement)) {
      return
    }
    const world = screenToWorld(event.offsetX, event.offsetY)
    const playerSea = raftToSea(player)
    pointerAim.x = world.x - playerSea.x
    pointerAim.y = world.y - playerSea.y
    throwHook(world)
  })

  document.querySelector('#bag-toggle')?.addEventListener('click', () => togglePanel(inventoryPanel))
  document.querySelector('#build-toggle')?.addEventListener('click', () => togglePanel(buildPanel))
  document.querySelector('#hook-button')?.addEventListener('click', () => {
    const playerSea = raftToSea(player)
    throwHook({ x: playerSea.x + pointerAim.x * HOOK_MAX, y: playerSea.y + pointerAim.y * HOOK_MAX })
  })
  document.querySelector('#interact-button')?.addEventListener('click', interact)
  document.querySelector('#eat-button')?.addEventListener('click', eatFish)
  fullscreenButton.addEventListener('click', () => void requestFullscreenIfNeeded())
  orientationToggle.addEventListener('click', toggleOrientationLayout)
  displayScaleInput.addEventListener('input', () => {
    setDisplayScale(Number(displayScaleInput.value))
  })
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
  const center = { x: stick.clientWidth / 2, y: stick.clientHeight / 2 }
  const raw = { x: event.offsetX - center.x, y: event.offsetY - center.y }
  const max = stick.clientWidth * 0.34
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

setDisplayScale(displayScale)
resize()
setupEvents()
renderInventory()
if (!skipFullscreenPrompt) {
  void requestFullscreenIfNeeded()
}
requestAnimationFrame(loop)


