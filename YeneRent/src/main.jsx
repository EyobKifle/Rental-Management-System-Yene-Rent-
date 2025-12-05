import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { LanguageProvider } from './contexts/LanguageContext.jsx' // Import LanguageProvider

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider> {/* Wrap App with LanguageProvider */}
          <App />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
