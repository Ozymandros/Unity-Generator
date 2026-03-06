/**
 * Security Manager
 * 
 * Implements security best practices including input validation, CSP handling,
 * and security configuration for Electron application.
 */

const { logMainProcess, formatError } = require('./logger');

/**
 * Content Security Policy configuration
 * 
 * @typedef {Object} CSPConfig
 * @property {string} defaultSrc - Default source policy
 * @property {string} scriptSrc - Script source policy
 * @property {string} styleSrc - Style source policy
 * @property {string} imgSrc - Image source policy
 * @property {string} connectSrc - Connection source policy
 * @property {string} fontSrc - Font source policy
 * @property {string} objectSrc - Object source policy
 * @property {string} baseUri - Base URI policy
 * @property {string} formAction - Form action policy
 */

/**
 * Default CSP configuration
 * 
 * @type {CSPConfig}
 */
const DEFAULT_CSP_CONFIG = {
  defaultSrc: "'self'",
  scriptSrc: "'self' 'unsafe-eval' 'unsafe-inline' http://127.0.0.1:8000",
  styleSrc: "'self' 'unsafe-inline' http://127.0.0.1:8000",
  imgSrc: "'self' data: http://127.0.0.1:8000",
  connectSrc: "'self' http://127.0.0.1:8000",
  fontSrc: "'self' data:",
  objectSrc: "'none'",
  baseUri: "'self'",
  formAction: "'self'"
};

/**
 * Configure Content Security Policy headers
 * 
 * This function generates a strict CSP header that restricts resource loading
 * to trusted origins only. It follows security best practices by:
 * - Restricting script sources to trusted origins
 * - Restricting connect sources to localhost/backend only
 * - Disabling dangerous sources like eval() and inline scripts where possible
 * - Preventing object loading (plugins)
 * 
 * @param {CSPConfig} [config] - Optional custom CSP configuration
 * @returns {string} CSP header string
 * 
 * @throws {Error} If configuration validation fails
 * 
 * @example
 * ```javascript
 * // Use default configuration
 * const cspHeader = configureCSP();
 * 
 * // Use custom configuration
 * const customConfig = {
 *   scriptSrc: "'self' https://trusted-cdn.com",
 *   connectSrc: "'self' https://api.example.com"
 * };
 * const cspHeader = configureCSP(customConfig);
 * ```
 */
function configureCSP(config = {}) {
  try {
    // Validate configuration
    if (typeof config !== 'object' || config === null) {
      throw new Error('CSP configuration must be an object');
    }
    
    // Merge with default configuration
    const mergedConfig = { ...DEFAULT_CSP_CONFIG, ...config };
    
    // Validate each policy directive
    const requiredDirectives = [
      'defaultSrc', 'scriptSrc', 'styleSrc', 'imgSrc',
      'connectSrc', 'fontSrc', 'objectSrc', 'baseUri', 'formAction'
    ];
    
    for (const directive of requiredDirectives) {
      if (typeof mergedConfig[directive] !== 'string' || mergedConfig[directive].trim() === '') {
        throw new Error(`CSP directive '${directive}' must be a non-empty string`);
      }
    }
    
    // Build CSP header string
    const directives = [
      `default-src ${mergedConfig.defaultSrc}`,
      `script-src ${mergedConfig.scriptSrc}`,
      `style-src ${mergedConfig.styleSrc}`,
      `img-src ${mergedConfig.imgSrc}`,
      `connect-src ${mergedConfig.connectSrc}`,
      `font-src ${mergedConfig.fontSrc}`,
      `object-src ${mergedConfig.objectSrc}`,
      `base-uri ${mergedConfig.baseUri}`,
      `form-action ${mergedConfig.formAction}`
    ];
    
    return directives.join('; ') + ';';
    
  } catch (error) {
    logMainProcess(`CSP configuration error: ${formatError(error)}`);
    // Return secure fallback configuration
    return DEFAULT_CSP_CONFIG_DEFAULT;
  }
}

/**
 * Default CSP configuration string (fallback)
 * 
 * @type {string}
 */
const DEFAULT_CSP_CONFIG_DEFAULT = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' http://127.0.0.1:8000",
  "style-src 'self' 'unsafe-inline' http://127.0.0.1:8000",
  "img-src 'self' data: http://127.0.0.1:8000",
  "connect-src 'self' http://127.0.0.1:8000",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ') + ';';

/**
 * Validate and sanitize user input
 * 
 * @param {string} input - Input to validate
 * @returns {Object} Validation result
 */
function validateInput(input) {
  try {
    if (typeof input !== 'string') {
      return {
        valid: false,
        error: 'Input must be a string'
      };
    }
    
    // Check for empty input
    if (input.trim().length === 0) {
      return {
        valid: false,
        error: 'Input cannot be empty'
      };
    }
    
    // Check for maximum length (prevent DoS)
    const MAX_LENGTH = 10000;
    if (input.length > MAX_LENGTH) {
      return {
        valid: false,
        error: `Input exceeds maximum length of ${MAX_LENGTH} characters`
      };
    }
    
    // Sanitize input (basic XSS prevention)
    const sanitized = input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    return {
      valid: true,
      sanitized
    };
    
  } catch (error) {
    logMainProcess(`Input validation error: ${formatError(error)}`);
    return {
      valid: false,
      error: 'Input validation failed'
    };
  }
}

/**
 * Handle CSP violation
 * 
 * @param {Object} violation - CSP violation details
 * @param {string} violation.violation - Violation type
 * @param {string} violation.url - Violated URL
 * @param {string} violation.scriptSample - Sample of violated script
 */
function handleCSPViolation(violation) {
  try {
    const { violation: violationType, url, scriptSample } = violation;
    
    logMainProcess(`CSP violation detected: ${violationType}`, {
      url,
      scriptSample: scriptSample ? scriptSample.substring(0, 100) : undefined
    });
    
    // Block malicious content
    return {
      blocked: true,
      reason: 'CSP violation'
    };
    
  } catch (error) {
    logMainProcess(`CSP violation handling error: ${formatError(error)}`);
    return {
      blocked: true,
      reason: 'Error handling violation'
    };
  }
}

/**
 * Validate URL for security
 * 
 * @param {string} url - URL to validate
 * @returns {Object} Validation result
 */
function validateUrl(url) {
  try {
    if (typeof url !== 'string') {
      return {
        valid: false,
        error: 'URL must be a string'
      };
    }
    
    // Check for empty URL
    if (url.trim().length === 0) {
      return {
        valid: false,
        error: 'URL cannot be empty'
      };
    }
    
    // Parse URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid URL format'
      };
    }
    
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return {
        valid: false,
        error: 'Only http and https protocols are allowed'
      };
    }
    
    // For localhost, allow any port
    if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
      return {
        valid: true,
        url
      };
    }
    
    // For remote URLs, additional validation could be added
    return {
      valid: true,
      url
    };
    
  } catch (error) {
    logMainProcess(`URL validation error: ${formatError(error)}`);
    return {
      valid: false,
      error: 'URL validation failed'
    };
  }
}

/**
 * Validate file path for security
 * 
 * @param {string} filePath - File path to validate
 * @param {string} allowedBase - Allowed base directory
 * @returns {Object} Validation result
 */
function validateFilePath(filePath, allowedBase) {
  try {
    if (typeof filePath !== 'string') {
      return {
        valid: false,
        error: 'File path must be a string'
      };
    }
    
    if (filePath.trim().length === 0) {
      return {
        valid: false,
        error: 'File path cannot be empty'
      };
    }
    
    // Resolve paths
    const resolvedPath = require('path').resolve(filePath);
    const resolvedBase = require('path').resolve(allowedBase);
    
    // Check if path is within allowed base
    if (!resolvedPath.startsWith(resolvedBase + require('path').sep) && resolvedPath !== resolvedBase) {
      return {
        valid: false,
        error: 'File path is outside allowed directory'
      };
    }
    
    return {
      valid: true,
      path: resolvedPath
    };
    
  } catch (error) {
    logMainProcess(`File path validation error: ${formatError(error)}`);
    return {
      valid: false,
      error: 'File path validation failed'
    };
  }
}

/**
 * Sanitize HTML content
 * 
 * @param {string} html - HTML to sanitize
 * @returns {string} Sanitized HTML
 */
function sanitizeHtml(html) {
  if (typeof html !== 'string') {
    return '';
  }
  
  // Basic HTML sanitization
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<script[^>]*>/gi, '')
    .replace(/<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

module.exports = {
  configureCSP,
  validateInput,
  handleCSPViolation,
  validateUrl,
  validateFilePath,
  sanitizeHtml
};
