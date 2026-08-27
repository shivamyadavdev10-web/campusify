import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Per-query stale times — data stays fresh for this long ──────────────────
export const STALE_TIMES = {
  branches:        24 * 60 * 60 * 1000,  // 24h  — branch list rarely changes
  trending:        30 * 60 * 1000,        // 30m
  'free-contents': 30 * 60 * 1000,        // 30m
  'home-banner':   60 * 60 * 1000,        // 1h
  semesters:       15 * 60 * 1000,        // 15m
  subjects:        15 * 60 * 1000,        // 15m
  contents:        10 * 60 * 1000,        // 10m
  'my-courses':    10 * 60 * 1000,        // 10m
  profile:          5 * 60 * 1000,        // 5m
  default:          5 * 60 * 1000,        // fallback
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIMES.default,
      gcTime: 30 * 60 * 1000,             // keep unused data in memory 30m
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status === 404 || status === 403 || status === 401) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
  },
});

// ── Persistent cache — survives app close/reopen ─────────────────────────────
// Saves the entire React Query cache to AsyncStorage on device.
// Next app open loads from disk instantly (no spinner, no API call).
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'CAMPUSIFY_QUERY_CACHE_V1',
  throttleTime: 1000, // write to disk max once per second
});

// Cache entries older than this are discarded on app start
export const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
