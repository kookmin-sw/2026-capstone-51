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
