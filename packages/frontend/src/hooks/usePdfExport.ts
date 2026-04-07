/**
 * ============================================================================
 * HOOK: usePdfExport (Professional Edition - Fixed)
 * ============================================================================
 * Generación de reportes PDF profesionales con mejor manejo de errores.
 */

import { useState, useCallback } from 'react';
import { useToast } from './useToast';
import type { Reporte, Hallazgo, Proyecto } from '../types/api';
import { CODA_LOGO_BASE64 } from '../assets/logo';

interface ExportData {
  proyecto: Proyecto;
  reporte: Reporte;
  hallazgos: Hallazgo[];
  analisisId: string;
}

type RGB = [number, number, number];

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  const exportToPdf = useCallback(
    async (data: ExportData) => {
      const { proyecto, reporte, hallazgos, analisisId } = data;
      setIsExporting(true);
      toast.info('Construyendo reporte profesional...');

      try {
        // Validar datos necesarios
        if (!proyecto?.name || !reporte?.riskScore) {
          throw new Error('Datos incompletos para generar reporte');
        }

        const [jspdfModule, autotableModule] = await Promise.all([
          import('jspdf'),
          import('jspdf-autotable'),
        ]);

        const { jsPDF } = jspdfModule;
        const autoTable = (autotableModule as any).default;

        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;

        // --- COLORES Y ESTILOS ---
        const colors: { [key: string]: RGB } = {
          primary: [0, 209, 255],
          secondary: [112, 0, 255],
          dark: [10, 11, 16],
          text: [30, 41, 59],
          muted: [100, 116, 139],
          critical: [255, 59, 59],
          high: [249, 115, 22],
          medium: [245, 158, 11],
          low: [16, 185, 129]
        };

        const getC = (key: string): RGB => colors[key] || [0, 0, 0];

        // --- PORTADA ---
        try {
          const cDark = getC('dark');
          doc.setFillColor(cDark[0], cDark[1], cDark[2]);
          doc.rect(0, 0, pageWidth, 100, 'F');

          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(40);
          doc.text('CODA', margin, 50);

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text('Code Observability & Defense Agentic', margin, 60);

          const cPrimary = getC('primary');
          doc.setDrawColor(cPrimary[0], cPrimary[1], cPrimary[2]);
          doc.setLineWidth(1.5);
          doc.line(margin, 70, pageWidth - margin, 70);

          doc.setTextColor(cDark[0], cDark[1], cDark[2]);
          doc.setFontSize(24);
          doc.setFont('helvetica', 'bold');
          doc.text('REPORTE DE SEGURIDAD', margin, 120);

          doc.setFontSize(14);
          doc.setFont('helvetica', 'normal');
          doc.text(`Proyecto: ${proyecto.name}`, margin, 130);
          doc.text(`ID de Análisis: ${analisisId.toUpperCase()}`, margin, 138);
          doc.text(`Fecha: ${new Date().toLocaleDateString()}`, margin, 146);

          const scoreColor = reporte.riskScore > 70 ? getC('critical') : reporte.riskScore > 40 ? getC('medium') : getC('low');
          doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
          doc.roundedRect(margin, 160, 60, 30, 3, 3, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.text('SCORE DE AMENAZA', margin + 5, 168);
          doc.setFontSize(20);
          doc.text(`${reporte.riskScore}/100`, margin + 5, 182);

          const cMuted = getC('muted');
          doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
          doc.setFontSize(8);
          doc.text('CONFIDENCIAL - USO INTERNO', pageWidth / 2, pageHeight - 15, { align: 'center' });
        } catch (err) {
          console.error('Error rendering cover page:', err);
          // Continuar de todas formas
        }

        // --- PÁGINA 2: RESUMEN EJECUTIVO ---
        try {
          doc.addPage();
          const cPrimary = getC('primary');

          // Logo simple sin imagen
          doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
          doc.rect(margin, 10, 15, 15, 'F');

          doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('1. Resumen Ejecutivo', margin + 20, 20);

          let currentY = 35;
          const cText = getC('text');
          doc.setTextColor(cText[0], cText[1], cText[2]);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const splitSummary = doc.splitTextToSize(reporte.executiveSummary || 'Análisis de seguridad completado', pageWidth - (margin * 2));
          doc.text(splitSummary, margin, currentY);

          currentY += (splitSummary.length * 5) + 15;

          if (reporte.severityBreakdown && Object.keys(reporte.severityBreakdown).length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.text('Distribución de Amenazas:', margin, currentY);

            const severityData = Object.entries(reporte.severityBreakdown).map(([k, v]) => [k, v.toString()]);
            autoTable(doc, {
              startY: currentY + 5,
              head: [['Severidad', 'Contador']],
              body: severityData,
              theme: 'striped',
              headStyles: { fillColor: getC('dark') },
              margin: { left: margin, right: margin }
            });
          }
        } catch (err) {
          console.error('Error rendering summary page:', err);
        }

        // --- PÁGINA 3: HALLAZGOS ---
        try {
          if (hallazgos && hallazgos.length > 0) {
            doc.addPage();
            const cPrimary = getC('primary');
            doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('2. Análisis de Vulnerabilidades', margin, 30);

            const findingsBody = hallazgos.slice(0, 20).map((f, i) => [
              (i + 1).toString(),
              f.riskType || 'Sin tipo',
              f.severity || 'N/A',
              (f.file || 'N/A').substring(0, 30),
              `${Math.round((f.confidence || 0) * 100)}%`
            ]);

            const cSecondary = getC('secondary');
            autoTable(doc, {
              startY: 40,
              head: [['#', 'Tipo de Riesgo', 'Severidad', 'Archivo', 'Confidencia']],
              body: findingsBody,
              styles: { fontSize: 8 },
              headStyles: { fillColor: cSecondary },
              columnStyles: {
                2: { cellWidth: 20 },
                4: { cellWidth: 20 }
              },
              margin: { left: margin, right: margin }
            });
          }
        } catch (err) {
          console.error('Error rendering findings:', err);
        }

        // --- PÁGINA 4: REMEDIACIÓN ---
        try {
          doc.addPage();
          const cPrimary = getC('primary');
          doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('3. Plan de Remediación', margin, 30);

          const cText = getC('text');
          doc.setTextColor(cText[0], cText[1], cText[2]);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const recommend = doc.splitTextToSize(reporte.generalRecommendation || 'Ver detalles en sistema', pageWidth - (margin * 2));
          doc.text(recommend, margin, 45);

          if (reporte.remediationSteps && Array.isArray(reporte.remediationSteps) && reporte.remediationSteps.length > 0) {
            const stepsData = reporte.remediationSteps.slice(0, 10).map((s: any, idx: number) => [
              (idx + 1).toString(),
              (s.urgency || s.urgencia || 'MEDIUM').substring(0, 15),
              ((s.action || s.accion || 'Sin descripción').substring(0, 60))
            ]);

            const cLow = getC('low');
            autoTable(doc, {
              startY: 60 + (recommend.length * 5),
              head: [['Orden', 'Prioridad', 'Acción']],
              body: stepsData,
              theme: 'grid',
              headStyles: { fillColor: cLow },
              styles: { fontSize: 8 },
              margin: { left: margin, right: margin }
            });
          }

          const cMuted = getC('muted');
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
          doc.text('Fin del reporte generado automáticamente por SCR Agent Diagnostics Engine.', pageWidth / 2, pageHeight - 15, { align: 'center' });
        } catch (err) {
          console.error('Error rendering remediation:', err);
        }

        // Generar el PDF
        const fileName = `CODA-Report-${(proyecto.name || 'Report').replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`;
        doc.save(fileName);
        toast.success(`Reporte "${fileName}" generado correctamente`);
      } catch (error) {
        console.error('Critical error generating PDF:', error);
        toast.error(`Error al generar reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setIsExporting(false);
      }
    },
    [toast]
  );

  return { exportToPdf, isExporting };
}
