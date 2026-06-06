import { css } from '@linaria/core'
import { observer } from 'mobx-react-lite'
import type { RootStore } from '../stores/RootStore'

type ToastLayerProps = {
  store: RootStore
}

const toast = css`
  position: fixed;
  left: 50%;
  top: calc(max(70px, env(safe-area-inset-top) + 60px));
  z-index: 8;
  max-width: min(88vw, 420px);
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(29, 38, 42, 0.86);
  color: #fff6d7;
  text-align: center;
  font-size: 14px;
  font-weight: 800;
  pointer-events: none;
  transform: translateX(-50%);
`

export const ToastLayer = observer(function ToastLayer({ store }: ToastLayerProps) {
  if (!store.ui.currentToast) {
    return null
  }

  return <div className={toast}>{store.ui.currentToast.message}</div>
})
