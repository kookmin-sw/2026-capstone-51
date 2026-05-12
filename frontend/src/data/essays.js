// 자소서 데이터.
// status:
//   'writing'   — 작성 중
//   'submitted' — 제출 완료. result: 'pending' | 'pass' | 'fail'
// 각 자소서는 회사·직무·공통 요구사항·질문 배열을 가짐.
// 질문은 { id, title, limit, used, draft }. used 는 experience id 배열 (essays.js → experiences.js).

export const ESSAYS = [
  {
    id: 1,
    co: '카카오',
    job: '2026 상반기 신입 · 백엔드',
    requirements:
      '백엔드 시스템 설계 경험, 동료 코드 리뷰 문화, 도전 정신을 갖춘 인재',
    prog: 2,
    total: 3,
    dday: 'D-2',
    status: 'writing',
    updated: '2일 전',
    questions: [
      {
        id: 1,
        title: '지원 동기와 입사 후 포부를 작성해주세요.',
        limit: 800,
        used: ['cap'],
        draft:
          '저는 "끝까지 책임지는 협업 능력"을 강점으로 가진 백엔드 개발자입니다.\n\n' +
          '학부 캡스톤 디자인에서 5명 팀의 백엔드 리드를 맡으며 GitHub Actions와 AWS ECS Fargate를 ' +
          '조합한 무중단 배포 파이프라인을 설계했습니다. 배포 시간을 30분에서 4분으로 단축하면서 ' +
          '동시에 롤백 절차를 표준화했습니다.\n\n' +
          '카카오에서도 "함께 자라는" 가치관에 맞춰, 시스템으로 동료의 시간을 만들어주는 백엔드 ' +
          '엔지니어가 되고 싶습니다.',
      },
      {
        id: 2,
        title:
          '지원자가 가진 강점과 그것을 보여줄 수 있는 경험을 구체적으로 서술해주세요.',
        limit: 1000,
        used: ['cap', 'kmu'],
        draft:
          '제가 가진 가장 큰 강점은 시스템적 사고와 문서화 습관입니다.\n\n' +
          '학부 학회 KMUSEC에서 백엔드 리드로 활동하며 회원 권한·출석 시스템을 12주 안에 구축했고, ' +
          '운영 12개월 동안 다운타임 0를 유지했습니다. 7명의 백엔드 코드 리뷰를 진행하면서 ' +
          '리뷰 가이드라인을 문서로 표준화했고, 후임 리드가 그대로 이어받아 운영할 수 있는 체계를 ' +
          '남겼습니다.',
      },
      {
        id: 3,
        title: '실패 경험과 그로부터 배운 점을 서술해주세요.',
        limit: 800,
        used: [],
        draft: '',
      },
    ],
  },
  {
    id: 2,
    co: '네이버',
    job: '신입 공채 · 클라우드 엔지니어',
    requirements: '클라우드 인프라 운영 경험, 자동화에 대한 관심',
    prog: 1,
    total: 4,
    dday: 'D-9',
    status: 'writing',
    updated: '어제',
    questions: [],
  },
  {
    id: 3,
    co: '토스',
    job: '하계 인턴 · 서버 개발',
    requirements: '실용적 문제 해결, 빠른 학습 능력',
    prog: 0,
    total: 2,
    dday: 'D-21',
    status: 'writing',
    updated: '5일 전',
    questions: [],
  },
  {
    id: 4,
    co: '우아한형제들',
    job: '2025 동계 인턴 · 백엔드',
    requirements: '서비스 개발 경험, 협업 능력',
    prog: 1,
    total: 1,
    dday: '제출 완료',
    status: 'submitted',
    result: 'pending',
    updated: '3주 전',
    questions: [],
  },
  {
    id: 5,
    co: '카카오뱅크',
    job: '2025 하반기 · 백엔드',
    requirements: '금융 서비스에 대한 이해, 안정성 중심 개발 경험',
    prog: 1,
    total: 1,
    dday: '제출 완료',
    status: 'submitted',
    result: 'pass',
    updated: '2개월 전',
    questions: [],
  },
  {
    id: 6,
    co: '라인플러스',
    job: '2025 하반기 · 클라우드',
    requirements: '글로벌 서비스 운영, 인프라 자동화',
    prog: 1,
    total: 1,
    dday: '제출 완료',
    status: 'submitted',
    result: 'fail',
    updated: '3개월 전',
    questions: [],
  },
];

/* ---- 추천 경험 (LLM mock) ---- */
// match — 유사도 점수. 정렬 기준.
// 상위 2개를 자동 선택 (LLM 추천)으로 처리.
export const RECOMMENDED = [
  {
    id: 'cap',
    expId: 1,
    title: '캡스톤디자인 — AWS 기반 배포 자동화',
    cat: '대내활동',
    dur: '2025.09 ~ 2026.01',
    tags: '"문제해결 + 리더십"',
    match: 92,
  },
  {
    id: 'kmu',
    expId: 3,
    title: '학회 KMUSEC — 백엔드 리드',
    cat: '대내활동',
    dur: '2024.03 ~ 2025.02',
    tags: '"협업"',
    match: 78,
  },
  {
    id: 'lab',
    expId: 2,
    title: '○○대학원 연구실 인턴 — 데이터 파이프라인',
    cat: '인턴',
    dur: '2025.04 ~ 2025.06',
    tags: '"기술적 문제 해결" 관점 보강',
    match: 54,
  },
  {
    id: 'pwa',
    expId: null,
    title: '개인 프로젝트 — 가계부 PWA 앱',
    cat: '대내활동',
    dur: '2024.06 ~ 2024.08',
    tags: '"주도성 / 완주" 관점',
    match: 42,
  },
  {
    id: 'pt',
    expId: 6,
    title: '편의점 야간 아르바이트',
    cat: '알바',
    dur: '2024.06 ~ 2024.08',
    tags: '"성실성 / 책임감"',
    match: 31,
  },
  {
    id: 'sw',
    expId: 4,
    title: 'SW 멘토링 봉사 — 중학생 코딩 멘토',
    cat: '대외활동',
    dur: '2025.07 ~ 진행중',
    tags: '"커뮤니케이션 / 교육"',
    match: 24,
  },
];

/* ---- 초안 생성 mock ---- */
// 실제로는 LLM 호출. 여기서는 선택된 경험들의 매칭 합과 요구사항 길이 등에 따라
// 다른 톤의 초안을 반환.
export function mockGenerateDraft({ question, picked, requirements }) {
  const exps = RECOMMENDED.filter((r) => picked.includes(r.id));
  const expSummary = exps.map((e) => `[${e.title}]`).join(', ');
  const tone =
    requirements && requirements.trim()
      ? '\n\n(반영된 추가 요구사항: ' + requirements.trim() + ')'
      : '';

  return (
    `${question || '문항'}에 대한 답변입니다.\n\n` +
    `저는 "끝까지 책임지는 협업 능력"을 강점으로 가진 백엔드 개발자입니다. ` +
    `핵심 경험으로 ${expSummary || '캡스톤'}을 통해 시스템 설계와 협업 경험을 쌓았습니다.\n\n` +
    `학부 캡스톤 디자인에서 5명 팀의 백엔드 리드를 맡으며 GitHub Actions와 AWS ECS Fargate를 ` +
    `조합한 무중단 배포 파이프라인을 설계했습니다. 배포 시간을 30분에서 4분으로 단축했고, ` +
    `롤백 절차를 표준화했습니다.\n\n` +
    `이러한 경험을 바탕으로, 시스템으로 동료의 시간을 만들어주는 엔지니어가 되겠습니다.` +
    tone
  );
}
