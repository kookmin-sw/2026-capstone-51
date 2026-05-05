import { useState } from 'react';
import { cn } from '../../lib/cn';

/**
 * 자소서 메타 정보 폼 — 회사명 / 희망 직무 / 글로벌 요구사항.
 *
 * Swagger EssayCreateRequest:
 *   companyName, wishJob, globalReq — 모두 minLength:1 (required).
 * EssayUpdateRequest 도 동일 shape (자소서 메타 수정에 사용).
 *
 * Props:
 *  - initialValue?: { companyName, wishJob, globalReq }
 *  - onSubmit(body): swagger EssayCreate/Update Request 형식
 *  - onCancel?: 취소 콜백 (있으면 취소 버튼 노출)
 *  - isPending: mutation 진행 중인지
 *  - submitLabel
 */
export default function EssayMetaForm({
  initialValue,
  onSubmit,
  onCancel,
  isPending,
  submitLabel = '다음 단계',
}) {
  const [form, setForm] = useState(() => ({
    companyName: initialValue?.companyName ?? '',
    wishJob: initialValue?.wishJob ?? '',
    globalReq: initialValue?.globalReq ?? '',
  }));
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validate(form) : {};

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(form);
    if (Object.keys(errs).length > 0) return;
    if (isPending) return;
    onSubmit({
      companyName: form.companyName.trim(),
      wishJob: form.wishJob.trim(),
      globalReq: form.globalReq.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {/* 회사명 + 희망 직무 — sm 이상에서 1행 2열, 그 미만은 단일 컬럼 */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="회사명" required error={errors.companyName}>
          <input
            className={cn(
              'field text-[14px] py-2.5',
              errors.companyName && 'border-red-500 focus:border-red-500'
            )}
            placeholder="예: 토스"
            value={form.companyName}
            onChange={(e) => update('companyName', e.target.value)}
          />
        </Field>
        <Field label="희망 직무" required error={errors.wishJob}>
          <input
            className={cn(
              'field text-[14px] py-2.5',
              errors.wishJob && 'border-red-500 focus:border-red-500'
            )}
            placeholder="예: 백엔드 엔지니어"
            value={form.wishJob}
            onChange={(e) => update('wishJob', e.target.value)}
          />
        </Field>
      </div>
      <Field
        label="글로벌 요구사항 (인재상)"
        required
        error={errors.globalReq}
        hint="모든 문항에 공통으로 반영되는 인재상이나 톤. 자소서 답변 생성 시 참고됩니다."
      >
        <textarea
          rows={4}
          className={cn(
            'field text-[14px] py-2.5',
            errors.globalReq && 'border-red-500 focus:border-red-500'
          )}
          placeholder="예: 도전을 두려워하지 않는 인재"
          value={form.globalReq}
          onChange={(e) => update('globalReq', e.target.value)}
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="btn-default"
          >
            취소
          </button>
        )}
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? '처리 중…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ---------- 검증 ---------- */

function validate(form) {
  const e = {};
  if (!form.companyName.trim()) e.companyName = '회사명을 입력해주세요.';
  if (!form.wishJob.trim()) e.wishJob = '희망 직무를 입력해주세요.';
  if (!form.globalReq.trim()) e.globalReq = '글로벌 요구사항을 입력해주세요.';
  return e;
}

/* ---------- 빌딩블록 ---------- */

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
