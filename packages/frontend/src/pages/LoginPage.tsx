/**
 * ============================================================================
 * PÁGINA DE LOGIN - PREMIUM INDUCTION
 * ============================================================================
 * Rediseño de alta fidelidad para la entrada al sistema CODA.
 * Incluye fondos animados, glassmorphism extremo y tipografía "Cyber-Induction".
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, Zap, Activity, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'syncing' | 'valid'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setPhase('syncing');

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falla de Sincronización');
      }

      const data = await response.json();
      setPhase('valid');
      
      // Simular delay para efecto de "Wow" en la inducción
      setTimeout(() => {
        setToken(data.token);
        localStorage.setItem('userEmail', email);
        navigate('/dashboard');
      }, 1500);

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error de Conexión';
      setError(errorMsg);
      setPhase('idle');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* Background Cyber-Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.15]" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-[#00D1FF]/5" />
      
      {/* Animated Glow Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-[#00D1FF]/10 blur-[120px] rounded-full" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.05, 0.15, 0.05],
          x: [0, -40, 0],
          y: [0, 60, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 -left-20 w-[600px] h-[600px] bg-[#7000FF]/5 blur-[150px] rounded-full" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[440px] relative z-10"
      >
        {/* Logo Section */}
        <div className="text-center mb-12 space-y-4">
           <motion.div 
             whileHover={{ scale: 1.05, rotate: 5 }}
             className="relative inline-block"
           >
              <div className="absolute inset-0 bg-[#00D1FF]/20 blur-2xl rounded-full scale-110" />
              <div className="w-24 h-24 bg-gradient-to-br from-[#00D1FF] to-[#7000FF] rounded-3xl flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(0,209,255,0.3)] relative z-10">
                 <Shield className="w-12 h-12 text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]" />
              </div>
           </motion.div>
           
           <div className="space-y-1">
              <h1 className="text-5xl font-black text-white tracking-[-0.05em]">CODA<span className="text-[#00D1FF]">.</span></h1>
              <p className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] translate-x-1">Auditoría Agéntica Avanzada</p>
           </div>
        </div>

        {/* Login Card */}
        <div className="relative group">
           <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00D1FF]/20 via-[#7000FF]/20 to-[#00D1FF]/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
           
           <div className="relative bg-[#0A0B10]/80 backdrop-blur-3xl border border-[#1F2937]/50 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden">
             <AnimatePresence mode="wait">
               {phase === 'syncing' ? (
                 <motion.div 
                   key="syncing"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="py-12 flex flex-col items-center justify-center space-y-6"
                 >
                    <div className="relative">
                       <Activity className="w-16 h-16 text-[#00D1FF] animate-pulse" />
                       <Zap className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                    </div>
                    <div className="text-center space-y-2">
                       <p className="text-white font-black text-xs uppercase tracking-widest">Sincronizando Identidad</p>
                       <p className="text-[#64748B] text-[10px] uppercase tracking-[0.2em] animate-pulse">Iniciando Protocolos de Seguridad...</p>
                    </div>
                 </motion.div>
               ) : phase === 'valid' ? (
                 <motion.div 
                    key="valid"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center justify-center space-y-6"
                 >
                    <div className="w-20 h-20 bg-[#00FF94]/10 rounded-full flex items-center justify-center border border-[#00FF94]/30 shadow-[0_0_50px_rgba(0,255,148,0.2)]">
                       <motion.div
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5 }}
                       >
                          <Shield className="w-10 h-10 text-[#00FF94]" />
                       </motion.div>
                    </div>
                    <p className="text-[#00FF94] font-black text-sm uppercase tracking-widest">Acceso Concedido</p>
                 </motion.div>
               ) : (
                 <motion.form 
                   key="idle"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   onSubmit={handleSubmit} 
                   className="space-y-6"
                 >
                   {/* Email Input */}
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#475569] uppercase tracking-widest ml-2">Identificador de Acceso</label>
                      <div className="relative group/field">
                         <input 
                           type="email" 
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           className="w-full bg-white/[0.03] border border-[#1F2937] rounded-2xl px-5 py-4 text-white text-sm focus:border-[#00D1FF]/50 outline-none transition-all placeholder:text-[#3D4A5C]"
                           placeholder="admin@coda.ai"
                           required
                         />
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3D4A5C] group-focus-within/field:text-[#00D1FF] transition-colors">
                            <Shield className="w-4 h-4" />
                         </div>
                      </div>
                   </div>

                   {/* Password Input */}
                   <div className="space-y-2">
                      <div className="flex justify-between px-2">
                         <label className="text-[10px] font-black text-[#475569] uppercase tracking-widest">Clave Cifrada</label>
                         <button type="button" className="text-[9px] font-black text-[#3D4A5C] hover:text-[#00D1FF] uppercase tracking-widest transition-colors">Olvidé clave</button>
                      </div>
                      <div className="relative group/field">
                         <input 
                           type={showPassword ? 'text' : 'password'} 
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           className="w-full bg-white/[0.03] border border-[#1F2937] rounded-2xl px-5 py-4 text-white text-sm focus:border-[#7000FF]/50 outline-none transition-all placeholder:text-[#3D4A5C]"
                           placeholder="••••••••"
                           required
                         />
                         <button 
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3D4A5C] hover:text-white transition-colors"
                         >
                           {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                         </button>
                      </div>
                   </div>

                   {/* Error Alert */}
                   {error && (
                     <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-500"
                     >
                        <Lock className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                     </motion.div>
                   )}

                   {/* Submit Button */}
                   <button
                     type="submit"
                     disabled={loading}
                     className="w-full relative group/btn overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-[#00D1FF] to-[#7000FF] transition-transform duration-500 group-hover/btn:scale-110" />
                     <div className="relative flex items-center justify-center gap-2 py-4 text-black text-[10px] font-black uppercase tracking-[0.2em]">
                        <span>Sincronizar Acceso</span>
                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                     </div>
                   </button>
                 </motion.form>
               )}
             </AnimatePresence>
           </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-[9px] font-black text-[#3D4A5C] uppercase tracking-[0.3em] space-y-4">
           <div className="flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                 <Zap className="w-3 h-3" />
                 <span>CORE v2.4</span>
              </div>
              <div className="flex items-center gap-2">
                 <Shield className="w-3 h-3" />
                 <span>OWASP ALIGNED</span>
              </div>
           </div>
           <p className="opacity-50">© 2026 CODA SECURITY PROTOCOL · REVISIÓN DE CÓDIGO AGÉNTICA</p>
        </div>
      </motion.div>
    </div>
  );
}
