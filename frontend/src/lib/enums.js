/**
 * 백엔드 ↔ 프론트 enum 매핑.
 *  - 백엔드 직렬화 형식은 실서버 OpenAPI + 백엔드 코드 기준.
 *  - 한국어/언더스코어 enum 은 백엔드가 보낸 문자열 그대로 다시 보내야 함.
 *
 * 큰 정적 데이터(KookminDepartment 54 개, Job 트리 ~1,250 개)는
 * `./enums-data.js` 에서 생성하여 import.
 */

import { KOOKMIN_DEPARTMENTS, JOB_TREE_BACKEND } from './enums-data';

/* ─────────────────────────── ExperienceCategory ─────────────────────────── */
// 백엔드: INTERN | EXTERNAL | INTERNAL | PARTTIME (자격증은 별도 도메인이라 enum 에 없음)
// 프론트 mock 키: intern / activity / internal / parttime / cert

export const EXPERIENCE_CATEGORY_TO_FRONT = {
  INTERN: 'intern',
  EXTERNAL: 'activity',
  INTERNAL: 'internal',
  PARTTIME: 'parttime',
};

export const EXPERIENCE_CATEGORY_TO_BACK = Object.fromEntries(
  Object.entries(EXPERIENCE_CATEGORY_TO_FRONT).map(([k, v]) => [v, k])
);

export const EXPERIENCE_CATEGORY_LABEL = {
  intern: '인턴',
  activity: '대외활동',
  internal: '대내활동',
  parttime: '알바',
  cert: '자격증',
};

// 카테고리별 뱃지 톤 — 한 페이지에 여러 카테고리가 섞일 때 색으로 구분.
// 톤은 `src/index.css` 의 .badge-{gray|navy|green|red|amber} primitive 와 일치.
export const EXPERIENCE_CATEGORY_TONE = {
  intern: 'navy',
  activity: 'green',
  internal: 'amber',
  parttime: 'gray',
  cert: 'red',
};

export const EXPERIENCE_CATEGORY_OPTIONS = [
  { value: 'internal', label: '대내활동' },
  { value: 'activity', label: '대외활동' },
  { value: 'intern', label: '인턴' },
  { value: 'parttime', label: '알바' },
];

/* ──────────────────────────── Progress (자소서) ──────────────────────────── */
// 백엔드: FAIL | PASS | IN_PROGRESS

export const PROGRESS_LABEL = {
  IN_PROGRESS: '결과 대기',
  PASS: '합격',
  FAIL: '불합격',
};

export const PROGRESS_TONE = {
  IN_PROGRESS: 'gray',
  PASS: 'green',
  FAIL: 'red',
};

/* ──────────────────────── Difficulty (자격증 난이도) ──────────────────────── */
// 백엔드 CertificationCatalog.difficulty: HIGH | MEDIUM | LOW.
// `.badge-${tone}` primitive 와 일치하는 톤 (red/amber/gray).

export const DIFFICULTY_LABEL = {
  HIGH: '상',
  MEDIUM: '중',
  LOW: '하',
};

export const DIFFICULTY_TONE = {
  HIGH: 'red',
  MEDIUM: 'amber',
  LOW: 'gray',
};

/* ───────────────────────── State (사용자 현재 상태) ───────────────────────── */
// 백엔드: FRESH_MAN | SOPHOMORE | JUNIOR | SENIOR | JOBSEEKER | WORKER

export const STATE_LABEL = {
  FRESH_MAN: '1학년',
  SOPHOMORE: '2학년',
  JUNIOR: '3학년',
  SENIOR: '4학년',
  JOBSEEKER: '취업 준비중',
  WORKER: '취업자',
};

export const STATE_OPTIONS = Object.entries(STATE_LABEL).map(
  ([value, label]) => ({ value, label })
);

/* ───────────────────────── 통계 비교 그룹 (groupBy) ───────────────────────── */
// 백엔드 /users/me/stats?groupBy= 의 enum: STATE | SCHOOL_NUM | WORKER

export const STATS_GROUP_LABEL = {
  STATE: '같은 상태',
  SCHOOL_NUM: '같은 학번',
  WORKER: '취업자',
};

/* ─────────────────── Statistics 백엔드 키 ↔ 프론트 키 매핑 ─────────────────── */
// 백엔드 Statistics 응답: { partTime, external, internal, license, intern }
// 프론트 5축 키 (CAT_LABELS / MOCK 들과 일관): { parttime, activity, internal, cert, intern }
// (ExperienceCategory enum 의 EXTERNAL→activity 매핑과 동일한 어휘를 통계에서도 유지.)

export const STATS_BACK_TO_FRONT = {
  partTime: 'parttime',
  external: 'activity',
  internal: 'internal',
  license: 'cert',
  intern: 'intern',
};

/** 백엔드 Statistics 객체 → 프론트 5축 record 매핑.
 * pick: 'avg' | 'userCount' | 'myCount' (CategoryStat 의 어떤 필드를 꺼낼지).
 * 없는 키는 0. */
export const pickStat = (statistics, pick) => {
  const out = {};
  if (!statistics) return out;
  for (const [back, front] of Object.entries(STATS_BACK_TO_FRONT)) {
    out[front] = statistics[back]?.[pick] ?? 0;
  }
  return out;
};

/** 백엔드 WeakPoint.type 을 프론트 카테고리 라벨로 정규화.
 * 알 수 없는 값은 그대로 반환 (백엔드가 한글 카테고리명을 직접 줄 수도 있어서). */
export const weakPointLabel = (type) => {
  if (!type) return '';
  // 백엔드가 enum 키(PARTTIME 등)를 줄 경우
  const exp = EXPERIENCE_CATEGORY_TO_FRONT[type];
  if (exp) return EXPERIENCE_CATEGORY_LABEL[exp];
  if (type === 'LICENSE' || type === 'license')
    return EXPERIENCE_CATEGORY_LABEL.cert;
  // 백엔드 stats 키(partTime/external/...) 일 경우
  const front = STATS_BACK_TO_FRONT[type];
  if (front) return EXPERIENCE_CATEGORY_LABEL[front];
  return type;
};

/* ──────────────────────── KookminDepartment ──────────────────────── */
// 백엔드 직렬화 값 = '단과대학 학과명' (또는 단과대학만). KOOKMIN_DEPARTMENTS 의
// 'value' 가 그 직렬화 값이라 select 의 value 로 그대로 사용해 PUT 으로 보내면 됨.

export { KOOKMIN_DEPARTMENTS } from './enums-data';

// dropdown 용 옵션. department 가 있으면 학과명만 라벨, 없으면 단과대 자체.
export const KOOKMIN_DEPT_OPTIONS = KOOKMIN_DEPARTMENTS.map((d) => ({
  value: d.value,
  label: d.department || d.college,
  group: d.college,
}));

// enum key (예: 'SW_SOFTWARE') → 한글 라벨 ('소프트웨어학부'). 매치 안 되면 원본 그대로.
const KOOKMIN_DEPT_LABEL = Object.fromEntries(
  KOOKMIN_DEPARTMENTS.map((d) => [d.value, d.department || d.college])
);
export const kookminDeptLabel = (value) =>
  value ? (KOOKMIN_DEPT_LABEL[value] ?? value) : '';

// 단과대 그룹 순서 (KOOKMIN_DEPARTMENTS 등장 순서 유지).
export const KOOKMIN_COLLEGES = (() => {
  const seen = new Set();
  const list = [];
  for (const d of KOOKMIN_DEPARTMENTS) {
    if (!seen.has(d.college)) {
      seen.add(d.college);
      list.push(d.college);
    }
  }
  return list;
})();

/* ────────────────────────── 직무 트리 (Job*) ────────────────────────── */
// 백엔드 한국 표준직업분류 enum 3 단 트리. enum 이름 자체가 직렬화 값.

export { JOB_TREE_BACKEND } from './enums-data';

export const JOB_FIRST_OPTIONS = Object.keys(JOB_TREE_BACKEND).map((k) => ({
  value: k,
  label: humanizeEnum(k),
}));

export const jobSecondOptions = (jobFirst) => {
  if (!jobFirst) return [];
  const seconds = JOB_TREE_BACKEND[jobFirst] || {};
  return Object.keys(seconds).map((k) => ({
    value: k,
    label: humanizeEnum(k),
  }));
};

export const jobThirdOptions = (jobFirst, jobSecond) => {
  if (!jobFirst || !jobSecond) return [];
  const thirds = JOB_TREE_BACKEND[jobFirst]?.[jobSecond] || [];
  return thirds.map((k) => ({ value: k, label: humanizeEnum(k) }));
};

/* ──────────────────────────────── 헬퍼 ──────────────────────────────── */

/** 백엔드 enum → 한글 라벨. 매핑 없으면 원본 그대로. */
export const labelize = (map, value) => map[value] ?? value ?? '';

/**
 * Job enum 같이 한글 + 언더스코어 형태를 사람이 읽기 좋게:
 *  - 언더스코어를 가운뎃점(·)으로 치환
 *  - 빈 값/null 은 빈 문자열로
 */
export function humanizeEnum(value) {
  if (!value) return '';
  return String(value).replaceAll('_', '·');
}
