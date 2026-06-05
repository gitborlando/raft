import { css } from '@linaria/core'
import { observer } from 'mobx-react-lite'
import type { UiStore } from './uiStore'

type AppProps = {
  store: UiStore
}

const shell = css`
  :global(:root) {
    --display-scale: 0.7;
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
      sans-serif;
    color: #1a2630;
    background: #0f6e92;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    touch-action: none;
  }

  :global(*) {
    box-sizing: border-box;
  }

  :global(html),
  :global(body),
  :global(#app) {
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
  }

  :global(body) {
    position: fixed;
    inset: 0;
    user-select: none;
    -webkit-user-select: none;
  }

  :global(button) {
    border: 0;
    font: inherit;
    color: inherit;
    -webkit-tap-highlight-color: transparent;
  }

  :global(#game) {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }

  :global(.game-stage) {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: #0f6e92;
  }

  :global(.ui-layer) {
    position: absolute;
    inset: 0;
    z-index: 2;
    width: calc(100% / var(--display-scale));
    height: calc(100% / var(--display-scale));
    pointer-events: none;
    transform: scale(var(--display-scale));
    transform-origin: top left;
  }

  @media (orientation: portrait) {
    :global(body:not(.portrait-layout) .game-stage) {
      top: 50%;
      left: 50%;
      width: 100vh;
      height: 100vw;
      transform: translate(-50%, -50%) rotate(90deg);
      transform-origin: center;
    }
  }

  :global(.scale-control) {
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
  }

  :global(.scale-control input) {
    width: 118px;
    accent-color: #ff9f2f;
  }

  :global(.orientation-toggle) {
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
  }

  :global(body.portrait-layout .orientation-toggle .portrait-label) {
    display: none;
  }

  :global(.fullscreen-prompt) {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(8, 40, 52, 0.76);
  }

  :global(.fullscreen-prompt.hidden) {
    display: none;
  }

  :global(.fullscreen-prompt button) {
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
  }

  :global(body:not(.portrait-layout) .orientation-toggle .landscape-label) {
    display: none;
  }

  :global(.top-hud) {
    position: fixed;
    top: max(12px, env(safe-area-inset-top));
    left: 12px;
    right: 12px;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    pointer-events: none;
  }

  :global(.hunger) {
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
  }

  :global(.hunger .bar) {
    height: 12px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(75, 51, 34, 0.24);
  }

  :global(.hunger i) {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #f05d45, #ffb84d);
  }

  :global(.icon-button) {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    border: 2px solid rgba(30, 43, 48, 0.25);
    background: rgba(255, 248, 224, 0.92);
    box-shadow: 0 6px 16px rgba(20, 46, 55, 0.18);
    font-weight: 900;
    pointer-events: auto;
  }

  :global(.toast) {
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
    opacity: 0;
    pointer-events: none;
    transform: translate(-50%, -8px);
    transition: opacity 160ms ease, transform 160ms ease;
  }

  :global(.toast.visible) {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  :global(.goal-panel) {
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
  }

  :global(.panel) {
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
  }

  :global(.panel.hidden) {
    display: none;
  }

  :global(.panel header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
    font-size: 15px;
  }

  :global(.close-panel) {
    min-height: 34px;
    padding: 0 12px;
    border-radius: 7px;
    background: #263b43;
    color: #fff7dc;
    font-weight: 800;
  }

  :global(.inventory-grid) {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  :global(.slot) {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    grid-template-rows: auto auto;
    align-items: center;
    min-height: 58px;
    padding: 6px;
    border: 2px solid rgba(94, 62, 38, 0.22);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.48);
  }

  :global(.slot-icon) {
    grid-row: span 2;
    width: 44px;
    height: 44px;
  }

  :global(.slot span) {
    overflow: hidden;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.slot strong) {
    font-size: 18px;
    line-height: 1;
  }

  :global(.build-actions) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  :global(.build-actions button) {
    min-height: 62px;
    padding: 8px;
    border-radius: 8px;
    background: #f1c777;
    box-shadow: inset 0 -3px rgba(116, 76, 36, 0.22);
    font-size: 14px;
    font-weight: 900;
  }

  :global(.build-actions small) {
    display: block;
    margin-top: 3px;
    color: #654425;
    font-size: 11px;
    font-weight: 800;
    line-height: 1.2;
  }

  :global(.bottom-controls) {
    position: fixed;
    left: 0;
    right: 0;
    bottom: max(12px, env(safe-area-inset-bottom));
    z-index: 6;
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 12px;
    padding: 0 12px;
    pointer-events: none;
  }

  :global(.stick) {
    position: relative;
    width: 116px;
    height: 116px;
    flex: 0 0 auto;
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-radius: 50%;
    background: rgba(12, 54, 68, 0.35);
    box-shadow: inset 0 0 22px rgba(255, 255, 255, 0.12);
    pointer-events: auto;
    touch-action: none;
  }

  :global(.stick i) {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 52px;
    height: 52px;
    margin: -26px 0 0 -26px;
    border-radius: 50%;
    background: rgba(255, 248, 224, 0.9);
    box-shadow: 0 6px 14px rgba(9, 40, 50, 0.26);
    pointer-events: none;
  }

  :global(.action-cluster) {
    display: grid;
    grid-template-columns: repeat(2, 74px);
    gap: 8px;
    pointer-events: auto;
  }

  :global(.action) {
    min-height: 52px;
    border-radius: 8px;
    background: rgba(255, 248, 224, 0.94);
    box-shadow: 0 7px 16px rgba(13, 44, 54, 0.24);
    color: #20303a;
    font-size: 14px;
    font-weight: 900;
  }

  :global(.action.primary) {
    background: #ffbe56;
    color: #352514;
  }

  @media (min-width: 720px) {
    :global(.panel) {
      left: auto;
      right: 18px;
      width: 430px;
    }

    :global(.inventory-grid) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    :global(.action-cluster) {
      grid-template-columns: repeat(4, 80px);
    }
  }
`

export const App = observer(function App({ store }: AppProps) {
  void store

  return (
    <div className={shell}>
      <div id="game-stage" className="game-stage">
        <div id="fullscreen-prompt" className="fullscreen-prompt">
          <button id="fullscreen-button" type="button">
            游戏需要全屏
          </button>
        </div>
        <div className="scale-control">
          <span>缩放</span>
          <input id="display-scale" type="range" min="0.35" max="1" step="0.05" defaultValue="0.7" />
          <strong id="display-scale-value">70%</strong>
        </div>
        <button id="orientation-toggle" className="orientation-toggle" type="button">
          <span className="portrait-label">竖屏</span>
          <span className="landscape-label">横屏</span>
        </button>
        <canvas id="game" aria-label="Raft mobile MVP" />
        <div className="ui-layer">
          <div className="top-hud">
            <div className="hunger">
              <span>饥饿</span>
              <div className="bar">
                <i id="hunger-fill" />
              </div>
              <strong id="hunger-value">100</strong>
            </div>
            <button id="bag-toggle" className="icon-button" type="button" aria-label="打开背包">
              包
            </button>
          </div>
          <div id="toast" className="toast" />
          <section id="goal-panel" className="goal-panel">
            <strong>V0.5 目标</strong>
            <span id="goal-text" />
          </section>
          <section id="inventory-panel" className="panel inventory-panel hidden">
            <header>
              <strong>背包</strong>
              <button className="close-panel" data-close="inventory" type="button">
                关闭
              </button>
            </header>
            <div id="inventory-grid" className="inventory-grid" />
          </section>
          <section id="build-panel" className="panel build-panel hidden">
            <header>
              <strong>建造 / 合成</strong>
              <button className="close-panel" data-close="build" type="button">
                关闭
              </button>
            </header>
            <div className="build-actions">
              <button data-craft="rope" type="button">
                合成绳子
                <br />
                <small>树叶 x2</small>
              </button>
              <button data-craft="floor" type="button">
                扩建地板
                <br />
                <small>木板 x2</small>
              </button>
              <button data-craft="grill" type="button">
                烤架
                <br />
                <small>木板 x4 塑料 x2 绳子 x1</small>
              </button>
              <button data-craft="storage" type="button">
                储物箱
                <br />
                <small>木板 x6 塑料 x2</small>
              </button>
              <button data-craft="net" type="button">
                收集网
                <br />
                <small>木板 x3 塑料 x2 绳子 x2</small>
              </button>
            </div>
          </section>
          <div className="bottom-controls">
            <div id="stick" className="stick">
              <i />
            </div>
            <div className="action-cluster">
              <button id="hook-button" className="action primary" type="button">
                投钩
              </button>
              <button id="interact-button" className="action" type="button">
                互动
              </button>
              <button id="eat-button" className="action" type="button">
                吃鱼
              </button>
              <button id="build-toggle" className="action" type="button">
                建造
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
