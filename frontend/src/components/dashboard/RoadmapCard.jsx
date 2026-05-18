import { useState } from 'react';
import CategoryLegend from './CategoryLegend';
import Roadmap from './Roadmap';

/**
 * 통합 로드맵 카드.
 *
 * Props
 *  - title (헤더 제목)
 *  - items, showNowMarker, rangeStart, rangeEnd  → Roadmap 으로 그대로 전달
 *  - carousel: { list, idx, onChange }  로드맵 본체 좌우 화살표만 노출 (선배용)
 *
 * 본체는 가로 스크롤(overflow-x-auto) — 연도 수가 많아 Roadmap 의 minWidth 가
 * 컨테이너를 넘으면 슬라이드해서 모든 마일스톤이 잘리지 않게.
 * 캐러셀 화살표는 스크롤 영역 밖(부모 relative)에 두어 스크롤 위치와 무관.
 *
 * 카테고리 필터: 우측 상단 CategoryLegend 의 칩 클릭으로 단일 카테고리만 표시.
 * 같은 칩 재클릭 시 전체 복귀. 타임라인 범위(rangeStart/End)는 필터와 무관하게
 * 부모가 계산한 값을 그대로 유지 — 가로 스케일이 흔들리지 않음.
 */
export default function RoadmapCard({
  title,
  items,
  showNowMarker,
  rangeStart,
  rangeEnd,
  carousel,
  seniorName,
}) {
  const hasCarousel = !!carousel;
  const [activeCat, setActiveCat] = useState(null);
  const visibleItems = activeCat
    ? (items ?? []).filter((it) => it.cat === activeCat)
    : items;
  const toggleCat = (k) =>
    setActiveCat((prev) => (prev === k ? null : k));

  return (
    <section className="bg-paper border border-border rounded-lg p-5 mb-4 min-w-0">
      {/* 헤더 — 좌: 제목 + (선배 이름) / 우: 범례 (좌측 컬럼 세로 중앙) */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="m-0 text-[15px] font-semibold text-ink-900">
            {title}
          </h2>
          {seniorName && (
            <div className="mt-1 text-[13px] font-semibold text-ink-700 break-keep">
              {seniorName}
            </div>
          )}
        </div>
        <CategoryLegend activeCat={activeCat} onToggle={toggleCat} />
      </div>

      {/* 본체 — 좌/우 화살표 + 로드맵 */}
      <div
        className="relative rounded-md mb-3"
        style={{ background: '#fafbfc', border: '1px solid #E5E9EF' }}
      >
        {hasCarousel && (
          <button
            onClick={() =>
              carousel.onChange(
                (carousel.idx - 1 + carousel.list.length) % carousel.list.length
              )
            }
            aria-label="이전 선배"
            className="absolute grid place-items-center text-ink-700 hover:bg-ink-50"
            style={{
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#fff',
              border: '1px solid #D7DEE8',
              boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
              zIndex: 4,
            }}
          >
            ‹
          </button>
        )}
        {hasCarousel && (
          <button
            onClick={() =>
              carousel.onChange((carousel.idx + 1) % carousel.list.length)
            }
            aria-label="다음 선배"
            className="absolute grid place-items-center text-ink-700 hover:bg-ink-50"
            style={{
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#fff',
              border: '1px solid #D7DEE8',
              boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
              zIndex: 4,
            }}
          >
            ›
          </button>
        )}
        <div
          className="overflow-x-auto"
          style={{ padding: hasCarousel ? '16px 52px' : 16 }}
        >
          <Roadmap
            items={visibleItems}
            showNowMarker={showNowMarker}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
          />
        </div>
      </div>
    </section>
  );
}
