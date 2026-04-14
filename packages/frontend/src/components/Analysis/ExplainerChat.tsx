import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  X, 
  Loader2, 
  MessageSquare,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { apiService } from '../../services/api.service';

interface Message {
  role: 'agent' | 'user';
  content: string;
}

interface ExplainerChatProps {
  findingId: string;
  findingType: string;
  onClose: () => void;
}

export default function ExplainerChat({ findingId, findingType, onClose }: ExplainerChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'agent', 
      content: `Hola. Soy el Agente Fiscal. He analizado el hallazgo de tipo **${findingType}**. ¿Tienes alguna duda técnica sobre el riesgo detectado o cómo corregirlo?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const answer = await apiService.chatearConHallazgo(findingId, userMessage);
      setMessages(prev => [...prev, { role: 'agent', content: answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'agent', content: 'Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta de nuevo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed right-0 top-0 bottom-0 w-full md:w-[450px] bg-[#1E1E20] border-l border-[#2D2D2D] shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-[#2D2D2D] bg-[#242424] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center text-[#F97316] relative">
            <Bot className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#242424]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Inteligencia Explicativa</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               <p className="text-[10px] text-[#22C55E] font-bold">Agente Fiscal Online</p>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-[#2D2D2D] rounded-lg transition-colors text-[#6B7280] hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-[#2D2D2D] text-[#A0A0A0]' : 'bg-[#F97316]/10 text-[#F97316]'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                msg.role === 'user' 
                  ? 'bg-[#2D2D2D] border-[#404040] text-white rounded-tr-none' 
                  : 'bg-[#111111] border-[#2D2D2D] text-[#A0A0A0] rounded-tl-none'
              }`}>
                <div 
                  className="prose prose-invert prose-sm"
                  dangerouslySetInnerHTML={{ 
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#F97316]">$1</strong>')
                      .replace(/\n/g, '<br />')
                  }} 
                />
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 flex items-center justify-center text-[#F97316]">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#111111] border border-[#2D2D2D] p-4 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-[#2D2D2D] bg-[#242424]">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Pregunta algo sobre este hallazgo..."
            className="w-full bg-[#111111] border border-[#2D2D2D] rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:border-[#F97316] outline-none transition-all resize-none min-h-[50px] max-h-[150px]"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 bottom-3 p-2 rounded-lg bg-[#F97316] text-white hover:bg-[#EA6B1B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-[#6B7280] text-center mt-3 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-[#EAB308]" />
          IA Generativa entrenada en Ciberseguridad
        </p>
      </div>
    </motion.div>
  );
}
