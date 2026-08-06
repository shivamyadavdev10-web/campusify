import { create } from 'zustand';

export interface ToastConfig {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface UiState {
  toast: ToastConfig | null;
  showToast: (message: string, type: ToastConfig['type']) => void;
  hideToast: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  toast: null,
  showToast: (message, type) => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null }),
}));

// Alias for screens that import useUIStore
export const useUIStore = useUiStore;
