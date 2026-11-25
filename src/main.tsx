import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles.css'

if (import.meta.env.PROD) {
  registerSW({ immediate: true })
} else if ('serviceWorker' in navigator) {
  // A previously installed production PWA can otherwise keep serving stale
  // assets on localhost and make the development page appear blank.
  void navigator.serviceWorker.getRegistrations().then(registrations =>
    Promise.all(registrations.map(registration => registration.unregister()))
  )
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
