import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'jspdf-autotable';

export interface DashboardExportData {
  severityData: Array<{ name: string; value: number; color: string }>;
  statusData: Array<{ name: string; value: number }>;
  timelineData: Array<{ date: string; hallazgos: number }>;
  stats: {
    totalFindings: number;
    resolvedFindings: number;
    avgTimeToResolve: number;
    riskScore: number;
  };
}

export interface ReportExportData {
  projectName: string;
  analysisDate: string;
  riskScore: number;
  totalFindings: number;
  criticalFindings: number;
  findings: Array<{
    severity: string;
    type: string;
    file: string;
    line: number;
    description: string;
  }>;
  recommendations: string[];
}

/**
 * Export dashboard analytics to PDF
 */
export async function exportDashboardToPDF(data: DashboardExportData): Promise<void> {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 15;

    // Header
    pdf.setFontSize(20);
    pdf.text('Dashboard de Análisis - Reporte', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 12;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    const timestamp = new Date().toLocaleString('es-ES');
    pdf.text(`Generado: ${timestamp}`, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 15;

    // Summary Stats Section
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Resumen Ejecutivo', 15, yPosition);
    yPosition += 8;

    // Stats boxes
    const statBoxWidth = (pageWidth - 30) / 4;
    const statBoxHeight = 20;
    const stats = [
      { label: 'Score de Riesgo', value: data.stats.riskScore.toString() },
      { label: 'Total Hallazgos', value: data.stats.totalFindings.toString() },
      { label: 'Resueltos', value: data.stats.resolvedFindings.toString() },
      {
        label: 'Tasa Resolución',
        value: `${data.stats.totalFindings > 0 ? Math.round((data.stats.resolvedFindings / data.stats.totalFindings) * 100) : 0}%`,
      },
    ];

    stats.forEach((stat, index) => {
      const xPos = 15 + index * (statBoxWidth + 2);
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(xPos, yPosition, statBoxWidth, statBoxHeight);

      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(stat.label, xPos + 3, yPosition + 6);

      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(stat.value, xPos + statBoxWidth / 2, yPosition + 16, { align: 'center' });
    });

    yPosition += statBoxHeight + 12;

    // Severity Distribution Section
    pdf.setFontSize(12);
    pdf.text('Distribución por Severidad', 15, yPosition);
    yPosition += 8;

    const severityTable = [
      ['Severidad', 'Cantidad', 'Porcentaje'],
      ...data.severityData.map((item) => [
        item.name,
        item.value.toString(),
        data.stats.totalFindings > 0 ? `${Math.round((item.value / data.stats.totalFindings) * 100)}%` : '0%',
      ]),
    ];

    pdf.setFontSize(10);
    const severityStartY = yPosition;
    (pdf as any).autoTable({
      head: [severityTable[0]],
      body: severityTable.slice(1),
      startY: yPosition,
      margin: { left: 15, right: 15 },
      headStyles: {
        fillColor: [66, 133, 244],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 12;

    // Status Distribution Section
    if (yPosition + 40 > pageHeight - 10) {
      pdf.addPage();
      yPosition = 15;
    }

    pdf.setFontSize(12);
    pdf.text('Estado de Hallazgos', 15, yPosition);
    yPosition += 8;

    const statusTable = [
      ['Estado', 'Cantidad'],
      ...data.statusData.map((item) => [item.name, item.value.toString()]),
    ];

    pdf.setFontSize(10);
    (pdf as any).autoTable({
      head: [statusTable[0]],
      body: statusTable.slice(1),
      startY: yPosition,
      margin: { left: 15, right: 15 },
      headStyles: {
        fillColor: [66, 133, 244],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 12;

    // Timeline Section
    if (yPosition + 50 > pageHeight - 10) {
      pdf.addPage();
      yPosition = 15;
    }

    pdf.setFontSize(12);
    pdf.text('Tendencia (Últimos 7 días)', 15, yPosition);
    yPosition += 8;

    const timelineTable = [
      ['Fecha', 'Hallazgos'],
      ...data.timelineData.map((item) => [item.date, item.hallazgos.toString()]),
    ];

    pdf.setFontSize(10);
    (pdf as any).autoTable({
      head: [timelineTable[0]],
      body: timelineTable.slice(1),
      startY: yPosition,
      margin: { left: 15, right: 15 },
      headStyles: {
        fillColor: [66, 133, 244],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Footer
    const pageCount = (pdf as any).internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Download
    pdf.save(`dashboard-analisis-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exporting dashboard to PDF:', error);
    throw new Error('No se pudo exportar el PDF');
  }
}

/**
 * Export security report to PDF
 */
export async function exportReportToPDF(data: ReportExportData): Promise<void> {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 15;

    // Header
    pdf.setFontSize(20);
    pdf.text('Reporte de Seguridad', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 12;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Proyecto: ${data.projectName}`, 15, yPosition);

    yPosition += 6;
    pdf.text(`Fecha de Análisis: ${data.analysisDate}`, 15, yPosition);

    yPosition += 15;

    // Risk Score Section
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Score de Riesgo', 15, yPosition);

    yPosition += 8;
    pdf.setFontSize(28);
    const scoreColor = getRiskScoreColor(data.riskScore);
    pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    pdf.text(data.riskScore.toString(), 15, yPosition);

    yPosition += 15;

    // Summary Stats
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Resumen', 15, yPosition);

    yPosition += 8;
    pdf.setFontSize(10);
    const summaryStats = [
      `Total de Hallazgos: ${data.totalFindings}`,
      `Hallazgos Críticos: ${data.criticalFindings}`,
      `Hallazgos Altos: ${Math.max(0, data.totalFindings - data.criticalFindings) / 2}`,
    ];

    summaryStats.forEach((stat) => {
      pdf.text(stat, 15, yPosition);
      yPosition += 6;
    });

    yPosition += 6;

    // Findings Section
    if (yPosition + 40 > pageHeight - 10) {
      pdf.addPage();
      yPosition = 15;
    }

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Hallazgos Detallados', 15, yPosition);

    yPosition += 8;

    const findingsTable = [
      ['Severidad', 'Archivo', 'Línea', 'Descripción'],
      ...data.findings.slice(0, 20).map((f) => [f.severity, f.file, f.line.toString(), f.description.substring(0, 30)]),
    ];

    pdf.setFontSize(9);
    (pdf as any).autoTable({
      head: [findingsTable[0]],
      body: findingsTable.slice(1),
      startY: yPosition,
      margin: { left: 15, right: 15 },
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
      },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 12;

    // Recommendations Section
    if (yPosition + 30 > pageHeight - 10) {
      pdf.addPage();
      yPosition = 15;
    }

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Recomendaciones', 15, yPosition);

    yPosition += 8;
    pdf.setFontSize(10);

    data.recommendations.forEach((rec, index) => {
      const lines = pdf.splitTextToSize(rec, pageWidth - 30);
      pdf.text(`${index + 1}. ${lines.join(' ')}`, 20, yPosition);
      yPosition += 6;

      if (yPosition > pageHeight - 15) {
        pdf.addPage();
        yPosition = 15;
      }
    });

    // Footer
    const pageCount = (pdf as any).internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Download
    pdf.save(`reporte-seguridad-${data.projectName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exporting report to PDF:', error);
    throw new Error('No se pudo exportar el reporte');
  }
}

/**
 * Helper function to determine risk score color
 */
function getRiskScoreColor(score: number): [number, number, number] {
  if (score >= 85) return [220, 38, 38]; // Red - Critical
  if (score >= 70) return [234, 88, 12]; // Orange - High
  if (score >= 50) return [234, 179, 8]; // Yellow - Medium
  return [34, 197, 94]; // Green - Low
}

/**
 * Generate PDF from HTML element
 * Useful for exporting complex component layouts
 */
export async function exportHTMLToPDF(elementId: string, filename: string): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 10;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 5;

    // Add image, handling page breaks if needed
    pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 10;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 5;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 10;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting HTML to PDF:', error);
    throw new Error('No se pudo exportar el documento');
  }
}
