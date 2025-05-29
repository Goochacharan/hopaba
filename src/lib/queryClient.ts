import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Increase stale time to 5 minutes for better caching
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      // Disable background refetching for better performance
      refetchOnWindowFocus: false,
      // Reduce retry attempts
      retry: 1,
      // Increase retry delay
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Disable refetching on reconnect for non-critical data
      refetchOnReconnect: false,
      // Enable query deduplication
      refetchInterval: false, // Disable automatic polling by default
    },
    mutations: {
      retry: 1,
    },
  },
});
