import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';
import Combobox from '../components/Combobox';
import DeptCascadeSelect from '../components/DeptCascadeSelect';
import {
  STATE_OPTIONS,
  JOB_FIRST_OPTIONS,
  jobSecondOptions,
  jobThirdOptions,
} from '../lib/enums';
import { useUpdateMe } from '../api/queries/useMe';
import { toast } from '../store/useToast';

/**
 * 첫 로그인 후 1회만 거치는 온보딩.
 * 한 페이지에 모든 항목을 모아 보여주고, 하단의 "시작하기"로 PUT /users/me 후 /dashboard 이동.
 *
 * 필수: 이름(2자+), 학번(8자리 숫자), 전공, 현재상태, 학점(0~4.5), 희망직무 대/중/소.
 * 옵셔널: 부전공.
 * 부전공은 전공과 동일하게 선택 불가 (옵션 자체에서 제외).
 * 검증 실패는 인라인 에러로 노출.  최초 "시작하기" 클릭 후부터 라이브 검증.
 *
 * 백엔드 매핑:
 *  - userName ← name (trim)
 *  - schoolNumber ← studentId
 *  - state ← STATE_OPTIONS value 그대로 (FRESH_MAN | SOPHOMORE | JUNIOR | SENIOR | JOBSEEKER | WORKER)
 *  - score ← parseFloat(gpa) (없으면 null)
 *  - major ← KookminDepartment 직렬화 값
 *  - minor ← KookminDepartment 직렬화 값 또는 null
 *  - jobFirst/Second/Third ← 한국 표준직업분류 enum 값 그대로
 */
export default function Onboarding() {
  const nav = useNavigate();
  const updateMe = useUpdateMe();

  const [form, setForm] = useState({
    name: '',
    studentId: '',
    state: '',
    major: '',
    minor: '',
    gpa: '',
    jobFirst: '',
    jobSecond: '',
    jobThird: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const errors = submitted ? validate(form) : {};

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // 전공 변경: 부전공이 같아지면 부전공 비움
  const onChangeMajor = (v) =>
    setForm((f) => ({ ...f, major: v, minor: f.minor === v ? '' : f.minor }));

  // 직무 트리: 상위 변경 시 하위 초기화
  const onChangeJobFirst = (v) =>
    setForm((f) => ({ ...f, jobFirst: v, jobSecond: '', jobThird: '' }));
  const onChangeJobSecond = (v) =>
    setForm((f) => ({ ...f, jobSecond: v, jobThird: '' }));

  const seconds = useMemo(
    () => jobSecondOptions(form.jobFirst),
    [form.jobFirst]
  );
  const thirds = useMemo(
    () => jobThirdOptions(form.jobFirst, form.jobSecond),
    [form.jobFirst, form.jobSecond]
  );

  const start = () => {
    setSubmitted(true);
    const e = validate(form);
    if (Object.keys(e).length > 0) {
      toast.error('입력값을 다시 확인해주세요.');
      return;
    }
    if (updateMe.isPending) return;

    const score = form.gpa === '' ? null : Number.parseFloat(form.gpa);
    const body = {
      userName: form.name.trim(),
      schoolNumber: form.studentId.trim(),
      state: form.state,
      score: Number.isFinite(score) ? score : null,
      major: form.major,
      minor: form.minor || null,
      jobFirst: form.jobFirst,
      jobSecond: form.jobSecond,
      jobThird: form.jobThird,
    };

    updateMe.mutate(body, {
      onSuccess: () => {
        toast.success('회원가입이 완료되었습니다.');
        nav('/dashboard', { replace: true });
      },
      onError: (err) => {
        toast.error(
          err?.apiMessage ||
            '정보 저장 중 오류가 발생했습니다. 다시 시도해주세요.'
        );
      },
    });
  };

  // 취소 = 회원가입 중단. 인덱스('/')는 /dashboard 로 redirect 되므로 명시적으로 /landing 으로.
  const cancel = () => nav('/landing');

  return (
    <div className="min-h-screen bg-page flex flex-col items-center px-4 sm:px-6 pt-8 sm:pt-10 pb-16 sm:pb-24">
      {/* 브랜드 */}
      <div className="flex items-center gap-2.5 mb-6 sm:mb-7 text-primary-900 font-bold text-[18px] sm:text-[19px] tracking-tight">
        <span className="grid place-items-center w-8 h-8 rounded-md bg-primary-900 text-white">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 4v16M5 20h12"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="18" cy="7" r="2" fill="currentColor" />
          </svg>
        </span>
        Logi
      </div>

      <div className="w-full max-w-[920px] bg-paper border border-border rounded-xl shadow-md overflow-hidden">
        {/* 헤더 — 큼직하게 */}
        <div className="px-6 sm:px-10 lg:px-12 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 border-b border-ink-150">
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-bold text-ink-900 tracking-tight leading-tight mb-2 sm:mb-2.5">
            Logi에 오신 걸 환영합니다
          </h1>
          <div className="text-[13px] sm:text-[14px] text-ink-500 leading-relaxed max-w-[560px] break-keep">
            시작하기 전에 간단한 정보만 입력해 주세요. 자소서 작성·동기
            비교·맞춤 추천에 자동으로 활용됩니다.
          </div>
        </div>

        {/* 본문 — 섹션별 그룹 */}
        <div className="px-6 sm:px-10 lg:px-12 pt-8 sm:pt-10 pb-4 grid gap-7 sm:gap-9">
          {/* 기본 정보 */}
          <Section title="기본 정보">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <Field label="이름" required>
                <input
                  className="field text-[14px] py-2.5"
                  placeholder="홍길동"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                />
              </Field>
              <Field label="학번" required>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <Field label="전공">
                <Select
                  value={form.major}
                  onChange={(v) => update('major', v)}
                  options={MAJORS}
                />
              </Field>
              <Field label="부전공">
                <Select
                  value={form.minor}
                  onChange={(v) => update('minor', v)}
                  options={[
                    { value: '', label: '없음' },
                    ...MAJORS.map((m) => ({ value: m, label: m })),
                  ]}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <Field label="학년">
                <Select
                  value={form.year}
                  onChange={(v) => update('year', +v)}
                  options={[
                    { value: 1, label: '1학년' },
                    { value: 2, label: '2학년' },
                    { value: 3, label: '3학년' },
                    { value: 4, label: '4학년' },
                    { value: 5, label: '초과학기' },
                  ]}
                />
              </Field>
              <Field label="학점 (4.5 만점)">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              <Field label="대분류">
                <Select
                  value={form.jobL1}
                  onChange={onChangeL1}
                  options={l1Options}
                />
              </Field>
              <Field label="중분류">
                <Select
                  value={form.jobL2}
                  onChange={onChangeL2}
                  options={l2Options}
                />
              </Field>
              <Field label="소분류">
                <Select
                  value={form.jobL3}
                  onChange={(v) => update('jobL3', v)}
                  options={l3Options}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* 푸터 */}
        <div className="px-6 sm:px-10 lg:px-12 py-5 sm:py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 border-t border-ink-150 bg-ink-100">
          <div className="text-[12px] sm:text-[12.5px] text-ink-500 break-keep">
            입력한 정보는 언제든 [내 정보]에서 수정할 수 있어요.
          </div>
          <div className="flex gap-2 sm:shrink-0">
            <button
              type="button"
              onClick={cancel}
              disabled={updateMe.isPending}
              className="flex-1 sm:flex-none px-4 py-2 rounded-md text-[13px] font-semibold bg-paper border border-ink-200 text-ink-700 hover:bg-ink-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="button"
              onClick={start}
              disabled={updateMe.isPending}
              className="flex-1 sm:flex-none px-5 py-2 rounded-md text-[13px] font-semibold bg-primary-900 border border-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {updateMe.isPending ? '저장 중…' : '시작하기'}
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

function Field({ label, required, hint, children }) {
  return (
    <div className="grid gap-1.5">
      <label className="flex items-center gap-1 text-[12.5px] font-semibold text-ink-700">
        {label}
        {required && <span className="text-primary-600 font-bold">*</span>}
      </label>
      {children}
      {hint && <div className="text-[11.5px] text-ink-500 mt-0.5">{hint}</div>}
    </div>
  );
}

/**
 * 표준 select. options 는 string[] 또는 {value,label}[].
 * 우측에 chevron 아이콘 — appearance:none + custom indicator.
 */
function Select({ value, onChange, options }) {
  const norm = options.map((o) =>
    typeof o === 'object' ? o : { value: o, label: o }
  );
  return (
    <div className="relative">
      <select
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'field text-[14px] py-2.5 pr-9 cursor-pointer appearance-none',
          'bg-paper'
        )}
      >
        {norm.map((o) => (
          <option key={o.value} value={String(o.value)}>
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
