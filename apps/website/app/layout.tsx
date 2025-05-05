// root layout
import React from "react"

import { logger } from "@meepstudio/utils";
import { Providers } from "@meepstudio/providers"
import { ClientThemeProvider } from "src/components/ClientThemeProvider";
import { TopNavBar } from "src/ui/topNavBar";
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
        <ClientThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            <TopNavBar />
            {/* fill remaining space and allow inner scrolling */}
            <div className="flex-1 overflow-auto dark:bg-neutral-800">
              {children}
            </div>
          </Providers>
        </ClientThemeProvider>
      </body>
    </html>
  );
}
