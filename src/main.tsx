import { createRoot } from 'react-dom/client'
import { App } from './App'
import { rootStore } from './stores/RootStore'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing #app element')
}

const root = createRoot(app)

document.addEventListener('fullscreenchange', () => {
  rootStore.ui.syncFullscreenState()
})

if (!rootStore.ui.skipFullscreenPrompt) {
  window.addEventListener('pointerdown', () => void rootStore.ui.requestFullscreen(), { once: true })
  window.addEventListener('keydown', () => void rootStore.ui.requestFullscreen(), { once: true })
}

root.render(<App store={rootStore} />)
