import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Plus, Sparkles, ArrowLeft, Check } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import { Card } from '../components/Card';
import Button from '../components/Button';
import QuestionEditor, {
  PLACEHOLDER_RESPONSE,
} from '../components/essay/QuestionEditor';
import UsedExperiences from '../components/essay/UsedExperiences';
import {
  useEssay,
  useUpdateEssayMeta,
  useUpdateEssayQuestion,
  useRegenerateAnswer,
  useRecommendExperiences,
  useGenerateAnswer,
} from '../api/queries/useEssays';
import { cn } from '../lib/cn';
import { Lightbulb } from 'lucide-react';
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

/* ============== 문항 카드 ============== */
function QuestionEditCard({ essayId, q, index }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    question: q.question ?? '',
    response: q.response ?? '',
    maxLength: q.maxLength ?? 800,
  });
  const [reqInput, setReqInput] = useState('');
  const [altDraft, setAltDraft] = useState('');

  // 편집 모드의 경험 재추천/재선택 상태.
  //  - selectedIds: 현재 선택된 경험 ID. 처음 진입 시 q.relatedExperiences 로 초기화.
  //  - recommendations: null = 추천 전 / [items] = 추천 응답.
  //  - expDraftCandidate: 경험 기반 재생성 결과 후보. 사용자가 적용/버리기 결정.
  const [selectedIds, setSelectedIds] = useState(
    () => new Set((q.relatedExperiences ?? []).map((e) => e.experienceId))
  );
  const [recommendations, setRecommendations] = useState(null);
  const [expDraftCandidate, setExpDraftCandidate] = useState('');

  const update = useUpdateEssayQuestion();
  const regen = useRegenerateAnswer();
  const recommend = useRecommendExperiences();
  const generate = useGenerateAnswer();

  useEffect(() => {
    if (editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft({
        question: q.question ?? '',
        response: q.response ?? '',
        maxLength: q.maxLength ?? 800,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIds(
        new Set((q.relatedExperiences ?? []).map((e) => e.experienceId))
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecommendations(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpDraftCandidate('');
    }
  }, [editing, q]);

  const apply = () => {
    const relatedExperience = Array.from(selectedIds).map((id) => ({
      experienceId: id,
    }));
    update.mutate(
      {
        essayId,
        questionId: q.questionId,
        body: { ...draft, relatedExperience },
      },
      {
        onSuccess: () => {
          toast.success('문항을 저장했어요.');
          setEditing(false);
        },
        onError: (e) => toast.error(e?.apiMessage || '저장에 실패했어요.'),
      }
    );
  };

  /* ----- 편집 모드 — 경험 재추천 / 재선택 / 재생성 ----- */
  const onRecommend = async () => {
    const questionText = draft.question.trim();
    if (!questionText) {
      toast.error('문항이 비어 있어요.');
      return;
    }
    try {
      const data = await recommend.mutateAsync({ question: questionText });
      const list = data?.relatedExperience ?? [];
      setRecommendations(list);
      // 추천 결과가 비어 있는 케이스는 현재 선택 유지. 있으면 top 2 로 자동 갱신.
      if (list.length > 0) {
        setSelectedIds(new Set(list.slice(0, 2).map((e) => e.experienceId)));
      }
      setExpDraftCandidate('');
    } catch (e) {
      toast.error(e?.apiMessage || '경험 추천에 실패했어요.');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= 2) {
        toast.error('경험은 최대 2개까지 선택할 수 있어요.');
        return s;
      }
      next.add(id);
      return next;
    });
  };

  // 백엔드 generate 는 question.getExperiences() 를 DB 에서 읽으므로,
  // PATCH 로 question/relatedExperience 를 sync 한 뒤 generate 호출.
  const onRegenerateByExperiences = async () => {
    if (selectedIds.size < 1 || selectedIds.size > 2) {
      toast.error('경험을 1~2개 선택해주세요.');
      return;
    }
    const relatedExperience = Array.from(selectedIds).map((id) => ({
      experienceId: id,
    }));
    try {
      await update.mutateAsync({
        essayId,
        questionId: q.questionId,
        body: { ...draft, relatedExperience },
      });
      const gen = await generate.mutateAsync({
        essayId,
        questionId: q.questionId,
      });
      setExpDraftCandidate(gen?.response ?? '');
    } catch (e) {
      toast.error(e?.apiMessage || '재생성에 실패했어요.');
    }
  };

  const onAcceptExpDraft = () => {
    setDraft((d) => ({ ...d, response: expDraftCandidate }));
    setExpDraftCandidate('');
  };

  const busyRegenByExp = update.isPending || generate.isPending;

  const regenerate = () => {
    regen.mutate(
      {
        essayId,
        questionId: q.questionId,
        currentResponse: q.response ?? '',
        questionReq: reqInput,
      },
      {
        onSuccess: (data) => setAltDraft(data?.response ?? ''),
        onError: (e) => toast.error(e?.apiMessage || 'AI 재생성에 실패했어요.'),
      }
    );
  };

  if (!editing) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-900 text-white grid place-items-center text-[11px] font-bold">
              Q{q.questionNum ?? index + 1}
            </span>
            <span className="text-[11px] text-ink-500 font-semibold">
              {q.maxLength}자 이내
            </span>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-ink-500 hover:text-primary-700 inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1"
          >
            <Pencil size={12} /> 수정하기
          </button>
        </div>

        <div className="text-[14.5px] font-bold text-ink-900 leading-relaxed mb-3">
          {q.question || (
            <span className="text-ink-400 italic font-normal">
              문항이 비어 있습니다.
            </span>
          )}
        </div>

        {q.response ? (
          <div className="text-[13.5px] leading-[1.75] text-ink-800 whitespace-pre-wrap break-keep">
            {q.response}
          </div>
        ) : (
          <div className="text-[12.5px] text-ink-400 italic">
            아직 작성된 답변이 없습니다.
          </div>
        )}
        {q.response && (
          <div className="text-right text-[11.5px] text-ink-500 font-mono mt-2">
            {q.response.length} / {q.maxLength}
          </div>
        )}

        <UsedExperiences items={q.relatedExperiences} />

        <RegenBlock
          reqInput={reqInput}
          setReqInput={setReqInput}
          altDraft={altDraft}
          setAltDraft={setAltDraft}
          busy={regen.isPending}
          regenerate={regenerate}
          onAccept={() => {
            update.mutate(
              {
                essayId,
                questionId: q.questionId,
                body: {
                  question: q.question,
                  response: altDraft,
                  maxLength: q.maxLength,
                },
              },
              {
                onSuccess: () => {
                  toast.success('새 답변을 저장했어요.');
                  setAltDraft('');
                  setReqInput('');
                },
                onError: (e) =>
                  toast.error(e?.apiMessage || '저장에 실패했어요.'),
              }
            );
          }}
          limit={q.maxLength}
        />
      </Card>
    );
  }

  return (
    <Card className="border-primary-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary-900 text-white grid place-items-center text-[11px] font-bold">
            Q{q.questionNum ?? index + 1}
          </span>
          <span className="text-[11px] text-primary-800 font-bold uppercase tracking-wider">
            수정 중
          </span>
        </div>
      </div>

      <FieldInput label="문항">
        <textarea
          className="field min-h-[68px]"
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
          className="field min-h-[180px] leading-relaxed"
          value={draft.response}
          onChange={(e) => setDraft({ ...draft, response: e.target.value })}
        />
        <div className="text-right text-[11.5px] text-ink-500 font-mono mt-1">
          {draft.response.length} / {draft.maxLength}
        </div>
      </FieldInput>

      <ExperienceEditBlock
        currentExperiences={q.relatedExperiences}
        recommendations={recommendations}
        selectedIds={selectedIds}
        onRecommend={onRecommend}
        toggleSelect={toggleSelect}
        recommending={recommend.isPending}
        onRegenerate={onRegenerateByExperiences}
        regenerating={busyRegenByExp}
        candidate={expDraftCandidate}
        onAccept={onAcceptExpDraft}
        onDiscard={() => setExpDraftCandidate('')}
        maxLength={draft.maxLength}
      />

      <div className="flex justify-end gap-2 pt-3 border-t border-ink-150 mt-2">
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

/**
 * 편집 모드 — 경험 재추천/재선택 + 그 선택으로 답변 재생성.
 *  - 추천 전: 현재 사용 중인 경험을 UsedExperiences 로 표시.
 *  - 추천 후: 체크박스 리스트 (선택은 1~2 개). top 2 가 자동 체크된 상태로 시작.
 *  - 재생성: 백엔드 generate 는 question.experiences 를 DB 에서 읽으므로
 *    같은 questionId 에 PATCH 로 sync 한 뒤 generate. 새 문항을 만들지 않음.
 *  - 후보 패널: 적용하면 draft.response 교체. 외부 "적용하기" 누를 때 PATCH 한 번 더 일어남
 *    (relatedExperience 는 이미 sync 됐으므로 같은 값으로 idempotent — 중복 문항 X).
 */
function ExperienceEditBlock({
  currentExperiences,
  recommendations,
  selectedIds,
  onRecommend,
  toggleSelect,
  recommending,
  onRegenerate,
  regenerating,
  candidate,
  onAccept,
  onDiscard,
  maxLength,
}) {
  const hasRecs = recommendations !== null;
  const selValid = selectedIds.size >= 1 && selectedIds.size <= 2;

  return (
    <div className="mt-4 pt-4 border-t border-dashed border-ink-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Lightbulb size={13} className="text-primary-700" />
          <span className="text-[12px] font-bold text-ink-800">
            사용한 경험
          </span>
        </div>
        <Button onClick={onRecommend} disabled={recommending}>
          {recommending ? (
            '추천 중…'
          ) : (
            <>
              <Lightbulb size={13} /> {hasRecs ? '다시 추천받기' : '경험 다시 추천받기'}
            </>
          )}
        </Button>
      </div>

      {!hasRecs ? (
        currentExperiences && currentExperiences.length > 0 ? (
          <UsedExperiences items={currentExperiences} />
        ) : (
          <div className="text-[12.5px] text-ink-500 leading-relaxed border border-dashed border-ink-200 rounded-md px-3 py-3 text-center">
            아직 연결된 경험이 없어요. [경험 다시 추천받기] 를 눌러보세요.
          </div>
        )
      ) : recommendations.length === 0 ? (
        <div className="text-[12.5px] text-ink-500 leading-relaxed border border-dashed border-ink-200 rounded-md px-3 py-4 text-center">
          추천할 수 있는 경험이 없어요. 먼저 경험을 등록해주세요.
        </div>
      ) : (
        <>
          <div className="max-h-[260px] overflow-y-auto rounded-md border border-ink-200 divide-y divide-ink-150">
            {recommendations.map((exp, i) => {
              const checked = selectedIds.has(exp.experienceId);
              const recommended = i < 2;
              return (
                <button
                  type="button"
                  key={exp.experienceId}
                  onClick={() => toggleSelect(exp.experienceId)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                    checked ? 'bg-primary-50' : 'hover:bg-ink-50'
                  )}
                >
                  <span
                    className={cn(
                      'w-4 h-4 rounded border grid place-items-center shrink-0',
                      checked
                        ? 'bg-primary-700 border-primary-700 text-white'
                        : 'border-ink-300 bg-white'
                    )}
                  >
                    {checked && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold text-ink-900 truncate">
                      {exp.experienceTitle}
                    </span>
                    <span className="block text-[11px] text-ink-500 mt-0.5">
                      유사도 {(Number(exp.similarity ?? 0) * 100).toFixed(0)}%
                    </span>
                  </span>
                  {recommended && (
                    <span className="text-[10.5px] font-bold text-primary-700 bg-primary-100 rounded px-1.5 py-0.5">
                      추천
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end mt-2">
            <Button
              variant="primary"
              onClick={onRegenerate}
              disabled={!selValid || regenerating}
            >
              {regenerating ? (
                '생성 중…'
              ) : (
                <>
                  <Sparkles size={13} /> 선택한 경험으로 답변 재생성
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {candidate && (
        <div className="mt-3 rounded-md bg-primary-50/40 border border-primary-50 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-bold text-primary-800">
              새 답변 후보 (경험 기반)
            </span>
          </div>
          <div className="text-[13px] leading-relaxed text-ink-900 whitespace-pre-wrap bg-paper rounded p-3 border border-ink-150 break-keep">
            {candidate}
          </div>
          <div className="text-right text-[11.5px] text-ink-500 font-mono mt-1">
            {candidate.length} / {maxLength}
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={onDiscard}>버리기</Button>
            <Button variant="primary" onClick={onAccept}>
              <Check size={13} /> 이 답변 적용하기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RegenBlock({
  reqInput,
  setReqInput,
  altDraft,
  setAltDraft,
  busy,
  regenerate,
  onAccept,
  limit,
}) {
  return (
    <div className="mt-4 pt-4 border-t border-dashed border-ink-200">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={13} className="text-primary-700" />
        <span className="text-[12px] font-bold text-ink-800">
          AI 응답 재생성
        </span>
      </div>

      <div className="flex items-stretch gap-2">
        <input
          className="field flex-1"
          placeholder="요구사항을 입력하세요. (예: 더 짧게, 결론 먼저)"
          value={reqInput}
          onChange={(e) => setReqInput(e.target.value)}
        />
        <Button variant="primary" disabled={busy} onClick={regenerate}>
          {busy ? (
            '생성 중…'
          ) : (
            <>
              <Sparkles size={13} /> 다시 생성
            </>
          )}
        </Button>
      </div>

      {altDraft && (
        <div className="mt-3 rounded-md bg-primary-50/40 border border-primary-50 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-bold text-primary-800">
              새 답변 후보
            </span>
          </div>
          <textarea
            className="field min-h-[160px] leading-relaxed bg-paper"
            value={altDraft}
            onChange={(e) => setAltDraft(e.target.value)}
          />
          <div className="text-right text-[11.5px] text-ink-500 font-mono mt-1">
            {altDraft.length} / {limit}
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={() => setAltDraft('')}>버리기</Button>
            <Button variant="primary" onClick={onAccept}>
              <Check size={13} /> 이 답변 적용하기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
