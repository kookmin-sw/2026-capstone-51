import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';
import { MAJORS, JOB_TREE } from '../data/onboarding';

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
export default function Onboarding() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: '',
    studentId: '',
    major: '소프트웨어학부',
    minor: '',
    year: 4,
    gpa: '',
    jobL1: 'IT·개발',
    jobL2: '엔지니어링',
    jobL3: '백엔드 엔지니어',
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // 직무 트리 — 상위 변경 시 하위 자동 보정
  const onChangeL1 = (l1) => {
    const l2Keys = Object.keys(JOB_TREE[l1] || {});
    const nextL2 = l2Keys[0];
    const nextL3 = (JOB_TREE[l1] || {})[nextL2]?.[0];
    setForm((f) => ({ ...f, jobL1: l1, jobL2: nextL2, jobL3: nextL3 }));
  };
  const onChangeL2 = (l2) => {
    const nextL3 = (JOB_TREE[form.jobL1] || {})[l2]?.[0];
    setForm((f) => ({ ...f, jobL2: l2, jobL3: nextL3 }));
  };

  const l1Options = useMemo(() => Object.keys(JOB_TREE), []);
  const l2Options = useMemo(
    () => Object.keys(JOB_TREE[form.jobL1] || {}),
    [form.jobL1]
  );
  const l3Options = useMemo(
    () => (JOB_TREE[form.jobL1] || {})[form.jobL2] || [],
    [form.jobL1, form.jobL2]
  );

  const start = () => nav('/dashboard');
  const cancel = () => nav('/');

  return (
    <div className="min-h-screen bg-page flex flex-col items-center px-6 pt-10 pb-24">
      {/* 브랜드 */}
      <div className="flex items-center gap-2.5 mb-7 text-primary-900 font-bold text-[19px] tracking-tight">
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
            <div className="grid grid-cols-2 gap-5">
              <Field label="전공" required>
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
            <div className="grid grid-cols-2 gap-5">
              <Field label="학년" required>
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
              <Field label="학점 (4.5 만점)" required>
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
              <Field label="대분류" required>
                <Select
                  value={form.jobL1}
                  onChange={onChangeL1}
                  options={l1Options}
                />
              </Field>
              <Field label="중분류" required>
                <Select
                  value={form.jobL2}
                  onChange={onChangeL2}
                  options={l2Options}
                />
              </Field>
              <Field label="소분류" required>
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
