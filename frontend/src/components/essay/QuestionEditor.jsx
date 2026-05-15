import { useMemo, useState } from 'react';
import {
  Sparkles,
  Check,
  Wand2,
  RotateCcw,
  Lightbulb,
  PencilLine,
  ClipboardCheck,
  X,
} from 'lucide-react';
import { Card } from '../Card';
import Button from '../Button';
import {
  useCreateEssayQuestion,
  useUpdateEssayQuestion,
  useGenerateAnswer,
  useRegenerateAnswer,
  useRecommendExperiences,
} from '../../api/queries/useEssays';
import { toast } from '../../store/useToast';
import { cn } from '../../lib/cn';

/* ------------------------------------------------------------------ *
 * 자소서 문항 작성 에디터 — 자소서 작성/수정 페이지에서 공용으로 사용.
 *
 *  3 섹션 순차 활성화 (DB POST 는 ③ 까지 도달해야 발생):
 *   ① 문항 입력                — 로컬 state. DB 호출 없음.
 *   ② 경험 추천/선택           → POST /essays/recommend (DB 변경 없음, top 2 자동 선택, ≤2)
 *                                다른 문항에 쓴 경험은 usedExperienceIds 로 제외
 *   ③ 초안 생성/저장          [초안 생성] = POST /essays/{id}/questions + POST /essays/generate
 *                                                  └ 첫 클릭에서만 POST, 이후는 PATCH
 *                                다시 생성: POST /essays/regenerate (기존/신규 비교)
 *                                저장: PATCH /essays/{id}/questions/{qid} (response 확정)
 *
 *  → 사용자가 ③ 까지 도달해야 백엔드에 question 레코드가 생기므로,
 *    문항 입력 / 추천 단계에서 이탈할 경우 orphan 이 남지 않음.
 *
 *  Props:
 *   - essayId            (required) 부모가 essay 생성 후 가지고 있는 ID
 *   - nextNum            (required) 표시용 문항 번호 (Q1, Q2 ...)
 *   - usedExperienceIds  (Set)      추천 결과에서 제외할 경험 ID 들
 *   - onSaved            (q) => void  저장 완료된 문항 데이터 콜백
 *   - onCancel           () => void   (옵션) — 우상단 X 버튼 노출. EssayEdit 의
 *                                     "새 문항 추가" 같이 접을 수 있는 컨텍스트용.
 *
 *  타이핑·체크박스 onChange 에서는 절대 API 호출 안 함 — 모든 fetch 는 명시적 버튼.
 * ------------------------------------------------------------------ */

/**
 * "문항 등록" 시점에 POST 로 함께 보내는 임시 response.
 * 백엔드 `@NotBlank` 제약 때문에 빈 문자열이 안 되어서 sentinel 로 사용.
 * EssayEdit 의 기존 문항 리스트에서 이 값으로 등록 중인 placeholder 문항을 필터링.
 */
export const PLACEHOLDER_RESPONSE = '(작성중)';

export default function QuestionEditor({
  essayId,
  nextNum,
  usedExperienceIds = new Set(),
  onSaved,
  onCancel,
}) {
  // Section 1 — 문항 입력 & 등록
  const [questionText, setQuestionText] = useState('');
  const [maxLength, setMaxLength] = useState(800);
  const [questionId, setQuestionId] = useState(null); // 문항 등록 완료 시 set

  // Section 2 — 추천 & 선택
  // null = 아직 추천 요청 전 / [items] = 추천 응답
  const [recommendations, setRecommendations] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // Section 3 — 초안 생성/저장
  const [draftResponse, setDraftResponse] = useState('');
  const [questionReq, setQuestionReq] = useState('');
  // 재생성 직후 기존/신규 비교 뷰. null 이면 일반 편집 뷰.
  const [compareDraft, setCompareDraft] = useState(null);

  const createQuestion = useCreateEssayQuestion();
  const updateQuestion = useUpdateEssayQuestion();
  const recommend = useRecommendExperiences();
  const generate = useGenerateAnswer();
  const regenerate = useRegenerateAnswer();

  const filteredRecommendations = useMemo(() => {
    if (!recommendations) return [];
    return recommendations.filter(
      (e) => !usedExperienceIds.has(e.experienceId)
    );
  }, [recommendations, usedExperienceIds]);

  // ② 추천 단계: 문항이 입력돼야 [경험 추천] 활성.
  const section2Active = !!questionText.trim();
  // ③ 초안 생성 단계: 경험이 1~2 개 선택돼야 활성.
  const section3Active = selectedIds.size >= 1 && selectedIds.size <= 2;

  /* ---------- handlers ---------- */

  const onRecommend = async () => {
    if (!questionText.trim()) {
      toast.error('먼저 문항을 입력해주세요.');
      return;
    }
    try {
      const data = await recommend.mutateAsync({
        question: questionText.trim(),
      });
      const list = data?.relatedExperience ?? [];
      setRecommendations(list);
      const available = list.filter(
        (e) => !usedExperienceIds.has(e.experienceId)
      );
      setSelectedIds(
        new Set(available.slice(0, 2).map((e) => e.experienceId))
      );
      setDraftResponse('');
      setCompareDraft(null);
      setQuestionReq('');
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

  // [초안 생성] — 첫 클릭에서는 POST 로 문항을 등록(questionId 확보) + generate.
  // 두 번째 이후 클릭(경험을 바꿔서 재생성하는 케이스): PATCH 로 동기화 + generate.
  // backend generate 는 question.getExperiences() 를 DB 에서 읽으므로 선행 sync 필수.
  const onGenerate = async () => {
    if (!section3Active) {
      toast.error('경험을 1~2개 선택해주세요.');
      return;
    }
    const relatedExperience = Array.from(selectedIds).map((id) => ({
      experienceId: id,
    }));
    try {
      let qid = questionId;
      if (!qid) {
        const created = await createQuestion.mutateAsync({
          essayId,
          body: {
            questionNum: nextNum,
            question: questionText.trim(),
            response: PLACEHOLDER_RESPONSE,
            maxLength,
            relatedExperience,
          },
        });
        qid = created?.questionId;
        if (!qid) {
          toast.error('문항 ID를 받지 못했어요. 다시 시도해주세요.');
          return;
        }
        setQuestionId(qid);
      } else {
        await updateQuestion.mutateAsync({
          essayId,
          questionId: qid,
          body: {
            question: questionText.trim(),
            response: draftResponse || PLACEHOLDER_RESPONSE,
            maxLength,
            relatedExperience,
          },
        });
      }
      const gen = await generate.mutateAsync({ essayId, questionId: qid });
      setDraftResponse(gen?.response ?? '');
      setCompareDraft(null);
      setQuestionReq('');
    } catch (e) {
      toast.error(e?.apiMessage || '초안 생성에 실패했어요.');
    }
  };

  const onRegenerate = async () => {
    if (!questionReq.trim()) {
      toast.error('추가 요구사항을 입력해주세요.');
      return;
    }
    try {
      const gen = await regenerate.mutateAsync({
        essayId,
        questionId,
        currentResponse: draftResponse,
        questionReq: questionReq.trim(),
      });
      setCompareDraft({
        oldResponse: draftResponse,
        newResponse: gen?.response ?? '',
      });
    } catch (e) {
      toast.error(e?.apiMessage || '재생성에 실패했어요.');
    }
  };

  const pickDraft = (which) => {
    if (which === 'new' && compareDraft) {
      setDraftResponse(compareDraft.newResponse);
    }
    setCompareDraft(null);
    setQuestionReq('');
  };

  const onSave = async () => {
    if (!questionId) {
      toast.error('먼저 초안을 생성해주세요.');
      return;
    }
    if (!draftResponse.trim()) {
      toast.error('답변이 비어 있어요.');
      return;
    }
    const relatedExperience = Array.from(selectedIds).map((id) => ({
      experienceId: id,
    }));
    try {
      await updateQuestion.mutateAsync({
        essayId,
        questionId,
        body: {
          question: questionText.trim(),
          response: draftResponse,
          maxLength,
          relatedExperience,
        },
      });
      toast.success(`Q${nextNum} 저장 완료.`);
      onSaved({
        questionId,
        questionNum: nextNum,
        question: questionText.trim(),
        response: draftResponse,
        maxLength,
        relatedExperience,
      });
    } catch (e) {
      toast.error(e?.apiMessage || '문항 저장에 실패했어요.');
    }
  };

  const busyGenerate =
    createQuestion.isPending || updateQuestion.isPending || generate.isPending;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary-900 text-white grid place-items-center text-[11px] font-bold">
            Q{nextNum}
          </span>
          <span className="text-[13px] font-bold text-ink-900">
            새 문항 작성
          </span>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-ink-400 hover:text-red-500 transition-colors p-1"
            title="작성 취소"
            aria-label="작성 취소"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ───── Section 1: 문항 입력 ───── */}
      <Section
        n={1}
        title="문항 입력"
        sub={
          questionId
            ? '초안이 생성된 이후엔 문항을 수정할 수 없어요.'
            : '자소서 문항을 그대로 붙여넣어 주세요.'
        }
      >
        <textarea
          className="field min-h-[80px]"
          placeholder="예: 본인이 가장 도전적으로 임했던 경험과 그 결과를 서술해주세요."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          disabled={!!questionId}
        />
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11.5px] text-ink-500">글자 제한</span>
          <input
            type="number"
            className="field max-w-[110px] py-1 text-[12px]"
            value={maxLength}
            min={100}
            step={100}
            onChange={(e) => setMaxLength(Number(e.target.value) || 0)}
            disabled={!!questionId}
          />
          <span className="text-[11.5px] text-ink-500">자</span>
          {questionId && (
            <>
              <div className="flex-1" />
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-md px-2.5 py-1">
                <ClipboardCheck size={13} /> 문항 잠금
              </span>
            </>
          )}
        </div>
      </Section>

      {/* ───── Section 2: 경험 추천 + 선택 ───── */}
      <Section
        n={2}
        title="경험 선택"
        sub="[경험 추천]을 누르면 LLM 이 가장 적합한 경험을 골라줘요. 최대 2개까지 선택할 수 있어요."
        disabled={!section2Active}
      >
        <div className="flex justify-end mb-2">
          <Button
            onClick={onRecommend}
            disabled={!section2Active || recommend.isPending}
          >
            {recommend.isPending ? (
              '추천 중…'
            ) : (
              <>
                <Lightbulb size={13} />{' '}
                {recommendations ? '다시 추천받기' : '경험 추천'}
              </>
            )}
          </Button>
        </div>

        {recommendations !== null &&
          (filteredRecommendations.length === 0 ? (
            <div className="text-[12.5px] text-ink-500 leading-relaxed border border-dashed border-ink-200 rounded-md px-3 py-4 text-center">
              추천할 수 있는 경험이 없어요. 먼저 경험을 등록하거나, 다른 문항에
              이미 사용한 경험을 제외한 결과예요.
            </div>
          ) : (
            <div className="max-h-[260px] overflow-y-auto rounded-md border border-ink-200 divide-y divide-ink-150">
              {filteredRecommendations.map((exp, i) => {
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
          ))}
      </Section>

      {/* ───── Section 3: 초안 생성/저장 ───── */}
      <Section
        n={3}
        title="초안 생성"
        sub="선택한 경험·문항·공통 요구사항을 종합해 AI 가 초안을 만들어요."
        disabled={!section3Active}
      >
        {!draftResponse ? (
          <Button
            variant="primary"
            onClick={onGenerate}
            disabled={!section3Active || busyGenerate}
          >
            {busyGenerate ? (
              'AI 생성 중…'
            ) : (
              <>
                <Sparkles size={13} /> 초안 생성
              </>
            )}
          </Button>
        ) : compareDraft ? (
          <CompareDrafts
            oldResponse={compareDraft.oldResponse}
            newResponse={compareDraft.newResponse}
            maxLength={maxLength}
            onPick={pickDraft}
          />
        ) : (
          <>
            <textarea
              className="field min-h-[180px] leading-relaxed"
              value={draftResponse}
              onChange={(e) => setDraftResponse(e.target.value)}
            />
            <div className="text-right text-[11.5px] text-ink-500 font-mono mt-1">
              {draftResponse.length} / {maxLength}
            </div>

            <div className="mt-4 pt-3 border-t border-ink-150">
              <div className="text-[12px] font-semibold text-ink-700 mb-1.5">
                다시 생성하기 — 추가 요구사항
              </div>
              <textarea
                className="field min-h-[60px]"
                placeholder="예: 결과 수치를 더 강조해주세요 / 문체를 더 차분하게."
                value={questionReq}
                onChange={(e) => setQuestionReq(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  onClick={onRegenerate}
                  disabled={!questionReq.trim() || regenerate.isPending}
                >
                  {regenerate.isPending ? (
                    '재생성 중…'
                  ) : (
                    <>
                      <RotateCcw size={13} /> 다시 생성하기
                    </>
                  )}
                </Button>
                <Button
                  variant="primary"
                  onClick={onSave}
                  disabled={updateQuestion.isPending || !draftResponse.trim()}
                >
                  {updateQuestion.isPending ? (
                    '저장 중…'
                  ) : (
                    <>
                      <PencilLine size={13} /> 저장하기
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </Section>
    </Card>
  );
}

/* -------- 재생성 비교 뷰 -------- */
function CompareDrafts({ oldResponse, newResponse, maxLength, onPick }) {
  return (
    <div>
      <div className="text-[12px] text-ink-600 mb-2 leading-relaxed">
        기존 초안과 새 초안을 비교한 후, 적용할 버전을 선택해주세요.
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <DraftCompareCard
          label="기존 초안"
          body={oldResponse}
          maxLength={maxLength}
          onPick={() => onPick('old')}
        />
        <DraftCompareCard
          label="새 초안"
          body={newResponse}
          maxLength={maxLength}
          onPick={() => onPick('new')}
          accent
        />
      </div>
    </div>
  );
}

function DraftCompareCard({ label, body, maxLength, onPick, accent = false }) {
  return (
    <div
      className={cn(
        'rounded-md border p-3 flex flex-col',
        accent ? 'border-primary-300 bg-primary-50/30' : 'border-ink-200'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            'text-[12px] font-bold',
            accent ? 'text-primary-800' : 'text-ink-700'
          )}
        >
          {label}
        </span>
        <span className="text-[11px] text-ink-500 font-mono">
          {body.length} / {maxLength}
        </span>
      </div>
      <div className="text-[12.5px] text-ink-900 whitespace-pre-line leading-relaxed mb-3 break-keep">
        {body}
      </div>
      <div className="mt-auto flex justify-end">
        <Button variant={accent ? 'primary' : 'default'} onClick={onPick}>
          <Wand2 size={13} /> 이 버전 적용
        </Button>
      </div>
    </div>
  );
}

function Section({ n, title, sub, disabled = false, children }) {
  return (
    <div
      className={cn(
        'mt-4 pt-4 border-t border-ink-150 first:mt-0 first:pt-0 first:border-t-0',
        disabled && 'opacity-50 pointer-events-none'
      )}
      aria-disabled={disabled}
    >
      <div className="flex items-start gap-2 mb-2.5">
        <span className="w-5 h-5 rounded-full bg-ink-100 text-ink-700 grid place-items-center text-[10.5px] font-bold mt-0.5">
          {n}
        </span>
        <div>
          <div className="text-[13px] font-bold text-ink-900">{title}</div>
          {sub && (
            <div className="text-[11.5px] text-ink-500 mt-0.5 leading-relaxed">
              {sub}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}