import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { validateClientEnv } from './utils/envValidator'
import './index.css'
import App from './App.jsx'

// Validate environment configuration
try {
  validateClientEnv()
} catch (error) {
  console.error('Environment validation failed:', error.message)
  const rootEl = document.getElementById('root')
  if (rootEl) {
    // Create error div safely without using innerHTML
    const errorDiv = document.createElement('div')
    errorDiv.style.display = 'flex'
    errorDiv.style.alignItems = 'center'
    errorDiv.style.justifyContent = 'center'
    errorDiv.style.height = '100vh'
    errorDiv.style.background = '#1a1a2e'
    errorDiv.style.color = '#fff'
    errorDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif'
    
    const containerDiv = document.createElement('div')
    containerDiv.style.padding = '2rem'
    containerDiv.style.background = '#16213e'
    containerDiv.style.borderLeft = '4px solid #e94560'
    containerDiv.style.borderRadius = '8px'
    containerDiv.style.maxWidth = '500px'
    
    const h1El = document.createElement('h1')
    h1El.style.margin = '0 0 1rem 0'
    h1El.style.color = '#e94560'
    h1El.textContent = 'Configuration Error'
    
    const pEl = document.createElement('p')
    pEl.style.margin = '0'
    pEl.style.color = '#aaa'
    pEl.style.lineHeight = '1.6'
    pEl.textContent = error.message
    
    containerDiv.appendChild(h1El)
    containerDiv.appendChild(pEl)
    errorDiv.appendChild(containerDiv)
    rootEl.appendChild(errorDiv)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
