/**
 * ============================================================================
 * SERVICIO DE COLA - Análisis Asíncrono en Background
 * ============================================================================
 *
 * Gestiona la cola de análisis pendientes y los ejecuta en background.
 * Esto permite que el frontend reciba respuesta inmediata al iniciar un análisis
 * y luego haga polling del estado mientras los agentes trabajan.
 *
 * Flujo:
 * 1. POST /projects/:id/analyses → crea registro PENDING, encola trabajo
 * 2. Worker toma el trabajo → cambia a RUNNING, ejecuta agentes
 * 3. Frontend hace polling → recibe estado actualizado en cada request
 * 4. Agentes terminan → estado COMPLETADO, resultados guardados en BD
 *
 * Implementación: Cola in-memory (para producción usar Bull + Redis)
 */

import { PrismaClient } from '@prisma/client';
import { logger, auditLog, AuditEventType } from './logger.service';
import { gitService } from './git.service';
import { pdfService } from './pdf.service';
import { inspectorAgent } from '../agents/inspector.agent';
import { detectiveAgent } from '../agents/detective.agent';
import { fiscalAgent } from '../agents/fiscal.agent';

const prisma = new PrismaClient();

/**
 * Trabajo en cola
 */
interface TrabajoAnalisis {
  analysisId: string;
  projectId: string;
  repositoryUrl: string;
}

/**
 * Servicio de Cola de Análisis
 */
export class QueueService {
  /**
   * Cola en memoria (simple para desarrollo)
   * En producción reemplazar con Bull + Redis
   */
  private cola: TrabajoAnalisis[] = [];

  /**
   * Indica si el worker está procesando
   */
  private procesando = false;

  /**
   * Encolar nuevo análisis
   */
  encolar(trabajo: TrabajoAnalisis): void {
    this.cola.push(trabajo);
    logger.info(`Trabajo encolado: análisis ${trabajo.analysisId}`);

    // Iniciar worker si no está corriendo
    if (!this.procesando) {
      void this.procesarSiguiente();
    }
  }

  /**
   * Procesar siguiente trabajo en cola
   */
  private async procesarSiguiente(): Promise<void> {
    if (this.cola.length === 0) {
      this.procesando = false;
      return;
    }

    this.procesando = true;
    const trabajo = this.cola.shift()!;

    try {
      await this.ejecutarAnalisis(trabajo);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`Error procesando análisis ${trabajo.analysisId}: ${msg}`);
    } finally {
      // Procesar el siguiente sin importar si hubo error
      void this.procesarSiguiente();
    }
  }

  /**
   * Ejecutar análisis completo de un trabajo
   * Flujo: Malicia → Forenses → Síntesis → Guardar en BD
   */
  private async ejecutarAnalisis(trabajo: TrabajoAnalisis): Promise<void> {
    const { analysisId, repositoryUrl } = trabajo;
    const tiempoInicio = Date.now();

    logger.info(`Iniciando análisis: ${analysisId}`);

    try {
      // ── PASO 1: Marcar como RUNNING ─────────────────────────────────────
      await prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'RUNNING', progress: 5, startedAt: new Date() },
      });

      // ── PASO 2: Obtener código fuente ────────────────────────────────────
      logger.info('Clonando/actualizando repositorio');
      const localPath = await gitService.cloneOrPullRepository(repositoryUrl);
      const codigoFuente = await gitService.readRepoFiles(localPath);

      // ── PASO 3: Agente Malicia ───────────────────────────────────────────
      await prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'INSPECTOR_RUNNING', progress: 20 },
      });

      logger.info('Ejecutando Agente Malicia');
      const maliciaOutput = await inspectorAgent.analizarCodigo({
        codigo: codigoFuente,
        contexto: `Análisis de: ${repositoryUrl}`,
      });

      // Guardar hallazgos en BD
      if (maliciaOutput.hallazgos.length > 0) {
        await prisma.finding.createMany({
          data: maliciaOutput.hallazgos.map((h) => ({
            analysisId,
            file: h.archivo,
            function: h.funcion,
            lineRange: h.rango_lineas.join('-'),
            severity: this.mapearSeveridad(h.severidad),
            riskType: this.mapearTipoRiesgo(h.tipo_riesgo),
            confidence: h.confianza,
            codeSnippet: h.fragmento_codigo,
            whySuspicious: h.por_que_sospechoso,
            remediationSteps: h.pasos_remediacion,
          })),
        });
      }

      auditLog(AuditEventType.MALICIA_EXECUTION, 'Malicia completado y guardado', {
        analysisId,
        hallazgos: maliciaOutput.cantidad_hallazgos,
      });

      // ── PASO 4: Agente Forenses ──────────────────────────────────────────
      await prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'DETECTIVE_RUNNING', progress: 50 },
      });

      const historialGit = await gitService.getCommitHistory(repositoryUrl, 50);

      logger.info('Ejecutando Agente Forenses');
      const forensesOutput = await detectiveAgent.investigarHistorial({
        hallazgos_malicia: maliciaOutput.hallazgos,
        historial_commits: historialGit,
      });

      // Guardar eventos forenses en BD
      if (forensesOutput.linea_tiempo.length > 0) {
        await prisma.forensicEvent.createMany({
          data: forensesOutput.linea_tiempo.map((e) => ({
            analysisId,
            commitHash: e.commit,
            commitMessage: e.mensaje_commit,
            author: e.autor,
            action: this.mapearAccion(e.accion),
            file: e.archivo,
            function: e.funcion,
            changesSummary: e.resumen_cambios,
            riskLevel: this.mapearSeveridad(e.nivel_riesgo),
            suspicionIndicators: e.indicadores_sospecha || [],
            timestamp: new Date(e.timestamp),
          })),
        });
      }

      // ── PASO 5: Agente Síntesis ──────────────────────────────────────────
      await prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'FISCAL_RUNNING', progress: 80 },
      });

      logger.info('Ejecutando Agente Síntesis');
      const sintesisOutput = await fiscalAgent.generarReporte({
        hallazgos_malicia: maliciaOutput.hallazgos,
        linea_tiempo_forenses: forensesOutput.linea_tiempo,
        contexto_repo: repositoryUrl,
      });

      // Obtener hallazgos y eventos guardados para el PDF
      const hallazgosGuardados = await prisma.finding.findMany({
        where: { analysisId },
      });
      const eventosGuardados = await prisma.forensicEvent.findMany({
        where: { analysisId },
        orderBy: { timestamp: 'asc' },
      });

      // Generar PDF del reporte
      logger.info('Generando PDF del reporte');
      const pdfBuffer = await pdfService.generarPDF({
        analysisId,
        repositoryUrl,
        riskScore: sintesisOutput.puntuacion_riesgo,
        executiveSummary: sintesisOutput.resumen_ejecutivo,
        findingsCount: sintesisOutput.cantidad_hallazgos,
        severityBreakdown: sintesisOutput.desglose_severidad as Record<string, number>,
        compromisedFunctions: sintesisOutput.funciones_comprometidas,
        affectedAuthors: sintesisOutput.autores_afectados,
        remediationSteps: sintesisOutput.prioridad_remediacion,
        generalRecommendation: sintesisOutput.recomendacion_general,
        findings: hallazgosGuardados.map((h) => ({
          file: h.file,
          function: h.function,
          lineRange: h.lineRange,
          severity: h.severity,
          riskType: h.riskType,
          confidence: h.confidence,
          whySuspicious: h.whySuspicious,
          remediationSteps: h.remediationSteps,
        })),
        forensicEvents: eventosGuardados.map((e) => ({
          author: e.author,
          commitHash: e.commitHash,
          commitMessage: e.commitMessage,
          file: e.file,
          action: e.action,
          riskLevel: e.riskLevel,
          timestamp: e.timestamp,
        })),
      });

      // Guardar reporte en BD (con PDF incluido)
      await prisma.report.create({
        data: {
          analysisId,
          executiveSummary: sintesisOutput.resumen_ejecutivo,
          riskScore: sintesisOutput.puntuacion_riesgo,
          findingsCount: sintesisOutput.cantidad_hallazgos,
          severityBreakdown: sintesisOutput.desglose_severidad,
          compromisedFunctions: sintesisOutput.funciones_comprometidas,
          affectedAuthors: sintesisOutput.autores_afectados,
          remediationSteps: sintesisOutput.prioridad_remediacion as any,
          generalRecommendation: sintesisOutput.recomendacion_general,
          pdfContent: pdfBuffer,
        },
      });

      // ── PASO 6: Marcar como COMPLETADO ──────────────────────────────────
      await prisma.analysis.update({
        where: { id: analysisId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          completedAt: new Date(),
        },
      });

      const tiempoTotal = Math.round((Date.now() - tiempoInicio) / 1000);
      auditLog(AuditEventType.ANALYSIS_COMPLETED, 'Análisis completado', {
        analysisId,
        tiempoSegundos: tiempoTotal,
        puntuacionRiesgo: sintesisOutput.puntuacion_riesgo,
      });

      logger.info(`✅ Análisis ${analysisId} completado en ${tiempoTotal}s`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);

      await prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'FAILED' },
      }).catch(() => {}); // Ignorar si falla la actualización

      auditLog(AuditEventType.ANALYSIS_FAILED, 'Análisis fallido', {
        analysisId,
        error: msg,
      });

      throw error;
    }
  }

  // ── Mappers de enums ───────────────────────────────────────────────────

  private mapearSeveridad(s: string): any {
    const mapa: Record<string, string> = {
      BAJO: 'BAJO',
      MEDIO: 'MEDIO',
      ALTO: 'ALTO',
      CRÍTICO: 'CRÍTICO',
      LOW: 'BAJO',
      MEDIUM: 'MEDIO',
      HIGH: 'ALTO',
      CRITICAL: 'CRÍTICO',
    };
    return mapa[s] || 'MEDIO';
  }

  private mapearTipoRiesgo(t: string): any {
    const mapa: Record<string, string> = {
      PUERTA_TRASERA: 'BACKDOOR',
      INYECCION: 'INJECTION',
      BOMBA_LOGICA: 'LOGIC_BOMB',
      OFUSCACION: 'OBFUSCATION',
      SOSPECHOSO: 'SUSPICIOUS',
      MANEJO_ERROR_ANORMAL: 'ERROR_HANDLING',
      VALORES_HARDCODEADOS: 'HARDCODED_VALUES',
    };
    return mapa[t] || 'SUSPICIOUS';
  }

  private mapearAccion(a: string): any {
    const mapa: Record<string, string> = {
      AGREGADO: 'ADDED',
      MODIFICADO: 'MODIFIED',
      ELIMINADO: 'DELETED',
    };
    return mapa[a] || 'MODIFIED';
  }
}

/**
 * Singleton exportado — usado por las rutas para encolar análisis
 */
export const queueService = new QueueService();
