import api from './axios';

/**
 * 사용자 본인 프로필 갱신. 온보딩 완료 시 호출.
 * 백엔드: PUT /users/me  (ApiResponse 래핑 응답)
 */
export async function updateMyProfile(profile) {
  const res = await api.put('/users/me', profile);
  return res.data?.data ?? res.data;
}

/**
 * 현재 로그인한 사용자의 프로필 조회. 사이드바/헤더의 이름 표시에 사용.
 * 응답의 `data.userName` 등을 그대로 활용.
 */
export async function getMe() {
  const res = await api.get('/users/me');
  return res.data?.data ?? res.data;
}

/**
 * 대시보드용 집계 데이터 조회 (PeersOrb 5축, 내 로드맵, 선배 로드맵).
 */
export async function getMyDashboard() {
  const res = await api.get('/users/me/dashboard');
  return res.data?.data ?? res.data;
}