import { useNavigate } from 'react-router-dom';
import Crumbs from '../components/Crumbs';
import CertificateForm from '../components/certificate/CertificateForm';
import { useCreateCertificate } from '../api/queries/useCertificates';
import { toast } from '../store/useToast';

/**
 * /my-certificates/new — 자격증 추가.
 * POST /certificates 직접 호출. 성공 시 목록으로 복귀.
 */
export default function NewCertificate() {
  const nav = useNavigate();
  const create = useCreateCertificate();

  const handleSubmit = (body) => {
    create.mutate(body, {
      onSuccess: () => {
        toast.success('자격증을 저장했어요.');
        nav('/my-certificates');
      },
      onError: (e) => {
        toast.error(
          e?.apiMessage || '저장 중 오류가 발생했습니다. 다시 시도해주세요.'
        );
      },
    });
  };

  return (
    <>

  return null;
}
