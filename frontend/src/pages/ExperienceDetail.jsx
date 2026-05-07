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
  const update = useUpdateExperience();
  const del = useDeleteExperience();

  const [mode, setMode] = useState('view'); // 'view' | 'edit'
  const [confirmDelOpen, setConfirmDelOpen] = useState(false);

  if (exp.isLoading) {
    return (
      <>
        <Crumbs items={['MyPage', '내 경험', '열람']} />
        <div className="card animate-pulse">
          <div className="h-4 w-32 bg-ink-100 rounded mb-3" />
          <div className="h-6 w-2/3 bg-ink-100 rounded mb-4" />
          <div className="h-3 w-full bg-ink-100 rounded mb-2" />
          <div className="h-3 w-5/6 bg-ink-100 rounded" />
        </div>
      </>
    );
  }
  if (exp.isError) {
    return (
      <>
        <Crumbs items={['MyPage', '내 경험', '열람']} />
        <div className="card text-center py-8">
          <p className="text-[13px] text-ink-700 mb-3">
            {exp.error?.apiMessage || '경험을 불러오지 못했습니다.'}
          </p>
          <button
            type="button"
            onClick={() => exp.refetch()}
            className="btn-default"
          >
            다시 시도
          </button>
        </div>
      </>
    );
  }

  const data = exp.data;

  return null;
}
