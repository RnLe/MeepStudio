// root layout
import React from "react"

import { logger } from "../packages/utils/logger";
import { Providers } from "../packages/providers/providers";
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
          {/* flex wrapper that fills the screen under body */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <Providers>
              <TopNavBar />
              {/* now this pane grows */}
              <main className="
                flex-1
                overflow-auto
                dark:bg-neutral-800 
                prose-headings:mt-8 prose-headings:font-semibold prose-headings:text-black 
                prose-h1:text-5xl prose-h2:text-4xl prose-h3:text-3xl 
                prose-h4:text-2xl prose-h5:text-xl prose-h6:text-lg 
                dark:prose-headings:text-white
              ">
                {children}
              </main>
            </Providers>
          </div>
        </ClientThemeProvider>
      </body>
    </html>
  );
}
