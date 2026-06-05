import { TILE } from './constants'
import type { Vec } from './types'

export function tileKey(x: number, y: number): string {
  return `${x},${y}`
}

export function tileFromWorld(x: number, y: number): Vec {
  return {
    x: Math.round(x / TILE),
    y: Math.round(y / TILE),
  }
}

export function tileCenter(x: number, y: number): Vec {
  return {
    x: x * TILE,
    y: y * TILE,
  }
}

export function dist(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function normalize(v: Vec): Vec {
  const length = Math.hypot(v.x, v.y)
  if (length < 0.001) {
    return { x: 1, y: 0 }
  }
  return { x: v.x / length, y: v.y / length }
}

export function normalizeInput(input: Vec): Vec {
  const length = Math.hypot(input.x, input.y)
  if (length <= 1) {
    return input
  }
  return { x: input.x / length, y: input.y / length }
}

export function axisDir(v: Vec): Vec {
  if (Math.abs(v.x) > Math.abs(v.y)) {
    return { x: v.x >= 0 ? 1 : -1, y: 0 }
  }
  return { x: 0, y: v.y >= 0 ? 1 : -1 }
}
