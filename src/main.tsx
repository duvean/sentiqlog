import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles.css'

if (import.meta.env.PROD) {
  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() { void updateServiceWorker(true) },
    onRegisteredSW(_swUrl, registration) {
      if (registration) window.setInterval(() => { void registration.update() }, 60 * 60 * 1000)
    }
  })
} else if ('serviceWorker' in navigator) {
  // A previously installed production PWA can otherwise keep serving stale
  // assets on localhost and make the development page appear blank.
  void navigator.serviceWorker.getRegistrations().then(registrations =>
    Promise.all(registrations.map(registration => registration.unregister()))
  )
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
