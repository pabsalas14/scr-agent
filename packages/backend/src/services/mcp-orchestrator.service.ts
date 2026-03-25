/**
 * ============================================================================
 * ORQUESTADOR MCP - Coordinador de Agentes
 * ============================================================================
 *
 * Servicio central que coordina la ejecución de los 3 agentes:
 * 1. Agente Malicia: Detecta código malicioso
 * 2. Agente Forenses: Investigación de historial
 * 3. Agente Síntesis: Reporte ejecutivo
 *
 * Flujo:
 * Código → [Malicia] → Hallazgos
 *                      ↓
 *          Historial + Hallazgos → [Forenses] → Timeline
 *                                               ↓
 *          Hallazgos + Timeline → [Síntesis] → Reporte Ejecutivo
 *
 * El orquestador expone los agentes como herramientas MCP (Model Context Protocol)
 * para que se puedan usar desde el frontend o desde otros sistemas.
 */

import { logger, auditLog, AuditEventType } from './logger.service';
import { gitService } from './git.service';
import { maliciaAgent } from '../agents/malicia.agent';
import { forensesAgent } from '../agents/forenses.agent';
import { sintesisAgent } from '../agents/sintesis.agent';
import {
  ResultadoAnalisisCompleto,
  AnalisisCompleto,
  MaliciaInput,
  ForensesInput,
  SintesisInput,
} from '../types/agents';

/**
 * Servicio Orquestador de Agentes MCP
 */
export class MCPOrchestratorService {
  /**
   * Ejecutar análisis completo de seguridad
   *
   * Flujo:
   * 1. Validar repositorio
   * 2. Obtener código fuente
   * 3. Ejecutar Malicia
   * 4. Si hay hallazgos, ejecutar Forenses
   * 5. Ejecutar Síntesis
   * 6. Guardar resultados
   */
  async ejecutarAnalisisCompleto(
    analisis: AnalisisCompleto
  ): Promise<ResultadoAnalisisCompleto> {
    const startTime = Date.now();
    const resultado: ResultadoAnalisisCompleto = {
      ...analisis,
      timestamp_fin: new Date().toISOString(),
    };

    try {
      /**
       * PASO 1: Validar repositorio
       */
      logger.info(`Iniciando análisis: ${analisis.id}`);
      resultado.status = 'RUNNING';

      if (!gitService.validateRepositoryUrl(analisis.url_repositorio)) {
        throw new Error('URL de repositorio inválida o no soportada');
      }

      /**
       * PASO 2: Clonar/Pullear repositorio
       */
      logger.info('Obteniendo repositorio');
      const localPath = await gitService.cloneOrPullRepository(
        analisis.url_repositorio
      );

      /**
       * PASO 3: Obtener código fuente
       * TODO: Implementar extracción de archivos
       */
      logger.info('Extrayendo código fuente');
      const codigoFuente = 'placeholder'; // TODO: Leer archivos del repo

      /**
       * PASO 4: Ejecutar Agente Malicia
       */
      logger.info('Ejecutando Agente Malicia');
      resultado.status = 'MALICIA_RUNNING';

      const maliciaInput: MaliciaInput = {
        codigo: codigoFuente,
        contexto: `Análisis de repositorio: ${analisis.url_repositorio}`,
      };

      const maliciaOutput = await maliciaAgent.analizarCodigo(maliciaInput);
      resultado.malicia_output = maliciaOutput;

      auditLog(AuditEventType.MALICIA_EXECUTION, 'Análisis Malicia completado', {
        analisis_id: analisis.id,
        hallazgos: maliciaOutput.cantidad_hallazgos,
      });

      /**
       * PASO 5: Ejecutar Agente Forenses
       * (Solo si hay hallazgos)
       */
      if (maliciaOutput.cantidad_hallazgos > 0) {
        logger.info('Ejecutando Agente Forenses');
        resultado.status = 'FORENSES_RUNNING';

        // Obtener historial de Git
        const historialGit = await gitService.getCommitHistory(
          analisis.url_repositorio,
          50
        );

        const forensesInput: ForensesInput = {
          hallazgos_malicia: maliciaOutput.hallazgos,
          historial_commits: historialGit,
        };

        const forensesOutput = await forensesAgent.investigarHistorial(
          forensesInput
        );
        resultado.forenses_output = forensesOutput;

        auditLog(
          AuditEventType.FORENSES_EXECUTION,
          'Análisis Forenses completado',
          {
            analisis_id: analisis.id,
            eventos: forensesOutput.linea_tiempo.length,
          }
        );
      }

      /**
       * PASO 6: Ejecutar Agente Síntesis
       */
      logger.info('Ejecutando Agente Síntesis');
      resultado.status = 'SINTESIS_RUNNING';

      const sintesisInput: SintesisInput = {
        hallazgos_malicia: resultado.malicia_output?.hallazgos || [],
        linea_tiempo_forenses: resultado.forenses_output?.linea_tiempo || [],
        contexto_repo: `Repositorio: ${analisis.url_repositorio}`,
      };

      const sintesisOutput = await sintesisAgent.generarReporte(sintesisInput);
      resultado.sintesis_output = sintesisOutput;

      auditLog(AuditEventType.SINTESIS_EXECUTION, 'Síntesis completada', {
        analisis_id: analisis.id,
        puntuacion_riesgo: sintesisOutput.puntuacion_riesgo,
      });

      /**
       * PASO 7: Marcar como completado
       */
      resultado.status = 'COMPLETED';
      resultado.timestamp_fin = new Date().toISOString();

      auditLog(AuditEventType.ANALYSIS_COMPLETED, 'Análisis completo completado', {
        analisis_id: analisis.id,
        tiempo_total_ms: Date.now() - startTime,
        puntuacion_riesgo: sintesisOutput.puntuacion_riesgo,
      });

      logger.info(`✅ Análisis completado: ${analisis.id}`);
      return resultado;
    } catch (error) {
      /**
       * Manejo de errores
       */
      const errorMsg = error instanceof Error ? error.message : String(error);
      resultado.status = 'FAILED';
      resultado.error = errorMsg;
      resultado.timestamp_fin = new Date().toISOString();

      auditLog(AuditEventType.ANALYSIS_FAILED, 'Análisis falló', {
        analisis_id: analisis.id,
        error: errorMsg,
      });

      logger.error(`❌ Error en análisis ${analisis.id}: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Ejecutar solo Agente Malicia
   * Útil para análisis rápido de código
   */
  async soloMalicia(codigo: string, contexto?: string) {
    try {
      logger.info('Ejecutando Malicia solamente');

      const input: MaliciaInput = {
        codigo,
        contexto,
      };

      const resultado = await maliciaAgent.analizarCodigo(input);
      return resultado;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error en Malicia: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Ejecutar solo Agente Forenses
   * Útil para análisis de Git sin código
   */
  async soloForenses(
    url_repositorio: string,
    archivo?: string,
    limite_commits?: number
  ) {
    try {
      logger.info('Ejecutando Forenses solamente');

      const historial = await gitService.getCommitHistory(
        url_repositorio,
        limite_commits || 50
      );

      const input: ForensesInput = {
        hallazgos_malicia: [],
        historial_commits: historial,
      };

      const resultado = await forensesAgent.investigarHistorial(input);
      return resultado;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error en Forenses: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Obtener estado actual de un análisis
   * TODO: Implementar con base de datos
   */
  async obtenerEstado(analisisId: string): Promise<ResultadoAnalisisCompleto | null> {
    // TODO: Buscar en base de datos
    logger.debug(`Obteniendo estado de análisis: ${analisisId}`);
    return null;
  }

  /**
   * Cancelar un análisis en progreso
   * TODO: Implementar con soporte de base de datos
   */
  async cancelarAnalisis(analisisId: string): Promise<boolean> {
    // TODO: Marcar en base de datos como cancelado
    logger.info(`Cancelando análisis: ${analisisId}`);
    return true;
  }
}

/**
 * Singleton exportado
 */
export const mcpOrchestrator = new MCPOrchestratorService();
