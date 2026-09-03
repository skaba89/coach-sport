import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initLanguage } from './lib/i18n'
import { installErrorHandlers, initWebVitals, logger } from './lib/observability'

// Initialize i18n from localStorage
initLanguage()

// Install global error handlers + web vitals (observability)
installErrorHandlers()
initWebVitals()
logger.info('App started', {
  userAgent: navigator.userAgent,
  lang: navigator.language,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
