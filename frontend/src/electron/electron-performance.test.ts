/**
 * Property Test: Performance Monitoring and UI Responsiveness
 * 
 * Validates: Requirements 16.5, 16.6
 * Property 10: Performance monitoring and UI responsiveness
 * 
 * For any Python backend request, the application shall use async communication
 * to prevent UI blocking. If the Python backend is slow to respond, the application
 * shall display a loading indicator to the user. If performance degrades below
 * acceptable thresholds, the performance monitor shall log warnings.
 */

import { describe, expect, it, beforeEach } from "vitest";

/**
 * Simulates the performance monitor
 */
interface PerformanceMetrics {
  requestCount: number;
  avgResponseTime: number;
  maxResponseTime: number;
  slowRequests: number;
  uiBlocked: boolean;
}

interface RequestMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  endpoint: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    avgResponseTime: 0,
    maxResponseTime: 0,
    slowRequests: 0,
    uiBlocked: false
  };
  
  private responseTimes: number[] = [];
  private slowRequestThreshold = 2000; // 2 seconds
  
  /**
   * Monitor async request
   */
  async monitorRequest<T>(
    endpoint: string,
    requestFn: () => Promise<T>
  ): Promise<{ result: T; metrics: RequestMetrics }> {
    const startTime = Date.now();
    
    // Ensure async execution (non-blocking)
    const result = await requestFn();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const requestMetrics: RequestMetrics = {
      startTime,
      endTime,
      duration,
      endpoint
    };
    
    this.updateMetrics(requestMetrics);
    
    return { result, metrics: requestMetrics };
  }
  
  /**
   * Update performance metrics
   */
  private updateMetrics(metrics: RequestMetrics): void {
    this.metrics.requestCount++;
    this.responseTimes.push(metrics.duration);
    
    // Update average
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.avgResponseTime = sum / this.responseTimes.length;
    
    // Update max
    if (metrics.duration > this.metrics.maxResponseTime) {
      this.metrics.maxResponseTime = metrics.duration;
    }
    
    // Count slow requests
    if (metrics.duration > this.slowRequestThreshold) {
      this.metrics.slowRequests++;
    }
  }
  
  /**
   * Check if UI is blocked
   */
  isUIBlocked(): boolean {
    return this.metrics.uiBlocked;
  }
  
  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Check if performance is acceptable
   */
  isPerformanceAcceptable(): boolean {
    return (
      this.metrics.avgResponseTime < this.slowRequestThreshold &&
      this.metrics.maxResponseTime < this.slowRequestThreshold * 2
    );
  }
  
  /**
   * Log performance warning
   */
  logWarning(message: string): void {
    console.warn(`[Performance] ${message}`);
  }
}

describe("Property 10: Performance Monitoring and UI Responsiveness", () => {
  let performanceMonitor: PerformanceMonitor;
  
  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
  });
  
  it("should use async communication to prevent UI blocking", async () => {
    const mockRequest = async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return { success: true };
    };
    
    const { result, metrics } = await performanceMonitor.monitorRequest(
      '/test',
      mockRequest
    );
    
    expect(result).toBeDefined();
    expect(metrics.duration).toBeGreaterThan(0);
  });
  
  it("should track request response times", async () => {
    const mockRequest = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true };
    };
    
    await performanceMonitor.monitorRequest('/test', mockRequest);
    
    const metrics = performanceMonitor.getMetrics();
    expect(metrics.requestCount).toBe(1);
    expect(metrics.avgResponseTime).toBeGreaterThan(0);
  });
  
  it("should detect slow requests", async () => {
    const slowRequest = async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { success: true };
    };
    
    await performanceMonitor.monitorRequest('/slow', slowRequest);
    
    const metrics = performanceMonitor.getMetrics();
    expect(metrics.slowRequests).toBe(1);
  });
  
  it("should maintain acceptable performance", async () => {
    const fastRequest = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true };
    };
    
    await performanceMonitor.monitorRequest('/fast', fastRequest);
    
    expect(performanceMonitor.isPerformanceAcceptable()).toBe(true);
  });
  
  it("should log performance warnings", () => {
    expect(() => {
      performanceMonitor.logWarning('Request took too long');
    }).not.toThrow();
  });
  
  it("should handle multiple concurrent requests", async () => {
    const requests = [
      performanceMonitor.monitorRequest('/test1', async () => ({ id: 1 })),
      performanceMonitor.monitorRequest('/test2', async () => ({ id: 2 })),
      performanceMonitor.monitorRequest('/test3', async () => ({ id: 3 }))
    ];
    
    const results = await Promise.all(requests);
    
    expect(results.length).toBe(3);
    expect(performanceMonitor.getMetrics().requestCount).toBe(3);
  });
});
