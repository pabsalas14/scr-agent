import { prisma } from './prisma.service';

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
      const findings = await prisma.finding.findMany({
        where: {
          deletedAt: null,
          analysis: {
            project: {
              userId,
            },
          },
          OR: [
            { file: { contains: query, mode: 'insensitive' } },
            { whySuspicious: { contains: query, mode: 'insensitive' } },
          ],
          ...(filters?.severity && { severity: filters.severity as any }),
        },
        include: {
          analysis: {
            select: {
              status: true,
              projectId: true,
            },
          },
        },
        take: limit,
        skip: offset,
      });

      for (const f of findings) {
        results.push({
          id: f.id,
          type: 'finding',
          title: f.file,
          description: f.whySuspicious,
          icon: this.getSeverityIcon(f.severity),
          href: `/findings/${f.id}`,
          relevance: this.calculateRelevance(query, f.file, 'finding'),
          metadata: {
            severity: f.severity,
            status: f.analysis.status,
            projectId: f.analysis.projectId,
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

    // Search analyses by project name (since analyses don't have name/description)
    if (!filters?.type || filters.type === 'analysis') {
      const analyses = await prisma.analysis.findMany({
        where: {
          project: {
            userId,
            name: { contains: query, mode: 'insensitive' },
          },
          ...(filters?.status && { status: filters.status as any }),
        },
        include: { project: true },
        take: limit,
        skip: offset,
      });

      for (const a of analyses) {
        results.push({
          id: a.id,
          type: 'analysis',
          title: `Analysis of ${a.project.name}`,
          description: `Status: ${a.status}, Progress: ${a.progress}%`,
          icon: '🔍',
          href: `/projects/${a.projectId}/analyses/${a.id}`,
          relevance: this.calculateRelevance(query, a.project.name, 'analysis'),
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
    const findingSuggestions = await prisma.$queryRaw<{ file: string }[]>`
      SELECT DISTINCT f.file
      FROM findings f
      JOIN analyses a ON f."analysisId" = a.id
      JOIN projects p ON a."projectId" = p.id
      WHERE p."userId" = ${userId}
        AND LOWER(f.file) LIKE ${searchTerm}
        AND f."deletedAt" IS NULL
      LIMIT ${Math.ceil(limit / 2)}
    `;

    // Get suggestions from projects
    const projectSuggestions = await prisma.$queryRaw<{ name: string }[]>`
      SELECT DISTINCT name
      FROM projects
      WHERE "userId" = ${userId}
        AND LOWER(name) LIKE ${searchTerm}
      LIMIT ${Math.ceil(limit / 2)}
    `;

    const suggestions = [
      ...findingSuggestions.map((f) => f.file),
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
