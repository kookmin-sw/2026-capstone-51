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
