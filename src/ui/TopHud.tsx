import { css } from '@linaria/core'
import { observer } from 'mobx-react-lite'
import type { RootStore } from '../stores/RootStore'

type TopHudProps = {
  store: RootStore
}

const wrapper = css`
  position: fixed;
  top: max(12px, env(safe-area-inset-top));
  left: 12px;
  right: 12px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
`

const hunger = css`
  display: grid;
  grid-template-columns: auto minmax(120px, 42vw) 34px;
  gap: 8px;
  align-items: center;
  min-height: 38px;
  padding: 8px 10px;
  border: 2px solid rgba(64, 37, 22, 0.35);
  border-radius: 8px;
  background: rgba(255, 248, 224, 0.9);
  box-shadow: 0 6px 16px rgba(20, 46, 55, 0.18);
  font-size: 14px;
  font-weight: 800;
`

const bar = css`
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(75, 51, 34, 0.24);
`

const fill = css`
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #f05d45, #ffb84d);
`

const button = css`
  width: 44px;
  height: 44px;
  border: 2px solid rgba(30, 43, 48, 0.25);
  border-radius: 8px;
  background: rgba(255, 248, 224, 0.92);
  box-shadow: 0 6px 16px rgba(20, 46, 55, 0.18);
  font-weight: 900;
  pointer-events: auto;
`

export const TopHud = observer(function TopHud({ store }: TopHudProps) {
  return (
    <div className={wrapper}>
      <div className={hunger}>
        <span>饥饿</span>
        <div className={bar}>
          <i className={fill} style={{ width: `${store.player.hunger}%` }} />
        </div>
        <strong>{Math.round(store.player.hunger)}</strong>
      </div>
      <button className={button} type="button" aria-label="打开背包" onClick={() => store.ui.toggleInventory()}>
        包
      </button>
    </div>
  )
})
