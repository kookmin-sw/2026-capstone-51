import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import { cn } from '../lib/cn';
import { useExperiences } from '../api/queries/useExperiences';
import {
  EXPERIENCE_CATEGORY_TO_FRONT,
  EXPERIENCE_CATEGORY_LABEL,
  EXPERIENCE_CATEGORY_OPTIONS,
} from '../lib/enums';

/**
 * /my-experience — 내 경험 목록.
 *
 * 디자인 (2026-05-10 번호 매긴 콤팩트 리스트로 개편):
 *  - 단일 .card !p-0 셸 안에 검색창 + 카테고리 필터 + <ol> 번호 매긴 row 리스트.
 *  - 각 row 는 한두 줄(번호 + 카테고리 뱃지 + 제목 + 기간/전공) 콤팩트.
 *  - STAR 미리보기/토글은 제거 (상세 페이지에서 전체 노출).
 *  - 검색·필터 모두 클라이언트 사이드 (백엔드 query param 미지원).
 *  - 검색 대상: 제목 (experienceTitle) 부분일치만.
 *  - row 클릭 → /my-experience/:id.
 */
export default function MyExperience() {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const exps = useExperiences();

  const items = useMemo(() => exps.data || [], [exps.data]);

  const byCategory = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(
      (e) => EXPERIENCE_CATEGORY_TO_FRONT[e.experienceCategory] === filter
    );
  }, [items, filter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter((e) =>
      String(e.experienceTitle || '')
        .toLowerCase()
        .includes(q)
    );
  }, [byCategory, query]);

  const isFiltered = filter !== 'all' || query.trim().length > 0;

  return (
    <>
      <Crumbs items={['MyPage', '내 경험']} />

      <header className="flex items-end justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink-900">
            내 경험
          </h1>
          <p className="text-[12.5px] text-ink-500 mt-1">
            STAR 구조로 저장한 경험은 자소서 추천에 활용됩니다.
          </p>
        </div>
        <Link to="/my-experience/new" className="btn-primary">
          <Plus size={14} strokeWidth={2.2} />
          경험 추가
        </Link>
      </header>

      <section className="card !p-0 overflow-hidden">
        {/* 검색창 */}
        <div className="px-4 sm:px-5 pt-4">
          <div className="relative">
            <Search
              size={14}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제목 검색"
              className="field text-[14px] py-2.5 pl-9"
            />
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="flex flex-wrap gap-2 px-4 sm:px-5 py-3">
          <FilterChip
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label="모두"
            count={items.length}
          />
          {EXPERIENCE_CATEGORY_OPTIONS.map((opt) => {
            const c = items.filter(
              (e) =>
                EXPERIENCE_CATEGORY_TO_FRONT[e.experienceCategory] === opt.value
            ).length;
            return (
              <FilterChip
                key={opt.value}
                active={filter === opt.value}
                onClick={() => setFilter(opt.value)}
                label={opt.label}
                count={c}
              />
            );
          })}
        </div>

        <div className="border-t border-ink-150" />

        {/* 본문 */}
        {exps.isLoading ? (
          <Loading />
        ) : exps.isError ? (
          <ErrorState
            message={
              exps.error?.apiMessage || '경험 목록을 불러오지 못했습니다.'
            }
            onRetry={() => exps.refetch()}
          />
        ) : filtered.length === 0 ? (
          <Empty
            isFiltered={isFiltered}
            isEmpty={items.length === 0}
            onClear={() => {
              setFilter('all');
              setQuery('');
            }}
          />
        ) : (
          <ol className="divide-y divide-ink-150">
            {filtered.map((it, i) => (
              <ExpRow key={it.experienceId} index={i + 1} item={it} />
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

/* ---------- 행 ---------- */

function ExpRow({ index, item }) {
  const cat = EXPERIENCE_CATEGORY_TO_FRONT[item.experienceCategory];
  const label = EXPERIENCE_CATEGORY_LABEL[cat] || item.experienceCategory;
  const period = `${fmtYM(item.startDate)} ~ ${fmtYM(item.endDate)}`;

  return (
    <li>
      <Link
        to={`/my-experience/${item.experienceId}`}
        className="block px-4 sm:px-5 py-2.5 hover:bg-ink-50/60 transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className="text-[12.5px] font-semibold text-ink-400 tabular-nums shrink-0 w-6 pt-[3px] text-right">
            {index}.
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-navy">{label}</span>
              <h3 className="text-[14px] font-semibold text-ink-900 tracking-tight break-keep">
                {item.experienceTitle}
              </h3>
            </div>
            <div className="text-[12px] text-ink-500 mt-0.5 flex flex-wrap items-center gap-x-1.5 tabular-nums">
              <span>{period}</span>
              {item.relatedMajor && (
                <>
                  <span className="text-ink-300">·</span>
                  <span>관련 전공 {item.relatedMajor}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

/* ---------- 필터 칩 / 상태 ---------- */

function FilterChip({ active, onClick, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-[12.5px] font-semibold border transition-colors',
        active
          ? 'bg-primary-50 border-primary-600 text-primary-800'
          : 'bg-paper border-ink-200 text-ink-600 hover:bg-ink-50'
      )}
    >
      {label}
      <span className="ml-1.5 text-ink-400 font-normal tabular-nums">
        {count}
      </span>
    </button>
  );
}

function Loading() {
  return (
    <ul className="divide-y divide-ink-150">
      {[0, 1, 2].map((i) => (
        <li key={i} className="px-4 sm:px-5 py-2.5 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="h-3 w-4 bg-ink-100 rounded shrink-0" />
            <div className="flex-1">
              <div className="h-3.5 w-1/3 bg-ink-100 rounded mb-1.5" />
              <div className="h-3 w-2/3 bg-ink-100 rounded" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="text-center py-8 px-4">
      <p className="text-[13px] text-ink-700 mb-3 break-keep">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-default">
          다시 시도
        </button>
      )}
    </div>
  );
}

function Empty({ isFiltered, isEmpty, onClear }) {
  if (isEmpty) {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-[13.5px] font-semibold text-ink-800 mb-1">
          아직 등록된 경험이 없어요.
        </p>
        <p className="text-[12.5px] text-ink-500 mb-4 break-keep">
          STAR 구조로 경험을 정리해두면 자소서 추천에 활용됩니다.
        </p>
        <Link to="/my-experience/new" className="btn-primary">
          <Plus size={13} strokeWidth={2.2} />첫 경험 추가하기
        </Link>
      </div>
    );
  }
  if (isFiltered) {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-[13px] text-ink-500 mb-3">
          조건에 해당하는 경험이 없어요.
        </p>
        <button type="button" onClick={onClear} className="btn-default">
          필터·검색 초기화
        </button>
      </div>
    );
  }
  return null;
}

/* ---------- 유틸 ---------- */

function fmtYM(d) {
  if (!d) return '—';
  const [y, m] = d.split('-');
  return `${y?.slice(2)}.${m}`;
}
