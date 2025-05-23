'use client'

import React from 'react'
import useSWR from 'swr'
// WARNING: Github icon (and other brand icons) will be deprecated starting from Lucide v1.0.0
import {
  Github,
  Tag,
  Star,
  GitFork,
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

type Props = {
  owner?: string
  repo?: string
}

/**
 * Displays a compact GitHub repo badge.
 */
export function RepoBadge({
  owner = 'RnLe',
  repo = 'MeepStudio',
}: Props) {
  // Control whether to show stats
  const show = false

  // fetch repo data only if show is true
  const { data: repoData, error: repoError } = useSWR(
    show ? `https://api.github.com/repos/${owner}/${repo}` : null,
    fetcher,
    { refreshInterval: 60_000 }
  )

  // fetch latest release only if show is true and repoData is available
  const { data: relData } = useSWR(
    show && repoData ? `https://api.github.com/repos/${owner}/${repo}/releases/latest` : null,
    fetcher
  )

  const loading = !repoData && !repoError
  const tagName = relData?.tag_name ?? '—'
  const stars   = repoData?.stargazers_count?.toLocaleString() ?? '—'
  const forks   = repoData?.forks_count?.toLocaleString() ?? '—'

  // new: open repo in new tab on click
  const handleClick = () => {
    window.open(
      `https://github.com/${owner}/${repo}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <div
      className={`
        inline-flex items-center gap-3 justify-center mx-8
        rounded-lg px-4 dark:bg-slate-600 bg-slate-500
        text-sm text-indigo-50 shadow-lg cursor-pointer
        min-w-[200px] dark:hover:bg-slate-500 hover:bg-slate-600 transition-colors duration-75
      `}
      role="button"
      tabIndex={0}
      onClick={handleClick}
    >
      {/* Left column: GitHub icon */}
      <Github size={24} strokeWidth={2} className="shrink-0" />

      {/* Right column: two rows or centered name */}
      <div className={`flex flex-col justify-between ${!show ? 'justify-center h-[40px]' : ''}`}>
        {/* Top row: owner/repo */}
        <span className="font-semibold">
          {owner}/{repo}
        </span>

        {/* Bottom row: stats */}
        {show && (
          <div className="mt-1 flex items-center gap-4">
            <Stat icon={Tag}    label={tagName} loading={loading} />
            <Stat icon={Star}   label={stars}   loading={loading} />
            <Stat icon={GitFork} label={forks}  loading={loading} />
          </div>
        )}
      </div>
    </div>
  )
}

/** Small helper for each number + icon pill */
function Stat({
  icon: Icon,
  label,
  loading,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  label: string
  loading: boolean
}) {
  return (
    <span className="flex items-center gap-1">
      <span className="shrink-0">
        <Icon size={16} strokeWidth={2} />
      </span>
      {loading ? '…' : label}
    </span>
  )
}
