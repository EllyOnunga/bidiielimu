import React from 'react';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure function execution time
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration);
      throw error;
    }
  }

  // Record custom metrics
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms`);
    }
  }

  // Get metrics summary
  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    for (const [name, values] of this.metrics.entries()) {
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        result[name] = {
          avg: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    }

    return result;
  }

  // Monitor React component performance
  monitorComponent(Component: React.ComponentType<any>, componentName: string) {
    return (props: any) => {
      const startTime = React.useRef<number>(undefined);

      React.useLayoutEffect(() => {
        startTime.current = performance.now();
      });

      React.useEffect(() => {
        if (startTime.current) {
          const duration = performance.now() - startTime.current;
          this.recordMetric(`component_${componentName}_render`, duration);
        }
      });

      return React.createElement(Component as any, props);
    };
  }

  // Monitor API calls
  monitorAPI(): void {
    // Monkey patch fetch for API monitoring
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        this.recordMetric('api_request', duration);

        if (response.status >= 400) {
          this.recordMetric('api_error', duration);
        }

        return response;
      } catch (error) {
        const duration = performance.now() - start;
        this.recordMetric('api_network_error', duration);
        throw error;
      }
    };
  }

  // Web Vitals monitoring
  monitorWebVitals(): void {
    // CLS - Cumulative Layout Shift
    let clsValue = 0;
    const clsEntries: PerformanceEntry[] = [];

    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          clsEntries.push(entry);
        }
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Report CLS on page unload
    window.addEventListener('beforeunload', () => {
      this.recordMetric('web_vitals_cls', clsValue);
    });

    // FID - First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric('web_vitals_fid', (entry as any).processingStart - entry.startTime);
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // LCP - Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('web_vitals_lcp', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  // Memory usage monitoring
  monitorMemory(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric('memory_used', memory.usedJSHeapSize / 1024 / 1024);
        this.recordMetric('memory_total', memory.totalJSHeapSize / 1024 / 1024);
        this.recordMetric('memory_limit', memory.jsHeapSizeLimit / 1024 / 1024);
      }, 30000); // Every 30 seconds
    }
  }

  // Initialize all monitoring
  init(): void {
    this.monitorAPI();
    this.monitorWebVitals();
    this.monitorMemory();

    // Report metrics to server periodically
    setInterval(() => {
      this.reportMetrics();
    }, 60000); // Every minute
  }

  // Report metrics to backend
  private async reportMetrics(): Promise<void> {
    const metrics = this.getMetrics();
    if (Object.keys(metrics).length === 0) return;

    try {
      await fetch('/api/v1/analytics/frontend-metrics/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.warn('Failed to report frontend metrics:', error);
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();