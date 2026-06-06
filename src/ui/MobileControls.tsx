import { css } from '@linaria/core'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import type { RootStore } from '../stores/RootStore'

type MobileControlsProps = {
  store: RootStore
}

const cluster = css`
  position: fixed;
  left: 0;
  right: 0;
  bottom: max(12px, env(safe-area-inset-bottom));
  z-index: 6;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
  padding: 0 30px 78px 22px;
  pointer-events: none;
`

const stick = css`
  position: relative;
  width: 156px;
  height: 156px;
  flex: 0 0 auto;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-radius: 50%;
  background: rgba(12, 54, 68, 0.35);
  box-shadow: inset 0 0 22px rgba(255, 255, 255, 0.12);
  pointer-events: auto;
  touch-action: none;
`

const nub = css`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 68px;
  height: 68px;
  margin: -34px 0 0 -34px;
  border-radius: 50%;
  background: rgba(255, 248, 224, 0.9);
  box-shadow: 0 6px 14px rgba(9, 40, 50, 0.26);
  pointer-events: none;
`

const actions = css`
  display: grid;
  grid-template-columns: repeat(2, 74px);
  gap: 8px;
  pointer-events: auto;

  @media (min-width: 720px) {
    grid-template-columns: repeat(4, 80px);
  }
`

const action = css`
  min-height: 52px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 248, 224, 0.94);
  box-shadow: 0 7px 16px rgba(13, 44, 54, 0.24);
  color: #20303a;
  font-size: 14px;
  font-weight: 900;
`

const primary = css`
  background: #ffbe56;
  color: #352514;
`

export const MobileControls = observer(function MobileControls({ store }: MobileControlsProps) {
  const stickRef = useRef<HTMLDivElement | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => () => store.bridge.setMoveInput(0, 0), [store])

  const updateStick = (clientX: number, clientY: number) => {
    const element = stickRef.current
    if (!element) {
      return
    }

    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const rawX = clientX - centerX
    const rawY = clientY - centerY
    const max = rect.width * 0.34
    const length = Math.min(max, Math.hypot(rawX, rawY))
    const safeLength = Math.hypot(rawX, rawY) || 1
    const x = (rawX / safeLength) * length
    const y = (rawY / safeLength) * length

    setOffset({ x, y })
    store.bridge.setMoveInput(x / max, y / max)
  }

  const resetStick = () => {
    pointerIdRef.current = null
    setOffset({ x: 0, y: 0 })
    store.bridge.setMoveInput(0, 0)
  }

  return (
    <div className={cluster}>
      <div
        ref={stickRef}
        className={stick}
        onPointerDown={(event) => {
          pointerIdRef.current = event.pointerId
          event.currentTarget.setPointerCapture(event.pointerId)
          updateStick(event.clientX, event.clientY)
        }}
        onPointerMove={(event) => {
          if (event.pointerId === pointerIdRef.current) {
            updateStick(event.clientX, event.clientY)
          }
        }}
        onPointerUp={(event) => {
          if (event.pointerId === pointerIdRef.current) {
            resetStick()
          }
        }}
        onPointerCancel={(event) => {
          if (event.pointerId === pointerIdRef.current) {
            resetStick()
          }
        }}
      >
        <i className={nub} style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }} />
      </div>
      <div className={actions}>
        <button className={`${action} ${primary}`} type="button" onClick={() => store.bridge.throwHook()}>
          投钩
        </button>
        <button className={action} type="button" onClick={() => store.bridge.interact()}>
          互动
        </button>
        <button className={action} type="button" onClick={() => store.player.eatCookedFish()}>
          吃鱼
        </button>
        <button className={action} type="button" onClick={() => store.ui.toggleBuild()}>
          建造
        </button>
      </div>
    </div>
  )
})
