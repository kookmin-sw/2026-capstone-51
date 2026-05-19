# CLAUDE.md (frontend)

## Project

Logi 프론트엔드 — 국민대학교 자소서 플랫폼. React 19 + Vite 8 SPA, **JSX only (no TypeScript)**. UI copy는 한국어.

상위 컨텍스트(백엔드 API, 통합 시 mismatch)는 [../CLAUDE.md](../CLAUDE.md), [../backend/CLAUDE.md](../backend/CLAUDE.md) 참조.

## Commands

- `npm run dev` — Vite dev 서버. **포트 3000 강제 (`vite.config.js` `server.port: 3000, strictPort: true`)** — 백엔드 OAuth `redirect_uri=http://localhost:3000/auth/callback` 와 일치시키기 위함. IPv4 `127.0.0.1`로 바인딩.
- `npm run build` — production build → `dist/`
- `npm run lint` — ESLint (flat config, `eslint.config.js`)
- `npm run preview` — 빌드 결과 미리보기
- `npm test` — `eslint . && prettier --check .` (실 단위 테스트 없음 — 린트+포맷 게이트)
- Prettier: `.prettierrc` (single quotes, semis, 2-space, `printWidth: 80`)

### Pre-commit hook

`.husky/pre-commit`이 `npx lint-staged`를 실행. `package.json`의 `lint-staged` 블록이 staged된 `*.{js,jsx}`에 `eslint --fix` + `prettier --write`, `*.{css,json,md}`에 `prettier --write`. 즉 커밋 시 자동 포맷/자동 픽스됨. **`--no-verify` 우회 금지** — hook 실패는 실제 lint 에러를 fix해야 풀림.

## Environment

`.env` / `.env.local` 둘 다 gitignored. 추적되는 건 `.env.local.example` 뿐 — 그게 canonical 가이드.

- `VITE_API_URL` — axios client(`src/api/axios.js`)에 주입. 백엔드 `context-path: /api` 이므로 값에 `/api`까지 포함. **현재 권장 `https://api.logi.p-e.kr/api`** — 백엔드 팀이 도메인 살려놨고 안정 IP + 정상 cert 라 직접 호출이 기본. dev proxy 우회 패턴 폐기 (옛 EC2 IP 직접 + cert 검증 끄던 시기).
  - 옛 도메인 `logi.p-e.kr` 은 그대로 죽어있음. 새 도메인 `api.logi.p-e.kr` 만 사용.
  - 로컬 백엔드 띄울 일 있으면 `VITE_API_URL=http://localhost:8080/api`.
  - same-origin 아니므로 백엔드 CORS allowed-origins 에 `http://localhost:3000` 등록 필요 (dev 서버 포트). 이미 등록되어 있는 것으로 추정 (백엔드 팀 확인됨).
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client_id. 백엔드 팀이 Google Console 에 등록한 값과 동일해야 함. `client_secret` 은 백엔드만 보유.
- `VITE_GOOGLE_REDIRECT_URI` — Google Console 에 등록된 redirect_uri. 기본 `http://localhost:3000/auth/callback`. 다른 값으로 바꾸려면 Google Console 등록도 같이.
- **백엔드 OpenAPI Source of Truth**: `https://api.logi.p-e.kr/api/swagger-ui/index.html` (스펙 JSON: `/api/v3/api-docs`). 노션의 API 명세 CSV 와 차이가 있을 경우 **항상 스웨거가 우선**.

## Architecture

### Routing (`src/App.jsx`)

`src/main.jsx` 는 `createRoot(...).render(<App />)` 만. 라우트 트리 + `QueryClientProvider` + `HashRouter` 는 `src/App.jsx` 에 분리되어 있음 (이렇게 분리 안 하면 `react-refresh/only-export-components` 룰 때문에 HMR 깨짐).

- **`HashRouter`** (BrowserRouter 아님) — URL이 `#/...`. 정적 호스팅(GitHub Pages 등)에서도 라우팅 깨지지 않게.
- 라우트 세 종류:
  - **Chromeless 공개**: `/landing`, `/auth/callback` — 사이드바 없이 전체 화면, 인증 불필요.
  - **Chromeless 보호**: `/onboarding` — `<ProtectedRoute/>` 래핑.
  - **Layout-wrapped 보호**: 그 외 전부 `<ProtectedRoute/>` → `<Layout/>`(사이드바 + `<Outlet/>`) 안에. 인덱스(`/`)와 unknown path 는 `/dashboard` 로 redirect.
- 미구현 페이지(`/write`, `/essays`, `/essays/:id`, `/stats`, `/my-experience`, `/my-experience/new`, `/my-experience/:id`, `/my-certificates`, `/my-certificates/new`, `/my-certificates/:id/edit`)는 전부 `<Placeholder/>`.
- 구현된 페이지: `/landing`, `/auth/callback`, `/onboarding`, `/dashboard`(mock), `/info`.

`ProtectedRoute` 는 `useAuth.isAuthenticated` 만 보고 `/landing` 으로 redirect. axios 의 reissue 실패 시 `notifySessionExpired` 가 lazy import 로 useAuth 의 isAuthenticated 를 false 로 만들어, ProtectedRoute 가 재렌더 → 자동 /landing 이동. (cycle 회피용 dynamic import.)

#### 로그인 플로우

```
/landing
  └─ Google 계정으로 로그인 (window.location 으로 accounts.google.com 으로 풀페이지 리다이렉트)
                                                       ↓
                              accounts.google.com (Google 인증)
                                                       ↓
                              redirect_uri = /auth/callback?code=XXX
                                                       ↓
   main.jsx 의 어댑터: pathname /auth/callback → hash /#/auth/callback (HashRouter 가 hash 만 보므로)
                                                       ↓
   /auth/callback (SplashScreen.jsx — 친구 디자인 + 본인 zustand 로직)
     └─ POST /api/auth/login { grantCode } → { accessToken, refreshToken, firstLogin }
        ├─ useAuth.setTokens (localStorage 저장)
        └─ firstLogin === true ? /onboarding : /dashboard

/onboarding (첫 로그인 후)
  └─ 시작하기 → useUpdateMe (PUT /users/me) → /dashboard

Sidebar 로그아웃
  └─ useAuth.logout()
       ├─ tokenStore.clear() + state 비움 (즉시)
       └─ callLogout (POST /auth/logout) — best-effort, fire-and-forget
     → navigate /landing (replace)
```

Google Console 등록 redirect_uri 는 hash(`#`)를 받지 않아 pathname `/auth/callback` 으로 들어옴. HashRouter 는 pathname 을 라우팅에 쓰지 않으므로 `main.jsx` 가 React 마운트 전에 `history.replaceState` 로 `/#/auth/callback?...` 으로 옮겨 라우터가 잡게 함.

**`/users/me` 매핑 정책:**

- `Info.jsx` (수정 페이지) / `Onboarding.jsx` (첫 로그인) 둘 다 모든 enum 필드를 백엔드 직렬화 값으로 직접 사용. `KookminDepartment` 풀네임, `JobFirst/Second/Third` 한국 표준직업분류 — `lib/enums.js` 의 옵션 그대로 PUT.
- `Onboarding.jsx` / `Info.jsx` 필수 필드: 이름(2자+) / 학번(8자리 숫자) / 전공 / 현재상태 / **학점(0~4.5)** / 희망직무 대·중·소. 옵셔널: 부전공. 부전공은 전공과 같을 수 없어 옵션 자체에서 제외. 폼 초기값 없음(placeholder만), 검증 실패는 인라인 에러로 노출.
- 옛 mock (`data/onboarding.js` 의 `MAJORS` / `JOB_TREE`)은 정리되어 삭제됨 — 새 폼은 모두 `lib/enums.js` 사용.

### CSS / Tailwind

- `index.css` 가 `src/main.jsx`에서 import 됨. 이 import 한 줄이 빠지면 **Tailwind가 통째로 안 먹어서 페이지가 unstyled HTML로 보임** — 초기 커밋에 이게 누락되어 있어서 첫 dev 서버 띄웠을 때 스타일이 전혀 안 나왔던 적이 있음 (commit `270814c`에서 수정). 새 글로벌 CSS도 `index.css`에 추가.
- `tailwind.config.js`에 커스텀 팔레트(`primary`, `sidebar`, `ink`, `navy`, `cat`, `paper`, `page`, `border`), 커스텀 `borderRadius`, `boxShadow` 토큰. **`theme`이 named export로도 노출** — 별도 `preview.html`(CDN Tailwind)에 인라인 주입하기 위해서임. named export와 default export의 theme를 동기화해서 유지.
- `src/index.css`의 `@layer components`에 canonical primitive: `.card`, `.btn-default`, `.btn-primary`, `.btn-ghost`, `.btn-sm`, `.field`, `.badge-{gray|navy|green|red|amber}`. **유틸리티 체인보다 이 클래스 우선 사용**.
- **`.badge-${tone}` 함정**: `className={\`badge-${tone}\`}` 처럼 동적으로 만드는 클래스는 Tailwind JIT 정적 스캔이 못 잡아 출력 CSS 에서 통째로 purge 됨. `tailwind.config.js` 의 `safelist` 에 5종 (`badge`, `badge-gray|navy|green|red|amber`) 을 강제 포함시켜 해결. 새 톤 추가 시 safelist 도 같이 갱신. 다른 dynamic className 도입 시 같은 함정 주의.
- `src/lib/cn.js` 는 작은 clsx 대체. 문자열/배열/`{class: bool}` 객체 모두 받음. 조건부 클래스 합성에 사용.

### Path alias

- `@` → `./src` (vite.config.js). 기존 파일들은 거의 다 상대 경로 import — 둘 다 작동, 새 파일에서 어느 쪽이든 OK.

### Responsive

기준 브레이크포인트 — 사이드바 토글의 분기점이 핵심:

- **`< lg` (1024px 미만)**: `Layout` 이 햄버거 헤더 노출, `Sidebar` 는 화면 밖 drawer (`fixed -translate-x-full`). drawer 는 햄버거 / 오버레이 클릭 / 사이드바 안의 X 버튼 / NavLink 클릭(`onClose` props) 으로 닫힘.
- **`lg` 이상**: 사이드바 정적 칼럼 (`lg:static`), 햄버거 헤더 hidden (`lg:hidden`).
- 메인 콘텐츠 패딩: `px-4 sm:px-6 lg:px-8 py-5 lg:py-7`.
- Landing 은 `grid-cols-1 lg:grid-cols-[1.1fr_1fr]` (모바일 단일 컬럼 → lg 에서 split-screen).
- Onboarding 폼은 `grid-cols-1 sm:grid-cols-2 (또는 sm:grid-cols-3)`.
- Dashboard 의 로드맵(`RoadmapCard` → `Roadmap`)은 입학~졸업 사이 비율 좌표로 마일스톤 점을 배치 — 카드 안 `padding: 16px 52px`(carousel 시) 로 좌우 화살표 자리 확보. 모바일에서 그래프 본체가 좁아질 뿐 가로 스크롤은 없음.
- Korean 한글 줄바꿈은 의미 단위에서 끊기게 `break-keep` 적용 (긴 본문 / 약관 카피).
- 검증 완료 viewport: 320 / 768 / 1024 / 1440 — `/info` Placeholder 와 `/landing`, `/onboarding` 모두 깨짐 없음.

### Data flow (현재 상태)

페이지는 아직 `src/data/*.js` 정적 mock 만 사용 — 실 API 연동은 PR#3 부터.
하지만 인프라는 모두 준비됨:

**axios 인터셉터** — [`src/api/axios.js`](2026-capstone-51/frontend/src/api/axios.js)

- 응답 자동 unwrap: `ApiResponse<T> = { statusCode, message, data }` → `response.data = data`. 호출부는 `r.data` 만 보면 됨.
- 에러 메시지 노출: `error.apiMessage` 에 백엔드 한국어 message.
- 401/403 자동 reissue 큐 — 동시에 여러 요청이 401 받아도 `/auth/reissue` 한 번만 호출, 나머지 큐잉 후 새 토큰으로 일괄 재실행.
- reissue 자체 실패 → `tokenStore.clear()` 후 에러 throw. 라우팅(/landing) 은 호출부 / Guard 책임.
- 자동 토스트: 네트워크 단절 + 5xx 만. 4xx 는 페이지가 처리.
- 토큰 저장: `localStorage.accessToken` / `localStorage.refreshToken`. `tokenStore` 헬퍼로 캡슐화 (옛 `localStorage.token` 키는 폐기).
- `callLogout(accessToken, refreshToken)` named export — 인터셉터 우회한 raw axios. `useAuth.logout` 이 토큰 비우기 직전에 호출하기 위함 (microtask 타이밍 차로 헤더가 비어 보내는 사고 방지).

**react-query** — [`src/api/queryClient.js`](2026-capstone-51/frontend/src/api/queryClient.js)

- `staleTime: 30s`, `refetchOnWindowFocus: false`, 4xx 재시도 끄고 5xx 만 2회.
- mutation 재시도 0.

**도메인 훅** — [`src/api/queries/`](2026-capstone-51/frontend/src/api/queries/)

- `keys.js` — queryKey 팩토리 (`qk.me()`, `qk.dashboard()`, `qk.stats(groupBy)`, `qk.experiences.one(id)` ...).
- `useMe.js` / `useExperiences.js` / `useCertificates.js` / `useEssays.js` — 도메인별 react-query 훅. **스웨거 28개 엔드포인트 1:1 매핑** (2026-05-10 백엔드 신규 4종 추가 후). `useCertificates.js` 에는 사용자 자격증 CRUD 외에 `useCertificationCatalog()` (마스터 카탈로그 `GET /certification-catalog`, `staleTime: Infinity`) 도 함께 둠 — 백엔드는 `certification` 도메인이 별도지만 프론트는 한 파일에서 도메인 섹션 주석으로 분리.
- `useMe.js` 의 `useMyStats(groupBy)` — `/users/me/stats?groupBy=` (groupBy: STATE|SCHOOL_NUM|WORKER). Dashboard 는 친구 패턴(`getMyDashboard()` 직접 fetch)을 그대로 사용 — react-query 안 거침.
- `useEssays.js` 의 `useEssay(id)` 안에 `normalizeEssayDetail()` 어댑터 — 백엔드 `EssayDetailResponse` 의 `requirement`/`modifiedDate` 를 `globalReq`/`updatedAt` 으로 통일. 호출부는 둘 다 같은 키로만.

**zustand 스토어** — [`src/store/`](2026-capstone-51/frontend/src/store/)

- `useAuth` — `isAuthenticated`, `user`, `setTokens`, `setUser`, `logout`. `logout` 은 클라이언트 상태 즉시 비우고 백엔드 `/auth/logout` 을 best-effort 호출 (실패 무시).
- `useToast` — `toasts`, `push`, `dismiss` + 컴포넌트 외부 헬퍼 `toast.info/success/error`.

**enum 어댑터** — [`src/lib/enums.js`](2026-capstone-51/frontend/src/lib/enums.js) + [`src/lib/enums-data.js`](2026-capstone-51/frontend/src/lib/enums-data.js)

- `ExperienceCategory` 백엔드↔프론트 매핑, `Progress`/`State`/`Difficulty` 한글 라벨, 통계 groupBy. `DIFFICULTY_LABEL` (HIGH→상/MEDIUM→중/LOW→하) + `DIFFICULTY_TONE` (red/amber/gray) 은 백엔드 `CertificationCatalog.difficulty` 와 통계 `WeakPoint.recommendedItems[i].difficulty` 양쪽에서 사용.
- `STATS_BACK_TO_FRONT` / `pickStat(statistics, 'avg'|'userCount'|'myCount')` — 백엔드 `Statistics` 5축 (`partTime/external/internal/license/intern`) → 프론트 5축 (`parttime/activity/internal/cert/intern`) 매핑. Dashboard / Stats 가 모두 사용.
- `weakPointLabel(type)` — `WeakPoint.type` 을 한글 카테고리 라벨로 정규화 (enum 키 / 한글 / stats 키 모두 수용).
- `KookminDepartment` (54 개) — `KOOKMIN_DEPT_OPTIONS` (`{value, label, group}`) + `KOOKMIN_COLLEGES` (15). value 는 백엔드 직렬화 값(`"단과대학 학과명"`) 그대로라 select 의 value 로 그대로 PUT.
- `JobFirst/Second/Third` — `JOB_TREE_BACKEND` 3 단 트리 + `JOB_FIRST_OPTIONS` / `jobSecondOptions(first)` / `jobThirdOptions(first, second)` 헬퍼. 13 / 114 / 1,125 개. enum 이름 자체가 직렬화 값.
- `humanizeEnum(value)` — 한국어 + 언더스코어 형태(`경영_사무_금융_보험`)를 `·` 로 치환해 사람 가독.
- 큰 정적 데이터(58 KB raw)는 `enums-data.js` 분리. 백엔드 enum 변경 시 수동 갱신 필요(스크립트 도입 후보).

**Toaster 컴포넌트** — [`src/components/Toaster.jsx`](2026-capstone-51/frontend/src/components/Toaster.jsx)

- App 루트에 한 번 마운트. 우상단 스택. 모바일은 좌우 16px margin.

**디버깅 메모**: zustand/axios 처음 의존성 발견될 때 Vite 가 mid-render reload 를 일으켜 "Invalid hook call" 같은 한 회성 에러가 뜰 수 있음. `rm -rf node_modules/.vite && npm run dev` 로 캐시 청소 후 재시작.

### 디렉토리 / 컴포넌트 맵

```
src/
├── main.jsx              # entry — QueryClientProvider + HashRouter + index.css import
├── index.css             # Tailwind directives + base + @layer components 토큰
├── api/
│   ├── axios.js          # response unwrap + 401/403 reissue 큐 + 토큰 store
│   ├── queryClient.js    # react-query 글로벌 QueryClient (staleTime/retry 정책)
│   └── queries/          # 도메인 훅 (useMe, useExperiences, useCertificates, useEssays) + keys.js
├── store/                # zustand
│   ├── useAuth.js        # 토큰/유저 상태. logout: 클라 즉시 비움 + 백엔드 /auth/logout best-effort. clearSession: 백엔드 호출 없이 클라만 비움 (회원 탈퇴 직후처럼 서버 세션이 이미 사라진 경우)
│   └── useToast.js       # 토스트 큐 + toast.info/success/error 헬퍼
├── lib/
│   ├── cn.js             # clsx 대체
│   └── enums.js          # 백엔드 ↔ 프론트 enum 매핑 (ExperienceCategory, State, Progress 등)
├── data/                 # 정적 mock / 토큰
│   ├── sidebar.js        # NAV, RELATED_SITES
│   └── dashboard.js      # CAT_LABELS, CAT_COLORS — Roadmap/Stats 시각화 색상 토큰. PEER_AXES — PeersOrb fallback (백엔드 peerAxes 비어 올 때만 사용, 빨간 경고 함께)
├── components/
│   ├── Layout.jsx        # Sidebar + Outlet 셸 (max-width 1100)
│   ├── ProtectedRoute.jsx# useAuth.isAuthenticated 가드. 미인증 → /landing replace
│   ├── Sidebar.jsx       # NAV 렌더 (lucide ICONS lookup) → 푸터 위 고정 영역에 RELATED_SITES → 사용자 footer (useMe 로 userName/major 표시, major 는 KOOKMIN_DEPT_OPTIONS lookup 으로 학과명만). 로그아웃 = useAuth.logout() (클라 즉시 비움 + 백엔드 /auth/logout best-effort)
│   ├── Toaster.jsx       # 우상단 토스트 스택. App 루트에 한 번 마운트
│   ├── Crumbs.jsx        # 빵부스러기. items: string[] | {label, to?}[]
│   ├── ErrorBoundary.jsx # 자식 throw 캐치 → fallback 카드. (현재 Dashboard 가 친구 패턴이라 ErrorBoundary 미사용 — 다른 페이지 보호용으로 보존)
│   ├── Button.jsx        # variant: default|primary|ghost|danger, size: md|sm — 디자인 시스템(현재 미사용, 보존)
│   ├── Modal.jsx         # open/onClose/title/sub/footer/width/hideClose 슬롯. backdrop click + 우상단 X + Esc 키로 닫힘. 열린 동안 body 스크롤 잠금. 현재 Info.jsx 회원 탈퇴 확인 모달에서 사용
│   ├── Badge.jsx         # tone: gray|navy|green|red|amber — 디자인 시스템(현재 미사용, 보존)
│   ├── Combobox.jsx      # 검색 가능한 커스텀 드롭다운. searchable/forceDirection prop 으로 검색·펼침 방향 제어. ↑↓ Enter 키보드 nav, allowClear, viewport 자동 위/아래 펼침
│   ├── DeptCascadeSelect.jsx # 단과대 → 학과 2단계 cascade (둘 다 Combobox). value 는 백엔드 직렬화 값 그대로
│   ├── DatePicker.jsx    # 커스텀 캘린더 popover. day/month/year drill-down (헤더 클릭으로 view 전환). 'YYYY-MM-DD' 입출력. min/max 모든 view 적용, allowClear, forceDirection, viewport 자동 펼침
│   ├── PeersOrb.jsx      # Three.js 5축 입체 레이더 — 나/동기/선배 3개 prism, 색 커스텀(localStorage 영속), stepped pyramid 중첩 (아래 참조)
│   ├── experience/       # ExperienceForm.jsx (신규/수정 공용 폼, swagger ExperienceRequest 정합. 관련 전공은 KOOKMIN_DEPT_OPTIONS Combobox 단일 선택, 빈값 비허용)
│   ├── certificate/      # CertificateForm.jsx (신규/수정 공용 폼, swagger CertificateRequest 정합 + 유효기간 토글 + PDF 증빙 첨부 — 새로 첨부 시 POST /certificates/upload-url → presigned PUT 으로 S3 직접 업로드 → fileKey 본 요청에 첨부. 자격증명 input 은 `useCertificationCatalog()` + native `<datalist>` 자동완성, 카탈로그 정확 매칭 시 발급기관 자동 채움(이미 적은 값은 보존), 카탈로그에 없는 자유 입력도 허용)
│   ├── essay/            # EssayMetaForm.jsx (회사·직무·요구사항), QuestionEditor.jsx (문항 편집기 — 추천/생성/재생성/저장 통합)
│   └── dashboard/        # HeroBanner, RoadmapCard, Roadmap, CategoryLegend (친구 패턴)
├── pages/
│   ├── Landing.jsx       # 풀-블리드 split-screen. Google 버튼 클릭 시 accounts.google.com 로 풀페이지 리다이렉트
│   ├── SplashScreen.jsx  # /auth/callback OAuth 콜백 — 친구 연필 글씨 SVG 애니메이션 + 본인 zustand(useAuth.setTokens) 인증 로직. grant code → POST /auth/login → firstLogin 분기
│   ├── Onboarding.jsx    # 단일 페이지 폼. lib/enums 직접 사용. 인라인 검증(필수/범위/부전공≠전공). 시작하기 = PUT /users/me → /dashboard
│   ├── Dashboard.jsx     # 친구 패턴 — Crumbs + HeroBanner + PeersOrb(axes/sub/warning) + 내 RoadmapCard + 선배 RoadmapCard(carousel). 백엔드 `getMyDashboard()` 직접 fetch (react-query 미사용). myRoadmap/seniorRoadmaps 비면 EmptyRoadmapCard 안내, peerAxes 비면 PEER_AXES mock + 빨간 경고.
│   ├── MyExperience.jsx  # /my-experience — useExperiences 목록. 단일 .card !p-0 셸 안에 검색창 + 카테고리 필터 칩 + 두 줄 콤팩트 row 리스트. row 첫 줄 = `N.` 번호 + 카테고리 chip(`.badge-${tone}` — 파스텔 배경 + dot 컬러 보더·텍스트) + 제목 (`items-center` 한 줄 정렬), 둘째 줄 = 기간·관련전공. 상단 필터 칩은 별도 패턴(흰 배경 + 컬러 dot). 클릭 → 상세. 검색은 experienceTitle 부분일치만 (클라이언트).
│   ├── NewExperience.jsx # /my-experience/new — useCreateExperience + ExperienceForm 래퍼
│   ├── ExperienceDetail.jsx # /my-experience/:id — view/edit 토글 + useUpdateExperience + useDeleteExperience (Modal 삭제 확인)
│   ├── MyCertificates.jsx   # /my-certificates — 단일 .card !p-0 셸 안의 <ol> 번호 매긴 두 줄 콤팩트 row 리스트 (검색 필터 없음). row 전체가 Link → /my-certificates/:id. 목록 자체엔 수정·삭제 액션 없음 (상세 페이지에서 처리).
│   ├── NewCertificate.jsx   # /my-certificates/new — useCreateCertificate + CertificateForm 래퍼
│   ├── CertificateDetail.jsx # /my-certificates/:id — view/edit 토글 + useUpdateCertificate + useDeleteCertificate (Modal 삭제 확인). 백엔드 단건 GET 없어 목록 캐시에서 ID 매칭. 증빙 자료 섹션은 item.fileUrl 있으면 다운로드 링크, 없으면 빈 상태 안내.
│   ├── Write.jsx            # /write — 자소서 작성 2단계. Step1 지원정보 → useCreateEssay(POST /essays/create) → essayId. Step2 문항 추가 — 한 카드씩 입력 → useCreateEssayQuestion / useGenerateAnswer (AI 초안: placeholder POST → questionId 받기 → generate 호출). 저장된 문항 미리보기 + "작성 완료" → /essays/:essayId.
│   ├── Essays.jsx           # /essays — 자소서 목록. useEssays() (GET /essays). progress 뱃지 + useUpdateEssayResult 드롭다운 (PASS/FAIL/IN_PROGRESS) + 행 클릭 → /essays/:essayId. 친구 mock 의 prog/total/dday 컬럼은 백엔드 미제공이라 제거.
│   ├── EssayView.jsx        # /essays/:id — 자소서 열람. useEssay(id) → normalize 어댑터로 globalReq/updatedAt 통일. 회사·직무·공통 요구사항 + 문항 읽기. 친구 mock 의 UsedExperiences 섹션은 백엔드 QuestionResponse 가 relatedExperience 필드를 안 줘서 제거.
│   ├── EssayEdit.jsx        # /essays/:id/edit — 자소서 수정. 지원 정보 카드 PATCH /essays/:id, 문항 카드 PATCH /essays/:id/questions/:qid, 새 문항 POST /essays/:id/questions, AI 재생성 POST /essays/regenerate.
│   ├── Stats.jsx            # /stats — 통계 페이지. useMyStats(groupBy) 실 데이터(placeholderData 로 toggle 시 깜빡임 방지). 단일 .card !p-0 통합 카드: 막대 + 도넛은 lg:grid-cols-[1.4fr_1fr] 좌우 분할 / 5축 막대(헤더 양 끝 chevron carousel 로 STATE/SCHOOL_NUM/WORKER 토글, dot indicator) / 2D 도넛(흰색 stroke 외곽선 + 작은 슬라이스는 stroke 얇게, hover 시 scale + drop-shadow 로 z 축 lift, 마우스 커서 따라다니는 툴팁, 범례 하단 우측에 작게) / 부족한 경험.
│   └── Info.jsx          # /info — useMe + view/edit 모드 + useUpdateMe. 학적/직무 enum 선택자. 하단에 회원 탈퇴(POST /auth/withdraw) 위험 영역 + 확인 모달 ("탈퇴" 입력 검증)
```

(`assets/` 디렉토리는 2026-05-10 전수 정리에서 제거됨 — react.svg / vite.svg / hero.png 모두 참조 0건이라 삭제. 신규 자산이 필요하면 `src/assets/` 다시 만들어 import.)

### 사이드바 아이콘 lookup

`Sidebar.jsx` 상단에 `const ICONS = { Home, PencilLine, BarChart3, User }`. `data/sidebar.js`의 `icon: 'Home'` 같은 문자열을 lookup. **새 nav 아이템 아이콘 추가 시 데이터 + lookup 둘 다 갱신**해야 렌더됨.

### Three.js (`PeersOrb`)

`src/components/PeersOrb.jsx`는 npm `three` 의존(`^0.184.0`). 5축 데이터 contract `{ label, me, peers, seniors? }` (값 0–100, `seniors` 누락 시 0). 나/동기/선배 3개 prism 을 z=0 평면 가운데 두고 ±양쪽(`mesh.position.z = -depth/2`, depth 0.07/0.10/0.13)으로 솟는 **샌드위치** prism — 회전 어느 각도에서도 양면 모두 튀어나와 보임. 앞/뒤 cap 외곽선 둘 다 그림. 범례 swatch 클릭 시 native `<input type="color">` 가 열려 색을 바꿀 수 있고, 선택은 `localStorage.peersOrb.colors.v1` 에 영속화. 색/가시성 변경은 ref 로 직접 갱신해 scene 재구축 회피. **친구 Dashboard 가 props 로 `axes` (백엔드 `peerAxes` 또는 빈 응답일 때 `PEER_AXES` mock) + `sub` + `warning` 만 넘김** — 백엔드 `peerAxes` 가 비어 오면 빨간 경고 카피와 함께 mock 5축으로 fallback (그래프 빈 채 three.js 터지는 것 방지).

### 대시보드 카드 (2026-05-16 친구 패턴으로 환원)

본인 통합 카드(HeroBanner+PeersOrb+EssayListCard 한 셸) / MyRoadmapCard / SeniorRoadmapCard 패턴은 폐기. 현재는 친구가 만든 단일 컬럼 스택 — HeroBanner → PeersOrb → 내 RoadmapCard → 선배 RoadmapCard.

- `dashboard/HeroBanner.jsx` — 그라데이션 배너. `hasProfile=true` 분기에서는 카피만 노출, `!hasProfile` 일 때 "온보딩 시작하기" CTA. (친구 Dashboard 는 항상 `hasProfile={true}` 로 호출 — onboarding 분기는 ProtectedRoute / Onboarding 페이지가 처리.)
- `dashboard/RoadmapCard.jsx` — 헤더(제목 + `CategoryLegend`) + 본체. `carousel={{ list, idx, onChange }}` prop 주면 좌우 화살표 노출(선배용). `items` 와 `showNowMarker` 는 `Roadmap` 으로 그대로 위임.
- `dashboard/Roadmap.jsx` — 입학(`rangeStart`)~졸업(`rangeEnd`) 사이 비율 좌표로 마일스톤 점 배치. hover/click 시 카테고리·제목·날짜·detail 칩 표시. 색은 `CAT_COLORS` lookup.
- `dashboard/CategoryLegend.jsx` — `CAT_LABELS`/`CAT_COLORS` 5종 색상 범례. 두 RoadmapCard 헤더에서 공유.
- 본인 친구 Dashboard 는 빈 응답 (`myRoadmap=[]` 또는 `seniorRoadmaps=[]`) 일 때 `EmptyRoadmapCard` 인라인 컴포넌트로 안내 ("아직 등록한 경험이 없어서…" + "경험을 등록하러 가볼까요?" CTA → `/my-experience/new`).

## 컨벤션

- **파일 헤더 주석은 한국어**, 모듈의 _의도_(props 모양, 강제하는 비즈니스 룰)를 짧게 적음. 새 파일도 같은 스타일.
- **본문 주석 최소화** — 잘 짠 식별자가 무슨 코드인지 설명함. 비자명한 *왜*만 코멘트.
- **`React` import 금지** — eslint 가 unused import 로 잡음. 자동 JSX 런타임이라 필요 없음. `useState` 등 named export 만 가져옴. (예외: `<React.Fragment>` 처럼 namespace 접근이 필요한 경우만 유지 — 가능하면 `<Fragment>` named import 로 교체).
- 라이트 모드 전용. 다크 모드 대응 흔적 없음.

## 백엔드 연동 시작 시 체크리스트

(상세는 [../CLAUDE.md](../CLAUDE.md))

1. `.env`에 `VITE_API_URL=https://api.logi.p-e.kr/api` (배포 백엔드) 또는 `http://localhost:8080/api` (로컬 백엔드). `/api` 포함.
2. 백엔드 yml의 `app.cors.allowed-origins`에 dev 포트 추가 — 현재는 `http://localhost:3000`만 허용.
3. `axios.js`에 response interceptor 추가해서 `ApiResponse<T> = { statusCode, message, data }` 의 `data`를 까는 layer 만들면 호출부가 깔끔해짐.
4. 토큰 저장 키는 `localStorage.token`으로 약속됨 (interceptor가 그 키를 읽음). 로그인 응답 `accessToken`을 그 키에 저장.
5. `KookminDepartment`/`JobFirst/Second/Third` 등 백엔드 enum 직렬화 형식은 `lib/enums.js` 가 동기 보유 — 백엔드에서 enum 추가/변경 시 `enums-data.js` 수동 갱신 필요.
