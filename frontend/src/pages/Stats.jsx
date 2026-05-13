import { useEffect, useRef, useState } from 'react';
import Crumbs from '../components/Crumbs';
import { getMyStats } from '../api/users';
import { logApiError } from '../api/auth';

/* ---------- 상수 ---------- */

// 비교 대상 — 백엔드 groupBy enum 값과 1:1.
const COMPARE_SCOPES = [
  { id: 'STATE', label: '같은 학년' },
  { id: 'SCHOOL_NUM', label: '같은 학번' },
  { id: 'WORKER', label: '취업자' },
];

// 5축 카테고리.
//  - id      : data.statistics 의 키 (`partTime`, `external`, ...)
//  - countKey: topRankers 항목의 평탄 필드명 (`partTimeCount`, ...)
const CATEGORIES = [
  { id: 'internal', label: '대내활동', countKey: 'internalCount' },
  { id: 'external', label: '대외활동', countKey: 'externalCount' },
  { id: 'intern', label: '인턴', countKey: 'internCount' },
  { id: 'partTime', label: '아르바이트', countKey: 'partTimeCount' },
  { id: 'license', label: '자격증', countKey: 'licenseCount' },
];

// API 가 statistics/topRankers 를 비워 보낼 때 보여줄 임시 데이터.
const MOCK_AVERAGE = {
  internal: 4.2,
  external: 3.1,
  intern: 1.5,
  partTime: 0.8,
  license: 1.6,
};
const MOCK_MAX = {
  internal: 12,
  external: 8,
  intern: 3,
  partTime: 2,
  license: 4,
};
const MOCK_TOP_RANKERS = [
  {
    rank: 1,
    userName: '익명 A',
    totalCount: 29,
    internalCount: 12,
    externalCount: 8,
    internCount: 3,
    partTimeCount: 2,
    licenseCount: 4,
  },
  {
    rank: 2,
    userName: '익명 B',
    totalCount: 26,
    internalCount: 11,
    externalCount: 7,
    internCount: 2,
    partTimeCount: 3,
    licenseCount: 3,
  },
  {
    rank: 3,
    userName: '익명 C',
    totalCount: 23,
    internalCount: 10,
    externalCount: 6,
    internCount: 3,
    partTimeCount: 1,
    licenseCount: 3,
  },
];

/* ---------- Segmented filter ---------- */
function CompareScopeBar({ scope, onChange, disabled }) {
  return (
    <div className="inline-flex items-center gap-1 bg-white border border-ink-200 rounded-lg p-1">
      {COMPARE_SCOPES.map((s) => {
        const active = scope === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            disabled={disabled}
            className={
              'px-4 py-2 rounded-md text-[13px] whitespace-nowrap transition-colors disabled:opacity-60 ' +
              (active
                ? 'bg-primary-900 text-white font-semibold'
                : 'text-ink-500 hover:bg-ink-50 font-medium')
            }
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Activity bar (me / avg / max) ---------- */
function BarRow({ tone, valueLabel, value, chartMax }) {
  const labelColor =
    tone === 'me'
      ? 'font-bold text-primary-800'
      : tone === 'max'
        ? 'font-semibold text-amber-700'
        : 'text-ink-500';
  const barColor =
    tone === 'me'
      ? 'bg-primary-600'
      : tone === 'max'
        ? 'bg-amber-500'
        : 'bg-ink-300';
  return (
    <div className="grid grid-cols-[88px_1fr] items-center gap-2 mb-1">
      <span className={'text-[11px] tabular-nums ' + labelColor}>
        {valueLabel}
      </span>
      <div className="h-3 bg-ink-100 rounded overflow-hidden">
        <div
          className={'h-full rounded ' + barColor}
          style={{ width: (value / chartMax) * 100 + '%' }}
        />
      </div>
    </div>
  );
}

function ActivityBar({ label, me, avg, max }) {
  const chartMax = Math.max(me, avg, max) * 1.1 || 1;
  return (
    <div className="mb-4">
      <div className="text-[12.5px] font-semibold text-ink-900 mb-1.5">
        {label}
      </div>
      <BarRow
        tone="me"
        valueLabel={`나 ${me}건`}
        value={me}
        chartMax={chartMax}
      />
      <BarRow
        tone="avg"
        valueLabel={`평균 ${avg}건`}
        value={avg}
        chartMax={chartMax}
      />
      <BarRow
        tone="max"
        valueLabel={`최댓값 ${max}건`}
        value={max}
        chartMax={chartMax}
      />
    </div>
  );
}

/* ---------- Top ranker panel (오른쪽 영역) ---------- */
// 한 번에 한 명씩만 표시. 상단 prev/next 버튼 + 탑N 칩으로 전환.
// scope 변경 시 첫 번째로 리셋하려면 부모에서 `key`를 넘겨 리마운트하면 된다.
function TopRankerPanel({ rankers, isMock }) {
  const [idx, setIdx] = useState(0);
  if (!rankers || rankers.length === 0) return null;
  const safeIdx = Math.min(idx, rankers.length - 1);
  const ranker = rankers[safeIdx];
  const chartMax =
    Math.max(...CATEGORIES.map((c) => ranker[c.countKey] ?? 0)) * 1.1 || 1;

  const prev = () =>
    setIdx((i) => (i - 1 + rankers.length) % rankers.length);
  const next = () => setIdx((i) => (i + 1) % rankers.length);

  return (
    <div>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-[13px] font-bold text-ink-900">
          비교 대상 중 탑 랭커
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            aria-label="이전 랭커"
            disabled={rankers.length <= 1}
            className="grid place-items-center w-6 h-6 rounded-md border border-ink-200 text-ink-700 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed text-[12px]"
          >
            ‹
          </button>
          <span className="text-[11px] font-semibold text-ink-700 tabular-nums px-1">
            {safeIdx + 1} / {rankers.length}
          </span>
          <button
            onClick={next}
            aria-label="다음 랭커"
            disabled={rankers.length <= 1}
            className="grid place-items-center w-6 h-6 rounded-md border border-ink-200 text-ink-700 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed text-[12px]"
          >
            ›
          </button>
        </div>
      </div>
      <div className="text-[11px] text-ink-500 mb-3.5">
        {isMock
          ? '※ 아직 실제 데이터가 충분치 않아 예시(mock)로 보여드리고 있어요.'
          : '카테고리별 활동 수 — 한 명씩 비교'}
      </div>

      {/* 탑 N 칩 — 클릭으로 직접 이동 */}
      <div className="flex items-center gap-1.5 mb-3">
        {rankers.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={
              'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ' +
              (i === safeIdx
                ? 'bg-primary-900 text-white'
                : 'bg-white border border-ink-200 text-ink-700 hover:bg-ink-50')
            }
          >
            탑 {i + 1}
          </button>
        ))}
      </div>

      <div
        className="rounded-md p-3"
        style={{ background: '#fafbfc', border: '1px solid #E5E9EF' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12.5px] font-bold text-ink-900">
            {ranker.userName ?? `탑 랭커 ${safeIdx + 1}`}
          </span>
          {ranker.totalCount != null && (
            <span className="text-[11px] text-ink-500">
              총 <b className="text-ink-900">{ranker.totalCount}</b>건
            </span>
          )}
        </div>
        {CATEGORIES.map((c) => {
          const v = ranker[c.countKey] ?? 0;
          return (
            <div
              key={c.id}
              className="grid grid-cols-[64px_1fr_28px] items-center gap-2 text-[11px] mb-1 last:mb-0"
            >
              <span className="text-ink-700">{c.label}</span>
              <div className="h-2 bg-ink-100 rounded overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded"
                  style={{ width: (v / chartMax) * 100 + '%' }}
                />
              </div>
              <span className="text-right font-bold text-ink-900 tabular-nums">
                {v}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Gap recommendation cards ---------- */
function GapRecommendCard({ weakPoints }) {
  if (!weakPoints || weakPoints.length === 0) {
    // weakPoints 자체가 비어 있으면 카드 섹션 자체를 숨긴다.
    return null;
  }
  // 카드 개수는 weakPoints 길이만큼. 그리드 컬럼은 최대 3개까지.
  const gridCols =
    weakPoints.length === 1
      ? 'grid-cols-1'
      : weakPoints.length === 2
        ? 'grid-cols-2'
        : 'grid-cols-3';
  return (
    <div className="bg-white border border-ink-200 rounded-lg shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-ink-900">부족한 경험</h2>
          <div className="text-[12px] text-ink-500 mt-1">
            비교 대상 평균에 비해 부족한 영역
          </div>
        </div>
      </div>
      <div className={`grid ${gridCols} gap-3`}>
        {weakPoints.map((wp, i) => (
          <div
            key={i}
            className="p-4 rounded-lg bg-white border border-ink-200 flex flex-col"
          >
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[13px] font-bold text-ink-900">
                {wp.type}
              </span>
              {wp.gap && (
                <span className="text-[11px] font-bold text-amber-700 tabular-nums">
                  {wp.gap}
                </span>
              )}
            </div>
            {wp.detail && (
              <div className="text-[11px] text-ink-500 mb-3 leading-relaxed">
                {wp.detail}
              </div>
            )}
            {wp.recommendedItems == null ? (
              <div className="text-[11.5px] text-ink-500 leading-relaxed pt-3 border-t border-ink-100">
                아직 충분한 경험이 모이지 않아서 추천해드릴 수 없어요.
                <br />
                경험이 모이면 추천해드릴게요!
              </div>
            ) : (
              <div className="flex flex-col">
                {wp.recommendedItems.map((it, j) => (
                  <div
                    key={j}
                    className="text-[12px] text-ink-900 py-2 border-t border-ink-100 flex items-center gap-2"
                  >
                    <span className="w-[18px] h-[18px] rounded bg-ink-100 text-ink-500 grid place-items-center text-[10px] font-bold shrink-0">
                      {j + 1}
                    </span>
                    <span>{it}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Stats() {
  const [scope, setScope] = useState('STATE');
  // scope별 결과 캐시 — 같은 scope을 다시 클릭해도 재요청하지 않음.
  const cacheRef = useRef({});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cacheRef.current[scope]) {
      setData(cacheRef.current[scope]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const d = await getMyStats(scope);
        const result = d ?? {};
        cacheRef.current[scope] = result;
        if (!cancelled) setData(result);
      } catch (err) {
        if (cancelled) return;
        logApiError('통계 로드 실패 (GET /users/me/stats)', err);
        cacheRef.current[scope] = {};
        setData({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const scopeMeta = COMPARE_SCOPES.find((s) => s.id === scope);

  // API 응답: { statistics: { [catId]: { avg, userCount, myCount } }, ... }
  // - myCount  → 내 값
  // - avg      → 비교 대상 평균
  // - userCount→ 최댓값으로 매핑 (실제 의미가 다르면 키만 바꿔주세요).
  const statistics = data?.statistics ?? null;
  const hasStats = statistics && Object.keys(statistics).length > 0;
  const my = {};
  const avg = {};
  const max = {};
  CATEGORIES.forEach((c) => {
    const s = statistics?.[c.id];
    my[c.id] = s?.myCount ?? 0;
    avg[c.id] = hasStats ? (s?.avg ?? 0) : MOCK_AVERAGE[c.id];
    max[c.id] = hasStats ? (s?.userCount ?? 0) : MOCK_MAX[c.id];
  });

  const weakPoints = data?.weakPoints ?? [];
  const topRankersFromApi = data?.topRankers ?? [];
  const topRankers =
    topRankersFromApi.length > 0 ? topRankersFromApi : MOCK_TOP_RANKERS;
  const topRankersIsMock = topRankersFromApi.length === 0;

  return (
    <>
      <Crumbs items={['통계']} />

      <header className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-ink-900">
          나의 활동 통계
        </h1>
        <div className="text-[13px] text-ink-500 mt-1.5">
          활동을 데이터로 돌아보고, 부족한 영역을 보완해보세요.
        </div>
      </header>

      {/* Filter row */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <span className="text-[13px] font-semibold text-ink-900">
            비교 대상
          </span>
          <CompareScopeBar
            scope={scope}
            onChange={setScope}
            disabled={loading}
          />
        </div>
        {loading && (
          <span className="text-[12px] text-ink-500">불러오는 중…</span>
        )}
      </div>

      {/* Activity vs peers + top rankers */}
      <div className="bg-white border border-ink-200 rounded-lg shadow-sm p-5 mb-4">
        <div className="mb-5">
          <h2 className="text-[15px] font-bold text-ink-900">
            동기와 비교하기
          </h2>
          <div className="text-[12px] text-ink-500 mt-1">
            {scopeMeta?.label ?? ''} · 익명 집계
          </div>
        </div>
        <div className="grid grid-cols-[1.35fr_1fr] gap-7 items-start">
          <div>
            <div className="text-[13px] font-bold text-ink-900 mb-1">
              카테고리별 활동량 — 나 vs 평균 vs 최댓값
            </div>
            <div className="text-[11px] text-ink-500 mb-3.5">
              각 카테고리에 등록된 경험 수 기준
            </div>
            {CATEGORIES.map((c) => (
              <ActivityBar
                key={c.id}
                label={c.label}
                me={my[c.id] ?? 0}
                avg={avg[c.id] ?? 0}
                max={max[c.id] ?? 0}
              />
            ))}
          </div>
          <div className="pl-7 border-l border-ink-200 self-stretch">
            <TopRankerPanel
              key={`${scope}-${topRankersIsMock ? 'mock' : 'api'}`}
              rankers={topRankers}
              isMock={topRankersIsMock}
            />
          </div>
        </div>
      </div>

      <GapRecommendCard weakPoints={weakPoints} />
    </>
  );
}
