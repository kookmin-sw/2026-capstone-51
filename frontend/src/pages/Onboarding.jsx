import  { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';
import { MAJORS, JOB_TREE } from '../data/onboarding';
import { updateMyProfile } from '../api/users';
import { logApiError } from '../api/auth';

/**
 * 첫 로그인 후 1회만 거치는 온보딩.
 * 한 페이지에 모든 항목을 모아 보여주고, 하단의 "시작하기"로 /dashboard 로 이동.
 *
 * 항목:
 *   - 이름, 학번, 국민대 이메일(읽기 전용)
 *   - 전공 (단일 드롭다운)
 *   - 학년
 *   - 관심 직무 — 대분류 / 중분류 / 소분류 3단 드롭다운
 */
// JOB_TREE 키는 공백 대신 `_` 를 쓰고, 상위 컨텍스트가 붙은 항목은
// `상위__리프` 형태로 들어 있어 그대로 보여주면 가독성이 떨어진다.
// `상위__` 접두를 잘라낸 뒤 `_` 를 공백으로 치환해 라벨로 사용.
const formatJobLabel = (raw) => {
  if (!raw) return '';
  const idx = raw.lastIndexOf('__');
  const tail = idx >= 0 ? raw.slice(idx + 2) : raw;
  return tail.replace(/_/g, ' ');
};

// 옵션 키 배열을 `{ value, label }` 로 변환. value는 state에 저장될 원본 키.
const toLabeled = (keys) =>
  keys.map((k) => ({ value: k, label: formatJobLabel(k) }));

// 학년 — 화면 라벨과 서버 enum을 분리. state에 저장되는 값은 서버 enum 그대로라
// 그대로 API 요청에 실어 보내면 된다.
const YEAR_OPTIONS = [
  { value: 'FRESH_MAN', label: '1학년' },
  { value: 'SOPHOMORE', label: '2학년' },
  { value: 'JUNIOR', label: '3학년' },
  { value: 'SENIOR', label: '4학년' },
  { value: 'JOBSEEKER', label: '취업 준비중' },
  { value: 'WORKER', label: '취업자' },
];

export default function Onboarding() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: '',
    studentId: '',
    major: '',
    minor: '',
    year: '',
    gpa: '',
    jobL1: '',
    jobL2: '',
    jobL3: '',
  });
  // 어떤 필드를 사용자가 한번이라도 건드렸는지. 초기 진입에 빨갛게 도배되는 것 방지.
  const [touched, setTouched] = useState({});
  // "시작하기" 한번 누른 뒤엔 모든 필드 에러를 노출.
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setTouched((t) => ({ ...t, [k]: true }));
  };

  // 직무 트리 — 상위가 바뀌면 하위는 다시 고르도록 비워주고, 하위 touched도 해제
  // (placeholder 상태로 돌아가는 거라 아직 "건드린" 적 없는 셈).
  const onChangeL1 = (l1) => {
    setForm((f) => ({ ...f, jobL1: l1, jobL2: '', jobL3: '' }));
    setTouched((t) => ({ ...t, jobL1: true, jobL2: false, jobL3: false }));
  };
  const onChangeL2 = (l2) => {
    setForm((f) => ({ ...f, jobL2: l2, jobL3: '' }));
    setTouched((t) => ({ ...t, jobL2: true, jobL3: false }));
  };

  // 폼 값이 바뀔 때마다 자동으로 다시 계산되는 검증 결과.
  // 화면 표시는 touched/submitAttempted 로 한번 더 필터링한다.
  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = '이름을 입력하세요.';
    if (!form.studentId.trim()) e.studentId = '학번을 입력하세요.';
    if (!form.major) e.major = '전공을 선택하세요.';
    if (form.minor && form.minor === form.major)
      e.minor = '전공과 같은 학과를 부전공으로 선택할 수 없습니다.';
    if (!form.year) e.year = '학년을 선택하세요.';
    if (form.gpa === '' || form.gpa === null || form.gpa === undefined) {
      e.gpa = '학점을 입력하세요.';
    } else {
      const g = Number(form.gpa);
      if (Number.isNaN(g)) e.gpa = '학점은 숫자여야 합니다.';
      else if (g < 0 || g > 4.5) e.gpa = '학점은 0 ~ 4.5 사이여야 합니다.';
    }
    if (!form.jobL1) e.jobL1 = '대분류를 선택하세요.';
    if (!form.jobL2) e.jobL2 = '중분류를 선택하세요.';
    if (!form.jobL3) e.jobL3 = '소분류를 선택하세요.';
    return e;
  }, [form]);

  const showErr = (k) =>
    touched[k] || submitAttempted ? errors[k] : undefined;

  const l1Options = useMemo(() => toLabeled(Object.keys(JOB_TREE)), []);
  const l2Options = useMemo(
    () => toLabeled(Object.keys(JOB_TREE[form.jobL1] || {})),
    [form.jobL1]
  );
  const l3Options = useMemo(
    () => toLabeled((JOB_TREE[form.jobL1] || {})[form.jobL2] || []),
    [form.jobL1, form.jobL2]
  );

  const start = async () => {
    setSubmitAttempted(true);
    if (Object.values(errors).some(Boolean)) return;

    try {
      await updateMyProfile({
        userName: form.name.trim(),
        state: form.year, // 서버 enum (FRESH_MAN, SOPHOMORE, ...)
        score: Number(form.gpa),
        major: form.major,
        minor: form.minor || null,
        schoolNumber: form.studentId.trim(),
        jobFirst: form.jobL1,
        jobSecond: form.jobL2,
        jobThird: form.jobL3,
      });
      nav('/dashboard');
    } catch (err) {
      logApiError('프로필 업데이트 실패 (PUT /users/me)', err);
      alert('정보 저장에 실패했습니다. 다시 시도해 주세요.');
    }
  };
  const cancel = () => nav('/');

  return (
    <div className="min-h-screen bg-page flex flex-col justify-center items-center px-6 pt-10 pb-24">
      {/* 브랜드 */}
      <div className="flex items-center gap-1.5 mb-7 text-primary-900 font-bold text-[19px] tracking-tight">
        <img
          src="/logo2.svg"
          alt="Logi 로고"
          className="h-9 w-auto object-contain shrink-0"
        />
        Logi
      </div>

      <div className="w-full max-w-[920px] bg-paper border border-border rounded-xl shadow-md overflow-hidden">
        {/* 헤더 — 큼직하게 */}
        <div className="px-12 pt-12 pb-8 border-b border-ink-150">
          <h1 className="text-[30px] font-bold text-ink-900 tracking-tight leading-tight mb-2.5">
            Logi에 오신 걸 환영합니다
          </h1>
          <div className="text-[14px] text-ink-500 leading-relaxed max-w-[560px]">
            시작하기 전에 간단한 정보만 입력해 주세요.
            <br />
            자소서 작성·동기 비교·맞춤 추천에 자동으로 활용됩니다.
          </div>
        </div>

        {/* 본문 — 섹션별 그룹 */}
        <div className="px-12 pt-10 pb-4 grid gap-9">
          {/* 기본 정보 */}
          <Section title="기본 정보">
            <div className="grid grid-cols-2 gap-5">
              <Field label="이름" required error={showErr('name')}>
                <input
                  className="field text-[14px] py-2.5"
                  placeholder="홍길동"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                />
              </Field>
              <Field label="학번" required error={showErr('studentId')}>
                <input
                  className="field text-[14px] py-2.5"
                  placeholder="20221234"
                  value={form.studentId}
                  onChange={(e) => update('studentId', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* 학적 정보 */}
          <Section
            title="학적 정보"
            sub="같은 전공·학번 친구들과의 비교 통계에 활용됩니다."
          >
            <div className="grid grid-cols-2 gap-5">
              <Field label="전공" required error={showErr('major')}>
                <Select
                  value={form.major}
                  onChange={(v) => update('major', v)}
                  options={MAJORS}
                  placeholder="전공을 선택하세요"
                />
              </Field>
              <Field label="부전공" error={showErr('minor')}>
                <Select
                  value={form.minor}
                  onChange={(v) => update('minor', v)}
                  options={[
                    { value: '', label: '없음' },
                    ...MAJORS.map((m) => ({ value: m, label: m })),
                  ]}
                  placeholder="부전공을 선택하세요"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <Field label="학년" required error={showErr('year')}>
                <Select
                  value={form.year}
                  onChange={(v) => update('year', v)}
                  options={YEAR_OPTIONS}
                  placeholder="학년을 선택하세요"
                />
              </Field>
              <Field label="학점 (4.5 만점)" required error={showErr('gpa')}>
                <input
                  type="number"
                  className="field text-[14px] py-2.5"
                  placeholder="3.85"
                  min="0"
                  max="4.5"
                  step="0.01"
                  value={form.gpa}
                  onChange={(e) => update('gpa', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* 관심 직무 */}
          <Section
            title="관심 직무"
            sub="자소서 추천과 경험 분석에 활용됩니다. 추후 [내 정보]에서 수정할 수 있어요."
          >
            <div className="grid grid-cols-3 gap-5">
              <Field label="대분류" required error={showErr('jobL1')}>
                <Select
                  value={form.jobL1}
                  onChange={onChangeL1}
                  options={l1Options}
                  placeholder="대분류를 선택하세요"
                />
              </Field>
              <Field label="중분류" required error={showErr('jobL2')}>
                <Select
                  value={form.jobL2}
                  onChange={onChangeL2}
                  options={l2Options}
                  placeholder="중분류를 선택하세요"
                  disabled={!form.jobL1}
                />
              </Field>
              <Field label="소분류" required error={showErr('jobL3')}>
                <Select
                  value={form.jobL3}
                  onChange={(v) => update('jobL3', v)}
                  options={l3Options}
                  placeholder="소분류를 선택하세요"
                  disabled={!form.jobL2}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* 푸터 */}
        <div className="px-12 py-6 flex justify-between items-center gap-4 border-t border-ink-150 bg-ink-100">
          <div className="text-[12.5px] text-ink-500">
            입력한 정보는 언제든 [내 정보]에서 수정할 수 있어요.
          </div>
          <div className="flex gap-2">
            <button
              onClick={cancel}
              className="px-4 py-2 rounded-md text-[13px] font-semibold bg-paper border border-ink-200 text-ink-700 hover:bg-ink-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={start}
              className="px-5 py-2 rounded-md text-[13px] font-semibold bg-primary-900 border border-primary-900 text-white hover:bg-primary-800 transition-colors"
            >
              시작하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 빌딩블록 ---------- */

function Section({ title, sub, children }) {
  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-[15px] font-bold text-ink-900 tracking-tight">
          {title}
        </h2>
        {sub && <div className="text-[12.5px] text-ink-500 mt-1">{sub}</div>}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Field({ label, required, hint, error, children }) {
  // 에러/힌트 슬롯은 항상 같은 높이를 차지하도록 고정 — 에러가 떴다 사라져도
  // 입력 칸이 위아래로 흔들리지 않게 한다.
  return (
    <div className="grid gap-1.5">
      <label className="flex items-center gap-1 text-[12.5px] font-semibold text-ink-700">
        {label}
        {required && <span className="text-primary-600 font-bold">*</span>}
      </label>
      {children}
      <div
        className={cn(
          'text-[11.5px] leading-[16px] min-h-[16px]',
          error ? 'text-red-600' : 'text-ink-500'
        )}
      >
        {error || hint || ' '}
      </div>
    </div>
  );
}

/**
 * 표준 select. options 는 string[] 또는 {value,label}[].
 * placeholder가 주어지면 값이 비어있을 때 회색 안내 문구를 보여준다.
 * 우측에 chevron 아이콘 — appearance:none + custom indicator.
 */
function Select({ value, onChange, options, placeholder, disabled }) {
  const norm = options.map((o) =>
    typeof o === 'object' ? o : { value: o, label: o }
  );
  const isEmpty = value === '' || value === undefined || value === null;
  return (
    <div className="relative">
      <select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'field text-[14px] py-2.5 pr-9 cursor-pointer appearance-none',
          'bg-paper',
          isEmpty && 'text-ink-400',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        {placeholder !== undefined && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {norm.map((o) => (
          <option
            key={o.value}
            value={String(o.value)}
            className="text-ink-900"
          >
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
      />
    </div>
  );
}
