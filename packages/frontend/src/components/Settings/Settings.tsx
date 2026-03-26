import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiService } from '../../services/api.service';
import type { ActualizarConfigDTO } from '../../types/api';

export default function Settings() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [mostrarKey, setMostrarKey] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: () => apiService.obtenerConfig(),
  });

  const guardar = useMutation({
    mutationFn: (dto: ActualizarConfigDTO) => apiService.actualizarConfig(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      setGuardado(true);
      setApiKey('');
      setTimeout(() => setGuardado(false), 3000);
    },
  });

  const handleSubmitApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    guardar.mutate({ anthropicApiKey: apiKey.trim() });
  };

  const handleSubmitOpciones = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    guardar.mutate({
      logLevel: data.get('logLevel') as ActualizarConfigDTO['logLevel'],
      maxFilesPerRepo: parseInt(data.get('maxFilesPerRepo') as string),
      maxFileSizeKb: parseInt(data.get('maxFileSizeKb') as string),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Cargando configuracion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="page-title">Configuracion</h1>
        <p className="page-subtitle">Ajusta los parametros del sistema CODA</p>
      </div>

      {/* API Key status banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-4 p-4 rounded-xl border mb-6 ${
          config?.apiKeyConfigured
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-200'
        }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
          config?.apiKeyConfigured ? 'bg-emerald-100' : 'bg-amber-100'
        }`}>
          {config?.apiKeyConfigured ? '✓' : '!'}
        </div>
        <div>
          <p className={`font-semibold text-sm ${config?.apiKeyConfigured ? 'text-emerald-800' : 'text-amber-800'}`}>
            {config?.apiKeyConfigured ? 'API key de Anthropic configurada' : 'API key de Anthropic no configurada'}
          </p>
          <p className={`text-xs mt-0.5 ${config?.apiKeyConfigured ? 'text-emerald-600' : 'text-amber-600'}`}>
            {config?.apiKeyConfigured
              ? 'Los agentes IA estan listos para analizar repositorios'
              : 'Debes configurar el API key para poder iniciar analisis'}
          </p>
        </div>
      </motion.div>

      {/* API Key form */}
      <div className="card p-6 mb-5">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
            🔑
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">API Key de Anthropic</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Obtén tu clave en{' '}
              <span className="font-mono text-indigo-600">console.anthropic.com</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitApiKey} className="space-y-3">
          <div className="relative">
            <input
              type={mostrarKey ? 'text' : 'password'}
              className="input pr-10 font-mono text-sm"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config?.apiKeyConfigured ? 'sk-ant-••••••••••• (cambiar)' : 'sk-ant-api03-...'}
            />
            <button
              type="button"
              onClick={() => setMostrarKey(!mostrarKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-sm"
              tabIndex={-1}
            >
              {mostrarKey ? '🙈' : '👁'}
            </button>
          </div>
          <button
            type="submit"
            disabled={!apiKey.trim() || guardar.isPending}
            className="btn-primary w-full justify-center"
          >
            {guardar.isPending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : config?.apiKeyConfigured ? 'Actualizar API key' : 'Guardar API key'}
          </button>

          {guardado && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-emerald-600 text-center font-medium"
            >
              ✓ Configuracion guardada correctamente
            </motion.p>
          )}
          {guardar.isError && (
            <p className="text-sm text-red-600 text-center">
              Error al guardar. Verifica el API key.
            </p>
          )}
        </form>
      </div>

      {/* Analysis options */}
      <div className="card p-6 mb-5">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
            ⚙
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Opciones de analisis</h3>
            <p className="text-xs text-slate-500 mt-0.5">Controla el alcance y profundidad</p>
          </div>
        </div>

        <form onSubmit={handleSubmitOpciones} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Max. archivos por repo
              </label>
              <input
                name="maxFilesPerRepo"
                type="number"
                min={1}
                max={200}
                defaultValue={config?.maxFilesPerRepo ?? 50}
                className="input"
              />
              <p className="text-xs text-slate-400 mt-1">Mas archivos = analisis mas lento</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tamano max. por archivo (KB)
              </label>
              <input
                name="maxFileSizeKb"
                type="number"
                min={1}
                max={1000}
                defaultValue={config?.maxFileSizeKb ?? 100}
                className="input"
              />
              <p className="text-xs text-slate-400 mt-1">Archivos mas grandes se omiten</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nivel de logs
            </label>
            <select name="logLevel" defaultValue={config?.logLevel ?? 'info'} className="input">
              <option value="debug">Debug (verboso)</option>
              <option value="info">Info (recomendado)</option>
              <option value="warn">Warn (solo advertencias)</option>
              <option value="error">Error (solo errores)</option>
            </select>
          </div>

          <button type="submit" disabled={guardar.isPending} className="btn-secondary w-full justify-center">
            {guardar.isPending ? 'Guardando...' : 'Guardar opciones'}
          </button>
        </form>
      </div>

      {/* About */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Acerca de CODA
        </h3>
        <div className="space-y-2">
          {[
            { icon: '🔍', name: 'Agente Inspector', model: 'Claude 3.5 Sonnet', desc: 'Deteccion de codigo malicioso' },
            { icon: '🕵', name: 'Agente Detective', model: 'Claude 3.5 Haiku', desc: 'Analisis forense de historial Git' },
            { icon: '⚖', name: 'Agente Fiscal',     model: 'Claude 3.5 Sonnet', desc: 'Sintesis y reporte ejecutivo' },
          ].map((agent) => (
            <div key={agent.name} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
              <span className="text-lg w-7 text-center flex-shrink-0">{agent.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{agent.name}</p>
                <p className="text-xs text-slate-500">{agent.desc}</p>
              </div>
              <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex-shrink-0">
                {agent.model}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          OWASP Top 10 2021 · Arquitectura multi-agente · PostgreSQL + Prisma
        </p>
      </div>
    </div>
  );
}
