/**
 * Tipos para comunicación con el API REST backend
 */

export type AlcanceAnalisis = 'REPOSITORY' | 'ORGANIZATION' | 'PULL_REQUEST';
export type EstadoAnalisis =
  | 'PENDING'
  | 'RUNNING'
  | 'INSPECTOR_RUNNING'
  | 'DETECTIVE_RUNNING'
  | 'FISCAL_RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PARTIAL';

export interface Proyecto {
  id: string;
  name: string;
  description?: string;
  repositoryUrl: string;
  scope: AlcanceAnalisis;
  createdAt: string;
  updatedAt: string;
}

export interface CrearProyectoDTO {
  name: string;
  description?: string;
  repositoryUrl: string;
  scope?: AlcanceAnalisis;
}

export interface Analisis {
  id: string;
  projectId: string;
  status: EstadoAnalisis;
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Hallazgo {
  id: string;
  analysisId: string;
  file: string;
  function?: string;
  lineRange: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskType: string;
  confidence: number;
  codeSnippet?: string;
  whySuspicious: string;
  remediationSteps: string[];
  createdAt: string;
}

export interface EventoForense {
  id: string;
  analysisId: string;
  findingId?: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  action: 'ADDED' | 'MODIFIED' | 'DELETED' | 'RENAMED';
  file: string;
  function?: string;
  changesSummary?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suspicionIndicators: string[];
  timestamp: string;
}

export interface Reporte {
  id: string;
  analysisId: string;
  executiveSummary: string;
  riskScore: number;
  findingsCount: number;
  severityBreakdown: Record<string, number>;
  compromisedFunctions: string[];
  affectedAuthors: string[];
  remediationSteps: any[];
  generalRecommendation: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
