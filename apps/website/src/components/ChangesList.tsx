'use client';

import React, { Suspense, useEffect, useRef, useMemo, lazy } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { changelogOrder } from '../../changelog';
import type { TOCHeader } from './TableOfContents';
import meta from '../../public/changelog-meta.json';
type ChangeKind = 'major' | 'minor' | 'patch';
type RawDatum = { date: string; type: ChangeKind; version: string };

function ChangelogEntry({ file }: { file: string }) {
  // memoize the lazy loader per file
  const Entry = useMemo(
    () =>
      lazy(() =>
        import(
          /* webpackChunkName: "changelog-[request]" */
          `../../changelog/mdx/a${file.replace(/_/g, '.')}.mdx`
        )
      ),
    [file]
  );

  return (
    <Suspense fallback={null}>
      <Entry />
    </Suspense>
  );
}

interface ChangesListProps {
  // switch to a React state setter so functional updates are allowed
  setHeaders: Dispatch<SetStateAction<TOCHeader[]>>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function ChangesList({ setHeaders }: ChangesListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateHeaders = () => {
      // explicitly type as HTMLHeadingElement so `h.id`, `h.tagName` etc. are known
      const headers: TOCHeader[] = [];
      const headingElements = Array.from(
        containerRef.current!.querySelectorAll<HTMLHeadingElement>('h1, h2, h3')
      );
      let context: string[] = [];
      headingElements.forEach((h) => {
        const text = h.textContent?.trim() || '';
        const level = Number(h.tagName.slice(1)) as 1 | 2 | 3;
        if (level === 1) {
          context = [text];
        } else if (level === 2) {
          context = [context[0] || '', text];
        } else {
          // level === 3
          context = [context[0] || '', context[1] || '', text];
        }
        const rawId = context.join('-');
        const id = slugify(rawId);
        h.id = id;
        // pick up the update kind from enclosing article
        const kind = (h.closest('article')?.getAttribute('data-kind') as ChangeKind) ?? 'patch';
        const date = h.closest('article')?.getAttribute('data-date') ?? '';
        headers.push({ id, text, level, type: kind, date });
      });

      setHeaders((prev) => {
        if (
          prev.length === headers.length &&
          prev.every((h, i) =>
            h.id === headers[i].id &&
            h.level === headers[i].level &&
            h.text === headers[i].text
          )
        ) {
          return prev;
        }
        return headers;
      });
    };

    // initial scan + observer setup
    updateHeaders();
    const observer = new MutationObserver(updateHeaders);
    observer.observe(containerRef.current, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [setHeaders]); // run only once

  return (
    <div className="space-y-14" ref={containerRef}>
      {changelogOrder
        .slice()
        .reverse()
        .map((file) => {
        // derive version & lookup its change kind
        const version = file.replace(/_/g, '.');
        const entryMeta = (meta as RawDatum[]).find(m => m.version === version);
        const kind: ChangeKind = entryMeta?.type ?? 'patch';
        const date = entryMeta?.date ?? '';
        // prefix text
        const prefix = kind === 'major'
          ? 'Major Update - '
          : kind === 'minor'
            ? 'Minor Update - '
            : 'Patch - ';
        // colored left border
        const borderClass = kind === 'major'
          ? 'border-l-4 border-[#c96e5a]'
          : kind === 'minor'
            ? 'border-l-4 border-[#f3dbba]'
            : 'border-l-4 border-[#7cae93]';

         return (
          <article
            key={file}
            data-kind={kind}
            data-date={date}
            className={`prose dark:prose-invert max-w-none ${borderClass} pl-4`}
          >
            {/* theme-sensitive horizontal separator */}
            <hr className="border-t-2 border-gray-600 dark:border-gray-200 my-8" />
            <ChangelogEntry file={file} />
          </article>
         );
       })}
    </div>
  );
}

// If local styling of the MDX is needed for the version pages, add it like this:
// import Welcome from '@/markdown/welcome.mdx'
 
// function CustomH1({ children }) {
//   return <h1 style={{ color: 'blue', fontSize: '100px' }}>{children}</h1>
// }
 
// const overrideComponents = {
//   h1: CustomH1,
// }
 
// export default function Page() {
//   return <Welcome components={overrideComponents} />
// }