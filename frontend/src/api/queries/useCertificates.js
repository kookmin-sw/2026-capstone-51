import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { qk } from './keys';

/**
 * 자격증 CRUD 훅.
 * 백엔드 명세:
 *   GET    /certificates           → { certificates: [...] }
 *   POST   /certificates           → Void
 *   PUT    /certificates/:id       → 자격증 객체
 *   DELETE /certificates/:id       → Void
 *
 * 요청/응답 필드: certificateName, getDate (LocalDate), expirationDate, certificateCode, issuingOrganization.
 * (노션 명세의 certificationName 은 오타 — 실서버 OpenAPI 기준 certificateName.)
 */

export const useCertificates = () =>
  useQuery({
    queryKey: qk.certificates.all(),
    queryFn: () =>
      api.get('/certificates').then((r) => r.data?.certificates ?? []),
  });

export const useCreateCertificate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/certificates', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.certificates.all() }),
  });
};

export const useUpdateCertificate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => api.put(`/certificates/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.certificates.all() }),
  });
};

export const useDeleteCertificate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/certificates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.certificates.all() }),
  });
};
