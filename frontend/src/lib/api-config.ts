/**
 * API configuration with security validation.
 * 
 * Ensures only allowed API URLs can be used to prevent SSRF attacks.
 */

const ALLOWED_ORIGINS = [
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'https://webstar-backend.onrender.com',
  'https://webstar-v1-backend.onrender.com',
];

/**
 * Validate that the API URL is from an allowed origin.
 */
function validateApiUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Check if the origin is in the allowed list
    const isAllowed = ALLOWED_ORIGINS.some(allowedOrigin => {
      const allowedUrl = new URL(allowedOrigin);
      return parsedUrl.origin === allowedUrl.origin;
    });
    
    if (!isAllowed) {
      console.error(`[Security] Blocked request to unauthorized origin: ${parsedUrl.origin}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[Security] Invalid URL:', url);
    return false;
  }
}

/**
 * Get and validate the API URL.
 */
export function getApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  if (!validateApiUrl(apiUrl)) {
    throw new Error(
      'Invalid API URL configuration. Please check NEXT_PUBLIC_API_URL environment variable.'
    );
  }
  
  return apiUrl;
}

/**
 * Build a safe API endpoint URL.
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiUrl();
  
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Ensure the path doesn't try to escape the API domain
  if (cleanPath.includes('..') || cleanPath.startsWith('http')) {
    throw new Error('[Security] Invalid API path');
  }
  
  return `${baseUrl}/${cleanPath}`;
}

// Export the validated API URL as default
export const API_URL = getApiUrl();
