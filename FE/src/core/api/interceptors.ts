import { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';

// SecureStore Keys — must match auth.store.ts
const KEYS = {
  ACCESS_TOKEN: 'jwt_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// Lazy getter — breaks the require cycle
const getAuthStore = () => {
  return require('../stores/auth.store').useAuthStore;
};

// Track if a token refresh is already in progress
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

// Process queued requests after refresh completes
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

export const setupInterceptors = (axiosInstance: AxiosInstance) => {
  // ==========================================
  // REQUEST INTERCEPTOR
  // Attaches JWT access token + refresh token to every request.
  // ==========================================
  axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        const token = getAuthStore().getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        // Non-fatal: proceed without tokens
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // ==========================================
  // RESPONSE INTERCEPTOR
  // Handles new tokens from auto-refresh AND global 401/403 logout.
  // ==========================================
  axiosInstance.interceptors.response.use(
    async (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      if (!error.response) {
        return Promise.reject(error);
      }

      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      const { status, data } = error.response;
      const authStore = getAuthStore();
      const hasToken = authStore.getState().token;

      // ── 401 Handling: Retry with refresh token before giving up ──
      if (status === 401 && hasToken && !originalRequest._retry) {
        // Check if another request already refreshed the token
        const tokenUsed = (originalRequest.headers?.Authorization as string)?.replace('Bearer ', '');
        const currentToken = authStore.getState().token;

        if (tokenUsed && currentToken && tokenUsed !== currentToken) {
          // Another request already refreshed — retry with new token
          originalRequest.headers.Authorization = `Bearer ${currentToken}`;
          return axiosInstance.request(originalRequest);
        }

        // If refresh is already in progress, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(axiosInstance.request(originalRequest));
              },
              reject,
            });
          });
        }

        // Mark as retrying so we don't loop
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Explicitly call the dedicated refresh endpoint
          const refreshToken = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN).catch(() => null);
          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          // Call refresh endpoint directly using a clean config to bypass loops
          const refreshResponse = await axiosInstance.post('/auth/refresh', {}, {
            headers: { 'x-refresh-token': refreshToken }
          });

          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

          if (accessToken) {
            await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
            authStore.setState({ token: accessToken });
            
            if (newRefreshToken) {
              await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, newRefreshToken);
            }

            processQueue(null, accessToken);

            // Retry the original request with the new access token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axiosInstance.request(originalRequest);
          } else {
             throw new Error('No access token in refresh response');
          }
        } catch (refreshError) {
          // Refresh also failed — session is truly dead, logout
          processQueue(refreshError, null);
          await authStore.getState().logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // ── 401 after retry = session is dead ──
      if (status === 401 && hasToken && originalRequest._retry) {
        await authStore.getState().logout();
      }

      // ── 403 Handling: Only logout for auth-related 403s ──
      if (status === 403 && hasToken) {
        const msg: string = ((data as any)?.message || '').toLowerCase();
        const isAuthError =
          msg.includes('session') ||
          msg.includes('device') ||
          msg.includes('suspended') ||
          msg.includes('banned') ||
          msg.includes('logged in on a new device');
        if (isAuthError) {
          await authStore.getState().logout();
        }
      }

      return Promise.reject(error);
    }
  );
};
