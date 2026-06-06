import { makeAutoObservable } from 'mobx'
import type { Building, BuildingKind } from '../game/types'
import { tileKey } from '../game/geometry'
import type { RootStore } from './RootStore'

export class WorldStore {
  readonly root: RootStore
  raftTiles = new Set<string>()
  buildings = new Map<string, Building>()
  completionToastSeen = false

  constructor(root: RootStore) {
    this.root = root
    makeAutoObservable(this, { root: false }, { autoBind: true })
    this.seedStarterRaft()
  }

  get buildingCounts(): Record<BuildingKind, number> {
    const counts: Record<BuildingKind, number> = { grill: 0, storage: 0, net: 0 }
    for (const building of this.buildings.values()) {
      counts[building.kind] += 1
    }
    return counts
  }

  get completed(): boolean {
    const counts = this.buildingCounts
    return this.raftTiles.size >= 25 && counts.grill >= 1 && counts.storage >= 1 && counts.net >= 2
  }

  seedStarterRaft(): void {
    for (let gx = -1; gx <= 1; gx += 1) {
      for (let gy = -1; gy <= 1; gy += 1) {
        this.raftTiles.add(tileKey(gx, gy))
      }
    }
  }

  hasRaftTile(x: number, y: number): boolean {
    return this.raftTiles.has(tileKey(x, y))
  }

  addRaftTile(x: number, y: number): void {
    this.raftTiles.add(tileKey(x, y))
  }

  adjacentToRaft(x: number, y: number): boolean {
    return (
      this.hasRaftTile(x + 1, y) ||
      this.hasRaftTile(x - 1, y) ||
      this.hasRaftTile(x, y + 1) ||
      this.hasRaftTile(x, y - 1)
    )
  }

  isEdgeTile(x: number, y: number): boolean {
    return (
      !this.hasRaftTile(x + 1, y) ||
      !this.hasRaftTile(x - 1, y) ||
      !this.hasRaftTile(x, y + 1) ||
      !this.hasRaftTile(x, y - 1)
    )
  }

  hasBuildingAt(x: number, y: number): boolean {
    return this.buildings.has(tileKey(x, y))
  }

  getBuildingAt(x: number, y: number): Building | undefined {
    return this.buildings.get(tileKey(x, y))
  }

  placeBuilding(x: number, y: number, building: Building): void {
    this.buildings.set(tileKey(x, y), building)
  }

  getBuildingEntries(): Array<{ x: number; y: number; building: Building }> {
    return Array.from(this.buildings.entries()).map(([key, building]) => {
      const [x, y] = key.split(',').map(Number)
      return { x, y, building }
    })
  }

  markCompletionToastSeen(): void {
    this.completionToastSeen = true
  }
}
