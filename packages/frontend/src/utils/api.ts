// API configuration utility
const getApiBaseUrl = (): string => {
  // In production (when built), use the environment variable
  // In development, use the proxy configured in vite.config.ts
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE_URL || '';
  }
  return ''; // Relative URL for development proxy
};

export const apiCall = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
};

export default {
  getApiBaseUrl,
  apiCall,
};
