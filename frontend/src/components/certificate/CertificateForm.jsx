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
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const errors = submitted ? validate(form) : {};

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // 파일 검증 + state 반영. <input> 픽 / drop 양쪽에서 공통 사용.
  const acceptFile = (f) => {
    if (!f) return;
    if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') {
      setPdfError('PDF 파일만 업로드할 수 있어요.');
      return;
    }
    if (f.size > FILE_MAX_BYTES) {
      setPdfError('파일 크기는 10MB 이하여야 해요.');
      return;
    }
    setPdfError('');
    setPdfFile(f);
  };

  const handlePdfPick = (e) => {
    acceptFile(e.target.files?.[0]);
    // 같은 파일 다시 픽해도 onChange 가 호출되도록 reset.
    e.target.value = '';
  };

  const handlePdfRemove = () => {
    setPdfFile(null);
    setPdfError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    // children 위로 옮겨갈 때 깜빡임 방지.
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
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
            <YmdInput
              defaultValue={form.getDate}
              onChange={(v) => update('getDate', v)}
              hasError={!!errors.getDate}
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
              <YmdInput
                defaultValue={form.expirationDate}
                onChange={(v) => update('expirationDate', v)}
                hasError={!!errors.expirationDate}
              />
            </Field>
          )}
        </div>
      </Section>

      {/* 증빙 PDF 업로드 — 백엔드 업로드 엔드포인트 미연동 */}
      <Section
        title="증빙 자료"
        sub="자격증 사본 PDF 파일을 첨부할 수 있어요. (10MB 이하, .pdf)"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={handlePdfPick}
        />
        {pdfFile ? (
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'rounded-md border bg-paper p-3 flex items-center gap-3 transition-colors',
              isDragOver
                ? 'border-primary-500 bg-primary-50/40'
                : 'border-ink-200'
            )}
          >
            <FileText
              size={22}
              strokeWidth={1.6}
              className="text-primary-600 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-ink-900 truncate">
                {pdfFile.name}
              </div>
              <div className="text-[11.5px] text-ink-500 tabular-nums mt-0.5">
                {fmtBytes(pdfFile.size)}
              </div>
            </div>
            <button
              type="button"
              onClick={handlePdfRemove}
              aria-label="첨부 파일 제거"
              className="grid place-items-center w-7 h-7 rounded-md text-ink-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <XIcon size={14} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'w-full rounded-md border border-dashed px-4 py-5 flex flex-col items-center justify-center gap-1.5 transition-colors',
              isDragOver
                ? 'border-primary-500 bg-primary-50/60 text-primary-700'
                : 'border-ink-300 bg-ink-50/40 hover:bg-ink-50 hover:border-ink-400 text-ink-600'
            )}
          >
            <Paperclip size={18} strokeWidth={1.8} />
            <div className="text-[13px] font-semibold">
              PDF 파일 선택 또는 드래그
            </div>
            <div className="text-[11.5px] text-ink-500">.pdf · 최대 10MB</div>
          </button>
        )}
        {pdfError && (
          <div className="text-[11.5px] text-red-600 mt-1.5 break-keep">
            {pdfError}
          </div>
        )}
        <div className="text-[11px] text-ink-400 mt-1.5 break-keep">
          ※ 백엔드 업로드 엔드포인트 준비 후 자동 첨부됩니다. 현재는 미리보기
          전용.
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
    certificateName: d?.certificateName ?? '',
    issuingOrganization: d?.issuingOrganization ?? '',
    getDate: d?.getDate ?? '',
    certificateCode: d?.certificateCode ?? '',
    expirationDate: d?.expirationDate ?? '',
    hasExpiration: !!d?.expirationDate,
  };
}

function toBody(form) {
  // swagger 의 모든 필드는 optional. 비어있는 필드는 빈 문자열로 보냄
  // (백엔드 직렬화 정책 미확정 — 통합 테스트 시 null/empty 허용 여부 확인).
  return {
    certificateName: form.certificateName.trim(),
    issuingOrganization: form.issuingOrganization.trim(),
    getDate: form.getDate,
    certificateCode: form.certificateCode.trim(),
    expirationDate: form.hasExpiration ? form.expirationDate : '',
  };
}

/* ---------- 검증 ---------- */

function validate(form) {
  const e = {};
  const today = todayIso();
  if (!form.certificateName.trim())
    e.certificateName = '자격증명을 입력해주세요.';
  if (!form.issuingOrganization.trim())
    e.issuingOrganization = '발급 기관을 입력해주세요.';
  if (!form.getDate) e.getDate = '취득일을 입력해주세요.';
  else if (!isValidYmd(form.getDate))
    e.getDate = '올바른 날짜 형식이 아니에요.';
  else if (form.getDate > today) e.getDate = '취득일은 오늘 이전이어야 합니다.';
  if (form.hasExpiration) {
    if (!form.expirationDate) {
      e.expirationDate = '만료일을 입력해주세요.';
    } else if (!isValidYmd(form.expirationDate)) {
      e.expirationDate = '올바른 날짜 형식이 아니에요.';
    } else if (form.getDate && form.expirationDate < form.getDate) {
      e.expirationDate = '만료일은 취득일 이후여야 합니다.';
    }
  }
  return e;
}

/** 오늘 날짜 'YYYY-MM-DD' (로컬 타임존). */
function todayIso() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' 형식 + 실제 존재하는 날짜인지 검사 (예: 2026-02-31 거부). */
function isValidYmd(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [, y, mo, d] = m;
  const dt = new Date(`${y}-${mo}-${d}T00:00:00`);
  return (
    dt.getFullYear() === Number(y) &&
    dt.getMonth() + 1 === Number(mo) &&
    dt.getDate() === Number(d)
  );
}

/** 사용자 가독 바이트 단위. */
function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------- 빌딩블록 ---------- */

function Section({ title, sub, children }) {
  return (
    <section className="grid gap-2.5">
      <div>
        <h2 className="text-[14px] font-bold text-ink-900 tracking-tight">
          {title}
        </h2>
        {sub && <p className="text-[12px] text-ink-500 mt-0.5">{sub}</p>}
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

/**
 * 년/월/일 숫자 3칸. 자격증 일자는 요일 정보가 의미 없어서 캘린더 대신 숫자 입력.
 *
 * Uncontrolled 패턴 — `defaultValue` 로만 초기화하고 그 후엔 내부 state(parts)가
 * 진실의 원천. 부모로는 'YYYY-MM-DD' 완성 형태 또는 '' 만 onChange 로 보냄.
 *
 * 왜 controlled 안 쓰나: 부모 form state 에 'YYYY-MM-DD' 형식만 저장하면 사용자가
 * 한 칸을 비우는 순간 joinYmd 가 '' 를 반환해 부모 state 도 비워지고, 그게 다시
 * value 로 내려와 다른 두 칸의 visible 값까지 비워지는 버그가 발생. partial 입력
 * 상태는 자식 내부에만 두는 게 자연스러움. 부모는 onChange 콜백 시점에만 알면 됨.
 */
function YmdInput({ defaultValue, onChange, hasError }) {
  const [parts, setParts] = useState(() => parseYmd(defaultValue));

  const setPart = (k, raw, maxLen) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, maxLen);
    const next = { ...parts, [k]: cleaned };
    setParts(next);
    onChange(joinYmd(next));
  };

  const baseCell = cn(
    'field text-[14px] py-2.5 text-center tabular-nums',
    hasError && 'border-red-500 focus:border-red-500'
  );
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="YYYY"
        value={parts.y}
        onChange={(e) => setPart('y', e.target.value, 4)}
        className={cn(baseCell, 'w-[88px]')}
      />
      <span className="text-[12.5px] text-ink-500">년</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="MM"
        value={parts.m}
        onChange={(e) => setPart('m', e.target.value, 2)}
        className={cn(baseCell, 'w-[60px]')}
      />
      <span className="text-[12.5px] text-ink-500">월</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="DD"
        value={parts.d}
        onChange={(e) => setPart('d', e.target.value, 2)}
        className={cn(baseCell, 'w-[60px]')}
      />
      <span className="text-[12.5px] text-ink-500">일</span>
    </div>
  );
}

function parseYmd(s) {
  if (!s) return { y: '', m: '', d: '' };
  const [y = '', m = '', d = ''] = s.split('-');
  return { y, m, d };
}

// 년은 4 자리 강제, 월·일은 자동 zero-pad. 셋 중 하나라도 비면 '' 반환
// (부모는 validate 에서 잡음).
function joinYmd({ y, m, d }) {
  if (!y || !m || !d) return '';
  if (y.length !== 4) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}
