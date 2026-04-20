/**
 * Metrics Service (PHASE 3)
 * Generates dynamic metrics for dashboard
 * Includes: Token usage, activity per repo, MTTD, burndown charts
 */

import { prisma } from './prisma.service';
import { logger } from './logger.service';

// ==================== TOKEN USAGE METRICS ====================

export interface TokenUsageMetrics {
  userId: string;
  userName?: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  analysisCount: number;
  model: string;
  period: string; // 'day', 'week', 'month'
}

/**
 * Get token usage metrics for admin dashboard
 * Shows: total tokens, cost per user, analysis count
 */
export async function getTokenUsageMetrics(
  period: 'day' | 'week' | 'month' = 'month'
): Promise<TokenUsageMetrics[]> {
  const periodMs = getPeriodMs(period);
  const startDate = new Date(Date.now() - periodMs);

  const usage = await prisma.tokenUsage.groupBy({
    by: ['userId', 'model'],
    where: {
      createdAt: { gte: startDate },
    },
    _sum: {
      inputTokens: true,
      outputTokens: true,
      totalTokens: true,
      costUsd: true,
    },
    _count: {
      analysisId: true,
    },
  });

  // Fetch user names for display
  const userIds = [...new Set(usage.map((u) => u.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return usage.map((u) => ({
    userId: u.userId,
    userName: userMap.get(u.userId) || 'Unknown',
    totalTokens: u._sum.totalTokens || 0,
    inputTokens: u._sum.inputTokens || 0,
    outputTokens: u._sum.outputTokens || 0,
    costUsd: u._sum.costUsd || 0,
    analysisCount: u._count.analysisId,
    model: u.model,
    period,
  }));
}

// ==================== REPOSITORY ACTIVITY METRICS ====================

export interface RepositoryActivityMetrics {
  projectId: string;
  projectName: string;
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  analysisCount: number;
  lastAnalysisAt?: Date;
}

/**
 * Get activity metrics per repository
 * Shows: findings count, severity breakdown, analysis count
 */
export async function getRepositoryActivityMetrics(): Promise<
  RepositoryActivityMetrics[]
> {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      analyses: {
        select: {
          id: true,
          createdAt: true,
          findings: {
            select: {
              severity: true,
            },
            where: {
              deletedAt: null,
            },
          },
        },
      },
    },
  });

  return projects.map((project) => {
    const allFindings = project.analyses.flatMap((a) => a.findings);
    const lastAnalysis = project.analyses.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0];

    return {
      projectId: project.id,
      projectName: project.name,
      totalFindings: allFindings.length,
      criticalFindings: allFindings.filter((f) => f.severity === 'CRITICAL')
        .length,
      highFindings: allFindings.filter((f) => f.severity === 'HIGH').length,
      mediumFindings: allFindings.filter((f) => f.severity === 'MEDIUM').length,
      lowFindings: allFindings.filter((f) => f.severity === 'LOW').length,
      analysisCount: project.analyses.length,
      lastAnalysisAt: lastAnalysis?.createdAt,
    };
  });
}

// ==================== MTTD METRICS ====================

export interface MTTDMetrics {
  severity: string;
  averageMttdHours: number;
  minMttdHours: number;
  maxMttdHours: number;
  sampleCount: number;
}

/**
 * Get Mean Time To Detection metrics
 * Shows: average time from commit to detection per severity level
 */
export async function getMTTDMetrics(): Promise<MTTDMetrics[]> {
  const findings = await prisma.finding.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      severity: true,
      createdAt: true,
      forensicEvents: {
        select: {
          timestamp: true,
        },
        orderBy: {
          timestamp: 'asc',
        },
        take: 1,
      },
    },
  });

  interface MTTDAccumulator {
    [severity: string]: {
      times: number[];
      count: number;
    };
  }

  const accumulated: MTTDAccumulator = {};

  for (const finding of findings) {
    if (finding.forensicEvents.length === 0) continue;

    const detectionTime =
      finding.createdAt.getTime() -
      finding.forensicEvents[0].timestamp.getTime();
    const detectionHours = detectionTime / (1000 * 60 * 60);

    if (!accumulated[finding.severity]) {
      accumulated[finding.severity] = { times: [], count: 0 };
    }

    accumulated[finding.severity].times.push(detectionHours);
    accumulated[finding.severity].count++;
  }

  return Object.entries(accumulated).map(([severity, data]) => ({
    severity,
    averageMttdHours:
      data.times.reduce((a, b) => a + b, 0) / data.times.length,
    minMttdHours: Math.min(...data.times),
    maxMttdHours: Math.max(...data.times),
    sampleCount: data.count,
  }));
}

// ==================== BURNDOWN METRICS ====================

export interface BurndownMetrics {
  date: string;
  detected: number;
  inReview: number;
  inCorrection: number;
  corrected: number;
  verified: number;
  falsePositives: number;
  closed: number;
}

/**
 * Get burndown metrics - Finding status progression over time
 * Shows: distribution of findings by status over the last 30 days
 */
export async function getBurndownMetrics(days = 30): Promise<
  BurndownMetrics[]
> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const findings = await prisma.finding.findMany({
    where: {
      deletedAt: null,
      createdAt: { gte: startDate },
    },
    select: {
      id: true,
      createdAt: true,
      statusHistory: {
        select: {
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  interface BurndownAccumulator {
    [date: string]: {
      detected: number;
      inReview: number;
      inCorrection: number;
      corrected: number;
      verified: number;
      falsePositives: number;
      closed: number;
    };
  }

  const accumulated: BurndownAccumulator = {};

  // Initialize all dates
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    accumulated[dateStr] = {
      detected: 0,
      inReview: 0,
      inCorrection: 0,
      corrected: 0,
      verified: 0,
      falsePositives: 0,
      closed: 0,
    };
  }

  // Distribute findings by their latest status and date of that status
  for (const finding of findings) {
    const dateStr = finding.createdAt.toISOString().split('T')[0];

    if (!accumulated[dateStr]) {
      accumulated[dateStr] = {
        detected: 0,
        inReview: 0,
        inCorrection: 0,
        corrected: 0,
        verified: 0,
        falsePositives: 0,
        closed: 0,
      };
    }

    const latestStatus = finding.statusHistory[0]?.status || 'DETECTED';

    switch (latestStatus) {
      case 'DETECTED':
        accumulated[dateStr].detected++;
        break;
      case 'IN_REVIEW':
        accumulated[dateStr].inReview++;
        break;
      case 'IN_CORRECTION':
        accumulated[dateStr].inCorrection++;
        break;
      case 'CORRECTED':
        accumulated[dateStr].corrected++;
        break;
      case 'VERIFIED':
        accumulated[dateStr].verified++;
        break;
      case 'FALSE_POSITIVE':
        accumulated[dateStr].falsePositives++;
        break;
      case 'CLOSED':
        accumulated[dateStr].closed++;
        break;
    }
  }

  // Convert to sorted array
  return Object.entries(accumulated)
    .map(([date, data]) => ({
      date,
      ...data,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// ==================== HELPER FUNCTIONS ====================

function getPeriodMs(period: string): number {
  switch (period) {
    case 'day':
      return 24 * 60 * 60 * 1000;
    case 'week':
      return 7 * 24 * 60 * 60 * 1000;
    case 'month':
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 30 * 24 * 60 * 60 * 1000;
  }
}

// ==================== PRICING MODELS ====================

/**
 * Token pricing per model/provider
 * Structure: { provider: { model: { input: price_per_1k_tokens, output: price_per_1k_tokens } } }
 *
 * COST COMPARISON (per 1M tokens):
 * ─────────────────────────────────
 * Anthropic Claude Sonnet:  $3.00 input  / $15.00 output
 * OpenAI GPT-4 Turbo:       $10.00 input / $30.00 output
 * LM Studio qwen2.5-coder:  $0.30 input  / $0.50 output  (estimated compute cost)
 *
 * TIME COMPARISON (per 1500 chunks, ~500KB code):
 * ────────────────────────────────────────────────
 * Anthropic Claude:         ~2-3 hours total
 * OpenAI GPT-4:            ~3-4 hours total
 * LM Studio qwen2.5:       ~15-20 hours total (7.5x slower)
 *
 * REAL COST ANALYSIS:
 * ──────────────────
 * qwen is CHEAPER in $$ but EXPENSIVE in TIME
 * - juice-shop (1500 chunks): $450 (anthropic) vs $45 (qwen) but 20hrs vs 3hrs
 * - For urgent scans: Use Anthropic
 * - For batch/overnight: Use qwen to save money
 * - For production: Anthropic + backup with qwen if timeout
 */
const PRICING_TABLE: Record<
  string,
  Record<string, { input: number; output: number }>
> = {
  anthropic: {
    'claude-3-5-sonnet': { input: 0.003, output: 0.015 }, // $3 per 1M input, $15 per 1M output
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 },
    default: { input: 0.003, output: 0.015 }, // Default to Sonnet pricing
  },
  openai: {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    default: { input: 0.01, output: 0.03 },
  },
  lmstudio: {
    // Local models - Estimated cost (infrastructure + compute time)
    // qwen2.5-coder: ~15min per chunk vs Anthropic ~2min
    // Estimated compute cost: $0.0003 per 1K tokens (very cheap, but shows real cost)
    // For comparison: Anthropic is $3/M input = $0.003 per 1K = 10x more expensive
    // BUT: qwen takes 7.5x longer, so real cost is 0.75x Anthropic
    'qwen2.5-coder-7b-instruct': { input: 0.0003, output: 0.0005 }, // $0.30 per 1M input, $0.50 per 1M output
    'mistral': { input: 0.0002, output: 0.0003 },
    'llama2': { input: 0.0002, output: 0.0003 },
    default: { input: 0.0003, output: 0.0005 },
  },
  ollama: {
    // Local models - Estimated cost (same as LM Studio)
    default: { input: 0.0003, output: 0.0005 },
  },
};

/**
 * Calculate cost for token usage based on model and provider
 * Returns cost in USD
 */
export function calculateTokenCost(
  inputTokens: number,
  outputTokens: number,
  provider: string = 'anthropic',
  model: string = 'claude-3-5-sonnet'
): number {
  try {
    const providerPricing = PRICING_TABLE[provider.toLowerCase()];
    if (!providerPricing) {
      logger.warn(`Unknown provider: ${provider}, defaulting to Anthropic pricing`);
      const anthropic =
        PRICING_TABLE['anthropic']['default'] ||
        PRICING_TABLE['anthropic']['claude-3-5-sonnet'];
      return (
        (inputTokens / 1000) * anthropic.input +
        (outputTokens / 1000) * anthropic.output
      );
    }

    const modelPricing =
      providerPricing[model.toLowerCase()] || providerPricing['default'];
    const inputCost = (inputTokens / 1000) * modelPricing.input;
    const outputCost = (outputTokens / 1000) * modelPricing.output;

    return parseFloat((inputCost + outputCost).toFixed(6)); // Round to 6 decimals
  } catch (error) {
    logger.error(`Error calculating token cost: ${error}`);
    return 0;
  }
}

/**
 * Record token usage for an analysis (supports partial recording)
 * Called after each agent completes OR after entire analysis completes
 *
 * NEW: Allows recording tokens even if analysis fails later
 * If stage is provided, records usage for that specific stage
 */
export async function recordTokenUsage(data: {
  analysisId: string;
  userId: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  provider: string;
  costUsd?: number;
  stage?: 'INSPECTOR' | 'DETECTIVE' | 'FISCAL'; // Optional: track which stage
}): Promise<void> {
  try {
    const totalTokens = data.inputTokens + data.outputTokens;

    // Calculate cost if not provided
    const costUsd =
      data.costUsd ?? calculateTokenCost(data.inputTokens, data.outputTokens, data.provider, data.model);

    await prisma.tokenUsage.create({
      data: {
        analysisId: data.analysisId,
        userId: data.userId,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        totalTokens,
        model: data.model,
        provider: data.provider,
        costUsd,
      },
    });

    const stageInfo = data.stage ? ` [${data.stage}]` : '';
    logger.info(
      `Token usage recorded${stageInfo}: ${data.analysisId} (${totalTokens} tokens, $${costUsd.toFixed(6)})`
    );
  } catch (error) {
    logger.error(`Error recording token usage: ${error}`);
  }
}

/**
 * Aggregate token usage for an analysis (sum across all stages)
 * Useful for displaying total cost in dashboards
 */
export async function getAnalysisTokenUsage(analysisId: string): Promise<{
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUsd: number;
}> {
  try {
    const usage = await prisma.tokenUsage.aggregate({
      where: { analysisId },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        costUsd: true,
      },
    });

    return {
      totalInputTokens: usage._sum.inputTokens || 0,
      totalOutputTokens: usage._sum.outputTokens || 0,
      totalTokens: usage._sum.totalTokens || 0,
      totalCostUsd: usage._sum.costUsd || 0,
    };
  } catch (error) {
    logger.error(`Error getting analysis token usage: ${error}`);
    return {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCostUsd: 0,
    };
  }
}
