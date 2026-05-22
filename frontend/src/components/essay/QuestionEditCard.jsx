import { useEffect, useState } from 'react';
import { Pencil, Sparkles, Check, Lightbulb } from 'lucide-react';
import { Card } from '../Card';
import Button from '../Button';
import UsedExperiences from './UsedExperiences';
import {
  useUpdateEssayQuestion,
  useRegenerateAnswer,
  useRecommendExperiences,
  useGenerateAnswer,
} from '@/api/queries/useEssays';
import { toast } from '@/store/useToast';
import { cn } from '@/lib/cn';

/* ------------------------------------------------------------------ *
 * 저장된 문항 카드 (열람/편집 토글) — 자소서 수정 페이지(EssayEdit) 와
 * 자소서 작성 페이지(Write step 2) 양쪽에서 공용.
 *
 * 안전 보장:
 *  - 편집은 항상 기존 `q.questionId` 에 대한 PATCH 만 발생. POST 경로 없음
 *    → 중복 문항 생성 불가능.
 *  - 경험 기반 재생성도 PATCH(sync) → POST /essays/generate 순. 같은 questionId
 *    재사용이라 idempotent.
 *
 * Props:
 *  - essayId       (required)
 *  - q             (required) — 백엔드 GET /essays/:id 의 question 형태 또는 enrich 된 동일 shape.
 *                  표시용 사용한 경험은 `q.relatedExperiences` (plural, full info).
 *  - index         리스트 내 위치 — 번호 표시(`Q{n}`) 용 (questionNum 우선).
 *  - onUpdated?    (updatedQ) => void  PATCH 성공 시 로컬 캐시 갱신용 콜백.
 *                  EssayEdit 는 useEssay 쿼리 invalidate 로 알아서 갱신되므로 미사용,
 *                  Write 는 로컬 savedQuestions 상태라 이 콜백으로 교체.
 * ------------------------------------------------------------------ */
export default function QuestionEditCard({
  essayId,
  q,
  index,
  onUpdated,
}) {
  const [editing, setEditing] = useState(false);
  // maxLength 는 string 으로 보관 — backspace 로 다 지웠을 때 0 이 박혀 다시 못 지우는 현상 방지.
  // API 전송/표시 시점엔 maxLengthNum 으로 파싱 (빈/0/음수면 fallback 1000).
  const [draft, setDraft] = useState({
    question: q.question ?? '',
    response: q.response ?? '',
    maxLength: String(q.maxLength ?? 1000),
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

  // 글자 제한 — 입력 string 을 number 로 정규화. 빈 값/0/음수 면 1000 fallback.
  const parsedMaxLen = Number(draft.maxLength);
  const maxLengthNum =
    Number.isFinite(parsedMaxLen) && parsedMaxLen > 0 ? parsedMaxLen : 1000;

  useEffect(() => {
    if (editing) {
      // q 가 바뀌면 draft 를 초기화 — 동기 setState 의도된 cascade.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft({
        question: q.question ?? '',
        response: q.response ?? '',
        maxLength: String(q.maxLength ?? 1000),
      });
      setSelectedIds(
        new Set((q.relatedExperiences ?? []).map((e) => e.experienceId))
      );
      setRecommendations(null);
      setExpDraftCandidate('');
      // view 모드에서 띄워 둔 regen 입력/결과는 편집 진입 시 초기화 — 흐름 분리.
      setReqInput('');
      setAltDraft('');
    }
  }, [editing, q]);

  // PATCH 성공 후 부모(Write) 가 로컬 state 를 갱신할 수 있도록 enrich 된 q 를 콜백으로 전달.
  // EssayEdit 는 onUpdated 미전달 — useEssay 쿼리 캐시 invalidate 로 알아서 갱신.
  const notifyUpdated = (newDraft, newSelectedIds) => {
    if (!onUpdated) return;
    const idsArr = Array.from(newSelectedIds);
    // recommendations 에서 title/category 를 우선 끌어오고, 없으면 현재 q.relatedExperiences 에서 lookup.
    const recMap = new Map();
    for (const r of recommendations ?? []) recMap.set(r.experienceId, r);
    const oldMap = new Map();
    for (const r of q.relatedExperiences ?? []) oldMap.set(r.experienceId, r);
    const enriched = idsArr.map((id) => {
      const fromRec = recMap.get(id);
      const fromOld = oldMap.get(id);
      return {
        experienceId: id,
        experienceTitle:
          fromOld?.experienceTitle ?? fromRec?.experienceTitle ?? '',
        experienceCategory:
          fromOld?.experienceCategory ?? fromRec?.experienceCategory ?? null,
      };
    });
    // newDraft.maxLength 는 string 일 수 있음 — 부모 캐시는 number 로 통일.
    const normalizedMaxLen =
      typeof newDraft.maxLength === 'string'
        ? Number(newDraft.maxLength) || 1000
        : (newDraft.maxLength ?? 1000);
    onUpdated({
      ...q,
      ...newDraft,
      maxLength: normalizedMaxLen,
      relatedExperiences: enriched,
    });
  };

  const apply = () => {
    const relatedExperience = Array.from(selectedIds).map((id) => ({
      experienceId: id,
    }));
    update.mutate(
      {
        essayId,
        questionId: q.questionId,
        body: { ...draft, maxLength: maxLengthNum, relatedExperience },
      },
      {
        onSuccess: () => {
          toast.success('문항을 저장했어요.');
          notifyUpdated(draft, selectedIds);
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
        body: { ...draft, maxLength: maxLengthNum, relatedExperience },
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

  // view 모드 — DB 의 저장된 답변(q.response) 기준으로 재생성. accept 시 곧장 PATCH.
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

  // edit 모드 — 사용자가 편집 중인 draft.response 기준으로 재생성. accept 시 draft 만 갱신,
  // PATCH 는 외부 "적용하기" 버튼이 한 번 묶어서 처리 — 중복 PATCH 방지.
  const regenerateInEdit = () => {
    if (!reqInput.trim()) {
      toast.error('추가 요구사항을 입력해주세요.');
      return;
    }
    regen.mutate(
      {
        essayId,
        questionId: q.questionId,
        currentResponse: draft.response,
        questionReq: reqInput,
      },
      {
        onSuccess: (data) => setAltDraft(data?.response ?? ''),
        onError: (e) => toast.error(e?.apiMessage || 'AI 재생성에 실패했어요.'),
      }
    );
  };

  const onAcceptRegenInEdit = () => {
    setDraft((d) => ({ ...d, response: altDraft }));
    setAltDraft('');
    setReqInput('');
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
                  notifyUpdated(
                    {
                      question: q.question,
                      response: altDraft,
                      maxLength: q.maxLength,
                    },
                    selectedIds
                  );
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
              setDraft({ ...draft, maxLength: e.target.value })
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
          {draft.response.length} / {maxLengthNum}
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
        maxLength={maxLengthNum}
      />

      <RegenBlock
        reqInput={reqInput}
        setReqInput={setReqInput}
        altDraft={altDraft}
        setAltDraft={setAltDraft}
        busy={regen.isPending}
        regenerate={regenerateInEdit}
        onAccept={onAcceptRegenInEdit}
        limit={maxLengthNum}
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