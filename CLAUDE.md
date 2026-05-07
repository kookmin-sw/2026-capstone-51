# CLAUDE.md

이 파일은 Claude Code가 이 레포에서 작업할 때 빠르게 컨텍스트를 잡기 위한 최상위 가이드입니다.

## 프로젝트

**Logi** — 국민대학교 2026 캡스톤 디자인 51팀. 자기소개서(자소서) 작성 보조 플랫폼.

핵심 가치 제안:
- 사용자가 자기 경험을 STAR(Situation/Task/Action/Result) 구조로 미리 저장.
- 자소서 문항마다 가장 적합한 경험을 추천(추후 임베딩 기반).
- 동기/선배 비교 통계 제공(대시보드 5축 레이더 + 학기 타임라인).

GitHub 클래스룸 템플릿(`cap-template`)에서 시작했기 때문에 루트 `README.md`와 `index.md`는 아직 템플릿 상태이며, 실제 프로젝트 정보는 `frontend/`, `backend/` 하위 docs를 봐야 합니다.

## 레포 구성

```
.
├── frontend/    # React 19 + Vite 8 + Tailwind, JSX only, Korean UI
├── backend/     # Spring Boot 3.5.6 + Java 21 + PostgreSQL(+pgvector) + AWS SQS
├── .github/     # PR/Issue 템플릿 (workflow는 없음)
└── README.md    # GitHub 클래스룸 템플릿 잔재 — 실제 정보 없음
```

각 하위 디렉토리에 자체 `CLAUDE.md`가 있습니다 — 작업 시작 전 반드시 확인:
- [frontend/CLAUDE.md](frontend/CLAUDE.md)
- [backend/CLAUDE.md](backend/CLAUDE.md)

## 운영 메타

- **기본 브랜치는 `master`** (`main` 아님).
- 브랜치 네이밍: `<area>/feat/<feature>` 또는 `<area>/<type>/<topic>` 패턴 — 예: `frontend/feat/dashboard`, `backend/feat/essay`, `chore/...`. 이슈 번호가 있으면 커밋 메시지에 `[#19] feat: ...` 처럼 prefix.
- 한국어 커밋 메시지가 일반적. 형식은 conventional commits에 가까움(`feat:`, `chore:`, `fix:`).
- PR 템플릿: `.github/PULL_REQUEST_TEMPLATE.md` — 변경사항 요약 / 변경 이유 / 주요 변경사항 체크박스 / 검토 포인트 / 체크리스트 5섹션.
- CI 워크플로 없음 (`.github/workflows` 비어 있음).

## 팀 분담 (현 시점에서 관찰된 것)

- 프론트엔드 메인 작업자: 사용자 본인(`gksgpals` / 한혜민, 소프트웨어학부).
- 백엔드는 `backend/feat/*` 브랜치에서 다른 멤버가 작업 — auth, user, experience, certificate, essay, sqs 까지 마무리되어 master에 머지된 상태.
- 프론트는 디자인 시스템과 일부 페이지(랜딩/온보딩/대시보드)만 구현, 나머지는 `Placeholder` 컴포넌트로 와이어업.

## 프론트 ↔ 백 연결 시 주의 (실제로 부딪히는 mismatch)

다음 항목들은 통합할 때 충돌하니 미리 조정해야 합니다:

1. **CORS allowed-origins 불일치**: 백엔드 `application.yml`은 `http://localhost:3000`만 허용. 프론트 Vite는 `5173`(default) 또는 `5180`. 통합 테스트 전에 백엔드 yml에 프론트 dev 포트 추가, 또는 프론트를 3000으로 띄우는 약속 필요.
2. **API base path는 `/api`**: 백엔드 `server.servlet.context-path: /api`. 따라서 프론트 `VITE_API_URL`은 `http://localhost:8080/api` 처럼 `/api`까지 포함해야 함.
3. **토큰 저장 키**: 프론트 `src/api/axios.js`는 `localStorage.getItem('token')`을 사용. 로그인 응답은 `{ accessToken, refreshToken, firstLogin }`이라 어떤 키로 저장하고 어떻게 갱신할지 합의 필요(현재는 미구현).
4. **OAuth 게이트**: 백엔드는 `@kookmin.ac.kr` 도메인 이메일만 허용. 데모용 다른 계정 안 됨.
5. **응답 래핑**: 모든 응답이 `ApiResponse<T> = { statusCode, message, data }` 형태. 프론트 axios 인터셉터에서 `response.data.data`를 까는 layer가 아직 없음.
