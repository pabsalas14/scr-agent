/**
 * ============================================================================
 * REPORT GENERATOR SERVICE - Generación de reportes
 * ============================================================================
 *
 * Genera reportes en múltiples formatos:
 * - JSON (para API)
 * - CSV (para análisis en Excel)
 * - Summaries (para ejecuivos)
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Requerido para que TypeScript reconozca autotable en jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ReportData {
  type: 'executive' | 'technical' | 'remediation';
  format: 'json' | 'csv';
  title: string;
  generatedAt: Date;
  data: any;
}

export interface ExecutiveReport {
  title: string;
  summary: string;
  keyFindings: Array<{
    issue: string;
    severity: string;
    impact: string;
  }>;
  riskScore: number;
  recommendations: string[];
  timeline: {
    startDate: Date;
    endDate: Date;
    findingsCount: number;
  };
}

/**
 * Generar reporte ejecutivo de un análisis
 */
export async function generateExecutiveReport(analysisId: string) {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        project: { select: { name: true, repositoryUrl: true } },
        findings: {
          select: {
            id: true,
            severity: true,
            riskType: true,
            whySuspicious: true,
          },
          take: 5,
        },
      },
    });

    if (!analysis) {
      return null;
    }

    // Calcular estadísticas
    const allFindings = await prisma.finding.findMany({
      where: { analysisId },
      select: { severity: true, riskLevel: true },
    });

    const severityCounts = {
      CRITICAL: allFindings.filter(f => f.severity === 'CRITICAL').length,
      HIGH: allFindings.filter(f => f.severity === 'HIGH').length,
      MEDIUM: allFindings.filter(f => f.severity === 'MEDIUM').length,
      LOW: allFindings.filter(f => f.severity === 'LOW').length,
    };

    // Calcular risk score
    const riskScore =
      severityCounts.CRITICAL * 100 +
      severityCounts.HIGH * 75 +
      severityCounts.MEDIUM * 50 +
      severityCounts.LOW * 25;
    const normalizedRisk = Math.min(100, Math.round(riskScore / (allFindings.length * 100) * 100));

    return {
      type: 'executive' as const,
      title: `Security Analysis Report - ${analysis.project?.name}`,
      summary: `Analysis of ${analysis.project?.name} completed with ${allFindings.length} security findings.`,
      keyFindings: analysis.findings.map(f => ({
        issue: f.riskType,
        severity: f.severity || 'UNKNOWN',
        impact: f.whySuspicious || 'Suspicious activity detected',
      })),
      statistics: {
        totalFindings: allFindings.length,
        byType: severityCounts,
        riskScore: normalizedRisk,
      },
      recommendations: [
        `Address ${severityCounts.CRITICAL} CRITICAL findings immediately`,
        `Review and remediate ${severityCounts.HIGH} HIGH severity issues`,
        'Implement security scanning in CI/CD pipeline',
        'Enable real-time monitoring for suspicious commits',
      ],
      timeline: {
        startDate: analysis.createdAt,
        endDate: new Date(),
        findingsCount: allFindings.length,
      },
    };
  } catch (error) {
    logger.error(`Error generating executive report: ${error}`);
    return null;
  }
}

/**
 * Generar reporte técnico con detalles completos
 */
export async function generateTechnicalReport(analysisId: string) {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        project: { select: { name: true, repositoryUrl: true } },
        findings: {
          include: {
            forensicEvents: { take: 3 },
          },
          take: 100,
        },
      },
    });

    if (!analysis) {
      return null;
    }

    // Agrupar hallazgos por tipo
    const findingsByType = new Map<string, any[]>();

    for (const finding of analysis.findings) {
      if (!findingsByType.has(finding.riskType || 'UNKNOWN')) {
        findingsByType.set(finding.riskType || 'UNKNOWN', []);
      }
      findingsByType.get(finding.riskType || 'UNKNOWN')!.push(finding);
    }

    return {
      type: 'technical' as const,
      title: `Technical Security Analysis - ${analysis.project?.name}`,
      analysisId,
      projectUrl: analysis.project?.repositoryUrl,
      analysisDetails: {
        createdAt: analysis.createdAt,
        completedAt: analysis.completedAt,
        status: analysis.status,
      },
      findings: Array.from(findingsByType.entries()).map(([type, findings]) => ({
        type,
        count: findings.length,
        details: findings.map(f => ({
          id: f.id,
          file: f.file,
          severity: f.severity,
          riskLevel: f.riskLevel,
          description: f.whySuspicious,
          evidence: f.forensicEvents?.length || 0,
        })),
      })),
      summary: {
        totalFindings: analysis.findings.length,
        filesAffected: new Set(analysis.findings.map(f => f.file)).size,
        typesDetected: findingsByType.size,
      },
    };
  } catch (error) {
    logger.error(`Error generating technical report: ${error}`);
    return null;
  }
}

/**
 * Generar reporte de remediación
 */
export async function generateRemediationReport(analysisId: string) {
  try {
    const remediation = await prisma.remediationAction.findMany({
      where: {
        finding: {
          analysisId,
        },
      },
      include: {
        finding: { select: { id: true, severity: true, riskType: true } },
        assignee: { select: { id: true, name: true, email: true } },
        comments: { select: { createdAt: true, content: true } },
      },
    });

    // Calcular estadísticas
    const byStatus = new Map<string, number>();
    const overdue: any[] = [];
    const now = new Date();

    for (const rem of remediation) {
      const status = rem.status || 'UNKNOWN';
      byStatus.set(status, (byStatus.get(status) || 0) + 1);

      if (rem.dueDate && rem.dueDate < now && !['COMPLETED', 'VERIFIED'].includes(rem.status || '')) {
        overdue.push({
          id: rem.id,
          dueDate: rem.dueDate,
          assignee: rem.assignee?.name || 'Unassigned',
          severity: rem.finding?.severity,
        });
      }
    }

    // Calcular tiempo promedio de remediación
    const completedRemediations = remediation.filter(r => r.completedAt);
    let avgDays = 0;
    if (completedRemediations.length > 0) {
      const totalDays = completedRemediations.reduce((sum, r) => {
        const days = Math.floor(
          (r.completedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgDays = Math.round(totalDays / completedRemediations.length);
    }

    return {
      type: 'remediation' as const,
      title: `Remediation Progress Report - Analysis ${analysisId}`,
      stats: {
        total: remediation.length,
        byStatus: Object.fromEntries(byStatus),
        overdue: overdue.length,
        completed: byStatus.get('COMPLETED') || 0,
        avgDaysToCompletion: avgDays,
      },
      overdue,
      topAssignees: getMostBusyAssignees(remediation),
      timeline: {
        startDate: remediation[0]?.createdAt || new Date(),
        endDate: new Date(),
      },
    };
  } catch (error) {
    logger.error(`Error generating remediation report: ${error}`);
    return null;
  }
}

/**
 * Generar reporte PDF profesional
 */
export async function generatePDFReport(analysisId: string): Promise<Buffer | null> {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        project: true,
        findings: {
          orderBy: { severity: 'desc' }
        },
        report: true
      }
    });

    if (!analysis) {
      logger.warn(`[PDF] Analysis not found: ${analysisId}`);
      return null;
    }

    const doc = new jsPDF();
    const findings = analysis.findings || [];
    const project = analysis.project;
    const report = analysis.report;

    logger.info(`[PDF] Generating PDF with ${findings.length} findings, report: ${report ? 'exists' : 'missing'}`);

    // --- Header Estilizado ---
    doc.setFillColor(30, 30, 32); // Fondo oscuro #1E1E20
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(249, 115, 22); // Color Naranja #F97316
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('SCR-AGENT', 20, 25);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('SECURITY ANALYSIS REPORT', 20, 32);
    doc.text(new Date().toLocaleDateString(), 170, 32);

    // --- Información General ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Ejecutivo', 20, 60);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const introText = [
      `Proyecto: ${project.name}`,
      `Repositorio: ${project.repositoryUrl}`,
      `Fecha de Análisis: ${analysis.createdAt.toLocaleString()}`,
      `Estado: ${analysis.status}`,
      `ID Análisis: ${analysis.id.substring(0, 12)}...`
    ];
    doc.text(introText, 20, 75);

    // --- Score de Riesgo ---
    const riskScore = report?.riskScore ?? 0;
    const scoreColor = riskScore > 70 ? [239, 68, 68] : riskScore > 40 ? [249, 115, 22] : [34, 197, 94];
    
    doc.setDrawColor(200, 200, 200);
    doc.rect(140, 55, 50, 40);
    doc.setFontSize(10);
    doc.text('Risk Score', 155, 65);
    doc.setFontSize(24);
    doc.setTextColor(scoreColor[0]!, scoreColor[1]!, scoreColor[2]!);
    doc.text(`${riskScore}/100`, 150, 85);
    doc.setTextColor(0, 0, 0);

    // --- Resumen de Severidad ---
    const counts = {
      CRITICAL: findings.filter(f => f.severity === 'CRITICAL').length,
      HIGH: findings.filter(f => f.severity === 'HIGH').length,
      MEDIUM: findings.filter(f => f.severity === 'MEDIUM').length,
      LOW: findings.filter(f => f.severity === 'LOW').length,
    };

    doc.autoTable({
      startY: 110,
      head: [['Severidad', 'Cantidad']],
      body: [
        ['CRITICAL', counts.CRITICAL.toString()],
        ['HIGH', counts.HIGH.toString()],
        ['MEDIUM', counts.MEDIUM.toString()],
        ['LOW', counts.LOW.toString()],
      ],
      headStyles: { fillColor: [249, 115, 22] },
      margin: { left: 20, right: 20 },
    });

    // --- Tabla de Hallazgos ---
    if (findings.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalle de Hallazgos', 20, (doc as any).lastAutoTable.finalY + 20);

      const findingsBody = findings.map(f => [
        f.severity || 'UNKNOWN',
        f.riskType || 'UNKNOWN',
        (f.file || 'N/A').split('/').pop() || (f.file || 'N/A'),
        f.whySuspicious ? f.whySuspicious.substring(0, 100) + (f.whySuspicious.length > 100 ? '...' : '') : 'N/A'
      ]);

      doc.autoTable({
        startY: (doc as any).lastAutoTable.finalY + 30,
        head: [['Severidad', 'Tipo', 'Archivo', 'Descripción']],
        body: findingsBody,
        headStyles: { fillColor: [40, 40, 40] },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 40 },
          3: { cellWidth: 'auto' }
        },
        margin: { left: 20, right: 20 },
      });
    } else {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('No hay hallazgos en este análisis', 20, (doc as any).lastAutoTable.finalY + 30);
    }

    // --- Pie de página ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generado por SCR-Agent - Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
    }

    const buffer = Buffer.from(doc.output('arraybuffer'));
    logger.info(`[PDF] PDF generated successfully (${buffer.length} bytes)`);
    return buffer;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`[PDF] Error generating PDF: ${errorMsg}`, { error });
    return null;
  }
}

/**
 * Generar reporte en formato CSV
 */
export async function generateCSVReport(analysisId: string): Promise<string> {
  try {
    const findings = await prisma.finding.findMany({
      where: { analysisId },
      include: {
        analysis: { select: { project: { select: { name: true } } } },
      },
    });

    if (findings.length === 0) {
      return 'No findings to export';
    }

    // Headers
    const headers = ['Finding ID', 'Type', 'Severity', 'Risk Level', 'File', 'Status', 'Created At'];
    const rows = findings.map(f => [
      f.id,
      f.riskType || 'UNKNOWN',
      f.severity || 'UNKNOWN',
      f.riskLevel || 'UNKNOWN',
      f.file || 'unknown',
      f.status || 'OPEN',
      f.createdAt.toISOString(),
    ]);

    // Format CSV
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  } catch (error) {
    logger.error(`Error generating CSV report: ${error}`);
    return '';
  }
}

/**
 * Obtener URL de reporte descargable
 */
export async function getReportUrl(
  analysisId: string,
  type: 'executive' | 'technical' | 'remediation',
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  // En una implementación real, esto guardaría el reporte en storage
  // y devolvería una URL pre-firmada para descarga
  const timestamp = Date.now();
  const filename = `${analysisId}-${type}-${timestamp}.${format === 'csv' ? 'csv' : 'json'}`;

  logger.info(`Generated report: ${filename}`);

  return `/api/v1/reports/download/${filename}`;
}

// ============================================================================
// HELPERS
// ============================================================================

function getMostBusyAssignees(remediations: any[]): Array<{ name: string; count: number }> {
  const assigneeMap = new Map<string, number>();

  for (const rem of remediations) {
    if (rem.assignee?.name) {
      assigneeMap.set(rem.assignee.name, (assigneeMap.get(rem.assignee.name) || 0) + 1);
    }
  }

  return Array.from(assigneeMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
