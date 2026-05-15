import { CAT_LABELS, CAT_COLORS } from '../../data/dashboard';

/** 카테고리 5종 색상 범례 — 두 로드맵 카드에서 공유. */
export default function CategoryLegend() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {Object.entries(CAT_LABELS).map(([k, v]) => (
        <span
          key={k}
          className="inline-flex items-center gap-1.5 text-[11px] text-ink-700"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: CAT_COLORS[k] }}
          />
          {v}
        </span>
      ))}
    </div>
  );
}
