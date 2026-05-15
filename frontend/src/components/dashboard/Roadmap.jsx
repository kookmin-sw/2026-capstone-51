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

  // 월 단위 좌표 → [0, 1]. xPct는 해당 월의 중앙(±15일)을 쓰지 않고 월 시작을 기준으로 계산.
  const ymToMonths = ({ y, m }) => y * 12 + (m - 1);
  const startM = ymToMonths(rangeStart);
  const endM = ymToMonths({ y: rangeEnd.y, m: rangeEnd.m + 1 }); // exclusive
  const span = Math.max(1, endM - startM);
  const xPct = ({ y, m }) => ((y * 12 + (m - 1) - startM) / span) * 100;

  // date 문자열에서 종료 시점을 파싱.
  //   "23.03 ~ 23.12"   → { y: 2023, m: 12 }
  //   "25.04 ~ 25.06"   → { y: 2025, m:  6 }
  //   "23.09 취득"      → { y: 2023, m:  9 }
  //   "24.11"           → { y: 2024, m: 11 }
  // 종료가 없는 형태면 시작(item.y/m)을 그대로 반환.
  function parseEndYM(it) {
    const s = String(it.date || '');
    const tilde = s.indexOf('~');
    const tail = tilde >= 0 ? s.slice(tilde + 1) : s;
    const m = tail.match(/(\d{2,4})\.(\d{1,2})/);
    if (!m) return { y: it.y, m: it.m };
    let yy = parseInt(m[1], 10);
    if (yy < 100) yy += 2000;
    return { y: yy, m: parseInt(m[2], 10) };
  }

  // 시간 순 정렬 + 인덱스. 마커 위치는 종료 시점 기준.
  const sorted = [...items]
    .map((it) => {
      const end = parseEndYM(it);
      return { ...it, _x: xPct(end), _endY: end.y, _endM: end.m };
    })
    .sort((a, b) => a._endY - b._endY || a._endM - b._endM);

  // 연도 구분선: 매년 1월 1일. rangeStart가 1월 1일이므로 첫 구분선은 rangeStart.y+1부터.
  const yearDividers = [];
  for (let y = rangeStart.y + 1; y <= rangeEnd.y; y++) {
    const startOfYear = ymToMonths({ y, m: 1 });
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
  // 연도 점선의 시작/끝 — 트랙 위·아래로 동일하게 확장
  const dividerTop = 18;
  const dividerBottom = trackY + 60;
  const dividerHeight = dividerBottom - dividerTop;
  // 연도 라벨 — 그래프 바로 아래 (점선 하단보다 약간 더 아래)
  const yearLabelTop = dividerBottom + 6;

  return (
    <div
      className="relative"
      style={{ height: heightPx }}
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
        const above = i % 2 === 0; // 1번째(idx 0) 위, 2번째 아래 …
        const isOpen = hoverIdx === i;
        const color = CAT_COLORS[it.cat];

        // 점 색 — 카테고리 색만 사용
        const dotBg = color;
        const dotBorder = color;

        // 칩 위치
        const chipTop = above ? 8 : trackY + 36;
        const connectorTop = above ? 30 : trackY + 4;
        const connectorH = above ? trackY - 30 - 4 : 28;

        return (
          <Fragment key={i}>
            {/* 점 */}
            <button
              type="button"
              onMouseEnter={() => setHoverIdx(i)}
              onFocus={() => setHoverIdx(i)}
              onClick={() => setHoverIdx(isOpen ? null : i)}
              aria-label={it.title}
              className="absolute rounded-full"
              style={{
                left: `${it._x}%`,
                top: trackY - 5,
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
