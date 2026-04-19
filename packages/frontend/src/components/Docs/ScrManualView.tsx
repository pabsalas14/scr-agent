import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronRight, 
  Shield, 
  Search, 
  Code2, 
  History, 
  Zap,
  Info,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { SECURITY_KNOWLEDGE, SecurityTopic } from '../../data/security-knowledge';

export default function ScrManualView() {
  const [selectedTopicId, setSelectedTopicId] = useState(SECURITY_KNOWLEDGE[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTopics = SECURITY_KNOWLEDGE.filter(
    topic => 
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTopic = SECURITY_KNOWLEDGE.find(t => t.id === selectedTopicId) || SECURITY_KNOWLEDGE[0];

  const categories = [
    { id: 'SCR_METHODOLOGY', label: 'Metodología SCR', icon: Shield },
    { id: 'THREAT_TYPES', label: 'Tipos de Amenazas', icon: AlertOctagon },
    { id: 'GIT_FORENSICS', label: 'Forense de Git', icon: History },
    { id: 'REMEDIATION', label: 'Remediación', icon: Zap },
  ];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] bg-[#111111] rounded-2xl border border-[#2D2D2D] overflow-hidden">
      {/* Sidebar de Navegación */}
      <aside className="w-full md:w-80 border-r border-[#2D2D2D] bg-[#1E1E20] flex flex-col">
        <div className="p-6 border-b border-[#2D2D2D]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center text-[#F97316]">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Manual SCR</h2>
              <p className="text-xs text-[#6B7280]">Biblioteca de Seguridad</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Buscar tema..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-sm text-white focus:border-[#F97316] outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {categories.map((category) => {
            const topicsInCategory = filteredTopics.filter(t => t.category === category.id);
            if (topicsInCategory.length === 0) return null;

            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center gap-2 px-2 mb-3">
                  <category.icon className="w-3.5 h-3.5 text-[#F97316]" />
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">{category.label}</span>
                </div>
                <div className="space-y-1">
                  {topicsInCategory.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                      className={`w-full px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group ${
                        selectedTopicId === topic.id
                          ? 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20'
                          : 'text-[#A0A0A0] hover:bg-[#242424] hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-2">{topic.title}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${selectedTopicId === topic.id ? 'translate-x-0.5' : 'opacity-0 group-hover:opacity-100'}`} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Área de Contenido */}
      <main className="flex-1 overflow-y-auto bg-[#111111] scroll-smooth">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTopicId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-8 md:p-12 max-w-4xl mx-auto space-y-10"
          >
            {/* Topic Header */}
            <header className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-[10px] font-bold uppercase tracking-wider">
                {categories.find(c => c.id === selectedTopic.category)?.label}
              </span>
              <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
                {selectedTopic.title}
              </h1>
              <p className="text-xl text-[#94A3B8] leading-relaxed">
                {selectedTopic.summary}
              </p>
            </header>

            <div className="h-px bg-gradient-to-r from-[#2D2D2D] via-[#F97316]/20 to-[#2D2D2D]" />

            {/* Main Content */}
            <article className="prose prose-invert max-w-none text-[#A0A0A0] leading-relaxed">
              <div 
                className="space-y-6 text-lg"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(
                    selectedTopic.content
                      .replace(/### (.*)/g, '<h3 class="text-2xl font-semibold text-white mt-8 mb-4">$1</h3>')
                      .replace(/\*\* (.*?) \*\*/g, '<strong class="text-white font-bold">$1</strong>')
                      .replace(/- \*\*(.*?)\*\*: (.*)/g, '<li class="mb-2"><strong class="text-[#F97316]">$1</strong>: $2</li>')
                      .replace(/\n/g, '<br />'),
                    {
                      ALLOWED_TAGS: ['h3', 'strong', 'li', 'br'],
                      ALLOWED_ATTR: ['class'],
                    }
                  )
                }}
              />
            </article>

            {/* Examples Section */}
            {selectedTopic.examples && selectedTopic.examples.length > 0 && (
              <section className="space-y-6 pt-10">
                <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
                  <Code2 className="w-6 h-6 text-[#F97316]" />
                  Ejemplos Prácticos
                </h3>
                
                <div className="space-y-8">
                  {selectedTopic.examples.map((ex, i) => (
                    <div key={i} className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase">
                            <AlertOctagon className="w-3.5 h-3.5" /> Inseguro
                          </div>
                          <div className="bg-black/40 border border-red-500/20 rounded-xl p-4 font-mono text-sm overflow-x-auto text-red-100">
                            <code>{ex.bad}</code>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Seguro
                          </div>
                          <div className="bg-black/40 border border-green-500/20 rounded-xl p-4 font-mono text-sm overflow-x-auto text-green-100">
                            <code>{ex.good}</code>
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-4 flex gap-3">
                        <Info className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-[#A0A0A0]">{ex.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-[#1E1E20] to-[#111111] border border-[#F97316]/20 rounded-2xl p-8 relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#F97316]/5 rounded-full blur-3xl group-hover:bg-[#F97316]/10 transition-colors" />
              <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#EAB308]" />
                Tip de Auditoría
              </h4>
              <p className="text-[#A0A0A0] relative z-10">
                Recuerda que SCR Agent no solo mira el código estático. Si un autor "nuevo" está inyectando código ofuscado, el sistema elevará la prioridad forense automáticamente.
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
