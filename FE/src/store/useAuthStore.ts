import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { axiosClient } from '../api/axiosClient';

// ==========================================
// 🔐 Device ID Generator (Persistent & Unique per device)
// ==========================================
const getDeviceId = async (): Promise<string> => {
  try {
    // Try to read a previously persisted device ID first
    const stored = await SecureStore.getItemAsync('campusify_device_id');
    if (stored) return stored;

    // Generate a new one from native device identifiers
    let deviceId: string;

    if (Platform.OS === 'android') {
      // Android ID is unique per device per app signing key
      deviceId = Application.getAndroidId() || `android-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    } else {
      // iOS: Use a UUID that persists until app reinstall
      deviceId = await Application.getIosIdForVendorAsync() || `ios-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    // Persist so it survives app restarts and SecureStore is consistent
    await SecureStore.setItemAsync('campusify_device_id', deviceId);
    return deviceId;
  } catch {
    // Fallback: If SecureStore fails (e.g., on first boot), generate a temp ID
    return `fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isLoading: true,
  user: null,

  login: async (email, password) => {
    try {
      // FIX: Generate a real device ID instead of sending platform: 'web'
      // This enables the backend's Netflix-style device lock & anti-sharing system
      const deviceId = await getDeviceId();

      const response = await axiosClient.post('/auth/login', { 
        email, 
        password,
        deviceId,
        // platform is intentionally NOT sent, so backend defaults to 'app'
        // which enforces the device-binding security logic
      }, {
        headers: {
          'x-device-id': deviceId, // Also in header for middleware pickup
        }
      });

      const token = response.data?.accessToken;
      if (!token) throw new Error("No access token returned from server");

      await SecureStore.setItemAsync('jwt_token', token);
      set({ token });

      // Fetch user profile immediately after login
      await get().fetchProfile();
    } catch (error: any) {
      // Extract the ApiError message from backend if available
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      throw new Error(message);
    }
  },

  logout: async () => {
    try {
      // Best effort backend logout call (fire-and-forget)
      await axiosClient.post('/auth/logout').catch(() => {});
    } catch {
      // Silently ignore network errors during logout
    } finally {
      // Always clear local state regardless of backend response
      await SecureStore.deleteItemAsync('jwt_token').catch(() => {});
      set({ token: null, user: null });
    }
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      if (token) {
        set({ token, isLoading: false });
        // Background fetch profile data if token exists
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
          }
        });
      }
    } catch {
      // Profile fetch failure is non-fatal; token might be expired
      // The 401 interceptor in axiosClient will handle logout if needed
    }
  },
}));
