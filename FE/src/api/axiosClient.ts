import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Set your backend API base URL
// In production or when deployed, this should come from process.env.EXPO_PUBLIC_API_URL
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api';

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach the JWT token to every request
// FIX: Read token from Zustand in-memory state instead of SecureStore
// This eliminates the native bridge I/O overhead on every single API call
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle global responses (401 kickout, 403 ban/device-lock)
// FIX: Now calls Zustand logout() to sync React state with storage,
// which triggers _layout.tsx auth guard to redirect to login screen.
// Prevents the "trapped state" bug where UI was stuck on empty feed.
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Sync Zustand state -> clears token in memory + SecureStore -> triggers redirect
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
