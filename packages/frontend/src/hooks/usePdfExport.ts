/**
 * ============================================================================
 * HOOK: usePdfExport
 * ============================================================================
 * Generación de PDF client-side usando html2canvas + jspdf.
 * Captura el DOM del ReportViewer y lo exporta como PDF multi-página.
 */

import { useState, useCallback } from 'react';
import { useToast } from './useToast';

interface PdfExportOptions {
  filename?: string;
  /** Padding en px dentro del PDF */
  padding?: number;
}

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  const exportToPdf = useCallback(
    async (elementId: string, options: PdfExportOptions = {}) => {
      const { filename = 'reporte-coda.pdf', padding = 10 } = options;

      setIsExporting(true);
      toast.info('Generando PDF...');

      try {
        // Importaciones dinámicas para no bloquear el bundle
        const [html2canvasModule, jspdfModule] = await Promise.all([
          import('html2canvas'),
          import('jspdf'),
        ]);

        const html2canvas = html2canvasModule.default;
        const { jsPDF } = jspdfModule;

        const element = document.getElementById(elementId);
        if (!element) {
          throw new Error(`Elemento #${elementId} no encontrado`);
        }

        // Capturar el DOM como canvas
        const canvas = await html2canvas(element, {
          scale: 2, // Alta resolución
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#050505', // Dark background del diseño
          logging: false,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/png');

        // Configurar jsPDF en formato A4
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const usableWidth = pdfWidth - padding * 2;
        const usableHeight = pdfHeight - padding * 2;

        // Calcular proporción de la imagen
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;

        // Dividir en múltiples páginas si el contenido es largo
        const totalPages = Math.ceil(imgHeight / (imgWidth / usableWidth * usableHeight));

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();

          const srcY = page * (imgHeight / totalPages);
          const srcHeight = imgHeight / totalPages;

          // Crear canvas temporal para cada página
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgWidth;
          pageCanvas.height = srcHeight;
          const ctx = pageCanvas.getContext('2d')!;
          ctx.drawImage(canvas, 0, -srcY);

          const pageImgData = pageCanvas.toDataURL('image/png');
          const pageHeight = usableWidth / ratio / totalPages;

          pdf.addImage(pageImgData, 'PNG', padding, padding, usableWidth, Math.min(pageHeight, usableHeight));
        }

        // Agregar metadata al PDF
        pdf.setProperties({
          title: 'Reporte de Seguridad CODA',
          subject: 'Análisis de Código - SCR Agent',
          author: 'CODA Security Platform',
          creator: 'SCR Agent v1.0',
        });

        pdf.save(filename);

        toast.success('PDF generado exitosamente');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error generando PDF';
        toast.error(`Error al generar PDF: ${msg}`);
        console.error('PDF export error:', error);
      } finally {
        setIsExporting(false);
      }
    },
    [toast]
  );

  return { exportToPdf, isExporting };
}
