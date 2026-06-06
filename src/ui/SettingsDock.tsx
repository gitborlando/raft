import { css } from '@linaria/core'
import { observer } from 'mobx-react-lite'
import type { RootStore } from '../stores/RootStore'

type SettingsDockProps = {
  store: RootStore
}

const scaleControl = css`
  position: fixed;
  top: max(12px, env(safe-area-inset-top));
  right: 66px;
  z-index: 30;
  display: grid;
  grid-template-columns: auto 118px 34px;
  gap: 8px;
  align-items: center;
  min-height: 44px;
  padding: 8px 10px;
  border: 2px solid rgba(30, 43, 48, 0.22);
  border-radius: 8px;
  background: rgba(255, 248, 224, 0.92);
  box-shadow: 0 6px 16px rgba(20, 46, 55, 0.18);
  color: #20303a;
  font-size: 12px;
  font-weight: 900;
  pointer-events: auto;
`

const range = css`
  width: 118px;
  accent-color: #ff9f2f;
`

const orientationButton = css`
  position: fixed;
  top: calc(max(12px, env(safe-area-inset-top)) + 60px);
  right: 12px;
  z-index: 30;
  min-height: 38px;
  padding: 0 12px;
  border: 2px solid rgba(30, 43, 48, 0.22);
  border-radius: 8px;
  background: rgba(255, 248, 224, 0.92);
  box-shadow: 0 6px 16px rgba(20, 46, 55, 0.18);
  color: #20303a;
  font-size: 12px;
  font-weight: 900;
  pointer-events: auto;
`

export const SettingsDock = observer(function SettingsDock({ store }: SettingsDockProps) {
  return (
    <>
      <div className={scaleControl}>
        <span>缩放</span>
        <input
          className={range}
          type="range"
          min="0.35"
          max="1"
          step="0.05"
          value={store.ui.displayScale}
          onChange={(event) => store.ui.setDisplayScale(Number(event.target.value))}
        />
        <strong>{Math.round(store.ui.displayScale * 100)}%</strong>
      </div>
      <button className={orientationButton} type="button" onClick={store.ui.toggleOrientationLayout}>
        {store.ui.portraitLayout ? '横屏' : '竖屏'}
      </button>
    </>
  )
})
