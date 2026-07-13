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
 *
 * Restyled for the "Creative Studio" warm theme: filament cards are now
 * soft-shadowed white rounded-2xl panels (instead of plain bordered boxes),
 * each with a sage-tinted "In Stock" badge (purely presentational — this
 * grid only ever receives already-filtered inStock=true rows from the
 * server, so the badge reflects existing data, no new logic/queries added).
 * Search input + finish-filter pills use terracotta/sage accents in place
 * of the legacy blue.
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
          className="w-64 rounded-full border border-[#3D3D3D]/15 bg-white px-4 py-2 text-sm text-[#3D3D3D] shadow-sm transition-colors focus:border-[#E76F51] focus:ring-2 focus:ring-[#E76F51]/25 focus:outline-none"
        />
      </div>

      <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2 px-6 pb-4">
        {FINISH_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFinish(f)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              finish === f
                ? 'border-[#E76F51] bg-[#E76F51] text-white'
                : 'border-[#3D3D3D]/15 bg-white text-[#3D3D3D] hover:bg-[#2A9D8F]/10 hover:text-[#2A9D8F]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-5 px-6 py-6">
        {filtered.length === 0 && (
          <p className="text-[#3D3D3D]/60">No matching filament found.</p>
        )}
        {filtered.map((item) => (
          <div
            key={item.id}
            className="w-52 rounded-2xl bg-white p-4 text-center shadow-[0_4px_20px_rgba(61,61,61,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(61,61,61,0.12)]"
          >
            <div
              className="mx-auto mb-3 h-24 w-24 rounded-xl border border-[#3D3D3D]/10"
              style={getSwatchStyle(item)}
            />
            <h3 className="font-semibold text-[#3D3D3D]">
              {item.color || 'Unknown Color'}
            </h3>
            <p className="mt-0.5 text-sm text-[#3D3D3D]/60">
              Finish: {item.finish || 'Unknown Finish'}
            </p>
            {item.description && (
              <p className="mt-1 text-xs text-[#3D3D3D]/50">{item.description}</p>
            )}
            <span className="mt-3 inline-block rounded-full bg-[#2A9D8F]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2A9D8F]">
              In Stock
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
