// root layout
import React from "react"

import { logger } from "../packages/utils/logger";
import { Providers } from "../packages/providers/providers";
import { ClientThemeProvider } from "src/components/ClientThemeProvider";
import { ClientLayoutShell } from './ClientLayoutShell';
import './global.css'

export const metadata = {
  title: 'MeepStudio',
  description: 'Some description that will be relevant later.',
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  
  // Logging
  logger.trace('Calling RootLayout');

  // Return the layout
  return (
    <html lang="en">
      <head />
      <body className="flex flex-col h-screen w-screen">
        <ClientLayoutShell>
          {children}
        </ClientLayoutShell>
      </body>
    </html>
  );
}
