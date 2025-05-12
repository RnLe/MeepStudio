'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { agoTimeToString } from '@meepstudio/helpers';

export type ChangeKind = 'major' | 'minor' | 'patch';
const kindColors: Record<ChangeKind, string> = {
  major: '#c96e5a',
  minor: '#f3dbba',
  patch: '#7cae93',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TOCHeader {
  id: string;
  text: string;
  level: 1 | 2 | 3;
  type: ChangeKind;
  date: string;
}

interface TocNode {
  header: TOCHeader;
  children?: TocNode[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildTree(headers: TOCHeader[]): TocNode[] {
  const tree: TocNode[] = [];
  let currentH1: TocNode | undefined;
  let currentH2: TocNode | undefined;

  headers.forEach((h) => {
    switch (h.level) {
      case 1:
        currentH1 = { header: h, children: [] };
        tree.push(currentH1);
        currentH2 = undefined;
        break;
      case 2:
        if (currentH1) {
          currentH2 = { header: h, children: [] };
          currentH1.children!.push(currentH2);
        }
        break;
      case 3:
        if (currentH2) {
          currentH2.children!.push({ header: h });
        }
        break;
    }
  });

  return tree;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface Props {
  headers: TOCHeader[];
  onSelect?: (id: string) => void;
}

/**
 * Collapsible, three‑level table‑of‑contents for the changelog column.
 * Everything is *collapsed* by default – new headings that appear later (e.g.
 * after a client‑side fetch) are collapsed too, but a user‑opened section
 * remains open when content is refreshed.
 */
export default function TableOfContents({ headers, onSelect }: Props) {
  const tree = useMemo(() => buildTree(headers), [headers]);

  /**
   * The sets hold the *collapsed* keys.  Initially no keys are known because
   * `headers` may still be empty.  A `useEffect` below keeps the sets in sync
   * whenever the tree changes, *adding* freshly discovered keys so new items
   * start collapsed while preserving the user’s previous openings.
   */
  const [collapsedL1, setCollapsedL1] = useState<Set<string>>(new Set());
  const [collapsedL2, setCollapsedL2] = useState<Set<string>>(new Set());

  // -------------------------------------------------------
  //  Sync collapse state with (potentially) new headings
  // -------------------------------------------------------
  useEffect(() => {
    setCollapsedL1((prev) => {
      const next = new Set(prev);
      tree.forEach((_, i) => next.add(String(i)));
      return next;
    });

    setCollapsedL2((prev) => {
      const next = new Set(prev);
      tree.forEach((n, i) =>
        n.children?.forEach((_, j) => next.add(`${i}-${j}`)),
      );
      return next;
    });
  }, [tree]);

  // -------------------------------------------------------
  //  Helpers
  // -------------------------------------------------------
  const toggle = (
    setFn: React.Dispatch<React.SetStateAction<Set<string>>>,
    key: string,
  ) =>
    setFn((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // -------------------------------------------------------
  //  Render
  // -------------------------------------------------------
  return (
    <nav
      aria-label="Table of contents"
      className="text-sm leading-relaxed select-none"
    >
      <h2 className="text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400 mb-2">
        {tree.length > 0 ? 'Overview' : ''}
      </h2>

      <ul className="space-y-1">
        {tree.map((h1, i) => {
          // use the provided type from header
          const kind: ChangeKind = h1.header.type;
          const color = kindColors[kind];
          const timeAgo = agoTimeToString(Date.parse(h1.header.date) / 1000);
          const h1Key = String(i);
          const h1Collapsed = collapsedL1.has(h1Key);

          return (
            <li key={h1Key} className="pt-1">
              <div className="flex items-center">
                <button
                  type="button"
                  aria-label="Toggle section"
                  className="transition-transform cursor-pointer group"
                  onClick={() => toggle(setCollapsedL1, h1Key)}
                >
                  {h1Collapsed
                    ? <ChevronRight size={16} color={color} className="group-hover:stroke-4" />
                    : <ChevronDown size={16} color={color} className="group-hover:stroke-4" />
                  }
                </button>

                <a
                  href={`#${h1.header.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelect?.(h1.header.id);
                    document
                      .getElementById(h1.header.id)
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:underline focus-visible:underline outline-none"
                >
                  {h1.header.text}
                </a>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 px-6">
                  {timeAgo}
                </span>
              </div>

              {!h1Collapsed && h1.children?.length ? (
                <ul
                  className="pl-4 ml-1 border-l-2 space-y-1"
                  style={{ borderColor: color }}
                >
                  {h1.children.map((h2, j) => {
                    const h2Key = `${i}-${j}`;
                    const h2Collapsed = collapsedL2.has(h2Key);

                    return (
                      <li key={h2Key} className="pt-0.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="Toggle subsection"
                            className="transition-transform cursor-pointer group"
                            onClick={() => toggle(setCollapsedL2, h2Key)}
                          >
                            {h2Collapsed ? (
                              <ChevronRight size={12} className="group-hover:stroke-4" />
                            ) : (
                              <ChevronDown size={12} className="group-hover:stroke-4" />
                            )}
                          </button>
                          <a
                            href={`#${h2.header.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              onSelect?.(h2.header.id);
                              document
                                .getElementById(h2.header.id)
                                ?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="hover:underline focus-visible:underline outline-none"
                          >
                            {h2.header.text}
                          </a>
                        </div>

                        {!h2Collapsed && h2.children?.length ? (
                          <ul
                            className="pl-4 ml-1 border-l-2 space-y-1"
                            style={{ borderColor: color }}
                          >
                            {h2.children.map((h3, k) => (
                              <li key={`${h2Key}-${k}`} className="pt-0.5">
                                <a
                                  href={`#${h3.header.id}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    onSelect?.(h3.header.id);
                                    document
                                      .getElementById(h3.header.id)
                                      ?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className="text-xs hover:underline focus-visible:underline outline-none"
                                >
                                  {h3.header.text}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
