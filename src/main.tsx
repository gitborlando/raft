import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { uiStore } from './uiStore'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing #app element')
}

const root = createRoot(app)

flushSync(() => {
  root.render(<App store={uiStore} />)
})

await import('./game/runtime')
