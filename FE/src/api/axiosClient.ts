import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import * as SecureStore from 'expo-secure-store';

// Base URL: EXPO_PUBLIC_ vars are baked at bundle time.
// Always run `npx expo start --clear` after changing .env
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://campusify-wowg.onrender.com/api';

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 90 second timeout — Render free tier can take up to 90s on cold start
  timeout: 90000,
});

// ==========================================
// REQUEST INTERCEPTOR
// Attaches JWT access token + refresh token to every request.
// NOTE: x-device-id is NOT sent here — it's only sent explicitly on login/verifyOTP.
// Sending it on every request caused 403s when Expo Go regenerated a new session ID.
// ==========================================
axiosClient.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Send refresh token so backend can auto-rotate tokens silently when expired
    const refreshToken = await SecureStore.getItemAsync('refresh_token').catch(
      () => null
    );
    if (refreshToken) {
      config.headers['x-refresh-token'] = refreshToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// RESPONSE INTERCEPTOR
// Handles new tokens from auto-refresh AND global 401/403 logout.
// FIX: Only triggers logout if user actually has a live token in Zustand.
// This prevents the startup loop: checkAuth → fetchProfile → 401 → logout → loop.
// ==========================================
axiosClient.interceptors.response.use(
  async (response) => {
    // If backend rotated tokens, update our SecureStore silently
    const newAccessToken = response.headers['x-new-access-token'];
    const newRefreshToken = response.headers['x-new-refresh-token'];

    if (newAccessToken) {
      await SecureStore.setItemAsync('jwt_token', newAccessToken).catch(() => {});
      useAuthStore.setState({ token: newAccessToken });
    }
    if (newRefreshToken) {
      await SecureStore.setItemAsync('refresh_token', newRefreshToken).catch(
        () => {}
      );
    }

    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const hasToken = useAuthStore.getState().token;

    if (status === 401 && hasToken) {
      // 401 = definitively not authenticated → force logout
      await useAuthStore.getState().logout();
    } else if (status === 403 && hasToken) {
      // 403 can mean two things:
      // a) Device kick-out / ban → must logout
      // b) Content paywall (e.g. locked video) → do NOT logout
      // Distinguish by checking the backend's message
      const msg: string = error.response?.data?.message || '';
      const isAuthError =
        msg.includes('Session') ||
        msg.includes('device') ||
        msg.includes('suspended') ||
        msg.includes('banned') ||
        msg.includes('logged in on a new device');
      if (isAuthError) {
        await useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);
