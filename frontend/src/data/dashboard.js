/**
 * 대시보드 데이터 — 원본 app.html에서 그대로 가져왔습니다.
 * 5축 레이더 / 학기 타임라인 / 선배 로드맵.
 */

/* ===== 1. 5축 동기 비교 (PeersOrb) ===== */
export const PEER_AXES = [
  { key: 'internal', label: '대내활동', me: 78, peers: 55 },
  { key: 'activity', label: '대외활동', me: 42, peers: 60 },
  { key: 'intern', label: '인턴', me: 65, peers: 48 },
  { key: 'parttime', label: '알바', me: 50, peers: 45 },
  { key: 'cert', label: '자격증', me: 55, peers: 62 },
];

/* ===== 2. 카테고리 라벨/색상 — Roadmap에서 공통 사용 ===== */
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

/* ===== 3. 학기 축 (1-1 ~ 4-2) — Today: 4-1 ===== */
export const SEMESTERS = [
  { id: '1-1', y: 2022, h: 1, label: '1-1', sub: "'22-1" },
  { id: '1-2', y: 2022, h: 2, label: '1-2', sub: "'22-2" },
  { id: '2-1', y: 2023, h: 1, label: '2-1', sub: "'23-1" },
  { id: '2-2', y: 2023, h: 2, label: '2-2', sub: "'23-2" },
  { id: '3-1', y: 2024, h: 1, label: '3-1', sub: "'24-1" },
  { id: '3-2', y: 2024, h: 2, label: '3-2', sub: "'24-2" },
  { id: '4-1', y: 2025, h: 1, label: '4-1', sub: "'25-1" },
  { id: '4-2', y: 2025, h: 2, label: '4-2', sub: "'25-2" },
];
export const TODAY_SEM_INDEX = 6; // 4-1

export function ymToSemIndex(y, m) {
  const h = m <= 6 ? 1 : 2;
  const idx = SEMESTERS.findIndex((s) => s.y === y && s.h === h);
  return idx >= 0 ? idx : h === 1 ? 0 : SEMESTERS.length - 1;
}

/* ===== 4. 내 로드맵 ===== */
export const MY_ROADMAP = [
  {
    y: 2023,
    m: 3,
    cat: 'parttime',
    title: '카페 아르바이트',
    date: '23.03 ~ 23.12',
    detail: '주말 9개월 · 응대 200건/일',
  },
  {
    y: 2024,
    m: 3,
    cat: 'internal',
    title: '학회 KMUSEC',
    date: '24.03 ~ 25.02',
    detail: '백엔드 리드 · 12개월',
  },
  {
    y: 2025,
    m: 4,
    cat: 'intern',
    title: '연구실 인턴',
    date: '25.04 ~ 25.06',
    detail: 'ETL · Airflow DAG 12개',
  },
  {
    y: 2025,
    m: 7,
    cat: 'activity',
    title: 'SW 멘토링 봉사',
    date: '25.07 ~ 진행중',
    detail: '중학생 5명 · Python',
  },
  {
    y: 2025,
    m: 9,
    cat: 'internal',
    title: '캡스톤 디자인',
    date: '25.09 ~ 26.01',
    detail: 'AWS · 배포 30분→4분',
  },
];

/* ===== 5. 선배 로드맵 (3명 carousel) ===== */
export const SENIOR_ROADMAPS = [
  {
    name: '선배 A',
    co: '카카오',
    year: '2024 하반기',
    items: [
      {
        y: 2022,
        m: 6,
        cat: 'parttime',
        title: '교내 근로 아르바이트',
        date: '22.06 ~ 22.12',
        detail: '학과 행정 보조 · 6개월',
      },
      {
        y: 2023,
        m: 3,
        cat: 'internal',
        title: '개발 학회 KMUSEC',
        date: '23.03 ~ 24.02',
        detail: '백엔드 트랙 12개월',
      },
      {
        y: 2023,
        m: 9,
        cat: 'cert',
        title: '정보처리기사',
        date: '23.09 취득',
        detail: '필기·실기 1회 합격',
      },
      {
        y: 2024,
        m: 6,
        cat: 'intern',
        title: '여름 인턴 (스타트업)',
        date: '24.06 ~ 24.08',
        detail: 'API 서버 개발 3개월',
      },
      {
        y: 2024,
        m: 11,
        cat: 'cert',
        title: 'AWS SAA',
        date: '24.11',
        detail: '실무 활용 인증',
      },
      {
        y: 2025,
        m: 3,
        cat: 'internal',
        title: '캡스톤 백엔드 리드',
        date: '25.03 ~ 25.08',
        detail: '5명 팀 · 리드',
      },
    ],
  },
  {
    name: '선배 B',
    co: '카카오',
    year: '2024 상반기',
    items: [
      {
        y: 2022,
        m: 9,
        cat: 'parttime',
        title: '카페 아르바이트',
        date: '22.09 ~ 23.06',
        detail: '주말 9개월',
      },
      {
        y: 2023,
        m: 3,
        cat: 'internal',
        title: '교내 알고리즘 학회',
        date: '23.03 ~ 24.02',
        detail: '주 2회 스터디 · 12개월',
      },
      {
        y: 2023,
        m: 8,
        cat: 'cert',
        title: 'SQLD',
        date: '23.08 취득',
        detail: '데이터 모델링',
      },
      {
        y: 2024,
        m: 1,
        cat: 'intern',
        title: '겨울 인턴 (대기업)',
        date: '24.01 ~ 24.02',
        detail: '데이터 플랫폼 2개월',
      },
      {
        y: 2024,
        m: 7,
        cat: 'intern',
        title: '여름 인턴 (네이버)',
        date: '24.07 ~ 24.08',
        detail: '백엔드 2개월',
      },
      {
        y: 2024,
        m: 9,
        cat: 'activity',
        title: '오픈소스 컨트리뷰톤',
        date: '24.09 ~ 24.11',
        detail: '3개월 · PR 12건',
      },
    ],
  },
  {
    name: '선배 C',
    co: '카카오',
    year: '2024 하반기',
    items: [
      {
        y: 2022,
        m: 7,
        cat: 'activity',
        title: 'SW 멘토링 봉사',
        date: '22.07 ~ 23.06',
        detail: '중학생 멘토 12개월',
      },
      {
        y: 2023,
        m: 3,
        cat: 'internal',
        title: '학회 KMUSEC',
        date: '23.03 ~ 24.02',
        detail: '백엔드 12개월',
      },
      {
        y: 2023,
        m: 10,
        cat: 'cert',
        title: '정보처리기사',
        date: '23.10 취득',
        detail: '필기·실기',
      },
      {
        y: 2024,
        m: 6,
        cat: 'intern',
        title: '여름 인턴 (라인)',
        date: '24.06 ~ 24.08',
        detail: '플랫폼팀 3개월',
      },
      {
        y: 2024,
        m: 11,
        cat: 'parttime',
        title: '학원 보조강사',
        date: '24.11 ~ 25.02',
        detail: '주 3회 · 4개월',
      },
      {
        y: 2025,
        m: 3,
        cat: 'internal',
        title: '캡스톤 디자인',
        date: '25.03 ~ 25.08',
        detail: '5명 팀',
      },
    ],
  },
];
