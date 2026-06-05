import { frames } from './sprites'
import type { SourceRect, SpriteName } from './types'

export class SpriteRenderer {
  private readonly ctx: CanvasRenderingContext2D

  private readonly image: HTMLImageElement

  constructor(ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
    this.ctx = ctx
    this.image = image
  }

  draw(name: SpriteName, x: number, y: number, size: number, flip = false): void {
    if (!this.image.complete || this.image.naturalWidth === 0) {
      this.drawFallback(name, x, y, size)
      return
    }

    const source = this.getSourceRect(name)
    const aspect = source.w / source.h
    const drawW = size * aspect
    const drawH = size

    this.ctx.save()
    if (flip) {
      this.ctx.translate(x, y)
      this.ctx.scale(-1, 1)
      this.ctx.drawImage(this.image, source.x, source.y, source.w, source.h, -drawW / 2, -drawH / 2, drawW, drawH)
    } else {
      this.ctx.drawImage(this.image, source.x, source.y, source.w, source.h, x - drawW / 2, y - drawH / 2, drawW, drawH)
    }
    this.ctx.restore()
  }

  drawRotated(name: SpriteName, x: number, y: number, size: number, angle: number): void {
    if (!this.image.complete || this.image.naturalWidth === 0) {
      this.drawFallback(name, x, y, size)
      return
    }

    const source = this.getSourceRect(name)
    const aspect = source.w / source.h
    const drawW = size * aspect
    const drawH = size

    this.ctx.save()
    this.ctx.translate(x, y)
    this.ctx.rotate(angle)
    this.ctx.drawImage(this.image, source.x, source.y, source.w, source.h, -drawW / 2, -drawH / 2, drawW, drawH)
    this.ctx.restore()
  }

  drawRect(name: SpriteName, x: number, y: number, w: number, h: number): void {
    if (!this.image.complete || this.image.naturalWidth === 0) {
      this.drawFallback(name, x + w / 2, y + h / 2, Math.max(w, h))
      return
    }

    const source = this.getSourceRect(name)
    this.ctx.drawImage(this.image, source.x, source.y, source.w, source.h, x, y, w, h)
  }

  getSourceRect(name: SpriteName): SourceRect {
    const frame = frames[name]
    return {
      x: Math.round(frame.x * this.image.naturalWidth),
      y: Math.round(frame.y * this.image.naturalHeight),
      w: Math.round(frame.w * this.image.naturalWidth),
      h: Math.round(frame.h * this.image.naturalHeight),
    }
  }

  private drawFallback(name: SpriteName, x: number, y: number, size: number): void {
    const color = name.includes('water') ? '#45a7cf' : name.includes('fish') ? '#e8784f' : '#c78b4d'
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    this.ctx.fill()
  }
}
