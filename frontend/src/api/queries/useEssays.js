import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { qk } from './keys';

/**
 * 자소서 + 문항 CRUD 훅.
 * 백엔드 명세:
 *   GET    /essays                              → { essays: [...] } (목록)
 *   GET    /essays/:id                          → 상세 (questions 포함)
 *   POST   /essays/create                       → { essayId }
 *   PATCH  /essays/:id                          → 메타 (companyName, wishJob, globalReq) 수정
 *   PATCH  /essays/:id/result                   → { progress: PASS|FAIL|IN_PROGRESS }
 *   DELETE /essays/:id                          → Void
 *   POST   /essays/:id/questions                → { questionId } 새 문항 저장
 *   PATCH  /essays/:id/questions/:qid           → 문항 수정
 *
 * 알려진 contract 이슈 (백엔드 fix 대기):
 *   - EssayListResponse 의 essays[] 에 essayId 가 없음 → 목록→상세 라우팅 불가.
 *   - EssayDetailResponse 는 globalReq 대신 requirement, updatedAt 대신 modifiedDate 사용.
 *     페이지 단에서 normalize 어댑터 필요.
 *
 * 미구현 endpoint (백엔드 일정 대기 — 본 PR 에서는 훅 만들지 않음):
 *   POST /essays/recommand, /essays/generate, /essays/regenerate.
 */

export const useEssays = () =>
  useQuery({
    queryKey: qk.essays.all(),
    queryFn: () => api.get('/essays').then((r) => r.data?.essays ?? []),
  });

export const useEssay = (id) =>
  useQuery({
    queryKey: qk.essays.one(id),
    queryFn: () => api.get(`/essays/${id}`).then((r) => r.data),
    enabled: !!id,
  });

export const useCreateEssay = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/essays/create', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.essays.all() }),
  });
};

export const useUpdateEssayMeta = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => api.patch(`/essays/${id}`, body),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: qk.essays.all() });
      qc.invalidateQueries({ queryKey: qk.essays.one(vars.id) });
    },
  });
};

export const useUpdateEssayResult = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, progress }) =>
      api.patch(`/essays/${id}/result`, { progress }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: qk.essays.all() });
      qc.invalidateQueries({ queryKey: qk.essays.one(vars.id) });
    },
  });
};

export const useDeleteEssay = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/essays/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.essays.all() }),
  });
};

export const useCreateEssayQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ essayId, body }) =>
      api.post(`/essays/${essayId}/questions`, body).then((r) => r.data),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: qk.essays.one(vars.essayId) }),
  });
};

export const useUpdateEssayQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ essayId, questionId, body }) =>
      api.patch(`/essays/${essayId}/questions/${questionId}`, body),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: qk.essays.one(vars.essayId) }),
  });
};
