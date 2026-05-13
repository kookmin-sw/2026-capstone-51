import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Pencil, Trash2, PencilLine, Check } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import Modal from '../components/Modal';
import EssayMetaForm from '../components/essay/EssayMetaForm';
import {
  useEssay,
  useUpdateEssayMeta,
  useUpdateEssayResult,
  useDeleteEssay,
} from '../api/queries/useEssays';
import { PROGRESS_LABEL, PROGRESS_TONE } from '../lib/enums';
import { toast } from '../store/useToast';

/**
 * /essays/:id — 자소서 상세 페이지.
 *
 * 데이터: GET /essays/:id (useEssay 훅이 EssayDetailResponse 의 requirement→globalReq,
 *  modifiedDate→updatedAt normalize 적용).
 *
 * 카드 구조 (2026-05-13 정리):
 *  - "기본 정보" 카드 하나로 통합 — 헤더(회사명 h1 + 진행상태 뱃지 + [수정][삭제]),
 *    직무·최종수정일 sub, 글로벌 요구사항, 결과 입력 토글 한 줄.
 *  - "문항" 카드 — 문항 목록 (읽기 전용, 편집은 /write 흐름에서).
 *  - 삭제 모달 — ExperienceDetail / CertificateDetail 패턴과 일관 (위험 영역 카드 폐기).
 *
 * 동작:
 *  - 메타 view ↔ edit 토글. 저장 = PATCH /essays/:id.
 *  - 결과 입력: PATCH /essays/:id/result body: { progress: PASS|FAIL|IN_PROGRESS }.
 *  - 삭제: DELETE /essays/:id (모달 확인).
 *
 * 진입 경로: /essays row 클릭 → /essays/:id (essayId 가 응답에 있을 때만 활성).
 */
export default function EssayDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const q = useEssay(id);

  const [editingMeta, setEditingMeta] = useState(false);
  const [confirmDelOpen, setConfirmDelOpen] = useState(false);

  const updateMeta = useUpdateEssayMeta();
  const updateResult = useUpdateEssayResult();
  const deleteEssay = useDeleteEssay();

  const handleMetaSave = (body) => {
    updateMeta.mutate(
      { id, body },
      {
        onSuccess: () => {
          setEditingMeta(false);
          toast.success('자소서 정보가 수정되었습니다.');
          q.refetch();
        },
        onError: (e) => toast.error(e?.apiMessage || '수정에 실패했습니다.'),
      }
    );
  };

  const handleResult = (progress) => {
    updateResult.mutate(
      { id, progress },
      {
        // optimistic update 가 같은 mutation 의 정의-시 onMutate 에서 setQueryData
        // 로 즉시 cache 갱신 → 다음 렌더에 active 버튼이 즉시 바뀜.
        // 토스트도 같은 시점에 띄워 "변경 → 알림" 이 같은 frame 에 적용되도록.
        // (옛 onSuccess 위치는 서버 응답 후라 토스트가 변경보다 늦게 보였음.)
        onMutate: () => {
          toast.success('결과가 반영되었습니다.');
        },
        onError: (e) =>
          toast.error(e?.apiMessage || '결과 반영에 실패했습니다.'),
      }
    );
  };

  const handleConfirmDelete = () => {
    deleteEssay.mutate(id, {
      onSuccess: () => {
        toast.success('자소서를 삭제했습니다.');
        setConfirmDelOpen(false);
        nav('/essays');
      },
      onError: (e) => toast.error(e?.apiMessage || '삭제에 실패했습니다.'),
    });
  };

  if (q.isLoading) return <DetailSkeleton />;
  if (q.isError) {
    return (
      <DetailError
        message={q.error?.apiMessage || '자소서를 불러오지 못했습니다.'}
        onRetry={() => q.refetch()}
      />
    );
  }
  const essay = q.data;
  if (!essay) return null;

  const tone = PROGRESS_TONE[essay.progress] || 'gray';
  const label = PROGRESS_LABEL[essay.progress] || essay.progress || '작성 중';

  return (
    <>
      <Crumbs items={['자소서', { label: '관리', to: '/essays' }, '열람']} />

      {/* 기본 정보 — 메타 + 결과 입력 통합 카드 */}
      <section className="card mb-4">
        {editingMeta ? (
          <EssayMetaForm
            initialValue={{
              companyName: essay.companyName,
              wishJob: essay.wishJob,
              globalReq: essay.globalReq,
            }}
            onSubmit={handleMetaSave}
            onCancel={() => setEditingMeta(false)}
            isPending={updateMeta.isPending}
            submitLabel="수정 저장"
          />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="text-[12px] text-ink-500 mb-1.5 flex items-center gap-2">
                  <span>자소서</span>
                  <span className={`badge-${tone}`}>{label}</span>
                </div>
                <h1 className="text-[22px] font-bold tracking-tight text-ink-900 break-keep">
                  {essay.companyName || '회사명 없음'}
                </h1>
                <div className="text-[13px] text-ink-700 mt-0.5 break-keep">
                  {essay.wishJob || '직무 미입력'}
                  {essay.updatedAt && (
                    <span className="text-ink-500 ml-2 tabular-nums">
                      · 최종 수정 {fmtDate(essay.updatedAt)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingMeta(true)}
                  className="btn-default btn-sm"
                >
                  <Pencil size={11} strokeWidth={2} />
                  메타 수정
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelOpen(true)}
                  disabled={deleteEssay.isPending}
                  className="btn-default btn-sm !text-red-600 !border-red-200 hover:!bg-red-50"
                >
                  <Trash2 size={11} strokeWidth={2} />
                  삭제
                </button>
              </div>
            </div>

            <div className="border-t border-ink-150 pt-3">
              <div className="text-[11.5px] font-semibold text-ink-500 mb-1">
                글로벌 요구사항
              </div>
              <p className="text-[13px] text-ink-800 break-keep whitespace-pre-line">
                {essay.globalReq || <span className="text-ink-400">—</span>}
              </p>
            </div>

            <div className="border-t border-ink-150 mt-3 pt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12.5px] font-semibold text-ink-800">
                  지원 결과
                </div>
                <p className="text-[11.5px] text-ink-500 mt-0.5 break-keep">
                  결과를 기록하면 통계에 반영됩니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['IN_PROGRESS', 'PASS', 'FAIL'].map((p) => {
                  const isActive = essay.progress === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      disabled={isActive || updateResult.isPending}
                      onClick={() => handleResult(p)}
                      className={
                        'btn-default btn-sm ' +
                        (isActive ? RESULT_ACTIVE_CLASS[p] : '')
                      }
                    >
                      {isActive && <Check size={11} strokeWidth={2.2} />}
                      {PROGRESS_LABEL[p]}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </section>

      {/* 문항 카드 */}
      {!editingMeta && (
        <section className="card">
          <header className="flex items-end justify-between gap-3 mb-3 flex-wrap">
            <div>
              <h2 className="text-[14px] font-bold text-ink-900">문항</h2>
              <p className="text-[11.5px] text-ink-500 mt-0.5 break-keep">
                문항별 질문과 작성한 답변. 편집은 자소서 작성 화면에서.
              </p>
            </div>
            <Link to="/write" className="btn-default btn-sm">
              <PencilLine size={11} strokeWidth={2.2} />새 문항 작성
            </Link>
          </header>
          {(essay.questions || []).length === 0 ? (
            <div className="text-center py-6 text-[12.5px] text-ink-500 break-keep">
              아직 작성된 문항이 없어요.
            </div>
          ) : (
            <ol className="grid gap-3">
              {essay.questions.map((qst) => (
                <li
                  key={qst.questionId}
                  className="rounded-md border border-ink-150 bg-paper p-3"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="badge-gray">{qst.questionNum}번</span>
                    {qst.maxLength != null && (
                      <span className="text-[11px] text-ink-500 tabular-nums">
                        최대 {qst.maxLength}자
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] font-semibold text-ink-900 mb-1.5 break-keep">
                    {qst.question}
                  </div>
                  <div className="text-[12.5px] text-ink-700 break-keep whitespace-pre-line">
                    {qst.response || '(작성 전)'}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* 삭제 확인 모달 */}
      <Modal
        open={confirmDelOpen}
        onClose={() =>
          deleteEssay.isPending ? null : setConfirmDelOpen(false)
        }
        title="삭제하시겠습니까?"
        sub={`'${essay.companyName || '이 자소서'}' 항목이 영구 삭제되고, 모든 문항도 함께 사라집니다. 이 작업은 되돌릴 수 없습니다.`}
        width={420}
        footer={
          <>
            <button
              type="button"
              className="btn-default"
              disabled={deleteEssay.isPending}
              onClick={() => setConfirmDelOpen(false)}
            >
              취소
            </button>
            <button
              type="button"
              className="btn-default !text-red-600 !border-red-200 hover:!bg-red-50"
              disabled={deleteEssay.isPending}
              onClick={handleConfirmDelete}
            >
              <Trash2 size={13} strokeWidth={2} />
              {deleteEssay.isPending ? '삭제 중…' : '삭제'}
            </button>
          </>
        }
      >
        <></>
      </Modal>
    </>
  );
}

/* ---------- 상태 ---------- */

function DetailSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="card animate-pulse">
        <div className="h-3 w-1/4 bg-ink-100 rounded mb-2" />
        <div className="h-5 w-1/2 bg-ink-100 rounded mb-3" />
        <div className="h-3 w-3/4 bg-ink-100 rounded" />
      </div>
      <div className="card animate-pulse">
        <div className="h-3 w-1/3 bg-ink-100 rounded mb-3" />
        <div className="grid gap-2">
          <div className="h-3 bg-ink-100 rounded" />
          <div className="h-3 w-3/4 bg-ink-100 rounded" />
        </div>
      </div>
    </div>
  );
}

function DetailError({ message, onRetry }) {
  return (
    <section className="card text-center py-10">
      <p className="text-[13px] text-ink-700 mb-3 break-keep">{message}</p>
      <div className="flex justify-center gap-2">
        <Link to="/essays" className="btn-default">
          목록으로
        </Link>
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn-default">
            다시 시도
          </button>
        )}
      </div>
    </section>
  );
}

function fmtDate(d) {
  if (!d) return '';
  return d.slice(0, 10).replaceAll('-', '.');
}

// 결과 토글 active 색을 진행상태별로 매핑 — 의미와 색이 일치하도록.
// 헤더 진행상태 뱃지(.badge-{tone}) 와 같은 톤 계열.
const RESULT_ACTIVE_CLASS = {
  IN_PROGRESS: '!border-ink-400 !text-ink-800 !bg-ink-100',
  PASS: '!border-emerald-600 !text-emerald-700 !bg-emerald-50',
  FAIL: '!border-red-400 !text-red-700 !bg-red-50',
};
