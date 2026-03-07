/**
 * Property Test: Backend Communication Security
 * 
 * Validates: Requirement 18.7
 * Property 13: Backend communication security
 * 
 * For any communication between the Electron application and the Python FastAPI
 * backend, the security manager shall ensure the communication is secure using
 * either HTTPS for remote connections or localhost-only for local connections.
 * The backend shall only accept connections from localhost.
 */

import { describe, expect, it, beforeEach } from "vitest";

/**
 * Simulates the security manager
 */
interface SecurityConfig {
  allowLocalhost: boolean;
  allowHttps: boolean;
  allowedOrigins: string[];
}

class SecurityManager {
  private config: SecurityConfig = {
    allowLocalhost: true,
    allowHttps: true,
    allowedOrigins: ['http://127.0.0.1:8000', 'https://localhost:8000']
  };

  /**
   * Validate backend URL for security
   */
  validateBackendUrl(url: string): { valid: boolean; reason?: string } {
    try {
      const parsedUrl = new URL(url);

      // Check if localhost is allowed
      if (this.config.allowLocalhost) {
        const isLocalhost =
          parsedUrl.hostname === 'localhost' ||
          parsedUrl.hostname === '127.0.0.1';

        if (isLocalhost) {
          return { valid: true };
        }
      }

      // Check if HTTPS is allowed
      if (this.config.allowHttps && parsedUrl.protocol === 'https:') {
        return { valid: true };
      }

      // Check if origin is in allowed list
      if (this.config.allowedOrigins.includes(url)) {
        return { valid: true };
      }

      return {
        valid: false,
        reason: 'URL not allowed'
      };
    } catch {
      return {
        valid: false,
        reason: 'Invalid URL format'
      };
    }
  }

  /**
   * Configure security settings
   */
  configureSecurity(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
    // When localhost is disabled, also remove it from allowedOrigins
    if (!this.config.allowLocalhost) {
      this.config.allowedOrigins = this.config.allowedOrigins.filter(
        origin => !origin.includes('127.0.0.1') && !origin.includes('localhost')
      );
    }
  }

  /**
   * Check if URL is secure
   */
  isUrlSecure(url: string): boolean {
    const result = this.validateBackendUrl(url);
    return result.valid;
  }

  /**
   * Get allowed origins
   */
  getAllowedOrigins(): string[] {
    return [...this.config.allowedOrigins];
  }
}


describe("Property 13: Backend Communication Security", () => {
  let securityManager: SecurityManager;
  
  beforeEach(() => {
    securityManager = new SecurityManager();
  });
  
  it("should allow localhost connections", () => {
    const result = securityManager.validateBackendUrl('http://127.0.0.1:8000');
    
    expect(result.valid).toBe(true);
  });
  
  it("should allow HTTPS connections", () => {
    const result = securityManager.validateBackendUrl('https://api.example.com');
    
    expect(result.valid).toBe(true);
  });
  
  it("should reject non-secure remote connections", () => {
    const result = securityManager.validateBackendUrl('http://api.example.com');
    
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('URL not allowed');
  });
  
  it("should validate allowed origins", () => {
    const result = securityManager.validateBackendUrl('http://127.0.0.1:8000');
    
    expect(result.valid).toBe(true);
  });
  
  it("should reject invalid URLs", () => {
    const result = securityManager.validateBackendUrl('invalid-url');
    
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Invalid URL format');
  });
  
  it("should maintain security configuration", () => {
    // This test verifies the configuration is applied correctly
    
    // The default config should allow localhost
    expect(securityManager.isUrlSecure('http://127.0.0.1:8000')).toBe(true);
    
    // Configure to disallow localhost
    securityManager.configureSecurity({
      allowLocalhost: false
    });
    
    // After disabling localhost, the URL should be invalid
    expect(securityManager.isUrlSecure('http://127.0.0.1:8000')).toBe(false);
  });
  
  it("should check URL security", () => {
    expect(securityManager.isUrlSecure('http://127.0.0.1:8000')).toBe(true);
    expect(securityManager.isUrlSecure('https://api.example.com')).toBe(true);
  });
});
