'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from 'src/components/ThemeToggle'
import { RepoBadge } from 'src/components/RepoBadge'

export function TopNavBar() {
  const pathname = usePathname()

  const baseLink =
    'rounded text-center w-32 text-2xl transition-colors'
  const hoverLink = 'hover:text-slate-800 dark:hover:text-slate-400'
  
  return (
    <nav className="bg-[#476c85] text-white w-full dark:bg-[#284B63] transition-colors duration-75">
      <div className="max-w-8xl mx-auto px-4 flex justify-evenly items-center h-16">
        
        <RepoBadge owner="RnLe" repo="MeepStudio" />

        {/* Navigation Links */}
        <div className="flex gap-8">
          <Link
            href="/"
            className={`
              ${baseLink} 
              ${pathname === '/' ? 'dark:text-slate-400 text-slate-800' : hoverLink}
            `}
          >
            Home
          </Link>
          <Link
            href="/download"
            className={`
              ${baseLink} 
              ${pathname === '/download/' ? 'dark:text-slate-400 text-slate-800' : hoverLink}
            `}
          >
            Download
          </Link>
          <Link
            href="/contribute"
            className={`
              ${baseLink} 
              ${pathname === '/contribute/' ? 'dark:text-slate-400 text-slate-800' : hoverLink}
            `}
          >
            Contribute
          </Link>
        </div>

        <div>
          <Link
            href="/meepstudio"
            className={`
              ${baseLink}
              ${hoverLink}
              w-40 text-2xl
              ${pathname === '/meepstudio/' ? 'dark:text-slate-400 text-slate-800' : hoverLink}
            `}
          >
            MeepStudio
          </Link>
        </div>

        <ThemeToggle />
      </div>
    </nav>
  )
}
