import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Sparkles,
  ChevronRight,
  Trash2,
  Check,
  ArrowLeft,
} from 'lucide-react';
import Crumbs from '../components/Crumbs';
import { Card } from '../components/Card';
import Button from '../components/Button';
import {
  useCreateEssay,
  useCreateEssayQuestion,
  useGenerateAnswer,
} from '../api/queries/useEssays';
import { toast } from '../store/useToast';

/* ------------------------------------------------------------------ *
 * 자소서 작성 — 2단계.
 *  Step 1) 지원 정보 입력 → POST /essays/create → essayId 발급
 *  Step 2) 문항 추가 — 한 카드씩 입력 → POST /essays/:essayId/questions
 *
 * 단순화: 친구 mock 의 "이 문항에 쓸 경험" 선택 섹션은 백엔드 recommend 응답이
 * 매칭% / 카테고리 / 기간 같은 친구 디자인 필드를 안 줘서 시연용으로 제거.
 * AI 초안 생성은 useGenerateAnswer 로 동작 — 단 generate 호출 전에 문항이 백엔드에
 * 저장돼 있어야 하므로 "(작성 예정)" placeholder 로 먼저 POST 하고 generate.
 * ------------------------------------------------------------------ */

export default function Write() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [meta, setMeta] = useState({
    companyName: '',
    wishJob: '',
    globalReq: '',
  });
  const [essayId, setEssayId] = useState(null);
  const [savedQuestions, setSavedQuestions] = useState([]);
  const create = useCreateEssay();

  const update = (patch) => setMeta((m) => ({ ...m, ...patch }));

  const goNext = () => {
    if (
      !meta.companyName.trim() ||
      !meta.wishJob.trim() ||
      !meta.globalReq.trim()
    ) {
      toast.error('회사명·직무·공통 요구사항을 모두 입력해주세요.');
      return;
    }
    create.mutate(meta, {
      onSuccess: (data) => {
        const id = data?.essayId;
        if (!id) {
          toast.error('자소서 ID를 받지 못했어요. 다시 시도해주세요.');
          return;
        }
        setEssayId(id);
        setStep(2);
      },
      onError: (e) => toast.error(e?.apiMessage || '자소서 생성에 실패했어요.'),
    });
  };

  return (
    <>
      <Crumbs items={['자소서', '작성하기']} />
      <div className="page-h flex items-start justify-between gap-4 mb-4">
        <div>
          <h1>자소서 작성</h1>
          <div className="sub">
            {step === 1
              ? '먼저 어떤 자소서를 쓸지 알려주세요.'
              : '문항을 추가하면 AI 가 초안을 만들어드려요.'}
          </div>
        </div>
        <Button onClick={() => navigate('/essays')}>
          <ArrowLeft size={13} /> 취소
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4 text-[12px]">
        <StepDot active={step === 1} done={step > 1} n={1} label="지원 정보" />
        <span className="w-6 h-px bg-ink-300" />
        <StepDot active={step === 2} done={false} n={2} label="문항 작성" />
      </div>

      {step === 1 ? (
        <Step1
          form={meta}
          onChange={update}
          onNext={goNext}
          isPending={create.isPending}
        />
      ) : (
        <Step2
          essayId={essayId}
          form={meta}
          savedQuestions={savedQuestions}
          onSavedQuestion={(q) => setSavedQuestions((prev) => [...prev, q])}
          onBack={() => setStep(1)}
          onFinish={() => navigate(`/essays/${essayId}`)}
        />
      )}
    </>
  );
}

/* ============== Step 1 ============== */
function Step1({ form, onChange, onNext, isPending }) {
  const ready =
    form.companyName.trim() && form.wishJob.trim() && form.globalReq.trim();
  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-[15px] font-bold text-ink-900">지원 정보</h2>
        <p className="text-[12.5px] text-ink-500 mt-1">
          자소서를 작성할 회사, 직무, 공통 요구사항을 정리해주세요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="회사명" required>
          <input
            className="field"
            placeholder="예: 카카오"
            value={form.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
          />
        </Field>
        <Field label="희망 직무" required>
          <input
            className="field"
            placeholder="예: 백엔드 개발자"
            value={form.wishJob}
            onChange={(e) => onChange({ wishJob: e.target.value })}
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field
          label="공통 요구사항"
          required
          hint="공고에 반복적으로 등장한 인재상·역량을 적어두면 모든 문항의 초안 생성에 반영됩니다."
        >
          <textarea
            className="field min-h-[100px]"
            placeholder="예: 백엔드 시스템 설계 경험, 동료 코드 리뷰 문화, 도전 정신을 갖춘 인재"
            value={form.globalReq}
            onChange={(e) => onChange({ globalReq: e.target.value })}
          />
        </Field>
      </div>

      <div className="flex justify-end mt-5 pt-4 border-t border-ink-150">
        <Button
          variant="primary"
          disabled={!ready || isPending}
          onClick={onNext}
        >
          {isPending ? (
            '생성 중…'
          ) : (
            <>
              다음 단계 <ChevronRight size={13} />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

/* ============== Step 2 ============== */
function Step2({
  essayId,
  form,
  savedQuestions,
  onSavedQuestion,
  onBack,
  onFinish,
}) {
  return (
    <>
      <Card className="mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] text-ink-500 font-semibold mb-1">
              지원 정보
            </div>
            <div className="text-[14px] font-bold text-ink-900 truncate">
              {form.companyName}{' '}
              <span className="text-ink-400 font-normal">·</span> {form.wishJob}
            </div>
            <div className="text-[12px] text-ink-600 mt-1 line-clamp-1">
              요구사항 — {form.globalReq}
            </div>
          </div>
          <Button onClick={onBack} disabled>
            지원 정보 수정
          </Button>
        </div>
      </Card>

      {savedQuestions.length > 0 && (
        <div className="flex flex-col gap-3 mb-4">
          {savedQuestions.map((q, i) => (
            <Card key={q.questionId}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-primary-900 text-white grid place-items-center text-[11px] font-bold">
                  Q{i + 1}
                </span>
                <span className="text-[11px] text-ink-500 font-semibold">
                  {q.maxLength}자 이내 · 추가 완료
                </span>
              </div>
              <div className="text-[13.5px] font-bold text-ink-900 mb-1.5 leading-relaxed">
                {q.question}
              </div>
              <div className="text-[12.5px] text-ink-600 line-clamp-2 break-keep">
                {q.response}
              </div>
            </Card>
          ))}
        </div>
      )}

      <NewQuestionCard
        essayId={essayId}
        nextNum={savedQuestions.length + 1}
        onSaved={onSavedQuestion}
      />

      <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-ink-150">
        <Button onClick={onBack}>이전</Button>
        <Button
          variant="primary"
          onClick={onFinish}
          disabled={savedQuestions.length === 0}
        >
          <Check size={13} /> 작성 완료
        </Button>
      </div>
    </>
  );
}

/* ============== 새 문항 입력 카드 ============== */
function NewQuestionCard({ essayId, nextNum, onSaved }) {
  const [draft, setDraft] = useState({
    question: '',
    response: '',
    maxLength: 800,
  });
  const create = useCreateEssayQuestion();
  const generate = useGenerateAnswer();
  const [busyAi, setBusyAi] = useState(false);

  const reset = () => setDraft({ question: '', response: '', maxLength: 800 });

  const save = (response) => {
    if (!draft.question.trim()) {
      toast.error('문항을 입력해주세요.');
      return;
    }
    const finalResponse = (response ?? draft.response).trim();
    if (!finalResponse) {
      toast.error('답변을 입력하거나 AI 초안을 생성해주세요.');
      return;
    }
    create.mutate(
      {
        essayId,
        body: {
          questionNum: nextNum,
          question: draft.question.trim(),
          response: finalResponse,
          maxLength: draft.maxLength,
          relatedExperience: [],
        },
      },
      {
        onSuccess: (data) => {
          toast.success(`Q${nextNum} 추가 완료.`);
          onSaved({
            questionId: data?.questionId ?? `tmp-${Date.now()}`,
            questionNum: nextNum,
            question: draft.question.trim(),
            response: finalResponse,
            maxLength: draft.maxLength,
          });
          reset();
        },
        onError: (e) => toast.error(e?.apiMessage || '문항 추가에 실패했어요.'),
      }
    );
  };

  // AI 초안: 백엔드 generate 가 essayId+questionId 를 받음 → 문항을 placeholder
  // response 로 먼저 POST → 받은 questionId 로 generate → 응답을 폼에 채워넣음.
  // 사용자가 검토 후 "추가하기" 누르면 PATCH 가 아니라 — 이미 저장된 questionId 가 있으니
  // 단순히 onSaved 로 부모 목록 업데이트 + 새 문항 폼 reset.
  const draftWithAi = async () => {
    if (!draft.question.trim()) {
      toast.error('문항을 먼저 입력해주세요.');
      return;
    }
    setBusyAi(true);
    try {
      // 1) placeholder 로 question POST → questionId 받음
      const created = await create.mutateAsync({
        essayId,
        body: {
          questionNum: nextNum,
          question: draft.question.trim(),
          response: '(작성 예정)',
          maxLength: draft.maxLength,
          relatedExperience: [],
        },
      });
      const questionId = created?.questionId;
      if (!questionId) {
        toast.error('문항 ID를 받지 못해 AI 생성을 건너뜁니다.');
        setBusyAi(false);
        return;
      }
      // 2) generate 호출
      const gen = await generate.mutateAsync({ essayId, questionId });
      const response = gen?.response ?? '';
      // 3) 부모 목록에 즉시 추가 (이미 백엔드에 저장됨)
      onSaved({
        questionId,
        questionNum: nextNum,
        question: draft.question.trim(),
        response: response || '(작성 예정)',
        maxLength: draft.maxLength,
      });
      toast.success(`Q${nextNum} AI 초안 생성 후 추가 완료.`);
      reset();
    } catch (e) {
      toast.error(e?.apiMessage || 'AI 초안 생성에 실패했어요.');
    } finally {
      setBusyAi(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary-900 text-white grid place-items-center text-[11px] font-bold">
            Q{nextNum}
          </span>
          <span className="text-[13px] font-bold text-ink-900">새 문항</span>
        </div>
        {(draft.question || draft.response) && (
          <button
            onClick={reset}
            className="text-ink-400 hover:text-red-500 transition-colors p-1"
            title="입력 비우기"
            disabled={create.isPending || busyAi}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <FieldInput label="문항">
        <textarea
          className="field min-h-[68px]"
          placeholder="자소서 문항을 그대로 붙여넣으세요."
          value={draft.question}
          onChange={(e) => setDraft({ ...draft, question: e.target.value })}
        />
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11.5px] text-ink-500">글자 제한</span>
          <input
            type="number"
            className="field max-w-[110px] py-1 text-[12px]"
            value={draft.maxLength}
            min={100}
            step={100}
            onChange={(e) =>
              setDraft({
                ...draft,
                maxLength: Number(e.target.value) || 0,
              })
            }
          />
          <span className="text-[11.5px] text-ink-500">자</span>
        </div>
      </FieldInput>

      <FieldInput label="답변">
        <textarea
          className="field min-h-[160px] leading-relaxed"
          placeholder="여기에 직접 답변을 작성하거나, 아래 [AI 초안 생성] 버튼을 눌러 자동 생성 후 추가하세요."
          value={draft.response}
          onChange={(e) => setDraft({ ...draft, response: e.target.value })}
        />
        <div className="text-right text-[11.5px] text-ink-500 font-mono mt-1">
          {draft.response.length} / {draft.maxLength}
        </div>
      </FieldInput>

      <div className="flex justify-end gap-2 pt-3 border-t border-ink-150 mt-3">
        <Button
          variant="primary"
          onClick={draftWithAi}
          disabled={busyAi || create.isPending || !draft.question.trim()}
        >
          {busyAi ? (
            'AI 생성 중…'
          ) : (
            <>
              <Sparkles size={13} /> AI 초안 생성 + 추가
            </>
          )}
        </Button>
        <Button
          variant="primary"
          onClick={() => save()}
          disabled={
            busyAi ||
            create.isPending ||
            !draft.question.trim() ||
            !draft.response.trim()
          }
        >
          {create.isPending ? (
            '추가 중…'
          ) : (
            <>
              <Plus size={13} /> 직접 입력 추가
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

/* ============== 보조 ============== */
function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <div className="flex items-baseline gap-1 mb-1.5">
        <span className="text-[12px] font-semibold text-ink-700">{label}</span>
        {required && <span className="text-[11px] text-red-500">*</span>}
      </div>
      {children}
      {hint && (
        <div className="text-[11.5px] text-ink-500 mt-1.5 leading-relaxed">
          {hint}
        </div>
      )}
    </label>
  );
}

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

function StepDot({ active, done, n, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
      ${
        active
          ? 'bg-primary-50 text-primary-800'
          : done
            ? 'bg-ink-100 text-ink-700'
            : 'text-ink-500'
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full grid place-items-center text-[10px] font-bold
        ${
          active
            ? 'bg-primary-800 text-white'
            : done
              ? 'bg-primary-700 text-white'
              : 'bg-ink-200 text-ink-500'
        }`}
      >
        {done ? '✓' : n}
      </span>
      <span className="font-semibold">{label}</span>
    </span>
  );
}
