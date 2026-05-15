/**
 * 대시보드 시각화에서 공유하는 정적 카테고리 토큰.
 *
 * 5축(parttime/activity/intern/internal/cert) 라벨·색상을 한 곳에서 관리해
 * MyRoadmapCard / SeniorRoadmapCard / 범례가 동일 어휘를 사용.
 *
 * (PeersOrb 평균/본인, 선배 마일스톤, 학기 축은 모두 GET /users/me/dashboard 응답으로 대체됨.)
 */

export const CAT_LABELS = {
  parttime: '알바',
  activity: '대외활동',
  intern: '인턴',
  internal: '대내활동',
  cert: '자격증',
};

export const CAT_COLORS = {
  parttime: '#475569', // slate
  activity: '#c2742d', // muted orange
  intern: '#0e7c66', // muted teal
  internal: '#3155b8', // brand blue
  cert: '#6d4aa1', // muted purple
};
