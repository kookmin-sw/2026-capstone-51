import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * 페이지 상단 breadcrumb. 마지막 항목은 강조됨.
 * items: string[] | { label, to? }[]
 */
export default function Crumbs({ items = [] }) {
  const norm = items.map((it) => (typeof it === 'string' ? { label: it } : it));
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-ink-500 mb-3">
      {norm.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <ChevronRight size={12} strokeWidth={2} className="text-ink-300" />
          )}
          <span
            className={
              i === norm.length - 1 ? 'text-ink-700 font-semibold' : ''
            }
          >
            {it.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}
