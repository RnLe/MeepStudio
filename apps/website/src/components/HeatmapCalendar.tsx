'use client';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { cloneElement } from 'react';

import { differenceInDays, parseISO, subDays } from 'date-fns';
import clsx from 'clsx';
import meta from '../../public/changelog-meta.json';

type ChangeKind   = 'major' | 'minor' | 'patch';
type RawDatum     = { date: string; type: ChangeKind; version: string };
// explicit datum shape: date stays string, value is our ChangeKind
type HeatmapDatum = { date: string; value: ChangeKind };

type TooltipPayload = {
  /** ISO date string for this square */
  date: string;
  /** Numeric intensity or other semantic level */
  level: number;
  /** future-proof: any extra data can be merged in */
  [key: string]: unknown;
};

const BASE_STYLING =  `dark:fill-[#151b23] dark:bg-[#151b23] fill-neutral-300 bg-neutral-300`;
const PATCH_STYLING = `fill-[#7cae93] bg-[#7cae93]`;
const MINOR_STYLING = `fill-[#f3dbba] bg-[#f3dbba]`;
const MAJOR_STYLING = `fill-[#c96e5a] bg-[#c96e5a]`;


// add a static list of legend entries matching heatmap CSS classes
type LegendItem = { label: string; className: string };
const LEGEND_ITEMS: LegendItem[] = [
  { label: 'No changes', className: `${BASE_STYLING}` },
  { label: 'Patch',      className: `${PATCH_STYLING}` },
  { label: 'Minor',      className: `${MINOR_STYLING}` },
  { label: 'Major',      className: `${MAJOR_STYLING}` },
];

export default function HeatmapCalendar() {
  /** ───────────────────────────── transform raw JSON → library shape */
  const data: HeatmapDatum[] = (meta as RawDatum[]).map(({ date, type }) => ({
    date,
    value: type,
  }));

  // sort by ISO date ascending so start/end are always correct
  data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!data.length) {
    return (
      <p className="py-6 text-center text-sm">No changes available.</p>
    );
  }

  const start = parseISO(data[0].date);
  const end   = parseISO(data[data.length - 1].date);
  const days  = Math.min(differenceInDays(end, start) + 1, 365);

  // <-- new: map ChangeKind to numeric intensity
  const versionMapping: Record<ChangeKind, number> = {
    patch: 0,
    minor: 1,
    major: 2,
  };
  const heatmapValues = data.map(d => ({
    date: new Date(d.date),
    count: versionMapping[d.value],
  }));

  return (
    <section className="py-4 flex flex-row justify-center">
      <div className="w-1/2">
        <CalendarHeatmap
          startDate={subDays(start, 1)}
          endDate={new Date(end)}
          showWeekdayLabels={true}
          horizontal={false}
          values={heatmapValues}
          gutterSize={3}
          showMonthLabels={true}
          transformDayElement={(dayElement, value, index) =>
            cloneElement(
              dayElement as React.ReactElement<any, any>,
              {
                title: value?.date?.toString?.(),
                className: clsx(
              dayElement.className,
              (!value || value.count === undefined) && BASE_STYLING,
              value?.count === 0 && PATCH_STYLING,
              value?.count === 1 && MINOR_STYLING,
              value?.count === 2 && MAJOR_STYLING
                ),
                stroke: '#ffffff3f',
                strokeWidth: 0.5,
                rx: 3,
                ry: 3,
              }
            )
          }
        />
      </div>

      <Legend />
    </section>
  );
}

function Legend() {
  return (
    <div className="ml-4 flex flex-col gap-2 text-xs">
      {LEGEND_ITEMS.map(({ label, className }) => (
        <span key={label} className="flex items-center gap-1">
          <span className={clsx('inline-block h-3 w-3 rounded-sm', className)} />
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}