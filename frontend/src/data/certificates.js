// 자격증 store — 페이지 간 공유.
// 기본 데이터 + 구독/추가/수정/삭제.

const INITIAL = [
  {
    id: 1,
    name: '정보처리기사',
    issuer: '한국산업인력공단',
    grade: '필기 합격',
    date: '2025.05.20',
    status: 'progress',
    tag: 'IT',
    expiry: null,
    code: '25-IT-0432',
    memo: '',
  },
  {
    id: 2,
    name: 'SQLD (SQL 개발자)',
    issuer: '한국데이터산업진흥원',
    grade: '합격',
    date: '2024.11.10',
    status: 'done',
    tag: 'IT/DB',
    expiry: '2026.11.09',
    code: 'SQLD-241110-A',
    memo: '',
  },
  {
    id: 3,
    name: 'TOEIC',
    issuer: 'ETS / YBM',
    grade: '885점',
    date: '2025.02.15',
    status: 'done',
    tag: '어학',
    expiry: '2027.02.14',
    code: '20250215-TC-885',
    memo: '',
  },
  {
    id: 4,
    name: 'OPIc',
    issuer: 'ACTFL / 크레듀',
    grade: 'IH (Intermediate High)',
    date: '2025.01.18',
    status: 'done',
    tag: '어학',
    expiry: '2027.01.17',
    code: '20250118-OP-IH',
    memo: '',
  },
  {
    id: 5,
    name: 'AWS Certified Cloud Practitioner',
    issuer: 'Amazon Web Services',
    grade: '합격 (812점)',
    date: '2024.09.04',
    status: 'done',
    tag: 'IT/클라우드',
    expiry: '2027.09.03',
    code: 'AWS-CCP-...4F2',
    memo: '',
  },
  {
    id: 6,
    name: '컴퓨터활용능력 1급',
    issuer: '대한상공회의소',
    grade: '실기 응시 예정',
    date: '2026.05.08 (예정)',
    status: 'planned',
    tag: '사무',
    expiry: null,
    code: '예정',
    memo: '',
  },
];

let CERTIFICATES = INITIAL;

export const certStore = (() => {
  const subs = new Set();
  return {
    list: () => CERTIFICATES,
    subscribe: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    notify: () => subs.forEach((fn) => fn()),
    add: (c) => {
      const id = (CERTIFICATES.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1;
      CERTIFICATES = [{ ...c, id }, ...CERTIFICATES];
      certStore.notify();
      return id;
    },
    update: (id, patch) => {
      CERTIFICATES = CERTIFICATES.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      );
      certStore.notify();
    },
    remove: (id) => {
      CERTIFICATES = CERTIFICATES.filter((c) => c.id !== id);
      certStore.notify();
    },
    get: (id) => CERTIFICATES.find((c) => c.id === id),
  };
})();

// 자격증 페이지 — 분야 필터 순서
export const TAG_ORDER = ['전체', 'IT', 'IT/DB', 'IT/클라우드', '어학', '사무'];
