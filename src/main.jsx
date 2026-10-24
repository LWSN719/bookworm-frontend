import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ConfigError from './components/ConfigError.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { missingSupabaseEnv } from './lib/supabase.js'
import './index.css'

// The config check runs BEFORE AuthProvider mounts. With no usable Supabase
// URL the auth client would throw on its first call, and the resulting blank
// page would say nothing about the actual problem — a missing deployment
// variable.
const missing = missingSupabaseEnv()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {missing.length > 0 ? (
      <ConfigError missing={missing} />
    ) : (
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    )}
  </StrictMode>,
)
