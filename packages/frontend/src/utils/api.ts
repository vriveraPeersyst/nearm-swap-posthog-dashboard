import type { SwapMetrics, AccountValueSummary, TopAccountsResponse, ValidatorStats } from '../types';

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

// Fetch swap metrics
export const fetchSwapMetrics = async (): Promise<SwapMetrics> => {
  const response = await apiCall('/api/swap-metrics');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch swap metrics: ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch account values summary
export const fetchAccountValues = async (): Promise<AccountValueSummary> => {
  const response = await apiCall('/api/account-values');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch account values: ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch top accounts by value
export const fetchTopAccountsByValue = async (): Promise<TopAccountsResponse> => {
  const response = await apiCall('/api/top-accounts');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch top accounts: ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch validator stats for npro.poolv1.near
export const fetchValidatorStats = async (): Promise<ValidatorStats> => {
  const response = await apiCall('/api/validator-stats');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch validator stats: ${response.statusText}`);
  }
  
  return response.json();
};

export default {
  getApiBaseUrl,
  apiCall,
  fetchSwapMetrics,
  fetchAccountValues,
  fetchTopAccountsByValue,
  fetchValidatorStats,
};
