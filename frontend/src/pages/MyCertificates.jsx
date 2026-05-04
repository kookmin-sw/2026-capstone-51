import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import Modal from '../components/Modal';
import {
  useCertificates,
  useDeleteCertificate,
} from '../api/queries/useCertificates';
import { toast } from '../store/useToast';

/**
 * /my-certificates — 내 자격증 목록.
 *
 * 디자인:
 *  - 단일 .card !p-0 셸 안에 <ol> 번호 매긴 row 리스트 (검색 필터 없음).
 *  - 각 row 는 두 줄(번호 + 자격증명 / 발급기관·취득일·유효기간·발급번호) 콤팩트.
 *  - 수정/삭제는 우측 ghost 아이콘 버튼.
 *  - 삭제는 모달 확인 — "삭제하시겠습니까?" 팝업에서 [취소 / 삭제] 선택.
 */
export default function MyCertificates() {
  const [pendingDel, setPendingDel] = useState(null); // null | certificate item
  const list = useCertificates();
  const del = useDeleteCertificate();
  const nav = useNavigate();

  const items = useMemo(() => list.data || [], [list.data]);

  const handleConfirmDelete = () => {
    if (!pendingDel) return;
    del.mutate(pendingDel.certificateId, {
      onSuccess: () => {
        toast.success('자격증을 삭제했어요.');
        setPendingDel(null);
      },
      onError: (e) => {
        toast.error(
          e?.apiMessage || '삭제 중 오류가 발생했습니다. 다시 시도해주세요.'
        );
      },
    });
  };

  return null;
}
