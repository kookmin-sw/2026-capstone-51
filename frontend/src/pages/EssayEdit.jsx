import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Plus, ArrowLeft, Check } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import { Card } from '../components/Card';
import Button from '../components/Button';
import QuestionEditor, {
  PLACEHOLDER_RESPONSE,
} from '../components/essay/QuestionEditor';
import QuestionEditCard from '../components/essay/QuestionEditCard';
import { useEssay, useUpdateEssayMeta } from '../api/queries/useEssays';
import { toast } from '../store/useToast';

/* ------------------------------------------------------------------ *
 * 자소서 수정 — 백엔드 PATCH /essays/:id, PATCH /essays/:id/questions/:qid,
 * POST /essays/:id/questions, POST /essays/regenerate.
 *
 *  - 지원 정보 (회사명/직무/공통요구사항) 카드: 수정하기 → 적용 시 useUpdateEssayMeta.
 *  - 각 문항 카드: 수정하기 → 적용 시 useUpdateEssayQuestion.
 *  - 새 문항 추가: Write Step 2 와 동일한 QuestionEditor 사용
 *                  (문항 등록 → 경험 추천/선택 → 초안 생성 → 저장).
 *  - AI 재생성: 각 문항 카드 안에서 요구사항 입력 + useRegenerateAnswer → 별도 텍스트폼.
 * ------------------------------------------------------------------ */

export default function EssayEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const detail = useEssay(id);

  if (detail.isLoading) {
    return (
      <>
        <Crumbs items={['자소서', '관리', '수정']} />
        <Card className="text-center text-[13px] text-ink-500 py-12">
          불러오는 중…
        </Card>
      </>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <>
        <Crumbs items={['자소서', '관리', '수정']} />
        <Card className="text-center py-10">
          <p className="text-[13px] text-ink-700 mb-3">
            {detail.error?.apiMessage || '자소서를 불러오지 못했습니다.'}
          </p>
          <Button onClick={() => navigate('/essays')}>
            <ArrowLeft size={13} /> 목록으로
          </Button>
        </Card>
      </>
    );
  }

  const essay = detail.data;
  // placeholder response 가 박힌 문항 = 아래 QuestionEditor 에서 등록만 하고 아직 저장 전인
  // 작성 중 임시 레코드. 사용자의 "저장하기" PATCH 가 끝나기 전엔 기존 리스트에서 숨긴다.
  // questionNum 오름차순 정렬 — 백엔드가 생성 순(최근이 위)으로 줄 수 있어 항상 클라이언트에서 보정.
  const questions = (essay.questions ?? [])
    .filter((q) => q.response !== PLACEHOLDER_RESPONSE)
    .slice()
    .sort((a, b) => (a.questionNum ?? 0) - (b.questionNum ?? 0));

  return (
    <>
      <Crumbs items={['자소서', '관리', essay.companyName || '수정', '수정']} />
      <div className="page-h flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h1>{essay.companyName || '(회사명 없음)'} 자소서 수정</h1>
          <div className="sub">
            각 영역 우측 상단의 수정하기 버튼으로 편집할 수 있어요.
          </div>
        </div>
        <Button onClick={() => navigate(`/essays/${id}`)}>
          <ArrowLeft size={13} /> 돌아가기
        </Button>
      </div>

      <MetaSection essayId={id} essay={essay} />

      <div className="flex flex-col gap-4 mt-4">
        {questions.map((q, i) => (
          <QuestionEditCard key={q.questionId} essayId={id} q={q} index={i} />
        ))}
      </div>

      <NewQuestionBlock essayId={id} initialNextNum={questions.length + 1} />
    </>
  );
}

/* ============== 지원 정보 ============== */
function MetaSection({ essayId, essay }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    companyName: essay.companyName ?? '',
    wishJob: essay.wishJob ?? '',
    globalReq: essay.globalReq ?? '',
  });
  const update = useUpdateEssayMeta();

  useEffect(() => {
    if (editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft({
        companyName: essay.companyName ?? '',
        wishJob: essay.wishJob ?? '',
        globalReq: essay.globalReq ?? '',
      });
    }
  }, [editing, essay]);

  const apply = () => {
    update.mutate(
      { id: essayId, body: draft },
      {
        onSuccess: () => {
          toast.success('지원 정보를 저장했어요.');
          setEditing(false);
        },
        onError: (e) => toast.error(e?.apiMessage || '저장에 실패했어요.'),
      }
    );
  };

  if (!editing) {
    return (
      <Card>
        <div className="flex items-start justify-between mb-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            지원 정보
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-ink-500 hover:text-primary-700 inline-flex items-center gap-1 text-[12px] font-semibold"
          >
            <Pencil size={12} /> 수정하기
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="회사명" value={essay.companyName} />
          <Field label="희망 직무" value={essay.wishJob} />
        </div>
        <div className="mt-3">
          <Field label="공통 요구사항" value={essay.globalReq} multiline />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-primary-800">
          지원 정보 · 수정 중
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="회사명">
          <input
            className="field"
            value={draft.companyName}
            onChange={(e) =>
              setDraft({ ...draft, companyName: e.target.value })
            }
          />
        </FieldInput>
        <FieldInput label="희망 직무">
          <input
            className="field"
            value={draft.wishJob}
            onChange={(e) => setDraft({ ...draft, wishJob: e.target.value })}
          />
        </FieldInput>
      </div>
      <div className="mt-3">
        <FieldInput label="공통 요구사항">
          <textarea
            className="field min-h-[88px]"
            value={draft.globalReq}
            onChange={(e) => setDraft({ ...draft, globalReq: e.target.value })}
          />
        </FieldInput>
      </div>
      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-ink-150">
        <Button onClick={() => setEditing(false)} disabled={update.isPending}>
          취소
        </Button>
        <Button variant="primary" onClick={apply} disabled={update.isPending}>
          {update.isPending ? (
            '저장 중…'
          ) : (
            <>
              <Check size={13} /> 적용하기
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

/* ============== 새 문항 추가 ============== */
/**
 * Write Step 2 와 동일한 QuestionEditor 를 사용.
 * - 토글: "+ 새 문항 추가" 버튼 → 클릭 시 editor 펼침. 우상단 X 로 접을 수 있음.
 * - 한 문항 저장 후 editor 를 강제 리마운트(editorKey)해서 연속으로 새 문항을 추가 가능.
 *
 * nextNum:
 *  - 부모에서 `initialNextNum = questions.length + 1` 를 전달.
 *  - 로컬 state 로 관리해서 저장 후 즉시 +1 (refetch 대기로 인한 stale 회피).
 *  - useEffect 로 부모 prop 이 더 크면 따라잡되 절대 줄어들지 않음.
 */
function NewQuestionBlock({ essayId, initialNextNum }) {
  const [open, setOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  // storedNextNum: 로컬에서 저장할 때마다 +1. nextNum: 부모 prop 과 max 로 합쳐 절대 감소 안 함.
  const [storedNextNum, setStoredNextNum] = useState(initialNextNum);
  const nextNum = Math.max(storedNextNum, initialNextNum);

  const handleSaved = () => {
    setStoredNextNum(nextNum + 1);
    setEditorKey((k) => k + 1);
    // 저장 후 editor 닫음 — 다음 문항은 [+ 새 문항 추가] 다시 눌러야 열림.
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-4 py-4 rounded-md border border-dashed border-ink-300 bg-paper hover:bg-ink-50 text-[13px] font-semibold text-ink-700 inline-flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={14} /> 새 문항 추가
      </button>
    );
  }

  return (
    <div className="mt-4">
      <QuestionEditor
        key={editorKey}
        essayId={essayId}
        nextNum={nextNum}
        onSaved={handleSaved}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

/* ============== 보조 ============== */
function FieldInput({ label, hint, children }) {
  return (
    <div className="mt-3 first:mt-0">
      <div className="text-[12px] font-semibold text-ink-700 mb-1.5">
        {label}
      </div>
      {children}
      {hint && (
        <div className="text-[11.5px] text-ink-500 mt-1.5 leading-relaxed">
          {hint}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, multiline }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-ink-500 mb-1">{label}</div>
      <div
        className={`text-[13.5px] text-ink-800 ${multiline ? 'leading-relaxed whitespace-pre-wrap' : 'font-medium'}`}
      >
        {value || <span className="text-ink-400 italic">미입력</span>}
      </div>
    </div>
  );
}


