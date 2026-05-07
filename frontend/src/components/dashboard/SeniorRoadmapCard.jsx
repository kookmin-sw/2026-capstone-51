import { useState } from 'react';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import {
  SEMESTERS,
  SENIOR_ROADMAPS,
  CAT_LABELS,
  CAT_COLORS,
  ymToSemIndex,
} from '../../data/dashboard';

/**
 * 선배 3명을 좌우 화살표로 넘기며 보는 carousel.
 *  - 각 선배의 학기별 마일스톤을 같은 학기 축 위에 표시.
 *  - 카드 헤더에 합격 회사 / 시즌 메타.
 */
export default function SeniorRoadmapCard() {
  const [idx, setIdx] = useState(0);
  const total = SENIOR_ROADMAPS.length;
  const senior = SENIOR_ROADMAPS[idx];

  const buckets = SEMESTERS.map(() => []);
  senior.items.forEach((it) => {
    const i = ymToSemIndex(it.y, it.m);
    buckets[i].push(it);
  });

  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  return (
    <section className="card">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-800 flex items-center justify-center font-bold text-[13px]">
            {senior.name.replace('선배 ', '')}
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-ink-900 truncate">
              {senior.name}의 로드맵
            </h2>
            <p className="text-[12px] text-ink-500 mt-0.5 flex items-center gap-1.5">
              <Building2 size={12} strokeWidth={2} />
              {senior.co} · {senior.year} 합격
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prev}
            aria-label="이전 선배"
            className="btn-ghost btn-sm !p-1.5"
          >
            <ChevronLeft size={14} strokeWidth={2} />
          </button>
          <span className="text-[11px] text-ink-500 tabular-nums px-1.5">
            {idx + 1} / {total}
          </span>
          <button
            type="button"
            onClick={next}
            aria-label="다음 선배"
            className="btn-ghost btn-sm !p-1.5"
          >
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Track */}
      <div className="relative pt-2 pb-1">
        <div className="absolute left-0 right-0 top-[34px] h-px bg-ink-200" />
        <div className="grid grid-cols-8 gap-1">
          {SEMESTERS.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center">
              <div className="text-[11px] font-semibold text-ink-500 mb-2">
                {s.label}
              </div>
              <div className="relative h-3 w-full flex justify-center">
                <span className="block w-2 h-2 rounded-full bg-ink-200" />
              </div>
              <div className="mt-3 flex flex-col items-stretch gap-1.5 w-full">
                {buckets[i].map((m, j) => (
                  <SeniorMilestone key={j} item={m} />
                ))}
              </div>
              <div className="text-[10px] text-ink-400 mt-2">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeniorMilestone({ item }) {
  const color = CAT_COLORS[item.cat] || '#6B7280';
  const label = CAT_LABELS[item.cat] || '';
  return (
    <div
      className="rounded-md border border-ink-150 bg-paper px-2 py-1.5"
      style={{ borderLeft: `3px solid ${color}` }}
      title={`${item.title} · ${item.date}`}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <span
          className="text-[9px] font-semibold uppercase tracking-wide"
          style={{ color }}
        >
          {label}
        </span>
      </div>
      <div className="text-[11px] font-semibold text-ink-800 truncate">
        {item.title}
      </div>
      <div className="text-[10px] text-ink-500 truncate">{item.detail}</div>
    </div>
  );
}
