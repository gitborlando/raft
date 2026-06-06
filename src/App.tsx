import { css } from '@linaria/core'
import { observer } from 'mobx-react-lite'
import { PhaserHost } from './ui/PhaserHost'
import { BuildPanel } from './ui/BuildPanel'
import { FullscreenPrompt } from './ui/FullscreenPrompt'
import { GoalPanel } from './ui/GoalPanel'
import { InventoryPanel } from './ui/InventoryPanel'
import { MobileControls } from './ui/MobileControls'
import { SettingsDock } from './ui/SettingsDock'
import type { RootStore } from './stores/RootStore'
import { ToastLayer } from './ui/ToastLayer'
import { TopHud } from './ui/TopHud'

type AppProps = {
  store: RootStore
}

const shell = css`
  :global(:root) {
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
    background: #0f6e92;
  }

  :global(button),
  :global(input) {
    font: inherit;
  }

  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #0f6e92;
`

const portraitLayout = css``

const stageFrame = css`
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #0f6e92;

  @media (orientation: portrait) {
    .${shell}:not(.${portraitLayout}) & {
      top: 50%;
      left: 50%;
      width: 100vh;
      height: 100vw;
      transform: translate(-50%, -50%) rotate(90deg);
      transform-origin: center;
    }
  }
`

const phaserLayer = css`
  position: absolute;
  inset: 0;
`

const uiLayer = css`
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
`

export const App = observer(function App({ store }: AppProps) {
  return (
    <div className={`${shell} ${store.ui.portraitLayout ? portraitLayout : ''}`}>
      <div className={stageFrame}>
        <div className={phaserLayer}>
          <PhaserHost store={store} />
        </div>
        <div className={uiLayer}>
          <TopHud store={store} />
          <SettingsDock store={store} />
          <ToastLayer store={store} />
          <GoalPanel store={store} />
          <InventoryPanel store={store} />
          <BuildPanel store={store} />
          <MobileControls store={store} />
          <FullscreenPrompt store={store} />
        </div>
      </div>
    </div>
  )
})
