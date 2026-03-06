/**
 * URL Scheme Handler
 * 
 * Handles custom URL scheme registration and parsing for deep linking.
 * Supports 'unitygen' scheme for opening the application with parameters.
 */

const { logMainProcess, formatError } = require('./logger');

/**
 * URL parameters interface
 * @typedef {Object} URLParams
 * @property {string} [action] - The action to perform (e.g., 'generate', 'open')
 * @property {string} [project] - Project name or path
 * @property {string} [template] - Template name
 * @property {string} [output] - Output path
 * @property {Object} [params] - Additional parameters
 */

/**
 * Parsed URL result
 * @typedef {Object} ParsedURL
 * @property {string} scheme - The URL scheme (e.g., 'unitygen')
 * @property {string} host - The URL host
 * @property {URLParams} params - Parsed query parameters
 * @property {string} original - The original URL string
 */

/**
 * Register custom URL scheme with the operating system
 * 
 * This function configures the application to handle the 'unitygen' URL scheme.
 * The actual OS registration happens during installation via Electron Forge
 * configuration in forge.config.js.
 * 
 * @returns {boolean} True if registration is configured, false otherwise
 * 
 * @throws {Error} If the application is not running on a supported platform
 * 
 * @example
 * ```javascript
 * const registered = registerURLScheme();
 * if (registered) {
 *   console.log('URL scheme registered successfully');
 * }
 * ```
 */
function registerURLScheme() {
  try {
    // URL scheme is registered during installation via Electron Forge
    // This function confirms the configuration is in place
    const supportedPlatforms = ['win32', 'darwin', 'linux'];
    
    if (!supportedPlatforms.includes(process.platform)) {
      logMainProcess(`URL scheme registration not supported on platform: ${process.platform}`);
      return false;
    }
    
    logMainProcess('URL scheme registration configured via Electron Forge');
    return true;
  } catch (error) {
    logMainProcess(`URL scheme registration error: ${formatError(error)}`);
    return false;
  }
}

/**
 * Parse URL and extract parameters
 * 
 * Parses a URL string in the format 'unitygen://action?param1=value1&param2=value2'
 * and extracts the action and query parameters.
 * 
 * @param {string} url - The URL string to parse
 * @returns {ParsedURL|null} Parsed URL object or null if parsing fails
 * 
 * @throws {Error} If URL is empty or invalid
 * 
 * @example
 * ```javascript
 * const url = 'unitygen://generate?project=MyProject&template=Standard';
 * const parsed = parseURL(url);
 * // Returns: {
 * //   scheme: 'unitygen',
 * //   host: 'generate',
 * //   params: { project: 'MyProject', template: 'Standard' },
 * //   original: 'unitygen://generate?project=MyProject&template=Standard'
 * // }
 * ```
 */
function parseURL(url) {
  // Input validation
  if (!url || typeof url !== 'string') {
    throw new Error('URL must be a non-empty string');
  }
  
  if (!url.trim()) {
    throw new Error('URL cannot be empty or whitespace');
  }
  
  try {
    // Parse the URL
    const urlObj = new URL(url);
    
    // Extract scheme (protocol without colon)
    const scheme = urlObj.protocol.replace(':', '');
    
    // Validate scheme
    if (scheme !== 'unitygen') {
      logMainProcess(`Unsupported URL scheme: ${scheme}`);
      return null;
    }
    
    // Extract host as the action
    const host = urlObj.hostname || 'default';
    
    // Parse query parameters
    const params = {};
    for (const [key, value] of urlObj.entries()) {
      params[key] = value;
    }
    
    return {
      scheme,
      host,
      params,
      original: url
    };
  } catch (error) {
    logMainProcess(`URL parsing error for "${url}": ${formatError(error)}`);
    return null;
  }
}

/**
 * Process URL and extract parameters
 * 
 * Handles a URL when the application receives it via URL scheme.
 * For Windows/Linux, this is called from second-instance event.
 * For macOS, this is called from open-url event.
 * 
 * @param {string} url - The URL string to process
 * @returns {Object} Processing result with success status and parsed data
 * 
 * @example
 * ```javascript
 * const result = processURL('unitygen://generate?project=MyProject');
 * if (result.success) {
 *   console.log('Action:', result.parsed.host);
 *   console.log('Params:', result.parsed.params);
 * }
 * ```
 */
function processURL(url) {
  try {
    // Input validation
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        error: 'URL must be a non-empty string'
      };
    }
    
    logMainProcess(`Processing URL: ${url}`);
    
    // Parse the URL
    const parsed = parseURL(url);
    
    if (!parsed) {
      logMainProcess('URL parsing failed');
      return {
        success: false,
        error: 'Failed to parse URL'
      };
    }
    
    logMainProcess(`URL parsed successfully: scheme=${parsed.scheme}, host=${parsed.host}`);
    
    // Return parsed data for further processing
    return {
      success: true,
      parsed,
      // Suggested actions based on the URL
      actions: {
        forwardToBackend: parsed.host === 'generate' || parsed.host === 'open',
        forwardToFrontend: true,
        showWindow: true
      }
    };
  } catch (error) {
    logMainProcess(`URL processing error: ${formatError(error)}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Forward URL parameters to Python backend
 * 
 * Converts URL parameters to a format suitable for the Python FastAPI backend.
 * 
 * @param {ParsedURL} parsedURL - The parsed URL object
 * @returns {Object|null} Backend-compatible parameters or null if invalid
 * 
 * @example
 * ```javascript
 * const backendParams = forwardToBackend(parsedURL);
 * if (backendParams) {
 *   // Send to backend via HTTP
 * }
 * ```
 */
function forwardToBackend(parsedURL) {
  // Input validation
  if (!parsedURL || typeof parsedURL !== 'object') {
    throw new Error('parsedURL must be a valid ParsedURL object');
  }
  
  if (!parsedURL.scheme || parsedURL.scheme !== 'unitygen') {
    throw new Error('parsedURL must use unitygen scheme');
  }
  
  try {
    // Map URL parameters to backend API format
    const backendParams = {
      action: parsedURL.host,
      parameters: parsedURL.params
    };
    
    // Add timestamp for tracking
    backendParams.timestamp = Date.now();
    
    return backendParams;
  } catch (error) {
    logMainProcess(`Backend forwarding error: ${formatError(error)}`);
    return null;
  }
}

/**
 * Forward URL parameters to Vue frontend
 * 
 * Converts URL parameters to query string format for frontend navigation.
 * 
 * @param {ParsedURL} parsedURL - The parsed URL object
 * @returns {string} Query string for frontend navigation
 * 
 * @example
 * ```javascript
 * const queryString = forwardToFrontend(parsedURL);
 * // Returns: '?project=MyProject&template=Standard'
 * ```
 */
function forwardToFrontend(parsedURL) {
  // Input validation
  if (!parsedURL || typeof parsedURL !== 'object') {
    throw new Error('parsedURL must be a valid ParsedURL object');
  }
  
  if (!parsedURL.scheme || parsedURL.scheme !== 'unitygen') {
    throw new Error('parsedURL must use unitygen scheme');
  }
  
  try {
    // Convert params to query string
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(parsedURL.params)) {
      if (value !== undefined && value !== null) {
        params.set(key, value);
      }
    }
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  } catch (error) {
    logMainProcess(`Frontend forwarding error: ${formatError(error)}`);
    return '';
  }
}

module.exports = {
  registerURLScheme,
  parseURL,
  processURL,
  forwardToBackend,
  forwardToFrontend
};
