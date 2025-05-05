'use client'

import React from 'react'
import { Terminal, Monitor, Apple } from 'lucide-react'

type Platform = {
  name: string
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
}

export function DownloadPagePlaceholder() {
  const platforms: Platform[] = [
    { name: 'Linux',   Icon: Terminal },
    { name: 'Windows', Icon: Monitor },
    { name: 'macOS',   Icon: Apple },
  ]

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full h-full px-8">
      {platforms.map(({ name, Icon }) => (
        <div
          key={name}
          style={{ perspective: '1000px' }}
          className="
            flex flex-col justify-between
            flex-1 rounded-xl p-6
            transform transition-transform duration-300
            hover:scale-105 hover:rotate-y-3 hover:rotate-x-2
            shadow-md
            dark:bg-[#376789]
            dark:shadow-lg
            dark:shadow-neutral-900/50
            dark:text-blue-100
            cursor-pointer
            border-1 dark:border-none border-gray-300
          "
        >
          <Icon size={48} className="mb-4 dark:text-blue-200" />
          <h3 className="text-2xl font-bold mb-4">{name}</h3>

          <div className="space-y-2">
            <p>
              <span className="font-semibold">Version:</span> v1.2.3
            </p>
            <p>
              <span className="font-semibold">Downloads:</span> 1.2K
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-block rounded-full px-3 py-1 text-xs font-medium dark:bg-slate-800 bg-neutral-200 dark:text-blue-100 border-1 border-gray-300 dark:border-none">
                beta
              </span>
              <span className="inline-block rounded-full px-3 py-1 text-xs font-medium dark:bg-slate-800 bg-neutral-200 dark:text-blue-100 border-1 border-gray-300 dark:border-none">
                latest
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
