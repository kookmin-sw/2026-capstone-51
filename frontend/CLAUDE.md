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

- `VITE_API_URL` — axios client(`src/api/axios.js`)에 주입. 백엔드 `context-path: /api` 이므로 값에 `/api`까지 포함. 기본 `https://3.238.29.250/api` (실서버 IP — 자체서명 인증서라 브라우저 첫 방문 시 "고급 → 진행" 한 번 필요).
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client_id. 백엔드 팀이 Google Console 에 등록한 값과 동일해야 함. `client_secret` 은 백엔드만 보유.
- `VITE_GOOGLE_REDIRECT_URI` — Google Console 에 등록된 redirect_uri. 기본 `http://localhost:3000/auth/callback`. 다른 값으로 바꾸려면 Google Console 등록도 같이.
- 도메인 `https://logi.p-e.kr/api` 는 옛 IP를 가리켜 죽어있음 (DNS 갱신 전). 살아나면 default 를 그쪽으로 바꿀 것.

## Architecture

### Routing (`src/App.jsx`)

`src/main.jsx` 는 `createRoot(...).render(<App />)` 만. 라우트 트리 + `QueryClientProvider` + `HashRouter` 는 `src/App.jsx` 에 분리되어 있음 (이렇게 분리 안 하면 `react-refresh/only-export-components` 룰 때문에 HMR 깨짐).

- **`HashRouter`** (BrowserRouter 아님) — URL이 `#/...`. 정적 호스팅(GitHub Pages 등)에서도 라우팅 깨지지 않게.
- 라우트 두 종류:
  - **Chromeless**: `/landing`, `/auth/callback`, `/onboarding` — 사이드바 없이 전체 화면.
  - **Layout-wrapped**: 그 외 전부 `<Layout/>`(사이드바 + `<Outlet/>`)에 감싸짐. 인덱스(`/`)와 unknown path는 `/dashboard`로 redirect.
- 미구현 페이지(`/write`, `/essays`, `/essays/:id`, `/stats`, `/info`, `/my-experience`, `/my-experience/new`, `/my-experience/:id`, `/my-certificates`, `/my-certificates/new`, `/my-certificates/:id/edit`)는 전부 `<Placeholder/>`.

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
   /auth/callback (AuthCallback.jsx)
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

**Onboarding → /users/me 매핑 정책 (현재):**

- `userName ← name (trim)`, `schoolNumber ← studentId (trim)`, `score ← parseFloat(gpa) || null`.
- `state ← year(1..5)` 단순 매핑 (`FRESH_MAN/SOPHOMORE/JUNIOR/SENIOR/SENIOR`).
- `major / minor / jobFirst / jobSecond / jobThird` 는 **null** — 백엔드 enum (KookminDepartment 한국어 풀네임, JobFirst·Second·Third 한국 표준직업분류) 정합성 정책 미정. 단계 3 (페이지 빌드) 에서 enum 어댑터 완성 후 매핑 추가.

### CSS / Tailwind

- `index.css` 가 `src/main.jsx`에서 import 됨. 이 import 한 줄이 빠지면 **Tailwind가 통째로 안 먹어서 페이지가 unstyled HTML로 보임** — 초기 커밋에 이게 누락되어 있어서 첫 dev 서버 띄웠을 때 스타일이 전혀 안 나왔던 적이 있음 (commit `270814c`에서 수정). 새 글로벌 CSS도 `index.css`에 추가.
- `tailwind.config.js`에 커스텀 팔레트(`primary`, `sidebar`, `ink`, `navy`, `cat`, `paper`, `page`, `border`), 커스텀 `borderRadius`, `boxShadow` 토큰. **`theme`이 named export로도 노출** — 별도 `preview.html`(CDN Tailwind)에 인라인 주입하기 위해서임. named export와 default export의 theme를 동기화해서 유지.
- `src/index.css`의 `@layer components`에 canonical primitive: `.card`, `.btn-default`, `.btn-primary`, `.btn-ghost`, `.btn-sm`, `.field`, `.badge-{gray|navy|green|red|amber}`. **유틸리티 체인보다 이 클래스 우선 사용**.
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
- Dashboard 의 학기 타임라인(`MyRoadmapCard`/`SeniorRoadmapCard`)은 `overflow-x-auto` 안에 `min-w-[640px]` 의 `grid-cols-8` 을 둠 — 좁은 화면에서는 가로 스크롤로 8학기 칼럼 유지.
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

- `keys.js` — queryKey 팩토리 (`qk.me()`, `qk.experiences.one(id)` ...).
- `useMe.js` / `useExperiences.js` / `useCertificates.js` / `useEssays.js` — 도메인별 react-query 훅. 실서버 OpenAPI 의 모든 구현된 엔드포인트 커버.
- 미구현 백엔드 (`/essays/recommand`, `/generate`, `/regenerate`, `/users/me/dashboard`, `/users/me/stats`) 는 훅 없음 — 백엔드 일정 후 추가.

**zustand 스토어** — [`src/store/`](2026-capstone-51/frontend/src/store/)

- `useAuth` — `isAuthenticated`, `user`, `setTokens`, `setUser`, `logout`. `logout` 은 클라이언트 상태 즉시 비우고 백엔드 `/auth/logout` 을 best-effort 호출 (실패 무시).
- `useToast` — `toasts`, `push`, `dismiss` + 컴포넌트 외부 헬퍼 `toast.info/success/error`.

**enum 어댑터** — [`src/lib/enums.js`](2026-capstone-51/frontend/src/lib/enums.js)

- `ExperienceCategory` 백엔드↔프론트 매핑, `Progress`/`State` 한글 라벨, 통계 groupBy.
- `KookminDepartment` / `JobFirst·Second·Third` 는 백엔드 정책 결정 후 추가 (한국어 풀네임 ↔ 프론트 옵션 차이).

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
│   ├── useAuth.js        # 토큰/유저 상태. logout: 클라 즉시 비움 + 백엔드 /auth/logout best-effort
│   └── useToast.js       # 토스트 큐 + toast.info/success/error 헬퍼
├── lib/
│   ├── cn.js             # clsx 대체
│   └── enums.js          # 백엔드 ↔ 프론트 enum 매핑 (ExperienceCategory, State, Progress 등)
├── data/                 # 정적 mock
│   ├── sidebar.js        # NAV, RELATED_SITES, CURRENT_USER
│   ├── dashboard.js      # PEER_AXES, CAT_LABELS, CAT_COLORS, SEMESTERS, MY_ROADMAP, SENIOR_ROADMAPS, ymToSemIndex
│   ├── onboarding.js     # MAJORS (단순 학부 리스트), JOB_TREE (3단 트리)
│   ├── profile.js        # PROFILE, INTRO_TEXTS, PROFILE_LINKS
│   ├── experiences.js    # CAT_LABEL, HISTORY_ITEMS (full STAR mock)
│   ├── certificates.js   # 자격증 mock + (구독/CRUD store 패턴 흔적)
│   └── essays.js
├── components/
│   ├── Layout.jsx        # Sidebar + Outlet 셸 (max-width 1100)
│   ├── Sidebar.jsx       # NAV/RELATED_SITES 렌더, lucide ICONS lookup, DEV 빌드에서만 미리보기 링크 + 사용자 footer. 로그아웃 = useAuth.logout() (클라 즉시 비움 + 백엔드 /auth/logout best-effort)
│   ├── Toaster.jsx       # 우상단 토스트 스택. App 루트에 한 번 마운트
│   ├── Crumbs.jsx        # 빵부스러기. items: string[] | {label, to?}[]
│   ├── Card.jsx          # Card + CardHeader 두 export
│   ├── Button.jsx        # variant: default|primary|ghost|danger, size: md|sm
│   ├── Modal.jsx         # open/onClose/title/sub/footer/width/hideClose 슬롯. backdrop click + 우상단 X + Esc 키로 닫힘. 열린 동안 body 스크롤 잠금
│   ├── Badge.jsx         # tone: gray|navy|green|red|amber
│   ├── PeersOrb.jsx      # Three.js 5축 입체 레이더 — 데이터 contract 고정 (아래 참조)
│   └── dashboard/        # HeroBanner, MyRoadmapCard, SeniorRoadmapCard
├── pages/
│   ├── Landing.jsx       # 풀-블리드 split-screen. Google 버튼 클릭 시 accounts.google.com 로 풀페이지 리다이렉트
│   ├── AuthCallback.jsx  # OAuth 콜백 — grant code → POST /auth/login → firstLogin 분기
│   ├── Onboarding.jsx    # 단일 페이지 폼. 시작하기 = PUT /users/me → /dashboard
│   ├── Dashboard.jsx     # Crumbs + HeroBanner + (PeersOrb + MyRoadmapCard + SeniorRoadmapCard) 스택 (mock)
│   └── Placeholder.jsx   # 미구현 라우트 공통 stub
└── assets/               # hero.png, react.svg, vite.svg
```

### 사이드바 아이콘 lookup

`Sidebar.jsx` 상단에 `const ICONS = { Home, PencilLine, BarChart3, User }`. `data/sidebar.js`의 `icon: 'Home'` 같은 문자열을 lookup. **새 nav 아이템 아이콘 추가 시 데이터 + lookup 둘 다 갱신**해야 렌더됨.

### Three.js (`PeersOrb`)

`src/components/PeersOrb.jsx`는 npm `three` 의존(`^0.184.0`). 5축 데이터 contract `{ label, me, peers }` (값 0–100)는 파일 상단 주석에 **변경 금지** 명시 — 시각화만 바꾸고 데이터 모양은 유지.

### 대시보드 카드

- `dashboard/HeroBanner.jsx` — 그라데이션 배너 + CTA. `hasProfile=true` 분기로 신규/재방문 카피 전환.
- `dashboard/MyRoadmapCard.jsx` — `SEMESTERS`(8학기 1-1~4-2) 가로 grid에 `MY_ROADMAP` 마일스톤을 `ymToSemIndex(y, m)`으로 버킷팅. `TODAY_SEM_INDEX = 6` (4-1) 학기 하이라이트.
- `dashboard/SeniorRoadmapCard.jsx` — `SENIOR_ROADMAPS` 3명 배열을 ←/→ 화살표로 carousel. 같은 학기 축에 마일스톤 매핑.

## 컨벤션

- **파일 헤더 주석은 한국어**, 모듈의 _의도_(props 모양, 강제하는 비즈니스 룰)를 짧게 적음. 새 파일도 같은 스타일.
- **본문 주석 최소화** — 잘 짠 식별자가 무슨 코드인지 설명함. 비자명한 *왜*만 코멘트.
- **`React` import 금지** — eslint 가 unused import 로 잡음. 자동 JSX 런타임이라 필요 없음. `useState` 등 named export 만 가져옴. (예외: `<React.Fragment>` 처럼 namespace 접근이 필요한 경우만 유지 — 가능하면 `<Fragment>` named import 로 교체).
- 라이트 모드 전용. 다크 모드 대응 흔적 없음.

## 백엔드 연동 시작 시 체크리스트

(상세는 [../CLAUDE.md](../CLAUDE.md))

1. `.env`에 `VITE_API_URL=http://localhost:8080/api` (`/api` 포함).
2. 백엔드 yml의 `app.cors.allowed-origins`에 dev 포트 추가 — 현재는 `http://localhost:3000`만 허용.
3. `axios.js`에 response interceptor 추가해서 `ApiResponse<T> = { statusCode, message, data }` 의 `data`를 까는 layer 만들면 호출부가 깔끔해짐.
4. 토큰 저장 키는 `localStorage.token`으로 약속됨 (interceptor가 그 키를 읽음). 로그인 응답 `accessToken`을 그 키에 저장.
5. `KookminDepartment`/`JobFirst/Second/Third` 등 백엔드 enum 직렬화 형식과 프론트 `data/onboarding.js`의 옵션이 일치해야 함 — 현재는 다름.
