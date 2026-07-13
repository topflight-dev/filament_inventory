'use client';

import { useMemo, useState } from 'react';
import type { ColorRecord } from '@/lib/supabase/queries';

const FINISH_FILTERS = [
  'All',
  'Solid',
  'Matte',
  'Gradient',
  'Silk',
  'Satin',
  'Translucent',
  'Specialty',
];

/** Ported 1:1 from js/inventory.js getSwatchStyle() */
function getSwatchStyle(item: ColorRecord): React.CSSProperties {
  const c1 = item.colorHex1;
  const c2 = item.colorHex2;
  const c3 = item.colorHex3;

  if (c1 && !c2) {
    return { backgroundColor: c1 };
  }
  if (c1 && c2 && !c3) {
    return {
      background: `linear-gradient(to right, ${c1} 50%, ${c2} 50%)`,
    };
  }
  if (c1 && c2 && c3) {
    return {
      background: `linear-gradient(to right, ${c1} 33%, ${c2} 33%, ${c2} 66%, ${c3} 66%)`,
    };
  }
  return { backgroundColor: '#ccc' };
}

/**
 * InventoryGrid — Client Component for search + finish filtering.
 * Data itself is fetched server-side (see page.tsx) and passed in as props;
 * this component only handles interactive filtering, matching the legacy
 * js/inventory.js behavior (search input + finish filter buttons) without
 * needing a client-side Supabase round-trip.
 */
export default function InventoryGrid({ items }: { items: ColorRecord[] }) {
  const [search, setSearch] = useState('');
  const [finish, setFinish] = useState('All');

  const filtered = useMemo(() => {
    let result = items;

    if (finish !== 'All') {
      result = result.filter((item) =>
        finish === 'Solid'
          ? item.finish === 'Solid' || item.finish === 'Basic' || item.finish === ''
          : item.finish === finish
      );
    }

    const term = search.toLowerCase().trim();
    if (term) {
      result = result.filter(
        (item) =>
          item.color.toLowerCase().includes(term) ||
          item.finish.toLowerCase().includes(term) ||
          (item.description ?? '').toLowerCase().includes(term)
      );
    }

    return result;
  }, [items, search, finish]);

  return (
    <>
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3 px-6 py-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search colors, finishes..."
          className="w-64 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2 px-6 pb-4">
        {FINISH_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFinish(f)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              finish === f
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-5 px-6 py-6">
        {filtered.length === 0 && (
          <p className="text-zinc-500">No matching filament found.</p>
        )}
        {filtered.map((item) => (
          <div
            key={item.id}
            className="w-52 rounded-lg border border-zinc-300 bg-white p-3 text-center"
          >
            <div
              className="mx-auto mb-2 h-24 w-24 rounded-md border border-zinc-300"
              style={getSwatchStyle(item)}
            />
            <h3 className="font-semibold text-zinc-800">
              {item.color || 'Unknown Color'}
            </h3>
            <p className="text-sm text-zinc-500">
              Finish: {item.finish || 'Unknown Finish'}
            </p>
            {item.description && (
              <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
