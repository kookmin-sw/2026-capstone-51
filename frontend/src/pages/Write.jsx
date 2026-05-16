import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Check, Plus } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import { Card } from '../components/Card';
import Button from '../components/Button';
import QuestionEditor from '../components/essay/QuestionEditor';
import { useCreateEssay, useUpdateEssayMeta } from '../api/queries/useEssays';
import { toast } from '../store/useToast';

/* ------------------------------------------------------------------ *
 * 자소서 작성 — 2 단계.
 *
 *  Step 1) 지원 정보 입력 → POST /essays/create → essayId 발급.
 *  Step 2) essayId 에 매핑되는 문항을 한 개씩 추가 — 공용 QuestionEditor 사용.
 *           문항 등록 → 경험 추천/선택 → 초안 생성 → 저장.
 *  마지막 [자소서 저장 완료] → 디테일 페이지 이동 (인크리멘탈 저장됨).
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
  // QuestionEditor 안에서 [초안 생성] 이 한 번이라도 눌렸고 아직 저장 전이면 true.
  // 페이지 헤더의 "취소" 버튼을 잠그는 데 사용 — QuestionEditor 우상단 X 가 사라지는
  // 시점과 동일하게 잠그기 위해 onGenerationStart 콜백으로 set, onSaved/onBack 으로 release.
  const [editorBusy, setEditorBusy] = useState(false);
  const create = useCreateEssay();
  const updateMeta = useUpdateEssayMeta();

  const goNext = () => {
    if (
      !meta.companyName.trim() ||
      !meta.wishJob.trim() ||
      !meta.globalReq.trim()
    ) {
      toast.error('회사명·직무·공통 요구사항을 모두 입력해주세요.');
      return;
    }
    // 이미 essay 가 생성된 상태(= 사용자가 [이전] 으로 Step1 에 돌아왔다가 다시 [다음])
    // 라면 POST 로 새로 만들지 말고 PATCH 로 메타만 갱신. 그래야 같은 essay 에 문항이
    // 누적된다 — 안 그러면 이전·다음 누를 때마다 중복 자소서가 생김.
    if (essayId) {
      updateMeta.mutate(
        { id: essayId, body: meta },
        {
          onSuccess: () => setStep(2),
          onError: (e) =>
            toast.error(e?.apiMessage || '지원 정보 갱신에 실패했어요.'),
        }
      );
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
              : '문항을 하나씩 추가하면서 AI 와 함께 초안을 만들어보세요.'}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {editorBusy && (
            <span className="text-[11.5px] text-ink-500 text-right break-keep">
              초안 생성 중인 문항을 저장한 뒤에 취소할 수 있어요.
            </span>
          )}
          <Button
            onClick={() => navigate('/essays')}
            disabled={editorBusy}
          >
            <ArrowLeft size={13} /> 취소
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 text-[12px]">
        <StepDot active={step === 1} done={step > 1} n={1} label="지원 정보" />
        <span className="w-6 h-px bg-ink-300" />
        <StepDot active={step === 2} done={false} n={2} label="문항 작성" />
      </div>

      {step === 1 ? (
        <Step1
          form={meta}
          onChange={(p) => setMeta((m) => ({ ...m, ...p }))}
          onNext={goNext}
          isPending={create.isPending || updateMeta.isPending}
        />
      ) : (
        <Step2
          essayId={essayId}
          meta={meta}
          savedQuestions={savedQuestions}
          onQuestionSaved={(q) => {
            setSavedQuestions((prev) => [...prev, q]);
            setEditorBusy(false);
          }}
          onGenerationStart={() => setEditorBusy(true)}
          onBack={() => {
            // step 1 로 돌아갈 땐 일단 lock 해제. 다시 step 2 로 와서 새 editor 를 열면
            // QuestionEditor 가 한 번 [초안 생성] 을 누를 때 다시 set 됨.
            setEditorBusy(false);
            setStep(1);
          }}
          onFinish={() => navigate(`/essays/${essayId}`)}
        />
      )}
    </>
  );
}

/* ============================ Step 1 ============================ */

function Step1({ form, onChange, onNext, isPending }) {
  const ready =
    form.companyName.trim() && form.wishJob.trim() && form.globalReq.trim();
  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-[15px] font-bold text-ink-900">지원 정보</h2>
        <p className="text-[12.5px] text-ink-500 mt-1">
          자소서를 작성할 회사, 직무, 공통 요구사항을 정리해주세요. 모든 문항의
          초안 생성에 반영됩니다.
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
          hint="공고에 반복적으로 등장한 인재상·역량을 적어두면 모든 문항의 초안에 반영됩니다."
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
              다음 <ChevronRight size={13} />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

/* ============================ Step 2 ============================ */

function Step2({
  essayId,
  meta,
  savedQuestions,
  onQuestionSaved,
  onGenerationStart,
  onBack,
  onFinish,
}) {
  // editor 토글 — [+ 새 문항 추가] 를 눌러야 폼이 뜸. 저장 시 자동으로 닫힘.
  const [open, setOpen] = useState(false);
  // 저장 후 editor 강제 리마운트해서 모든 내부 state 초기화 (다음 추가 때 fresh).
  const [editorKey, setEditorKey] = useState(0);

  const handleSaved = (q) => {
    onQuestionSaved(q);
    setEditorKey((k) => k + 1);
    setOpen(false);
  };

  return (
    <>
      {/* 지원 정보 요약 */}
      <Card className="mb-4">
        <div className="text-[11px] text-ink-500 font-semibold mb-1">
          지원 정보
        </div>
        <div className="text-[14px] font-bold text-ink-900">
          {meta.companyName}{' '}
          <span className="text-ink-400 font-normal">·</span> {meta.wishJob}
        </div>
        <div className="text-[12px] text-ink-600 mt-1 break-keep">
          공통 요구사항 — {meta.globalReq}
        </div>
      </Card>

      {/* 저장된 문항 */}
      {savedQuestions.length > 0 && (
        <div className="flex flex-col gap-3 mb-4">
          {savedQuestions.map((q, i) => (
            <SavedQuestionCard key={q.questionId} q={q} index={i} />
          ))}
        </div>
      )}

      {/* 새 문항 추가 — 명시적 버튼 토글 */}
      {open ? (
        <QuestionEditor
          key={editorKey}
          essayId={essayId}
          nextNum={savedQuestions.length + 1}
          onSaved={handleSaved}
          onCancel={() => setOpen(false)}
          onGenerationStart={onGenerationStart}
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full py-4 rounded-md border border-dashed border-ink-300 bg-paper hover:bg-ink-50 text-[13px] font-semibold text-ink-700 inline-flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={14} /> 새 문항 추가
        </button>
      )}

      <div className="flex flex-col items-end gap-1.5 pt-4 mt-4 border-t border-ink-150">
        {open && (
          <span className="text-[11.5px] text-ink-500">
            작성 중인 문항을 저장하거나 취소한 뒤에 완료할 수 있어요.
          </span>
        )}
        <div className="flex justify-end gap-2">
          <Button onClick={onBack}>이전</Button>
          <Button
            variant="primary"
            onClick={onFinish}
            disabled={savedQuestions.length === 0 || open}
          >
            <Check size={13} /> 자소서 저장 완료
          </Button>
        </div>
      </div>
    </>
  );
}

/* -------- 저장된 문항 카드 (읽기 전용) -------- */
function SavedQuestionCard({ q, index }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-full bg-primary-900 text-white grid place-items-center text-[11px] font-bold">
          Q{index + 1}
        </span>
        <span className="text-[11px] text-ink-500 font-semibold">
          {q.maxLength}자 이내 · 저장 완료
        </span>
      </div>
      <div className="text-[13.5px] font-bold text-ink-900 mb-1.5 leading-relaxed">
        {q.question}
      </div>
      <div className="text-[12.5px] text-ink-600 line-clamp-3 break-keep whitespace-pre-line">
        {q.response}
      </div>
    </Card>
  );
}

/* ============================ 보조 ============================ */

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