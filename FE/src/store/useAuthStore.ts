import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import axiosClient, { clearApiCache } from '../api/axiosClient.api';

interface AuthState {
  isLoading: boolean;
  userToken: string | null;
  userProfile: any | null;
  fetchUserProfile: () => Promise<boolean>;
  verifyOtpAndLogin: (email: string, otpCode: string) => Promise<{ success: boolean; message?: string }>;
  login: (token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrapAsync: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: true,
  userToken: null,
  userProfile: null,

  fetchUserProfile: async () => {
    try {
      const response = await axiosClient.get('/user/me');
      if (response.data.status) {
        set({ userProfile: response.data.data });
        return true;
      }
      return false;
    } catch (error) {
      console.log("Could not fetch profile", error);
      return false;
    }
  },

  verifyOtpAndLogin: async (email, otpCode) => {
    try {
      const currentDeviceId = await DeviceInfo.getUniqueId();
      console.log("Attempting login with Device ID:", currentDeviceId);

      const response = await axiosClient.post('/auth/verify-otp', {
        email: email,
        otp: otpCode,
        deviceId: currentDeviceId
      });

      if (response.data && response.data.status) {
        const { accessToken, refreshToken } = response.data;
        await get().login(accessToken, refreshToken);
        return { success: true };
      } else {
        return { success: false, message: response.data.message || "Invalid OTP" };
      }
    } catch (error: any) {
      console.error("OTP Verification Failed:", error?.response?.data || error.message);
      return { 
        success: false, 
        message: error?.response?.data?.message || "Something went wrong during login." 
      };
    }
  },

  login: async (token, refreshToken) => {
    try {
      await AsyncStorage.setItem('accessToken', token);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      axiosClient.defaults.headers.common.Authorization = `Bearer ${token}`;
      set({ userToken: token });
      await get().fetchUserProfile();
    } catch (error) {
      console.error("Storage failed during login", error);
    }
  },

  logout: async () => {
    try {
      await axiosClient.post('/auth/logout'); 
    } catch (e: any) {
      console.log("Backend logout API failed:", e.message);
    } finally {
      try {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        
        if (axiosClient.defaults.headers.common.Authorization) {
          delete axiosClient.defaults.headers.common.Authorization; 
        }
      } catch (storageError) {
        console.error("Error during local storage cleanup:", storageError);
      } 
      
      clearApiCache();
      set({ userToken: null, userProfile: null });
    }
  },

  bootstrapAsync: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        axiosClient.defaults.headers.common.Authorization = `Bearer ${token}`;
        const isProfileFetched = await get().fetchUserProfile();
        
        if (isProfileFetched) {
          set({ userToken: token });
        } else {
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
        }
      }
    } catch (e) {
      console.error("Token fetch failed inside bootstrap", e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
