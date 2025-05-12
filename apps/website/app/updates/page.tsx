'use client';

import React, { useState, useRef } from 'react';
import HeatmapCalendar from '../../src/components/HeatmapCalendar';
import TableOfContents from '../../src/components/TableOfContents';
import ChangesList from '../../src/components/ChangesList';
import 'react-calendar-heatmap/dist/styles.css';
import type { TOCHeader } from '../../src/components/TableOfContents';

export default function UpdatesPage() {
  const [headers, setHeaders] = useState<TOCHeader[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-row h-full overflow-hidden">
      {/* Left — TOC */}
      <aside className="pr-2 w-1/4 h-full overflow-auto px-8">
        <TableOfContents
          headers={headers}
          onSelect={(id) => {
            const el = contentRef.current?.querySelector(`#${id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              history.replaceState(null, '', `#${id}`);
            }
          }}
        />
      </aside>

      {/* Centre — Content */}
      <main
        ref={contentRef}
        className="prose dark:prose-invert max-w-none w-1/2 h-full overflow-auto pt-10"
      >
        <h2 className="text-4xl font-bold">Update Policy</h2>
        <div
          className="update-policy"
          dangerouslySetInnerHTML={{ __html: getUpdatePolicyHTML() }}
        />
        <ChangesList setHeaders={setHeaders} />
      </main>

      {/* Right — Reserved */}
      <aside className="w-1/4 h-full">
        <HeatmapCalendar />
      </aside>
    </div>
  );
}

/**
 * Returns the HTML markup for the global update policy statement.
 * The site is currently in Alpha, versioning is semver-based,
 * and desktop-client compatibility will be aligned in future releases.
 */
function getUpdatePolicyHTML() {
  return `
    <div class="update-policy">
      <p>This site is in <strong>Alpha</strong>. Updates are driven by rapid prototyping; changes from Alpha to other channels (e.g. Beta) will be clearly indicated and <strong>will</strong> include backwards-incompatible updates.</p>
      <p>Version numbers apply only to the public GH Pages site and are independent of any future desktop client. When a desktop client is released, both will share versioning regarding the editor to indicate compatibility. The website will keep its own versioning.</p>
      <p>Versioning follows semantic conventions: <strong>Major</strong> for breaking changes, <strong>Minor</strong> for new features, <strong>Patch</strong> for bug fixes.</p>
    </div>
  `;
}
