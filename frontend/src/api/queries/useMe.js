import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { qk } from './keys';

/**
 * GET /users/me — 현재 로그인 사용자 프로필.
 *
 * 반환: { userName, state, score, major, minor, schoolNumber, jobFirst, jobSecond, jobThird }
 *  - state / major / minor / job* 는 enum 문자열. lib/enums.js 의 라벨 맵으로 변환해 표시.
 *  - 토큰이 없거나 만료/무효면 axios 인터셉터가 reissue 시도 → 실패 시 401 throw.
 *    page 단의 ProtectedRoute (PR#3 에서 추가) 가 받아서 /landing 으로 보낼 예정.
 */
export const useMe = () =>
  useQuery({
    queryKey: qk.me(),
    queryFn: () => api.get('/users/me').then((r) => r.data),
  });

/**
 * PUT /users/me — 프로필 수정. 응답이 갱신된 user 객체.
 */
export const useUpdateMe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.put('/users/me', body).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(qk.me(), data);
    },
  });
};

/**
 * POST /auth/withdraw — 회원 탈퇴.
 *  - body 없음. 인증된 사용자 본인을 삭제.
 *  - onSuccess 후처리(토큰 비우기 / 캐시 wipe / 라우팅)는 호출부 책임.
 *    여기서 직접 처리하지 않는 이유: useNavigate 가 컴포넌트 안에서만 동작 + 호출부마다 UX 분기 가능.
 */
export const useWithdraw = () =>
  useMutation({
    mutationFn: () => api.post('/auth/withdraw'),
  });

/**
 * GET /users/me/stats?groupBy= — 통계 페이지 데이터.
 *
 * groupBy: 'STATE' | 'SCHOOL_NUM' | 'WORKER' (lib/enums.js STATS_GROUP_LABEL 와 일치)
 * 응답: {
 *   statistics: { partTime, external, internal, license, intern } × { avg, userCount, myCount },
 *   weakPoints: [{ type: string, recommendedItems: string[] }]
 * }
 */
export const useMyStats = (groupBy) =>
  useQuery({
    queryKey: qk.stats(groupBy),
    queryFn: () =>
      api.get('/users/me/stats', { params: { groupBy } }).then((r) => r.data),
    enabled: !!groupBy,
    // groupBy 토글 시 이전 데이터를 즉시 보여줌 — Loading 스켈레톤이 깜빡이지 않음.
    placeholderData: (prev) => prev,
  });
