import { css } from '@linaria/core'
import { observer } from 'mobx-react-lite'
import type { RootStore } from '../stores/RootStore'

type FullscreenPromptProps = {
  store: RootStore
}

const overlay = css`
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(8, 40, 52, 0.76);
  pointer-events: auto;
`

const button = css`
  min-height: 52px;
  min-width: 180px;
  padding: 0 18px;
  border: 2px solid rgba(64, 37, 22, 0.25);
  border-radius: 8px;
  background: #ffbe56;
  box-shadow: inset 0 -3px rgba(116, 76, 36, 0.24), 0 12px 28px rgba(5, 26, 34, 0.3);
  color: #352514;
  font-size: 16px;
  font-weight: 900;
`

export const FullscreenPrompt = observer(function FullscreenPrompt({ store }: FullscreenPromptProps) {
  if (!store.ui.fullscreenPromptVisible) {
    return null
  }

  return (
    <div className={overlay}>
      <button className={button} type="button" onClick={() => void store.ui.requestFullscreen()}>
        游戏需要全屏
      </button>
    </div>
  )
})
