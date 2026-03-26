/**
 * ============================================================================
 * SERVICIO DE CONFIGURACIÓN
 * ============================================================================
 *
 * Guarda y lee configuración del servidor en un archivo JSON local.
 * Permite configurar el API key de Anthropic desde el frontend
 * sin necesidad de reiniciar el servidor.
 */

import fs from 'fs';
import path from 'path';
import { logger } from './logger.service';

const CONFIG_PATH = process.env['CONFIG_FILE_PATH'] || '/tmp/scr-agent-config.json';

export interface AppConfig {
  anthropicApiKey?: string;
  logLevel?: string;
  maxFilesPerRepo?: number;
  maxFileSizeKb?: number;
}

class ConfigService {
  private config: AppConfig = {};

  constructor() {
    this.load();
  }

  /**
   * Cargar configuración desde archivo (y env como fallback)
   */
  private load(): void {
    // Valores por defecto desde env
    this.config = {
      anthropicApiKey: process.env['ANTHROPIC_API_KEY'],
      logLevel: process.env['LOG_LEVEL'] || 'info',
      maxFilesPerRepo: 50,
      maxFileSizeKb: 100,
    };

    // Sobreescribir con valores guardados en archivo si existe
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        const saved = JSON.parse(raw) as AppConfig;
        this.config = { ...this.config, ...saved };
        logger.info('Configuración cargada desde archivo');
      }
    } catch {
      logger.warn('No se pudo cargar el archivo de configuración, usando valores por defecto');
    }
  }

  /**
   * Guardar configuración en archivo
   */
  private save(): void {
    try {
      // No guardar el API key del env (solo los configurados manualmente)
      const dir = path.dirname(CONFIG_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      logger.error(`Error guardando configuración: ${error}`);
    }
  }

  /**
   * Obtener toda la configuración (sin exponer el API key completo)
   */
  getPublic(): Omit<AppConfig, 'anthropicApiKey'> & { apiKeyConfigured: boolean } {
    return {
      logLevel: this.config.logLevel,
      maxFilesPerRepo: this.config.maxFilesPerRepo,
      maxFileSizeKb: this.config.maxFileSizeKb,
      apiKeyConfigured: Boolean(this.config.anthropicApiKey),
    };
  }

  /**
   * Obtener el API key de Anthropic (para uso interno de los agentes)
   */
  getAnthropicApiKey(): string | undefined {
    return this.config.anthropicApiKey;
  }

  /**
   * Actualizar configuración
   */
  update(updates: AppConfig): void {
    this.config = { ...this.config, ...updates };
    this.save();
    logger.info('Configuración actualizada');
  }

  /**
   * Verificar si el API key está configurado
   */
  isReady(): boolean {
    return Boolean(this.config.anthropicApiKey);
  }
}

export const configService = new ConfigService();
