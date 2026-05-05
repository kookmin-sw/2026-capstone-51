# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Logi — Kookmin University 자소서 (self-introduction) platform. React 19 + Vite 8 SPA, JSX only (no TypeScript). UI copy is Korean.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — production build to `dist/`
- `npm run lint` — ESLint (flat config, `eslint.config.js`)
- `npm run preview` — preview the built bundle
- `npm test` — `eslint . && prettier --check .` (no unit tests yet; this is the lint+format gate)
- Prettier config: `.prettierrc` (single quotes, semis, 2-space, `printWidth: 80`).

### Pre-commit hook

`.husky/pre-commit` runs `npx lint-staged`. The `lint-staged` block in `package.json` runs `eslint --fix` + `prettier --write` on staged `*.{js,jsx}` and `prettier --write` on staged `*.{css,json,md}`. So commits auto-format/auto-fix instead of failing. Don't bypass with `--no-verify` — if the hook fails, the underlying lint error needs a real fix.

## Environment

- `VITE_API_URL` — required for the axios client (`src/api/axios.js`). Stored in `.env` (gitignored).

## Architecture

### Routing (`src/main.jsx`)

- `HashRouter` (not BrowserRouter) — URLs use `#/...`.
- Two route shapes:
  - **Chromeless**: `/landing`, `/onboarding` render bare (no sidebar).
  - **Layout-wrapped**: everything else nests inside `<Layout/>`, which renders `<Sidebar/>` + `<Outlet/>`. Index and unknown paths redirect to `/dashboard`.
- Most non-dashboard routes currently render `<Placeholder/>` — they are wired in the router but not implemented.

### Design system (Tailwind)

- `tailwind.config.js` defines a custom palette (`primary`, `sidebar`, `ink`, `navy`, `cat`, `paper`, `page`, `border`), custom `borderRadius`, and `boxShadow` tokens. `theme` is exported as a named export specifically so it can be inlined into a separate `preview.html` that uses CDN Tailwind — keep the named export and the default export's theme in sync.
- `src/index.css` `@layer components` defines the canonical primitives: `.card`, `.btn-default`, `.btn-primary`, `.btn-ghost`, `.btn-sm`, `.field`, `.badge-gray|navy|green|red|amber`. **Prefer these classes over inline utility chains** when one fits.
- `src/lib/cn.js` is a tiny clsx replacement — accepts strings, arrays, and `{class: bool}` objects. Use it for conditional class composition.

### Data flow

- Mock data lives in `src/data/*.js` (sidebar nav, dashboard axes/roadmaps, onboarding job tree, profile, experiences, certificates, essays). Pages currently consume these directly; the API layer is set up but largely unused.
- API client: `src/api/axios.js` — single axios instance, `baseURL = VITE_API_URL`, `withCredentials: true`, request interceptor reads `localStorage.token` and sets `Authorization: Bearer ...`.
- `@tanstack/react-query` (`QueryClientProvider` is mounted at the root) and `zustand` are installed but most pages haven't been migrated onto them yet.

### Path alias

- `@` → `./src` (configured in `vite.config.js`). Existing files mostly use relative imports; either is fine.

### Three.js dependency (PeersOrb)

`src/components/PeersOrb.jsx` renders a 3D radar inside a glass sphere using `import * as THREE from 'three'` (npm dep, currently `^0.184.0`). The 5-axis data contract (`{ label, me, peers }`, values 0–100) is intentionally fixed — the file's header comment forbids changing the inputs even when refactoring visuals.

### Known broken imports

`src/pages/Dashboard.jsx` imports `./components/dashboard/HeroBanner`, `MyRoadmapCard`, and `SeniorRoadmapCard` from a `src/components/dashboard/` subdirectory that does not exist. The route will fail to render until those components are added (or the imports stubbed). Don't assume Dashboard works as-is.

## Conventions

- File-level comments in this repo are written in Korean and tend to describe the *intent* of the module (what props look like, what business rule is enforced). Match that style if you add new files in this codebase.
- Lucide icons are imported by name from `lucide-react`. The Sidebar maps icon names from data (`'Home'`, `'PencilLine'`, ...) through an `ICONS` lookup — when adding a new nav item icon, add it both to the data file and the lookup.
