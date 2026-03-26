-- CreateEnum
CREATE TYPE "AnalysisScope" AS ENUM ('REPOSITORY', 'ORGANIZATION', 'PULL_REQUEST');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'RUNNING', 'INSPECTOR_RUNNING', 'DETECTIVE_RUNNING', 'FISCAL_RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskType" AS ENUM ('BACKDOOR', 'INJECTION', 'LOGIC_BOMB', 'OBFUSCATION', 'SUSPICIOUS', 'ERROR_HANDLING', 'HARDCODED_VALUES');

-- CreateEnum
CREATE TYPE "GitAction" AS ENUM ('ADDED', 'MODIFIED', 'DELETED', 'RENAMED');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "repositoryUrl" VARCHAR(500) NOT NULL,
    "scope" "AnalysisScope" NOT NULL DEFAULT 'REPOSITORY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "findings" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "file" VARCHAR(500) NOT NULL,
    "function" VARCHAR(255),
    "lineRange" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "riskType" "RiskType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "codeSnippet" TEXT,
    "whySuspicious" TEXT NOT NULL,
    "remediationSteps" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forensic_events" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "findingId" TEXT,
    "commitHash" VARCHAR(40) NOT NULL,
    "commitMessage" TEXT NOT NULL,
    "author" VARCHAR(255) NOT NULL,
    "action" "GitAction" NOT NULL,
    "file" VARCHAR(500) NOT NULL,
    "function" VARCHAR(255),
    "changesSummary" TEXT,
    "riskLevel" "Severity" NOT NULL DEFAULT 'LOW',
    "suspicionIndicators" TEXT[],
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forensic_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "executiveSummary" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "findingsCount" INTEGER NOT NULL,
    "severityBreakdown" JSONB NOT NULL,
    "compromisedFunctions" TEXT[],
    "affectedAuthors" TEXT[],
    "remediationSteps" JSONB NOT NULL,
    "generalRecommendation" TEXT NOT NULL,
    "pdfContent" BYTEA,
    "jsonContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_repositoryUrl_key" ON "projects"("repositoryUrl");

-- CreateIndex
CREATE INDEX "projects_repositoryUrl_idx" ON "projects"("repositoryUrl");

-- CreateIndex
CREATE INDEX "analyses_projectId_idx" ON "analyses"("projectId");

-- CreateIndex
CREATE INDEX "analyses_status_idx" ON "analyses"("status");

-- CreateIndex
CREATE INDEX "findings_analysisId_idx" ON "findings"("analysisId");

-- CreateIndex
CREATE INDEX "findings_severity_idx" ON "findings"("severity");

-- CreateIndex
CREATE INDEX "findings_riskType_idx" ON "findings"("riskType");

-- CreateIndex
CREATE INDEX "forensic_events_analysisId_idx" ON "forensic_events"("analysisId");

-- CreateIndex
CREATE INDEX "forensic_events_timestamp_idx" ON "forensic_events"("timestamp");

-- CreateIndex
CREATE INDEX "forensic_events_author_idx" ON "forensic_events"("author");

-- CreateIndex
CREATE UNIQUE INDEX "reports_analysisId_key" ON "reports"("analysisId");

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forensic_events" ADD CONSTRAINT "forensic_events_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forensic_events" ADD CONSTRAINT "forensic_events_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "findings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
