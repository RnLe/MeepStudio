// root layout

import React from "react"

// Import logger
import { logger } from "@meepstudio/utils";

// Misc

export const metadata = {
  title: 'MeepStudio',
  description: 'Some description that will be relevant later.',
}

import { Providers } from "@meepstudio/providers"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Control variables
  const highlightEnabled = false;
  
  // Logging
  logger.trace('Calling RootLayout');
  logger.info('Highlight enabled: %s', highlightEnabled);

  // Return the layout
  return (
    <html lang="en">
      <head />
      <body className="w-screen h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
