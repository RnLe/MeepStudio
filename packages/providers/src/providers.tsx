// providers.tsx
// A wrapper component that provides the QueryClient to the app.

'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,         // 5 minutes stale time
        refetchOnWindowFocus: false,   // no refetch on window focus
      },
    },
  });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
