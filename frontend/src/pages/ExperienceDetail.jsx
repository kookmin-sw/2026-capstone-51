import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import Modal from '../components/Modal';
import ExperienceForm from '../components/experience/ExperienceForm';
import {
  useExperience,
  useUpdateExperience,
  useDeleteExperience,
} from '../api/queries/useExperiences';
import {
  EXPERIENCE_CATEGORY_TO_FRONT,
  EXPERIENCE_CATEGORY_LABEL,
} from '../lib/enums';
import { toast } from '../store/useToast';

/**
 * /my-experience/:id — 경험 열람 + 수정 + 삭제.
 *
 * 모드:
 *  - view: 카테고리·기간·관련 전공·STAR 4항목 모두 표시 (truncate 없음).
 *  - edit: 같은 ExperienceForm 으로 토글 → PUT /experiences/:id.
 *
 * 삭제 확인은 모달 — "삭제하시겠습니까?" 팝업에서 [취소 / 삭제] 선택.
 */
export default function ExperienceDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const exp = useExperience(id);

  return null;
}
