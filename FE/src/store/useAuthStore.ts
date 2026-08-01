import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { axiosClient } from '../api/axiosClient';

// ==========================================
// 🔐 Device ID Generator — Expo Go + Standalone Compatible
// ==========================================
// WHY: Application.getAndroidId() returns NULL in Expo Go (only works in standalone builds).
// If we let it fall through to a random fallback, a new ID is generated on every restart,
// which triggers the backend's device-switch penalty on every login. Fix: use
// Constants.sessionId / installationId as a stable source in Expo Go, and persist
// whatever we generate in SecureStore so it survives restarts.
const getDeviceId = async (): Promise<string> => {
  try {
    // Step 1: Check if we already generated and persisted a stable ID
    const stored = await SecureStore.getItemAsync('campusify_device_id');
    if (stored) return stored;

    // Step 2: Try native device identifiers (works in standalone builds)
    let deviceId: string | null = null;

    if (Platform.OS === 'android') {
      deviceId = Application.getAndroidId(); // null in Expo Go, real ID in prod
    } else if (Platform.OS === 'ios') {
      deviceId = await Application.getIosIdForVendorAsync();
    }

    // Step 3: If native ID is unavailable (Expo Go), build a stable ID from
    // Constants.deviceName (phone name, e.g. "Shiv's Android") + platform.
    // This is not cryptographically unique but is stable per device install.
    if (!deviceId) {
      const deviceName = Constants.deviceName || 'unknown';
      const base = `${Platform.OS}-${deviceName}-campusify`;
      // We'll store this so it's consistent across restarts
      deviceId = base.replace(/\s+/g, '_').toLowerCase();
    }

    // Step 4: Persist so it survives restarts — this is the most important step.
    // On the next call, Step 1 will return immediately from SecureStore.
    await SecureStore.setItemAsync('campusify_device_id', deviceId);
    return deviceId;
  } catch {
    // Last resort fallback
    return `fallback-${Platform.OS}-${Date.now()}`;
  }
};

// ==========================================
// 👤 User Profile Interface
// ==========================================
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNo: string;
  accountType: string;
  totalPurchased: number;
}

interface AuthState {
  token: string | null;
  isLoading: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  getDeviceId: () => Promise<string>; // Expose for verifyOTP screen
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isLoading: true,
  user: null,

  // Expose getDeviceId so other screens (e.g. verifyOTP) can call it
  getDeviceId,

  login: async (email, password) => {
    try {
      const deviceId = await getDeviceId();
      console.log('📱 Login with deviceId:', deviceId);

      const response = await axiosClient.post(
        '/auth/login',
        { email, password, deviceId },
        {
          headers: {
            // IMPORTANT: x-device-id is sent ONLY on login, not on every API call.
            // The isLoggedIn middleware only checks device on login, so sending it
            // on every request would cause 403s when Expo Go generates a new session.
            'x-device-id': deviceId,
          },
        }
      );

      const token = response.data?.accessToken;
      const refreshToken = response.data?.refreshToken;
      if (!token) throw new Error('No access token returned from server');

      await SecureStore.setItemAsync('jwt_token', token);
      if (refreshToken) {
        await SecureStore.setItemAsync('refresh_token', refreshToken);
      }
      set({ token });

      // Fetch user profile immediately after login
      await get().fetchProfile();
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Login failed. Please try again.';
      throw new Error(message);
    }
  },

  logout: async () => {
    try {
      await axiosClient.post('/auth/logout').catch(() => {});
    } catch {
      // Silently ignore network errors during logout
    } finally {
      await SecureStore.deleteItemAsync('jwt_token').catch(() => {});
      await SecureStore.deleteItemAsync('refresh_token').catch(() => {});
      set({ token: null, user: null });
    }
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      if (token) {
        set({ token, isLoading: false });
        // Background fetch — non-fatal
        get().fetchProfile().catch(() => {});
      } else {
        set({ token: null, isLoading: false });
      }
    } catch {
      set({ token: null, isLoading: false });
    }
  },

  fetchProfile: async () => {
    try {
      const response = await axiosClient.get('/user/me');
      if (response.data?.status && response.data?.data) {
        const d = response.data.data;
        set({
          user: {
            id: d.id,
            firstName: d.firstName,
            lastName: d.lastName,
            email: d.email,
            phoneNo: d.phoneNo,
            accountType: d.accountType,
            totalPurchased: d.totalPurchased,
          },
        });
      }
    } catch {
      // Profile fetch failure is non-fatal
      // The 401 interceptor in axiosClient will handle logout if needed
    }
  },
}));
