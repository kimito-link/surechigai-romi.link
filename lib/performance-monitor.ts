/**
 * Performance Monitor
 * 画面のローディング時間を計測するユーティリティ
 * 
 * v6.59: スケルトンローディング改善のため追加
 */

interface PerformanceMetric {
  screenName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  hasCache: boolean;
  isFirstLoad: boolean;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = __DEV__;

  /**
   * 画面のローディング開始を記録
   */
  startMeasure(screenName: string, hasCache: boolean, isFirstLoad: boolean) {
    if (!this.enabled) return;
    
    this.metrics.set(screenName, {
      screenName,
      startTime: Date.now(),
      hasCache,
      isFirstLoad,
    });
  }

  /**
   * 画面のローディング終了を記録
   */
  endMeasure(screenName: string) {
    if (!this.enabled) return;
    
    const metric = this.metrics.get(screenName);
    if (!metric) return;

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // 1秒以上かかった場合は警告
    if (duration > 1000) {
      console.warn(`[Performance] ${screenName} took ${duration}ms (>1s target)`);
    } else {
      console.log(`[Performance] ${screenName} loaded in ${duration}ms`);
    }

    // キャッシュの有効性をチェック
    if (metric.hasCache && duration > 100) {
      console.warn(`[Performance] ${screenName} has cache but took ${duration}ms (should be <100ms)`);
    }

    return metric;
  }

  /**
   * 全ての計測結果を取得
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  /**
   * 計測結果をクリア
   */
  clear() {
    this.metrics.clear();
  }

  /**
   * 計測結果のサマリーを取得
   */
  getSummary() {
    const metrics = this.getMetrics();
    if (metrics.length === 0) return null;

    const total = metrics.length;
    const withCache = metrics.filter(m => m.hasCache).length;
    const firstLoads = metrics.filter(m => m.isFirstLoad).length;
    const avgDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / total;
    const maxDuration = Math.max(...metrics.map(m => m.duration || 0));
    const over1s = metrics.filter(m => (m.duration || 0) > 1000).length;

    return {
      total,
      withCache,
      firstLoads,
      avgDuration: Math.round(avgDuration),
      maxDuration,
      over1s,
      metrics,
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * React Hook for performance measurement
 */
export function usePerformanceMonitor(
  screenName: string,
  hasCache: boolean,
  isLoading: boolean,
  isFirstLoad: boolean
) {
  const [measured, setMeasured] = React.useState(false);

  React.useEffect(() => {
    if (isLoading && !measured) {
      performanceMonitor.startMeasure(screenName, hasCache, isFirstLoad);
      setMeasured(true);
    }
  }, [screenName, hasCache, isLoading, isFirstLoad, measured]);

  React.useEffect(() => {
    if (!isLoading && measured) {
      performanceMonitor.endMeasure(screenName);
    }
  }, [screenName, isLoading, measured]);
}

// React import for the hook
import React from "react";
