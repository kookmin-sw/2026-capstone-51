// 통계 페이지 데이터

export const COMPARE_SCOPES = [
  { id: 'major', label: '같은 학과', detail: '소프트웨어학부 · 472명' },
  { id: 'cohort', label: '같은 학번', detail: '22학번 · 214명' },
  { id: 'grade', label: '같은 학년', detail: '4학년 · 689명' },
];

// 막대 비교(나 vs 동기 평균)
export const ACTIVITY_BARS = [
  {
    label: '경험 기록',
    me: 4,
    peer: 2.3,
    meLabel: '나 4건',
    peerLabel: '동기 2.3건',
  },
  {
    label: '자소서 작성',
    me: 6,
    peer: 3.1,
    meLabel: '나 6건',
    peerLabel: '동기 3.1건',
  },
  {
    label: '지원 기업 수',
    me: 5,
    peer: 4.7,
    meLabel: '나 5곳',
    peerLabel: '동기 4.7곳',
  },
  {
    label: '서류 합격률',
    me: 42,
    peer: 35,
    meLabel: '나 42%',
    peerLabel: '동기 35%',
    pct: true,
  },
  {
    label: '알고리즘 PS 문제',
    me: 12,
    peer: 38,
    meLabel: '나 12문제',
    peerLabel: '동기 38문제',
  },
  {
    label: '보유 자격증',
    me: 0,
    peer: 1.8,
    meLabel: '나 0개',
    peerLabel: '동기 1.8개',
  },
];

// 도넛 — 카테고리 분포
export const CATEGORY_DIST = [
  { label: '프로젝트', value: 4, pct: 28.6, color: '#5B7FB2' },
  { label: '대외활동', value: 5, pct: 35.7, color: '#C2773F' },
  { label: '인턴', value: 2, pct: 14.3, color: '#5B8E5A' },
  { label: '학업', value: 3, pct: 21.4, color: '#9C6FC0' },
];

// 비교 대상별 부족한 경험 추천
export const RECS_BY_SCOPE = {
  major: [
    {
      cat: '자격증',
      gap: '−1.6개',
      detail: '나 0개 · 학과 평균 1.6개',
      items: ['정보처리기사', 'SQLD', '리눅스마스터 2급'],
    },
    {
      cat: '인턴·현장실습',
      gap: '−1.0회',
      detail: '나 0회 · 학과 평균 1.0회',
      items: ['여름 단기 인턴', '현장실습 (4학년)', 'IT 동아리 멘토링'],
    },
    {
      cat: '알고리즘·CS',
      gap: '−24문제',
      detail: '나 12문제 · 학과 평균 36문제',
      items: ['백준 실버 30제', 'CS 전공 스터디', '코딩테스트 모의고사'],
    },
  ],
  cohort: [
    {
      cat: '자격증',
      gap: '−1.8개',
      detail: '나 0개 · 22학번 평균 1.8개',
      items: ['정보처리기사', 'AWS SAA', 'SQLD'],
    },
    {
      cat: '인턴·현장실습',
      gap: '−1.2회',
      detail: '나 0회 · 22학번 평균 1.2회',
      items: ['여름 방학 단기 인턴', '현장실습 (4학년)', '스타트업 파트타임'],
    },
    {
      cat: '알고리즘·CS',
      gap: '−26문제',
      detail: '나 12문제 · 22학번 평균 38문제',
      items: ['백준 실버 30제 (2주)', 'CS 전공 스터디', '코딩테스트 모의고사'],
    },
  ],
  grade: [
    {
      cat: '자격증',
      gap: '−2.1개',
      detail: '나 0개 · 4학년 평균 2.1개',
      items: ['정보처리기사', 'AWS SAA', '오픽 IM2 이상'],
    },
    {
      cat: '인턴·현장실습',
      gap: '−1.5회',
      detail: '나 0회 · 4학년 평균 1.5회',
      items: ['공채 시즌 인턴 지원', '현장실습 (4학년)', '계약직·프리랜스'],
    },
    {
      cat: '대외활동·공모전',
      gap: '−1.6개',
      detail: '나 1개 · 4학년 평균 2.6개',
      items: [
        'SW 해커톤 / 공모전',
        '소마·SSAFY 부트캠프',
        '오픈소스 컨트리뷰션',
      ],
    },
  ],
};

export const RECS_HEADLINE = {
  major: { sub: '소프트웨어학부 472명 평균 대비', ratio: '하위 24%' },
  cohort: { sub: '22학번 214명 평균 대비', ratio: '하위 22%' },
  grade: { sub: '4학년 689명 평균 대비', ratio: '하위 31%' },
};
