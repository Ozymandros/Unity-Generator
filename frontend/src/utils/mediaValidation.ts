/**
 * Media validation utilities for security and data integrity.
 * Validates base64 encoding, file names, media types, and file sizes.
 */

/**
 * Maximum allowed media file size in bytes (5MB).
 * Prevents denial-of-service attacks and memory issues.
 */
export const MAX_MEDIA_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Validates base64 encoding format.
 * Checks for proper data URI format with base64 encoding.
 * 
 * @param data - The base64-encoded data string to validate
 * @returns True if valid base64 format, false otherwise
 * 
 * @example
 * ```typescript
 * isValidBase64("data:image/png;base64,iVBORw0KG..."); // true
 * isValidBase64("not-base64-data"); // false
 * ```
 */
export function isValidBase64(data: string): boolean {
  if (!data || typeof data !== 'string') {
    return false;
  }
  
  // Check for data URI format: data:[<mediatype>][;base64],<data>
  const dataUriPattern = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9+\-.]+)(;base64)?,(.+)$/;
  const match = data.match(dataUriPattern);
  
  if (!match) {
    return false;
  }
  
  // Verify base64 encoding is specified
  if (!match[2] || match[2] !== ';base64') {
    return false;
  }
  
  // Verify base64 data is present
  const base64Data = match[3];
  if (!base64Data || base64Data.length === 0) {
    return false;
  }
  
  // Validate base64 characters (A-Z, a-z, 0-9, +, /, =)
  const base64Pattern = /^[A-Za-z0-9+/]+=*$/;
  return base64Pattern.test(base64Data);
}

/**
 * Validates media type matches expected format.
 * Ensures image data has image/* MIME type and audio data has audio/* MIME type.
 * 
 * @param data - The base64-encoded data string with MIME type
 * @param expectedType - Expected media type: "image" or "audio"
 * @returns True if media type matches expected format, false otherwise
 * 
 * @example
 * ```typescript
 * isValidMediaType("data:image/png;base64,...", "image"); // true
 * isValidMediaType("data:audio/wav;base64,...", "audio"); // true
 * isValidMediaType("data:text/plain;base64,...", "image"); // false
 * ```
 */
export function isValidMediaType(data: string, expectedType: 'image' | 'audio'): boolean {
  if (!data || typeof data !== 'string') {
    return false;
  }
  
  const dataUriPattern = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9+\-.]+)/;
  const match = data.match(dataUriPattern);
  
  if (!match || !match[1]) {
    return false;
  }
  
  const mimeType = match[1].toLowerCase();
  
  if (expectedType === 'image') {
    return mimeType.startsWith('image/');
  } else if (expectedType === 'audio') {
    return mimeType.startsWith('audio/');
  }
  
  return false;
}

/**
 * Sanitizes file names to prevent path traversal attacks.
 * Rejects file names containing "..", "/", or "\\" characters.
 * 
 * @param fileName - The file name to sanitize
 * @returns True if file name is safe, false if it contains dangerous characters
 * 
 * @example
 * ```typescript
 * isSafeFileName("texture.png"); // true
 * isSafeFileName("MyTexture_01"); // true
 * isSafeFileName("../../../etc/passwd"); // false
 * isSafeFileName("folder/file.png"); // false
 * isSafeFileName("C:\\Windows\\file.png"); // false
 * ```
 */
export function isSafeFileName(fileName: string): boolean {
  if (!fileName || typeof fileName !== 'string') {
    return false;
  }
  
  // Reject empty or whitespace-only names
  if (fileName.trim().length === 0) {
    return false;
  }
  
  // Reject path traversal patterns
  if (fileName.includes('..')) {
    return false;
  }
  
  // Reject path separators (both Unix and Windows)
  if (fileName.includes('/') || fileName.includes('\\')) {
    return false;
  }
  
  return true;
}

/**
 * Calculates the size of base64-encoded data in bytes.
 * Decodes the base64 string to determine actual data size.
 * 
 * @param data - The base64-encoded data string
 * @returns Size in bytes, or 0 if invalid data
 * 
 * @example
 * ```typescript
 * const size = getBase64Size("data:image/png;base64,iVBORw0KG...");
 * console.log(`File size: ${size} bytes`);
 * ```
 */
export function getBase64Size(data: string): number {
  if (!data || typeof data !== 'string') {
    return 0;
  }
  
  // Extract base64 data from data URI
  const dataUriPattern = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9+\-.]+)(;base64)?,(.+)$/;
  const match = data.match(dataUriPattern);
  
  if (!match || !match[3]) {
    return 0;
  }
  
  const base64Data = match[3];
  
  // Calculate size: base64 encoding increases size by ~33%
  // Formula: (base64Length * 3) / 4 - padding
  const padding = (base64Data.match(/=/g) || []).length;
  const sizeInBytes = (base64Data.length * 3) / 4 - padding;
  
  return Math.floor(sizeInBytes);
}

/**
 * Validates media file size is within allowed limit.
 * Prevents denial-of-service attacks by rejecting oversized files.
 * 
 * @param data - The base64-encoded data string
 * @param maxSizeBytes - Maximum allowed size in bytes (defaults to 5MB)
 * @returns True if file size is within limit, false otherwise
 * 
 * @example
 * ```typescript
 * isValidFileSize("data:image/png;base64,..."); // true if < 5MB
 * isValidFileSize("data:image/png;base64,...", 1024 * 1024); // true if < 1MB
 * ```
 */
export function isValidFileSize(data: string, maxSizeBytes: number = MAX_MEDIA_SIZE_BYTES): boolean {
  const size = getBase64Size(data);
  return size > 0 && size <= maxSizeBytes;
}

/**
 * Comprehensive validation for media import data.
 * Validates base64 encoding, media type, file name, and file size.
 * 
 * @param data - The base64-encoded data string
 * @param fileName - The file name
 * @param mediaType - Expected media type: "image" or "audio"
 * @returns Object with isValid flag and error message if validation fails
 * 
 * @example
 * ```typescript
 * const result = validateMediaImport(
 *   "data:image/png;base64,iVBORw0KG...",
 *   "texture.png",
 *   "image"
 * );
 * 
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateMediaImport(
  data: string,
  fileName: string,
  mediaType: 'image' | 'audio'
): { isValid: boolean; error?: string } {
  // Validate base64 encoding
  if (!isValidBase64(data)) {
    return {
      isValid: false,
      error: 'Invalid media data format. Expected base64-encoded data URI.'
    };
  }
  
  // Validate media type
  if (!isValidMediaType(data, mediaType)) {
    return {
      isValid: false,
      error: `Invalid media type. Expected ${mediaType}/* MIME type.`
    };
  }
  
  // Validate file name
  if (!isSafeFileName(fileName)) {
    return {
      isValid: false,
      error: 'Invalid file name. File names cannot contain "..", "/", or "\\" characters.'
    };
  }
  
  // Validate file size
  if (!isValidFileSize(data)) {
    const sizeMB = (getBase64Size(data) / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (MAX_MEDIA_SIZE_BYTES / (1024 * 1024)).toFixed(0);
    return {
      isValid: false,
      error: `File size (${sizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB.`
    };
  }
  
  return { isValid: true };
}
