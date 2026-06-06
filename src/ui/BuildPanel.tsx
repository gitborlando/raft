import { css } from '@linaria/core'
import { observer } from 'mobx-react-lite'
import { buildCosts } from '../game/recipes'
import type { RootStore } from '../stores/RootStore'

type BuildPanelProps = {
  store: RootStore
}

const panel = css`
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(118px + env(safe-area-inset-bottom));
  z-index: 10;
  max-height: min(52vh, 430px);
  padding: 12px;
  overflow: auto;
  border: 2px solid rgba(68, 42, 25, 0.34);
  border-radius: 8px;
  background: rgba(255, 248, 224, 0.96);
  box-shadow: 0 18px 32px rgba(13, 44, 54, 0.32);
  pointer-events: auto;

  @media (min-width: 720px) {
    left: auto;
    right: 18px;
    width: 430px;
  }
`

const header = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 15px;
`

const closeButton = css`
  min-height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 7px;
  background: #263b43;
  color: #fff7dc;
  font-weight: 800;
`

const actions = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`

const action = css`
  min-height: 62px;
  padding: 8px;
  border: 0;
  border-radius: 8px;
  background: #f1c777;
  box-shadow: inset 0 -3px rgba(116, 76, 36, 0.22);
  font-size: 14px;
  font-weight: 900;
  text-align: left;

  &:disabled {
    opacity: 0.55;
  }
`

const costText = css`
  display: block;
  margin-top: 3px;
  color: #654425;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
`

function formatCost(cost: Partial<Record<string, number>>): string {
  return Object.entries(cost)
    .map(([item, count]) => `${item} x${count}`)
    .join(' ')
}

export const BuildPanel = observer(function BuildPanel({ store }: BuildPanelProps) {
  if (!store.ui.buildOpen) {
    return null
  }

  return (
    <section className={panel}>
      <header className={header}>
        <strong>建造 / 合成</strong>
        <button className={closeButton} type="button" onClick={store.ui.closeBuild}>
          关闭
        </button>
      </header>
      <div className={actions}>
        <button
          className={action}
          type="button"
          disabled={!store.inventory.canAfford(buildCosts.floor)}
          onClick={() => store.bridge.requestBuildFloor()}
        >
          扩建地板
          <small className={costText}>{formatCost(buildCosts.floor)}</small>
        </button>
        <button
          className={action}
          type="button"
          disabled={!store.inventory.canAfford(buildCosts.grill)}
          onClick={() => store.bridge.requestBuild('grill')}
        >
          烤架
          <small className={costText}>{formatCost(buildCosts.grill)}</small>
        </button>
        <button
          className={action}
          type="button"
          disabled={!store.inventory.canAfford(buildCosts.storage)}
          onClick={() => store.bridge.requestBuild('storage')}
        >
          储物箱
          <small className={costText}>{formatCost(buildCosts.storage)}</small>
        </button>
        <button
          className={action}
          type="button"
          disabled={!store.inventory.canAfford(buildCosts.net)}
          onClick={() => store.bridge.requestBuild('net')}
        >
          收集网
          <small className={costText}>{formatCost(buildCosts.net)}</small>
        </button>
        <button
          className={action}
          type="button"
          disabled={!store.inventory.canAfford({ leaf: 2 })}
          onClick={store.inventory.craftRope}
        >
          合成绳子
          <small className={costText}>leaf x2</small>
        </button>
      </div>
    </section>
  )
})
