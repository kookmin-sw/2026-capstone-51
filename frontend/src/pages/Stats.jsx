import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Crumbs from '../components/Crumbs';
import { cn } from '../lib/cn';
import {
  STATS_GROUP_LABEL,
  pickStat,
  weakPointLabel,
  EXPERIENCE_CATEGORY_LABEL,
} from '../lib/enums';
import { useMyStats } from '../api/queries/useMe';
import { CAT_COLORS } from '../data/dashboard';

const GROUP_KEYS = Object.keys(STATS_GROUP_LABEL);

function cycleGroup(current, direction) {
  const idx = GROUP_KEYS.indexOf(current);
  const next = (idx + direction + GROUP_KEYS.length) % GROUP_KEYS.length;
  return GROUP_KEYS[next];
}

/**
 * /stats — 통계 페이지.
 *
 * 데이터 소스: GET /users/me/stats?groupBy=  (응답: { statistics, weakPoints[] })
 *  - statistics.{partTime,external,internal,license,intern}.{avg, userCount, myCount}
 *      → pickStat 으로 프론트 5축 키(parttime/activity/internal/cert/intern) 로 매핑.
 *  - weakPoints[]: { type, recommendedItems[] } — 부족한 카테고리 + 추천 항목.
 *
 * groupBy: 'STATE' | 'SCHOOL_NUM' | 'WORKER' (lib/enums.js STATS_GROUP_LABEL)
 *
 * 디자인 (2026-05-10 통합 카드 개편):
 *  - 단일 .card !p-0 셸 안에 3개 섹션을 divider 로 분리:
 *    1. FiveAxisCompare — 좌우 chevron carousel 로 비교 그룹(STATE/SCHOOL_NUM/WORKER) 토글.
 *       상단 필터 버튼은 제거됨.
 *    2. MyDistribution — 2D 도넛(260px). 슬라이스마다 흰색 stroke (작은 슬라이스는 stroke 얇게)
 *       로 경계/외곽선. hover 시 scale(1.05) + drop-shadow 로 z 축으로 솟듯이 강조,
 *       마우스 커서 우측에 따라다니는 툴팁(라벨/건수/%). 범례는 하단 우측에 작게.
 *    3. Shortages — 부족 카테고리 + 추천 경험. 없으면 "다른 집단 비교 권고".
 */
const FIVE_AXIS = [
  { key: 'internal', label: '대내활동' },
  { key: 'activity', label: '대외활동' },
  { key: 'intern', label: '인턴' },
  { key: 'parttime', label: '아르바이트' },
  { key: 'cert', label: '자격증' },
];

export default function Stats() {
  const [groupBy, setGroupBy] = useState('STATE'); // 'STATE' | 'SCHOOL_NUM' | 'WORKER'
  const q = useMyStats(groupBy);

  const view = useMemo(() => {
    const stats = q.data?.statistics;
    const myCount = pickStat(stats, 'myCount');
    const peerAvg = pickStat(stats, 'avg');
    const peerCount = stats?.partTime?.userCount ?? 0;
    return {
      peerCount,
      byCategory: FIVE_AXIS.map((a) => ({
        ...a,
        me: myCount[a.key] || 0,
        peers: peerAvg[a.key] || 0,
      })),
      distribution: FIVE_AXIS.map((a) => ({
        ...a,
        value: myCount[a.key] || 0,
      })),
      shortages: (q.data?.weakPoints || []).map((wp) => {
        const label = weakPointLabel(wp.type);
        // 본인/평균 카운트는 5축 매핑에서 다시 가져와 안내 카피 생성에 사용.
        const axis = FIVE_AXIS.find(
          (a) => EXPERIENCE_CATEGORY_LABEL[a.key] === label
        );
        const me = axis ? myCount[axis.key] || 0 : 0;
        const peers = axis ? peerAvg[axis.key] || 0 : 0;
        return {
          category: label || wp.type,
          me,
          peers,
          suggestions: wp.recommendedItems || [],
        };
      }),
    };
  }, [q.data]);

  return (
    <>
      <Crumbs items={['통계']} />

      <header className="flex items-end justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink-900">
            통계
          </h1>
          <p className="text-[12.5px] text-ink-500 mt-1">
            같은 그룹 친구들의 평균과 내 경험을 비교해보세요.
          </p>
        </div>
      </header>

      {q.isLoading ? (
        <Loading />
      ) : q.isError ? (
        <ErrorState
          message={q.error?.apiMessage || '통계를 불러오지 못했습니다.'}
          onRetry={() => q.refetch()}
        />
      ) : (
        <section className="card !p-0 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]">
            <FiveAxisCompare
              data={view.byCategory}
              groupBy={groupBy}
              peerCount={view.peerCount}
              onPrev={() => setGroupBy(cycleGroup(groupBy, -1))}
              onNext={() => setGroupBy(cycleGroup(groupBy, 1))}
            />
            <div className="border-t lg:border-t-0 lg:border-l border-ink-150">
              <MyDistribution data={view.distribution} />
            </div>
          </div>
          <div className="border-t border-ink-150" />
          <Shortages
            items={view.shortages}
            groupLabel={STATS_GROUP_LABEL[groupBy]}
          />
        </section>
      )}
    </>
  );
}

/* ---------- 5축 비교 막대그래프 ---------- */

function FiveAxisCompare({ data, groupBy, peerCount, onPrev, onNext }) {
  const max = Math.max(...data.flatMap((d) => [d.me, d.peers]), 1);
  const groupLabel = STATS_GROUP_LABEL[groupBy];

  return (
    <div className="px-4 sm:px-5 py-5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <button
          type="button"
          onClick={onPrev}
          aria-label="이전 비교 그룹"
          className="shrink-0 w-7 h-7 -ml-1 flex items-center justify-center text-ink-400 hover:text-primary-700 transition-colors"
        >
          <ChevronLeft size={20} strokeWidth={2.2} />
        </button>

        <div className="flex-1 min-w-0 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-[15px] font-bold text-ink-900 inline-flex items-center gap-2">
            <span className="badge-navy">{groupLabel}</span>
            <span>비교</span>
          </h2>
          <span className="text-[11.5px] text-ink-500 tabular-nums">
            비교 대상 {peerCount}명
          </span>
        </div>

        <button
          type="button"
          onClick={onNext}
          aria-label="다음 비교 그룹"
          className="shrink-0 w-7 h-7 -mr-1 flex items-center justify-center text-ink-400 hover:text-primary-700 transition-colors"
        >
          <ChevronRight size={20} strokeWidth={2.2} />
        </button>
      </div>

      <p className="text-[12px] text-ink-500 mb-3">
        대내·대외·인턴·아르바이트·자격증 5축 — 비교 대상 평균과 내 개수.
      </p>

      {/* dot indicators */}
      <div className="flex justify-center gap-1.5 mb-4">
        {GROUP_KEYS.map((k) => (
          <span
            key={k}
            className={cn(
              'h-1.5 rounded-full transition-all',
              k === groupBy ? 'bg-primary-600 w-4' : 'bg-ink-200 w-1.5'
            )}
          />
        ))}
      </div>

      <div className="grid gap-3">
        {data.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[64px_1fr_56px] items-center gap-2"
          >
            <div className="text-[12.5px] font-semibold text-ink-700 truncate">
              {row.label}
            </div>
            <div className="grid gap-1.5">
              <Bar value={row.me} max={max} color="bg-primary-600" label="나" />
              <Bar
                value={row.peers}
                max={max}
                color="bg-ink-300"
                label="평균"
              />
            </div>
            <div className="text-[11.5px] text-ink-500 tabular-nums text-right">
              {row.me} / {row.peers.toFixed(1)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-ink-150 flex items-center gap-3 text-[11.5px] text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm bg-primary-600" />나
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm bg-ink-300" />
          비교 평균
        </span>
      </div>
    </div>
  );
}

function Bar({ value, max, color, label }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="text-[10.5px] text-ink-500 w-7 shrink-0 tabular-nums">
        {label}
      </div>
      <div className="flex-1 h-3 bg-ink-100 rounded overflow-hidden">
        <div
          className={cn('h-full rounded', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ---------- 본인 카테고리 분포 ---------- */

function MyDistribution({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const slices = buildPieSlices(data, total);
  const [hoverKey, setHoverKey] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const hoveredSlice = slices.find((s) => s.key === hoverKey);
  const hoveredData = data.find((d) => d.key === hoverKey);
  const hoveredPct =
    hoveredData && total > 0 ? (hoveredData.value / total) * 100 : 0;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // 슬라이스 비율에 따라 stroke 굵기 — 작은 슬라이스가 stroke 에 잡아먹히지 않게.
  const strokeFor = (pct) => (pct < 3 ? 0.3 : pct < 8 ? 0.6 : 1);

  return (
    <div className="px-4 sm:px-5 py-5">
      <h2 className="text-[15px] font-bold text-ink-900 mb-1">내 경험 분포</h2>
      <p className="text-[12px] text-ink-500 mb-4">
        총 {total}건. 카테고리별 비율을 비교 대상과 무관하게 보여줍니다.
      </p>

      <div className="flex flex-col items-center gap-4">
        <div
          className="relative"
          style={{ width: 260, height: 260 }}
          onMouseLeave={() => setHoverKey(null)}
          onMouseMove={handleMouseMove}
        >
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full"
            style={{ overflow: 'visible' }}
          >
            {total === 0 ? (
              <DonutRing color="#eef0f3" />
            ) : slices.length === 1 ? (
              <DonutRing color={slices[0].color} />
            ) : (
              slices.map((s) => {
                const isHovered = s.key === hoverKey;
                return (
                  <path
                    key={s.key}
                    d={s.d}
                    fill={s.color}
                    stroke="#ffffff"
                    strokeWidth={strokeFor(s.pct)}
                    strokeLinejoin="round"
                    shapeRendering="geometricPrecision"
                    onMouseEnter={() => setHoverKey(s.key)}
                    style={{
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      transformBox: 'fill-box',
                      transformOrigin: 'center',
                      transition:
                        'transform 0.18s ease-out, filter 0.18s ease-out',
                      filter: isHovered
                        ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.4)) brightness(1.06)'
                        : 'none',
                      cursor: 'pointer',
                    }}
                  />
                );
              })
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {hoveredData ? (
              <>
                <div className="text-[22px] font-bold text-ink-900 tabular-nums leading-none">
                  {hoveredData.value}
                </div>
                <div className="text-[11px] text-ink-500 mt-1 font-semibold">
                  {hoveredData.label}
                </div>
              </>
            ) : (
              <>
                <div className="text-[26px] font-bold text-ink-900 tabular-nums leading-none">
                  {total}
                </div>
                <div className="text-[12px] text-ink-500 mt-1">총 경험</div>
              </>
            )}
          </div>

          {hoveredSlice && hoveredData && (
            <div
              className="absolute bg-white border border-ink-200 rounded-md shadow-lg px-2.5 py-1.5 pointer-events-none z-10 min-w-[112px]"
              style={{
                left: mouse.x + 14,
                top: mouse.y - 8,
              }}
            >
              <div className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-800">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: hoveredSlice.color }}
                />
                {hoveredData.label}
              </div>
              <div className="text-[12.5px] text-ink-700 tabular-nums mt-0.5">
                {hoveredData.value}건 ·{' '}
                <span className="text-ink-500">{hoveredPct.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>

        <ul className="self-end flex flex-wrap justify-end gap-x-2.5 gap-y-1 text-[10.5px] text-ink-600 max-w-full">
          {data.map((d) => {
            const pct = total === 0 ? 0 : (d.value / total) * 100;
            return (
              <li
                key={d.key}
                className="inline-flex items-center gap-1 cursor-pointer"
                onMouseEnter={() => setHoverKey(d.key)}
                onMouseLeave={() => setHoverKey(null)}
              >
                <span
                  className="inline-block w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: CAT_COLORS[d.key] || '#9ca3af' }}
                />
                <span className="text-ink-700 font-medium">{d.label}</span>
                <span className="text-ink-400 tabular-nums">
                  {pct.toFixed(0)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// 단일 슬라이스(100%) / 빈 상태용 — 채워진 링.
// 외/내 두 원을 evenodd 로 빼서 도넛 모양 path 하나로 그림.
function DonutRing({ color }) {
  const cx = 60;
  const cy = 60;
  const rO = 57;
  const rI = 39;
  const d = `M ${cx - rO} ${cy} A ${rO} ${rO} 0 1 0 ${cx + rO} ${cy} A ${rO} ${rO} 0 1 0 ${cx - rO} ${cy} Z M ${cx - rI} ${cy} A ${rI} ${rI} 0 1 0 ${cx + rI} ${cy} A ${rI} ${rI} 0 1 0 ${cx - rI} ${cy} Z`;
  return <path d={d} fill={color} fillRule="evenodd" />;
}

// 채워진 도넛 슬라이스(annulus segment) path 빌더.
// stroke-dasharray 방식보다 경계가 깔끔 — anti-aliasing 잔금/겹침 없음.
// 각도는 12시(-90°) 시작, 시계방향 누적.
function buildPieSlices(data, total) {
  if (total === 0) return [];
  const cx = 60;
  const cy = 60;
  const rO = 57;
  const rI = 39;
  const items = data.filter((d) => d.value > 0);
  let acc = -Math.PI / 2;
  return items.map((d) => {
    const ang = (d.value / total) * Math.PI * 2;
    const start = acc;
    const end = acc + ang;
    acc = end;
    const largeArc = ang > Math.PI ? 1 : 0;
    const sxO = cx + rO * Math.cos(start);
    const syO = cy + rO * Math.sin(start);
    const exO = cx + rO * Math.cos(end);
    const eyO = cy + rO * Math.sin(end);
    const sxI = cx + rI * Math.cos(end);
    const syI = cy + rI * Math.sin(end);
    const exI = cx + rI * Math.cos(start);
    const eyI = cy + rI * Math.sin(start);
    const dPath = `M ${sxO} ${syO} A ${rO} ${rO} 0 ${largeArc} 1 ${exO} ${eyO} L ${sxI} ${syI} A ${rI} ${rI} 0 ${largeArc} 0 ${exI} ${eyI} Z`;
    return {
      key: d.key,
      color: CAT_COLORS[d.key] || '#9ca3af',
      d: dPath,
      midAngle: (start + end) / 2,
      pct: (d.value / total) * 100,
    };
  });
}

/* ---------- 부족한 경험 ---------- */

function Shortages({ items, groupLabel }) {
  if (!items || items.length === 0) {
    return (
      <div className="px-4 sm:px-5 py-5">
        <h2 className="text-[15px] font-bold text-ink-900 mb-2">부족한 경험</h2>
        <p className="text-[13px] text-ink-600 break-keep">
          현재 모든 카테고리에서 비교 대상 평균을 따라잡고 있어요. 다른 집단(예:
          같은 학번)과도 비교해보면 더 정확한 인사이트를 얻을 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-5 py-5">
      <h2 className="text-[15px] font-bold text-ink-900 mb-1">부족한 경험</h2>
      <p className="text-[12px] text-ink-500 mb-4 break-keep">
        {groupLabel} 그룹의 평균 대비 부족한 카테고리와 도움될 만한 경험 추천.
      </p>
      <div className="grid gap-3">
        {items.map((it) => (
          <div
            key={it.category}
            className="rounded-md border border-ink-150 bg-paper p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-amber">{it.category}</span>
              <span className="text-[11.5px] text-ink-500 tabular-nums">
                나 {it.me}건 · 평균 {Number(it.peers).toFixed(1)}건
              </span>
            </div>
            {it.suggestions?.length > 0 && (
              <div className="grid gap-1.5">
                <div className="text-[11.5px] font-semibold text-ink-500 inline-flex items-center gap-1">
                  <Sparkles size={11} strokeWidth={2.2} /> 추천 경험
                </div>
                <ul className="grid gap-0.5 text-[12px] text-ink-700 break-keep">
                  {it.suggestions.map((s, i) => (
                    <li key={i} className="ml-2">
                      · {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-3">
              <Link to="/my-experience/new" className="btn-default btn-sm">
                <Plus size={11} strokeWidth={2.2} />이 카테고리 경험 추가
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 상태 ---------- */

function Loading() {
  return (
    <section className="card animate-pulse">
      <div className="h-4 w-1/3 bg-ink-100 rounded mb-3" />
      <div className="h-3 w-1/2 bg-ink-100 rounded mb-5" />
      <div className="grid gap-2">
        {[0, 1, 2, 3, 4].map((j) => (
          <div key={j} className="h-3 bg-ink-100 rounded" />
        ))}
      </div>
    </section>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <section className="card text-center py-10">
      <AlertTriangle
        size={20}
        strokeWidth={2}
        className="mx-auto mb-2 text-ink-400"
      />
      <p className="text-[13px] text-ink-700 mb-3 break-keep">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-default">
          다시 시도
        </button>
      )}
    </section>
  );
}
