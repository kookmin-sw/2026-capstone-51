// 사이드바 네비게이션 정의.
// 라우트 path는 /dashboard 처럼 슬래시 prefix 형태.

export const NAV = [
  {
    id: 'dashboard',
    label: '대시보드',
    icon: 'Home',
    path: '/dashboard',
    top: true,
  },
  {
    id: 'essay',
    label: '자소서',
    icon: 'PencilLine',
    group: true,
    children: [
      { id: 'write', label: '자소서 작성하기', path: '/write' },
      { id: 'essays', label: '자소서 관리', path: '/essays' },
    ],
  },
  { id: 'stats', label: '통계', icon: 'BarChart3', path: '/stats', top: true },
  {
    id: 'mypage',
    label: '마이페이지',
    icon: 'User',
    group: true,
    children: [
      { id: 'info', label: '내 정보', path: '/info' },
      { id: 'my-experience', label: '내 경험', path: '/my-experience' },
      { id: 'my-certificates', label: '내 자격증', path: '/my-certificates' },
    ],
  },
];

// 관련 사이트
export const RELATED_SITES = [
  { label: '국민대 경력개발지원단', href: '#' },
  { label: 'KMU 잡포털', href: '#' },
  { label: 'ON국민시스템', href: '#' },
  { label: 'K-Startrack', href: '#' },
];

// 현재 로그인 mock — 페이지 분리 후에도 같은 사용자 정보 표시
export const CURRENT_USER = {
  name: '한혜민',
  sub: '소프트웨어학부',
  initial: '한',
};
