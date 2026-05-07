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

- `VITE_API_URL` — axios client(`src/api/axios.js`)에 주입. 백엔드 `context-path: /api` 이므로 값에 `/api`까지 포함.
- 기본 (`.env`, **git tracked**): `https://3.238.29.250/api` (실서버 IP). 자체서명 인증서라 브라우저 처음 방문 시 "고급 → 진행" 한 번 필요.
- 도메인 `https://logi.p-e.kr/api` 는 옛 IP를 가리켜 죽어있음 (DNS 갱신 전). 살아나면 default 를 그쪽으로 바꿀 것.
- 로컬 백엔드로 override 하려면 `.env.local` 에 `VITE_API_URL=http://localhost:8080/api` (`.env.local.example` 참고). `.env.local` 은 gitignored.

## Architecture

### Routing (`src/App.jsx`)

`src/main.jsx` 는 `createRoot(...).render(<App />)` 만. 라우트 트리 + `QueryClientProvider` + `HashRouter` 는 `src/App.jsx` 에 분리되어 있음 (이렇게 분리 안 하면 `react-refresh/only-export-components` 룰 때문에 HMR 깨짐).

- **`HashRouter`** (BrowserRouter 아님) — URL이 `#/...`. 정적 호스팅(GitHub Pages 등)에서도 라우팅 깨지지 않게.
- 라우트 두 종류:
  - **Chromeless**: `/landing`, `/onboarding` — 사이드바 없이 전체 화면.
  - **Layout-wrapped**: 그 외 전부 `<Layout/>`(사이드바 + `<Outlet/>`)에 감싸짐. 인덱스(`/`)와 unknown path는 `/dashboard`로 redirect.
- 미구현 페이지(`/write`, `/essays`, `/essays/:id`, `/stats`, `/info`, `/my-experience`, `/my-experience/new`, `/my-experience/:id`, `/my-certificates`, `/my-certificates/new`, `/my-certificates/:id/edit`)는 전부 `<Placeholder/>`.

### CSS / Tailwind

- `index.css` 가 `src/main.jsx`에서 import 됨. 이 import 한 줄이 빠지면 **Tailwind가 통째로 안 먹어서 페이지가 unstyled HTML로 보임** — 초기 커밋에 이게 누락되어 있어서 첫 dev 서버 띄웠을 때 스타일이 전혀 안 나왔던 적이 있음 (commit `270814c`에서 수정). 새 글로벌 CSS도 `index.css`에 추가.
- `tailwind.config.js`에 커스텀 팔레트(`primary`, `sidebar`, `ink`, `navy`, `cat`, `paper`, `page`, `border`), 커스텀 `borderRadius`, `boxShadow` 토큰. **`theme`이 named export로도 노출** — 별도 `preview.html`(CDN Tailwind)에 인라인 주입하기 위해서임. named export와 default export의 theme를 동기화해서 유지.
- `src/index.css`의 `@layer components`에 canonical primitive: `.card`, `.btn-default`, `.btn-primary`, `.btn-ghost`, `.btn-sm`, `.field`, `.badge-{gray|navy|green|red|amber}`. **유틸리티 체인보다 이 클래스 우선 사용**.
- `src/lib/cn.js` 는 작은 clsx 대체. 문자열/배열/`{class: bool}` 객체 모두 받음. 조건부 클래스 합성에 사용.

### Path alias

- `@` → `./src` (vite.config.js). 기존 파일들은 거의 다 상대 경로 import — 둘 다 작동, 새 파일에서 어느 쪽이든 OK.

### Data flow (현재 상태)

- 모든 페이지 데이터가 `src/data/*.js` 의 정적 객체에서 옴 (sidebar, dashboard, onboarding, profile, experiences, certificates, essays).
- `src/api/axios.js` — 단일 axios 인스턴스. `baseURL = VITE_API_URL`, `withCredentials: true`, request interceptor가 `localStorage.token`을 읽어 `Authorization: Bearer ...` 세팅. **현재 어디서도 호출되지 않음** — 백엔드 연동 미시작.
- `@tanstack/react-query` `QueryClientProvider`가 `main.jsx`에 마운트되어 있지만 실제 query/mutation 사용처 없음.
- `zustand` 설치만 되어 있고 store 없음.

### 디렉토리 / 컴포넌트 맵

```
src/
├── main.jsx              # entry — QueryClientProvider + HashRouter + index.css import
├── index.css             # Tailwind directives + base + @layer components 토큰
├── api/axios.js          # 인터셉터 달린 axios (미사용 상태)
├── lib/cn.js             # clsx 대체
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
│   ├── Sidebar.jsx       # NAV/RELATED_SITES 렌더, lucide ICONS lookup, DEV 빌드에서만 미리보기 링크 + 사용자 footer (로그아웃 stub: localStorage.token 비우고 /landing — PR#3 에서 useAuth 로 교체)
│   ├── Crumbs.jsx        # 빵부스러기. items: string[] | {label, to?}[]
│   ├── Card.jsx          # Card + CardHeader 두 export
│   ├── Button.jsx        # variant: default|primary|ghost|danger, size: md|sm
│   ├── Modal.jsx         # open/onClose/title/sub/footer/width 슬롯
│   ├── Badge.jsx         # tone: gray|navy|green|red|amber
│   ├── PeersOrb.jsx      # Three.js 5축 입체 레이더 — 데이터 contract 고정 (아래 참조)
│   └── dashboard/        # HeroBanner, MyRoadmapCard, SeniorRoadmapCard
├── pages/
│   ├── Landing.jsx       # 풀-블리드 split-screen 로그인 (mock — Google 버튼 클릭 시 navigate(/onboarding|/dashboard))
│   ├── Onboarding.jsx    # 단일 페이지 폼: 이름/학번/전공/학년/직무 트리
│   ├── Dashboard.jsx     # Crumbs + HeroBanner + (PeersOrb + MyRoadmapCard + SeniorRoadmapCard) 스택
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
