import * as Phaser from 'phaser'
import spriteUrl from '../../assets/spirte.png'
import {
  FLOAT_RADIUS,
  HOOK_BACK_SPEED,
  HOOK_MAX,
  HOOK_OUT_SPEED,
  PLAYER_RADIUS,
  TILE,
  floatLabels,
} from '../constants'
import { axisDir, dist, distanceToSegment, normalize, normalizeInput, tileCenter, tileFromWorld } from '../geometry'
import { buildCosts, buildingLabels } from '../recipes'
import { frames } from '../sprites'
import type { Building, BuildingKind, FloatKind, Floating, Hook, Item, PlayerFacing, SpriteName, Vec } from '../types'
import type { RootStore } from '../../stores/RootStore'

type RuntimePlayer = Vec & {
  facing: PlayerFacing
  moving: boolean
  walkTime: number
}

const RAFT_DRIFT: Vec = { x: 0, y: -28 }
const SPRITE_SHEET_KEY = 'raft-sprites'

export class MainScene extends Phaser.Scene {
  private readonly rootStore: RootStore
  private readonly floats: Floating[] = []
  private readonly driftOffset: Vec = { x: 0, y: 0 }
  private readonly pointerAim: Vec = { x: 1, y: 0 }
  private readonly player: RuntimePlayer = {
    x: 0,
    y: 0,
    facing: 'down',
    moving: false,
    walkTime: 0,
  }
  private readonly hook: Hook = {
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

  private backgroundGraphics!: Phaser.GameObjects.Graphics
  private overlayGraphics!: Phaser.GameObjects.Graphics
  private followTarget!: Phaser.GameObjects.Zone
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private readonly raftSprites = new Map<string, Phaser.GameObjects.Image>()
  private readonly buildingSprites = new Map<string, Phaser.GameObjects.Image>()
  private readonly floatSprites = new Map<number, Phaser.GameObjects.Image>()
  private readonly oceanSprites = new Map<string, Phaser.GameObjects.Image>()
  private playerSprite!: Phaser.GameObjects.Image
  private hookSprite!: Phaser.GameObjects.Image
  private nextFloatId = 1
  private spawnTimer = 0

  constructor(rootStore: RootStore) {
    super('MainScene')
    this.rootStore = rootStore
  }

  preload(): void {
    this.load.image(SPRITE_SHEET_KEY, spriteUrl)
  }

  create(): void {
    this.registerSpriteFrames()
    this.backgroundGraphics = this.add.graphics().setDepth(0)
    this.overlayGraphics = this.add.graphics().setDepth(40)
    this.followTarget = this.add.zone(this.player.x, this.player.y, 1, 1)
    this.playerSprite = this.createSprite('chara_front_idle', 50)
    this.hookSprite = this.createSprite('tool_hook', 41).setVisible(false)

    const camera = this.cameras.main
    camera.setBackgroundColor('#0f6e92')
    camera.startFollow(this.followTarget, true, 0.14, 0.14)
    camera.setRoundPixels(false)
    this.syncCameraRenderScale()

    this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys
    this.keys = this.input.keyboard?.addKeys('W,A,S,D,SPACE,E,B,TAB') as Record<string, Phaser.Input.Keyboard.Key>

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const world = {
        x: pointer.worldX + this.driftOffset.x,
        y: pointer.worldY + this.driftOffset.y,
      }
      const playerSea = this.raftToSea(this.player)
      this.pointerAim.x = world.x - playerSea.x
      this.pointerAim.y = world.y - playerSea.y
      this.throwHook(world)
    })

    this.input.keyboard?.on('keydown-B', () => this.rootStore.ui.toggleBuild())
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault()
      this.rootStore.ui.toggleInventory()
    })
    this.input.keyboard?.on('keydown-E', () => this.interact())
    this.input.keyboard?.on('keydown-SPACE', () => this.throwHookForward())

    this.rootStore.bridge.attachScene(this)
    this.rootStore.session.setReady(true)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.rootStore.bridge.detachScene(this)
      this.rootStore.session.setReady(false)
    })
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(0.033, deltaMs / 1000)
    this.driftOffset.x += RAFT_DRIFT.x * dt
    this.driftOffset.y += RAFT_DRIFT.y * dt

    const keyboardInput = this.getKeyboardInput()
    const input = normalizeInput({
      x: keyboardInput.x + this.rootStore.bridge.moveInput.x,
      y: keyboardInput.y + this.rootStore.bridge.moveInput.y,
    })

    this.updatePlayer(dt, input, keyboardInput)
    this.updateFloats(dt)
    this.updateHook(dt)
    this.updateGrills(dt)
    this.rootStore.player.reduceHunger(dt * 1.45)

    this.followTarget.setPosition(this.player.x, this.player.y)
    this.syncCameraRenderScale()
    this.drawWorld()
  }

  throwHookForward(): void {
    const playerSea = this.raftToSea(this.player)
    this.throwHook({
      x: playerSea.x + this.pointerAim.x * HOOK_MAX,
      y: playerSea.y + this.pointerAim.y * HOOK_MAX,
    })
  }

  buildFloor(): void {
    const target = this.findFloorTarget()
    if (!target) {
      this.rootStore.ui.showToast('站到木筏边缘再扩建')
      return
    }
    if (!this.rootStore.inventory.pay(buildCosts.floor)) {
      this.rootStore.ui.showToast('材料不足')
      return
    }
    this.rootStore.world.addRaftTile(target.x, target.y)
    this.rootStore.ui.showToast('扩建了一块地板')
    this.maybeAnnounceGoalCompletion()
  }

  buildOnCurrentTile(kind: BuildingKind): void {
    const pos = this.currentPlayerTile()
    if (!this.rootStore.world.hasRaftTile(pos.x, pos.y)) {
      this.rootStore.ui.showToast('只能建在木筏上')
      return
    }
    if (this.rootStore.world.hasBuildingAt(pos.x, pos.y)) {
      this.rootStore.ui.showToast('这里已经有建筑')
      return
    }
    if (kind === 'net' && !this.rootStore.world.isEdgeTile(pos.x, pos.y)) {
      this.rootStore.ui.showToast('收集网要建在木筏边缘')
      return
    }
    if (!this.rootStore.inventory.pay(buildCosts[kind])) {
      this.rootStore.ui.showToast('材料不足')
      return
    }

    const building: Building = {
      kind,
      grill: kind === 'grill' ? { state: 'empty', timer: 0 } : undefined,
    }
    this.rootStore.world.placeBuilding(pos.x, pos.y, building)
    this.rootStore.ui.showToast(`建造了${buildingLabels[kind]}`)
    this.maybeAnnounceGoalCompletion()
  }

  interact(): void {
    const grillEntry = this.nearestGrill()
    if (grillEntry?.building.grill) {
      const grill = grillEntry.building.grill
      if (grill.state === 'done') {
        grill.state = 'empty'
        grill.timer = 0
        this.rootStore.inventory.add('cookedFish', 1)
        this.rootStore.ui.showToast('取出烤鱼 x1')
        return
      }
      if (grill.state === 'empty') {
        if (!this.rootStore.inventory.remove('rawFish', 1)) {
          this.rootStore.ui.showToast('没有生鱼')
          return
        }
        grill.state = 'cooking'
        grill.timer = 8
        this.rootStore.ui.showToast('开始烤鱼')
        return
      }
      this.rootStore.ui.showToast('鱼还在烤')
      return
    }

    const current = this.currentPlayerTile()
    const building = this.rootStore.world.getBuildingAt(current.x, current.y)
    if (building?.kind === 'storage') {
      this.rootStore.ui.openInventory()
      this.rootStore.ui.showToast('打开储物箱')
      return
    }

    this.rootStore.ui.showToast('附近没有可互动建筑')
  }

  private updatePlayer(dt: number, input: Vec, keyboardInput: Vec): void {
    const speed = 132
    this.player.moving = Math.abs(input.x) > 0.01 || Math.abs(input.y) > 0.01

    if (this.player.moving) {
      this.player.walkTime += dt
      this.rootStore.player.setLastMoveDir(input)
      this.updateFacingFromKeyboardInput(keyboardInput, input)
      this.movePlayer(input.x * speed * dt, input.y * speed * dt)
    } else {
      this.player.walkTime = 0
    }

    this.rootStore.player.setFacing(this.player.facing)
    this.rootStore.player.setMoving(this.player.moving)
  }

  private updateFacingFromKeyboardInput(keyboardInput: Vec, input: Vec): void {
    if (keyboardInput.x < 0) {
      this.player.facing = 'left'
      return
    }

    if (keyboardInput.x > 0) {
      this.player.facing = 'right'
      return
    }

    if (keyboardInput.y < 0) {
      this.player.facing = 'up'
      return
    }

    if (keyboardInput.y > 0) {
      this.player.facing = 'down'
      return
    }

    this.updateFacingFromInput(input)
  }

  private updateFacingFromInput(input: Vec): void {
    const horizontal = Math.abs(input.x)
    const vertical = Math.abs(input.y)

    if (horizontal < 0.08 && vertical < 0.08) {
      return
    }

    if (horizontal >= vertical) {
      this.player.facing = input.x >= 0 ? 'right' : 'left'
      return
    }

    this.player.facing = input.y >= 0 ? 'down' : 'up'
  }

  private getKeyboardInput(): Vec {
    const x = (this.cursors.right.isDown || this.keys.D.isDown ? 1 : 0) - (this.cursors.left.isDown || this.keys.A.isDown ? 1 : 0)
    const y = (this.cursors.down.isDown || this.keys.S.isDown ? 1 : 0) - (this.cursors.up.isDown || this.keys.W.isDown ? 1 : 0)
    return { x, y }
  }

  private movePlayer(dx: number, dy: number): void {
    const nextX = this.player.x + dx
    const nextY = this.player.y + dy
    if (this.canStandAt(nextX, this.player.y)) {
      this.player.x = nextX
    }
    if (this.canStandAt(this.player.x, nextY)) {
      this.player.y = nextY
    }
  }

  private canStandAt(x: number, y: number): boolean {
    const samples = [
      { x, y },
      { x: x - PLAYER_RADIUS, y },
      { x: x + PLAYER_RADIUS, y },
      { x, y: y - PLAYER_RADIUS },
      { x, y: y + PLAYER_RADIUS },
    ]
    return samples.every((sample) => {
      const tile = tileFromWorld(sample.x, sample.y)
      return this.rootStore.world.hasRaftTile(tile.x, tile.y)
    })
  }

  private updateFloats(dt: number): void {
    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawnFloat()
      this.spawnTimer = 1.05 + Math.random() * 0.75
    }

    for (const entry of this.rootStore.world.getBuildingEntries()) {
      if (entry.building.kind !== 'net') {
        continue
      }
      const center = this.raftToSea(tileCenter(entry.x, entry.y))
      for (const floating of this.floats) {
        if (!floating.captured && dist(floating, center) < TILE * 0.72) {
          floating.captured = true
          this.collectFloat(floating.kind)
        }
      }
    }

    const view = this.cameras.main.worldView
    for (let i = this.floats.length - 1; i >= 0; i -= 1) {
      const floating = this.floats[i]
      const display = this.seaToDisplay(floating)
      const collectedByHook = this.hook.attachedId === floating.id
      if (
        (!collectedByHook && floating.captured) ||
        display.y > view.bottom + 260 ||
        display.x < view.x - 260
      ) {
        this.floats.splice(i, 1)
      }
    }
  }

  private updateHook(dt: number): void {
    const playerSea = this.raftToSea(this.player)

    if (this.hook.state === 'idle') {
      this.hook.x = playerSea.x
      this.hook.y = playerSea.y
      this.hook.prevX = playerSea.x
      this.hook.prevY = playerSea.y
      return
    }

    if (this.hook.state === 'flying') {
      this.hook.prevX = this.hook.x
      this.hook.prevY = this.hook.y
      this.hook.x += this.hook.dir.x * HOOK_OUT_SPEED * dt
      this.hook.y += this.hook.dir.y * HOOK_OUT_SPEED * dt
      for (const floating of this.floats) {
        if (!floating.captured && distanceToSegment(floating, { x: this.hook.prevX, y: this.hook.prevY }, this.hook) < FLOAT_RADIUS) {
          this.hook.attachedId = floating.id
          floating.captured = true
          this.hook.state = 'returning'
          break
        }
      }
      if (dist(this.hook, playerSea) >= HOOK_MAX || dist(this.hook, { x: this.hook.maxX, y: this.hook.maxY }) < 10) {
        this.hook.state = 'returning'
      }
      return
    }

    this.hook.prevX = this.hook.x
    this.hook.prevY = this.hook.y
    const toPlayer = normalize({ x: playerSea.x - this.hook.x, y: playerSea.y - this.hook.y })
    this.hook.x += toPlayer.x * HOOK_BACK_SPEED * dt
    this.hook.y += toPlayer.y * HOOK_BACK_SPEED * dt

    const attached = this.floats.find((floating) => floating.id === this.hook.attachedId)
    if (attached) {
      attached.x = this.hook.x
      attached.y = this.hook.y
    }
    if (dist(this.hook, playerSea) < 18) {
      if (attached) {
        this.collectFloat(attached.kind)
        this.floats.splice(this.floats.indexOf(attached), 1)
      }
      this.hook.state = 'idle'
      this.hook.attachedId = null
    }
  }

  private updateGrills(dt: number): void {
    for (const entry of this.rootStore.world.getBuildingEntries()) {
      if (entry.building.grill?.state === 'cooking') {
        entry.building.grill.timer -= dt
        if (entry.building.grill.timer <= 0) {
          entry.building.grill.timer = 0
          entry.building.grill.state = 'done'
          this.rootStore.ui.showToast('烤鱼完成')
        }
      }
    }
  }

  private drawWorld(): void {
    const camera = this.cameras.main
    const view = camera.worldView

    this.drawOcean(view)
    this.syncFloatSprites()
    this.syncRaftSprites()
    this.syncBuildingSprites()
    this.drawOverlay()
    this.syncHookSprite()
    this.syncPlayerSprite()
  }

  private syncCameraRenderScale(): void {
    const canvas = this.game.canvas
    const renderScale = canvas.clientWidth > 0 ? canvas.width / canvas.clientWidth : 1
    this.cameras.main.setZoom(renderScale * this.rootStore.ui.displayScale)
  }

  private drawOcean(view: Phaser.Geom.Rectangle): void {
    const g = this.backgroundGraphics
    const left = view.x - 160
    const top = view.y - 160
    const width = view.width + 320
    const height = view.height + 320

    g.clear()
    g.fillStyle(0x157fa8, 1)
    g.fillRect(left, top, width, height)
    this.syncOceanSprites(left, top, width, height)
  }

  private syncOceanSprites(left: number, top: number, width: number, height: number): void {
    const seaLeft = left + this.driftOffset.x
    const seaTop = top + this.driftOffset.y
    const startCol = Math.floor(seaLeft / TILE)
    const startRow = Math.floor(seaTop / TILE)
    const endCol = Math.ceil((seaLeft + width) / TILE)
    const endRow = Math.ceil((seaTop + height) / TILE)
    const activeKeys = new Set<string>()

    for (let row = startRow; row <= endRow; row += 1) {
      for (let col = startCol; col <= endCol; col += 1) {
        const key = `${col},${row}`
        activeKeys.add(key)
        const frameName = this.pickOceanFrame(col, row)
        let sprite = this.oceanSprites.get(key)

        if (!sprite) {
          sprite = this.createSprite(frameName, 1)
          this.oceanSprites.set(key, sprite)
        }

        this.updateSprite(
          sprite,
          frameName,
          col * TILE - this.driftOffset.x + TILE / 2,
          row * TILE - this.driftOffset.y + TILE / 2,
          TILE,
          0,
          false,
          1,
        )
        sprite.setDisplaySize(TILE, TILE)
      }
    }

    for (const [key, sprite] of this.oceanSprites.entries()) {
      if (!activeKeys.has(key)) {
        sprite.destroy()
        this.oceanSprites.delete(key)
      }
    }
  }

  private pickOceanFrame(col: number, row: number): SpriteName {
    const hash = Math.imul(col ^ 0x45d9f3b, 0x45d9f3b) ^ Math.imul(row ^ 0x27d4eb2d, 0x27d4eb2d)
    return ((hash >>> 0) % 5) === 0 ? 'sea_tile_a' : 'sea_tile_b'
  }

  private drawOverlay(): void {
    const g = this.overlayGraphics
    g.clear()

    for (const entry of this.rootStore.world.getBuildingEntries()) {
      if (entry.building.grill?.state !== 'cooking') {
        continue
      }

      const center = tileCenter(entry.x, entry.y)
      const ratio = entry.building.grill.timer / 8
      g.fillStyle(0x1b2226, 0.85)
      g.fillRoundedRect(center.x - 22, center.y + 22, 44, 8, 4)
      g.fillStyle(0xffc857, 1)
      g.fillRoundedRect(center.x - 20, center.y + 24, 40 * (1 - ratio), 4, 2)
    }

    if (this.hook.state !== 'idle') {
      const playerSea = this.raftToSea(this.player)
      const playerDisplay = this.seaToDisplay(playerSea)
      const hookDisplay = this.seaToDisplay(this.hook)
      g.lineStyle(3, 0x463225, 0.95)
      g.lineBetween(playerDisplay.x, playerDisplay.y, hookDisplay.x, hookDisplay.y)
    }

    g.fillStyle(0x000000, 0.18)
    g.fillEllipse(this.player.x, this.player.y + 18, 34, 16)
  }

  private syncRaftSprites(): void {
    for (const key of Array.from(this.raftSprites.keys())) {
      if (!this.rootStore.world.raftTiles.has(key)) {
        this.raftSprites.get(key)?.destroy()
        this.raftSprites.delete(key)
      }
    }

    for (const key of this.rootStore.world.raftTiles) {
      const [tileX, tileY] = key.split(',').map(Number)
      const center = tileCenter(tileX, tileY)
      let sprite = this.raftSprites.get(key)

      if (!sprite) {
        sprite = this.createSprite('raft_floor_tile', 20)
        this.raftSprites.set(key, sprite)
      }

      this.updateSprite(sprite, 'raft_floor_tile', center.x, center.y, TILE + 4, 0, false, 1)
      sprite.setDisplaySize(TILE, TILE)
    }
  }

  private syncBuildingSprites(): void {
    const activeKeys = new Set<string>()

    for (const entry of this.rootStore.world.getBuildingEntries()) {
      const key = `${entry.x},${entry.y}`
      activeKeys.add(key)
      const center = tileCenter(entry.x, entry.y)
      const frameName: SpriteName =
        entry.building.kind === 'grill'
          ? entry.building.grill?.state === 'cooking'
            ? 'grill_fish_pink'
            : entry.building.grill?.state === 'done'
              ? 'grill_fish_cooked'
              : 'grill_empty'
          : entry.building.kind === 'storage'
            ? 'chest_closed'
            : 'raft_collect_net'
      const height = entry.building.kind === 'storage' ? 54 : 58
      const y = entry.building.kind === 'storage' ? center.y - 4 : entry.building.kind === 'grill' ? center.y - 5 : center.y
      let sprite = this.buildingSprites.get(key)

      if (!sprite) {
        sprite = this.createSprite(frameName, 30)
        this.buildingSprites.set(key, sprite)
      }

      this.updateSprite(sprite, frameName, center.x, y, height, 0, false, 1)
    }

    for (const key of Array.from(this.buildingSprites.keys())) {
      if (!activeKeys.has(key)) {
        this.buildingSprites.get(key)?.destroy()
        this.buildingSprites.delete(key)
      }
    }
  }

  private syncFloatSprites(): void {
    const activeIds = new Set<number>()

    for (const floating of this.floats) {
      activeIds.add(floating.id)
      const pos = this.seaToDisplay(floating)
      const frameName: SpriteName =
        floating.kind === 'wood'
          ? 'resource_driftwood_bundle'
          : floating.kind === 'plastic'
            ? 'resource_plastic_bottle'
            : floating.kind === 'leaf'
              ? 'resource_palm_leaf_big'
              : 'loot_crate_closed'
      let sprite = this.floatSprites.get(floating.id)

      if (!sprite) {
        sprite = this.createSprite(frameName, 10)
        this.floatSprites.set(floating.id, sprite)
      }

      this.updateSprite(sprite, frameName, pos.x, pos.y, floating.size, 0, false, 1)
    }

    for (const id of Array.from(this.floatSprites.keys())) {
      if (!activeIds.has(id)) {
        this.floatSprites.get(id)?.destroy()
        this.floatSprites.delete(id)
      }
    }
  }

  private syncHookSprite(): void {
    if (this.hook.state === 'idle') {
      this.hookSprite.setVisible(false)
      return
    }

    const hookDisplay = this.seaToDisplay(this.hook)
    this.updateSprite(
      this.hookSprite,
      'tool_hook',
      hookDisplay.x,
      hookDisplay.y,
      38,
      Math.atan2(this.hook.dir.y, this.hook.dir.x) + Math.PI / 2,
      false,
      1,
    )
    this.hookSprite.setVisible(true)
  }

  private syncPlayerSprite(): void {
    const useStepFrame = this.player.moving && Math.floor(this.player.walkTime / 0.16) % 2 === 0
    const frameName: SpriteName =
      this.player.facing === 'up'
        ? useStepFrame
          ? 'chara_back_walk'
          : 'chara_back_idle'
        : this.player.facing === 'down'
          ? useStepFrame
            ? 'chara_front_walk'
            : 'chara_front_idle'
          : this.player.facing === 'left'
            ? useStepFrame
              ? 'chara_left_run'
              : 'chara_left_idle'
            : useStepFrame
              ? 'chara_right_run'
              : 'chara_right_idle'

    this.updateSprite(
      this.playerSprite,
      frameName,
      this.player.x,
      this.player.y - 10,
      74,
      0,
      this.shouldFlipPlayerFrame(frameName),
      1,
    )
  }

  private shouldFlipPlayerFrame(_frameName: SpriteName): boolean {
    return false
  }

  private registerSpriteFrames(): void {
    const texture = this.textures.get(SPRITE_SHEET_KEY)
    texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
    const source = texture.source[0]
    const width = source.width
    const height = source.height

    for (const [name, frame] of Object.entries(frames)) {
      if (texture.has(name)) {
        continue
      }
      texture.add(
        name,
        0,
        Math.round(frame.x * width),
        Math.round(frame.y * height),
        Math.round(frame.w * width),
        Math.round(frame.h * height),
      )
    }
  }

  private createSprite(name: SpriteName, depth: number): Phaser.GameObjects.Image {
    return this.add.image(0, 0, SPRITE_SHEET_KEY, name).setDepth(depth)
  }

  private updateSprite(
    image: Phaser.GameObjects.Image,
    name: SpriteName,
    x: number,
    y: number,
    height: number,
    rotation = 0,
    flipX = false,
    alpha = 1,
  ): void {
    if (image.frame.name !== name) {
      image.setFrame(name)
    }
    const frame = image.frame
    image.setPosition(x, y)
    image.setDisplaySize(height * (frame.width / frame.height), height)
    image.setRotation(rotation)
    image.setFlipX(flipX)
    image.setAlpha(alpha)
  }

  private spawnFloat(): void {
    const kind = this.weightedFloat()
    const fromTop = Math.random() < 0.65
    const margin = 180
    const view = this.cameras.main.worldView
    const topLeftSea = { x: view.x + this.driftOffset.x, y: view.y + this.driftOffset.y }
    const bottomRightSea = { x: view.right + this.driftOffset.x, y: view.bottom + this.driftOffset.y }
    const viewWidth = bottomRightSea.x - topLeftSea.x
    const viewHeight = bottomRightSea.y - topLeftSea.y

    const x = fromTop
      ? topLeftSea.x - margin + Math.random() * (viewWidth + margin * 2)
      : bottomRightSea.x + margin
    const y = fromTop
      ? topLeftSea.y - margin
      : topLeftSea.y - margin + Math.random() * (viewHeight + margin * 2)

    this.floats.push({
      id: this.nextFloatId,
      kind,
      x,
      y,
      vx: 0,
      vy: 0,
      size: kind === 'crate' ? 58 : 46,
      captured: false,
    })
    this.nextFloatId += 1
  }

  private weightedFloat(): FloatKind {
    const roll = Math.random() * 100
    if (roll < 40) return 'wood'
    if (roll < 70) return 'plastic'
    if (roll < 95) return 'leaf'
    return 'crate'
  }

  private throwHook(target: Vec): void {
    if (this.hook.state !== 'idle') {
      return
    }
    const playerSea = this.raftToSea(this.player)
    const dir = normalize({ x: target.x - playerSea.x, y: target.y - playerSea.y })
    this.hook.state = 'flying'
    this.hook.x = playerSea.x
    this.hook.y = playerSea.y
    this.hook.prevX = playerSea.x
    this.hook.prevY = playerSea.y
    this.hook.dir = dir
    this.hook.maxX = playerSea.x + dir.x * HOOK_MAX
    this.hook.maxY = playerSea.y + dir.y * HOOK_MAX
    this.hook.attachedId = null
    this.pointerAim.x = dir.x
    this.pointerAim.y = dir.y
  }

  private collectFloat(kind: FloatKind): void {
    if (kind === 'crate') {
      this.rootStore.inventory.add('wood', 2 + Math.floor(Math.random() * 4))
      this.rootStore.inventory.add('plastic', 1 + Math.floor(Math.random() * 3))
      this.rootStore.inventory.add('leaf', 2 + Math.floor(Math.random() * 4))
      if (Math.random() < 0.65) {
        this.rootStore.inventory.add('rawFish', 1 + Math.floor(Math.random() * 2))
      }
      this.rootStore.ui.showToast('打开漂流箱，获得一批资源')
      return
    }

    const item: Item = kind === 'wood' ? 'wood' : kind === 'plastic' ? 'plastic' : 'leaf'
    this.rootStore.inventory.add(item, 1)
    this.rootStore.ui.showToast(`获得${floatLabels[kind]} x1`)
  }

  private currentPlayerTile(): Vec {
    return tileFromWorld(this.player.x, this.player.y)
  }

  private findFloorTarget(): Vec | null {
    const playerTile = this.currentPlayerTile()
    const primary = normalize(this.rootStore.player.lastMoveDir)
    const dirs = [
      axisDir(primary),
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ]

    for (const dir of dirs) {
      const target = { x: playerTile.x + dir.x, y: playerTile.y + dir.y }
      if (!this.rootStore.world.hasRaftTile(target.x, target.y) && this.rootStore.world.adjacentToRaft(target.x, target.y)) {
        return target
      }
    }

    let best: Vec | null = null
    let bestDist = Number.POSITIVE_INFINITY
    for (const key of this.rootStore.world.raftTiles) {
      const [tileX, tileY] = key.split(',').map(Number)
      for (const dir of dirs.slice(1)) {
        const target = { x: tileX + dir.x, y: tileY + dir.y }
        if (!this.rootStore.world.hasRaftTile(target.x, target.y) && this.rootStore.world.adjacentToRaft(target.x, target.y)) {
          const center = tileCenter(target.x, target.y)
          const distance = dist(center, this.player)
          if (distance < bestDist) {
            best = target
            bestDist = distance
          }
        }
      }
    }

    return best
  }

  private nearestGrill(): { x: number; y: number; building: Building } | null {
    let bestEntry: { x: number; y: number; building: Building } | null = null
    let bestDistance = Number.POSITIVE_INFINITY
    for (const entry of this.rootStore.world.getBuildingEntries()) {
      if (entry.building.kind !== 'grill') {
        continue
      }
      const center = tileCenter(entry.x, entry.y)
      const distance = dist(center, this.player)
      if (distance < bestDistance && distance < TILE * 1.4) {
        bestEntry = entry
        bestDistance = distance
      }
    }
    return bestEntry
  }

  private raftToSea(pos: Vec): Vec {
    return {
      x: pos.x + this.driftOffset.x,
      y: pos.y + this.driftOffset.y,
    }
  }

  private seaToDisplay(pos: Vec): Vec {
    return {
      x: pos.x - this.driftOffset.x,
      y: pos.y - this.driftOffset.y,
    }
  }

  private maybeAnnounceGoalCompletion(): void {
    if (this.rootStore.world.completed && !this.rootStore.world.completionToastSeen) {
      this.rootStore.world.markCompletionToastSeen()
      this.rootStore.ui.showToast('木筏已经稳定下来了，V0.5 目标完成')
    }
  }
}
