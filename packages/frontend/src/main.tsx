/**
 * Punto de entrada de la aplicación React
 * Monta la aplicación en el elemento #root
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { initializeAuth } from './services/auth-init.service'
import './styles/main.css'

/**
 * Inicializar autenticación antes de renderizar la aplicación
 */
initializeAuth().then((success) => {
  if (success) {
    console.log('[BOOTSTRAP] Autenticación inicializada correctamente')
  } else {
    console.log('[BOOTSTRAP] Autenticación no fue necesaria o falló (usuario puede estar sin login)')
  }
})

/**
 * Montar aplicación React
 */
const root = document.getElementById('root')
if (!root) {
  throw new Error('No se encontró elemento root en HTML')
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
