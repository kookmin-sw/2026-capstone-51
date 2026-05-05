// 사용자 프로필.
// 대시보드 헤더, 내 정보 페이지에서 공통으로 사용.

export const PROFILE = {
  name: '한혜민',
  initial: '한',
  univ: '국민대학교',
  major: '소프트웨어학부',
  status: '4학년 재학',
  studentId: '2022xxxx / 4학년',
  minor: '경영정보학과 (부전공)',
  gpaMasked: '●●●●',
  gpaMax: 4.5,
  hopeJobs: '백엔드 개발자, DevOps',
};

// 자기소개 — 1문장 / 3문장 / 5문장
export const INTRO_TEXTS = {
  1: '저는 클라우드 인프라에 관심이 많은 국민대 소프트웨어학부 4학년 한혜민입니다.',
  3: '저는 클라우드 인프라에 관심이 많은 국민대 소프트웨어학부 4학년 한혜민입니다. 학부 동아리에서 백엔드 리드를 맡으며 실서비스 트래픽을 처리해본 경험이 있고, 캡스톤 프로젝트에서는 AWS 기반 자동 배포 파이프라인을 구축했습니다.',
  5: '저는 클라우드 인프라에 관심이 많은 국민대 소프트웨어학부 4학년 한혜민입니다. 학부 동아리에서 백엔드 리드를 맡으며 실서비스 트래픽을 처리해본 경험이 있고, 캡스톤 프로젝트에서는 AWS 기반 자동 배포 파이프라인을 구축했습니다. 단순히 만드는 데서 끝나지 않고 운영·문서화까지 책임지는 것을 좋아합니다. 동료의 시간을 시스템으로 만들어주는 일에 보람을 느낍니다. 졸업 후에는 안정적인 백엔드 인프라를 책임지는 엔지니어로 성장하고 싶습니다.',
};

// 포트폴리오 / 외부 링크
export const PROFILE_LINKS = [
  {
    mark: 'GH',
    label: 'GitHub',
    sub: 'github.com/hyemin-han',
    status: 'OAuth 연결됨',
    connected: true,
  },
  {
    mark: 'N',
    label: '노션 포트폴리오',
    sub: 'hyemin.notion.site',
    status: '편집',
    connected: true,
  },
  {
    mark: 'in',
    label: 'LinkedIn',
    sub: '미연결',
    status: '+ 연결',
    connected: false,
  },
  {
    mark: 'B',
    label: '기술 블로그',
    sub: '미연결',
    status: '+ 연결',
    connected: false,
  },
];
