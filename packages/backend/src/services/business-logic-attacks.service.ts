/**
 * ============================================================================
 * BUSINESS LOGIC ATTACKS SERVICE - Detección de ataques de lógica de negocio
 * ============================================================================
 *
 * Identifica patrones de código malicioso que abusan de lógica empresarial:
 * - Cambios no autorizados a permisos/roles
 * - Lógica deferred/scheduled (time bombs)
 * - Bypass de validaciones críticas
 * - Operaciones Git peligrosas (rebase, force push)
 * - Modificaciones a código de autenticación
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';

export interface BusinessLogicAnomaly {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0-100
  description: string;
  evidence: string[];
  detectionSignature: string;
  detectedAt: Date;
}

export interface BusinessLogicAttack {
  attackId: string;
  userId: string;
  userEmail: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  anomalies: BusinessLogicAnomaly[];
  affectedSystems: string[];
  potentialImpact: string;
  recommendations: string[];
  detectionTime: Date;
}

/**
 * Detectar ataques de lógica de negocio
 */
export async function detectBusinessLogicAttack(userId: string): Promise<BusinessLogicAttack | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user?.email) {
      return null;
    }

    // Obtener eventos forenses del usuario
    const events = await prisma.forensicEvent.findMany({
      where: { author: user.email },
      include: {
        finding: { select: { riskType: true, severity: true, whySuspicious: true } },
        analysis: { select: { project: { select: { name: true } } } },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (events.length === 0) {
      return null;
    }

    const anomalies: BusinessLogicAnomaly[] = [];

    // Detector 1: Cambios de permisos/roles
    const permissionAnomalies = detectPermissionChanges(events);
    anomalies.push(...permissionAnomalies);

    // Detector 2: Logic bombs (código con ejecución deferred)
    const timebombs = detectTimebombs(events);
    if (timebombs) {
      anomalies.push(timebombs);
    }

    // Detector 3: Validaciones bypassed
    const validationBypasses = detectValidationBypasses(events);
    if (validationBypasses) {
      anomalies.push(validationBypasses);
    }

    // Detector 4: Operaciones Git peligrosas
    const gitAnomalies = detectDangerousGitOperations(events);
    anomalies.push(...gitAnomalies);

    // Detector 5: Cambios de autenticación
    const authAnomalies = detectAuthenticationChanges(events);
    if (authAnomalies) {
      anomalies.push(authAnomalies);
    }

    if (anomalies.length === 0) {
      return null;
    }

    // Calcular nivel de riesgo
    const confidences = anomalies.map(a => a.confidence);
    const averageConfidence = Math.round(
      confidences.reduce((a, b) => a + b, 0) / confidences.length
    );

    const riskLevel = calculateRiskLevel(averageConfidence);

    // Obtener sistemas afectados
    const affectedSystems = [
      ...new Set(events.map(e => e.analysis?.project.name).filter((s): s is string => !!s)),
    ];

    return {
      attackId: `bla-${user.id}-${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      riskLevel,
      confidence: averageConfidence,
      anomalies,
      affectedSystems,
      potentialImpact: generateImpactAssessment(anomalies, affectedSystems),
      recommendations: generateRecommendations(anomalies),
      detectionTime: new Date(),
    };
  } catch (error) {
    logger.error(`Error detectando business logic attack: ${error}`);
    return null;
  }
}

/**
 * Detectar cambios no autorizados a permisos/roles
 */
function detectPermissionChanges(events: any[]): BusinessLogicAnomaly[] {
  const anomalies: BusinessLogicAnomaly[] = [];

  const permissionPatterns = [
    /permission|role|admin|grant|access|privilege/i,
    /ACL|capability|auth/i,
  ];

  const permissionEvents = events.filter(e =>
    permissionPatterns.some(pattern => pattern.test(e.finding?.whySuspicious || ''))
  );

  if (permissionEvents.length > 0) {
    // Concentración en cambios de permiso (>25% del total)
    const ratio = permissionEvents.length / events.length;
    if (ratio > 0.25) {
      anomalies.push({
        type: 'PERMISSION_CHANGES',
        severity: 'CRITICAL',
        confidence: Math.min(100, Math.round(ratio * 100 * 2)),
        description: `Suspicious permission/role modifications detected (${(ratio * 100).toFixed(1)}%)`,
        evidence: permissionEvents
          .slice(0, 3)
          .map(e => e.finding?.whySuspicious || 'Permission change'),
        detectionSignature: 'BLAG-001',
        detectedAt: new Date(),
      });
    }
  }

  return anomalies;
}

/**
 * Detectar logic bombs (código con ejecución deferred/scheduled)
 */
function detectTimebombs(events: any[]): BusinessLogicAnomaly | null {
  const timebombPatterns = [
    /setTimeout|setInterval|cron|schedule|delay|bomb|trigger/i,
    /process\.exit|kill|terminate|shutdown/i,
    /eval|exec|spawn.*dangerous/i,
  ];

  const timebombEvents = events.filter(e =>
    timebombPatterns.some(pattern => pattern.test(e.finding?.whySuspicious || ''))
  );

  if (timebombEvents.length > 0) {
    return {
      type: 'TIMEBOMB_DETECTED',
      severity: 'CRITICAL',
      confidence: 95,
      description: `Code with delayed/scheduled execution patterns detected (logic bomb)`,
      evidence: timebombEvents.slice(0, 3).map(e => e.finding?.whySuspicious || 'Timebomb pattern'),
      detectionSignature: 'BLAG-002',
      detectedAt: new Date(),
    };
  }

  return null;
}

/**
 * Detectar bypass de validaciones críticas
 */
function detectValidationBypasses(events: any[]): BusinessLogicAnomaly | null {
  const bypassPatterns = [
    /bypass|skip|ignore.*validation|check/i,
    /disable.*check|validation.*false|skip.*auth/i,
    /\/\/.*(disable|skip|bypass)/i,
  ];

  const bypassEvents = events.filter(e =>
    bypassPatterns.some(pattern => pattern.test(e.finding?.whySuspicious || ''))
  );

  if (bypassEvents.length > 0) {
    return {
      type: 'VALIDATION_BYPASS',
      severity: 'HIGH',
      confidence: 90,
      description: `Critical validation/security checks bypassed`,
      evidence: bypassEvents.slice(0, 3).map(e => e.finding?.whySuspicious || 'Validation bypass'),
      detectionSignature: 'BLAG-003',
      detectedAt: new Date(),
    };
  }

  return null;
}

/**
 * Detectar operaciones Git peligrosas
 */
function detectDangerousGitOperations(events: any[]): BusinessLogicAnomaly[] {
  const anomalies: BusinessLogicAnomaly[] = [];

  const gitPatterns = [
    /force.*push|--force|-f\s|rebase.*force/i,
    /git.*reset.*hard|git.*clean/i,
    /history.*rewrite|amend.*public/i,
  ];

  const gitEvents = events.filter(e => gitPatterns.some(pattern => pattern.test(e.finding?.whySuspicious || '')));

  if (gitEvents.length > 0) {
    anomalies.push({
      type: 'DANGEROUS_GIT_OPERATIONS',
      severity: 'HIGH',
      confidence: 85,
      description: `Force push, rebase, or history rewrite operations detected`,
      evidence: gitEvents.slice(0, 3).map(e => e.finding?.whySuspicious || 'Git operation'),
      detectionSignature: 'BLAG-004',
      detectedAt: new Date(),
    });
  }

  return anomalies;
}

/**
 * Detectar cambios sospechosos a código de autenticación
 */
function detectAuthenticationChanges(events: any[]): BusinessLogicAnomaly | null {
  const authPatterns = [
    /auth|password|token|jwt|oauth|ldap|session/i,
    /login|logout|2fa|mfa|otp/i,
    /credential|secret|key.*management/i,
  ];

  const authEvents = events.filter(e => authPatterns.some(pattern => pattern.test(e.finding?.whySuspicious || '')));

  // Si hay eventos de auth, 40%+ de confianza
  if (authEvents.length > 0) {
    const ratio = authEvents.length / events.length;
    if (ratio > 0.15) {
      return {
        type: 'AUTHENTICATION_CHANGES',
        severity: 'CRITICAL',
        confidence: Math.min(100, Math.round(ratio * 100)),
        description: `Suspicious modifications to authentication mechanisms`,
        evidence: authEvents.slice(0, 3).map(e => e.finding?.whySuspicious || 'Auth change'),
        detectionSignature: 'BLAG-005',
        detectedAt: new Date(),
      };
    }
  }

  return null;
}

/**
 * Calcular nivel de riesgo
 */
function calculateRiskLevel(confidence: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (confidence < 30) return 'LOW';
  if (confidence < 60) return 'MEDIUM';
  if (confidence < 80) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Generar evaluación de impacto
 */
function generateImpactAssessment(anomalies: BusinessLogicAnomaly[], systems: string[]): string {
  const criticalCount = anomalies.filter(a => a.severity === 'CRITICAL').length;
  const highCount = anomalies.filter(a => a.severity === 'HIGH').length;

  return `
Detección de ${anomalies.length} anomalías de lógica de negocio.

Impacto potencial:
- ${criticalCount > 0 ? `${criticalCount} vulnerabilidades CRÍTICAS` : 'Sin vulnerabilidades críticas'}
- ${highCount > 0 ? `${highCount} vulnerabilidades ALTAS` : 'Sin vulnerabilidades altas'}
- Sistemas afectados: ${systems.join(', ')}

Riesgo: Ejecución no autorizada de código malicioso, manipulación de datos,
escalación de privilegios, y/o corrupción de lógica empresarial.
  `.trim();
}

/**
 * Generar recomendaciones
 */
function generateRecommendations(anomalies: BusinessLogicAnomaly[]): string[] {
  const recommendations: string[] = [];

  const types = anomalies.map(a => a.type);

  if (types.includes('PERMISSION_CHANGES')) {
    recommendations.push('Revisar auditoría de cambios de permisos/roles en últimos 24 horas');
  }

  if (types.includes('TIMEBOMB_DETECTED')) {
    recommendations.push('Realizar análisis completo de código para identificar lógica deferred');
  }

  if (types.includes('VALIDATION_BYPASS')) {
    recommendations.push('Verificar que todas las validaciones de seguridad están habilitadas');
  }

  if (types.includes('DANGEROUS_GIT_OPERATIONS')) {
    recommendations.push('Revisar historial Git y verificar integridad de commits');
  }

  if (types.includes('AUTHENTICATION_CHANGES')) {
    recommendations.push('Auditar sistema de autenticación y tokens activos');
  }

  recommendations.push('Requerir code review completo antes de merges');
  recommendations.push('Considerar revocar acceso del usuario hasta investigación');

  return recommendations;
}

/**
 * Escanear ataques de lógica de negocio en múltiples usuarios
 */
export async function detectMultipleBusinessLogicAttacks(options?: {
  minConfidence?: number;
  riskLevel?: 'CRITICAL' | 'HIGH';
}): Promise<BusinessLogicAttack[]> {
  try {
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    const attacks: BusinessLogicAttack[] = [];
    const minConfidence = options?.minConfidence || 60;

    for (const user of users) {
      const attack = await detectBusinessLogicAttack(user.id);
      if (
        attack &&
        attack.confidence >= minConfidence &&
        (!options?.riskLevel || attack.riskLevel === options.riskLevel)
      ) {
        attacks.push(attack);
      }
    }

    return attacks.sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    logger.error(`Error detectando múltiples business logic attacks: ${error}`);
    return [];
  }
}
