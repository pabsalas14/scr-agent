/**
 * ============================================================================
 * ORQUESTADOR MCP - Coordinador de Agentes
 * ============================================================================
 *
 * Servicio central que coordina la ejecución de los 3 agentes:
 * 1. Agente Inspector: Detecta código malicioso
 * 2. Agente Detective: Investigación de historial
 * 3. Agente Fiscal: Reporte ejecutivo
 *
 * Flujo:
 * Código → [Inspector] → Hallazgos
 *                      ↓
 *          Historial + Hallazgos → [Detective] → Timeline
 *                                               ↓
 *          Hallazgos + Timeline → [Fiscal] → Reporte Ejecutivo
 *
 * El orquestador expone los agentes como herramientas MCP (Model Context Protocol)
 * para que se puedan usar desde el frontend o desde otros sistemas.
 */

import { logger, auditLog, AuditEventType } from './logger.service';
import { gitService } from './git.service';
import { inspectorAgent } from '../agents/inspector.agent';
import { detectiveAgent } from '../agents/detective.agent';
import { fiscalAgent } from '../agents/fiscal.agent';
import { prisma } from './prisma.service';
import { getLLMConfigFromUser } from './user-llm-config.service';
import { cancelAnalysis } from './analysis-queue';
import { socketService } from './socket.service';
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
   * 3. Ejecutar Inspector
   * 4. Si hay hallazgos, ejecutar Detective
   * 5. Ejecutar Fiscal
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

    let project: any = null;

    try {
      /**
       * PASO 1: Validar repositorio y Cargar configuración
       */
      logger.info(`Iniciando análisis: ${analisis.id}`);

      // Obtener proyecto y configuración de usuario para API Keys dinámicas
      project = await prisma.project.findUnique({
        where: { id: analisis.proyecto_id },
        include: { user: { include: { settings: true } } }
      });

      const userLlm = await getLLMConfigFromUser(project?.userId ?? null);
      if (userLlm) {
        inspectorAgent.updateConfig(userLlm);
        detectiveAgent.updateConfig(userLlm);
        fiscalAgent.updateConfig(userLlm);
        logger.info(
          `Config LLM del usuario aplicada al análisis ${analisis.id} (${userLlm.provider}/${userLlm.model})`
        );
      }

      socketService.emitAnalysisStatusChanged(analisis.id, analisis.proyecto_id, 'INICIANDO', 5, project?.userId || undefined);
      resultado.status = 'MALICIA_EJECUTANDO';

      if (!gitService.validateRepositoryUrl(analisis.url_repositorio)) {
        throw new Error('URL de repositorio inválida o no soportada');
      }

      /**
       * PASO 2: Clonar/Pullear repositorio
       */
      logger.info('Obteniendo repositorio');
      socketService.emitAnalysisStatusChanged(analisis.id, analisis.proyecto_id, 'CLONANDO', 15, project?.userId || undefined);
      
      // Usar token del proyecto o del usuario
      const gitToken = project?.githubToken || project?.user?.settings?.githubToken || process.env['GITHUB_TOKEN'];
      
      const localPath = await gitService.cloneOrPullRepository(
        analisis.url_repositorio,
        gitToken,
        project?.branch || undefined
      );

      /**
       * PASO 3: Obtener código fuente
       * Lee recursivamente los archivos de código del repositorio clonado
       */
      logger.info('Extrayendo código fuente');
      socketService.emitAnalysisStatusChanged(analisis.id, analisis.proyecto_id, 'LEYENDO_ARCHIVOS', 30, project?.userId || undefined);
      
      // Usar límites del proyecto si existen
      const repoFiles = gitService.readRepositoryFiles(localPath, undefined, {
        maxFileSizeKb: project?.maxFileSizeKb,
        maxTotalSizeMb: project?.maxTotalSizeMb,
        maxDirectoryDepth: project?.maxDirectoryDepth
      });

      const codigoFuente = repoFiles.files
        .map((f) => `// === ${f.path} ===\n${f.content}`)
        .join('\n\n');
      logger.info(`Archivos extraídos: ${repoFiles.fileCount}, tamaño: ${repoFiles.totalSize} bytes`);
      
      // Emitir reporte de cobertura (archivos excluidos)
      socketService.emitCoverageReport(analisis.id, analisis.proyecto_id, repoFiles.coverage);

      /**
       * PASO 4: Ejecutar Agente Malicia
       */
      logger.info('Ejecutando Agente Inspector');
      socketService.emitAnalysisStatusChanged(analisis.id, analisis.proyecto_id, 'INSPECTOR_EJECUTANDO', 40, project?.userId || undefined);
      resultado.status = 'MALICIA_EJECUTANDO';

      const maliciaInput: MaliciaInput = {
        codigo: codigoFuente,
        contexto: `Análisis de repositorio: ${analisis.url_repositorio}`,
      };

      const maliciaOutput = await inspectorAgent.analizarCodigo(maliciaInput);
      resultado.malicia_output = maliciaOutput;
      
      socketService.emitAnalysisFindingsDiscovered(analisis.id, analisis.proyecto_id, maliciaOutput.cantidad_hallazgos, project?.userId || '');

      auditLog(AuditEventType.INSPECTOR_EXECUTION, 'Análisis Inspector completado', {
        analisis_id: analisis.id,
        hallazgos: maliciaOutput.cantidad_hallazgos,
      });

      /**
       * PASO 5: Ejecutar Agente Forenses
       * (Solo si hay hallazgos)
       */
      if (maliciaOutput.cantidad_hallazgos > 0) {
        logger.info('Ejecutando Agente Detective');
        socketService.emitAnalysisStatusChanged(analisis.id, analisis.proyecto_id, 'DETECTIVE_EJECUTANDO', 65, project?.userId || undefined);
        resultado.status = 'FORENSES_EJECUTANDO';

        // Obtener historial de Git
        const historialGit = await gitService.getCommitHistory(
          analisis.url_repositorio,
          project?.maxCommits || 50
        );

        const forensesInput: ForensesInput = {
          hallazgos_malicia: maliciaOutput.hallazgos,
          historial_commits: historialGit,
        };

        const forensesOutput = await detectiveAgent.investigarHistorial(
          forensesInput
        );
        resultado.forenses_output = forensesOutput;

        auditLog(AuditEventType.DETECTIVE_EXECUTION, 'Análisis Detective completado', {
          analisis_id: analisis.id,
          eventos: forensesOutput.linea_tiempo.length,
        });
      }

      /**
       * PASO 6: Ejecutar Agente Síntesis
       */
      logger.info('Ejecutando Agente Fiscal');
      socketService.emitAnalysisStatusChanged(analisis.id, analisis.proyecto_id, 'FISCAL_EJECUTANDO', 85, project?.userId || undefined);
      resultado.status = 'SINTESIS_EJECUTANDO';

      const sintesisInput: SintesisInput = {
        hallazgos_malicia: resultado.malicia_output?.hallazgos || [],
        linea_tiempo_forenses: resultado.forenses_output?.linea_tiempo || [],
        contexto_repo: `Repositorio: ${analisis.url_repositorio}`,
      };

      const sintesisOutput = await fiscalAgent.generarReporte(sintesisInput);
      resultado.sintesis_output = sintesisOutput;

      auditLog(AuditEventType.FISCAL_EXECUTION, 'Fiscal completado', {
        analisis_id: analisis.id,
        puntuacion_riesgo: sintesisOutput.puntuacion_riesgo,
      });

      /**
       * PASO 7: Marcar como completado
       */
      resultado.status = 'COMPLETADO';
      resultado.timestamp_fin = new Date().toISOString();
      
      socketService.emitAnalysisCompleted(analisis.id, analisis.proyecto_id, sintesisOutput, project?.userId || '');

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
      resultado.status = 'ERROR';
      resultado.error = errorMsg;
      resultado.timestamp_fin = new Date().toISOString();
      
      socketService.emitAnalysisError(analisis.id, analisis.proyecto_id, errorMsg, project?.userId || '');

      auditLog(AuditEventType.ANALYSIS_FAILED, 'Análisis falló', {
        analisis_id: analisis.id,
        error: errorMsg,
      });

      logger.error(`❌ Error en análisis ${analisis.id}: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Ejecutar solo Agente Inspector
   * Útil para análisis rápido de código
   */
  async soloMalicia(codigo: string, contexto?: string) {
    try {
      logger.info('Ejecutando Inspector solamente');

      const input: MaliciaInput = {
        codigo,
        contexto,
      };

      const resultado = await inspectorAgent.analizarCodigo(input);
      return resultado;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error en Inspector: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Ejecutar solo Agente Detective
   * Útil para análisis de Git sin código
   */
  async soloForenses(
    url_repositorio: string,
    archivo?: string,
    limite_commits?: number
  ) {
    try {
      logger.info('Ejecutando Detective solamente');

      const historial = await gitService.getCommitHistory(
        url_repositorio,
        limite_commits || 50
      );

      const input: ForensesInput = {
        hallazgos_malicia: [],
        historial_commits: historial,
      };

      const resultado = await detectiveAgent.investigarHistorial(input);
      return resultado;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error en Detective: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Obtener estado actual de un análisis consultando la BD
   */
  async obtenerEstado(analisisId: string): Promise<ResultadoAnalisisCompleto | null> {
    logger.debug(`Obteniendo estado de análisis: ${analisisId}`);

    const analysis = await prisma.analysis.findUnique({
      where: { id: analisisId },
      include: { project: true },
    });

    if (!analysis) return null;

    const mapStatus = (s: string): ResultadoAnalisisCompleto['status'] => {
      const statusMap: Record<string, ResultadoAnalisisCompleto['status']> = {
        PENDING: 'PENDIENTE',
        RUNNING: 'MALICIA_EJECUTANDO',
        INSPECTOR_RUNNING: 'MALICIA_EJECUTANDO',
        DETECTIVE_RUNNING: 'FORENSES_EJECUTANDO',
        FISCAL_RUNNING: 'SINTESIS_EJECUTANDO',
        COMPLETED: 'COMPLETADO',
        FAILED: 'ERROR',
        CANCELLED: 'ERROR',
        PARTIAL: 'COMPLETADO',
      };
      return statusMap[s] ?? 'ERROR';
    };

    return {
      id: analysis.id,
      proyecto_id: analysis.projectId,
      url_repositorio: analysis.project.repositoryUrl,
      alcance: 'REPOSITORIO',
      timestamp_inicio: (analysis.startedAt ?? analysis.createdAt).toISOString(),
      status: mapStatus(analysis.status),
      timestamp_fin: analysis.completedAt?.toISOString(),
    };
  }

  /**
   * Cancelar un análisis en progreso
   * Actualiza el estado en BD y señala al queue para detener la ejecución
   */
  async cancelarAnalisis(analisisId: string): Promise<boolean> {
    logger.info(`Cancelando análisis: ${analisisId}`);

    const analysis = await prisma.analysis.findUnique({
      where: { id: analisisId },
    });

    if (!analysis) {
      logger.warn(`Análisis ${analisisId} no encontrado`);
      return false;
    }

    const estadosCancelables = [
      'PENDING',
      'RUNNING',
      'INSPECTOR_RUNNING',
      'DETECTIVE_RUNNING',
      'FISCAL_RUNNING',
    ];

    if (!estadosCancelables.includes(analysis.status)) {
      logger.warn(`Análisis ${analisisId} no está en estado cancelable: ${analysis.status}`);
      return false;
    }

    await prisma.analysis.update({
      where: { id: analisisId },
      data: { status: 'CANCELLED' },
    });

    // Señalar al queue para detener la ejecución entre pasos
    cancelAnalysis(analisisId);

    auditLog(AuditEventType.ANALYSIS_FAILED, 'Análisis cancelado por el usuario', {
      analisisId,
    });

    return true;
  }
}

/**
 * Singleton exportado
 */
export const mcpOrchestrator = new MCPOrchestratorService();
