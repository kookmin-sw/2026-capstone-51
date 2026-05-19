import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { qk } from './keys';

/**
 * 자격증 CRUD 훅.
 * 백엔드 명세:
 *   GET    /certificates                 → { certificates: [...] }
 *   POST   /certificates                 → Void
 *   PUT    /certificates/:id             → 자격증 객체
 *   DELETE /certificates/:id             → Void
 *   POST   /certificates/upload-url      → { uploadUrl, fileKey, contentType }  (PDF presigned PUT)
 *
 * 요청/응답 필드: certificateName, getDate (LocalDate), expirationDate, certificateCode, issuingOrganization, fileKey.
 * 응답엔 fileKey 대신 fileUrl(다운로드용 변환된 URL) 이 들어옴.
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

/**
 * POST /certificates/upload-url — 자격증 PDF 업로드용 presigned PUT URL 발급.
 * 호출부 흐름: ① 본 mutation → uploadUrl/fileKey 받음 → ② 받은 uploadUrl 에
 * raw PUT (axios 인터셉터 우회 — Authorization 빠져야 S3 가 받음) → ③ 자격증
 * POST/PUT body 에 fileKey 첨부.
 */
export const useUploadCertificateUrl = () =>
  useMutation({
    mutationFn: () => api.post('/certificates/upload-url').then((r) => r.data),
  });

/**
 * 발급받은 presigned URL 에 raw PUT 으로 PDF 업로드.
 * fetch 사용 — axios 기본 인스턴스의 Authorization 헤더 / response unwrap 인터셉터를
 * 모두 우회해야 S3 가 거부하지 않음 (presigned URL 자체가 서명 포함).
 */
export async function putPdfToS3(
  uploadUrl,
  file,
  contentType = 'application/pdf'
) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`S3 업로드 실패 (HTTP ${res.status})`);
  }
}

/* ─────────────────── CertificationCatalog (자격증 마스터) ─────────────────── */
// 백엔드 `certification` 도메인 — 사용자 자격증(`certificate`) 과 별도. 인증 불요 마스터 데이터.
//   GET /certification-catalog → [{ certificationCatalogId, name, issuingOrganization, difficulty }]

/**
 * 자격증 카탈로그 전체 조회. 자격증 폼 자동완성 데이터 소스.
 * 마스터 데이터라 세션 동안 한 번만 fetch (staleTime / gcTime: Infinity).
 */
export const useCertificationCatalog = () =>
  useQuery({
    queryKey: qk.certificationCatalog(),
    queryFn: () => api.get('/certification-catalog').then((r) => r.data ?? []),
    staleTime: Infinity,
    gcTime: Infinity,
  });
