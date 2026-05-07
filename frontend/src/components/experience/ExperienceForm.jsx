import { useState } from 'react';
import { cn } from '../../lib/cn';
import DatePicker from '../DatePicker';
import Combobox from '../Combobox';
import {
  EXPERIENCE_CATEGORY_OPTIONS,
  EXPERIENCE_CATEGORY_TO_FRONT,
  EXPERIENCE_CATEGORY_TO_BACK,
  KOOKMIN_DEPT_OPTIONS,
} from '../../lib/enums';

/**
 * 경험 작성/수정 공용 폼.
 *
 * Props:
 *   - initialValue?: { experienceCategory(BE enum), relatedMajor, experienceTitle,
 *                     startDate(YYYY-MM-DD), endDate, starStructure: {s,t,a,r} }
 *   - onSubmit(body): 백엔드 ExperienceRequest 형식으로 호출.
 *   - onCancel()
 *   - isPending: mutation 진행 중인지
 *   - submitLabel: 버튼 텍스트
 *
 * 검증 (4/27 디자인 + swagger 제약):
 *   - 카테고리 / 관련 전공 / 제목 / 시작일 / 종료일 / STAR 4항목 모두 필수
 *   - 제목 200자
 *   - 시작일 ≤ 종료일
 *   - 시작일·종료일 모두 오늘까지만 (백엔드 @PastOrPresent 제약 — DatePicker max 로도 차단)
 *
 * 관련 전공은 Combobox 로 KookminDepartment 54 개 중 단일 선택. null/빈값 비허용 (필수).
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
              placeholder="예: AI 자소서 보조 캡스톤 프로젝트"
              maxLength={200}
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
          </Field>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="시작일" required error={errors.startDate}>
              <DatePicker

  return null;
}
