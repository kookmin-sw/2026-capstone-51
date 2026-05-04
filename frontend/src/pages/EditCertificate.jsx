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

  if (list.isError) {
    return (
      <>
        <Crumbs items={['MyPage', '내 자격증', '수정']} />
        <div className="card text-center py-8">
          <p className="text-[13px] text-ink-700 mb-3">
            {list.error?.apiMessage || '자격증을 불러오지 못했습니다.'}
          </p>
          <button
            type="button"
            onClick={() => list.refetch()}
            className="btn-default"
          >
            다시 시도
          </button>
        </div>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <Crumbs items={['MyPage', '내 자격증', '수정']} />
        <div className="card text-center py-8">
          <p className="text-[13px] text-ink-700 mb-3 break-keep">
            해당 자격증을 찾을 수 없어요. 목록에서 다시 선택해주세요.
          </p>
          <button
            type="button"
            onClick={() => nav('/my-certificates')}
            className="btn-default"
          >
            목록으로
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Crumbs items={['MyPage', '내 자격증', '수정']} />

      <header className="mb-5">
        <h1 className="text-[22px] font-bold tracking-tight text-ink-900 break-keep">
          자격증 수정
        </h1>
        <p className="text-[12.5px] text-ink-500 mt-1">
          {item.certificateName}
        </p>
      </header>

      <div className="card">
        <CertificateForm
          initialValue={item}
          onSubmit={handleSubmit}
          onCancel={() => nav('/my-certificates')}
          isPending={update.isPending}
          submitLabel="저장"
        />
      </div>
    </>
  );
}
