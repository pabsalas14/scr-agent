import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, CheckCircle, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

type Mode = 'login' | 'register';
type Phase = 'idle' | 'syncing' | 'valid';

export default function LoginPage() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setName('');
    setEmail('');
    setPassword('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setPhase('syncing');

    try {
      const url = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
      const body = mode === 'login' ? { email, password } : { name, email, password };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || (mode === 'login' ? 'Credenciales incorrectas' : 'Error al crear cuenta'));
      }

      const data = await response.json();
      setPhase('valid');

      setTimeout(() => {
        setToken(data.token);
        localStorage.setItem('userEmail', email);
        navigate('/dashboard');
      }, 1200);

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMsg);
      setPhase('idle');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-[radial-gradient(#1C1C1E_1px,transparent_1px)] [background-size:32px_32px] opacity-60" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#F97316]/5 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#F97316] rounded-xl mb-4 shadow-[0_0_24px_rgba(249,115,22,0.3)]">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white">SCR Agent</h1>
          <p className="text-sm text-[#6B7280] mt-1">Auditoría Agéntica de Código</p>
        </div>

        {/* Card */}
        <div className="bg-[#1C1C1E] border border-[#2D2D2D] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#2D2D2D]">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  mode === m
                    ? 'text-white border-b-2 border-[#F97316]'
                    : 'text-[#6B7280] hover:text-[#A0A0A0]'
                }`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          <div className="p-7">
            <AnimatePresence mode="wait">
              {phase === 'syncing' ? (
                <motion.div
                  key="syncing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-10 flex flex-col items-center justify-center space-y-4"
                >
                  <Loader2 className="w-10 h-10 text-[#F97316] animate-spin" />
                  <p className="text-sm text-[#A0A0A0]">
                    {mode === 'login' ? 'Verificando credenciales...' : 'Creando cuenta...'}
                  </p>
                </motion.div>
              ) : phase === 'valid' ? (
                <motion.div
                  key="valid"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 flex flex-col items-center justify-center space-y-4"
                >
                  <div className="w-14 h-14 bg-[#22C55E]/10 rounded-full flex items-center justify-center border border-[#22C55E]/20">
                    {mode === 'login'
                      ? <CheckCircle className="w-7 h-7 text-[#22C55E]" />
                      : <UserPlus className="w-7 h-7 text-[#22C55E]" />
                    }
                  </div>
                  <p className="text-sm font-medium text-[#22C55E]">
                    {mode === 'login' ? 'Acceso concedido' : 'Cuenta creada'}
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key={`form-${mode}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* Name (register only) */}
                  {mode === 'register' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#A0A0A0]">Nombre completo</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#111111] border border-[#2D2D2D] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#4B5563] focus:border-[#F97316]/50 focus:outline-none focus:ring-1 focus:ring-[#F97316]/20 transition-all"
                        placeholder="Juan Pérez"
                        required
                      />
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#A0A0A0]">Correo electrónico</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#111111] border border-[#2D2D2D] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#4B5563] focus:border-[#F97316]/50 focus:outline-none focus:ring-1 focus:ring-[#F97316]/20 transition-all"
                      placeholder="admin@empresa.com"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#A0A0A0]">Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#111111] border border-[#2D2D2D] rounded-lg px-3.5 py-2.5 pr-10 text-sm text-white placeholder-[#4B5563] focus:border-[#F97316]/50 focus:outline-none focus:ring-1 focus:ring-[#F97316]/20 transition-all"
                        placeholder="••••••••"
                        minLength={mode === 'register' ? 8 : undefined}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#A0A0A0] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {mode === 'register' && (
                      <p className="text-xs text-[#4B5563]">Mínimo 8 caracteres</p>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-[#EF4444]/10 border border-[#EF4444]/25 rounded-lg px-3.5 py-2.5 flex items-center gap-2 text-[#EF4444]"
                    >
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#F97316] hover:bg-[#EA6D00] disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg transition-all shadow-sm hover:shadow-[0_4px_12px_rgba(249,115,22,0.3)]"
                  >
                    {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#4B5563] mt-6">
          © 2026 SCR Agent · Auditoría de código agéntica
        </p>
      </motion.div>
    </div>
  );
}
