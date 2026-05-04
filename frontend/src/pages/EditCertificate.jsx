import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Crumbs from '../components/Crumbs';
import CertificateForm from '../components/certificate/CertificateForm';
import {
  useCertificates,
  useUpdateCertificate,
} from '../api/queries/useCertificates';
import { toast } from '../store/useToast';

/**
 * /my-certificates/:id/edit — 자격증 수정.
 *
 * 백엔드에 단건 GET /certificates/:id 가 없어 목록(useCertificates)에서 찾아 사용.
 * (목록은 react-query 캐시되어 있으므로 비용 거의 없음. URL 직접 진입해도 동작.)
 */
export default function EditCertificate() {
  const { id } = useParams();
  const nav = useNavigate();
  const list = useCertificates();
  const update = useUpdateCertificate();

  const item = useMemo(
    () => (list.data || []).find((c) => c.certificateId === id),
    [list.data, id]
  );

  const handleSubmit = (body) => {
    update.mutate(
      { id, body },
      {
        onSuccess: () => {
          toast.success('자격증을 저장했어요.');
          nav('/my-certificates');
        },
        onError: (e) => {
          toast.error(
            e?.apiMessage || '저장 중 오류가 발생했습니다. 다시 시도해주세요.'
          );
        },
      }
    );
  };

  if (list.isLoading) {
    return (
      <>
        <Crumbs items={['MyPage', '내 자격증', '수정']} />
        <div className="card animate-pulse">
          <div className="h-5 w-1/3 bg-ink-100 rounded mb-4" />
          <div className="grid gap-3">
            <div className="h-10 bg-ink-100 rounded" />
            <div className="h-10 bg-ink-100 rounded" />
            <div className="h-10 bg-ink-100 rounded" />
          </div>
        </div>
      </>
    );
  }

  return null;
}
