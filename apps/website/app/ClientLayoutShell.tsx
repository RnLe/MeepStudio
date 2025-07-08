"use client"
import { usePathname } from 'next/navigation'
import { Providers } from '../packages/providers/providers'
import { ClientThemeProvider } from 'src/components/ClientThemeProvider'
import { TopNavBar } from 'src/ui/topNavBar'

export function ClientLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showTopNavBar = false

  return (
    <ClientThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Providers>
          {showTopNavBar && <TopNavBar />}
          <main className="flex-1 overflow-auto dark:bg-neutral-800">
            {children}
          </main>
        </Providers>
      </div>
    </ClientThemeProvider>
  )
}
