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

  return null;
}
