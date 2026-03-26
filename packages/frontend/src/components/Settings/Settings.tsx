/**
 * Página de configuración del sistema
 * Permite configurar el API key de Anthropic y otros parámetros
 */

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
      <div className="flex justify-center items-center py-20">
        <span className="text-gray-500">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Configuración</h2>
        <p className="text-sm text-gray-500 mt-1">
          Ajusta los parámetros del sistema SCR Agent
        </p>
      </div>

      {/* Estado del API key */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg border p-4 flex items-center gap-3 ${
          config?.apiKeyConfigured
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}
      >
        <span className="text-2xl">
          {config?.apiKeyConfigured ? '✅' : '⚠️'}
        </span>
        <div>
          <p className={`font-medium text-sm ${config?.apiKeyConfigured ? 'text-green-800' : 'text-yellow-800'}`}>
            {config?.apiKeyConfigured
              ? 'API key de Anthropic configurada'
              : 'API key de Anthropic no configurada'}
          </p>
          <p className={`text-xs mt-0.5 ${config?.apiKeyConfigured ? 'text-green-600' : 'text-yellow-600'}`}>
            {config?.apiKeyConfigured
              ? 'Los agentes AI están listos para analizar repositorios'
              : 'Debes configurar el API key para poder iniciar análisis'}
          </p>
        </div>
      </motion.div>

      {/* Formulario API Key */}
      <div className="card bg-white p-5">
        <h3 className="font-semibold text-gray-900 mb-1">API Key de Anthropic</h3>
        <p className="text-xs text-gray-500 mb-4">
          Obtén tu API key en{' '}
          <span className="font-mono text-blue-600">console.anthropic.com</span>
        </p>

        <form onSubmit={handleSubmitApiKey} className="space-y-3">
          <div className="relative">
            <input
              type={mostrarKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config?.apiKeyConfigured ? '••••••••••••••••••••• (cambiar)' : 'sk-ant-api03-...'}
              className="input-field pr-12 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setMostrarKey(!mostrarKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
              tabIndex={-1}
            >
              {mostrarKey ? '🙈' : '👁'}
            </button>
          </div>

          <button
            type="submit"
            disabled={!apiKey.trim() || guardar.isPending}
            className="button-primary w-full"
          >
            {guardar.isPending ? '⏳ Guardando...' : config?.apiKeyConfigured ? 'Actualizar API key' : 'Guardar API key'}
          </button>
        </form>

        {guardado && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-600 text-sm mt-3 text-center"
          >
            ✓ Configuración guardada correctamente
          </motion.p>
        )}

        {guardar.isError && (
          <p className="text-red-600 text-sm mt-3 text-center">
            Error al guardar. Verifica el API key.
          </p>
        )}
      </div>

      {/* Opciones avanzadas */}
      <div className="card bg-white p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Opciones de análisis</h3>

        <form onSubmit={handleSubmitOpciones} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo archivos por repo
              </label>
              <input
                name="maxFilesPerRepo"
                type="number"
                min={1}
                max={200}
                defaultValue={config?.maxFilesPerRepo ?? 50}
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">Más archivos = análisis más lento y costoso</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamaño máx. por archivo (KB)
              </label>
              <input
                name="maxFileSizeKb"
                type="number"
                min={1}
                max={1000}
                defaultValue={config?.maxFileSizeKb ?? 100}
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">Archivos más grandes se omiten</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nivel de logs
            </label>
            <select name="logLevel" defaultValue={config?.logLevel ?? 'info'} className="input-field">
              <option value="debug">Debug (verboso)</option>
              <option value="info">Info (recomendado)</option>
              <option value="warn">Warn (solo advertencias)</option>
              <option value="error">Error (solo errores)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={guardar.isPending}
            className="button-secondary w-full"
          >
            {guardar.isPending ? '⏳ Guardando...' : 'Guardar opciones'}
          </button>
        </form>
      </div>

      {/* Info del sistema */}
      <div className="card bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-700 mb-2 text-sm">Acerca de SCR Agent</h3>
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Agente Inspector (Claude 3.5 Sonnet) — Detección de código malicioso</p>
          <p>• Agente Detective (Claude 3.5 Haiku) — Análisis forense de historial Git</p>
          <p>• Agente Fiscal (Claude 3.5 Sonnet) — Síntesis y reporte ejecutivo</p>
          <p className="mt-2 text-gray-400">OWASP Top 10 2021 · Arquitectura MCP · PostgreSQL + Prisma</p>
        </div>
      </div>
    </div>
  );
}
