// root layout
import React from "react"

// Import logger
import { logger } from "@meepstudio/utils";
import { ThemeProvider } from "next-themes";

import { TopNavBar } from "src/ui/topNavBar";

// Misc
import './global.css'

export const metadata = {
  title: 'MeepStudio',
  description: 'Some description that will be relevant later.',
}

import { Providers } from "@meepstudio/providers"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  
  // Logging
  logger.trace('Calling RootLayout');

  // Return the layout
  return (
    <html lang="en">
      <head />
      <body className="w-screen h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            <TopNavBar />
            <div className="flex justify-center items-center h-auto">
              {children}
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
