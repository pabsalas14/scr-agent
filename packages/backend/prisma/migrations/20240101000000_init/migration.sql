-- CreateEnum
CREATE TYPE "AnalysisScope" AS ENUM ('REPOSITORY', 'ORGANIZATION', 'PULL_REQUEST');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'RUNNING', 'INSPECTOR_RUNNING', 'DETECTIVE_RUNNING', 'FISCAL_RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PARTIAL', 'ERROR');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskType" AS ENUM ('BACKDOOR', 'INJECTION', 'LOGIC_BOMB', 'OBFUSCATION', 'SUSPICIOUS', 'ERROR_HANDLING', 'HARDCODED_VALUES');

-- CreateEnum
CREATE TYPE "GitAction" AS ENUM ('ADDED', 'MODIFIED', 'DELETED', 'RENAMED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ANALYST', 'DEVELOPER', 'VIEWER');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('DETECTED', 'IN_REVIEW', 'IN_CORRECTION', 'CORRECTED', 'VERIFIED', 'FALSE_POSITIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "RemediationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('STATUS_CHANGE', 'ASSIGNMENT', 'REMEDIATION', 'VERIFICATION', 'COMMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "passwordHash" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "githubToken" VARCHAR(500),
    "githubValidatedAt" TIMESTAMP(3),
    "apiKey" VARCHAR(500),
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "autoRefresh" INTEGER NOT NULL DEFAULT 10000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "repositoryUrl" VARCHAR(500) NOT NULL,
    "branch" VARCHAR(255) DEFAULT 'main',
    "scope" "AnalysisScope" NOT NULL DEFAULT 'REPOSITORY',
    "githubToken" VARCHAR(500),
    "userId" TEXT,
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
    "errorMessage" TEXT,
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
CREATE TABLE "finding_assignments" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finding_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finding_status_changes" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "status" "FindingStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finding_status_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remediation_entries" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "correctionNotes" TEXT,
    "proofOfFixUrl" VARCHAR(500),
    "status" "RemediationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remediation_entries_pkey" PRIMARY KEY ("id")
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
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "model" TEXT NOT NULL DEFAULT 'claude-3-5-sonnet',
    "remediationSteps" JSONB NOT NULL,
    "generalRecommendation" TEXT NOT NULL,
    "pdfContent" BYTEA,
    "jsonContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "NotificationSeverity" NOT NULL DEFAULT 'INFO',
    "findingId" TEXT,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_mentions" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "mentionedUserId" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enableAssignments" BOOLEAN NOT NULL DEFAULT true,
    "enableStatusChanges" BOOLEAN NOT NULL DEFAULT true,
    "enableRemediations" BOOLEAN NOT NULL DEFAULT true,
    "enableComments" BOOLEAN NOT NULL DEFAULT true,
    "enableDigestEmail" BOOLEAN NOT NULL DEFAULT false,
    "digestFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");

CREATE UNIQUE INDEX "user_roles_userId_role_key" ON "user_roles"("userId", "role");
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");
CREATE INDEX "user_roles_role_idx" ON "user_roles"("role");

CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");
CREATE INDEX "user_settings_userId_idx" ON "user_settings"("userId");

CREATE UNIQUE INDEX "projects_repositoryUrl_key" ON "projects"("repositoryUrl");
CREATE INDEX "projects_repositoryUrl_idx" ON "projects"("repositoryUrl");
CREATE INDEX "projects_userId_idx" ON "projects"("userId");

CREATE INDEX "analyses_projectId_idx" ON "analyses"("projectId");
CREATE INDEX "analyses_status_idx" ON "analyses"("status");

CREATE INDEX "findings_analysisId_idx" ON "findings"("analysisId");
CREATE INDEX "findings_severity_idx" ON "findings"("severity");
CREATE INDEX "findings_riskType_idx" ON "findings"("riskType");

CREATE UNIQUE INDEX "finding_assignments_findingId_key" ON "finding_assignments"("findingId");
CREATE INDEX "finding_assignments_findingId_idx" ON "finding_assignments"("findingId");
CREATE INDEX "finding_assignments_assignedTo_idx" ON "finding_assignments"("assignedTo");

CREATE INDEX "finding_status_changes_findingId_idx" ON "finding_status_changes"("findingId");
CREATE INDEX "finding_status_changes_status_idx" ON "finding_status_changes"("status");
CREATE INDEX "finding_status_changes_createdAt_idx" ON "finding_status_changes"("createdAt");

CREATE UNIQUE INDEX "remediation_entries_findingId_key" ON "remediation_entries"("findingId");
CREATE INDEX "remediation_entries_findingId_idx" ON "remediation_entries"("findingId");
CREATE INDEX "remediation_entries_status_idx" ON "remediation_entries"("status");

CREATE INDEX "forensic_events_analysisId_idx" ON "forensic_events"("analysisId");
CREATE INDEX "forensic_events_timestamp_idx" ON "forensic_events"("timestamp");
CREATE INDEX "forensic_events_author_idx" ON "forensic_events"("author");

CREATE UNIQUE INDEX "reports_analysisId_key" ON "reports"("analysisId");

CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX "notifications_read_idx" ON "notifications"("read");
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

CREATE INDEX "comments_findingId_idx" ON "comments"("findingId");
CREATE INDEX "comments_userId_idx" ON "comments"("userId");
CREATE INDEX "comments_createdAt_idx" ON "comments"("createdAt");

CREATE INDEX "comment_mentions_commentId_idx" ON "comment_mentions"("commentId");
CREATE INDEX "comment_mentions_mentionedUserId_idx" ON "comment_mentions"("mentionedUserId");
CREATE INDEX "comment_mentions_read_idx" ON "comment_mentions"("read");

CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "analyses" ADD CONSTRAINT "analyses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "findings" ADD CONSTRAINT "findings_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "finding_assignments" ADD CONSTRAINT "finding_assignments_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finding_assignments" ADD CONSTRAINT "finding_assignments_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "finding_status_changes" ADD CONSTRAINT "finding_status_changes_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finding_status_changes" ADD CONSTRAINT "finding_status_changes_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "remediation_entries" ADD CONSTRAINT "remediation_entries_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "forensic_events" ADD CONSTRAINT "forensic_events_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "forensic_events" ADD CONSTRAINT "forensic_events_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "findings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reports" ADD CONSTRAINT "reports_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "findings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "comments" ADD CONSTRAINT "comments_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "comment_mentions" ADD CONSTRAINT "comment_mentions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comment_mentions" ADD CONSTRAINT "comment_mentions_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
