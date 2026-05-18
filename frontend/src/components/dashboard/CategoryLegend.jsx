import { CAT_LABELS, CAT_COLORS } from '../../data/dashboard';

/**
 * 카테고리 5종 색상 범례 — 두 로드맵 카드에서 공유.
 *  - activeCat / onToggle 가 주어지면 클릭 가능한 필터 칩으로 작동.
 *    클릭 시 해당 카테고리만 로드맵에 표시, 같은 칩 재클릭 시 전체 복귀.
 *    활성 칩은 사이드바 색(#1B306F)으로 텍스트 강조.
 */
export default function CategoryLegend({ activeCat, onToggle }) {
  const interactive = typeof onToggle === 'function';
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {Object.entries(CAT_LABELS).map(([k, v]) => {
        const isActive = interactive && activeCat === k;
        const baseCls =
          'inline-flex items-center gap-1.5 text-[11px] transition-colors';
        if (!interactive) {
          return (
            <span key={k} className={`${baseCls} text-ink-700`}>
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: CAT_COLORS[k] }}
              />
              {v}
            </span>
          );
        }
        return (
          <button
            type="button"
            key={k}
            onClick={() => onToggle(k)}
            className={`${baseCls} cursor-pointer ${
              isActive
                ? 'font-semibold'
                : 'text-ink-700 hover:text-ink-900'
            }`}
            style={isActive ? { color: '#1B306F' } : undefined}
            aria-pressed={isActive}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: CAT_COLORS[k] }}
            />
            {v}
          </button>
        );
      })}
    </div>
  );
}
