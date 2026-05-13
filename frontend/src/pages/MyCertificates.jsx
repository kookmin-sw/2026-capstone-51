import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import { useCertificates } from '../api/queries/useCertificates';

/**
 * /my-certificates — 내 자격증 목록.
 *
 * 디자인:
 *  - 단일 .card !p-0 셸 안에 <ol> 번호 매긴 row 리스트 (검색 필터 없음).
 *  - 각 row 는 두 줄(번호 + 자격증명 / 발급기관·취득일·유효기간·발급번호) 콤팩트.
 *  - row 전체를 Link 로 감싸 클릭 시 /my-certificates/:id 상세로 진입 — 수정·삭제는
 *    상세 페이지에서 처리 (MyExperience / ExperienceDetail 패턴과 일관).
 */
export default function MyCertificates() {
  const list = useCertificates();

  const items = useMemo(() => list.data || [], [list.data]);

  return (
    <>
      <Crumbs items={['MyPage', '내 자격증']} />

      <header className="flex items-end justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink-900">
            내 자격증
          </h1>
          <p className="text-[12.5px] text-ink-500 mt-1">
            취득한 자격증을 정리해두면 자소서·통계에 활용됩니다.
          </p>
        </div>
        <Link to="/my-certificates/new" className="btn-primary">
          <Plus size={14} strokeWidth={2.2} />
          자격증 추가
        </Link>
      </header>

      <section className="card !p-0 overflow-hidden">
        {list.isLoading ? (
          <Loading />
        ) : list.isError ? (
          <ErrorState
            message={
              list.error?.apiMessage || '자격증 목록을 불러오지 못했습니다.'
            }
            onRetry={() => list.refetch()}
          />
        ) : items.length === 0 ? (
          <Empty />
        ) : (
          <ol className="divide-y divide-ink-150">
            {items.map((c, i) => (
              <CertRow key={c.certificateId} index={i + 1} item={c} />
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

/* ---------- 행 ---------- */

function CertRow({ index, item }) {
  const meta = [
    item.issuingOrganization,
    item.getDate && `취득 ${fmtDate(item.getDate)}`,
    item.expirationDate
      ? `유효 ${fmtDate(item.expirationDate)}`
      : item.getDate && '기간 제한 없음',
    item.certificateCode && `발급 ${item.certificateCode}`,
  ].filter(Boolean);

  return (
    <li>
      <Link
        to={`/my-certificates/${item.certificateId}`}
        className="block px-4 sm:px-5 py-2.5 hover:bg-ink-50/60 transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className="text-[12.5px] font-semibold text-ink-400 tabular-nums shrink-0 w-6 pt-[3px] text-right">
            {index}.
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-semibold text-ink-900 tracking-tight break-keep">
              {item.certificateName || '(이름 없음)'}
            </h3>
            {meta.length > 0 && (
              <div className="text-[12px] text-ink-500 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 tabular-nums">
                {meta.map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5">
                    {i > 0 && <span className="text-ink-300">·</span>}
                    <span>{m}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

/* ---------- 상태 ---------- */

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

function Empty() {
  return (
    <div className="text-center py-10 px-4">
      <p className="text-[13.5px] font-semibold text-ink-800 mb-1">
        아직 등록된 자격증이 없어요.
      </p>
      <p className="text-[12.5px] text-ink-500 mb-4 break-keep">
        취득한 자격증을 정리해두면 자소서 추천·통계에 활용됩니다.
      </p>
      <Link to="/my-certificates/new" className="btn-primary">
        <Plus size={13} strokeWidth={2.2} />첫 자격증 추가하기
      </Link>
    </div>
  );
}

/* ---------- 유틸 ---------- */

function fmtDate(d) {
  if (!d) return '';
  // 백엔드는 ISO 형식 문자열로 줄 가능성 — 안전하게 앞 10자만 사용
  return d.slice(0, 10).replaceAll('-', '.');
}
