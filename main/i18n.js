/**
 * Internationalization Manager
 * 
 * Manages language resources and text translation for the Electron application.
 * Supports multiple languages with fallback to default language when translations are missing.
 * 
 * @module i18n
 */

const path = require('path');
const fs = require('fs');
const { logMainProcess, formatError } = require('./logger');

// Default language code
/** @type {string} */
const DEFAULT_LANGUAGE = 'en';

// Current language code
/** @type {string} */
let currentLanguage = DEFAULT_LANGUAGE;

// Language resources cache
/** @type {Record<string, Record<string, string>>} */
const languageResources = {};

/**
 * Load language resources from JSON file
 * 
 * @param {string} language - Language code (e.g., 'en', 'es', 'fr', 'de', 'ja', 'zh')
 * @returns {boolean} True if resources loaded successfully, false otherwise
 * @throws {Error} If language parameter is invalid
 * 
 * @example
 * // Load English resources
 * loadLanguageResources('en');
 * 
 * // Load Spanish resources (falls back to English if file missing)
 * loadLanguageResources('es');
 */
function loadLanguageResources(language) {
  // Input validation
  if (!language || typeof language !== 'string') {
    throw new Error('language parameter must be a non-empty string');
  }

  // Trim whitespace
  const trimmedLanguage = language.trim();
  
  if (!trimmedLanguage) {
    throw new Error('language parameter cannot be empty or whitespace');
  }

  try {
    logMainProcess(`Loading language resources for: ${trimmedLanguage}`);
    
    // Determine language file path
    const resourcesPath = path.join(__dirname, '..', 'resources', 'locales', `${trimmedLanguage}.json`);
    
    // Check if file exists
    if (!fs.existsSync(resourcesPath)) {
      logMainProcess(`Language file not found: ${resourcesPath}, falling back to default language`);
      return loadLanguageResources(DEFAULT_LANGUAGE);
    }
    
    // Load and parse language file
    const fileContent = fs.readFileSync(resourcesPath, 'utf8');
    const resources = JSON.parse(fileContent);
    
    // Validate resources is an object
    if (!resources || typeof resources !== 'object') {
      throw new Error(`Language file ${resourcesPath} does not contain valid JSON object`);
    }
    
    // Cache resources
    languageResources[trimmedLanguage] = resources;
    currentLanguage = trimmedLanguage;
    
    logMainProcess(`Language resources loaded successfully for: ${trimmedLanguage}`);
    return true;
    
  } catch (error) {
    logMainProcess(`Failed to load language resources for ${language}: ${formatError(error)}`);
    return false;
  }
}

/**
 * Translate text using the current language resources
 * 
 * @param {string} key - Translation key to look up
 * @param {Record<string, string>} [params={}] - Parameters for string interpolation
 * @returns {string} Translated text, or the key if translation not found
 * @throws {Error} If key parameter is invalid
 * 
 * @example
 * // Simple translation
 * translateText('appTitle'); // Returns: "Unity Generator"
 * 
 * // Translation with parameters
 * translateText('greeting', { name: 'John' }); // Returns: "Hello, John!"
 */
function translateText(key, params = {}) {
  // Input validation
  if (!key || typeof key !== 'string') {
    throw new Error('key parameter must be a non-empty string');
  }

  // Trim whitespace
  const trimmedKey = key.trim();
  
  if (!trimmedKey) {
    throw new Error('key parameter cannot be empty or whitespace');
  }

  // Validate params is an object
  if (params !== null && typeof params !== 'object') {
    throw new Error('params parameter must be an object');
  }

  try {
    // Get resources for current language
    const resources = languageResources[currentLanguage];
    
    if (!resources) {
      logMainProcess('No language resources loaded for current language');
      return trimmedKey;
    }
    
    // Get translation for current language
    let translation = resources[trimmedKey];
    
    if (!translation) {
      // Fallback to default language
      logMainProcess(`Translation not found for key "${trimmedKey}" in language "${currentLanguage}", falling back to ${DEFAULT_LANGUAGE}`);
      
      const defaultResources = languageResources[DEFAULT_LANGUAGE];
      if (defaultResources) {
        translation = defaultResources[trimmedKey];
      }
    }
    
    if (!translation) {
      logMainProcess(`Translation not found for key "${trimmedKey}" in both "${currentLanguage}" and "${DEFAULT_LANGUAGE}"`);
      return trimmedKey;
    }
    
    // Interpolate parameters if provided
    if (Object.keys(params).length > 0) {
      Object.keys(params).forEach(paramKey => {
        const placeholder = `{${paramKey}}`;
        const paramValue = params[paramKey] != null ? String(params[paramKey]) : '';
        translation = translation.replace(placeholder, paramValue);
      });
    }
    
    return translation;
    
  } catch (error) {
    logMainProcess(`Translation error for key "${key}": ${formatError(error)}`);
    return trimmedKey;
  }
}

/**
 * Get list of available language codes
 * 
 * @returns {string[]} Array of available language codes (e.g., ['en', 'es', 'fr'])
 */
function getAvailableLanguages() {
  try {
    const localesPath = path.join(__dirname, '..', 'resources', 'locales');
    
    if (!fs.existsSync(localesPath)) {
      logMainProcess('Locales directory not found');
      return [DEFAULT_LANGUAGE];
    }
    
    const files = fs.readdirSync(localesPath);
    
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))
      .sort();
    
  } catch (error) {
    logMainProcess(`Failed to get available languages: ${formatError(error)}`);
    return [DEFAULT_LANGUAGE];
  }
}

/**
 * Get the current language code
 * 
 * @returns {string} Current language code
 */
function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Set the current language
 * 
 * @param {string} language - Language code to set
 * @returns {boolean} True if language was set successfully, false otherwise
 * @throws {Error} If language parameter is invalid
 */
function setLanguage(language) {
  // Input validation
  if (!language || typeof language !== 'string') {
    throw new Error('language parameter must be a non-empty string');
  }

  const trimmedLanguage = language.trim();
  
  if (!trimmedLanguage) {
    throw new Error('language parameter cannot be empty or whitespace');
  }

  try {
    // Load resources if not already loaded
    if (!languageResources[trimmedLanguage]) {
      const loaded = loadLanguageResources(trimmedLanguage);
      if (!loaded) {
        logMainProcess(`Failed to load language resources for "${trimmedLanguage}"`);
        return false;
      }
    }
    
    currentLanguage = trimmedLanguage;
    logMainProcess(`Language set to: ${trimmedLanguage}`);
    return true;
    
  } catch (error) {
    logMainProcess(`Failed to set language to "${language}": ${formatError(error)}`);
    return false;
  }
}

module.exports = {
  loadLanguageResources,
  translateText,
  getAvailableLanguages,
  getCurrentLanguage,
  setLanguage,
  DEFAULT_LANGUAGE
};
