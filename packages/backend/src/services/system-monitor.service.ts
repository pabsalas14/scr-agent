/**
 * System Monitor Service (PHASE 4.1)
 * Provides real-time server metrics for monitoring dashboard
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import { logger } from './logger.service';

const execPromise = promisify(exec);

export interface SystemMetrics {
  cpu: {
    usage: number; // 0-100
    cores: number;
    model: string;
  };
  memory: {
    usage: number; // 0-100
    usedGb: number;
    totalGb: number;
  };
  disk: {
    usage: number; // 0-100
    usedGb: number;
    totalGb: number;
  };
  uptime: number; // seconds
  loadAverage: number[];
  timestamp: Date;
}

/**
 * Get CPU metrics
 */
export async function getCPUMetrics(): Promise<{
  usage: number;
  cores: number;
  model: string;
}> {
  try {
    const cpus = os.cpus();
    const model = cpus[0]?.model || 'Unknown';

    // Calculate CPU usage (simplified)
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~((100 * idle) / total);

    return {
      usage: Math.min(100, Math.max(0, usage)),
      cores: cpus.length,
      model,
    };
  } catch (error) {
    logger.warn(`Failed to get CPU metrics: ${error}`);
    return {
      usage: 0,
      cores: os.cpus().length,
      model: 'Unknown',
    };
  }
}

/**
 * Get memory metrics
 */
export function getMemoryMetrics(): {
  usage: number;
  usedGb: number;
  totalGb: number;
} {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      usage: (usedMemory / totalMemory) * 100,
      usedGb: usedMemory / (1024 * 1024 * 1024),
      totalGb: totalMemory / (1024 * 1024 * 1024),
    };
  } catch (error) {
    logger.warn(`Failed to get memory metrics: ${error}`);
    return {
      usage: 0,
      usedGb: 0,
      totalGb: 0,
    };
  }
}

/**
 * Get disk metrics (requires system command)
 */
export async function getDiskMetrics(): Promise<{
  usage: number;
  usedGb: number;
  totalGb: number;
}> {
  try {
    // Try to get disk usage using df command
    const { stdout } = await execPromise('df -B1 / | tail -1', { timeout: 5000 });

    const parts = stdout.split(/\s+/);
    if (parts.length >= 4) {
      const total = parseInt(parts[1], 10);
      const used = parseInt(parts[2], 10);
      const usage = (used / total) * 100;

      return {
        usage: Math.min(100, usage),
        usedGb: used / (1024 * 1024 * 1024),
        totalGb: total / (1024 * 1024 * 1024),
      };
    }
  } catch (error) {
    logger.warn(`Failed to get disk metrics: ${error}`);
  }

  // Fallback
  return {
    usage: 0,
    usedGb: 0,
    totalGb: 0,
  };
}

/**
 * Get system uptime
 */
export function getUptime(): number {
  return os.uptime();
}

/**
 * Get load average
 */
export function getLoadAverage(): number[] {
  return os.loadavg();
}

/**
 * Get comprehensive system metrics
 */
export async function getSystemMetrics(): Promise<SystemMetrics> {
  try {
    const [cpu, memory, disk] = await Promise.all([
      getCPUMetrics(),
      Promise.resolve(getMemoryMetrics()),
      getDiskMetrics(),
    ]);

    return {
      cpu,
      memory,
      disk,
      uptime: getUptime(),
      loadAverage: getLoadAverage(),
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error(`Error getting system metrics: ${error}`);
    throw error;
  }
}

/**
 * Format uptime as human-readable string
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || '< 1m';
}

/**
 * Check if system metrics are healthy
 */
export function isHealthy(metrics: SystemMetrics): {
  healthy: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (metrics.cpu.usage > 80) {
    warnings.push('High CPU usage');
  }

  if (metrics.memory.usage > 85) {
    warnings.push('High memory usage');
  }

  if (metrics.disk.usage > 90) {
    warnings.push('High disk usage');
  }

  if (metrics.loadAverage[0] > metrics.cpu.cores * 2) {
    warnings.push('High load average');
  }

  return {
    healthy: warnings.length === 0,
    warnings,
  };
}
