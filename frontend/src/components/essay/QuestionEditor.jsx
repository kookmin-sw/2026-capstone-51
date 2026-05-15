import { useMemo, useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Check,
  Trash2,
  Plus,
  X as XIcon,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import {
  useRecommendExperiences,
  useGenerateAnswer,
  useRegenerateAnswer,
  useCreateEssayQuestion,
  useUpdateEssayQuestion,
} from '../../api/queries/useEssays';
import { useExperiences } from '../../api/queries/useExperiences';
import { toast } from '../../store/useToast';

/**
 * 단일 자소서 문항 편집기. 자소서 작성 페이지의 핵심 UI.
 *
 * Props:
 *  - essayId: 부모(자소서) UUID
 *  - questionNum: 문항 번호 (1-base)
 *  - initialValue?: 기존 문항 (수정 모드일 때) — { questionId, question, response, maxLength, relatedExperience? }
 *  - onSaved(saved): 저장 완료 시 부모에 saved={ questionId, question, response, maxLength, relatedExperience } 전달
 *  - onRemove?: 삭제 콜백 (저장 안 된 카드만 — 백엔드 단건 DELETE 미지원)
 *
 * 흐름 (4/27 + 5/3 디자인):
 *  1. 질문 + 글자수(maxLength) 입력
 *  2. 질문 입력 완료 후 "추천 경험 받기" → POST /essays/recommend → 상위 2개 자동 활용
 *  3. "초안 생성" → POST /essays/generate (essayId + 임시 questionId 필요? — 아래 주의 사항)
 *  4. (옵션) 재생성 — 요구사항 textarea + "다시 생성" → POST /essays/regenerate
 *  5. "이 문항 저장" → POST /essays/:id/questions (신규) 또는 PATCH /essays/:id/questions/:qid (수정)
 *
 * ⚠️ 백엔드 의존 / 확인 필요 사항:
 *  - `/essays/generate` body 가 { essayId, questionId } 인데, **저장 전엔 questionId 가 없음**.
 *    swagger 만 보면 "문항 저장 → questionId 받음 → 그제야 generate 호출 가능"한 흐름. 이 경우 디자인의
 *    "질문 입력 → 초안 생성" 단계가 "문항 부분 저장 → 초안 생성" 으로 바뀜.
 *    구현은 일단 이 추정으로 진행 (response 빈 문자열 저장 → questionId 받음 → generate). 백엔드 협의 필요.
 *  - `EssayQuestionCreateRequest` 의 `response` 가 `minLength:1` (required) — 빈 문자열로 부분 저장 못함.
 *    초기 저장 시 placeholder 텍스트 "(작성 예정)" 같은 것 보내고, 이후 update 로 덮어쓰는 우회.
 *  - 추천 응답의 RelatedExperience 가 `{experienceId}` 만 swagger 에 있음. 노션 테스트 데이터엔
 *    `experienceTitle`, `similarity` 도 있음. 둘 다 처리하되 title 없으면 useExperiences 캐시에서 매칭.
 */
export default function QuestionEditor({
  essayId,
  questionNum,
  initialValue,
  onSaved,
  onRemove,
}) {
  const isExisting = !!initialValue?.questionId;

  const [form, setForm] = useState(() => ({
    questionId: initialValue?.questionId ?? null,
    question: initialValue?.question ?? '',
    response: initialValue?.response ?? '',
    maxLength: initialValue?.maxLength ?? 500,
    relatedExperience: initialValue?.relatedExperience ?? [],
  }));
  const [regenReq, setRegenReq] = useState('');

  const recommend = useRecommendExperiences();
  const generate = useGenerateAnswer();
  const regenerate = useRegenerateAnswer();
  const createQuestion = useCreateEssayQuestion();
  const updateQuestion = useUpdateEssayQuestion();

  const expList = useExperiences();
  const expById = useMemo(() => {
    const m = new Map();
    (expList.data || []).forEach((e) => m.set(e.experienceId, e));
    return m;
  }, [expList.data]);

  // 추천 결과 캐시 — relatedExperience 외 더 많은 후보를 노출하기 위해 따로 보관
  const [recommendedAll, setRecommendedAll] = useState(null);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const enrichRel = (rel) => {
    // swagger 는 experienceId 만 보장. title/similarity/reason 이 같이 오면 사용, 없으면 캐시에서 매칭.
    // reason: 백엔드가 추천 근거 텍스트를 보내주는 경우 노출. 응답 키 후보(reason / recommendReason / why) 모두 받음.
    const fromCache = expById.get(rel.experienceId);
    return {
      experienceId: rel.experienceId,
      title: rel.experienceTitle || fromCache?.experienceTitle || '(제목 없음)',
      similarity: rel.similarity ?? null,
      reason: rel.reason || rel.recommendReason || rel.why || null,
    };
  };

  const handleRecommend = () => {
    if (!form.question.trim()) {
      toast.error('문항을 먼저 입력해주세요.');
      return;
    }
    recommend.mutate(
      { question: form.question.trim() },
      {
        onSuccess: (data) => {
          const list = (data?.relatedExperience || []).map(enrichRel);
          setRecommendedAll(list);
          // 4/27 디자인: 상위 2개 자동 활용
          update(
            'relatedExperience',
            list.slice(0, 2).map((r) => ({ experienceId: r.experienceId }))
          );
        },
        onError: (e) => {
          toast.error(
            e?.apiMessage || '추천을 가져오지 못했습니다. 다시 시도해주세요.'
          );
        },
      }
    );
  };

  const toggleRelated = (experienceId) => {
    const cur = form.relatedExperience;
    const exists = cur.some((r) => r.experienceId === experienceId);
    if (exists) {
      update(
        'relatedExperience',
        cur.filter((r) => r.experienceId !== experienceId)
      );
    } else {
      // 4/27 디자인: 활용 경험 최대 2개
      if (cur.length >= 2) {
        toast.info('활용 경험은 최대 2개까지 선택할 수 있어요.');
        return;
      }
      update('relatedExperience', [...cur, { experienceId }]);
    }
  };

  /**
   * 초안 생성. 백엔드 generate 가 questionId 를 요구하므로 저장 안 된 카드는 먼저 placeholder 저장 후 호출.
   * 저장 안 된 카드(없는 questionId)에서 호출 시 자동으로 부분 저장 → questionId 받기 → generate.
   */
  const handleGenerate = async () => {
    if (!form.question.trim()) {
      toast.error('문항을 먼저 입력해주세요.');
      return;
    }
    let qid = form.questionId;
    if (!qid) {
      // 빈 응답으로 저장 시도 — `response` 가 minLength:1 이라 placeholder 임시값 보냄
      try {
        const r = await createQuestion.mutateAsync({
          essayId,
          body: {
            questionNum,
            question: form.question.trim(),
            response: '(작성 예정)',
            maxLength: form.maxLength,
            relatedExperience: form.relatedExperience,
          },
        });
        qid = r?.questionId;
        if (!qid) throw new Error('questionId 응답 누락');
        update('questionId', qid);
      } catch (e) {
        toast.error(
          e?.apiMessage || '문항 저장에 실패했습니다. 다시 시도해주세요.'
        );
        return;
      }
    }
    generate.mutate(
      { essayId, questionId: qid },
      {
        onSuccess: (data) => update('response', data?.response || ''),
        onError: (e) => {
          toast.error(
            e?.apiMessage || '초안 생성에 실패했습니다. 다시 시도해주세요.'
          );
        },
      }
    );
  };

  const handleRegenerate = () => {
    if (!form.questionId) {
      toast.error('먼저 초안을 생성해주세요.');
      return;
    }
    if (!regenReq.trim()) {
      toast.error('어떻게 수정할지 입력해주세요.');
      return;
    }
    regenerate.mutate(
      {
        essayId,
        questionId: form.questionId,
        currentResponse: form.response || '',
        questionReq: regenReq.trim(),
      },
      {
        onSuccess: (data) => {
          if (data?.response) update('response', data.response);
          // 재생성 후 요구사항 칸은 비우지 않음 — 사용자가 추가 미세조정 가능 (4/27 디자인의 "요구사항 비우기" 별도 버튼)
        },
        onError: (e) => {
          toast.error(
            e?.apiMessage || '재생성에 실패했습니다. 다시 시도해주세요.'
          );
        },
      }
    );
  };

  const handleSave = () => {
    if (!form.question.trim()) {
      toast.error('문항을 입력해주세요.');
      return;
    }
    if (!form.response.trim()) {
      toast.error('답변을 입력해주세요.');
      return;
    }
    if (!form.maxLength || form.maxLength < 1) {
      toast.error('글자수를 입력해주세요.');
      return;
    }

    const body = {
      question: form.question.trim(),
      response: form.response.trim(),
      maxLength: form.maxLength,
      relatedExperience: form.relatedExperience,
    };

    if (form.questionId) {
      updateQuestion.mutate(
        { essayId, questionId: form.questionId, body },
        {
          onSuccess: () => {
            toast.success('문항이 저장되었습니다.');
            onSaved?.({ ...body, questionId: form.questionId });
          },
          onError: (e) => {
            toast.error(
              e?.apiMessage || '저장에 실패했습니다. 다시 시도해주세요.'
            );
          },
        }
      );
    } else {
      createQuestion.mutate(
        {
          essayId,
          body: { ...body, questionNum },
        },
        {
          onSuccess: (data) => {
            const qid = data?.questionId;
            if (qid) update('questionId', qid);
            toast.success('문항이 저장되었습니다.');
            onSaved?.({ ...body, questionNum, questionId: qid });
          },
          onError: (e) => {
            toast.error(
              e?.apiMessage || '저장에 실패했습니다. 다시 시도해주세요.'
            );
          },
        }
      );
    }
  };

  const isAnyPending =
    recommend.isPending ||
    generate.isPending ||
    regenerate.isPending ||
    createQuestion.isPending ||
    updateQuestion.isPending;

  return (
    <section className="card">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12px] font-bold text-primary-700 tracking-wide">
          문항 {questionNum}
          {isExisting && <span className="ml-1.5 badge-green">저장됨</span>}
        </div>
        {onRemove && !isExisting && (
          <button
            type="button"
            onClick={onRemove}
            disabled={isAnyPending}
            className="btn-ghost btn-sm !text-red-600 hover:!bg-red-50"
            aria-label="이 문항 카드 제거"
          >
            <Trash2 size={12} strokeWidth={2} />
            제거
          </button>
        )}
      </div>

      {/* 1. 질문 + 글자수 */}
      <div className="grid gap-3">
        <Field label="문항">
          <textarea
            rows={3}
            className="field text-[14px] py-2.5"
            placeholder="예: 지원 동기를 작성해주세요."
            value={form.question}
            onChange={(e) => update('question', e.target.value)}
          />
        </Field>
        <Field label="답변 글자수 제한">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              step="50"
              className="field text-[14px] py-2 max-w-[140px]"
              value={form.maxLength}
              onChange={(e) => update('maxLength', Number(e.target.value) || 0)}
            />
            <span className="text-[12px] text-ink-500">자</span>
          </div>
        </Field>

        {/* 2. 추천 경험 */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[12.5px] font-semibold text-ink-700">
              관련 경험
            </label>
            <button
              type="button"
              onClick={handleRecommend}
              disabled={!form.question.trim() || isAnyPending}
              className="btn-default btn-sm"
            >
              <Sparkles size={12} strokeWidth={2} />
              {recommend.isPending ? '추천 받는 중…' : '추천 받기'}
            </button>
          </div>
          {recommendedAll == null ? (
            <div className="rounded-md border border-dashed border-ink-200 bg-ink-50 px-3 py-3 text-[12px] text-ink-400 text-center">
              질문 입력 후 추천 받기를 누르면 관련 경험이 표시됩니다.
            </div>
          ) : recommendedAll.length === 0 ? (
            <div className="rounded-md border border-dashed border-ink-200 bg-ink-50 px-3 py-3 text-[12px] text-ink-500 text-center">
              관련 경험이 없습니다. 경험을 더 추가하면 추천이 다양해져요.
            </div>
          ) : (
            <div className="grid gap-1.5">
              {recommendedAll.map((r, i) => {
                const selected = form.relatedExperience.some(
                  (s) => s.experienceId === r.experienceId
                );
                const isTop2 = i < 2;
                return (
                  <button
                    key={r.experienceId}
                    type="button"
                    onClick={() => toggleRelated(r.experienceId)}
                    className={cn(
                      'w-full text-left rounded-md border px-3 py-2 transition-colors',
                      selected
                        ? 'bg-primary-50 border-primary-600 text-primary-900'
                        : 'bg-paper border-ink-200 hover:bg-ink-50'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] text-ink-500">
                        #{i + 1}
                        {isTop2 && (
                          <span className="ml-1.5 text-primary-700 font-semibold">
                            추천
                          </span>
                        )}
                      </span>
                      {r.similarity != null && (
                        <span className="text-[11px] text-ink-400 tabular-nums ml-auto">
                          유사도 {(r.similarity * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="text-[13px] font-semibold break-keep">
                      {r.title}
                    </div>
                    {r.reason && (
                      <div
                        className={cn(
                          'text-[11.5px] mt-1 break-keep leading-relaxed',
                          selected ? 'text-primary-800' : 'text-ink-600'
                        )}
                      >
                        <span className="font-semibold">추천 이유:</span>{' '}
                        {r.reason}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <div className="text-[11.5px] text-ink-500">
            클릭으로 활용 경험을 토글합니다. 최대 2개까지 선택 가능.
          </div>
        </div>

        {/* 3. 초안 / 답변 */}
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[12.5px] font-semibold text-ink-700">
              답변 초안
            </label>
            {form.maxLength > 0 && (
              <span
                className={cn(
                  'text-[11.5px] tabular-nums',
                  form.response.length > form.maxLength
                    ? 'text-red-600 font-semibold'
                    : 'text-ink-500'
                )}
              >
                {form.response.length} / {form.maxLength} 자
              </span>
            )}
          </div>
          <textarea
            rows={6}
            className="field text-[14px] py-2.5"
            placeholder="아직 작성된 답변이 없습니다. '초안 생성' 으로 AI 응답을 받거나 직접 입력하세요."
            value={form.response}
            onChange={(e) => update('response', e.target.value)}
          />
          {form.response.length > form.maxLength && form.maxLength > 0 && (
            <div className="text-[11.5px] text-red-600 break-keep">
              제한 글자수를 {form.response.length - form.maxLength}자
              초과했어요.
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!form.question.trim() || isAnyPending}
            className="btn-default btn-sm"
          >
            <Sparkles size={12} strokeWidth={2} />
            {generate.isPending || createQuestion.isPending
              ? '초안 생성 중…'
              : '초안 생성'}
          </button>
        </div>

        {/* 4. 재생성 */}
        {form.questionId && form.response && (
          <div className="grid gap-2 mt-2 pt-3 border-t border-ink-150">
            <label className="text-[12.5px] font-semibold text-ink-700">
              재생성 — 어떻게 수정할까요?
            </label>
            <div className="relative">
              <textarea
                rows={2}
                className="field text-[14px] py-2.5 pr-8"
                placeholder="예: 더 구체적인 수치를 넣어주세요. AI가 작성하지 않은 듯하게."
                value={regenReq}
                onChange={(e) => setRegenReq(e.target.value)}
              />
              {regenReq && (
                <button
                  type="button"
                  onClick={() => setRegenReq('')}
                  disabled={isAnyPending}
                  aria-label="요구사항 비우기"
                  className="absolute top-1.5 right-1.5 p-1 rounded text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors disabled:opacity-50"
                >
                  <XIcon size={14} strokeWidth={2} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={!regenReq.trim() || isAnyPending}
                className="btn-default btn-sm"
              >
                <RefreshCw size={12} strokeWidth={2} />
                {regenerate.isPending ? '재생성 중…' : '다시 생성'}
              </button>
            </div>
          </div>
        )}

        {/* 5. 저장 */}
        <div className="flex justify-end pt-3 border-t border-ink-150">
          <button
            type="button"
            onClick={handleSave}
            disabled={
              !form.question.trim() || !form.response.trim() || isAnyPending
            }
            className="btn-primary"
          >
            <Check size={13} strokeWidth={2} />
            {createQuestion.isPending || updateQuestion.isPending
              ? '저장 중…'
              : isExisting
                ? '문항 수정 저장'
                : '이 문항 저장'}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- 로컬 빌딩블록 ---------- */

function Field({ label, hint, children }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-[12.5px] font-semibold text-ink-700">
        {label}
      </label>
      {children}
      {hint && <div className="text-[11.5px] text-ink-500 mt-0.5">{hint}</div>}
    </div>
  );
}

/* ---------- 외부에서 새 빈 문항 추가용 헬퍼 ---------- */

export const AddQuestionButton = ({ onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full rounded-md border border-dashed border-ink-200 bg-paper px-4 py-3 text-[13px] text-ink-700 font-semibold hover:bg-ink-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
  >
    <Plus size={14} strokeWidth={2.2} />새 문항 추가
  </button>
);
