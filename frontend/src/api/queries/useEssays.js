import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { qk } from './keys';

/**
 * 자소서 + 문항 CRUD + AI 응답 훅.
 *
 * 백엔드 진실 원천: https://logi.p-e.kr/api/swagger-ui/index.html (스펙 /api/v3/api-docs).
 *
 * 명세 (2026-05-10 스웨거 재검증):
 *   GET    /essays                              → { essays: [...] } (목록)
 *   GET    /essays/:id                          → 상세 (questions 포함)
 *   POST   /essays/create                       → { essayId }    body: { companyName, wishJob, globalReq }
 *   PATCH  /essays/:id                          → 메타 수정       body: { companyName, wishJob, globalReq }
 *   PATCH  /essays/:id/result                   → 합/불 수정     body: { progress: PASS|FAIL|IN_PROGRESS }
 *   DELETE /essays/:id                          → Void
 *   POST   /essays/:id/questions                → { questionId } body: { questionNum, question, response, maxLength, relatedExperience[] }
 *   PATCH  /essays/:id/questions/:qid           → 문항 수정      body: { question, response, maxLength, relatedExperience[] } (questionNum 불변)
 *   POST   /essays/recommend                    → 관련 경험 추천 body: { question } / 응답: { relatedExperience: [{ experienceId, experienceTitle, similarity }] }
 *   POST   /essays/generate                     → 답변 생성      body: { essayId, questionId } / 응답: { response: string }
 *   POST   /essays/regenerate                   → 답변 재생성    body: { essayId, questionId, currentResponse, questionReq } / 응답: { response: string }
 *
 * 알려진 contract 이슈 (백엔드 fix 대기):
 *   - EssayListResponse 의 essays[] 에 essayId 가 없음 → 목록→상세 라우팅 차단 (스웨거 기준).
 *     단, 응답에 essayId 가 들어오면 페이지가 자동으로 활성화되도록 opportunistic 처리.
 *   - EssayDetailResponse 가 작성용 globalReq / 목록 updatedAt 와 다른 키를 사용.
 *     useEssay 훅이 normalize 어댑터를 적용해 호출부는 { globalReq, updatedAt } 으로만 보면 됨.
 */

/**
 * 백엔드 EssayDetailResponse 응답 키 정합화.
 *  requirement → globalReq, modifiedDate → updatedAt.
 *  원본 키도 같이 보존(레거시 호환).
 */
const normalizeEssayDetail = (raw) => {
  if (!raw) return raw;
  return {
    ...raw,
    globalReq: raw.globalReq ?? raw.requirement,
    updatedAt: raw.updatedAt ?? raw.modifiedDate,
  };
};

export const useEssays = () =>
  useQuery({
    queryKey: qk.essays.all(),
    queryFn: () => api.get('/essays').then((r) => r.data?.essays ?? []),
  });

export const useEssay = (id) =>
  useQuery({
    queryKey: qk.essays.one(id),
    queryFn: () =>
      api.get(`/essays/${id}`).then((r) => normalizeEssayDetail(r.data)),
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
    // Optimistic update — 네트워크 응답 기다리지 않고 캐시에 즉시 새 progress
    // 반영해 EssayDetail 의 진행상태 뱃지·active 버튼이 곧바로 갱신됨.
    // 실패 시 onError 에서 이전 값으로 rollback. 완료 후 onSettled 가 invalidate
    // 해 서버의 최종 값으로 sync.
    onMutate: async ({ id, progress }) => {
      await qc.cancelQueries({ queryKey: qk.essays.one(id) });
      const previous = qc.getQueryData(qk.essays.one(id));
      if (previous) {
        qc.setQueryData(qk.essays.one(id), { ...previous, progress });
      }
      return { previous };
    },
    onError: (_e, vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(qk.essays.one(vars.id), ctx.previous);
      }
    },
    onSettled: (_d, _e, vars) => {
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

/* ---------- AI 응답 ---------- */
// 아래 3 종은 백엔드 상태를 변경하지 않고 결과만 반환하므로 캐시 invalidate 불필요.
// 호출부가 받은 값을 자체 state 로 들고 화면에 반영. 저장은 useCreateEssayQuestion / useUpdateEssayQuestion 으로.

/** POST /essays/recommend — body: { question } */
export const useRecommendExperiences = () =>
  useMutation({
    mutationFn: (body) =>
      api.post('/essays/recommend', body).then((r) => r.data),
  });

/** POST /essays/generate — body: { essayId, questionId } */
export const useGenerateAnswer = () =>
  useMutation({
    mutationFn: (body) =>
      api.post('/essays/generate', body).then((r) => r.data),
  });

/** POST /essays/regenerate — body: { essayId, questionId, currentResponse, questionReq } */
export const useRegenerateAnswer = () =>
  useMutation({
    mutationFn: (body) =>
      api.post('/essays/regenerate', body).then((r) => r.data),
  });
