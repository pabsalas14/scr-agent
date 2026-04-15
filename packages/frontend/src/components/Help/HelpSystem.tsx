import { useState } from 'react';
import { HelpCircle, X, Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpTopic {
  id: string;
  title: string;
  shortDesc: string;
  content: string;
  category: string;
  relatedTopics?: string[];
}

interface HelpSystemProps {
  topics?: HelpTopic[];
  showOnMount?: boolean;
}

const DEFAULT_TOPICS: HelpTopic[] = [
  {
    id: 'getting-started',
    title: 'Primeros Pasos',
    shortDesc: 'Aprende cómo comenzar con SCR Agent',
    content: `
# Primeros Pasos

1. **Conectar un Repositorio**: Ve a Proyectos → Nuevo Proyecto y selecciona tu repositorio de GitHub
2. **Ejecutar Análisis**: Una vez conectado, haz clic en "Analizar" para iniciar un escaneo
3. **Ver Resultados**: Los hallazgos aparecerán en la sección de Hallazgos
4. **Crear Reglas**: Configura alertas personalizadas en Alertas → Nueva Regla

Tip: Los análisis pueden tomar varios minutos dependiendo del tamaño del repositorio.
    `,
    category: 'Inicio',
  },
  {
    id: 'findings-explained',
    title: 'Entender los Hallazgos',
    shortDesc: 'Significado de severidades y tipos',
    content: `
# Tipos y Severidades de Hallazgos

## Severidades
- **CRITICAL (Crítico)**: Vulnerabilidades graves que requieren atención inmediata
- **HIGH (Alto)**: Problemas importantes que deben resolverse pronto
- **MEDIUM (Medio)**: Problemas moderados que deberían corregirse
- **LOW (Bajo)**: Problemas menores o sugerencias de mejora

## Tipos Comunes
- **BACKDOOR**: Códigos sospechosos que permiten acceso no autorizado
- **INJECTION**: Vulnerabilidades de inyección de código (SQL, command, etc)
- **LOGIC_BOMB**: Código malicioso con comportamiento destructivo
- **OBFUSCATION**: Código ofuscado o encriptado sospechosamente
- **SUSPICIOUS**: Patrones sospechosos que requieren revisión manual
    `,
    category: 'Hallazgos',
  },
  {
    id: 'remediation',
    title: 'Proceso de Remediación',
    shortDesc: 'Cómo resolver hallazgos',
    content: `
# Proceso de Remediación

1. **Crear Remediación**: Haz clic en un hallazgo → "Crear Remediación"
2. **Asignar Tareas**: Asigna la remediación a un desarrollador
3. **Marcar en Corrección**: Cuando se inicie el trabajo, cambia el estado a "EN CORRECCIÓN"
4. **Validar la Solución**: Una vez resuelto, el código se re-analiza automáticamente
5. **Verificar Resultado**: Si la validación es positiva, se marca como RESUELTO

Los tiempos MTTR (Mean Time To Resolution) se calculan automáticamente.
    `,
    category: 'Remediación',
  },
  {
    id: 'alerts',
    title: 'Configurar Alertas',
    shortDesc: 'Recibe notificaciones automáticas',
    content: `
# Sistema de Alertas

## Crear una Regla
1. Ir a Alertas → Nueva Regla
2. Seleccionar severidades (CRITICAL, HIGH, etc)
3. Opcionalmente filtrar por tipo de hallazgo
4. Elegir canales de notificación (Email, Slack, In-App)
5. Establecer escalación automática (opcional)

## Canales Disponibles
- **Email**: Recibe alertas en tu correo
- **Slack**: Integración con Slack para notificaciones del equipo
- **In-App**: Notificaciones dentro de la aplicación

Tip: Crea una regla para críticos con escalación a 30 minutos.
    `,
    category: 'Alertas',
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Atajos de Teclado',
    shortDesc: 'Navegación rápida',
    content: `
# Atajos de Teclado

- **Cmd/Ctrl + K**: Abrir búsqueda global
- **Cmd/Ctrl + /**: Abrir menú de ayuda
- **Escape**: Cerrar diálogos y paneles
- **?**: Mostrar este panel de ayuda

Tip: Usa Cmd/Ctrl + K para buscar cualquier cosa rápidamente.
    `,
    category: 'Productividad',
  },
];

export default function HelpSystem({ topics = DEFAULT_TOPICS, showOnMount = false }: HelpSystemProps) {
  const [isOpen, setIsOpen] = useState(showOnMount);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentTopic = topics.find((t) => t.id === selectedTopic);

  const filteredTopics = topics.filter((topic) => {
    const query = searchQuery.toLowerCase();
    return (
      topic.title.toLowerCase().includes(query) ||
      topic.shortDesc.toLowerCase().includes(query) ||
      topic.category.toLowerCase().includes(query)
    );
  });

  const categories = Array.from(new Set(topics.map((t) => t.category)));

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#F97316] hover:bg-[#EA6B1B] text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
        title="Ayuda (Presiona ? para abrir)"
      >
        <HelpCircle size={24} />
      </button>

      {/* Help Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-[#1A1A1A] border-l border-[#2D2D2D] shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#111111] border-b border-[#2D2D2D] p-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HelpCircle size={20} />
                Ayuda
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#2D2D2D] rounded transition-colors text-[#A0A0A0]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {!currentTopic ? (
                // Topics List
                <div className="space-y-4 p-4">
                  {/* Search */}
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Buscar ayuda..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#4B5563]"
                    />
                  </div>

                  {/* Topics by Category */}
                  {filteredTopics.length > 0 ? (
                    <div className="space-y-4">
                      {categories.map((category) => {
                        const categoryTopics = filteredTopics.filter(
                          (t) => t.category === category
                        );
                        if (categoryTopics.length === 0) return null;

                        return (
                          <div key={category}>
                            <h3 className="text-xs font-semibold text-[#6B7280] uppercase px-2 mb-2">
                              {category}
                            </h3>
                            <div className="space-y-2">
                              {categoryTopics.map((topic) => (
                                <button
                                  key={topic.id}
                                  onClick={() => setSelectedTopic(topic.id)}
                                  className="w-full text-left p-3 rounded-lg hover:bg-[#2D2D2D] border border-transparent hover:border-[#2D2D2D] transition-colors group"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium text-white text-sm group-hover:text-[#F97316] transition-colors">
                                        {topic.title}
                                      </p>
                                      <p className="text-xs text-[#6B7280] mt-1">
                                        {topic.shortDesc}
                                      </p>
                                    </div>
                                    <ChevronRight
                                      size={16}
                                      className="text-[#6B7280] flex-shrink-0 mt-1 ml-2"
                                    />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-[#6B7280]">
                        No se encontraron temas para "{searchQuery}"
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Topic Content
                <div className="space-y-4 p-4">
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="text-sm text-[#F97316] hover:text-[#FF6B6B] transition-colors flex items-center gap-1 mb-2"
                  >
                    ← Atrás
                  </button>

                  <div className="prose prose-invert max-w-none">
                    {currentTopic.content.split('\n').map((line, idx) => {
                      if (line.startsWith('# ')) {
                        return (
                          <h2
                            key={idx}
                            className="text-lg font-semibold text-white mt-4 mb-2"
                          >
                            {line.replace('# ', '')}
                          </h2>
                        );
                      }
                      if (line.startsWith('## ')) {
                        return (
                          <h3
                            key={idx}
                            className="text-sm font-semibold text-[#F97316] mt-3 mb-1"
                          >
                            {line.replace('## ', '')}
                          </h3>
                        );
                      }
                      if (line.startsWith('- ')) {
                        return (
                          <li key={idx} className="text-sm text-[#A0A0A0] ml-4">
                            {line.replace('- ', '')}
                          </li>
                        );
                      }
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return (
                          <p key={idx} className="text-sm text-[#A0A0A0] font-semibold">
                            {line.replace(/\*\*/g, '')}
                          </p>
                        );
                      }
                      if (line.trim()) {
                        return (
                          <p key={idx} className="text-sm text-[#A0A0A0] leading-relaxed">
                            {line}
                          </p>
                        );
                      }
                      return <div key={idx} className="h-2" />;
                    })}
                  </div>

                  {/* Related Topics */}
                  {currentTopic.relatedTopics && currentTopic.relatedTopics.length > 0 && (
                    <div className="border-t border-[#2D2D2D] pt-4 mt-4">
                      <p className="text-xs font-semibold text-[#6B7280] uppercase mb-2">
                        Temas Relacionados
                      </p>
                      <div className="space-y-1">
                        {currentTopic.relatedTopics
                          .map((id) => topics.find((t) => t.id === id))
                          .filter(Boolean)
                          .map((topic) => (
                            <button
                              key={topic!.id}
                              onClick={() => setSelectedTopic(topic!.id)}
                              className="block text-xs text-[#F97316] hover:text-[#FF6B6B] transition-colors"
                            >
                              → {topic!.title}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-[#111111] border-t border-[#2D2D2D] p-3 flex-shrink-0 text-xs text-[#6B7280]">
              💡 Tip: Presiona <kbd className="px-1.5 py-0.5 bg-[#2D2D2D] rounded">?</kbd> para abrir
              la ayuda
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 z-40"
          />
        )}
      </AnimatePresence>

      {/* Global Keyboard Shortcut */}
      <GlobalKeyboardListener onHelp={() => setIsOpen(!isOpen)} />
    </>
  );
}

function GlobalKeyboardListener({ onHelp }: { onHelp: () => void }) {
  useState(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?') {
        e.preventDefault();
        onHelp();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onHelp]);

  return null;
}
