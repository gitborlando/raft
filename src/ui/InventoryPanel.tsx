import { css } from '@linaria/core'
import { observer } from 'mobx-react-lite'
import spriteUrl from '../assets/spirte.png'
import { itemLabels } from '../game/constants'
import { frames } from '../game/sprites'
import type { Item, SpriteName } from '../game/types'
import type { RootStore } from '../stores/RootStore'

type InventoryPanelProps = {
  store: RootStore
}

const itemIcon: Record<Item, SpriteName> = {
  wood: 'resource_wood_plank',
  plastic: 'resource_plastic_scrap',
  leaf: 'resource_leaf_small',
  rope: 'resource_rope_coil',
  rawFish: 'food_fish_raw_blue',
  cookedFish: 'food_fish_cooked_orange',
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

const grid = css`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
`

const slot = css`
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-items: center;
  min-height: 58px;
  padding: 6px;
  border: 2px solid rgba(94, 62, 38, 0.22);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.48);
`

const icon = css`
  grid-row: span 2;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background-color: rgba(243, 198, 119, 0.55);
  background-image: var(--slot-sprite);
  background-position: var(--slot-position);
  background-repeat: no-repeat;
  background-size: var(--slot-size);
`

const label = css`
  overflow: hidden;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const countText = css`
  font-size: 18px;
  line-height: 1;
`

function getSpriteStyle(name: SpriteName): React.CSSProperties {
  const frame = frames[name]
  const positionX = frame.x / (1 - frame.w) * 100
  const positionY = frame.y / (1 - frame.h) * 100
  const sizeX = 100 / frame.w
  const sizeY = 100 / frame.h

  return {
    '--slot-sprite': `url(${spriteUrl})`,
    '--slot-position': `${positionX.toFixed(4)}% ${positionY.toFixed(4)}%`,
    '--slot-size': `${sizeX.toFixed(4)}% ${sizeY.toFixed(4)}%`,
  } as React.CSSProperties
}

export const InventoryPanel = observer(function InventoryPanel({ store }: InventoryPanelProps) {
  if (!store.ui.inventoryOpen) {
    return null
  }

  return (
    <section className={panel}>
      <header className={header}>
        <strong>背包</strong>
        <button className={closeButton} type="button" onClick={store.ui.closeInventory}>
          关闭
        </button>
      </header>
      <div className={grid}>
        {store.inventory.entries.map(({ item, count }) => (
          <div key={item} className={slot}>
            <div className={icon} style={getSpriteStyle(itemIcon[item])} />
            <span className={label}>{itemLabels[item]}</span>
            <strong className={countText}>{count}</strong>
          </div>
        ))}
      </div>
    </section>
  )
})
