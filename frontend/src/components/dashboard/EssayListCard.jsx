import { Link } from 'react-router-dom';
import { FileText, PencilLine } from 'lucide-react';
import { useEssays } from '../../api/queries/useEssays';
import { PROGRESS_LABEL, PROGRESS_TONE } from '../../lib/enums';

/**
 * 대시보드 PeersOrb 우측 패널 — 내 자소서 목록 + 자소서 작성하기 CTA.
 *
 *  - 최대 5개까지만 노출 (그 이상은 "전체 보기" 링크).
 *  - 카드 클릭 → 상세 진입은 백엔드 `EssayResponse.essayId` 누락으로 차단되어 있으므로,
 *    각 행은 비링크. 전체 관리는 우하단 "전체 보기" / 작성은 "자소서 작성하기" CTA 로.
 *  - embedded=true 면 외곽 .card 래퍼/패딩 제거. 상단 통합 카드의 한 칸으로 들어갈 때 사용.
 */
export default function EssayListCard({ embedded = false }) {
  const list = useEssays();
  const items = list.data || [];
  const visible = items.slice(0, 5);

  return (
    <section
      className={embedded ? 'flex flex-col h-full' : 'card !p-4 flex flex-col'}
    >
      <header className="flex items-start gap-2">
        <FileText size={18} strokeWidth={2} className="text-ink-500 mt-0.5" />
        <div>
          <h2 className="text-[15px] font-bold text-ink-900 leading-tight">
            내 자소서
          </h2>
          <div className="text-[11px] text-ink-500 mt-0.5">
            최근 작성·수정한 자소서 모음
          </div>
        </div>
      </header>

      <div className="mt-3 flex-1 min-h-[180px]">
        {list.isLoading ? (
          <Loading />
        ) : list.isError ? (
          <ErrorState
            message={
              list.error?.apiMessage || '자소서 목록을 불러오지 못했습니다.'
            }
            onRetry={() => list.refetch()}
          />
        ) : items.length === 0 ? (
          <Empty />
        ) : (
          <ul className="grid gap-2">
            {visible.map((e, i) => (
              <EssayRow key={i} item={e} />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-ink-150 flex items-center justify-between gap-2">
        {items.length > 5 ? (
          <Link
            to="/essays"
            className="text-[12px] text-ink-500 hover:text-ink-800 underline-offset-2 hover:underline"
          >
            전체 보기 ({items.length})
          </Link>
        ) : (
          <span />
        )}
        <Link to="/write" className="btn-primary btn-sm">
          <PencilLine size={13} strokeWidth={2.2} />
          자소서 작성하기
        </Link>
      </div>
    </section>
  );
}

function EssayRow({ item }) {
  const tone = PROGRESS_TONE[item.progress] || 'gray';
  const label = PROGRESS_LABEL[item.progress] || item.progress || '작성 중';
  const inner = (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="text-[12px] font-semibold text-ink-800 truncate">
            {item.companyName || '회사명 없음'}
          </span>
          <span className={`badge-${tone}`}>{label}</span>
        </div>
        <div className="text-[11.5px] text-ink-500 truncate">
          {item.wishJob || '직무 미입력'}
        </div>
      </div>
      {item.updatedAt && (
        <div className="text-[10.5px] text-ink-400 tabular-nums shrink-0">
          {fmtDate(item.updatedAt)}
        </div>
      )}
    </div>
  );
  if (item.essayId) {
    return (
      <li>
        <Link
          to={`/essays/${item.essayId}`}
          className="block rounded-md border border-ink-150 px-3 py-2 hover:bg-ink-50/40 hover:border-ink-300 transition-colors"
        >
          {inner}
        </Link>
      </li>
    );
  }
  return (
    <li className="rounded-md border border-ink-150 px-3 py-2">{inner}</li>
  );
}

function Loading() {
  return (
    <div className="grid gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[46px] rounded-md border border-ink-150 bg-ink-50/40 animate-pulse"
        />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="text-center py-6">
      <p className="text-[12.5px] text-ink-700 mb-2 break-keep">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-default btn-sm">
          다시 시도
        </button>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-6">
      <p className="text-[12.5px] font-semibold text-ink-700 mb-1">
