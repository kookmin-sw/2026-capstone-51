import api from './axios';

/**
 * 사용자 본인 프로필 갱신. 온보딩 완료 시 호출.
 * 백엔드: PUT /users/me  (ApiResponse 래핑 응답)
 */
export async function updateMyProfile(profile) {
  const res = await api.put('/users/me', profile);
  return res.data?.data ?? res.data;
}