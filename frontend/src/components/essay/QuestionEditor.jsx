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

  return null;
}
