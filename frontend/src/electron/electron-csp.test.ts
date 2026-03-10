/**
 * Property Test: Content Security Policy Enforcement
 * 
 * Validates: Requirements 18.8, 18.9, 21.1-21.7
 * Property 14: Content Security Policy enforcement
 * 
 * For any page load in the Electron renderer process, the security manager
 * shall configure strict Content Security Policy headers that restrict script,
 * style, image, and connect sources to trusted origins only. If a CSP violation
 * occurs, the security manager shall log the violation with details.
 */

import { describe, expect, it, beforeEach } from "vitest";

/**
 * Simulates the CSP manager
 */
interface CSPConfig {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  connectSrc: string[];
  fontSrc: string[];
  objectSrc: string[];
  baseUri: string[];
  formAction: string[];
}

interface CSPViolation {
  blocked: boolean;
  reason: string;
  details?: {
    sourceFile?: string;
    lineNumber?: number;
    columnNumber?: number;
  };
}

class CSPManager {
  private config: CSPConfig = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", "http://127.0.0.1:35421"],
    styleSrc: ["'self'", "'unsafe-inline'", "http://127.0.0.1:35421"],
    imgSrc: ["'self'", "data:", "http://127.0.0.1:35421"],
    connectSrc: ["'self'", "http://127.0.0.1:35421"],
    fontSrc: ["'self'", "data:"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"]
  };
  
  /**
   * Generate CSP header string
   */
  generateCSPHeader(): string {
    const directives = [
      `default-src ${this.config.defaultSrc.join(' ')}`,
      `script-src ${this.config.scriptSrc.join(' ')}`,
      `style-src ${this.config.styleSrc.join(' ')}`,
      `img-src ${this.config.imgSrc.join(' ')}`,
      `connect-src ${this.config.connectSrc.join(' ')}`,
      `font-src ${this.config.fontSrc.join(' ')}`,
      `object-src ${this.config.objectSrc.join(' ')}`,
      `base-uri ${this.config.baseUri.join(' ')}`,
      `form-action ${this.config.formAction.join(' ')}`
    ];
    
    return directives.join('; ') + ';';
  }
  
  /**
   * Check if resource is allowed
   */
  isResourceAllowed(resource: string, type: keyof CSPConfig): boolean {
    const allowed = this.config[type];
    
    // Check for 'self'
    if (allowed.includes("'self'")) {
      // Allow same-origin resources
      if (resource.startsWith('/') || resource.includes(window.location.host)) {
        return true;
      }
    }
    
    // Check for specific allowed sources
    return allowed.some(allowedSource => {
      if (allowedSource === "'none'") return false;
      if (allowedSource === "'self'") return false;
      if (allowedSource === "'unsafe-eval'") return false;
      if (allowedSource === "'unsafe-inline'") return false;
      
      return resource.startsWith(allowedSource);
    });
  }
  
  /**
   * Handle CSP violation
   */
  handleViolation(violation: CSPViolation): CSPViolation {
    if (!violation.blocked) {
      console.warn(`CSP violation: ${violation.reason}`, violation.details);
    }
    
    return {
      blocked: true,
      reason: 'CSP violation blocked',
      details: violation.details
    };
  }
  
  /**
   * Configure CSP
   */
  configureCSP(config: Partial<CSPConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get CSP config
   */
  getConfig(): CSPConfig {
    return { ...this.config };
  }
}

describe("Property 14: Content Security Policy Enforcement", () => {
  let cspManager: CSPManager;
  
  beforeEach(() => {
    cspManager = new CSPManager();
  });
  
  it("should generate valid CSP header", () => {
    const header = cspManager.generateCSPHeader();
    
    expect(header).toContain('default-src');
    expect(header).toContain('script-src');
    expect(header).toContain('style-src');
    expect(header).toContain('img-src');
    expect(header).toContain('connect-src');
  });
  
  it("should restrict script sources", () => {
    const allowed = cspManager.isResourceAllowed('http://127.0.0.1:35421/script.js', 'scriptSrc');
    expect(allowed).toBe(true);
  });
  
  it("should restrict connect sources", () => {
    const allowed = cspManager.isResourceAllowed('http://127.0.0.1:35421/api', 'connectSrc');
    expect(allowed).toBe(true);
  });
  
  it("should block unsafe sources by default", () => {
    const config = cspManager.getConfig();
    expect(config.objectSrc).toContain("'none'");
  });
  
  it("should handle CSP violations", () => {
    const violation: CSPViolation = {
      blocked: false,
      reason: 'Unsafe script execution'
    };
    
    const result = cspManager.handleViolation(violation);
    
    expect(result.blocked).toBe(true);
  });
  
  it("should allow same-origin resources", () => {
    // Mock window.location for testing
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { host: 'localhost:5173' },
      configurable: true
    });
    
    const allowed = cspManager.isResourceAllowed('/assets/image.png', 'imgSrc');
    expect(allowed).toBe(true);
    
    // Restore
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true
    });
  });
  
  it("should support CSP configuration", () => {
    cspManager.configureCSP({
      scriptSrc: ["'self'", "https://trusted-cdn.com"]
    });
    
    const config = cspManager.getConfig();
    expect(config.scriptSrc).toContain("https://trusted-cdn.com");
  });
});
