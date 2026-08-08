import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';
import {
  LoginRequest,
  RegisterRequest,
  VerifyOTPRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthTokens,
} from '../../types/auth.types';
import { useUserStore } from './user.store';

// ==========================================
// SecureStore Keys — backward compatible with existing app
// ==========================================
const KEYS = {
  ACCESS_TOKEN: 'jwt_token',
  REFRESH_TOKEN: 'refresh_token',
  DEVICE_ID: 'campusify_device_id',
} as const;

// ==========================================
// Device ID Generator — Expo Go + Standalone Compatible
// ==========================================
const getDeviceId = async (): Promise<string> => {
  try {
    // Step 1: Check persisted ID first
    const stored = await SecureStore.getItemAsync(KEYS.DEVICE_ID);
    if (stored) return stored;

    // Step 2: Try native device identifiers (standalone builds)
    let deviceId: string | null = null;

    if (Platform.OS === 'android') {
      deviceId = Application.getAndroidId(); // null in Expo Go
    } else if (Platform.OS === 'ios') {
      deviceId = await Application.getIosIdForVendorAsync();
    }

    // Step 3: Fallback for Expo Go — use Constants.deviceName for stability
    if (!deviceId) {
      const deviceName = Constants.deviceName || 'unknown';
      deviceId = `${Platform.OS}-${deviceName}-campusify`.replace(/\s+/g, '_').toLowerCase();
    }

    // Step 4: Persist for subsequent calls
    await SecureStore.setItemAsync(KEYS.DEVICE_ID, deviceId);
    return deviceId;
  } catch {
    return `fallback-${Platform.OS}-${Date.now()}`;
  }
};

// ==========================================
// Auth Store Interface
// ==========================================
interface AuthState {
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<string>; // returns email
  verifyOTP: (email: string, otp: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  getDeviceId: () => Promise<string>;
}

let isLoggingOut = false;

// ==========================================
// Auth Store
// ==========================================
export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isLoading: true,
  isAuthenticated: false,

  getDeviceId,

  login: async (email: string, password: string) => {
    const deviceId = await getDeviceId();

    const response = await apiClient.post('/auth/login',
      { email, password, deviceId },
      { headers: { 'x-device-id': deviceId } }
    );

    const { accessToken, refreshToken } = response.data;
    if (!accessToken) throw new Error('No access token returned from server');

    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
    }

    set({ token: accessToken, isAuthenticated: true });
  },

  register: async (data: RegisterRequest) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data?.email || data.email;
  },

  verifyOTP: async (email: string, otp: string) => {
    const deviceId = await getDeviceId();

    const response = await apiClient.post('/auth/verify-otp',
      { email, otp },
      { headers: { 'x-device-id': deviceId } }
    );

    const { accessToken, refreshToken } = response.data;
    if (!accessToken) throw new Error('No access token returned');

    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
    }

    set({ token: accessToken, isAuthenticated: true });
  },

  resendOTP: async (email: string) => {
    await apiClient.post('/auth/resend-otp', { email });
  },

  forgotPassword: async (email: string) => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    await apiClient.post('/auth/reset-password', data);
  },

  logout: async () => {
    if (isLoggingOut) return;
    try {
      isLoggingOut = true;
      await apiClient.post('/auth/logout').catch(() => {});
    } catch {
      // Silently ignore network errors during logout
    } finally {
      isLoggingOut = false;
      await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN).catch(() => {});
      await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN).catch(() => {});
      set({ token: null, isAuthenticated: false });
      useUserStore.getState().clearProfile();
    }
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
      if (token) {
        set({ token, isAuthenticated: true, isLoading: false });
      } else {
        set({ token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
