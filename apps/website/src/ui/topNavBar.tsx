'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ThemeToggle } from 'src/components/ThemeToggle'
import { RepoBadge } from 'src/components/RepoBadge'

export function TopNavBar() {
  const pathname = usePathname()

  const baseLink =
    'rounded text-center text-2xl transition-colors'
  const hoverLink = 'hover:text-slate-800 dark:hover:text-slate-400'
  
  return (
    <nav className="bg-[#476c85] text-white w-full dark:bg-[#284B63] transition-colors duration-75 min-h-16">
      <div className="max-w-8xl mx-auto px-4 flex justify-between items-center h-full">
        
        <RepoBadge owner="RnLe" repo="MeepStudio" />
        {/* Navigation Links */}
        <div className="flex items-center space-x-16">
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
            href="/documentation"
            className={`
              ${baseLink} 
              ${pathname === '/documentation/' ? 'dark:text-slate-400 text-slate-800' : hoverLink}
            `}
          >
            Documentation
          </Link>
          <Link
            href="/updates"
            className={`
              ${baseLink} 
              ${pathname === '/updates/' ? 'dark:text-slate-400 text-slate-800' : hoverLink}
            `}
          >
            Updates
          </Link>
          <Link
            href="/meepstudio"
            className={`
              group relative flex flex-col items-center justify-center px-3 py-1 rounded-lg bg-gray-500 text-white shadow-md transition-all duration-200
              hover:bg-gray-600 hover:shadow-lg
              dark:bg-gray-700 dark:hover:bg-gray-600
              ${pathname === '/meepstudio/' ? 'ring-2 ring-blue-400' : ''}
            `}
            style={{ minWidth: '5.5rem' }}
          >
            <span className="text-base font-semibold leading-tight">MeepStudio</span>
            <span className="text-xs text-white opacity-80 group-hover:opacity-100 transition-opacity">Interactive Web Editor</span>
          </Link>
        </div>

        <ThemeToggle />
      </div>
    </nav>
  )
}
