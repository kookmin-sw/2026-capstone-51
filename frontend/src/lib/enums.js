/**
 * 백엔드 ↔ 프론트 enum 매핑.
 *  - 백엔드 직렬화 형식은 실서버 OpenAPI + 백엔드 코드 기준 (노션 명세는 일부 outdated 라 신뢰 안 함).
 *  - JSON 직렬화 값은 일부 enum 이 한국어 풀네임/언더스코어 — 페이지에서 보내는 값과 100% 일치해야 함.
 *
 * 미해결 매핑은 PR#3 (페이지 빌드) 에서 처리:
 *   - KookminDepartment: 백엔드 @JsonValue 가 "단과대학 학과명" (한국어 풀네임) 반환.
 *     data/onboarding.js MAJORS 는 학과명만이라 풀네임 매핑 추가 필요.
 *   - JobFirst/Second/Third: 한국 표준직업분류 (한국어 + 언더스코어). 프론트 JOB_TREE 와 개념 다름.
 *     백엔드 정책 결정 후 어댑터 추가.
 */

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

export const EXPERIENCE_CATEGORY_OPTIONS = [
  { value: 'internal', label: '대내활동' },
  { value: 'activity', label: '대외활동' },
  { value: 'intern', label: '인턴' },
  { value: 'parttime', label: '알바' },
];

/* ──────────────────────────── Progress (자소서) ──────────────────────────── */
// 백엔드: FAIL | PASS | IN_PROGRESS

export const PROGRESS_LABEL = {
  IN_PROGRESS: '작성 중',
  PASS: '합격',
  FAIL: '불합격',
};

export const PROGRESS_TONE = {
  IN_PROGRESS: 'gray',
  PASS: 'green',
  FAIL: 'red',
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

/* ──────────────────────────────── 헬퍼 ──────────────────────────────── */

/** 백엔드 enum → 한글 라벨. 매핑 없으면 원본 그대로. */
export const labelize = (map, value) => map[value] ?? value ?? '';
