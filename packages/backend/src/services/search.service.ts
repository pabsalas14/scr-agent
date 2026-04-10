import { prisma } from '../db';

export interface SearchResult {
  id: string;
  type: 'finding' | 'project' | 'analysis' | 'incident' | 'report';
  title: string;
  description?: string;
  icon: string;
  href: string;
  relevance: number;
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  query: string;
  page?: number;
  limit?: number;
  userId: string;
  filters?: {
    type?: string;
    severity?: string;
    status?: string;
  };
}

export class SearchService {
  /**
   * Global search across findings, projects, analyses, incidents, and reports
   * Applies per-user and per-project filtering for security
   */
  async search(options: SearchOptions): Promise<{ results: SearchResult[]; total: number }> {
    const { query, page = 1, limit = 20, userId, filters } = options;
    const offset = (page - 1) * limit;

    if (!query || query.trim().length === 0) {
      return { results: [], total: 0 };
    }

    const searchTerm = `%${query.toLowerCase()}%`;
    const results: SearchResult[] = [];

    // Search findings - only from user's projects
    if (!filters?.type || filters.type === 'finding') {
      const findings = await prisma.$queryRaw`
        SELECT
          f.id,
          f.title,
          f.description,
          f.severity,
          a."status" as analysisStatus,
          p.id as projectId,
          COUNT(*) OVER() as total_count
        FROM "Finding" f
        JOIN "Analysis" a ON f."analysisId" = a.id
        JOIN "Project" p ON a."projectId" = p.id
        WHERE p."userId" = ${userId}
          AND (LOWER(f.title) LIKE ${searchTerm}
               OR LOWER(f.description) LIKE ${searchTerm})
          AND f."deletedAt" IS NULL
          AND (${filters?.severity ? `f.severity = ${filters.severity}` : 'true'})
        ORDER BY
          CASE WHEN LOWER(f.title) LIKE ${`${query.toLowerCase()}%`} THEN 1 ELSE 2 END,
          f."createdAt" DESC
        LIMIT ${limit}
        OFFSET ${offset}
      ` as any[];

      for (const f of findings) {
        results.push({
          id: f.id,
          type: 'finding',
          title: f.title,
          description: f.description,
          icon: this.getSeverityIcon(f.severity),
          href: `/findings/${f.id}`,
          relevance: this.calculateRelevance(query, f.title, 'finding'),
          metadata: {
            severity: f.severity,
            status: f.analysisStatus,
            projectId: f.projectId,
          },
        });
      }
    }

    // Search projects
    if (!filters?.type || filters.type === 'project') {
      const projects = await prisma.project.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        skip: offset,
      });

      for (const p of projects) {
        results.push({
          id: p.id,
          type: 'project',
          title: p.name,
          description: p.description,
          icon: '📁',
          href: `/projects/${p.id}`,
          relevance: this.calculateRelevance(query, p.name, 'project'),
        });
      }
    }

    // Search analyses
    if (!filters?.type || filters.type === 'analysis') {
      const analyses = await prisma.analysis.findMany({
        where: {
          project: { userId },
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          ...(filters?.status && { status: filters.status }),
        },
        include: { project: true },
        take: limit,
        skip: offset,
      });

      for (const a of analyses) {
        results.push({
          id: a.id,
          type: 'analysis',
          title: a.name,
          description: a.description,
          icon: '🔍',
          href: `/projects/${a.projectId}/analyses/${a.id}`,
          relevance: this.calculateRelevance(query, a.name, 'analysis'),
          metadata: {
            status: a.status,
            projectId: a.projectId,
          },
        });
      }
    }

    // Sort by relevance and return
    const sorted = results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    return {
      results: sorted,
      total: results.length,
    };
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSuggestions(query: string, userId: string, limit: number = 10): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = `${query.toLowerCase()}%`;

    // Get suggestions from findings
    const findingSuggestions = await prisma.$queryRaw<{ title: string }[]>`
      SELECT DISTINCT f.title
      FROM "Finding" f
      JOIN "Analysis" a ON f."analysisId" = a.id
      JOIN "Project" p ON a."projectId" = p.id
      WHERE p."userId" = ${userId}
        AND LOWER(f.title) LIKE ${searchTerm}
        AND f."deletedAt" IS NULL
      LIMIT ${Math.ceil(limit / 2)}
    `;

    // Get suggestions from projects
    const projectSuggestions = await prisma.$queryRaw<{ name: string }[]>`
      SELECT DISTINCT name
      FROM "Project"
      WHERE "userId" = ${userId}
        AND LOWER(name) LIKE ${searchTerm}
      LIMIT ${Math.ceil(limit / 2)}
    `;

    const suggestions = [
      ...findingSuggestions.map((f) => f.title),
      ...projectSuggestions.map((p) => p.name),
    ];

    return [...new Set(suggestions)].slice(0, limit);
  }

  /**
   * Calculate relevance score for a result
   * Higher score = more relevant
   */
  private calculateRelevance(query: string, title: string, type: string): number {
    const q = query.toLowerCase();
    const t = title.toLowerCase();

    let score = 0;

    // Exact match: 100 points
    if (t === q) {
      score += 100;
    }
    // Starts with query: 75 points
    else if (t.startsWith(q)) {
      score += 75;
    }
    // Contains query: 50 points
    else if (t.includes(q)) {
      score += 50;
    }

    // Type bonus
    const typeBonus = {
      finding: 30,
      project: 25,
      analysis: 20,
      incident: 35,
      report: 15,
    };
    score += typeBonus[type as keyof typeof typeBonus] || 0;

    return score;
  }

  /**
   * Get icon for severity level
   */
  private getSeverityIcon(severity: string): string {
    const icons: Record<string, string> = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🟢',
      INFO: '🔵',
    };
    return icons[severity] || '⚪';
  }
}

export const searchService = new SearchService();
