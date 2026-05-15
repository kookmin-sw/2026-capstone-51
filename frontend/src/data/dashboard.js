/**
 * 대시보드 시각화에서 공유하는 정적 카테고리 토큰 + PeersOrb fallback mock.
 *
 * 5축(parttime/activity/intern/internal/cert) 라벨·색상을 한 곳에서 관리해
 * Roadmap / 범례가 동일 어휘를 사용.
 *
 * 마일스톤(myRoadmap, seniorRoadmaps)은 GET /users/me/dashboard 응답으로 받아 그대로 렌더.
 * PEER_AXES 는 백엔드 peerAxes 가 비어 올 때만 fallback 으로 사용 (그래프 빈 채 three.js 터지는 것 방지).
 */

/** PeersOrb fallback — 백엔드 peerAxes 응답 비었을 때만 사용 (Dashboard 가 빨간 경고도 같이 표시). */
export const PEER_AXES = [
  { key: 'internal', label: '대내활동', me: 78, peers: 55 },
  { key: 'activity', label: '대외활동', me: 42, peers: 60 },
  { key: 'intern', label: '인턴', me: 65, peers: 48 },
  { key: 'parttime', label: '알바', me: 50, peers: 45 },
  { key: 'cert', label: '자격증', me: 55, peers: 62 },
];

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
