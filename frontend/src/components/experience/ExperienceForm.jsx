import { useState } from 'react';
import { cn } from '../../lib/cn';
import DatePicker from '../DatePicker';
import Combobox from '../Combobox';
import {
  EXPERIENCE_CATEGORY_OPTIONS,
  EXPERIENCE_CATEGORY_TO_FRONT,
  EXPERIENCE_CATEGORY_TO_BACK,
  KOOKMIN_DEPT_OPTIONS,
  STATE_OPTIONS,
} from '../../lib/enums';

/**
 * 경험 작성/수정 공용 폼.
 *
 * Props:
 *   - initialValue?: { experienceCategory(BE enum), stateAtCreation(BE State enum),
 *                     relatedMajor, experienceTitle,
 *                     startDate(YYYY-MM-DD), endDate, starStructure: {s,t,a,r} }
 *   - onSubmit(body): 백엔드 ExperienceRequest 형식으로 호출.
 *   - onCancel()
 *   - isPending: mutation 진행 중인지
 *   - submitLabel: 버튼 텍스트
 *
 * 검증 (4/27 디자인 + swagger 제약):
 *   - 카테고리 / 경험 당시 학년 / 관련 전공 / 제목 / 시작일 / 종료일 / STAR 4항목 모두 필수
 *   - 제목 200자
 *   - 시작일 ≤ 종료일
 *   - 시작일·종료일 모두 오늘까지만 (백엔드 @PastOrPresent 제약 — DatePicker max 로도 차단)
 *
 * 관련 전공은 Combobox 로 KookminDepartment 54 개 중 단일 선택. null/빈값 비허용 (필수).
 *
 * stateAtCreation 은 "경험 당시" 학년/상태 (지금 학년이 아님). 백엔드 약점 추천이
 * 같은 학년 시점 기준으로 비교하기 위해 명시 필드로 받음 (자동 추정 X — 사용자 입학년도·휴학 이력 미보유).
 *
 * 4/27 회의록의 "역할 / 간단 요약 / 희망 직무" 필드는 백엔드 스키마 미반영 →
 * 추가 시점까지 폼에 포함하지 않음 (PROJECT_STATUS.md 백엔드 의존 항목 참조).
 *
 * 첫 "저장" 클릭 후부터 라이브 검증.
 */
export default function ExperienceForm({
  initialValue,
  onSubmit,
  onCancel,
  isPending,
  submitLabel = '저장',
}) {
  const [form, setForm] = useState(() => toDraft(initialValue));
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validate(form) : {};

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const updateStar = (k, v) =>
    setForm((f) => ({ ...f, star: { ...f.star, [k]: v } }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(form);
    if (Object.keys(errs).length > 0) return;
    if (isPending) return;
    onSubmit(toBody(form));
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {/* 카테고리 */}
      <Section title="카테고리" required error={errors.category}>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update('category', opt.value)}
              className={cn(
                'px-3.5 py-2 rounded-md text-[13px] font-semibold border transition-colors',
                form.category === opt.value
                  ? 'bg-primary-50 border-primary-600 text-primary-800'
                  : 'bg-paper border-ink-200 text-ink-700 hover:bg-ink-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      {/* 기본 정보 */}
      <Section title="기본 정보">
        <div className="grid gap-4">
          <Field label="제목" required error={errors.title}>
            <input
              className={cn(
                'field text-[14px] py-2.5',
                errors.title && 'border-red-500 focus:border-red-500'
              )}
              placeholder="경험을 한눈에 알아볼 수 있는 제목을 입력하세요"
              maxLength={200}
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="관련 전공"
              required
              error={errors.relatedMajor}
              hint="이 경험과 가장 관련 있는 전공을 선택하세요."
            >
              <Combobox
                value={form.relatedMajor}
                onChange={(v) => update('relatedMajor', v)}
                options={KOOKMIN_DEPT_OPTIONS}
                placeholder="전공 선택"
                searchPlaceholder="단과대 / 학과 검색"
                hasError={!!errors.relatedMajor}
              />
            </Field>
            <Field
              label="경험 당시 학년"
              required
              error={errors.stateAtCreation}
              hint="지금 학년이 아니라, 이 경험을 시작했을 때의 학년/상태를 선택하세요."
            >
              <Combobox
                value={form.stateAtCreation}
                onChange={(v) => update('stateAtCreation', v)}
                options={STATE_OPTIONS}
                placeholder="선택"
                searchable={false}
                hasError={!!errors.stateAtCreation}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="시작일" required error={errors.startDate}>
              <DatePicker
                value={form.startDate}
                onChange={(v) => update('startDate', v)}
                placeholder="시작일 선택"
                hasError={!!errors.startDate}
                max={todayIso()}
              />
            </Field>
            <Field label="종료일" required error={errors.endDate}>
              <DatePicker
                value={form.endDate}
                onChange={(v) => update('endDate', v)}
                placeholder="종료일 선택"
                hasError={!!errors.endDate}
                min={form.startDate || undefined}
                max={todayIso()}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* 활동 내용 (STAR) */}
      <Section
        title="활동 내용 (STAR)"
        sub="자소서 추천에 활용됩니다. 가능한 구체적으로 작성해주세요."
      >
        <div className="grid gap-4">
          <StarField
            label="Situation"
            sub="어떤 상황·배경이었는지"
            placeholder="활동 배경과 당시 상황을 입력하세요"
            value={form.star.s}
            onChange={(v) => updateStar('s', v)}
            error={errors.starS}
          />
          <StarField
            label="Task"
            sub="어떤 과제·목표가 주어졌는지"
            placeholder="내가 맡은 과제나 책임을 입력하세요"
            value={form.star.t}
            onChange={(v) => updateStar('t', v)}
            error={errors.starT}
          />
          <StarField
            label="Action"
            sub="구체적으로 어떤 행동을 했는지"
            placeholder="문제를 해결하기 위해 한 행동을 입력하세요"
            value={form.star.a}
            onChange={(v) => updateStar('a', v)}
            error={errors.starA}
          />
          <StarField
            label="Result"
            sub="어떤 결과·교훈을 얻었는지"
            placeholder="결과나 변화, 배운 점을 입력하세요"
            value={form.star.r}
            onChange={(v) => updateStar('r', v)}
            error={errors.starR}
          />
        </div>
      </Section>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="btn-default"
        >
          취소
        </button>
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? '저장 중…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ---------- 데이터 변환 ---------- */

function toDraft(d) {
  return {
    category: d?.experienceCategory
      ? EXPERIENCE_CATEGORY_TO_FRONT[d.experienceCategory] || ''
      : '',
    stateAtCreation: d?.stateAtCreation ?? '',
    relatedMajor: d?.relatedMajor ?? '',
    title: d?.experienceTitle ?? '',
    startDate: d?.startDate ?? '',
    endDate: d?.endDate ?? '',
    star: {
      s: d?.starStructure?.s ?? '',
      t: d?.starStructure?.t ?? '',
      a: d?.starStructure?.a ?? '',
      r: d?.starStructure?.r ?? '',
    },
  };
}

function toBody(form) {
  return {
    experienceCategory: EXPERIENCE_CATEGORY_TO_BACK[form.category],
    stateAtCreation: form.stateAtCreation,
    relatedMajor: form.relatedMajor,
    experienceTitle: form.title.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    starStructure: {
      s: form.star.s.trim(),
      t: form.star.t.trim(),
      a: form.star.a.trim(),
      r: form.star.r.trim(),
    },
  };
}

/* ---------- 검증 ---------- */

function validate(form) {
  const e = {};
  const today = todayIso();
  if (!form.category) e.category = '카테고리를 선택해주세요.';
  if (!form.stateAtCreation)
    e.stateAtCreation = '경험 당시 학년을 선택해주세요.';
  if (!form.relatedMajor) e.relatedMajor = '관련 전공을 선택해주세요.';
  if (!form.title.trim()) e.title = '제목을 입력해주세요.';
  else if (form.title.length > 200) e.title = '200자 이내로 입력해주세요.';
  if (!form.startDate) e.startDate = '시작일을 선택해주세요.';
  else if (form.startDate > today)
    e.startDate = '시작일은 오늘 이전이어야 합니다.';
  if (!form.endDate) e.endDate = '종료일을 선택해주세요.';
  else if (form.endDate > today) e.endDate = '종료일은 오늘 이전이어야 합니다.';
  else if (form.startDate && form.startDate > form.endDate)
    e.endDate = '종료일은 시작일 이후여야 합니다.';
  if (!form.star.s.trim()) e.starS = 'Situation 을 입력해주세요.';
  if (!form.star.t.trim()) e.starT = 'Task 를 입력해주세요.';
  if (!form.star.a.trim()) e.starA = 'Action 을 입력해주세요.';
  if (!form.star.r.trim()) e.starR = 'Result 를 입력해주세요.';
  return e;
}

/** 오늘 날짜를 'YYYY-MM-DD' 로 (로컬 타임존 기준). 백엔드 @PastOrPresent 차단용. */
function todayIso() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/* ---------- 빌딩블록 ---------- */

function Section({ title, sub, required, error, children }) {
  return (
    <section className="grid gap-2.5">
      <div>
        <h2 className="text-[14px] font-bold text-ink-900 tracking-tight inline-flex items-center gap-1">
          {title}
          {required && <span className="text-primary-600 font-bold">*</span>}
        </h2>
        {sub && <p className="text-[12px] text-ink-500 mt-0.5">{sub}</p>}
        {error && (
          <p className="text-[11.5px] text-red-600 mt-0.5 break-keep">
            {error}
          </p>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Field({ label, required, hint, error, children }) {
  return (
    <div className="grid gap-1.5">
      <label className="flex items-center gap-1 text-[12.5px] font-semibold text-ink-700">
        {label}
        {required && <span className="text-primary-600 font-bold">*</span>}
      </label>
      {children}
      {error ? (
        <div className="text-[11.5px] text-red-600 mt-0.5 break-keep">
          {error}
        </div>
      ) : hint ? (
        <div className="text-[11.5px] text-ink-500 mt-0.5">{hint}</div>
      ) : null}
    </div>
  );
}

function StarField({ label, sub, placeholder, value, onChange, error }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-[12.5px] font-semibold text-ink-700">
        {label} <span className="text-ink-400 font-normal">— {sub}</span>
      </label>
      <textarea
        rows={3}
        className={cn(
          'field text-[14px] py-2.5',
          error && 'border-red-500 focus:border-red-500'
        )}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && (
        <div className="text-[11.5px] text-red-600 mt-0.5">{error}</div>
      )}
    </div>
  );
}
