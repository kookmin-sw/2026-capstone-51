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

  return null;
}
