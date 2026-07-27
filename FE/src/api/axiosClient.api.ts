import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { Alert, Platform } from 'react-native';

// 🔥 IN-MEMORY CACHE FOR EXTREME SPEED
let cachedToken: string | null = null;
let cachedDeviceId: string | null = null;

// 🔒 PROMISE LOCK (MUTEX) TO PREVENT MULTIPLE DISK READS
let initPromise: Promise<void> | null = null;

export const setCachedToken = (token: string | null) => {
  cachedToken = token;
};

let cachedRefreshToken: string | null = null;

export const clearApiCache = () => {
  cachedToken = null;
  cachedRefreshToken = null;
  cachedDeviceId = null;
  initPromise = null;
};

// Initialize cache from disk only once
const initializeCache = async (): Promise<void> => {
  if (!cachedToken) {
    cachedToken = await AsyncStorage.getItem('accessToken');
  }
  if (!cachedRefreshToken) {
    cachedRefreshToken = await AsyncStorage.getItem('refreshToken');
  }
  if (!cachedDeviceId) {
    cachedDeviceId = await DeviceInfo.getUniqueId();
  }
};

const getBaseUrl = () => {
  // 🚀 JAB RENDER PAR DEPLOY HO JAYE, TOH NICHE WALA URL CHANGE KAREIN:
  // Example: return 'https://campusify-api.onrender.com/api';
  
  const RENDER_URL = 'https://campusify-wowg.onrender.com/api'; // Live Render URL set kar diya gaya hai!

  if (RENDER_URL) {
    return RENDER_URL;
  }

  if (process.env.API_URL) {
    return process.env.API_URL;
  }
  if (Platform.OS === 'android' && DeviceInfo.isEmulatorSync()) {
    return 'http://10.0.2.2:5000/api';
  }
  // 📱 Local Wi-Fi IP for physical iOS & Android device testing fallback
  return 'http://192.168.1.108:5000/api';
};

const axiosClient = axios.create({
  baseURL: getBaseUrl(), 
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // If cache is empty, wait for the init promise. If it doesn't exist, create it.
  if (!cachedToken || !cachedDeviceId) {
    if (!initPromise) {
      initPromise = initializeCache();
    }
    await initPromise;
  }

  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  }
  if (cachedRefreshToken) {
    config.headers['x-refresh-token'] = cachedRefreshToken;
  }
  if (cachedDeviceId) {
    config.headers['x-device-id'] = cachedDeviceId;
  }
  
  // 🚨 Add emulator detection header for backend DRM bypass logic
  const isEmu = await DeviceInfo.isEmulator();
  config.headers['x-is-emulator'] = isEmu ? 'true' : 'false';
  
  return config;
}, (error: AxiosError) => Promise.reject(error));



// Intercept responses to catch newly issued tokens from the backend
axiosClient.interceptors.response.use(
  async (res: AxiosResponse) => {
    const newAccessToken = res.headers['x-new-access-token'];
    const newRefreshToken = res.headers['x-new-refresh-token']; // If backend sends it

    if (newAccessToken) {
      cachedToken = newAccessToken;
      await AsyncStorage.setItem('accessToken', newAccessToken);
      axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
    }
    if (newRefreshToken) {
      cachedRefreshToken = newRefreshToken;
      await AsyncStorage.setItem('refreshToken', newRefreshToken);
    }
    return res;
  },
  async (err: AxiosError) => {
    // Error handling block remains the same
    const status = err.response?.status;
    const data = err.response?.data as any;

    if (status === 403 && data?.message?.includes('another device')) {
      clearApiCache();
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      Alert.alert("Session Expired", "Login from another device detected.");
    } else if (status === 401) {
      // If we get an unauthorized error even after refresh attempt, flush cache
      clearApiCache();
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
    }
    return Promise.reject(err);
  }
);

export default axiosClient;
