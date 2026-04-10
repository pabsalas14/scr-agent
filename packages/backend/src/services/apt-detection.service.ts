/**
 * ============================================================================
 * APT DETECTION SERVICE - Detección de Advanced Persistent Threats
 * ============================================================================
 *
 * Analiza patrones sofisticados para identificar:
 * - Acceso persistente a repositorios específicos
 * - Actividad "low and slow" (evita detección)
 * - Patrones de movimiento lateral
 * - Acceso a múltiples sistemas/repositorios
 * - Modificaciones selectivas de archivos críticos
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';

export interface APTIndicator {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0-100
  description: string;
  evidence: string[];
  detectedAt: Date;
}

export interface APTThreat {
  threatId: string;
  userId: string;
  userEmail: string;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0-100
  indicators: APTIndicator[];
  affectedRepos: string[];
  affectedUsers: string[];
  timeRange: {
    start: Date;
    end: Date;
    durationDays: number;
  };
  lastActivityDate: Date;
  analysis: string;
}

/**
 * Detectar amenazas APT para un usuario
 */
export async function detectAPTThreat(userId: string): Promise<APTThreat | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user?.email) {
      return null;
    }

    // Obtener toda la actividad del usuario
    const events = await prisma.forensicEvent.findMany({
      where: { author: user.email },
      include: {
        analysis: {
          select: {
            id: true,
            project: { select: { id: true, name: true } },
          },
        },
        finding: { select: { severity: true, file: true } },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (events.length < 3) {
      return null; // Requiere actividad mínima
    }

    const indicators: APTIndicator[] = [];

    // Indicador 1: Persistencia de acceso a repositorio específico
    const repoPersistence = detectRepositoryPersistence(events);
    if (repoPersistence) {
      indicators.push(repoPersistence);
    }

    // Indicador 2: Actividad "low and slow"
    const lowAndSlow = detectLowAndSlowActivity(events);
    if (lowAndSlow) {
      indicators.push(lowAndSlow);
    }

    // Indicador 3: Acceso a archivos críticos
    const criticalFileAccess = detectCriticalFileAccess(events);
    if (criticalFileAccess) {
      indicators.push(criticalFileAccess);
    }

    // Indicador 4: Movimiento lateral (múltiples repos)
    const lateralMovement = detectLateralMovement(events);
    if (lateralMovement) {
      indicators.push(lateralMovement);
    }

    // Indicador 5: Sincronización con otros usuarios
    const collusion = await detectUserSynchronization(user.email, events);
    if (collusion) {
      indicators.push(collusion);
    }

    if (indicators.length === 0) {
      return null; // Sin indicadores APT
    }

    // Calcular nivel de amenaza
    const confidenceScores = indicators.map(i => i.confidence);
    const averageConfidence = Math.round(
      confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
    );

    const threatLevel = calculateThreatLevel(averageConfidence);

    // Obtener repos afectados
    const affectedRepos = [
      ...new Set(
        events.map(e => e.analysis?.project.name).filter((r): r is string => !!r)
      ),
    ];

    // Obtener fecha de actividad
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const durationDays = Math.ceil(
      (lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      threatId: `apt-${user.id}-${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      threatLevel,
      confidence: averageConfidence,
      indicators,
      affectedRepos,
      affectedUsers: [user.email],
      timeRange: {
        start: firstEvent.timestamp,
        end: lastEvent.timestamp,
        durationDays: Math.max(1, durationDays),
      },
      lastActivityDate: lastEvent.timestamp,
      analysis: generateAPTAnalysis(indicators, affectedRepos, user),
    };
  } catch (error) {
    logger.error(`Error detectando APT threat: ${error}`);
    return null;
  }
}

/**
 * Detectar persistencia de acceso a repositorio específico
 */
function detectRepositoryPersistence(events: any[]): APTIndicator | null {
  // Agrupar por repo
  const repoMap = new Map<string, number>();
  events.forEach(e => {
    const repoName = e.analysis?.project.name;
    if (repoName) {
      repoMap.set(repoName, (repoMap.get(repoName) || 0) + 1);
    }
  });

  // Buscar repo con acceso muy concentrado
  for (const [repo, count] of repoMap.entries()) {
    const ratio = count / events.length;
    if (ratio > 0.6) {
      // 60%+ eventos en 1 repo
      return {
        type: 'REPOSITORY_PERSISTENCE',
        severity: 'HIGH',
        confidence: Math.min(100, Math.round(ratio * 100)),
        description: `Persistent access to single repository: ${ratio.toFixed(1)}% of activity`,
        evidence: [`${count} events in ${repo}`, `${(ratio * 100).toFixed(1)}% concentration`],
        detectedAt: new Date(),
      };
    }
  }

  return null;
}

/**
 * Detectar actividad "low and slow" para evadir detección
 */
function detectLowAndSlowActivity(events: any[]): APTIndicator | null {
  if (events.length < 5) return null;

  // Calcular intervalos entre eventos
  const intervals: number[] = [];
  for (let i = 1; i < events.length; i++) {
    const diff = events[i].timestamp.getTime() - events[i - 1].timestamp.getTime();
    intervals.push(diff / (1000 * 60 * 60)); // convertir a horas
  }

  const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const isLowFrequency = averageInterval > 24; // más de 1 evento por día

  // Detectar distribución en tiempo (evita picos)
  const hourMap = new Map<number, number>();
  events.forEach(e => {
    const hour = new Date(e.timestamp).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  const hourCounts = Array.from(hourMap.values());
  const maxInHour = Math.max(...hourCounts);
  const isDistributed = maxInHour < events.length * 0.3; // No más de 30% en 1 hora

  if (isLowFrequency && isDistributed) {
    return {
      type: 'LOW_AND_SLOW_ACTIVITY',
      severity: 'CRITICAL',
      confidence: 85,
      description: 'Activity pattern consistent with intentional evasion',
      evidence: [
        `Average interval: ${averageInterval.toFixed(1)} hours`,
        `Distributed across ${hourMap.size} different hours`,
        'Consistent low frequency suggests deliberate pace',
      ],
      detectedAt: new Date(),
    };
  }

  return null;
}

/**
 * Detectar acceso a archivos críticos
 */
function detectCriticalFileAccess(events: any[]): APTIndicator | null {
  const criticalPatterns = [
    /\.env/i,
    /config\.json/i,
    /secrets/i,
    /private_key/i,
    /password/i,
    /credentials/i,
    /\.ssh/i,
    /deployment/i,
    /ci\/cd/i,
    /github.*workflow/i,
  ];

  let criticalCount = 0;
  const criticalFiles: string[] = [];

  events.forEach(e => {
    const file = e.finding?.file || '';
    if (criticalPatterns.some(pattern => pattern.test(file))) {
      criticalCount++;
      if (!criticalFiles.includes(file)) {
        criticalFiles.push(file);
      }
    }
  });

  const criticalRatio = criticalCount / events.length;
  if (criticalRatio > 0.15) {
    // 15%+ eventos en archivos críticos
    return {
      type: 'CRITICAL_FILE_ACCESS',
      severity: 'CRITICAL',
      confidence: Math.min(100, Math.round(criticalRatio * 100 * 3)),
      description: `Suspicious access to ${criticalFiles.length} critical files`,
      evidence: criticalFiles.slice(0, 5),
      detectedAt: new Date(),
    };
  }

  return null;
}

/**
 * Detectar movimiento lateral (acceso a múltiples repos/sistemas)
 */
function detectLateralMovement(events: any[]): APTIndicator | null {
  const repos = new Set(events.map(e => e.analysis?.project.id).filter(r => !!r));

  // Si accede a 5+ repos diferentes
  if (repos.size >= 5) {
    return {
      type: 'LATERAL_MOVEMENT',
      severity: 'HIGH',
      confidence: Math.min(100, repos.size * 15),
      description: `Access to ${repos.size} different repositories`,
      evidence: [`${repos.size} distinct repositories accessed`, 'Pattern suggests reconnaissance'],
      detectedAt: new Date(),
    };
  }

  return null;
}

/**
 * Detectar sincronización con otros usuarios (posible colusión)
 */
async function detectUserSynchronization(email: string, userEvents: any[]): Promise<APTIndicator | null> {
  try {
    // Obtener eventos de otros usuarios en las mismas fechas/repos
    const userRepos = new Set(userEvents.map(e => e.analysis?.projectId).filter(r => !!r));

    if (userRepos.size === 0) return null;

    const otherUsers = await prisma.forensicEvent.findMany({
      where: {
        author: { not: email },
        analysis: { projectId: { in: Array.from(userRepos) } },
        timestamp: {
          gte: new Date(userEvents[0].timestamp.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 días antes
          lte: new Date(userEvents[userEvents.length - 1].timestamp.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 días después
        },
      },
      select: { author: true },
      distinct: ['author'],
    });

    if (otherUsers.length >= 2) {
      return {
        type: 'USER_SYNCHRONIZATION',
        severity: 'HIGH',
        confidence: Math.min(100, otherUsers.length * 20),
        description: `Activity synchronized with ${otherUsers.length} other users`,
        evidence: [`${otherUsers.length} other users active in same repos`, 'Temporal correlation detected'],
        detectedAt: new Date(),
      };
    }

    return null;
  } catch (error) {
    logger.error(`Error detectando user synchronization: ${error}`);
    return null;
  }
}

/**
 * Calcular nivel de amenaza basado en confianza
 */
function calculateThreatLevel(confidence: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (confidence < 30) return 'LOW';
  if (confidence < 60) return 'MEDIUM';
  if (confidence < 80) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Generar análisis descriptivo de amenaza APT
 */
function generateAPTAnalysis(indicators: APTIndicator[], repos: string[], user: any): string {
  const severeCases = indicators.filter(i => i.severity === 'CRITICAL').length;
  const highCases = indicators.filter(i => i.severity === 'HIGH').length;

  return `
Análisis APT detectó ${indicators.length} indicadores de amenaza persistente.
El usuario ${user.name} (${user.email}) muestra patrones consistentes con:

${severeCases > 0 ? `- ${severeCases} indicadores CRÍTICOS de amenaza` : ''}
${highCases > 0 ? `- ${highCases} indicadores ALTOS de riesgo` : ''}
- Acceso persistente a ${repos.length} repositorio(s): ${repos.join(', ')}

Recomendación: Investigación inmediata de credenciales y accesos concedidos.
  `.trim();
}

/**
 * Detectar amenazas APT en múltiples usuarios
 */
export async function detectMultipleAPTThreats(options?: {
  minConfidence?: number;
  threatLevel?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}): Promise<APTThreat[]> {
  try {
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    const threats: APTThreat[] = [];
    const minConfidence = options?.minConfidence || 60;

    for (const user of users) {
      const threat = await detectAPTThreat(user.id);
      if (
        threat &&
        threat.confidence >= minConfidence &&
        (!options?.threatLevel || threat.threatLevel === options.threatLevel)
      ) {
        threats.push(threat);
      }
    }

    return threats.sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    logger.error(`Error detectando múltiples APT threats: ${error}`);
    return [];
  }
}
