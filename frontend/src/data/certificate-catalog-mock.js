/**
 * 자격증 카탈로그 mock — 백엔드 `/certification-catalog` 가 아직 403 으로
 * 막혀있어서 (백엔드 SecurityConfig 화이트리스트 누락 추정) DEV 환경에서만
 * 자동완성 UI 시각 확인용으로 사용.
 *
 * **임시 파일** — 백엔드 픽스 + 실 데이터로 자동완성 동작 검증 끝나면 이 파일
 * 삭제 + CertificateForm.jsx 의 import / fallback 분기 제거 예정.
 *
 * 응답 스키마는 백엔드 `CertificationCatalogResponse` 와 정합:
 *   { certificationCatalogId: UUID, name, issuingOrganization, difficulty }
 * difficulty: 'HIGH' | 'MEDIUM' | 'LOW'.
 */
export const CERTIFICATE_CATALOG_MOCK = [
  {
    certificationCatalogId: 'mock-1',
    name: '정보처리기사',
    issuingOrganization: '한국산업인력공단',
    difficulty: 'HIGH',
  },
  {
    certificationCatalogId: 'mock-2',
    name: 'SQLD (SQL 개발자)',
    issuingOrganization: '한국데이터산업진흥원',
    difficulty: 'MEDIUM',
  },
  {
    certificationCatalogId: 'mock-3',
    name: 'ADsP (데이터 분석 준전문가)',
    issuingOrganization: '한국데이터산업진흥원',
    difficulty: 'MEDIUM',
  },
  {
    certificationCatalogId: 'mock-4',
    name: '컴퓨터활용능력 1급',
    issuingOrganization: '대한상공회의소',
    difficulty: 'MEDIUM',
  },
  {
    certificationCatalogId: 'mock-5',
    name: '컴퓨터활용능력 2급',
    issuingOrganization: '대한상공회의소',
    difficulty: 'LOW',
  },
  {
    certificationCatalogId: 'mock-6',
    name: 'TOEIC',
    issuingOrganization: 'ETS',
    difficulty: 'MEDIUM',
  },
  {
    certificationCatalogId: 'mock-7',
    name: 'OPIc',
    issuingOrganization: 'ETS',
    difficulty: 'MEDIUM',
  },
  {
    certificationCatalogId: 'mock-8',
    name: 'AWS Certified Solutions Architect – Associate',
    issuingOrganization: 'Amazon Web Services',
    difficulty: 'HIGH',
  },
];
