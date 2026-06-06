import { css } from '@linaria/core'
import { observer } from 'mobx-react-lite'
import type { RootStore } from '../stores/RootStore'

type GoalPanelProps = {
  store: RootStore
}

const panel = css`
  position: fixed;
  top: calc(max(62px, env(safe-area-inset-top) + 56px));
  left: 12px;
  z-index: 4;
  display: grid;
  gap: 2px;
  max-width: calc(100vw - 24px);
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(9, 55, 73, 0.54);
  color: #f4fbff;
  font-size: 12px;
  line-height: 1.25;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
  pointer-events: none;
`

export const GoalPanel = observer(function GoalPanel({ store }: GoalPanelProps) {
  const counts = store.world.buildingCounts

  return (
    <section className={panel}>
      <strong>V0.5 目标</strong>
      <span>
        {store.world.completed
          ? '完成'
          : `地板 ${store.world.raftTiles.size}/25  烤架 ${counts.grill}/1  箱 ${counts.storage}/1  网 ${counts.net}/2`}
      </span>
    </section>
  )
})
