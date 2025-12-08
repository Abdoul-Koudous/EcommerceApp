import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { UserProvider } from './UserContext/UserContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </ToastProvider>
  </StrictMode>,
)
