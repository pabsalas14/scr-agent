/**
 * ============================================================================
 * HEATMAP SERVICE - Visualización de densidad de riesgo
 * ============================================================================
 *
 * Genera datos para mapas de calor mostrando patrones de riesgo en:
 * - Tiempo (cuándo ocurren amenazas)
 * - Código (dónde en el repositorio)
 * - Autores (quién introduce riesgos)
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';

export interface HeatmapCell {
  x: string | number; // Timestamp o hora del día
  y: string | number; // Archivo, repositorio, usuario
  value: number; // Intensidad (0-100)
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  count: number; // Número de eventos
}

export interface TimeHeatmapData {
  title: string;
  data: HeatmapCell[];
  stats: {
    total: number;
    maxRisk: number;
    avgRisk: number;
  };
}

/**
 * Generar heatmap temporal (riesgo por fecha y hora del día)
 */
export async function getTemporalHeatmap(options?: {
  analysisId?: string;
  userId?: string;
  days?: number;
}) {
  try {
    const days = options?.days || 30;
    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where: any = {
      timestamp: { gte: daysAgo },
    };

    if (options?.analysisId) {
      where.analysisId = options.analysisId;
    }

    if (options?.userId) {
      where.forensicData = {
        path: ['author'],
        string_contains: options.userId,
      };
    }

    // Obtener eventos agrupados por fecha y hora
    const events = await prisma.forensicEvent.findMany({
      where,
      select: {
        timestamp: true,
        riskLevel: true,
        severity: true,
      },
    });

    // Construir matriz temporal
    const heatmapMap = new Map<string, Map<number, { value: number; count: number; severity: string }>>();

    for (const event of events) {
      const date = new Date(event.timestamp);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const hour = date.getHours(); // 0-23

      if (!heatmapMap.has(dateKey)) {
        heatmapMap.set(dateKey, new Map());
      }

      const hourMap = heatmapMap.get(dateKey)!;
      const risk = riskLevelToScore(event.riskLevel);

      if (!hourMap.has(hour)) {
        hourMap.set(hour, { value: 0, count: 0, severity: event.severity || 'LOW' });
      }

      const cell = hourMap.get(hour)!;
      cell.value += risk;
      cell.count++;
      if (severityScore(event.severity) > severityScore(cell.severity)) {
        cell.severity = event.severity || 'LOW';
      }
    }

    // Convertir a formato de heatmap
    const data: HeatmapCell[] = [];
    let totalRisk = 0;
    let maxRisk = 0;

    heatmapMap.forEach((hourMap, dateKey) => {
      hourMap.forEach((cell, hour) => {
        const avgValue = Math.round(cell.value / cell.count);
        data.push({
          x: dateKey,
          y: `${hour}:00`,
          value: avgValue,
          severity: cell.severity as any,
          count: cell.count,
        });
        totalRisk += avgValue;
        maxRisk = Math.max(maxRisk, avgValue);
      });
    });

    return {
      title: `Temporal Risk Heatmap (Last ${days} days)`,
      data,
      stats: {
        total: events.length,
        maxRisk,
        avgRisk: data.length > 0 ? Math.round(totalRisk / data.length) : 0,
      },
    };
  } catch (error) {
    logger.error(`Error generating temporal heatmap: ${error}`);
    return { title: 'Temporal Risk Heatmap', data: [], stats: { total: 0, maxRisk: 0, avgRisk: 0 } };
  }
}

/**
 * Generar heatmap de archivos (riesgo por archivo)
 */
export async function getFileHeatmap(options?: {
  analysisId?: string;
  limit?: number;
}) {
  try {
    const limit = Math.min(options?.limit || 20, 100);

    const where: any = {};
    if (options?.analysisId) {
      where.analysisId = options.analysisId;
    }

    // Agrupar eventos por archivo
    const fileRisks = await prisma.forensicEvent.groupBy({
      by: ['file'],
      where,
      _count: { id: true },
      _max: { riskLevel: true },
      _avg: { severity: true },
    });

    const data: HeatmapCell[] = [];
    let totalRisk = 0;

    for (const fileRisk of fileRisks.slice(0, limit)) {
      if (!fileRisk.file) continue;

      const score = riskLevelToScore(fileRisk._max?.riskLevel || 'LOW') || 0;
      data.push({
        x: fileRisk.file,
        y: 'Risk Score',
        value: score,
        severity: fileRisk._max?.riskLevel as any,
        count: fileRisk._count.id,
      });
      totalRisk += score;
    }

    // Ordenar por valor descendente
    data.sort((a, b) => b.value - a.value);

    return {
      title: `File Risk Heatmap (Top ${Math.min(limit, data.length)})`,
      data,
      stats: {
        total: data.length,
        maxRisk: Math.max(...data.map(d => d.value), 0),
        avgRisk: data.length > 0 ? Math.round(totalRisk / data.length) : 0,
      },
    };
  } catch (error) {
    logger.error(`Error generating file heatmap: ${error}`);
    return { title: 'File Risk Heatmap', data: [], stats: { total: 0, maxRisk: 0, avgRisk: 0 } };
  }
}

/**
 * Generar heatmap de autores (riesgo por usuario)
 */
export async function getAuthorHeatmap(options?: {
  analysisId?: string;
  limit?: number;
}) {
  try {
    const limit = Math.min(options?.limit || 20, 100);

    const where: any = {};
    if (options?.analysisId) {
      where.analysisId = options.analysisId;
    }

    // Agrupar eventos por autor
    const authorRisks = await prisma.forensicEvent.groupBy({
      by: ['author'],
      where,
      _count: { id: true },
      _max: { riskLevel: true },
    });

    const data: HeatmapCell[] = [];
    let totalRisk = 0;

    for (const authorRisk of authorRisks.slice(0, limit)) {
      if (!authorRisk.author) continue;

      const score = riskLevelToScore(authorRisk._max?.riskLevel || 'LOW') || 0;
      data.push({
        x: authorRisk.author,
        y: 'Risk Score',
        value: score,
        severity: authorRisk._max?.riskLevel as any,
        count: authorRisk._count.id,
      });
      totalRisk += score;
    }

    // Ordenar por valor descendente
    data.sort((a, b) => b.value - a.value);

    return {
      title: `Author Risk Heatmap (Top ${Math.min(limit, data.length)})`,
      data,
      stats: {
        total: data.length,
        maxRisk: Math.max(...data.map(d => d.value), 0),
        avgRisk: data.length > 0 ? Math.round(totalRisk / data.length) : 0,
      },
    };
  } catch (error) {
    logger.error(`Error generating author heatmap: ${error}`);
    return { title: 'Author Risk Heatmap', data: [], stats: { total: 0, maxRisk: 0, avgRisk: 0 } };
  }
}

/**
 * Generar risk map (matriz de riesgo: severidad vs frequency)
 */
export async function getRiskMap(analysisId?: string) {
  try {
    const where = analysisId ? { analysisId } : {};

    // Obtener datos por severidad
    const events = await prisma.forensicEvent.findMany({
      where,
      select: {
        severity: true,
        riskLevel: true,
        file: true,
      },
    });

    // Construir matriz de riesgo
    const riskMatrix = new Map<string, { critical: number; high: number; medium: number; low: number }>();

    for (const event of events) {
      const severity = event.severity || 'UNKNOWN';
      if (!riskMatrix.has(severity)) {
        riskMatrix.set(severity, { critical: 0, high: 0, medium: 0, low: 0 });
      }

      const row = riskMatrix.get(severity)!;
      if (event.riskLevel === 'CRITICAL') row.critical++;
      else if (event.riskLevel === 'HIGH') row.high++;
      else if (event.riskLevel === 'MEDIUM') row.medium++;
      else row.low++;
    }

    // Convertir a formato de tabla
    const data = Array.from(riskMatrix.entries()).map(([severity, counts]) => ({
      severity,
      ...counts,
      total: counts.critical + counts.high + counts.medium + counts.low,
    }));

    return {
      title: 'Risk Matrix (Severity vs Likelihood)',
      data,
      stats: {
        totalEvents: events.length,
        criticalEvents: events.filter(e => e.riskLevel === 'CRITICAL').length,
        highEvents: events.filter(e => e.riskLevel === 'HIGH').length,
      },
    };
  } catch (error) {
    logger.error(`Error generating risk map: ${error}`);
    return { title: 'Risk Matrix', data: [], stats: { totalEvents: 0, criticalEvents: 0, highEvents: 0 } };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function riskLevelToScore(level: string): number {
  const scores: Record<string, number> = {
    CRITICAL: 100,
    HIGH: 75,
    MEDIUM: 50,
    LOW: 25,
  };
  return scores[level] || 0;
}

function severityScore(severity?: string): number {
  const scores: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    UNKNOWN: 0,
  };
  return scores[severity || 'UNKNOWN'] || 0;
}
