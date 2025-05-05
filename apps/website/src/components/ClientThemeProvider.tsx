// components/ClientThemeProvider.tsx
'use client'

import dynamic from 'next/dynamic'

// Import ThemeProvider only on client, skip SSR entirely
export const ClientThemeProvider = dynamic(
  () => import('next-themes').then((mod) => mod.ThemeProvider),
  { ssr: false }
)