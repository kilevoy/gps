import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import UnifiedApp from './UnifiedApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UnifiedApp />
  </StrictMode>,
)
