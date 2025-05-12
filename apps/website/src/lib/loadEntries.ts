import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import { parseISO } from 'date-fns'

export type Entry = {
  version: string
  date:    string
  domains: string[]
  types:   string[]
  mdx:     any
}

export async function loadEntries(): Promise<Entry[]> {
  const dir   = path.join(process.cwd(), 'changelog')
  const files = (await fs.readdir(dir)).filter(f => f.endsWith('.mdx'))

  const all = await Promise.all(
    files.map(async filename => {
      const raw       = await fs.readFile(path.join(dir, filename), 'utf8')
      const { data, content } = matter(raw)
      const mdx       = await serialize(content)
      return { 
        version: data.version,
        date:    data.date,
        domains: data.domains,
        types:   data.types,
        mdx
      }
    })
  )

  return all.sort((a,b) =>
    parseISO(b.date).getTime() - parseISO(a.date).getTime()
  )
}