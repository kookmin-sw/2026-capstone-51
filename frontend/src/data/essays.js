// 자소서 목록 + 회고 모달의 대상이 되는 데이터.
// status:
//   'writing'   — 작성 중. 액션: 이어쓰기
//   'submitted' — 제출 완료. result 가 'pending' / 'pass' / 'fail'
export const ESSAYS = [
  {
    id: 1,
    co: '카카오',
    job: '2026 상반기 신입 · 백엔드',
    prog: 2,
    total: 3,
    dday: 'D-2',
    status: 'writing',
    updated: '2일 전',
  },
  {
    id: 2,
    co: '네이버',
    job: '신입 공채 · 클라우드 엔지니어',
    prog: 1,
    total: 4,
    dday: 'D-9',
    status: 'writing',
    updated: '어제',
  },
  {
    id: 3,
    co: '토스',
    job: '하계 인턴 · 서버 개발',
    prog: 0,
    total: 2,
    dday: 'D-21',
    status: 'writing',
    updated: '5일 전',
  },
  {
    id: 4,
    co: '우아한형제들',
    job: '2025 동계 인턴 · 백엔드',
    prog: 1,
    total: 1,
    dday: '제출 완료',
    status: 'submitted',
    result: 'pending',
    updated: '3주 전',
  },
  {
    id: 5,
    co: '카카오뱅크',
    job: '2025 하반기 · 백엔드',
    prog: 1,
    total: 1,
    dday: '제출 완료',
    status: 'submitted',
    result: 'pass',
    updated: '2개월 전',
  },
  {
    id: 6,
    co: '라인플러스',
    job: '2025 하반기 · 클라우드',
    prog: 1,
    total: 1,
    dday: '제출 완료',
    status: 'submitted',
    result: 'fail',
    updated: '3개월 전',
  },
];

// 자소서 열람 시 보여줄 답변 샘플 (id -> data)
export const ESSAY_ANSWERS = {
  1: {
    company: '카카오',
    job: '2026 상반기 신입 · 백엔드',
    questions: [
      {
        n: 1,
        limit: 800,
        count: 752,
        status: 'done',
        title: '지원 동기와 입사 후 포부를 작성해주세요.',
        used: ['cap'],
        answer: `저는 "끝까지 책임지는 협업 능력"을 강점으로 가진 백엔드 개발자입니다.\n\n학부 캡스톤 디자인에서 5명 팀의 백엔드 리드를 맡으며 GitHub Actions와 AWS ECS Fargate를 조합한 무중단 배포 파이프라인을 설계했습니다. 배포 시간을 30분에서 4분으로 단축하면서 동시에 롤백 절차를 표준화했습니다.\n\n카카오에서도 "함께 자라는" 가치관에 맞춰, 시스템으로 동료의 시간을 만들어주는 백엔드 엔지니어가 되고 싶습니다.`,
      },
      {
        n: 2,
        limit: 1000,
        count: 423,
        status: 'writing',
        title:
          '지원자가 가진 강점과 그것을 보여줄 수 있는 경험을 구체적으로 서술해주세요.',
        used: ['cap', 'kmu'],
        answer: `(작성 중) 학부 학회 KMUSEC에서 백엔드 리드로 활동하며…`,
      },
      {
        n: 3,
        limit: 800,
        count: 0,
        status: 'empty',
        title: '실패 경험과 그로부터 배운 점을 서술해주세요.',
        used: [],
        answer: '',
      },
    ],
  },
};

// 자소서 작성 — 추천 경험 (mock recommendation result)
export const RECOMMENDED = [
  {
    id: 'cap',
    title: '캡스톤디자인 — AWS 기반 배포 자동화',
    cat: '대내활동',
    dur: '2025.09~2026.01',
    tags: '"문제해결 + 리더십" 키워드',
    match: 92,
  },
  {
    id: 'kmu',
    title: '학회 KMUSEC — 백엔드 리드',
    cat: '대내활동',
    dur: '2024.03~2025.02',
    tags: '"협업" 키워드',
    match: 78,
  },
  {
    id: 'lab',
    title: '○○대학원 연구실 인턴 — 데이터 파이프라인',
    cat: '인턴',
    dur: '2025.04~2025.06',
    tags: '"기술적 문제 해결" 관점 보강',
    match: 54,
  },
  {
    id: 'pwa',
    title: '개인 프로젝트 — 가계부 PWA 앱',
    cat: '대내활동',
    dur: '2024.06~2024.08',
    tags: '"주도성 / 완주" 관점',
    match: 42,
  },
];

// 자소서 작성 — 톤 옵션
export const TONE_OPTIONS = [
  { id: 'professional', label: '담백·전문가', sub: '수치/근거 중심' },
  { id: 'warm', label: '따뜻·진정성', sub: '경험 서사 강조' },
  { id: 'concise', label: '간결·결론먼저', sub: '두괄식·짧은 문단' },
];
