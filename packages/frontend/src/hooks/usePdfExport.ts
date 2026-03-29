/**
 * ============================================================================
 * HOOK: usePdfExport (Professional Edition)
 * ============================================================================
 * Generación de reportes PDF profesionales basados en datos.
 */

import { useState, useCallback } from 'react';
import { useToast } from './useToast';
import type { Reporte, Hallazgo, Proyecto } from '../types/api';

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

        // --- PÁGINA 2: RESUMEN EJECUTIVO ---
        doc.addPage();
        doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('1. Resumen Ejecutivo', margin, 30);

        const cText = getC('text');
        doc.setTextColor(cText[0], cText[1], cText[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const splitSummary = doc.splitTextToSize(reporte.executiveSummary, pageWidth - (margin * 2));
        doc.text(splitSummary, margin, 45);

        doc.setFont('helvetica', 'bold');
        doc.text('Distribución de Amenazas:', margin, 100);
        
        const severityData = Object.entries(reporte.severityBreakdown).map(([k, v]) => [k, v.toString()]);
        autoTable(doc, {
          startY: 105,
          head: [['Severidad', 'Contador']],
          body: severityData,
          theme: 'striped',
          headStyles: { fillColor: cDark },
          margin: { left: margin, right: margin }
        });

        // --- PÁGINA 3: HALLAZGOS DETALLADOS ---
        doc.addPage();
        doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('2. Análisis de Vulnerabilidades', margin, 30);

        const findingsBody = hallazgos.map((f, i) => [
          (i + 1).toString(),
          f.riskType,
          f.severity,
          f.file,
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
          }
        });

        let currentY = (doc as any).lastAutoTable.finalY + 20;
        
        hallazgos.slice(0, 10).forEach((f, idx) => {
          if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 30;
          }

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(cDark[0], cDark[1], cDark[2]);
          doc.text(`${idx + 1}. ${f.riskType}`, margin, currentY);
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
          doc.text(`Archivo: ${f.file} (Líneas: ${f.lineRange || 'N/A'})`, margin, currentY + 5);
          
          doc.setTextColor(cText[0], cText[1], cText[2]);
          const details = doc.splitTextToSize(`Diagnóstico: ${f.whySuspicious}`, pageWidth - (margin * 2));
          doc.text(details, margin, currentY + 12);
          
          currentY += 15 + (details.length * 4);
        });

        // --- PÁGINA FINAL: RECOMENDACIONES ---
        doc.addPage();
        doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('3. Plan de Remediación', margin, 30);

        doc.setTextColor(cText[0], cText[1], cText[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const recommend = doc.splitTextToSize(reporte.generalRecommendation, pageWidth - (margin * 2));
        doc.text(recommend, margin, 45);

        const stepsData = (reporte.remediationSteps as any[]).map(s => [
          s.order || '—',
          s.urgency || s.urgencia || 'MEDIUM',
          s.action || s.accion || ''
        ]);

        const cLow = getC('low');
        autoTable(doc, {
          startY: 60 + (recommend.length * 5),
          head: [['Orden', 'Prioridad', 'Acción Recomendada']],
          body: stepsData,
          theme: 'grid',
          headStyles: { fillColor: cLow },
          styles: { fontSize: 8 }
        });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
        doc.text('Fin del reporte generado automáticamente por SCR Agent Diagnostics Engine.', pageWidth / 2, (doc as any).lastAutoTable.finalY + 20, { align: 'center' });

        doc.save(`CODA-Report-${proyecto.name.replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`);
        toast.success('Reporte profesional generado');
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Fallo al generar reporte profesional');
      } finally {
        setIsExporting(false);
      }
    },
    [toast]
  );

  return { exportToPdf, isExporting };
}
