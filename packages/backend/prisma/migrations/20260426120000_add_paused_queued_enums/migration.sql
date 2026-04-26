-- Pausa de análisis (el enum siempre existe en el historial de migraciones)
ALTER TYPE "AnalysisStatus" ADD VALUE IF NOT EXISTS 'PAUSED';

-- JobStatus: en algunas instalaciones el enum/tabla aún no existía en SQL (solo vía db push);
-- se omite si no hay tipo. Si existe, añadimos QUEUED.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'JobStatus') THEN
    ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'QUEUED';
  END IF;
END $$;
