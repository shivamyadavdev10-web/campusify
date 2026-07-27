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

let cachedIsEmu: boolean | null = null;

// Initialize cache safely
const initializeCache = async (): Promise<void> => {
  try {
    if (!cachedToken) cachedToken = await AsyncStorage.getItem('accessToken');
  } catch (e) { console.error("Error reading token", e); }
  
  try {
    if (!cachedRefreshToken) cachedRefreshToken = await AsyncStorage.getItem('refreshToken');
  } catch (e) { console.error("Error reading refresh token", e); }
  
  try {
    if (!cachedDeviceId) cachedDeviceId = await DeviceInfo.getUniqueId();
  } catch (e) { console.error("Error reading device ID", e); }

  try {
    if (cachedIsEmu === null) cachedIsEmu = await DeviceInfo.isEmulator();
  } catch (e) { console.error("Error reading emulator status", e); }
};

const getBaseUrl = () => {
  const RENDER_URL = 'https://campusify-wowg.onrender.com/api';
  if (RENDER_URL) return RENDER_URL;
  if (process.env.API_URL) return process.env.API_URL;
  if (Platform.OS === 'android' && DeviceInfo.isEmulatorSync()) return 'http://10.0.2.2:5000/api';
  return 'http://192.168.1.108:5000/api';
};

const axiosClient = axios.create({
  baseURL: getBaseUrl(), 
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (!cachedToken || !cachedDeviceId || cachedIsEmu === null) {
    if (!initPromise) initPromise = initializeCache();
    await initPromise;
  }

  if (cachedToken) config.headers.Authorization = `Bearer ${cachedToken}`;
  if (cachedRefreshToken) config.headers['x-refresh-token'] = cachedRefreshToken;
  if (cachedDeviceId) config.headers['x-device-id'] = cachedDeviceId;
  if (cachedIsEmu !== null) config.headers['x-is-emulator'] = cachedIsEmu ? 'true' : 'false';
  
  return config;
}, (error: AxiosError) => Promise.reject(error));

let isAlertShown = false;

axiosClient.interceptors.response.use(
  async (res: AxiosResponse) => {
    const newAccessToken = res.headers['x-new-access-token'];
    const newRefreshToken = res.headers['x-new-refresh-token'];

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
    const status = err.response?.status;
    const data = err.response?.data as any;

    if (status === 403 && data?.message?.includes('another device')) {
      clearApiCache();
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      
      // Clear Zustand store dynamically to prevent circular dependency
      const { useAuthStore } = require('../store/useAuthStore');
      useAuthStore.getState().logout();
      
      if (!isAlertShown) {
        isAlertShown = true;
        Alert.alert("Session Expired", "Login from another device detected.", [
          { text: "OK", onPress: () => { isAlertShown = false; } }
        ]);
      }
    } else if (status === 401) {
      clearApiCache();
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      
      const { useAuthStore } = require('../store/useAuthStore');
      useAuthStore.getState().logout();
    }
    
    return Promise.reject(err);
  }
);

export default axiosClient;
