// providers.tsx
// A wrapper component for app providers.
//
// NOTE: React Query removed - we use Zustand stores with persistence instead

'use client';

import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
