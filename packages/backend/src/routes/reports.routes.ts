/**
 * ============================================================================
 * REPORTS ROUTES - Endpoints para generación y descarga de reportes
 * ============================================================================
 *
 * GET /api/reports/:analysisId/executive              → Reporte ejecutivo
 * GET /api/reports/:analysisId/technical              → Reporte técnico
 * GET /api/reports/:analysisId/remediation            → Reporte de remediación
 * GET /api/reports/:analysisId/export                 → Exportar en formato
 */

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  generateRemediationReport,
  generateCSVReport,
  generatePDFReport,
  getReportUrl,
} from '../services/report-generator.service';

const router: ExpressRouter = Router();
router.use(authMiddleware);

/**
 * GET /api/reports/:analysisId/executive
 * Generar reporte ejecutivo
 */
router.get('/:analysisId/executive', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;

    const report = await generateExecutiveReport(analysisId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found',
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error(`Error generating executive report: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Error generating report',
    });
  }
});

/**
 * GET /api/reports/:analysisId/technical
 * Generar reporte técnico
 */
router.get('/:analysisId/technical', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;

    const report = await generateTechnicalReport(analysisId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found',
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error(`Error generating technical report: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Error generating report',
    });
  }
});

/**
 * GET /api/reports/:analysisId/remediation
 * Generar reporte de remediación
 */
router.get('/:analysisId/remediation', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;

    const report = await generateRemediationReport(analysisId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'No remediation data found',
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error(`Error generating remediation report: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Error generating report',
    });
  }
});

/**
 * GET /api/reports/:analysisId/export
 * Exportar reporte en formato
 */
router.get('/:analysisId/export', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const type = (req.query.type || 'executive') as 'executive' | 'technical' | 'remediation';
    const format = (req.query.format || 'json') as 'json' | 'csv';

    // Validar parámetros
    if (!['executive', 'technical', 'remediation'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report type. Must be: executive, technical, or remediation',
      });
    }

    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid format. Must be: json or csv',
      });
    }

    // Generar reporte según tipo
    let reportData;

    switch (type) {
      case 'executive':
        reportData = await generateExecutiveReport(analysisId);
        break;
      case 'technical':
        reportData = await generateTechnicalReport(analysisId);
        break;
      case 'remediation':
        reportData = await generateRemediationReport(analysisId);
        break;
      default:
        reportData = null;
    }

    if (!reportData) {
      return res.status(404).json({
        success: false,
        error: `${type} report data not found`,
      });
    }

    // Exportar en formato
    if (format === 'csv') {
      // Para tipo remediation/technical, generar CSV de findings
      if (type !== 'executive') {
        const csv = await generateCSVReport(analysisId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="report-${analysisId}.csv"`);
        return res.send(csv);
      }
    }

    // Por defecto, devolver JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="report-${analysisId}.json"`);
    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    logger.error(`Error exporting report: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Error exporting report',
    });
  }
});

/**
 * GET /api/reports/:analysisId/pdf
 * Descargar reporte en formato PDF profesional
 */
router.get('/:analysisId/pdf', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    
    logger.info(`Generando PDF para análisis ${analysisId}...`);
    const pdfBuffer = await generatePDFReport(analysisId);

    if (!pdfBuffer) {
      return res.status(404).json({
        success: false,
        error: 'No se pudo generar el PDF. Asegúrese de que el análisis existe y ha terminado.',
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SCR-Report-${analysisId.substring(0, 8)}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error(`Error en descarga de PDF: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Error interno generando el reporte PDF',
    });
  }
});

/**
 * GET /api/reports/:analysisId/download-url
 * Obtener URL de descarga de reporte
 */
router.get('/:analysisId/download-url', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const type = (req.query.type || 'executive') as 'executive' | 'technical' | 'remediation';
    const format = (req.query.format || 'json') as 'json' | 'csv';

    const url = await getReportUrl(analysisId, type, format);

    res.json({
      success: true,
      data: {
        downloadUrl: url,
        expiresIn: 3600, // 1 hour
      },
    });
  } catch (error) {
    logger.error(`Error getting download URL: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Error generating download URL',
    });
  }
});

export default router;
