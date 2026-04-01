-- Migration: large_repo_support
-- Adds: configurable limits per project, coverage summary per analysis, composite indexes

-- Project: configurable analysis limits
ALTER TABLE "projects"
  ADD COLUMN "maxFileSizeKb"     INTEGER NOT NULL DEFAULT 150,
  ADD COLUMN "maxTotalSizeMb"    INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN "maxDirectoryDepth" INTEGER NOT NULL DEFAULT 6,
  ADD COLUMN "maxCommits"        INTEGER NOT NULL DEFAULT 50;

-- Analysis: coverage summary (how much code was excluded)
ALTER TABLE "analyses"
  ADD COLUMN "coverageSummary" JSONB;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "analyses_projectId_status_idx" ON "analyses"("projectId", "status");
CREATE INDEX IF NOT EXISTS "findings_analysisId_severity_idx" ON "findings"("analysisId", "severity");
