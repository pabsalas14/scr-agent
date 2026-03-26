/**
 * ============================================================================
 * SERVICIO DE GENERACIÓN DE PDF
 * ============================================================================
 *
 * Genera reportes PDF a partir de los datos del análisis de seguridad.
 * Incluye: resumen ejecutivo, hallazgos, timeline forense y remediación.
 */

import PDFDocument from 'pdfkit';
import { logger } from './logger.service';

/**
 * Datos de entrada para generar el PDF
 */
export interface DatosReportePDF {
  analysisId: string;
  repositoryUrl: string;
  riskScore: number;
  executiveSummary: string;
  findingsCount: number;
  severityBreakdown: Record<string, number>;
  compromisedFunctions: string[];
  affectedAuthors: string[];
  remediationSteps: any[];
  generalRecommendation: string;
  findings: {
    file: string;
    function?: string | null;
    lineRange: string;
    severity: string;
    riskType: string;
    confidence: number;
    whySuspicious: string;
    remediationSteps: string[];
  }[];
  forensicEvents: {
    author: string;
    commitHash: string;
    commitMessage: string;
    file: string;
    action: string;
    riskLevel: string;
    timestamp: Date;
  }[];
}

// Paleta de colores del reporte
const COLORES = {
  rojo: '#dc2626',
  naranja: '#ea580c',
  amarillo: '#ca8a04',
  verde: '#16a34a',
  azul: '#2563eb',
  gris: '#6b7280',
  grisClaroFondo: '#f9fafb',
  grisBorde: '#e5e7eb',
  negro: '#111827',
  blanco: '#ffffff',
};

const SEVERIDAD_COLOR: Partial<Record<string, string>> = {
  CRITICAL: COLORES.rojo,
  HIGH: COLORES.naranja,
  MEDIUM: COLORES.amarillo,
  LOW: COLORES.verde,
};

const SEVERIDAD_LABEL: Partial<Record<string, string>> = {
  CRITICAL: 'CRÍTICO',
  HIGH: 'ALTO',
  MEDIUM: 'MEDIO',
  LOW: 'BAJO',
};

/**
 * Servicio para generar PDFs de reportes de seguridad
 */
export class PdfService {
  /**
   * Genera el PDF completo del reporte de análisis
   * Devuelve un Buffer con el contenido del PDF
   */
  async generarPDF(datos: DatosReportePDF): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 55, right: 55 },
          info: {
            Title: `Reporte SCR Agent - ${datos.analysisId}`,
            Author: 'SCR Agent',
            Subject: 'Análisis de Seguridad de Código',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.escribirPortada(doc, datos);
        this.escribirResumenEjecutivo(doc, datos);
        this.escribirHallazgos(doc, datos);
        this.escribirTimeline(doc, datos);
        this.escribirRemediacion(doc, datos);
        this.escribirPiesDePagina(doc);

        doc.end();
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error(`Error generando PDF: ${msg}`);
        reject(error);
      }
    });
  }

  // ── Secciones del documento ─────────────────────────────────────────────

  private escribirPortada(doc: PDFKit.PDFDocument, datos: DatosReportePDF) {
    const w = doc.page.width;

    // Fondo del header
    doc.rect(0, 0, w, 200).fill(COLORES.negro);

    // Título
    doc
      .fillColor(COLORES.blanco)
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('SCR AGENT', 55, 55);

    doc
      .fontSize(13)
      .font('Helvetica')
      .fillColor('#9ca3af')
      .text('Reporte de Análisis de Seguridad', 55, 92);

    // Puntuación de riesgo en la portada
    const color = this.colorRiesgo(datos.riskScore);
    doc.roundedRect(w - 145, 45, 100, 100, 8).fill(color);
    doc
      .fillColor(COLORES.blanco)
      .fontSize(36)
      .font('Helvetica-Bold')
      .text(String(datos.riskScore), w - 145, 65, { width: 100, align: 'center' });
    doc
      .fontSize(9)
      .font('Helvetica')
      .text('RIESGO / 100', w - 145, 108, { width: 100, align: 'center' });

    // Metadata
    doc.fillColor(COLORES.negro).font('Helvetica').fontSize(10);
    const y = 220;
    doc.text(`Repositorio: ${datos.repositoryUrl}`, 55, y);
    doc.text(`ID de Análisis: ${datos.analysisId}`, 55, y + 16);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}`, 55, y + 32);

    // Stats rápidos
    this.dibujarStats(doc, datos, y + 70);

    doc.addPage();
  }

  private dibujarStats(doc: PDFKit.PDFDocument, datos: DatosReportePDF, y: number) {
    const stats = [
      { label: 'Hallazgos', valor: datos.findingsCount, color: COLORES.rojo },
      { label: 'Funciones comprometidas', valor: datos.compromisedFunctions.length, color: COLORES.naranja },
      { label: 'Autores afectados', valor: datos.affectedAuthors.length, color: COLORES.azul },
      { label: 'Eventos forenses', valor: datos.forensicEvents.length, color: COLORES.gris },
    ];

    const w = doc.page.width - 110;
    const boxW = (w - 30) / 4;

    stats.forEach((s, i) => {
      const x = 55 + i * (boxW + 10);
      doc.roundedRect(x, y, boxW, 60, 6).strokeColor(COLORES.grisBorde).lineWidth(1).stroke();
      doc.fillColor(s.color).fontSize(22).font('Helvetica-Bold').text(String(s.valor), x, y + 8, { width: boxW, align: 'center' });
      doc.fillColor(COLORES.gris).fontSize(8).font('Helvetica').text(s.label, x, y + 36, { width: boxW, align: 'center' });
    });
  }

  private escribirResumenEjecutivo(doc: PDFKit.PDFDocument, datos: DatosReportePDF) {
    this.titulo(doc, 'RESUMEN EJECUTIVO');

    doc.fillColor(COLORES.negro).fontSize(10).font('Helvetica').text(datos.executiveSummary, { lineGap: 4 });
    doc.moveDown(1.5);

    // Desglose de severidad
    this.subtitulo(doc, 'Desglose por Severidad');

    const total = datos.findingsCount || 1;
    const severidades = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

    severidades.forEach((sev) => {
      const count = datos.severityBreakdown[sev] || 0;
      const pct = Math.round((count / total) * 100);
      const color: string = SEVERIDAD_COLOR[sev] ?? COLORES.gris;
      const label: string = SEVERIDAD_LABEL[sev] ?? sev;

      const barY = doc.y;
      doc.fillColor(color).fontSize(9).font('Helvetica-Bold').text(label, 55, barY, { width: 60 });
      doc.fillColor(COLORES.negro).fontSize(9).font('Helvetica').text(String(count), 120, barY, { width: 30, align: 'right' });

      // Barra de progreso
      const barX = 160;
      const barW = doc.page.width - barX - 55;
      doc.rect(barX, barY + 2, barW, 8).fill(COLORES.grisBorde);
      if (pct > 0) {
        doc.rect(barX, barY + 2, (barW * pct) / 100, 8).fill(color);
      }
      doc.moveDown(0.9);
    });

    // Recomendación general
    doc.moveDown(0.5);
    this.subtitulo(doc, 'Recomendación General');
    doc
      .roundedRect(55, doc.y, doc.page.width - 110, 50, 6)
      .fill(COLORES.grisClaroFondo);
    doc
      .fillColor(COLORES.negro)
      .fontSize(10)
      .font('Helvetica')
      .text(datos.generalRecommendation, 65, doc.y - 44, {
        width: doc.page.width - 130,
        lineGap: 3,
      });

    doc.moveDown(3);
    doc.addPage();
  }

  private escribirHallazgos(doc: PDFKit.PDFDocument, datos: DatosReportePDF) {
    this.titulo(doc, 'HALLAZGOS DE CÓDIGO MALICIOSO');

    if (datos.findings.length === 0) {
      doc.fillColor(COLORES.gris).fontSize(10).text('No se encontraron hallazgos.');
      doc.addPage();
      return;
    }

    datos.findings.forEach((h, i) => {
      // Verificar espacio en página
      if (doc.y > doc.page.height - 180) doc.addPage();

      const color: string = SEVERIDAD_COLOR[h.severity] ?? COLORES.gris;
      const severidadLabel: string = SEVERIDAD_LABEL[h.severity] ?? h.severity;

      // Encabezado del hallazgo
      const headerY = doc.y;
      doc.rect(55, headerY, doc.page.width - 110, 22).fill(color);
      doc
        .fillColor(COLORES.blanco)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(`${i + 1}. ${severidadLabel}  ·  ${h.riskType}`, 62, headerY + 6, {
          width: doc.page.width - 170,
        });
      doc
        .fillColor(COLORES.blanco)
        .fontSize(8)
        .font('Helvetica')
        .text(`Confianza: ${Math.round(h.confidence * 100)}%`, doc.page.width - 120, headerY + 7, {
          width: 60,
          align: 'right',
        });

      doc.moveDown(0.3);

      // Contenido
      const cuerpoY = doc.y;
      doc.rect(55, cuerpoY, doc.page.width - 110, 1).fill(COLORES.grisBorde);
      doc.moveDown(0.3);

      doc.fillColor(COLORES.gris).fontSize(8).font('Helvetica-Bold').text('ARCHIVO');
      doc.fillColor(COLORES.negro).fontSize(9).font('Courier').text(
        `${h.file}${h.function ? ` :: ${h.function}` : ''}  (líneas ${h.lineRange})`
      );
      doc.moveDown(0.4);

      doc.fillColor(COLORES.gris).fontSize(8).font('Helvetica-Bold').text('POR QUÉ ES SOSPECHOSO');
      doc.fillColor(COLORES.negro).fontSize(9).font('Helvetica').text(h.whySuspicious, { lineGap: 2 });
      doc.moveDown(0.4);

      if (h.remediationSteps.length > 0) {
        doc.fillColor(COLORES.gris).fontSize(8).font('Helvetica-Bold').text('PASOS DE REMEDIACIÓN');
        h.remediationSteps.forEach((paso, pi) => {
          doc.fillColor(COLORES.negro).fontSize(9).font('Helvetica').text(`${pi + 1}. ${paso}`, { lineGap: 2 });
        });
      }

      doc.moveDown(1.2);
    });

    doc.addPage();
  }

  private escribirTimeline(doc: PDFKit.PDFDocument, datos: DatosReportePDF) {
    this.titulo(doc, 'LÍNEA DE TIEMPO FORENSE');

    if (datos.forensicEvents.length === 0) {
      doc.fillColor(COLORES.gris).fontSize(10).text('No se registraron eventos forenses.');
      doc.addPage();
      return;
    }

    datos.forensicEvents.forEach((e) => {
      if (doc.y > doc.page.height - 120) doc.addPage();

      const color: string = SEVERIDAD_COLOR[e.riskLevel] ?? COLORES.gris;
      const fecha = new Date(e.timestamp).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'short', day: 'numeric',
      });

      // Línea de tiempo vertical
      const lineX = 70;
      const dotY = doc.y + 4;
      doc.circle(lineX, dotY, 5).fill(color);
      doc.rect(lineX - 0.5, dotY + 5, 1, 30).fill(COLORES.grisBorde);

      // Contenido del evento
      const textX = lineX + 14;
      const textW = doc.page.width - textX - 55;

      doc.fillColor(COLORES.negro).fontSize(9).font('Helvetica-Bold').text(
        `${fecha}  ·  ${e.author}`,
        textX, dotY - 2, { width: textW }
      );
      doc.fillColor(COLORES.gris).fontSize(8).font('Courier').text(
        `${e.commitHash.substring(0, 8)}  ${e.action}  ${e.file}`,
        textX, doc.y, { width: textW }
      );
      doc.fillColor(COLORES.negro).fontSize(9).font('Helvetica').text(
        e.commitMessage,
        textX, doc.y + 1, { width: textW, lineGap: 1 }
      );

      doc.moveDown(1.2);
    });

    doc.addPage();
  }

  private escribirRemediacion(doc: PDFKit.PDFDocument, datos: DatosReportePDF) {
    this.titulo(doc, 'PLAN DE REMEDIACIÓN');

    if (datos.remediationSteps.length === 0) {
      doc.fillColor(COLORES.gris).fontSize(10).text('No hay pasos de remediación definidos.');
      return;
    }

    datos.remediationSteps.forEach((paso, i) => {
      if (doc.y > doc.page.height - 120) doc.addPage();

      const orden = paso.orden || paso.order || i + 1;
      const accion = paso.accion || paso.action || '';
      const justificacion = paso.justificacion || paso.justification || '';
      const urgencia = paso.urgencia || paso.urgency || '';
      const color: string = SEVERIDAD_COLOR[urgencia] ?? COLORES.azul;

      // Número del paso
      doc.circle(70, doc.y + 8, 10).fill(color);
      doc.fillColor(COLORES.blanco).fontSize(10).font('Helvetica-Bold').text(
        String(orden),
        60, doc.y - 4, { width: 20, align: 'center' }
      );

      // Acción
      doc.fillColor(COLORES.negro).fontSize(11).font('Helvetica-Bold').text(
        accion,
        90, doc.y - 14, { width: doc.page.width - 145 }
      );

      if (justificacion) {
        doc.fillColor(COLORES.gris).fontSize(9).font('Helvetica').text(
          justificacion,
          90, doc.y, { width: doc.page.width - 145, lineGap: 2 }
        );
      }

      if (urgencia) {
        doc.fillColor(color).fontSize(8).font('Helvetica-Bold').text(
          `Urgencia: ${SEVERIDAD_LABEL[urgencia] ?? urgencia}`,
          90, doc.y + 2
        );
      }

      doc.moveDown(1.5);
    });
  }

  private escribirPiesDePagina(doc: PDFKit.PDFDocument) {
    const totalPaginas = (doc as any)._pageCount || '?';
    const range = doc.bufferedPageRange();

    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const w = doc.page.width;
      const h = doc.page.height;

      doc.rect(0, h - 35, w, 35).fill(COLORES.negro);
      doc
        .fillColor('#9ca3af')
        .fontSize(8)
        .font('Helvetica')
        .text(
          `SCR Agent - Reporte Confidencial - Generado ${new Date().toISOString().split('T')[0]}`,
          55, h - 23,
          { width: w - 130 }
        );
      doc
        .fillColor(COLORES.blanco)
        .fontSize(8)
        .text(`Página ${i + 1}`, w - 100, h - 23, { width: 50, align: 'right' });
    }
  }

  // ── Helpers de formato ──────────────────────────────────────────────────

  private titulo(doc: PDFKit.PDFDocument, texto: string) {
    doc.fillColor(COLORES.azul).fontSize(14).font('Helvetica-Bold').text(texto);
    doc.rect(55, doc.y, doc.page.width - 110, 2).fill(COLORES.azul);
    doc.moveDown(1);
    doc.fillColor(COLORES.negro).font('Helvetica').fontSize(10);
  }

  private subtitulo(doc: PDFKit.PDFDocument, texto: string) {
    doc.fillColor(COLORES.negro).fontSize(11).font('Helvetica-Bold').text(texto);
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);
  }

  private colorRiesgo(score: number): string {
    if (score >= 80) return COLORES.rojo;
    if (score >= 60) return COLORES.naranja;
    if (score >= 40) return COLORES.amarillo;
    return COLORES.verde;
  }
}

export const pdfService = new PdfService();
