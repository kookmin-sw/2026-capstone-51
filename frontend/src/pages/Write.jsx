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

  return null;
}
