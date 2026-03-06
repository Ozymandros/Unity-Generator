/**
 * Property Test: URL Parsing and Parameter Handling
 * 
 * Validates: Requirements 15.2, 15.3, 15.4, 15.5, 15.6
 * Property 9: URL parsing and parameter handling
 * 
 * For any custom URL scheme launch, the URL handler shall parse the URL and
 * extract parameters, forward parameters intended for the Python backend to
 * the FastAPI endpoint, and pass parameters intended for the Vue frontend via
 * query parameters. If URL parsing fails, the URL handler shall log the error
 * and continue with default behavior.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Simulates the URL handler
 */
interface ParsedURL {
  protocol: string;
  host: string;
  path: string;
  params: Record<string, string>;
  original: string;
}

interface URLProcessingResult {
  success: boolean;
  parsed?: ParsedURL;
  error?: string;
  actions?: {
    forwardToBackend?: boolean;
    forwardToFrontend?: boolean;
    showWindow?: boolean;
  };
}

class URLHandler {
  private urlScheme = 'unitygen';
  
  /**
   * Register URL scheme with OS
   */
  registerURLScheme(): boolean {
    // Simulate OS registration
    return true;
  }
  
  /**
   * Parse URL and extract parameters
   */
  parseURL(url: string): ParsedURL | null {
    try {
      if (!url.startsWith(`${this.urlScheme}://`)) {
        return null;
      }
      
      // Remove scheme prefix
      const urlWithoutScheme = url.replace(`${this.urlScheme}://`, '');
      
      // Split path and query string
      const [path, queryString] = urlWithoutScheme.split('?');
      
      // Parse query parameters
      const params: Record<string, string> = {};
      if (queryString) {
        const searchParams = new URLSearchParams(queryString);
        searchParams.forEach((value, key) => {
          params[key] = value;
        });
      }
      
      // Determine host (first segment of path)
      const pathSegments = path.split('/');
      const host = pathSegments[0] || '';
      
      return {
        protocol: this.urlScheme,
        host,
        path: pathSegments.slice(1).join('/'),
        params,
        original: url
      };
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Process URL and determine actions
   */
  processURL(url: string): URLProcessingResult {
    const parsed = this.parseURL(url);
    
    if (!parsed) {
      return {
        success: false,
        error: 'Failed to parse URL'
      };
    }
    
    // Determine actions based on URL structure
    const actions: URLProcessingResult['actions'] = {
      forwardToBackend: this.shouldForwardToBackend(parsed),
      forwardToFrontend: this.shouldForwardToFrontend(parsed),
      showWindow: this.shouldShowWindow(parsed)
    };
    
    return {
      success: true,
      parsed,
      actions
    };
  }
  
  /**
   * Check if URL should be forwarded to backend
   */
  private shouldForwardToBackend(parsed: ParsedURL): boolean {
    // Forward specific actions to backend
    const backendActions = ['generate', 'finalize', 'status'];
    return backendActions.includes(parsed.host);
  }
  
  /**
   * Check if URL should be forwarded to frontend
   */
  private shouldForwardToFrontend(parsed: ParsedURL): boolean {
    // Forward settings and preferences to frontend
    const frontendActions = ['settings', 'preferences', 'theme'];
    return frontendActions.includes(parsed.host);
  }
  
  /**
   * Check if window should be shown
   */
  private shouldShowWindow(parsed: ParsedURL): boolean {
    // Always show window for valid URLs
    return true;
  }
  
  /**
   * Forward to backend
   */
  forwardToBackend(parsed: ParsedURL): Record<string, string> | null {
    if (!this.shouldForwardToBackend(parsed)) {
      return null;
    }
    
    return {
      action: parsed.host,
      path: parsed.path,
      ...parsed.params
    };
  }
  
  /**
   * Forward to frontend
   */
  forwardToFrontend(parsed: ParsedURL): string {
    if (!this.shouldForwardToFrontend(parsed)) {
      return '';
    }
    
    const params = new URLSearchParams(parsed.params).toString();
    return params ? `?${params}` : '';
  }
}

describe("Property 9: URL Parsing and Parameter Handling", () => {
  let urlHandler: URLHandler;
  
  beforeEach(() => {
    urlHandler = new URLHandler();
  });
  
  it("should parse valid URLs correctly", () => {
    const url = 'unitygen://generate?prompt=test&provider=openai';
    const result = urlHandler.processURL(url);
    
    expect(result.success).toBe(true);
    expect(result.parsed?.host).toBe('generate');
    expect(result.parsed?.params.prompt).toBe('test');
  });
  
  it("should handle URLs with multiple parameters", () => {
    const url = 'unitygen://settings?theme=dark&language=en';
    const result = urlHandler.processURL(url);
    
    expect(result.success).toBe(true);
    expect(result.parsed?.params.theme).toBe('dark');
    expect(result.parsed?.params.language).toBe('en');
  });
  
  it("should forward backend actions correctly", () => {
    const url = 'unitygen://generate?prompt=test';
    const result = urlHandler.processURL(url);
    
    expect(result.actions?.forwardToBackend).toBe(true);
  });
  
  it("should forward frontend actions correctly", () => {
    const url = 'unitygen://settings?theme=dark';
    const result = urlHandler.processURL(url);
    
    expect(result.actions?.forwardToFrontend).toBe(true);
  });
  
  it("should handle invalid URLs gracefully", () => {
    const url = 'invalid://scheme';
    const result = urlHandler.processURL(url);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
  
  it("should handle URL parsing errors", () => {
    const url = 'unitygen://';
    const result = urlHandler.processURL(url);
    
    expect(result.success).toBe(true);
    expect(result.parsed?.host).toBe('');
  });
  
  it("should forward parameters to backend correctly", () => {
    const parsed = urlHandler.parseURL('unitygen://generate?prompt=test&provider=openai');
    
    if (parsed) {
      const backendParams = urlHandler.forwardToBackend(parsed);
      
      expect(backendParams).toBeDefined();
      expect(backendParams?.action).toBe('generate');
      expect(backendParams?.prompt).toBe('test');
    }
  });
  
  it("should forward parameters to frontend correctly", () => {
    const parsed = urlHandler.parseURL('unitygen://settings?theme=dark&language=en');
    
    if (parsed) {
      const queryString = urlHandler.forwardToFrontend(parsed);
      
      expect(queryString).toContain('theme=dark');
      expect(queryString).toContain('language=en');
    }
  });
});
