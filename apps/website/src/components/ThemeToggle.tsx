// components/ThemeToggle.tsx
'use client'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import React, { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, systemTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const current = theme === 'system' ? systemTheme : theme

  return (
    <button
      onClick={() => setTheme(current === 'dark' ? 'light' : 'dark')}
      className="
        transition-colors
        cursor-pointer
      "
      aria-label="Toggle Dark Mode"
    >
      {current === 'dark'
        ? <Sun  className="w-5 h-5 text-white hover:text-gray-400" />
        : <Moon className="w-5 h-5 text-white hover:text-gray-400" />}
    </button>
  )
}
