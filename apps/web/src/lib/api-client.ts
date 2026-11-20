import { API_BASE_URL } from './constants';

export class ApiError extends Error {
  statusCode: number;
  error?: string;
  details?: any;

  constructor(message: string, statusCode: number, error?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
  }
}

let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

interface RefreshSubscriber {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}

let isRefreshing = false;
let refreshSubscribers: RefreshSubscriber[] = [];

const subscribeTokenRefresh = (
  resolve: (token: string) => void,
  reject: (err: any) => void,
) => {
  refreshSubscribers.push({ resolve, reject });
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((sub) => sub.resolve(token));
  refreshSubscribers = [];
};

const onTokenRefreshFailed = (err: any) => {
  refreshSubscribers.forEach((sub) => sub.reject(err));
  refreshSubscribers = [];
};

export function unwrapData<T = any>(res: any, fallback?: T): T {
  if (res === null || res === undefined) return fallback as T;
  if (typeof res === 'object' && !Array.isArray(res) && 'data' in res && 'success' in res) {
    return (res.data !== undefined ? res.data : fallback) as T;
  }
  return res as T;
}

export function unwrapList<T = any>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res?.data && Array.isArray(res.data.data)) return res.data.data;
  if (res && Array.isArray(res.items)) return res.items;
  if (res?.data && Array.isArray(res.data.items)) return res.data.items;
  return [];
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers || {});
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (inMemoryAccessToken) {
    headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Include HttpOnly cookies
  };

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized for token refresh
    if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/register')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({}),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData.accessToken || refreshData.data?.accessToken;
            if (newAccessToken) {
              setAccessToken(newAccessToken);
              onTokenRefreshed(newAccessToken);
              isRefreshing = false;
              return apiClient<T>(endpoint, options, true);
            }
          }

          // If refresh failed (e.g. no session cookie), reject all waiting subscribers
          const refreshError = new ApiError('Session expired or unauthorized', 401);
          onTokenRefreshFailed(refreshError);
        } catch (refreshErr) {
          onTokenRefreshFailed(refreshErr);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Wait for token refresh to complete and retry, or reject if refresh failed
        return new Promise<T>((resolve, reject) => {
          subscribeTokenRefresh(
            () => resolve(apiClient<T>(endpoint, options, true)),
            (err) => reject(err),
          );
        });
      }
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      let errorMessage = 'An unexpected error occurred';
      if (data) {
        if (Array.isArray(data.message)) {
          errorMessage = data.message.join(', ');
        } else if (typeof data.message === 'string') {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        }
      }
      throw new ApiError(errorMessage, response.status, data?.error, data);
    }

    return (data?.data !== undefined ? data.data : data) as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network connection error', 0);
  }
}
