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

  return null;
}
