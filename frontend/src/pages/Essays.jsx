import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import {
  useEssays,
  useUpdateEssayResult,
  useDeleteEssay,
} from '../api/queries/useEssays';
import { PROGRESS_LABEL, PROGRESS_TONE } from '../lib/enums';
import { toast } from '../store/useToast';

/* ------------------------------------------------------------------ *
 * 자소서 관리.
 *  - GET /essays → EssayResponse[] = { essayId, companyName, wishJob, progress, updatedAt }
 *  - 행 전체 클릭 → /essays/:essayId
 *  - "결과 변경" 드롭다운 → PATCH /essays/:id/result { progress: IN_PROGRESS|PASS|FAIL }
 *  - 친구 mock 의 prog/total/dday 는 백엔드 미제공 — UI 에서 제거.
 * ------------------------------------------------------------------ */

export default function Essays() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  // 삭제 확인 모달 — { essayId, companyName } 또는 null.
  const [confirmDel, setConfirmDel] = useState(null);
  const list = useEssays();
  const updateResult = useUpdateEssayResult();
  const del = useDeleteEssay();

  const items = list.data ?? [];
  // 정렬:
  //  1) progress 가 결과 대기(IN_PROGRESS) 가 아닌 항목(PASS/FAIL) 을 먼저
  //  2) 같은 그룹 안에서는 updatedAt 내림차순 (최신 수정 먼저)
  //  filter 의 결과 배열에 대해서만 sort — items 자체는 변형 안 함.
  const filtered = items
    .filter((e) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return ((e.companyName ?? '') + ' ' + (e.wishJob ?? ''))
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => {
      const aFinal = (a.progress ?? 'IN_PROGRESS') !== 'IN_PROGRESS';
      const bFinal = (b.progress ?? 'IN_PROGRESS') !== 'IN_PROGRESS';
      if (aFinal !== bFinal) return aFinal ? -1 : 1;
      return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
    });

  const setResult = (id, progress) => {
    setOpenId(null);
    updateResult.mutate(
      { id, progress },
      {
        onError: (err) =>
          toast.error(err?.apiMessage || '결과 저장에 실패했어요.'),
      }
    );
  };

  const handleConfirmDelete = () => {
    if (!confirmDel) return;
    del.mutate(confirmDel.essayId, {
      onSuccess: () => {
        toast.success('자소서를 삭제했어요.');
        setConfirmDel(null);
      },
      onError: (err) =>
        toast.error(err?.apiMessage || '삭제 중 오류가 발생했어요.'),
    });
  };

  return (
    <>
      <Crumbs items={['자소서', '관리']} />
      <div className="page-h flex items-start justify-between gap-4 mb-4">
        <div>
          <h1>자소서 관리</h1>
          <div className="sub">
            작성한 모든 자소서를 한 곳에서 관리하고 결과를 기록하세요.
          </div>
        </div>
        <Button variant="primary" onClick={() => navigate('/write')}>
          <Plus size={13} /> 새 자소서 쓰기
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-[12px] text-ink-500">
          전체 <b className="text-ink-800 font-bold">{items.length}</b>건
        </div>
        <div className="flex items-center gap-2 bg-paper border border-ink-200 rounded-md px-3 py-1.5 min-w-[260px]">
          <Search size={13} className="text-ink-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="기업명 · 직무로 검색"
            className="bg-transparent outline-none text-[13px] flex-1 placeholder:text-ink-400"
          />
        </div>
      </div>

      <section className="bg-paper border border-ink-200 rounded-md overflow-visible">
        <div
          className="grid items-center px-5 py-2.5 bg-ink-50 border-b border-ink-200 text-[11.5px] font-semibold text-ink-500 tracking-wide"
          style={{ gridTemplateColumns: '1fr 110px 120px 180px' }}
        >
          <div>기업 · 직무</div>
          <div className="text-center">진행 상태</div>
          <div className="text-center">마지막 수정</div>
          <div className="text-center">액션</div>
        </div>

        {list.isLoading ? (
          <div className="py-16 text-center text-[13px] text-ink-500">
            불러오는 중…
          </div>
        ) : list.isError ? (
          <div className="py-16 text-center">
            <p className="text-[13px] text-ink-700 mb-3">
              {list.error?.apiMessage || '자소서 목록을 불러오지 못했습니다.'}
            </p>
            <button
              type="button"
              onClick={() => list.refetch()}
              className="btn-default"
            >
              다시 시도
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-ink-500">
            {items.length === 0
              ? '아직 작성한 자소서가 없어요. 우측 상단에서 새로 작성해보세요.'
              : '조건에 맞는 자소서가 없습니다.'}
          </div>
        ) : (
          filtered.map((e, i) => (
            <Row
              key={e.essayId}
              e={e}
              isLast={i === filtered.length - 1}
              open={openId === e.essayId}
              onOpen={() => setOpenId(openId === e.essayId ? null : e.essayId)}
              onClickRow={() => navigate(`/essays/${e.essayId}`)}
              onSetResult={(p) => setResult(e.essayId, p)}
              onAskDelete={() =>
                setConfirmDel({
                  essayId: e.essayId,
                  companyName: e.companyName,
                })
              }
              isPending={
                updateResult.isPending &&
                updateResult.variables?.id === e.essayId
              }
              isDeleting={del.isPending && del.variables === e.essayId}
            />
          ))
        )}
      </section>

      <Modal
        open={!!confirmDel}
        onClose={() => (del.isPending ? null : setConfirmDel(null))}
        title="자소서를 삭제하시겠습니까?"
        sub={`'${confirmDel?.companyName || '이 자소서'}' 자소서와 모든 문항이 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
        width={440}
        footer={
          <>
            <button
              type="button"
              className="btn-default"
              disabled={del.isPending}
              onClick={() => setConfirmDel(null)}
            >
              취소
            </button>
            <button
              type="button"
              className="btn-default !text-red-600 !border-red-200 hover:!bg-red-50"
              disabled={del.isPending}
              onClick={handleConfirmDelete}
            >
              <Trash2 size={13} strokeWidth={2} />
              {del.isPending ? '삭제 중…' : '삭제'}
            </button>
          </>
        }
      >
        <></>
      </Modal>
    </>
  );
}

function Row({
  e,
  isLast,
  open,
  onOpen,
  onClickRow,
  onSetResult,
  onAskDelete,
  isPending,
  isDeleting,
}) {
  const progress = e.progress ?? 'IN_PROGRESS';
  const isFinal = progress === 'PASS' || progress === 'FAIL';
  return (
    <div
      onClick={onClickRow}
      className={`grid items-center px-5 py-3.5 cursor-pointer hover:bg-ink-50/60 transition-colors
        ${isLast ? '' : 'border-b border-ink-150'}`}
      style={{ gridTemplateColumns: '1fr 110px 120px 180px' }}
    >
      <div className="min-w-0 pr-3">
        <div className="text-[14px] font-bold text-ink-900 truncate">
          {e.companyName || '(회사명 없음)'}
        </div>
        <div className="text-[12px] text-ink-500 truncate mt-0.5">
          {e.wishJob || '(직무 미입력)'}
        </div>
      </div>

      <div className="text-[12px] flex justify-center">
        <Badge tone={PROGRESS_TONE[progress] ?? 'gray'}>
          {PROGRESS_LABEL[progress] ?? progress}
        </Badge>
      </div>

      <div className="text-[12px] text-ink-600 tabular-nums text-center">
        {fmtDate(e.updatedAt)}
      </div>

      <div
        className="flex justify-center items-center gap-1.5 relative"
        onClick={(ev) => ev.stopPropagation()}
      >
        <Button
          size="sm"
          variant={isFinal ? 'default' : 'primary'}
          onClick={onOpen}
          disabled={isPending}
        >
          {isPending ? '저장 중…' : isFinal ? '결과 변경 ▾' : '결과 입력 ▾'}
        </Button>

        <button
          type="button"
          onClick={onAskDelete}
          disabled={isDeleting}
          title="자소서 삭제"
          aria-label="자소서 삭제"
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 z-30 bg-paper border border-ink-200 rounded-md shadow-lg w-44 py-1">
            {['PASS', 'FAIL', 'IN_PROGRESS'].map((p) => (
              <button
                key={p}
                onClick={() => onSetResult(p)}
                className="w-full text-left px-3 py-1.5 text-[12.5px] hover:bg-ink-50 flex items-center gap-2"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    p === 'PASS'
                      ? 'bg-[#1F7A4E]'
                      : p === 'FAIL'
                        ? 'bg-red-500'
                        : 'bg-ink-400'
                  }`}
                />
                {PROGRESS_LABEL[p]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function fmtDate(s) {
  if (!s) return '';
  return s.slice(0, 10).replaceAll('-', '.');
}
