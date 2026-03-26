/**
 * ============================================================================
 * RUTAS DE ANÁLISIS
 * ============================================================================
 *
 * GET /api/v1/analyses/:id            → Estado del análisis
 * GET /api/v1/analyses/:id/findings   → Hallazgos
 * GET /api/v1/analyses/:id/forensics  → Eventos forenses (timeline)
 * GET /api/v1/analyses/:id/report     → Reporte final
 * GET /api/v1/analyses/:id/report/pdf → Descargar PDF
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../services/logger.service';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/analyses/:id
 * Obtener estado de análisis
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id: req.params['id'] },
    });

    if (!analysis) {
      res.status(404).json({ error: 'Análisis no encontrado' });
      return;
    }

    res.json({ data: analysis });
  } catch (error) {
    logger.error(`Error obteniendo análisis: ${error}`);
    res.status(500).json({ error: 'Error al obtener análisis' });
  }
});

/**
 * GET /api/v1/analyses/:id/findings
 * Hallazgos de Malicia
 */
router.get('/:id/findings', async (req: Request, res: Response) => {
  try {
    const findings = await prisma.finding.findMany({
      where: { analysisId: req.params['id'] },
      orderBy: [
        { severity: 'desc' },
        { confidence: 'desc' },
      ],
    });

    res.json({ data: findings });
  } catch (error) {
    logger.error(`Error obteniendo hallazgos: ${error}`);
    res.status(500).json({ error: 'Error al obtener hallazgos' });
  }
});

/**
 * GET /api/v1/analyses/:id/forensics
 * Eventos forenses para el timeline
 */
router.get('/:id/forensics', async (req: Request, res: Response) => {
  try {
    const events = await prisma.forensicEvent.findMany({
      where: { analysisId: req.params['id'] },
      orderBy: { timestamp: 'asc' },
    });

    res.json({ data: events });
  } catch (error) {
    logger.error(`Error obteniendo eventos forenses: ${error}`);
    res.status(500).json({ error: 'Error al obtener eventos forenses' });
  }
});

/**
 * GET /api/v1/analyses/:id/report
 * Reporte ejecutivo de Síntesis
 */
router.get('/:id/report', async (req: Request, res: Response) => {
  try {
    const report = await prisma.report.findUnique({
      where: { analysisId: req.params['id'] },
    });

    if (!report) {
      res.status(404).json({ error: 'Reporte no disponible aún' });
      return;
    }

    /**
     * Parsear JSON almacenado en DB
     */
    const reportData = {
      ...report,
      remediationSteps: report.remediationSteps,
      severityBreakdown: report.severityBreakdown,
    };

    res.json({ data: reportData });
  } catch (error) {
    logger.error(`Error obteniendo reporte: ${error}`);
    res.status(500).json({ error: 'Error al obtener reporte' });
  }
});

/**
 * GET /api/v1/analyses/:id/report/pdf
 * Descargar reporte como PDF
 */
router.get('/:id/report/pdf', async (req: Request, res: Response) => {
  try {
    const report = await prisma.report.findUnique({
      where: { analysisId: req.params['id'] },
    });

    if (!report || !report.pdfContent) {
      res.status(404).json({ error: 'PDF no disponible' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reporte-scr-${req.params['id']}.pdf"`
    );
    res.send(report.pdfContent);
  } catch (error) {
    logger.error(`Error descargando PDF: ${error}`);
    res.status(500).json({ error: 'Error al descargar PDF' });
  }
});

export default router;
