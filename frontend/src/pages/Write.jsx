import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pencil,
  X as XIcon,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Crumbs from '../components/Crumbs';
import EssayMetaForm from '../components/essay/EssayMetaForm';
import QuestionEditor, {
  AddQuestionButton,
} from '../components/essay/QuestionEditor';
import { useCreateEssay, useUpdateEssayMeta } from '../api/queries/useEssays';
import { toast } from '../store/useToast';

/**
 * /write — 자소서 작성 페이지.
 *
 * 두 단계 stage machine:
 *  - 'meta'      : 회사명·희망직무·글로벌 요구사항 입력 → POST /essays/create → essayId 받음 → 'questions' 로
 *  - 'questions' : 문항 카드 다중. 각 문항은 QuestionEditor 가 추천/생성/재생성/저장 한 번에 처리.
 *
 * 메타 수정: 'questions' 단계에서 헤더의 "메타 수정" 클릭 시 inline 편집 → PATCH /essays/:id.
 *
 * 작성 완료: /essays 로 이동. (essayId 응답 누락 백엔드 이슈 때문에 목록→상세 라우팅은 차단된 상태이지만,
 * 적어도 목록에는 노출됨.)
 *
 * 백엔드 의존:
 *  - 자소서 메타·문항 생성·AI 호출·저장 모두 준비됨.
 *  - 이어쓰기 모드는 essayId 라우팅이 막혀있어 본 PR 에선 미지원.
 */
export default function Write() {
  const nav = useNavigate();
  const [stage, setStage] = useState('meta'); // 'meta' | 'questions'
  const [meta, setMeta] = useState(null); // {companyName, wishJob, globalReq, essayId}
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaCollapsed, setMetaCollapsed] = useState(false);
  // 문항 카드 — 신규는 questionId=null, 저장 후 questionId 채워짐
  const [questions, setQuestions] = useState([
    { tmpId: tmpId(), questionId: null },
  ]);

  const createEssay = useCreateEssay();
  const updateMeta = useUpdateEssayMeta();

  const handleMetaSubmit = (body) => {
    createEssay.mutate(body, {
      onSuccess: (data) => {
        const id = data?.essayId;
        if (!id) {
          toast.error('자소서 ID 응답이 누락되었습니다. 백엔드 확인 필요.');
          return;
        }
        setMeta({ ...body, essayId: id });
        setStage('questions');
      },
      onError: (e) => {
        toast.error(
          e?.apiMessage || '자소서 생성에 실패했습니다. 다시 시도해주세요.'
        );
      },
    });
  };

  const handleMetaUpdate = (body) => {
    if (!meta?.essayId) return;
    updateMeta.mutate(
      { id: meta.essayId, body },
      {
        onSuccess: () => {
          setMeta((m) => ({ ...m, ...body }));
          setEditingMeta(false);
          toast.success('자소서 정보가 수정되었습니다.');
        },
        onError: (e) => {
          toast.error(
            e?.apiMessage || '수정에 실패했습니다. 다시 시도해주세요.'
          );
        },
      }
    );
  };

  const onQuestionSaved = (idx, saved) => {
    setQuestions((arr) => {
      const next = [...arr];
      next[idx] = {
        ...next[idx],
        questionId: saved.questionId,
        question: saved.question,
        response: saved.response,
        maxLength: saved.maxLength,
        relatedExperience: saved.relatedExperience,
      };
      return next;
    });
  };

  const addQuestion = () => {
    setQuestions((arr) => [...arr, { tmpId: tmpId(), questionId: null }]);
  };

  const removeUnsavedQuestion = (idx) => {
    setQuestions((arr) => arr.filter((_, i) => i !== idx));
  };

  const handleFinish = () => {
    nav('/essays');
  };

  if (stage === 'meta') {
    return (
      <>
        <Crumbs items={['자소서', '작성하기']} />
        <header className="mb-5">
          <h1 className="text-[22px] font-bold tracking-tight text-ink-900">
            자소서 작성
          </h1>
          <p className="text-[12.5px] text-ink-500 mt-1 break-keep">
            먼저 지원 회사와 희망 직무, 그리고 모든 문항에 공통으로 반영할
            글로벌 요구사항을 입력해주세요.
          </p>
        </header>
        <div className="card">
          <EssayMetaForm
            onSubmit={handleMetaSubmit}
            onCancel={() => nav('/essays')}
            isPending={createEssay.isPending}
            submitLabel="다음 단계"
          />
        </div>
      </>
    );
  }

  // stage === 'questions'
  const savedCount = questions.filter((q) => q.questionId).length;

  return (
    <>
      <Crumbs items={['자소서', '작성하기']} />

      {/* 헤더: 메타 정보 + 편집 + collapse 토글 */}
      <header className="card mb-4 relative">
        {/* 우측 위 collapse 토글 — 편집 모드일 때는 숨김 */}
        {!editingMeta && (
          <button
            type="button"
            onClick={() => setMetaCollapsed((v) => !v)}
            aria-expanded={!metaCollapsed}
            aria-label={metaCollapsed ? '메타 정보 펼치기' : '메타 정보 접기'}
            className="absolute top-3 right-3 p-1 rounded hover:bg-ink-100 text-ink-500 hover:text-ink-800 transition-colors"
          >
            {metaCollapsed ? (
              <ChevronDown size={16} strokeWidth={2} />
            ) : (
              <ChevronUp size={16} strokeWidth={2} />
            )}
          </button>
        )}
        {editingMeta ? (
          <EssayMetaForm
            initialValue={meta}
            onSubmit={handleMetaUpdate}
            onCancel={() => setEditingMeta(false)}
            isPending={updateMeta.isPending}
            submitLabel="수정 저장"
          />
        ) : metaCollapsed ? (
          // 접힌 상태: 한 줄 요약 (회사명 · 직무)
          <div className="flex items-center gap-2 text-[13px] pr-9">
            <span className="badge-navy">{meta.companyName}</span>
            <span className="text-ink-400">·</span>
            <span className="text-ink-700 font-semibold">{meta.wishJob}</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-3 pr-9">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[12px] mb-1.5">
                <span className="badge-navy">{meta.companyName}</span>
                <span className="text-ink-400">·</span>
                <span className="text-ink-700 font-semibold">
                  {meta.wishJob}
                </span>
              </div>
              <h1 className="text-[18px] font-bold text-ink-900 mb-1">
                자소서 작성 중
              </h1>
              <p className="text-[12.5px] text-ink-600 break-keep whitespace-pre-line">
                <span className="text-ink-500">글로벌 요구사항: </span>
                {meta.globalReq}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingMeta(true)}
              className="btn-default btn-sm"
            >
              <Pencil size={11} strokeWidth={2} />
              메타 수정
            </button>
          </div>
        )}
      </header>

      {/* 문항 목록 */}
      <div className="grid gap-3">
        {questions.map((q, i) => (
          <QuestionEditor
            key={q.tmpId || q.questionId}
            essayId={meta.essayId}
            questionNum={i + 1}
            initialValue={q.questionId ? q : undefined}
            onSaved={(saved) => onQuestionSaved(i, saved)}
            onRemove={
              !q.questionId && questions.length > 1
                ? () => removeUnsavedQuestion(i)
                : undefined
            }
          />
        ))}
        <AddQuestionButton onClick={addQuestion} />
      </div>

      {/* 푸터: 작성 완료 */}
      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[12px] text-ink-500">
          저장된 문항 {savedCount}개 / 총 {questions.length}개
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => nav('/essays')}
            className="btn-default"
          >
            <XIcon size={13} strokeWidth={2} />
            나가기
          </button>
          <button
            type="button"
            onClick={handleFinish}
            disabled={savedCount === 0}
            className="btn-primary"
          >
            <Check size={13} strokeWidth={2} />
            작성 완료
          </button>
        </div>
      </div>
    </>
  );
}

/** crypto.randomUUID 가 모든 환경에서 보장되지 않을 수 있어 폴백 포함. */
function tmpId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
