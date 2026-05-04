import { useRef, useState } from 'react';
import { Paperclip, FileText, X as XIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * 자격증 신규/수정 공용 폼.
 *
 * Props:
 *   - initialValue?: { certificateName, getDate, expirationDate, certificateCode, issuingOrganization }
 *   - onSubmit(body): swagger CertificateRequest 형식으로 호출.
 *   - onCancel()
 *   - isPending: mutation 진행 중인지
 *   - submitLabel: 버튼 텍스트
 *
 * 검증 (4/27 디자인 + swagger 스키마, swagger 는 모두 optional 이지만 UX 상 필수 강제):
 *  - 자격증명 / 발급 기관 / 취득일 필수
 *  - 취득일은 오늘까지만 (백엔드 @PastOrPresent 제약 추정 — input max 로도 차단)
 *  - "유효기간 있음" 체크 시 만료일 필수, 만료일 ≥ 취득일 (만료일은 미래 허용)
 *  - 자격증 번호는 옵셔널
 *  - 증빙 PDF 파일은 옵셔널. 클라이언트 검증(.pdf 확장자 + 10MB 제한)만. 백엔드 업로드
 *    엔드포인트 추가 전까지는 form state 에만 보관 — 저장 시 미전송, 새로고침 시 휘발.
 *
 * 첫 "저장" 클릭 후부터 라이브 검증.
 */
const FILE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export default function CertificateForm({
  initialValue,
  onSubmit,
  onCancel,
  isPending,
  submitLabel = '저장',
}) {
  const [form, setForm] = useState(() => toDraft(initialValue));
  const [submitted, setSubmitted] = useState(false);
  const [pdfFile, setPdfFile] = useState(null); // File | null
  const [pdfError, setPdfError] = useState('');
  const fileInputRef = useRef(null);
  const errors = submitted ? validate(form) : {};

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePdfPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') {
      setPdfError('PDF 파일만 업로드할 수 있어요.');
      e.target.value = '';
      return;
    }
    if (f.size > FILE_MAX_BYTES) {
      setPdfError('파일 크기는 10MB 이하여야 해요.');
      e.target.value = '';
      return;
    }
    setPdfError('');
    setPdfFile(f);
  };

  const handlePdfRemove = () => {
    setPdfFile(null);
    setPdfError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onToggleExpiration = (checked) => {
    setForm((f) => ({
      ...f,
      hasExpiration: checked,
      expirationDate: checked ? f.expirationDate : '',
    }));
  };

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
      {/* 기본 정보 */}
      <Section title="기본 정보">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="자격증명" required error={errors.certificateName}>
            <input
              className={cn(
                'field text-[14px] py-2.5',
                errors.certificateName && 'border-red-500 focus:border-red-500'
              )}
              placeholder="예: 정보처리기사"
              value={form.certificateName}
              onChange={(e) => update('certificateName', e.target.value)}
            />
          </Field>
          <Field label="발급 기관" required error={errors.issuingOrganization}>
            <input
              className={cn(
                'field text-[14px] py-2.5',
                errors.issuingOrganization &&
                  'border-red-500 focus:border-red-500'
              )}
              placeholder="예: 한국산업인력공단"
              value={form.issuingOrganization}
              onChange={(e) => update('issuingOrganization', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      {/* 일자 */}
      <Section title="일자">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="취득일" required error={errors.getDate}>
            <input
              type="date"
              max={todayIso()}
              className={cn(
                'field text-[14px] py-2.5',
                errors.getDate && 'border-red-500 focus:border-red-500'
              )}
              value={form.getDate}
              onChange={(e) => update('getDate', e.target.value)}
            />
          </Field>
          <Field label="자격증 번호" error={errors.certificateCode}>
            <input
              className="field text-[14px] py-2.5"
              placeholder="예: 24-1234-5678 (선택)"
              value={form.certificateCode}
              onChange={(e) => update('certificateCode', e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-3 grid gap-3">
          <label className="inline-flex items-center gap-2 text-[12.5px] text-ink-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasExpiration}
              onChange={(e) => onToggleExpiration(e.target.checked)}
              className="w-4 h-4 accent-primary-600"
            />
            유효기간 있음
          </label>
          {form.hasExpiration && (
            <Field label="만료일" required error={errors.expirationDate}>
              <input
                type="date"
                className={cn(
                  'field text-[14px] py-2.5 max-w-[280px]',
                  errors.expirationDate && 'border-red-500 focus:border-red-500'
                )}
                value={form.expirationDate}
                onChange={(e) => update('expirationDate', e.target.value)}
              />
            </Field>
          )}
        </div>
      </Section>

      {/* 증빙 PDF 업로드 — 백엔드 업로드 엔드포인트 미연동 */}
      <Section
