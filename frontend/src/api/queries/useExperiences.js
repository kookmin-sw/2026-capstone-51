import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { qk } from './keys';

/**
 * 경험 (STAR 기반) CRUD 훅.
 * 백엔드 명세:
 *   GET    /experiences           → { experiences: [...] }
 *   GET    /experiences/:id       → 경험 1건
 *   POST   /experiences           → Void (목록 invalidate)
 *   PUT    /experiences/:id       → Void
 *   DELETE /experiences/:id       → Void (soft delete)
 *
 * experienceCategory enum: INTERN / EXTERNAL / INTERNAL / PARTTIME.
 * 자격증은 별도 도메인이라 여기 카테고리에 없음 (lib/enums.js 참고).
 */

export const useExperiences = () =>
  useQuery({
    queryKey: qk.experiences.all(),
    queryFn: () =>
      api.get('/experiences').then((r) => r.data?.experiences ?? []),
  });

export const useExperience = (id) =>
  useQuery({
    queryKey: qk.experiences.one(id),
    queryFn: () => api.get(`/experiences/${id}`).then((r) => r.data),
    enabled: !!id,
  });

export const useCreateExperience = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/experiences', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.experiences.all() }),
  });
};

export const useUpdateExperience = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => api.put(`/experiences/${id}`, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.experiences.all() });
      qc.invalidateQueries({ queryKey: qk.experiences.one(vars.id) });
    },
  });
};

export const useDeleteExperience = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/experiences/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.experiences.all() }),
  });
};
