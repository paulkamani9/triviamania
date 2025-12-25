// API base URL - uses environment variable in production, empty string for dev (proxied by Vite)
export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Make an API request with the correct base URL
 * @param {string} endpoint - API endpoint (e.g., "/api/singleplayer/start")
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, options);
}
