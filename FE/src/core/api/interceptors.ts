import { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';

// ==========================================
// SecureStore Keys — must match auth.store.ts
// ==========================================
const KEYS = {
  ACCESS_TOKEN: 'jwt_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// Lazy getter — breaks the require cycle by not importing auth.store at module load time.
// Instead we resolve the store only when a request/response actually fires.
const getAuthStore = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('../stores/auth.store').useAuthStore;
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

        // Send refresh token so backend can auto-rotate tokens silently when expired
        const refreshToken = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN).catch(() => null);
        if (refreshToken) {
          config.headers['x-refresh-token'] = refreshToken;
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
      // If backend rotated tokens, update our SecureStore silently
      const newAccessToken = response.headers['x-new-access-token'];
      const newRefreshToken = response.headers['x-new-refresh-token'];

      if (newAccessToken) {
        await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, newAccessToken).catch(() => {});
        getAuthStore().setState({ token: newAccessToken });
      }
      if (newRefreshToken) {
        await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, newRefreshToken).catch(() => {});
      }

      return response;
    },
    async (error: AxiosError) => {
      if (!error.response) {
        return Promise.reject(error);
      }

      const { status, data } = error.response;
      const authStore = getAuthStore();
      const hasToken = authStore.getState().token;

      if (status === 401 && hasToken) {
        // 401 = definitively not authenticated.
        // The backend middleware already tried to auto-refresh using the refresh token.
        // If we still got 401, BOTH tokens are invalid → force logout.
        await authStore.getState().logout();
      } else if (status === 403 && hasToken) {
        // 403 can mean:
        // a) Device kick-out / ban → must logout
        // b) Content paywall (locked video) → do NOT logout
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
