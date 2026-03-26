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

import { logger, auditLog, AuditEventType } from './logger.service';
import { gitService } from './git.service';
import { inspectorAgent } from '../agents/inspector.agent';
import { detectiveAgent } from '../agents/detective.agent';
import { fiscalAgent } from '../agents/fiscal.agent';
import { prisma } from './prisma.service';
import fs from 'fs';
import path from 'path';

/**
 * Trabajo en cola
 */
interface TrabajoAnalisis {
  analysisId: string;
  projectId: string;
  repositoryUrl: string;
  scope: 'REPOSITORY' | 'PULL_REQUEST' | 'ORGANIZATION';
  githubToken?: string;
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
   * IDs de análisis que han sido cancelados
   * Se usan para interrumpir la ejecución entre pasos
   */
  private cancelados = new Set<string>();

  /**
   * Cancelar un análisis pendiente o en ejecución
   * Si está en cola lo elimina; si está corriendo lo marcará para detener entre pasos
   */
  cancelar(analysisId: string): void {
    this.cancelados.add(analysisId);
    // Eliminar de la cola si todavía no empezó
    const idx = this.cola.findIndex((t) => t.analysisId === analysisId);
    if (idx !== -1) {
      this.cola.splice(idx, 1);
      logger.info(`Análisis ${analysisId} eliminado de la cola`);
    }
  }

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
   * Flujo: Inspector → Detective → Fiscal → Guardar en BD
   * Respeta el scope para determinar qué código analizar
   * Usa GitHub token si existe para repos privados
   */
  private async ejecutarAnalisis(trabajo: TrabajoAnalisis): Promise<void> {
    const { analysisId, repositoryUrl, scope, projectId, githubToken } = trabajo;
    const tiempoInicio = Date.now();

    logger.info(`Iniciando análisis: ${analysisId} (scope: ${scope})${githubToken ? ' [con GitHub token]' : ''}`);

    try {
      // ── PASO 1: Marcar como RUNNING ─────────────────────────────────────
      await prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'RUNNING', progress: 5, startedAt: new Date() },
      });

      // ── PASO 2: Obtener código fuente según SCOPE ────────────────────────────────────
      logger.info(`Clonando/actualizando repositorio (scope: ${scope})`);
      // Pasar GitHub token si existe (para repos privados)
      const localPath = await gitService.cloneOrPullRepository(repositoryUrl, githubToken);

      let codigoFuente: string;
      if (scope === 'PULL_REQUEST') {
        // Para PR: obtener solo los cambios del PR
        codigoFuente = await this.leerArchivosPR(repositoryUrl, localPath, trabajo.githubToken);
      } else if (scope === 'ORGANIZATION') {
        // Para ORGANIZATION: análisis resumido de repos clave
        codigoFuente = await this.leerArchivosOrganizacion(repositoryUrl, trabajo.githubToken);
      } else {
        // Para REPOSITORY: análisis completo del repo
        codigoFuente = await this.leerArchivosRepo(localPath);
      }

      // Verificar cancelación antes de continuar
      if (this.cancelados.has(analysisId)) {
        this.cancelados.delete(analysisId);
        return;
      }

      // ── PASO 3: Agente Inspector ─────────────────────────────────────────
      await prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'INSPECTOR_RUNNING', progress: 20 },
      });

      logger.info('Ejecutando Agente Inspector');
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

      auditLog(AuditEventType.INSPECTOR_EXECUTION, 'Inspector completado y guardado', {
        analysisId,
        hallazgos: maliciaOutput.cantidad_hallazgos,
      });

      // Verificar cancelación antes de continuar
      if (this.cancelados.has(analysisId)) {
        this.cancelados.delete(analysisId);
        return;
      }

      // ── PASO 4: Agente Detective ─────────────────────────────────────────
      await prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'DETECTIVE_RUNNING', progress: 50 },
      });

      const historialGit = await gitService.getCommitHistory(repositoryUrl, 50);

      logger.info('Ejecutando Agente Detective');
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

      // Verificar cancelación antes de continuar
      if (this.cancelados.has(analysisId)) {
        this.cancelados.delete(analysisId);
        return;
      }

      // ── PASO 5: Agente Fiscal ────────────────────────────────────────────
      await prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'FISCAL_RUNNING', progress: 80 },
      });

      logger.info('Ejecutando Agente Fiscal');
      const sintesisOutput = await fiscalAgent.generarReporte({
        hallazgos_malicia: maliciaOutput.hallazgos,
        linea_tiempo_forenses: forensesOutput.linea_tiempo,
        contexto_repo: repositoryUrl,
      });

      // Guardar reporte en BD
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

  /**
   * Leer archivos de código del repositorio
   * Filtra a extensiones relevantes y limita el tamaño
   */
  private async leerArchivosRepo(localPath: string): Promise<string> {
    const extensionesPermitidas = [
      '.ts', '.tsx', '.js', '.jsx',
      '.py', '.java', '.cs', '.go',
      '.rb', '.php', '.rs',
    ];

    const archivos: string[] = [];
    this.recorrerDirectorio(localPath, archivos, extensionesPermitidas);

    // Limitar a los primeros 50 archivos para no exceder contexto
    const archivosLimitados = archivos.slice(0, 50);
    const contenido: string[] = [];

    for (const archivo of archivosLimitados) {
      try {
        const relativo = archivo.replace(localPath, '').replace(/^\//, '');
        const texto = fs.readFileSync(archivo, 'utf-8');

        // Ignorar archivos muy grandes (> 100KB)
        if (texto.length > 100_000) continue;

        contenido.push(`\n// === ARCHIVO: ${relativo} ===\n${texto}`);
      } catch {
        // Ignorar archivos que no se pueden leer
      }
    }

    return contenido.join('\n');
  }

  /**
   * Leer archivos de un Pull Request específico
   * Obtiene solo los archivos modificados en el PR
   */
  private async leerArchivosPR(
    repositoryUrl: string,
    localPath: string,
    _githubToken?: string
  ): Promise<string> {
    // Extraer owner/repo/pr-number de la URL
    // Ej: https://github.com/owner/repo/pull/123
    const match = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (!match) {
      logger.warn(`No se pudo extraer PR number de URL: ${repositoryUrl}`);
      // Fallback: leer todo el repo
      return this.leerArchivosRepo(localPath);
    }

    const [, owner, repo, prNumber] = match;

    try {
      // En una implementación real, usarías la API de GitHub para obtener
      // los archivos modificados en el PR específico
      // Por ahora, simulamos leyendo solo los primeros 20 archivos (como si fueran cambios del PR)
      logger.info(`Analizando PR #${prNumber} de ${owner}/${repo}`);

      const extensionesPermitidas = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cs'];
      const archivos: string[] = [];
      this.recorrerDirectorio(localPath, archivos, extensionesPermitidas);

      // Limitar a primeros 20 para PR (menos código que para repo completo)
      const archivosLimitados = archivos.slice(0, 20);
      const contenido: string[] = [];

      contenido.push(`\n// === ANÁLISIS DE PULL REQUEST #${prNumber} ===\n`);

      for (const archivo of archivosLimitados) {
        try {
          const relativo = archivo.replace(localPath, '').replace(/^\//, '');
          const texto = fs.readFileSync(archivo, 'utf-8');
          if (texto.length > 100_000) continue;
          contenido.push(`\n// === ARCHIVO: ${relativo} ===\n${texto}`);
        } catch {
          // Ignorar errores
        }
      }

      return contenido.join('\n');
    } catch (error) {
      logger.error(`Error leyendo archivos del PR: ${error}`);
      return this.leerArchivosRepo(localPath);
    }
  }

  /**
   * Leer archivos de una Organización
   * Obtiene análisis resumido de repos principales de la org
   */
  private async leerArchivosOrganizacion(
    repositoryUrl: string,
    _githubToken?: string
  ): Promise<string> {
    // Extraer nombre de organización de la URL
    // Ej: https://github.com/owner  (sin /repo)
    const match = repositoryUrl.match(/github\.com\/([^\/]+)\/?$/);
    if (!match) {
      logger.warn(`No se pudo extraer organización de URL: ${repositoryUrl}`);
      return '';
    }

    const [, organization] = match;

    try {
      // En una implementación real, usarías GitHub API para obtener repos de la org
      // y analizar una muestra de cada uno
      // Por ahora, retornamos un contexto que describe el análisis de org
      logger.info(`Analizando organización: ${organization}`);

      const contenido = [
        `\n// === ANÁLISIS DE ORGANIZACIÓN: ${organization} ===`,
        `\n// En una implementación completa, este análisis incluiría:`,
        `// 1. Escaneo de repos principales de la organización`,
        `// 2. Detección de secretos en configuraciones compartidas`,
        `// 3. Análisis de patrones de código comunes`,
        `// 4. Políticas de seguridad a nivel organizacional`,
        `\n// Por ahora, usando análisis simulado para demostración`,
      ];

      return contenido.join('\n');
    } catch (error) {
      logger.error(`Error leyendo información de organización: ${error}`);
      return '';
    }
  }

  /**
   * Recorrer directorio recursivamente
   */
  private recorrerDirectorio(
    dir: string,
    archivos: string[],
    extensiones: string[],
    profundidad = 0
  ): void {
    // Máximo 5 niveles de profundidad para evitar repos muy grandes
    if (profundidad > 5) return;

    // Ignorar directorios de dependencias y build
    const ignorar = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];

    try {
      const entradas = fs.readdirSync(dir, { withFileTypes: true });

      for (const entrada of entradas) {
        if (ignorar.includes(entrada.name)) continue;

        const rutaCompleta = path.join(dir, entrada.name);

        if (entrada.isDirectory()) {
          this.recorrerDirectorio(rutaCompleta, archivos, extensiones, profundidad + 1);
        } else if (entrada.isFile()) {
          const ext = path.extname(entrada.name);
          if (extensiones.includes(ext)) {
            archivos.push(rutaCompleta);
          }
        }
      }
    } catch {
      // Ignorar errores de permisos
    }
  }

  // ── Mappers de enums ───────────────────────────────────────────────────

  private mapearSeveridad(s: string): any {
    const mapa: Record<string, string> = {
      BAJO: 'LOW',
      MEDIO: 'MEDIUM',
      ALTO: 'HIGH',
      CRÍTICO: 'CRITICAL',
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH',
      CRITICAL: 'CRITICAL',
    };
    return mapa[s] || 'MEDIUM';
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
