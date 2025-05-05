// components/TopNavBar.tsx
'use client'

import Link from 'next/link'
import React from 'react'
import { ThemeToggle } from 'src/components/ThemeToggle'

export function TopNavBar() {
  return (
    <nav className="bg-[#40577C] dark:bg-[#284B63] text-white w-full">
        <div className="max-w-8xl mx-auto px-4 flex justify-between items-center h-16">
            <div className="flex space-x-4">
                <Link
                    href="/"
                    className="px-4 py-2 hover:bg-white/20 rounded text-center w-24"
                >
                    Home
                </Link>
                <Link
                    href="/about"
                    className="px-4 py-2 hover:bg-white/20 rounded text-center w-24"
                >
                    About
                </Link>
                <Link
                    href="/contact"
                    className="px-4 py-2 hover:bg-white/20 rounded text-center w-24"
                >
                    Contact
                </Link>
            </div>

            {/* Theme toggle button */}
            <ThemeToggle />
        </div>
    </nav>
  )
}
