/**
 * ============================================================================
 * COMPONENTE PRINCIPAL - APP
 * ============================================================================
 *
 * Componente raíz de la aplicación React
 * Maneja:
 * - Enrutamiento principal
 * - Providers (QueryClient, Zustand store)
 * - Layout global
 *
 * TODO: Implementar rutas
 * - Dashboard
 * - Project selector
 * - Report viewer
 * - Timeline viewer
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Crear cliente de React Query para caché de datos
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
})

/**
 * Componente principal
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              🔍 SCR Agent - Revisión de Código Seguro
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Análisis agentico de seguridad con MCP
            </p>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              ¡Bienvenido a SCR Agent!
            </h2>
            <p className="text-blue-800 mb-4">
              Sistema de análisis de seguridad de código con arquitectura MCP agentica.
              Detecta código malicioso, investiga patrones sospechosos y genera reportes ejecutivos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">🚨 Agente Malicia</h3>
                <p className="text-sm text-gray-700">
                  Detecta código malicioso, backdoors y funciones sospechosas
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">🔍 Agente Forenses</h3>
                <p className="text-sm text-gray-700">
                  Investiga historial de Git y construye líneas de tiempo
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">📊 Agente Síntesis</h3>
                <p className="text-sm text-gray-700">
                  Genera reportes ejecutivos con priorización de riesgos
                </p>
              </div>
            </div>
          </div>

          {/* TODO: Add routing and real components */}
          <div className="text-center py-12">
            <p className="text-gray-600">
              Componentes en desarrollo...
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-sm text-gray-600">
              © 2024 SCR Agent. Construido con Claude Code 🤖
            </p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  )
}

export default App
