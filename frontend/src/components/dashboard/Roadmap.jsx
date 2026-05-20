import { useState, Fragment } from 'react';
import { CAT_LABELS, CAT_COLORS } from '../../data/dashboard';

/**
 * 실제 날짜(년·월) 기반 학창시절 로드맵.
 *
 *  - X축: 입학(start) ~ 졸업(end) 사이 비율 위치
 *  - 점은 hover/click 시에만 상세 칩(카테고리·제목·날짜·detail) 표시
 *  - 마일스톤 인덱스 홀수=위, 짝수=아래 교대 배치
 *
 * Props
 *  - items: [{ y, m, cat, title, date, detail }]
 *  - rangeStart?: { y, m }     기본: 2022-01
 *  - rangeEnd?:   { y, m }     기본: 2026-12 — 점선-점선 사이 한 칸 = 한 연도
 */
export default function Roadmap({
  items,
  rangeStart = { y: 2022, m: 1 },
  rangeEnd = { y: 2026, m: 12 },
}) {
  const [hoverIdx, setHoverIdx] = useState(null);

  // 일 단위 좌표 → [0, 1]. 월 안에서 일자에 따라 fractional offset 도 더해 정밀하게 위치.
  // 한 달은 ~30일로 근사 (정확한 일수는 시각화 정밀도에 큰 영향 없음).
  const ymdToMonths = ({ y, m, d = 1 }) =>
    y * 12 + (m - 1) + Math.max(0, (d - 1)) / 30;
  const startM = ymdToMonths(rangeStart);
  const endM = ymdToMonths({ y: rangeEnd.y, m: rangeEnd.m + 1 }); // exclusive
  const span = Math.max(1, endM - startM);
  const xPct = ({ y, m, d }) => ((ymdToMonths({ y, m, d }) - startM) / span) * 100;

  // 시간 순 정렬 + 인덱스. 마커 위치는 종료 시점(연·월·일) 기준.
  // buildRoadmap 에서 endY/endM/endD 를 채워주므로 그대로 사용.
  const sorted = [...items]
    .map((it) => {
      const end = { y: it.endY ?? it.y, m: it.endM ?? it.m, d: it.endD ?? 1 };
      return {
        ...it,
        _x: xPct(end),
        _endY: end.y,
        _endM: end.m,
        _endD: end.d,
      };
    })
    .sort(
      (a, b) =>
        a._endY - b._endY || a._endM - b._endM || a._endD - b._endD
    );

  // 같은 종료일자(_x 가 동일) 항목들이 한 점에 겹쳐 안 보이는 문제 방지 —
  // 중첩된 항목들만 트랙 위/아래로 교대 배치 (단일 항목은 트랙 위 그대로).
  //   - _stackTotal: 같은 x 의 총 항목 수
  //   - _stack:     같은 x 그룹 안에서의 인덱스 (0,1,2,...)
  const xTotalCount = new Map();
  sorted.forEach((it) => {
    const key = it._x.toFixed(2);
    xTotalCount.set(key, (xTotalCount.get(key) ?? 0) + 1);
  });
  const xStackCount = new Map();
  sorted.forEach((it) => {
    const key = it._x.toFixed(2);
    const idx = xStackCount.get(key) ?? 0;
    it._stack = idx;
    it._stackTotal = xTotalCount.get(key);
    xStackCount.set(key, idx + 1);
  });

  // 연도 구분선: 매년 1월 1일. rangeStart가 1월 1일이므로 첫 구분선은 rangeStart.y+1부터.
  const yearDividers = [];
  for (let y = rangeStart.y + 1; y <= rangeEnd.y; y++) {
    const startOfYear = ymdToMonths({ y, m: 1 });
    const left = ((startOfYear - startM) / span) * 100;
    yearDividers.push({ key: y, left });
  }

  // 연도 라벨 — 구간(점선-점선) 가운데. 첫 구간은 [0, 첫구분선], 마지막 구간은 [마지막구분선, 100]
  const yearLabels = [];
  const boundaries = [0, ...yearDividers.map((d) => d.left), 100];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const center = (boundaries[i] + boundaries[i + 1]) / 2;
    const yearForSegment = rangeStart.y + i;
    yearLabels.push({
      key: yearForSegment,
      left: center,
      label: String(yearForSegment),
    });
  }

  const trackY = 100;
  const heightPx = 200;
  // 연도 수가 많아지면 그래프가 좁아 가독성이 떨어지므로 연도당 최소 폭을 잡고,
  // 부모(RoadmapCard)에서 overflow-x-auto 로 가로 스크롤되게 한다.
  const PX_PER_YEAR = 150;
  const yearSpan = rangeEnd.y - rangeStart.y + 1;
  const minWidth = yearSpan * PX_PER_YEAR;
  // 연도 점선의 시작/끝 — 트랙 위·아래로 동일하게 확장
  const dividerTop = 18;
  const dividerBottom = trackY + 60;
  const dividerHeight = dividerBottom - dividerTop;
  // 연도 라벨 — 그래프 바로 아래 (점선 하단보다 약간 더 아래)
  const yearLabelTop = dividerBottom + 6;

  return (
    <div
      className="relative"
      style={{ height: heightPx, minWidth }}
      onMouseLeave={() => setHoverIdx(null)}
    >
      {/* 트랙 */}
      <div
        className="absolute"
        style={{
          left: '1.5%',
          right: '1.5%',
          top: trackY - 1,
          height: 2,
          background: '#E3EAF3',
          borderRadius: 2,
          zIndex: 1,
        }}
      />

      {/* 연도 구분선 — 트랙 위·아래로 동일하게 회색 점선 */}
      {yearDividers.map((d) => (
        <div
          key={`div-${d.key}`}
          className="absolute"
          style={{
            left: `${d.left}%`,
            top: dividerTop,
            height: dividerHeight,
            width: 1,
            background:
              'repeating-linear-gradient(to bottom, #CBD5E1 0 3px, transparent 3px 6px)',
            transform: 'translateX(-0.5px)',
            zIndex: 1,
          }}
        />
      ))}

      {/* 연도 라벨 — 그래프 바로 아래, 점선 사이 가운데 정렬 */}
      {yearLabels.map((y) => (
        <div
          key={y.key}
          className="absolute whitespace-nowrap text-center"
          style={{
            left: `${y.left}%`,
            top: yearLabelTop,
            transform: 'translateX(-50%)',
            fontSize: 11,
            fontWeight: 600,
            color: '#64748B',
            zIndex: 2,
            letterSpacing: '0.02em',
          }}
        >
          {y.label}
        </div>
      ))}

      {/* 마일스톤 점 + hover 시 칩 */}
      {sorted.map((it, i) => {
        const isOpen = hoverIdx === i;
        const color = CAT_COLORS[it.cat];

        // 점 색 — 카테고리 색만 사용
        const dotBg = color;
        const dotBorder = color;

        // 단일 항목은 트랙 위에 정상 위치. 같은 x 가 2 개 이상이면 stack 인덱스 짝수=위 / 홀수=아래로 교대.
        const stack = it._stack ?? 0;
        const total = it._stackTotal ?? 1;
        let dotTopOffset = 0;
        let above = stack % 2 === 0; // 짝수 stack 은 위 (chip 도 위로), 홀수는 아래
        if (total > 1) {
          const step = Math.floor(stack / 2) + 1; // 1,1,2,2,...
          dotTopOffset = (above ? -1 : 1) * step * 12;
        } else {
          above = i % 2 === 0; // 단일 항목은 기존 방식(인덱스 패리티로 chip 위/아래)
        }

        // 칩 위치 — above 따라 위/아래
        const chipTop = above ? 8 : trackY + 36;
        const connectorTop = above ? 30 : trackY + 4;
        const connectorH = above ? trackY - 30 - 4 : 28;

        return (
          <Fragment key={i}>
            {/* 점 — 중첩이면 위/아래 교대 배치, 단일이면 트랙 위. */}
            <button
              type="button"
              onMouseEnter={() => setHoverIdx(i)}
              onFocus={() => setHoverIdx(i)}
              onClick={() => setHoverIdx(isOpen ? null : i)}
              aria-label={it.title}
              className="absolute rounded-full"
              style={{
                left: `${it._x}%`,
                top: trackY - 5 + dotTopOffset,
                transform: 'translateX(-50%)',
                width: 11,
                height: 11,
                padding: 0,
                background: dotBg,
                border: '2px solid ' + dotBorder,
                boxShadow:
                  '0 0 0 3px #fff' +
                  (isOpen ? ', 0 2px 8px rgba(30,66,120,0.25)' : ''),
                cursor: 'pointer',
                zIndex: isOpen ? 11 : 3,
              }}
            />

            {/* hover 시에만: 커넥터 */}
            {isOpen && (
              <div
                className="absolute"
                style={{
                  left: `${it._x}%`,
                  top: connectorTop,
                  width: 1,
                  height: connectorH,
                  background: color,
                  opacity: 0.5,
                  transform: 'translateX(-0.5px)',
                  zIndex: 9,
                }}
              />
            )}

            {/* hover 시에만: 칩 */}
            {isOpen && (
              <div
                className="absolute"
                style={{
                  left: `${it._x}%`,
                  top: chipTop,
                  transform: 'translateX(-50%)',
                  zIndex: 10,
                }}
              >
                <div
                  className="bg-paper rounded-md whitespace-nowrap"
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #E3EAF3',
                    borderLeft: '3px solid ' + color,
                    boxShadow: '0 4px 14px rgba(15,23,42,0.10)',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      style={{
                        fontSize: 9.5,
                        color,
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {CAT_LABELS[it.cat]}
                    </span>
                    <span className="text-[9px] text-ink-300">·</span>
                    <span className="text-xs font-semibold text-ink-900">
                      {it.title}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-ink-500">
                    {it.date}
                    {it.detail ? ' · ' + it.detail : ''}
                  </div>
                </div>
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
