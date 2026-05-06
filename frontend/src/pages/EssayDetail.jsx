import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Pencil,
  Trash2,
  X as XIcon,
  ArrowLeft,
  PencilLine,
  Check,
} from 'lucide-react';
import Crumbs from '../components/Crumbs';
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
 * 동작:
 *  - 메타 view ↔ edit 토글. 저장 = PATCH /essays/:id.
 *  - 문항 목록: 질문/답변/maxLength/문항 번호 표시. "이 문항 편집" 버튼은 본 페이지에서
 *    문항 단위 편집기를 띄우는 대신 /write 의 QuestionEditor 흐름으로 보내지 않고,
 *    상세에서는 읽기 전용으로 노출 (편집은 전용 페이지가 아닌 /write 흐름에서 관리).
 *    → 본 PR 에서는 단순히 읽기 + 결과/삭제 컨트롤. 문항 인라인 편집은 추후 단위로 분리.
 *  - 결과 입력: PATCH /essays/:id/result body: { progress: PASS|FAIL|IN_PROGRESS }.
 *  - 삭제: DELETE /essays/:id (2클릭 confirm + 5초 자동 취소).
 *
 * 진입 경로: /essays 카드 → /essays/:id (essayId 가 응답에 있을 때만 활성).
 *  목록 응답에 essayId 가 누락되면 진입은 차단되어 본 페이지에 도달 못 함.
 */
export default function EssayDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const q = useEssay(id);

  const [editingMeta, setEditingMeta] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        onSuccess: () => {
          toast.success('결과가 반영되었습니다.');
          q.refetch();
        },
        onError: (e) =>
          toast.error(e?.apiMessage || '결과 반영에 실패했습니다.'),
      }
    );
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 5000);
      return;
    }
    deleteEssay.mutate(id, {
      onSuccess: () => {
        toast.success('자소서를 삭제했습니다.');
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
      <Crumbs items={['자소서', '관리', '열람']} />

      {/* 메타 영역 */}
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="badge-navy">
                  {essay.companyName || '회사명 없음'}
                </span>
                <span className={`badge-${tone}`}>{label}</span>
              </div>
              <h1 className="text-[20px] font-bold tracking-tight text-ink-900 break-keep mb-1">
                {essay.wishJob || '직무 미입력'}
              </h1>
              {essay.updatedAt && (
                <div className="text-[12px] text-ink-500 tabular-nums mb-2">
                  최종 수정 {fmtDate(essay.updatedAt)}
                </div>
              )}
              <p className="text-[12.5px] text-ink-700 break-keep whitespace-pre-line">
                <span className="text-ink-500">글로벌 요구사항: </span>
                {essay.globalReq || '—'}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Link to="/essays" className="btn-default btn-sm">
                <ArrowLeft size={11} strokeWidth={2} />
                목록
              </Link>
              <button
                type="button"
                onClick={() => setEditingMeta(true)}
                className="btn-default btn-sm"
              >
                <Pencil size={11} strokeWidth={2} />
                메타 수정
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 결과 입력 */}
      {!editingMeta && (
        <section className="card mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[14px] font-bold text-ink-900">결과 입력</h2>
              <p className="text-[11.5px] text-ink-500 mt-0.5 break-keep">
                지원 결과를 기록하면 통계에 반영됩니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['IN_PROGRESS', 'PASS', 'FAIL'].map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={essay.progress === p || updateResult.isPending}
                  onClick={() => handleResult(p)}
                  className={
                    'btn-default btn-sm ' +
                    (essay.progress === p
                      ? 'opacity-50 cursor-not-allowed'
                      : '')
                  }
                >
                  {essay.progress === p && (
                    <Check size={11} strokeWidth={2.2} />
                  )}
                  {PROGRESS_LABEL[p]}
                </button>
              ))}
            </div>
          </div>
        </section>
