import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import './lib/i18n'
import { reloadOnceForNewBuild } from './lib/lazyWithRetry'

// 2026-11-11: Vite emits this when a file a page depends on (a shared JS/CSS chunk preloaded
// alongside it) fails to download - typically a tab still running the previous deploy. Reload once
// to pick up the new build; if that already happened a moment ago, let the error surface.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnceForNewBuild()) event.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <App />
)
