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
  document.getElementById('root').innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #1a1a2e;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="
        padding: 2rem;
        background: #16213e;
        border-left: 4px solid #e94560;
        border-radius: 8px;
        max-width: 500px;
      ">
        <h1 style="margin: 0 0 1rem 0; color: #e94560;">Configuration Error</h1>
        <p style="margin: 0; color: #aaa; line-height: 1.6;">${error.message}</p>
        <p style="margin: 1rem 0 0 0; color: #666; font-size: 0.9rem;">Please check your .env.local file and try again.</p>
      </div>
    </div>
  `
  throw error
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
