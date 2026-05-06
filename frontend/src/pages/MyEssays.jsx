import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import { useEssays } from '../api/queries/useEssays';
import { PROGRESS_LABEL, PROGRESS_TONE } from '../lib/enums';
import { cn } from '../lib/cn';

/**
 * /essays — 자소서 관리 목록.
 *
 * 디자인 (2026-05-10 번호 매긴 콤팩트 리스트로 개편):
 *  - 단일 .card !p-0 셸 안에 검색창 + <ol> 번호 매긴 row 리스트.
 *  - 각 row 는 두 줄(번호 + 회사명·상태 뱃지 / 직무·최종수정일) 콤팩트.
 *  - 우측 ghost 상세 버튼.
 *  - 검색: 회사명 / 직무 클라이언트 필터 (백엔드 query param 미지원).
 *
 * 백엔드 contract:
 *  - 스웨거 `EssayResponse` 에 `essayId` 누락이지만, 응답에 essayId 가 들어올 경우
 *    상세 진입을 자동 활성화하도록 opportunistic 처리. 누락 시에만 비활성 + 안내 노출.
 *  - "결과 입력" / "이어쓰기" 는 상세 페이지로 이전.
 */
export default function MyEssays() {
  const [query, setQuery] = useState('');
  const list = useEssays();

  const items = useMemo(() => list.data || [], [list.data]);
  // 백엔드가 essayId 를 응답에 실어주는지 — 한 건이라도 있으면 클릭 활성.
  const hasEssayId = items.some((e) => !!e.essayId);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((e) =>
      [e.companyName, e.wishJob]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q))
    );
  }, [items, query]);

  return (
    <>
      <Crumbs items={['자소서', '관리']} />

      <header className="flex items-end justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink-900">
            내 자소서
          </h1>
          <p className="text-[12.5px] text-ink-500 mt-1">
            작성한 자소서를 모아보고, 새로 작성하거나 결과를 기록하세요.
          </p>
        </div>
        <Link to="/write" className="btn-primary">
          <Plus size={14} strokeWidth={2.2} />새 자소서 쓰기
        </Link>
      </header>

      {/* 백엔드 차단 안내 — essayId 가 응답에 실리지 않을 때만 노출 */}
      {!list.isLoading && items.length > 0 && !hasEssayId && (
        <BackendBlockNotice />
      )}

      <section className="card !p-0 overflow-hidden">
        {/* 검색창 */}
        <div className="px-4 sm:px-5 pt-4 pb-3">
          <div className="relative">
            <Search
              size={14}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="회사명 / 직무 검색"
              className="field text-[14px] py-2.5 pl-9"
            />
          </div>
        </div>

        <div className="border-t border-ink-150" />

        {/* 본문 */}
        {list.isLoading ? (
          <Loading />
        ) : list.isError ? (
          <ErrorState
            message={
              list.error?.apiMessage || '자소서 목록을 불러오지 못했습니다.'
            }
            onRetry={() => list.refetch()}
          />
        ) : filtered.length === 0 ? (
          items.length === 0 ? (
            <Empty />
          ) : (
            <NoResult onClear={() => setQuery('')} />
          )
        ) : (
          <ol className="divide-y divide-ink-150">
            {filtered.map((e, i) => (
              <EssayRow key={e.essayId ?? i} index={i + 1} item={e} />
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

/* ---------- 행 ---------- */
