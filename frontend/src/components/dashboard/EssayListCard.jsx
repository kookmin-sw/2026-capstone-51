import { Link } from 'react-router-dom';
import { FileText, PencilLine } from 'lucide-react';
import { ESSAYS } from '../../data/essays';

const STATUS_LABEL = {
  writing: '작성 중',
  pending: '결과 대기',
  pass: '서류 합격',
  fail: '서류 탈락',
};
const STATUS_TONE = {
  writing: 'gray',
  pending: 'amber',
  pass: 'green',
  fail: 'red',
};

/**
 * 대시보드 PeersOrb 우측 패널 — 내 자소서 목록 + 자소서 작성하기 CTA.
 *
 *  - mock 데이터(data/essays.js)에서 최대 5개 노출. 그 이상은 "전체 보기".
 *  - 각 row → /essays/:id (친구 EssayView 페이지).
 *  - embedded=true 면 외곽 .card 래퍼/패딩 제거.
 */
export default function EssayListCard({ embedded = false }) {
  const items = ESSAYS;
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
        {items.length === 0 ? (
          <Empty />
        ) : (
          <ul className="grid gap-2">
            {visible.map((e) => (
              <EssayRow key={e.id} item={e} />
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
  const key = item.status === 'submitted' ? item.result : item.status;
  const tone = STATUS_TONE[key] || 'gray';
  const label = STATUS_LABEL[key] || item.status || '작성 중';
  return (
    <li>
      <Link
        to={`/essays/${item.id}`}
        className="block rounded-md border border-ink-150 px-3 py-2 hover:bg-ink-50/40 hover:border-ink-300 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className="text-[12px] font-semibold text-ink-800 truncate">
                {item.co || '회사명 없음'}
              </span>
              <span className={`badge-${tone}`}>{label}</span>
            </div>
            <div className="text-[11.5px] text-ink-500 truncate">
              {item.job || '직무 미입력'}
            </div>
          </div>
          {item.updated && (
            <div className="text-[10.5px] text-ink-400 tabular-nums shrink-0">
              {item.updated}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}

function Empty() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-6">
      <p className="text-[12.5px] font-semibold text-ink-700 mb-1">
        아직 작성한 자소서가 없어요.
      </p>
      <p className="text-[11.5px] text-ink-500 break-keep">
        첫 자소서를 시작해 동기 비교를 더 정확하게 만들어보세요.
      </p>
    </div>
  );
}
