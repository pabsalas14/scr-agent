import { cacheService } from './cache.service';

export interface AnomalyProfile {
  metric: string;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  dataPoints: number;
}

export interface DetectedAnomaly {
  id: string;
  metric: string;
  value: number;
  expectedRange: [number, number];
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timestamp: Date;
  description: string;
}

class AnomalyDetectionService {
  private profiles: Map<string, AnomalyProfile> = new Map();

  /**
   * Calculates basic statistics for a dataset
   */
  private calculateStats(values: number[]): Omit<AnomalyProfile, 'metric'> {
    if (values.length === 0) {
      return { mean: 0, stdDev: 0, min: 0, max: 0, dataPoints: 0 };
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      mean,
      stdDev,
      min,
      max,
      dataPoints: values.length,
    };
  }

  /**
   * Train baseline model from historical data
   */
  trainBaseline(metric: string, historicalValues: number[]): AnomalyProfile {
    const stats = this.calculateStats(historicalValues);
    const profile: AnomalyProfile = {
      metric,
      ...stats,
    };

    this.profiles.set(metric, profile);
    cacheService.set(`anomaly-profile-${metric}`, profile, 24 * 60 * 60 * 1000); // 24h cache

    return profile;
  }

  /**
   * Detect anomalies using Z-score method
   */
  detectAnomalies(metric: string, value: number): DetectedAnomaly | null {
    const profile = this.profiles.get(metric);
    if (!profile || profile.stdDev === 0) {
      return null;
    }

    // Z-score calculation
    const zScore = Math.abs((value - profile.mean) / profile.stdDev);

    if (zScore < 2) {
      return null; // Normal behavior
    }

    // Determine severity based on Z-score
    let severity: 'low' | 'medium' | 'high' | 'critical';
    let confidence: number;

    if (zScore < 2.5) {
      severity = 'low';
      confidence = 0.6;
    } else if (zScore < 3) {
      severity = 'medium';
      confidence = 0.75;
    } else if (zScore < 3.5) {
      severity = 'high';
      confidence = 0.85;
    } else {
      severity = 'critical';
      confidence = 0.95;
    }

    const expectedRange: [number, number] = [
      profile.mean - 2 * profile.stdDev,
      profile.mean + 2 * profile.stdDev,
    ];

    return {
      id: `${metric}-${Date.now()}`,
      metric,
      value,
      expectedRange,
      severity,
      confidence,
      timestamp: new Date(),
      description: this.generateDescription(metric, value, profile, severity),
    };
  }

  /**
   * Detect seasonal anomalies
   */
  detectSeasonalAnomaly(
    metric: string,
    currentValue: number,
    seasonalValues: number[],
    threshold: number = 2
  ): DetectedAnomaly | null {
    const seasonalStats = this.calculateStats(seasonalValues);
    const seasonalMean = seasonalStats.mean;
    const seasonalStdDev = seasonalStats.stdDev;

    if (seasonalStdDev === 0 || !seasonalMean) {
      return null;
    }

    const deviation = Math.abs(currentValue - seasonalMean) / seasonalStdDev;

    if (deviation < threshold) {
      return null;
    }

    const severity: 'low' | 'medium' | 'high' | 'critical' =
      deviation < 2.5 ? 'low' : deviation < 3.5 ? 'medium' : deviation < 4.5 ? 'high' : 'critical';

    const expectedRange: [number, number] = [
      seasonalMean - threshold * seasonalStdDev,
      seasonalMean + threshold * seasonalStdDev,
    ];

    return {
      id: `${metric}-seasonal-${Date.now()}`,
      metric,
      value: currentValue,
      expectedRange,
      severity,
      confidence: Math.min(0.95, deviation / 5),
      timestamp: new Date(),
      description: `Anomalía estacional detectada. Valor actual (${currentValue.toFixed(2)}) desviación de la media estacional (${seasonalMean.toFixed(2)})`,
    };
  }

  /**
   * Detect trend-based anomalies
   */
  detectTrendAnomaly(metric: string, values: number[], windowSize: number = 5): DetectedAnomaly | null {
    if (values.length < windowSize) {
      return null;
    }

    // Calculate trend using simple linear regression
    const recentValues = values.slice(-windowSize);
    const n = recentValues.length;
    const xValues = Array.from({ length: n }, (_, i) => i);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = recentValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * (recentValues[i] ?? 0), 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) {
      return null;
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // Predict next value
    const predictedNext = intercept + slope * (n + 1);

    // Check if actual trend is accelerating
    const lastValue = recentValues[n - 1] ?? 0;
    const prevValue = recentValues[n - 2] ?? 0;
    const acceleration = Math.abs(slope) > Math.abs((lastValue - prevValue) * 2);

    if (!acceleration) {
      return null;
    }

    const severity: 'low' | 'medium' | 'high' | 'critical' =
      Math.abs(slope) < 5 ? 'low' : Math.abs(slope) < 10 ? 'medium' : Math.abs(slope) < 20 ? 'high' : 'critical';

    return {
      id: `${metric}-trend-${Date.now()}`,
      metric,
      value: recentValues[n - 1] ?? 0,
      expectedRange: [predictedNext - 5, predictedNext + 5],
      severity,
      confidence: 0.7,
      timestamp: new Date(),
      description: `Anomalía de tendencia detectada. Pendiente: ${slope.toFixed(2)} por período. Cambio acelerado en el comportamiento.`,
    };
  }

  /**
   * Generate human-readable description
   */
  private generateDescription(
    metric: string,
    value: number,
    profile: AnomalyProfile,
    severity: string
  ): string {
    const deviation = Math.abs(value - profile.mean);
    const percentage = ((deviation / profile.mean) * 100).toFixed(1);

    return `La métrica "${metric}" está ${percentage}% fuera del rango normal. Valor: ${value.toFixed(2)}, Esperado: ${profile.mean.toFixed(2)} ± ${profile.stdDev.toFixed(2)}`;
  }

  /**
   * Get profile for metric
   */
  getProfile(metric: string): AnomalyProfile | undefined {
    return this.profiles.get(metric);
  }

  /**
   * Clear all profiles
   */
  clearProfiles(): void {
    this.profiles.clear();
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): AnomalyProfile[] {
    return Array.from(this.profiles.values());
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
