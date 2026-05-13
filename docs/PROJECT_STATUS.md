# PROJECT STATUS

> 새 세션에서 이어받을 때 가장 먼저 읽을 파일.
> 최신 상황을 파악하기 위해 이 문서 → `frontend/CLAUDE.md` → 변경된 파일 순서로 보면 됩니다.
>
> 이 문서는 **항상 최신 상태**로 유지됩니다 — 코드/파일/구현 상태가 바뀔 때마다 같이 갱신.

---

## 현재 브랜치 / 작업 범위

- **브랜치**: `frontend/chore/safety-fixes`
- **레포**: `kookmin-sw/2026-capstone-51` (default `master`)
- **작업 범위**: 프론트엔드 전용 (`frontend/`). `backend/`는 read-only 컨텍스트로만 참고.
- **푸시/PR 정책**: 로컬 커밋만. `git push` / PR 생성 안 함.

## 최근 작업 단위 (가장 최근부터)

### 자격증 폼 첨부 박스의 "교체" 버튼 제거 (2026-05-13)

- **목표**: 사용자 요청 — 자격증 PDF 첨부 후 박스에 [교체] / [X] 두 버튼이 있는데 [교체] 는 불필요.
- **변경**:
  - [`src/components/certificate/CertificateForm.jsx`](../frontend/src/components/certificate/CertificateForm.jsx) — 채워진 파일 박스의 [교체] 버튼 1개 제거. [X] 만 남음. 교체하려면 X로 제거 후 다시 첨부.
- **건드리지 않은 항목**: 빈 dropzone 의 클릭/드래그&드롭, 채워진 박스의 드래그&드롭(여전히 새 파일을 떨어뜨리면 교체됨 — drop 이벤트가 acceptFile 호출), 검증 / 에러 메시지.
- **검증**: `npx eslint ... CertificateForm.jsx` ✅ / `npx prettier --check` ✅ / `npm run build` ✅ 454ms.
- **이유**: 사용자가 명시 — 교체 UX 불필요. X 로 제거하거나 박스에 새 파일 드래그&드롭하는 두 방법 만 남기는 게 깔끔.

### 자격증 YmdInput 입력 불가 버그 수정 — uncontrolled 패턴으로 전환 (2026-05-13)

- **목표**: 사용자 보고 — 자격증 폼 년월일 칸에 숫자가 한 글자도 안 박힘.
- **원인**: 직전 커밋의 `YmdInput` 이 controlled 였고, `joinYmd` 가 셋 중 한 칸이라도 비면 `''` 를 반환. 사용자가 '2' 입력 → onChange('') → 부모 form state '' → 다음 렌더에 `value=''` → input 비워짐. partial 입력 자체가 부모로 못 흘러가는 dead-end.
- **변경**:
  - [`src/components/certificate/CertificateForm.jsx`](../frontend/src/components/certificate/CertificateForm.jsx) — `YmdInput` 을 fully uncontrolled 로 전환. `value` prop → `defaultValue` 로 이름 변경(mount 시 1 회만 초기화). partial 입력 상태(`parts`) 는 자식 내부 state 가 진실의 원천. 부모 form 에는 onChange 콜백을 통해 'YYYY-MM-DD' 완성 형태 또는 '' 만 전달 — 사용자가 한 칸을 비우면 부모는 '' 를 받지만 자식의 다른 두 칸은 그대로 유지됨.
- **건드리지 않은 항목**: `joinYmd` (셋 중 비면 '' 정책 그대로), `isValidYmd` 검증, 자격증 외 다른 폼.
- **검증**: `npx eslint ... CertificateForm.jsx` ✅ EXIT 0 / `npx prettier --check` ✅ / `npm run build` ✅ 476ms.
- **이유**: React 19 `react-hooks/set-state-in-effect` 룰이 useEffect 안에서 setState 호출을 금지함. controlled + `useEffect(...sync...)` 패턴은 막혔고, "Adjusting state during rendering" 패턴(`if (prev !== curr) setState`) 은 자식이 부모를 ''로 만든 직후 자기 자신도 비워지는 또 다른 버그를 만듦. partial 입력 UX 가 필요한 입력 컴포넌트에서 controlled 강제는 부적절 → uncontrolled 가 자연스러움.

### 경험 필터 칩에 카테고리 색 점 표시 (2026-05-13)

- **목표**: 사용자 후속 요청 — 카테고리 뱃지 색 분리 작업의 연장. 목록 상단 필터 칩에도 같은 색을 점(dot) 으로 표시해 한 화면에서 색·라벨 매핑을 즉시 학습할 수 있게.
- **변경**:
  - [`src/pages/MyExperience.jsx`](../frontend/src/pages/MyExperience.jsx) — `FilterChip` 에 `tone` prop 추가. tone 있으면 라벨 앞에 1.5px 원형 dot 렌더 (`bg-primary-700 / [#1F7A4E] / amber-600 / ink-400 / red-500`). "모두" 칩은 tone 없음 → dot 없음. `EXPERIENCE_CATEGORY_OPTIONS.map` 시 `EXPERIENCE_CATEGORY_TONE[opt.value]` lookup 으로 주입.
- **건드리지 않은 항목**: 자격증 페이지 필터(현재 필터 자체가 없음), 자소서 페이지 필터(진행 상태 뱃지는 별도 톤).
- **검증**: `npx eslint ... MyExperience.jsx` ✅ / `npx prettier --check` ✅ / `npm run build` ✅ 618ms.
- **이유**: 뱃지 색이 카테고리별로 다르지만 처음 보는 사용자는 "어떤 색이 어떤 카테고리"인지 즉시 매핑 못 함. 필터 칩에 dot 을 같이 노출해 라벨+색 학습을 1 회 동시에 시킴.

### 자격증 폼 — 캘린더 → 년월일 숫자 입력 + PDF 드래그&드롭 (2026-05-13)

- **목표**: 사용자 요청 2 건.
  - (1) 자격증 취득일·만료일은 요일 정보가 의미 없어서 캘린더 UI(브라우저 native `<input type="date">`) 를 사용하지 않고 **년/월/일 숫자만 입력** 받게.
  - (2) 증빙 PDF 박스가 클릭으로만 첨부 가능하고 드래그&드롭이 안 됨 — `<button>` 에 drag 핸들러가 없어서. 드래그&드롭 활성화.
- **변경**:
  - [`src/components/certificate/CertificateForm.jsx`](../frontend/src/components/certificate/CertificateForm.jsx) —
    - **YmdInput 헬퍼**: 한 줄 안에 `YYYY 년 / MM 월 / DD 일` 텍스트 input 3 칸. 입력값에서 숫자만 추출, 각각 maxLength 4/2/2. 한 칸이라도 비면 `onChange('')`, 모두 채워지면 `onChange('YYYY-MM-DD')` (자동 zero-pad). 취득일 / 만료일 두 곳에서 사용.
    - `isValidYmd` 검증 추가 — 형식 외에 실제 존재하는 날짜인지(예: `2026-02-31` 거부) 확인.
    - **PDF 드래그&드롭**: 빈 dropzone(`<button>`) + 채워진 파일 박스(`<div>`) 둘 다 `onDragOver/Enter/Leave/Drop` 핸들러 부착. `isDragOver` state 로 hover 시 primary 톤 border/bg 강조. 검증 로직(`acceptFile`)을 file picker 와 공통화.
    - 사용 안 하는 헬퍼 제거 (`fmtBytes` 등은 유지, 진행 중인 작업과 무관한 제거 안 함).
- **건드리지 않은 항목**: 자격증 외 도메인 폼 (경험 폼은 캘린더 UI 그대로 — 시작/종료 기간은 요일 의미가 약하지만 사용자 요청 범위 밖), `useCertificates` 훅, swagger 페이로드 형식 (`getDate` / `expirationDate` 'YYYY-MM-DD' 그대로).
- **검증**: `npx eslint src/...` ✅ / `npx prettier --check ...` ✅ / `npm run build` ✅ 676ms.
- **이유**: 자격증의 일자는 사용자가 시험 응시증/자격증 사본에서 그대로 옮겨 적는 작업이라 캘린더보다 숫자 직접 입력이 빠름. PDF 드롭은 macOS Finder 등에서 끌어다 놓기 자연스러움.

### 경험 카테고리 뱃지 색 카테고리별 분리 (2026-05-13)

- **목표**: 사용자 보고 — 경험 목록·상세 페이지의 카테고리 뱃지(인턴/대외활동/대내활동/알바)가 전부 navy 한 가지 색이라 한 눈에 구분이 안 됨.
- **변경**:
  - [`src/lib/enums.js`](../frontend/src/lib/enums.js) — `EXPERIENCE_CATEGORY_TONE` 매핑 추가. `intern→navy / activity→green / internal→amber / parttime→gray / cert→red` (`.badge-{tone}` primitive 와 일치).
  - [`src/pages/MyExperience.jsx`](../frontend/src/pages/MyExperience.jsx) / [`src/pages/ExperienceDetail.jsx`](../frontend/src/pages/ExperienceDetail.jsx) — 하드코딩된 `className="badge-navy"` 를 `EXPERIENCE_CATEGORY_TONE` lookup 으로 교체.
- **건드리지 않은 항목**: ExperienceForm 의 카테고리 선택 칩(선택/비선택 토글이 더 중요해 색 분리 불필요), `.badge-*` primitive (기존 5종 그대로 활용).
- **검증**: `npx eslint src/...` ✅ / `npx prettier --check ...` ✅ / `npm run build` ✅ 676ms.
- **이유**: 사용자가 목록에서 어떤 카테고리인지 색만으로 빠르게 스캔할 수 있어야 함. 5종에 새 톤 추가하지 않고 기존 primitive (navy/green/amber/gray/red) 5종 그대로 매핑해 디자인 일관성 유지.

### Crumbs 항목 클릭 시 해당 라우트로 이동 (2026-05-13)

- **목표**: 사용자 보고 — 페이지 상단 breadcrumb 의 "내 경험" 같은 항목을 눌러도 이동이 안 됨. 라우트가 있는 항목은 전부 클릭으로 이동되도록.
- **변경**:
  - [`src/components/Crumbs.jsx`](../frontend/src/components/Crumbs.jsx) — `to` 가 있는 항목은 `react-router` `<Link>` 로 렌더링 (hover 시 색 강조 + underline). 마지막 항목은 `to` 가 있어도 무시 (현재 페이지를 다시 누르는 건 무의미). `to` 없는 항목(예: 그룹 헤더 "MyPage" / "자소서")은 기존처럼 단순 텍스트.
  - 사용처 5 파일에서 `items` 의 중간 항목에 `to` 부여:
    - [`src/pages/ExperienceDetail.jsx`](../frontend/src/pages/ExperienceDetail.jsx) (4 회 호출) — `'내 경험' → /my-experience`
    - [`src/pages/NewExperience.jsx`](../frontend/src/pages/NewExperience.jsx) — `'내 경험' → /my-experience`
    - [`src/pages/NewCertificate.jsx`](../frontend/src/pages/NewCertificate.jsx) — `'내 자격증' → /my-certificates`
    - [`src/pages/EditCertificate.jsx`](../frontend/src/pages/EditCertificate.jsx) (4 회 호출) — `'내 자격증' → /my-certificates`
    - [`src/pages/EssayDetail.jsx`](../frontend/src/pages/EssayDetail.jsx) — `'관리' → /essays`
- **건드리지 않은 항목**:
  - 그룹 헤더 라벨 (`'MyPage'`, `'자소서'`) — 라우트가 없는 사이드바 그룹이라 클릭 비활성 유지. 클릭 시 같은 페이지(/info, /essays)로 보내봐야 같은 위치라 의미가 없거나, 다른 자식 페이지(/my-experience 등)에서 보내면 그룹의 어떤 자식인지 모호.
  - 마지막 항목 (현재 페이지) — 강조 + 클릭 비활성 그대로.
  - `Dashboard` / `Stats` / `MyExperience` / `MyCertificates` / `Info` / `Write` / `MyEssays` 의 breadcrumb — 클릭 가능 중간 항목이 없는 구조 (`[그룹헤더, 마지막]`) 라 코드 수정 불필요.
- **검증**: `npx eslint src/...` ✅ / `npx prettier --check ...` ✅ / `npm run build` ✅ 679ms.
- **이유**: 사용자가 breadcrumb 으로 한 단계 위로 빠르게 돌아가고 싶을 때 해당 라우트로 점프. `react-router` 의 `<Link>` 사용해 풀 페이지 리로드 없이 SPA 내비.

### 경험 폼에 `stateAtCreation` (경험 당시 학년) 필드 추가 + 전공/학년 2열 배치 (2026-05-13)

- **목표**: EC2 백엔드가 `POST /experiences` 요청 검증을 7개 필드(추가된 `@NotNull State stateAtCreation`) 기준으로 바꿔서, 프론트가 6개만 보내면 `400 Bad Request — stateAtCreation: 널이어서는 안됩니다` 로 막힘. 백엔드 변경은 `backend/refacor/experience` 브랜치 `3937cc0` 에 있고 master 미머지 — 하지만 EC2 가 진실 원천이라 그대로 맞춰감.
- **변경**:
  - [`src/components/experience/ExperienceForm.jsx`](../frontend/src/components/experience/ExperienceForm.jsx) — `STATE_OPTIONS` (`lib/enums.js` 이미 존재, 6개: FRESH_MAN/SOPHOMORE/JUNIOR/SENIOR/JOBSEEKER/WORKER) import. "관련 전공" + "경험 당시 학년" 두 필드를 `grid-cols-1 sm:grid-cols-2` 한 줄에 묶음 (학년은 `searchable={false}` Combobox). `toDraft` (수정 모드 prefill — 백엔드 `ExperienceResponse` 에도 같은 이름으로 동봉됨) / `toBody` (POST/PUT 페이로드) / `validate` (필수 검증) 모두 갱신. 헤더 주석에 stateAtCreation 의미·자동 추정 안 하는 이유 명시.
- **건드리지 않은 항목**: `useExperiences` 훅, `ExperienceController` 외 다른 도메인 폼, 카테고리/제목/관련전공/시작일/종료일/STAR 4칸 등 기존 필드.
- **검증**: `npx prettier --check ... ExperienceForm.jsx` ✅ / `npx eslint ... ExperienceForm.jsx` ✅ EXIT 0.
- **이유**: `stateAtCreation` 은 "경험을 시작했을 때의 학년" — 백엔드 약점 추천 쿼리가 "같은 학년이었을 때의 평균"과 비교하기 위해 사용. 사용자 입학년도/휴학 이력 미보유라 startDate 만으로는 자동 추정 불가 → 명시 입력 필드로. 전공·학년 2열 배치는 시작일/종료일 줄과 시각 리듬 맞추기.

### 경험·자격증 폼/목록 5종 폴리싱 (2026-05-11)

- **목표**: 사용자 요청 5건 — (1) 경험 폼 관련전공을 칩+직접입력 → 단일 Combobox(필수), (2) 경험 목록 검색을 제목만으로, (3) 자격증 목록 검색 필터 제거, (4) 경험·자격증 삭제 confirm을 2클릭 → 모달 팝업으로, (5) 자격증 폼의 "증빙·메모 준비 중" placeholder를 PDF 업로드 UI로 활성화.
- **변경**:
  - [`src/components/experience/ExperienceForm.jsx`](../frontend/src/components/experience/ExperienceForm.jsx) — `useMe` 의존 + 본인 전공/부전공 칩 + 직접 입력 input + `Chip` 헬퍼 통째로 제거. 단일 `<Combobox>` 로 `KOOKMIN_DEPT_OPTIONS` (54개) 노출. value 비어있으면 검증 실패 ("관련 전공을 선택해주세요"). `toBody` 에서 `relatedMajor` 의 `.trim()` 제거 (enum 값은 정확 매칭이라 trim 불필요).
  - [`src/pages/MyExperience.jsx`](../frontend/src/pages/MyExperience.jsx) — `filtered` 의 검색 대상이 제목/관련전공/STAR 4항목/카테고리 라벨 → **`experienceTitle` 만**. placeholder "제목 검색" 으로 단순화.
  - [`src/pages/MyCertificates.jsx`](../frontend/src/pages/MyCertificates.jsx) — 검색창·`query` state·`filtered` useMemo·`NoResult` 상태·검색용 import (`Search` lucide) 모두 제거. `Modal` 기반 삭제 확인 도입, `confirmDelId` state + 2클릭/5초 타이머 제거. 행의 "정말 삭제?" 인라인 텍스트도 사라짐.
  - [`src/pages/ExperienceDetail.jsx`](../frontend/src/pages/ExperienceDetail.jsx) — `confirmDel` 인라인 토글 → `confirmDelOpen` Modal state. 삭제 버튼 클릭 시 모달 노출, 모달 안의 [취소 / 삭제] 로 확정. `setTimeout` 자동 리셋 로직 제거.
  - [`src/components/certificate/CertificateForm.jsx`](../frontend/src/components/certificate/CertificateForm.jsx) — "증빙·메모 준비 중" 회색 박스 → 실제 PDF 파일 업로드 UI. hidden `<input type="file" accept="application/pdf,.pdf">` + 클릭 트리거. 빈 상태는 점선 dropzone, 선택 시 파일 아이콘 + 이름/크기 + [교체 / X 제거]. 클라이언트 검증: `.pdf` 확장자/MIME + 10MB 제한. **백엔드 multipart 업로드 엔드포인트 미연동이라 form state 에만 보관 — 저장 시 미전송, 새로고침 시 휘발**. 사용자에게 "백엔드 업로드 엔드포인트 준비 후 자동 첨부됩니다 — 현재는 미리보기 전용" 캡션 노출.
- **건드리지 않은 항목**: 경험·자격증 CRUD API 호출, ExperienceForm 의 카테고리 칩·STAR·날짜 필드, CertificateForm 의 자격증명/발급기관/취득일/만료일/번호 필드, 두 목록의 row 디자인.
- **검증**: `npx eslint src/` ✅ EXIT 0 / `npx prettier --check src/` ✅ / `npm run build` ✅ 663ms.

### My\* 목록 페이지 — 번호 매긴 콤팩트 리스트 row 로 재디자인 (2026-05-10)

- **목표**: 사용자 후속 보고 — 통합 카드 패턴 적용 후에도 row 가 두꺼워 "카드 안에 또 카드가 쌓인 것처럼" 보임. (a) row 앞에 `1.`, `2.` 번호를 붙여 명확히 list 임을 드러내고, (b) row 가 단일 정보 라인처럼 보이게 콤팩트화.
- **변경 파일** (모두 동일 row 골격):
  - [`src/pages/MyCertificates.jsx`](../frontend/src/pages/MyCertificates.jsx) — `<ul>` → `<ol>`, `CertRow` 두 줄 콤팩트(번호 + 자격증명 / 발급기관·취득·유효·발급번호 dot-separated). 우측 수정·삭제 버튼은 `btn-default btn-sm` → `btn-ghost btn-sm` 아이콘 only (삭제 confirm 시에만 "정말 삭제?" 텍스트 노출). 옛 `dl` grid 레이아웃 / `Item` 헬퍼 제거.
  - [`src/pages/MyExperience.jsx`](../frontend/src/pages/MyExperience.jsx) — `<ul>` → `<ol>`, `ExpRow` 두 줄 콤팩트(번호 + 카테고리 뱃지·제목 / 기간·관련전공). STAR 미리보기 / 토글 / `StarLine` 헬퍼 모두 제거 (상세 페이지에서 전체 보기). `ChevronDown/Up` import 정리.
  - [`src/pages/MyEssays.jsx`](../frontend/src/pages/MyEssays.jsx) — `<ul>` → `<ol>`, `EssayRow` 두 줄 콤팩트(번호 + 회사명·진행상태 뱃지 / 직무·최종수정일). 우측 상세 버튼 `btn-ghost`.
  - 세 파일 모두 row padding `py-4` → `py-2.5`, hover `bg-ink-50/60`, 번호는 `text-ink-400 tabular-nums w-6 text-right`. `Loading` 스켈레톤도 동일한 두 줄 콤팩트 형태로 갱신.
- **이유**: 번호 매김으로 "list" 시각 신호 강화. row 높이 절반으로 줄여 카드 안에 row 가 자연스럽게 흘러가게(stacked card 가 아닌 list). 정보 위계를 두 줄(타이틀 / 메타)로 단순화해 dot-separated 메타 한 줄로 압축.
- **건드리지 않은 항목**: 단일 카드 셸 (`card !p-0 overflow-hidden`) + `divide-y` 골격, 검색창 / 필터 칩 / 상태(`Empty` / `NoResult` / `ErrorState`), 데이터 훅 (`useCertificates` / `useExperiences` / `useEssays`), 삭제 confirm UX (2클릭 + 5초 만료), `essayId` opportunistic 분기 / `BackendBlockNotice`.
- **검증**: `npx eslint src/pages/MyCertificates.jsx src/pages/MyExperience.jsx src/pages/MyEssays.jsx` ✅. `npx prettier --check` ✅.

### MyEssays 통합 카드 패턴으로 통일 (2026-05-10)

- **목표**: 사용자 보고 — `/essays` 가 항목마다 별도 `.card` + `gap-3` 으로 떨어져 있어 "카드를 합쳐 둔 것처럼" 보임. `MyCertificates` / `MyExperience` 와 같은 단일 카드 + `divide-y` row 패턴으로 통일.
- **변경 파일**:
  - [`src/pages/MyEssays.jsx`](../frontend/src/pages/MyEssays.jsx) —
    - 상단 외부 검색 박스 + `grid gap-3` 카드 나열 → 단일 `<section className="card !p-0 overflow-hidden">` 안으로 검색창(`px-4 sm:px-5 pt-4 pb-3`) + divider + `<ul className="divide-y divide-ink-150">` 리스트 통합.
    - `EssayCard`(외곽 `card opacity-95`) → `EssayRow`(`<li className="px-4 sm:px-5 py-4">`). 내부 마크업(회사명·진행상태 뱃지 + 직무 + 최종 수정일 + 상세 버튼)은 그대로 보존.
    - `Loading` 도 `<ul.divide-y>` row 형태로, `Empty` / `NoResult` / `ErrorState` 의 `card` 클래스 제거 → `text-center py-* px-4`.
    - `BackendBlockNotice` 는 통합 카드 위(헤더 바로 아래)에 그대로 노출 — 안내 박스라 카드 내부에 두지 않음.
- **이유**: `/my-experience` · `/my-certificates` · `/stats` 와 시각적 단위 일치. 항목간 빈 갭 + 그림자 중복으로 페이지가 들썩여 보이던 문제 해소.
- **건드리지 않은 항목**: `useEssays` 훅, `essayId` opportunistic 분기, `BackendBlockNotice` 카피, `PROGRESS_LABEL/TONE` 매핑, `fmtDate`.
- **검증**: `npx eslint src/pages/MyEssays.jsx` 무에러.

### Stats / MyCertificates 통합 카드 + groupBy carousel + 도넛 hover (2026-05-10)

- **목표**: (a) `/stats`·`/my-certificates` 페이지를 `/my-experience`·`/info` 처럼 단일 카드로 통합. (b) `/stats` 상단 `STATE/SCHOOL_NUM/WORKER` 필터 버튼 제거 → 막대 그래프 헤더 좌우 chevron carousel 로 비교 그룹 토글. (c) 도넛 차트 키우고 슬라이스 hover 시 3D-pop + 툴팁. (d) groupBy 토글 시 데이터 깜빡임 제거.
- **변경 파일**:
  - [`src/pages/Stats.jsx`](../frontend/src/pages/Stats.jsx) —
    - 페이지 본문을 `<section className="card !p-0 overflow-hidden">` 단일 셸로 묶음. 막대 그래프 + 도넛은 카드 안에서 `lg:grid-cols-[1.4fr_1fr]` 로 좌우 2컬럼 (lg 미만은 stack), 컬럼 사이 `lg:border-l border-ink-150` divider. 그 아래 `border-t` divider 후 `Shortages`. 세 섹션 모두 카드 wrapper 제거 → `px-4 sm:px-5 py-5` 내부 패딩.
    - 상단 비교 대상 필터 버튼 / 비교 기준 메타 line 제거. `GROUP_KEYS`, `cycleGroup(current, dir)` 헬퍼 추가.
    - `FiveAxisCompare` 에 `groupBy/peerCount/onPrev/onNext` prop. chevron 은 헤더 row 의 양 끝 flex 컬럼으로 자리를 차지(absolute 아님, 배경 없음, `text-ink-400 hover:text-primary-700`) → 막대 그래프와 절대 겹치지 않음. dot indicator 3개 (활성 `w-4 bg-primary-600`).
    - `MyDistribution` — **2D 도넛 (260px)**. 슬라이스마다 `stroke="white"` + 비율에 따라 stroke 굵기 가변 (`strokeFor(pct)`: pct<3 → 0.3, pct<8 → 0.6, else 1) — 도넛 외곽선과 슬라이스 경계가 같이 그려지면서 작은 슬라이스가 stroke 에 잡아먹히지 않음. hover 시 좌우 이동이 아니라 `scale(1.05)` + `drop-shadow(0 8px 12px rgba(0,0,0,0.4))` + `brightness(1.06)` 로 z 축으로 솟듯이 강조 (`transformBox: fill-box, transformOrigin: center`). 툴팁은 컨테이너의 `onMouseMove` 로 `mouse.{x,y}` 추적해 마우스 커서 우측(`left: mouse.x + 14, top: mouse.y - 8`) 에 따라다님. 중앙 라벨이 hover 시 해당 카테고리 값으로 교체. 범례는 `self-end flex flex-wrap` + 10.5px 로 하단 우측에 작게. `buildPieSlices` 가 `midAngle` + `pct` 도 반환.
    - 파일 상단 디자인 주석 / `Loading` 상태도 단일 카드 형태로 갱신.
  - [`src/api/queries/useMe.js`](../frontend/src/api/queries/useMe.js) — `useMyStats` 에 `placeholderData: (prev) => prev` 추가 (TanStack v5 의 `keepPreviousData` 대체). groupBy 토글 시 새 queryKey 가 만들어져도 이전 데이터를 보여줘 Loading 스켈레톤이 깜빡이지 않음.
  - [`src/pages/MyCertificates.jsx`](../frontend/src/pages/MyCertificates.jsx) —
    - 페이지 본문을 단일 `<section className="card !p-0 overflow-hidden">` 안에 검색창(`px-4 sm:px-5 pt-4 pb-3`) + divider + `<ul className="divide-y divide-ink-150">` 리스트로 통합 (`MyExperience` 패턴 동일).
    - `CertCard` → `CertRow` 로 개명, 카드 셸 (`section className="card"`) 제거 → `<li className="px-4 sm:px-5 py-4">`.
    - `Loading` 도 `<ul.divide-y>` row 형태, `Empty` / `NoResult` / `ErrorState` 도 `card` 클래스 제거 → `text-center py-* px-4`.
- **이유**: 페이지마다 카드 나열이 분산돼 보였던 시각적 산만함을 통합 카드로 묶어 일관성 확보. `/stats` 의 비교 그룹 토글은 카드 안에 chevron + dot indicator 로 자연스러운 carousel 인터랙션. 도넛은 작아서 카테고리별 비율을 읽기 어려웠던 문제 해결, hover 인터랙션으로 정확한 수치 확인 가능.
- **건드리지 않은 항목**: `useMyStats` 훅, 데이터 매핑, `Bar` / `DonutRing` / `buildPieSlices` 의 path 수학, `Item` 라벨 컴포넌트, 삭제 confirm UX(2클릭+5초 만료).
- **검증**: `npx eslint src/pages/Stats.jsx src/pages/MyCertificates.jsx` 무에러, `npx prettier --check` 통과.

### PeersOrb 샌드위치 prism + mock 평균 보강 + 확대 모달 (2026-05-10)

- **목표**: (a) prism 이 +z 방향으로만 솟아 뒤에서 보면 평면이라, z=0 평면을 가운데 두고 ±양쪽으로 솟는 "샌드위치"(앞 폴리곤 / 그리드 / 뒷 폴리곤) 로 바꾸기. (b) 백엔드 동기/선배 평균이 비어 시연용 mock 보강. (c) 카드 우상단 확대 아이콘 → 모달로 PeersOrb 크게 보기 (Esc / X 닫기).
- **변경 파일**:
  - [`src/components/PeersOrb.jsx`](../frontend/src/components/PeersOrb.jsx) —
    - `buildDataMesh`: extrude 결과를 `mesh.position.z = -depth/2` 로 z=0 중심 정렬, `MeshPhongMaterial.side = DoubleSide` 추가, edge line 을 앞/뒤(`+depth/2 + 0.004`, `-depth/2 - 0.004`) 양쪽 cap 모두에 그림.
    - props 신설: `chartMaxWidth`(기본 360, 모달에서 키워 사용), `onExpand` 콜백.
    - 헤더 우측에 `Maximize2` 아이콘 버튼 추가 (`onExpand` 가 있을 때만 노출).
  - [`src/pages/Dashboard.jsx`](../frontend/src/pages/Dashboard.jsx) —
    - `PEER_MOCK` / `SENIOR_MOCK` 상수 (대내 3·5 / 대외 4·6 / 인턴 2·3 / 알바 5·7 / 자격증 4·6). axes 정규화에서 `peerAvgFor` = 백엔드 값 || mock, `seniorAvgFor` = 항상 mock.
    - `orbExpanded` state + `<Modal width=720>` 안에 `<PeersOrb embedded chartMaxWidth=620>`. PeersOrb 의 `onExpand` 가 setOrbExpanded(true).
- **이유**: 회전 시 어느 각도에서 봐도 prism 윤곽이 또렷. 백엔드 fix 까지 시연 안전망(mock). 작은 카드에서 답답한 정보 밀도를 모달에서 큰 화면으로 확인 가능.
- **건드리지 않은 항목**: 5축 정의, 회전/모멘텀 인터랙션, glass sphere / grid / 라벨, 색 커스텀 / 토글 / fallback 막대 차트.
- **검증**: `npx eslint src/components/PeersOrb.jsx src/pages/Dashboard.jsx` ✅. `npx prettier --check` ✅. `npm run build` ✅ (678ms).

### PeersOrb 본인 5축 — 백엔드 dashboard myCount 우회, 클라이언트 직접 카운트 (2026-05-10)

- **배경**: 백엔드 `GET /users/me/dashboard` 의 `statistics.myCount` 가 0 으로 비어 옴 (집계 미구현/버그). 동일 본인 데이터가 `GET /experiences` / `GET /certificates` 로는 멀쩡히 내려와서 `/my-experience` · `/my-certificates` 탭엔 정상 노출. 데이터는 살아있는데 dashboard 엔드포인트가 못 끌어옴 → PeersOrb "나" 5각형 안 보임.
- **변경**: [`src/pages/Dashboard.jsx`](../frontend/src/pages/Dashboard.jsx) — `useExperiences()` + `useCertificates()` 추가. axes useMemo 에서 myCount 를 백엔드 stats 가 아니라 클라가 카테고리(`experienceCategory` → `EXPERIENCE_CATEGORY_TO_FRONT`) 별 카운트, cert 는 certificates 길이. peerAvg 는 dashboard 응답 그대로 (백엔드 fix 시 자동 반영). seniorAvg mock(× 1.2) 유지.
- **이유**: 본인 데이터는 클라가 가진 진실(=경험/자격증 페이지에서 보이는 그대로) 이라 백엔드 dashboard 집계 주기/캐시/버그와 무관하게 즉시 PeersOrb 에 반영돼야 함. 백엔드 dashboard myCount 가 나중에 정상화돼도 코드 변경 없이 무해(둘 다 같은 값으로 수렴).
- **건드리지 않은 항목**: PeersOrb 컴포넌트, 5축 정의, 정규화 로직, 동기/선배 표현, ErrorBoundary 분리.
- **검증**: `npx eslint src/pages/Dashboard.jsx` ✅. `npx prettier --check` ✅. `npm run build` ✅ (652ms, 1889 modules).

### PeersOrb 선배 평균 추가 + 색 커스텀 + nested prism 중첩 (2026-05-10)

- **목표**: 사용자 요청 — (a) 범례 swatch 클릭으로 색 커스터마이즈 (b) "동기 평균" 옆에 "선배 평균" 5각형 추가 (c) 기존엔 my(짙은 prism)가 avg(얕은 prism) 위에 "쌓이는" 모양이라 avg 가 가려졌는데, 같은 baseZ 에서 depth 만 단계화해 "블록 안에 블록이 끼워진" 단계형 중첩(stepped pyramid)으로.
- **변경 파일**:
  - [`src/components/PeersOrb.jsx`](../frontend/src/components/PeersOrb.jsx) —
    - 색 state 3 종 (`me`/`peers`/`seniors`) + `localStorage` (`peersOrb.colors.v1`) 영속화. 기본값 `#1e40af` / `#94a3b8` / `#c2410c`.
    - axes contract 확장: `[{ label, me, peers, seniors? }]`. `seniors` 누락 시 0 처리.
    - `buildDataMesh` 호출 3 회 — 모두 `baseZ=0`, depth 만 0.07(선배) / 0.10(동기) / 0.13(나) 단계화. 면적이 큰 폴리곤이 더 낮게 깔리고 작은 폴리곤이 위로 빼꼼히 솟는 stepped pyramid 효과.
    - mesh 색/가시성은 ref 기반으로 별도 effect 가 직접 갱신 — scene 재구축 회피.
    - `ToggleChip` 리팩터: 단일 `<button>` → 컨테이너 `<div>` 안에 `<label><input type="color"></label>` (swatch, 클릭 시 native color picker) + `<button>` (라벨, 클릭 시 가시성 토글) 분리. 의도가 섞이지 않게.
    - `PeersFallbackChart` / `FallbackBar` 도 3 막대 + dynamic color 로 동기화.
    - 가이드 카피 변경: "↻ 드래그해서 돌려보세요 · 색칸을 누르면 색을 바꿀 수 있어요".
  - [`src/pages/Dashboard.jsx`](../frontend/src/pages/Dashboard.jsx) — `axes` `useMemo` 에 `seniors` 필드 추가. **백엔드가 senior 평균 통계를 아직 안 줘서 동기 평균 × 1.2 mock**. 정규화 max 계산에도 senior 포함. 백엔드가 senior 통계 추가하면 `pickStat(stats, 'seniorAvg')` 같은 키로 한 줄 교체.
- **건드리지 않은 항목**: 5축 정의 (AXIS_DEFS), 회전 인터랙션, glass sphere / grid / 라벨 sprite, ErrorBoundary 분리, EssayListCard / MyRoadmap / SeniorRoadmap 카드.
- **검증**: `npx eslint src/components/PeersOrb.jsx src/pages/Dashboard.jsx` ✅. `npx prettier --check` ✅. `npm run build` ✅ (750ms, 1889 modules, dist/index.js 1073 kB — 기존과 동일).

### 백엔드 신규 엔드포인트 4종 흡수 — Dashboard/Stats 실 데이터 + /essays/:id 활성 (2026-05-10)

- **배경**: 백엔드 팀이 추가로 푼 4종 (`GET /users/me/dashboard`, `GET /users/me/stats?groupBy=`, `GET /essays/{essayId}`, `GET /experiences/{experienceId}`) 흡수. `/experiences/{id}` 는 이미 hook 사용 중이라 그대로. 나머지 3종 신규 연결.
- **신규 hook**:
  - [`src/api/queries/useMe.js`](../frontend/src/api/queries/useMe.js) — `useDashboard()` / `useMyStats(groupBy)` 추가.
  - [`src/api/queries/keys.js`](../frontend/src/api/queries/keys.js) — `qk.dashboard()`, `qk.stats(groupBy)` 키 추가.
  - [`src/api/queries/useEssays.js`](../frontend/src/api/queries/useEssays.js) — `useEssay(id)` 안에 `normalizeEssayDetail()` 어댑터 추가 (백엔드 `requirement`→`globalReq`, `modifiedDate`→`updatedAt`). 호출부는 통일 키로만 보면 됨.
- **신규 매핑 헬퍼** ([`src/lib/enums.js`](../frontend/src/lib/enums.js)):
  - `STATS_BACK_TO_FRONT` — 백엔드 Statistics 키 (`partTime/external/internal/license/intern`) ↔ 프론트 5축 키 (`parttime/activity/internal/cert/intern`).
  - `pickStat(statistics, 'avg'|'userCount'|'myCount')` — 백엔드 5축 객체 → 프론트 키 record.
  - `weakPointLabel(type)` — 백엔드 `WeakPoint.type` 을 프론트 한글 라벨로 정규화 (enum 키/한글/stats 키 모두 수용).
- **페이지 변경**:
  - [`src/pages/Dashboard.jsx`](../frontend/src/pages/Dashboard.jsx) — `useExperiences`/`useCertificates` 카운트 + `PEERS_MOCK_AVG` 사용을 모두 제거. `useDashboard()` 의 `statistics` 로 본인 5축(`myCount`) + 동기 평균(`avg`) + 비교 인원수(`userCount`) 산출. `peersSub` 의 "214명 기준" 하드코딩 → 실제 `userCount` 노출 (없으면 "집계 대기"). `graduateUserExperiences` 를 `SeniorRoadmapCard` 에 props 전달.
  - [`src/components/dashboard/SeniorRoadmapCard.jsx`](../frontend/src/components/dashboard/SeniorRoadmapCard.jsx) — `SENIOR_ROADMAPS` mock 의존 제거. `graduates`, `isLoading`, `isError`, `onRetry` props 기반으로 재작성. 졸업생 N명 → 탭("선배 1·2·3") + 학기 축 자동 계산(min/max startDate). 백엔드 응답에 졸업생 표시명/합격 회사/시즌이 없어 index 라벨로만 표시 (필드 추가되면 같은 자리에 끼우면 됨).
  - [`src/pages/Stats.jsx`](../frontend/src/pages/Stats.jsx) — 200줄 mock 데이터 (`MOCK = { STATE/SCHOOL_NUM/WORKER }`, `buildBy`) 통째로 제거. `useMyStats(groupBy)` 사용. `pickStat` 으로 5축 매핑, `weakPointLabel` 로 부족한 카테고리 라벨링, `recommendedItems` 그대로 표시. 백엔드 미구현 안내 박스 제거.
  - [`src/pages/EssayDetail.jsx`](../frontend/src/pages/EssayDetail.jsx) — **신규 페이지**. 메타 view ↔ edit 토글 (PATCH `/essays/:id`), 결과 입력 (`PATCH /essays/:id/result` — IN_PROGRESS/PASS/FAIL 3개 버튼), 문항 목록(읽기 전용, 문항 번호+질문+답변+maxLength), 위험 영역 자소서 삭제(2클릭 confirm + 5초 자동 취소).
  - [`src/pages/MyEssays.jsx`](../frontend/src/pages/MyEssays.jsx) — `essayId` opportunistic. 응답에 `essayId` 가 들어오면 카드의 "상세" 버튼이 `Link to /essays/:essayId` 로 활성, 누락이면 disabled + 안내 박스. 안내 박스 노출 조건도 "essayId 있는 항목 0건일 때만" 으로 좁힘.
  - [`src/components/dashboard/EssayListCard.jsx`](../frontend/src/components/dashboard/EssayListCard.jsx) — 같은 패턴. `essayId` 있으면 행이 `Link` 로 감싸지고 hover border 강조, 없으면 일반 li.
  - [`src/App.jsx`](../frontend/src/App.jsx) — `/essays/:id` 라우트의 `Placeholder` → `EssayDetail`. `Placeholder` import 제거.
- **삭제**:
  - `frontend/src/pages/Placeholder.jsx` — `/essays/:id` 가 실 컴포넌트로 교체되어 모든 라우트가 실 페이지를 가짐. 외부 import 0건.
  - [`src/data/dashboard.js`](../frontend/src/data/dashboard.js) 의 `PEERS_MOCK_AVG`, `SEMESTERS`, `ymToSemIndex`, `SENIOR_ROADMAPS` — 백엔드 실 데이터 흡수로 사용처 0건. 파일 자체는 `CAT_LABELS` / `CAT_COLORS` 만 보유한 채 유지 (MyRoadmap/SeniorRoadmap/Stats 도넛 공유 토큰).
- **건드리지 않은 항목**:
  - `MyRoadmapCard.jsx` — 본인 마일스톤은 STAR 한 줄 요약 / 자격증 `getDate` 디테일을 그대로 노출하기 위해 `useExperiences` / `useCertificates` 직접 호출 유지. `useDashboard.userExperiences` 는 `ExperienceItem` shape 만 줘서 정보가 빈약함.
  - `EssayResponse.essayId` 누락 — 여전히 백엔드 차단(스웨거 기준). 코드는 opportunistic 이라 백엔드가 풀어주면 즉시 활성.
  - `EssayQuestionCreateRequest.response` minLen:1 — `/write` 의 placeholder 우회 그대로.
  - 신규 필드 (경험 희망직무, 자격증 메모/증빙, /info 포트폴리오) — 백엔드 미반영, 그대로.
- **검증**: `npx eslint src/` ✅ EXIT 0 / `npx prettier --check src/` ✅ "All matched files use Prettier code style!" / `npm run build` ✅ 730ms, 1889 modules. 기존 chunk 사이즈 / dynamic import 경고는 알려진 항목.

### Stats `/stats` 내 경험 분포 카드 — 가로 막대 → SVG 도넛 차트 (2026-05-10)

- **목표**: 사용자 요청 — `MyDistribution` 카드의 카테고리별 진행 막대를 원형 그래프로 교체. 이후 슬라이스 경계가 잔금/겹침으로 찌그러져 보인다는 후속 보고로 구현 방식 변경.
- **변경**:
  - [`src/pages/Stats.jsx`](../frontend/src/pages/Stats.jsx) — `MyDistribution` 본문을 [도넛 SVG + 우측 범례] 2-컬럼 레이아웃으로 교체. 모바일은 stack(`flex-col`), `sm` 이상에서 좌우 배치. 도넛 가운데에 총 경험 건수 + "총 경험" 라벨 노출. `CAT_COLORS` 를 `data/dashboard.js` 에서 import 해 대시보드와 색상 일관성 유지.
  - **렌더 방식**: 1차 stroke-dasharray `<circle>` 누적 → anti-aliasing 으로 슬라이스 경계에 잔금이 보임 → 채워진 SVG `<path>` 호(annulus segment)로 재구현. `buildPieSlices(data, total)` 가 외/내 반지름(rO=57, rI=39) 두 호 + 두 직선의 path d 문자열을 생성, `shapeRendering="geometricPrecision"`. 12시 시작·시계방향 누적이라 추가 CSS 회전 없음. `total === 0` 빈 상태 / 단일 100% 슬라이스는 `<DonutRing>` 헬퍼(외/내 두 원 evenodd) 로 끊김 없는 링.
- **건드리지 않은 항목**: `FiveAxisCompare` 비교 막대그래프, `Shortages`, 데이터 매핑(`view.distribution`), `useMyStats` 훅, 페이지 헤더/필터, 범례 마크업.
- **검증**: `npx eslint src/pages/Stats.jsx` ✅.

### Dashboard 상단 카드 3개 → 1개 통합 (2026-05-10)

- **목표**: 사용자 요청 — 상단 HeroBanner / PeersOrb / EssayListCard 3개 카드를 한 통합 카드로 묶어 hero 영역의 시각적 단위를 하나로.
- **변경**:
  - [`src/components/dashboard/HeroBanner.jsx`](../frontend/src/components/dashboard/HeroBanner.jsx) — `embedded` prop 추가. `embedded=true` 면 외곽 `rounded-2xl border shadow-lg mb-3` 제거하고 그라데이션 배경만 유지. 통합 카드 안의 상단 띠로 들어감.
  - [`src/components/PeersOrb.jsx`](../frontend/src/components/PeersOrb.jsx) — `embedded` prop 추가. `embedded=true` 면 외곽 `<section className="card !p-4">` 의 `card !p-4` 클래스 제거. 헤더/차트/토글 내부 구조는 동일.
  - [`src/components/dashboard/EssayListCard.jsx`](../frontend/src/components/dashboard/EssayListCard.jsx) — `embedded` prop 추가. `embedded=true` 면 `card !p-4 flex flex-col` → `flex flex-col h-full`. 그리드 셀 높이로 stretch.
  - [`src/pages/Dashboard.jsx`](../frontend/src/pages/Dashboard.jsx) — `hasProfile=true` 분기를 단일 `<section className="card !p-0 overflow-hidden">` 으로 감쌈. 그 안에 `<HeroBanner embedded>` (그라데이션 띠) → `<div grid lg:grid-cols-2 lg:divide-x>` 좌(PeersOrb embedded) / 우(EssayListCard embedded). 영역별 `ErrorBoundary` 는 유지하되 fallback 으로 카드 스타일 없는 `<InnerError>` 로컬 컴포넌트 사용해 카드-in-카드 중첩 회피. `!hasProfile` 분기는 기존 HeroBanner 단독(온보딩 CTA) + placeholder 안내 그대로.
- **레이아웃 디테일**: 모바일은 `gap-4 p-4` 단일 컬럼 스택, `lg` 이상은 `gap-0 p-0 grid-cols-2 divide-x divide-ink-150` + 각 컬럼 `lg:p-4` 로 가운데 디바이더 + 양쪽 16px 패딩. PeersOrb 의 자연 높이를 EssayListCard 의 `h-full + flex-col + flex-1` 이 흡수해 CTA bar 우하단 고정.
- **건드리지 않은 항목**: PeersOrb 데이터 contract, 5축 정의, 차트/토글 내부 마크업, EssayListCard 의 행/로딩/에러/빈 상태 처리, MyRoadmap/SeniorRoadmap 카드, `!hasProfile` 분기 UX.
- **검증**: `npx eslint` ✅. `npx prettier --check` ✅ (포맷 자동 정리 후).

### Dashboard PeersOrb 카드 2-column 확장 + EssayListCard 신설 (2026-05-10)

- **목표**: 사용자 요청 — HeroBanner 의 "자소서 작성" CTA 를 제거하고, 그 자리에 PeersOrb 카드를 2-column 으로 확장. 좌측은 PeersOrb, 우측은 내 자소서 목록, 우하단은 "자소서 작성하기" CTA.
- **변경**:
  - [`src/components/dashboard/HeroBanner.jsx`](../frontend/src/components/dashboard/HeroBanner.jsx) — `hasProfile=true` 분기에서 자소서 작성 CTA 버튼 제거. `PencilLine` import 도 제거. 하단 CTA wrapper 는 `!hasProfile` 일 때만 렌더(온보딩 시작하기 유지). 인사 카피만 남김.
  - [`src/components/dashboard/EssayListCard.jsx`](../frontend/src/components/dashboard/EssayListCard.jsx) — **신규**. `useEssays` 로 자소서 목록을 받아 최대 5개 행 렌더(회사명·진행상태 뱃지·직무·최종수정일). 로딩/에러/빈 상태 처리. 우하단에 `자소서 작성하기` btn-primary CTA → `/write`. 6개 이상이면 좌하단 `전체 보기 (N)` → `/essays` 링크. 백엔드 `EssayResponse.essayId` 누락 이슈로 행 클릭 → 상세 진입은 비활성, 카드 자체는 비링크.
  - [`src/pages/Dashboard.jsx`](../frontend/src/pages/Dashboard.jsx) — `EssayListCard` import 추가. `hasProfile=true` 본문에서 PeersOrb 만 들어있던 `<ErrorBoundary>` 를 `<div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">` 로 감싸 좌(PeersOrb)·우(EssayListCard) 2-column. 모바일은 단일 컬럼으로 자연 스택. MyRoadmap / SeniorRoadmap 은 그대로 아래에 stack.
- **건드리지 않은 항목**: PeersOrb 데이터 contract, 5축 정의, 카드 셸 자체, MyRoadmap/SeniorRoadmap, ErrorBoundary 분리, Hero 의 `!hasProfile` 온보딩 CTA — 모두 그대로.
- **검증**: `npx eslint` ✅. `npx prettier --write` 후 `--check` ✅. `lg` 이상에서 좌우 동일 높이(`items-stretch`) — PeersOrb 가 더 높으면 EssayListCard 의 `flex-col` + 본문 `flex-1` 이 아래 빈공간 흡수, CTA bar 는 항상 우하단 고정.
- **알려진 한계**: 백엔드 `GET /essays` 응답이 `essayId` 누락이라 자소서 행 → 상세 라우팅 비활성. 이 카드도 동일 한계 — 우측은 일람 + CTA 진입만 제공.

### Dashboard HeroBanner + PeersOrb 한 화면 fit + prism 두께 축소 (2026-05-10)

- **목표**: 사용자 요청 — 대시보드 진입 시 인사 카드(HeroBanner) + 동기 비교 카드(PeersOrb) 가 한 viewport 에 들어오도록 압축. PeersOrb prism 두께도 살짝 줄임.
- **변경**:
  - [`src/components/dashboard/HeroBanner.jsx`](../frontend/src/components/dashboard/HeroBanner.jsx) — 패딩/폰트/간격 압축.
    - `mb-4` → `mb-3`, `px-6 py-7` → `px-5 py-4`.
    - Sparkles 행: text-[12]/size-14/mb-2 → text-[11]/size-13/mb-1.
    - h1 text-[22] → text-[18]. 본문 p mt-2 text-[13] → mt-1 text-[12]. CTA 행 mt-5 → mt-3.
  - [`src/components/PeersOrb.jsx`](../frontend/src/components/PeersOrb.jsx) — 카드 내부 여백·차트 크기·prism 두께 동시 축소.
    - 카드: `.card`(p-5) → `.card !p-4`. 헤더 mb-1 제거. h2 text-[16] → text-[15], sub text-[12] mt-1 → text-[11] mt-0.5.
    - 차트 wrap: maxWidth 560 → 360 (aspect-square 라 캔버스 ~360² 로 축소). mt-4 → mt-2.
    - 드래그 안내: mt-1.5 → mt-1.
    - 토글 행: mt-4 pt-4 → mt-2 pt-3.
    - 데이터 prism: avg depth 0.14 → 0.09, my depth 0.26 → 0.16. 전체 두께 ~38% 감소 — 입체감은 유지하되 차분해짐.
- **건드리지 않은 항목**: 데이터 contract, 5축 정의, 회전/드래그, fallback 차트, MyRoadmap/SeniorRoadmap 카드 — 모두 그대로.
- **추정 컨텐츠 높이** (lg viewport): 약 710px — 일반 노트북 viewport (720~820) 한 화면에 인사+동기비교 카드 모두 들어옴. 그 아래 카드(MyRoadmap/SeniorRoadmap) 는 스크롤로 노출.
- **검증**: `npx eslint src/components/PeersOrb.jsx src/components/dashboard/HeroBanner.jsx` ✅. `npx prettier --check` ✅. dev HMR 자동 반영.

### Info 페이지 카드 통합 (2026-05-10)

- **목표**: 사용자 요청 — `/info` 페이지의 기본 정보 / 학적 정보 / 진로 관심사 세 카드가 시각적으로 분리돼 페이지가 길어 보임. 하나의 카드로 합쳐 정보 밀도를 높이되, 의미 단위는 시각적으로 유지.
- **변경**:
  - [`src/pages/Info.jsx`](../frontend/src/pages/Info.jsx) — 세 개의 `<Card>` 를 단일 `<section className="card">` 로 감싸고, 각 영역은 새 `Section` 컴포넌트(헤딩 + sub + divider) 로 분리. 두번째·세번째 섹션에 `divider` prop 으로 상단 가는 구분선(`pt-6 border-t border-border`) 노출. 섹션 제목 폰트 크기는 카드 타이틀(15px) → 섹션 헤딩(14px) 으로 한 단계 낮춤 — 카드 자체에 외곽 타이틀이 없으니 내부 위계 일관.
  - 옛 `Card({title, sub, children})` 인라인 함수는 더 이상 사용처 없어 새 `Section` 으로 대체 (외부 import 0 건이라 단순 교체).
- **건드리지 않은 항목**: 헤더(아바타·이름·수정/저장 버튼), `DangerZone` 카드, validate / toDraft / toRequest, JobTreeSelect / DeptCascadeSelect — 모두 그대로.
- **검증**: `npx eslint src/pages/Info.jsx` ✅ EXIT 0. dev HMR 자동 반영.

### PeersOrb 데이터 5각형 입체화 (2026-05-10)

- **목표**: 사용자 요청 — 대시보드 PeersOrb 의 "나" / "동기 평균" 5각형이 평면이라 회전 시 두께가 안 보임. 두 폴리곤을 입체(prism) 로 만들어 입체감 강화.
- **변경**:
  - [`src/components/PeersOrb.jsx`](../frontend/src/components/PeersOrb.jsx) — `buildDataMesh` 가 `THREE.ShapeGeometry` + `MeshBasicMaterial` 평면 폴리곤을 만들던 걸, `THREE.ExtrudeGeometry` (베벨 enabled) + `MeshPhongMaterial` (shininess 80, specular #fff) 5각 기둥으로 교체.
    - 동기 평균: depth 0.14, base z=0, 회색 (Slate-400, opacity 0.55) — 얕은 prism.
    - 나: depth 0.26, base z=0.002, 짙은 블루 (Blue-800, opacity 0.7) — 더 두껍고 살짝 앞 (z-fight 회피 + 시각적 우선).
    - 두 prism 모두 grid 평면(z=0) 을 base 로 카메라 방향(+z) 으로 솟아오름 — 회전 시 옆면 음영이 입체감을 만든다.
    - 윗면(앞쪽 cap) 외곽선은 `baseZ + depth + 0.004` 에 두어 베벨 위에 살짝 띄움.
  - 파일 헤더 주석에 입체화 메모 한 줄 추가.
- **건드리지 않은 항목**: 데이터 contract (`{label, me, peers}` 0~100), 5축 파라미터, 회전/드래그 인터랙션, fallback 차트, ToggleChip — 모두 그대로.
- **검증**: `npx eslint src/components/PeersOrb.jsx` ✅ EXIT 0. `npx prettier --check` ✅. dev HMR 자동 반영.

### 죽은 파일 정리 + 전체 페이지 정합 검증 (2026-05-10)

- **목표**: 라우터 등록된 페이지 16개 + 모든 컴포넌트/훅/lib 모듈을 import 그래프로 훑어 사용처 0건인 파일 식별 → 영향 분석 후 삭제, 그 외 정합성·정적 동작 점검.
- **방법**:
  - `grep -rln "from.*${name}\b"` 로 src 전체에서 모든 컴포넌트/hook/lib export 의 외부 참조 카운트.
  - public 정적 파일 / 설정 파일 / 동적 import 대상 / 백엔드 차단으로 의도적 보존된 hook 은 제외.
  - lint/prettier/build 로 회귀 검증.
- **삭제** (모두 외부 import 0건 확인):
  - `frontend/src/components/Card.jsx` — `Card` / `CardHeader` 두 export 모두 어디에서도 import 안 됨. `Info.jsx` 가 동명의 인라인 함수(`function Card({title, sub, children})`) 를 자체 정의해 사용 중이라 외부 컴포넌트와 무관. 삭제 후 깨짐 0.
  - `frontend/src/assets/react.svg` — Vite 템플릿 잔재. 어디에서도 참조 0.
  - `frontend/src/assets/vite.svg` — 동일.
  - `frontend/src/assets/hero.png` — 어디에서도 참조 0. PROJECT_STATUS / CLAUDE.md 의 "디렉토리 맵" 외 사용 없음.
  - 위 3 자산 삭제로 `frontend/src/assets/` 디렉토리가 비어 폴더 자체도 제거.
- **수정**:
  - [`frontend/CLAUDE.md`](../frontend/CLAUDE.md) — 디렉토리 맵에서 `Card.jsx` 라인 + `assets/` 디렉토리 항목 제거.
  - 본 PROJECT_STATUS — "보존 — 의도적 미사용" 섹션에서 `Modal.jsx` 라인 제거 (현재 `Info.jsx` 회원 탈퇴 모달에서 실제 사용 중이라 stale 이었음). "삭제한 파일 목록" 표에 4 건 추가.
- **보존 (사용처 0건이지만 의도적/리스크 회피)**:
  - `components/Badge.jsx`, `components/Button.jsx` — 디자인 시스템 컴포넌트. PROJECT_STATUS 명시.
  - `useEssay`, `useDeleteEssay`, `useUpdateEssayResult` — 백엔드 `EssayResponse.essayId` 누락 차단으로 임시 미사용.
  - `useAuth.setUser` action — store API 표면. 미사용이지만 향후 확장.
  - `lib/enums.js` 의 `KOOKMIN_DEPARTMENTS` / `JOB_TREE_BACKEND` re-export 라인 + `labelize` — lib 헬퍼 표면. raw enum-data 직접 import 가 안 일어나는 게 정상이라 라이브러리 표면 보존이 안전.
- **페이지 정합 검증** (정적, 16 라우트):
  - `/landing`, `/auth/callback` (chromeless 공개) → Landing.jsx, AuthCallback.jsx — Google OAuth 시작 + grant code 교환 + StrictMode 가드 OK.
  - `/onboarding` (chromeless 보호) → Onboarding.jsx — `useUpdateMe` PUT, 인라인 검증, 부전공 ≠ 전공 가드 OK.
  - `/dashboard` (보호+Layout) → Dashboard.jsx — `useMe`/`useExperiences`/`useCertificates` 카운트 → 5 축 정규화 → PeersOrb. ErrorBoundary 카드별 분리 OK.
  - `/write` → Write.jsx — meta → questions 2-stage. `useCreateEssay` / `useUpdateEssayMeta`. `QuestionEditor` 내부에서 추천/생성/재생성/저장 5 hook OK.
  - `/essays` → MyEssays.jsx — `useEssays` + 클라 검색. essayId 차단 안내 인라인 노출 OK.
  - `/essays/:id` → Placeholder. 의도된 보류 (essayId 차단).
  - `/stats` → Stats.jsx — mock UI. 비교 대상 필터 OK.
  - `/info` → Info.jsx — `useMe` / `useUpdateMe` / `useWithdraw` + `Modal` 회원 탈퇴 확인 OK.
  - `/my-experience`, `/new`, `/:id` → MyExperience/NewExperience/ExperienceDetail.jsx — Experience CRUD 5 hook OK.
  - `/my-certificates`, `/new`, `/:id/edit` → MyCertificates/NewCertificate/EditCertificate.jsx — Certificate CRUD 4 hook OK. EditCertificate 는 단건 GET 부재로 목록 캐시 매칭.
  - `/`, `*` → `/dashboard` redirect.
- **검증 명령어**:
  - `npx eslint src/` ✅ EXIT 0.
  - `npx prettier --check src/` ✅ "All matched files use Prettier code style!".
  - `npm run build` ✅ 710ms, dist 정상 생성. 기존 chunk 사이즈 경고 + dynamic import 경고는 PROJECT_STATUS "남은 이슈" 에 이미 명시된 알려진 항목.
- **남은 동적 검증** (코드 정적 분석으로는 판단 불가 — 라이브 dev 서버 + 실 계정 필요):
  - 각 페이지 진입 + 새로고침 (HashRouter 정상 유지) 동작.
  - API 호출 성공/실패 + 4xx/5xx 토스트 + 401/403 reissue 큐.
  - 폼 submit + 인증 가드 redirect (`/landing`).
  - 반응형 레이아웃 (320 / 768 / 1024 / 1440 viewport).
  - PeersOrb WebGL 렌더 + ErrorBoundary fallback.

### 백엔드 IP 갱신: 3.238.245.5 (2026-05-13, EC2 재재시작)

- **사유**: EC2 또 재시작. `3.238.28.206` → `3.238.245.5`.
- **변경**: `vite.config.js` 의 `API_TARGET` 갱신, `frontend/CLAUDE.md` 의 IP 안내 갱신, dev 서버 재시작.
- **항목 6번 (Elastic IP 할당) 재강조 필요** — 같은 작업 반복 (이번이 3회째 관찰).

### 백엔드 IP 갱신: 3.238.28.206 (2026-05-10, EC2 재재시작)

- **사유**: EC2 또 재시작. `98.92.68.10` → `3.238.28.206`.
- **변경**: `vite.config.js` 의 `API_TARGET` 갱신, `.env.local.example` / `frontend/CLAUDE.md` 의 IP 안내 갱신, dev 서버 재시작.
- **항목 6번 (Elastic IP 할당) 재강조 필요** — 같은 작업 반복.

### 대시보드·자소서 강조색 사이드바 톤 통일 + 대시보드 디자인 폴리싱 (2026-05-10)

- **목표**: 사용자 피드백 — 대시보드 곳곳의 강조색이 제각각이고 PeersOrb 가 "2010년대 색감"·"AI 생성 티". 사이드바(#1B306F) 기준으로 통일하고 절제된 톤으로 정리.
- **변경**:
  - [`src/components/PeersOrb.jsx`](../frontend/src/components/PeersOrb.jsx) — 보라/Indigo 톤 전부 제거하고 단일 블루 hue 로 통일.
    - 동기 평균 메쉬 `0x8b5cf6` (Violet-500) → `0x93c5fd` (Blue-300). 내(나) 메쉬(`#2563eb`)와 hue 일치, 채도/명도로만 구분.
    - 그리드 라인 `0xc7d2fe` (Indigo-200) → `0xbfdbfe` (Blue-200).
    - rim light `0xc7d2fe` → `0xbfdbfe`.
    - 배경 그라데이션 회색 → 옅은 블루 틴트 (`#f5f8ff → #eaf0fb`).
    - Legend / Fallback chart "동기 평균" 그라데이션 보라 → 블루 (`#bfdbfe → #3b82f6`).
  - [`src/components/dashboard/SeniorRoadmapCard.jsx`](../frontend/src/components/dashboard/SeniorRoadmapCard.jsx) — UI 재구성, "AI 대시보드 템플릿" 흔적 제거.
    - 헤더: 아바타 원 + 좌우 화살표 carousel (1/3 인디케이터) → 텍스트 탭 스타일. 활성 선배 `font-semibold + 2px 언더라인 (decoration-sidebar-bg)`.
    - 마일스톤 카드: 좌측 3px 컬러 보더 → 제목 앞 6px 인라인 dot (에디토리얼 톤).
    - 학기 dot 정렬 보정 (`items-center` 추가).
    - `ChevronLeft/Right` import 제거.
  - [`src/components/dashboard/HeroBanner.jsx`](../frontend/src/components/dashboard/HeroBanner.jsx) — 흰 CTA 버튼 텍스트 `text-primary-900` → `text-sidebar-bg`.
  - [`src/components/dashboard/MyRoadmapCard.jsx`](../frontend/src/components/dashboard/MyRoadmapCard.jsx) — 강조색만 변경, 구조는 보존 (사용자 요청으로 dot/카드 스타일 변경 시도는 되돌림).
    - 현재 학기 라벨 `text-primary-800` → `text-sidebar-bg`.
    - "내 경험 전체 보기" 링크 `text-primary-700 hover:text-primary-900` → `text-sidebar-bg hover:text-primary-800`.
- **연결한 API**: 없음 (순수 UI).
- **건드리지 않은 항목**: 데이터 contract (`PeersOrb` 5축 `{label, me, peers}`, 마일스톤 shape) — 시각화만 변경.
- **삭제**: 없음.
- **검증**: `npx eslint src/components/PeersOrb.jsx src/components/dashboard/` ✅. dev HMR 자동 반영.

### 회원 탈퇴 (POST /auth/withdraw) 연결 (2026-05-10)

- **목표**: Swagger 재검증 결과 백엔드 완성됐지만 프론트 미연결인 유일한 엔드포인트 — `POST /auth/withdraw` — 를 사용자 페이지에 연결.
- **신규 hook**:
  - [`src/api/queries/useMe.js`](../frontend/src/api/queries/useMe.js) — `useWithdraw()` mutation. body 없음, 200 OK 응답. 후처리(토큰/캐시/라우팅)는 호출부 책임.
- **변경**:
  - [`src/store/useAuth.js`](../frontend/src/store/useAuth.js) — `clearSession()` action 추가. `logout()` 과 달리 `/auth/logout` 백엔드 호출을 하지 않고 로컬 토큰/유저만 비움. 회원 탈퇴 직후 서버 세션이 이미 사라진 경우용.
  - [`src/pages/Info.jsx`](../frontend/src/pages/Info.jsx) — 페이지 하단(view 모드 전용)에 `DangerZone` 카드 + 확인 모달. 모달은 `"탈퇴"` 두 글자 정확 입력 시에만 버튼 활성. 성공 시 `qc.clear()` + `clearSession()` + `/landing` replace.
- **연결한 API**:
  - `POST /auth/withdraw` — 회원 탈퇴
- **건드리지 않은 항목** (백엔드 의존 — 변경 없음):
  - `EssayResponse.essayId` 누락 → `useEssay` / `useDeleteEssay` / `useUpdateEssayResult` hook 은 존재하지만 페이지에서 호출 못함. 그대로.
  - `EssayDetailResponse` 의 `requirement` / `modifiedDate` 필드명 mismatch — normalize 어댑터 미작성.
- **삭제**: 없음.
- **검증**: `npx eslint src/store/useAuth.js src/api/queries/useMe.js src/pages/Info.jsx` ✅. dev HMR 자동 반영.

### 통계 페이지 mock UI + 자소서 글자수 카운터 (2026-05-09)

- **목표**: 백엔드 통신 차단 항목 외 남은 미완성 페이지/UI 마무리.
- **신규**:
  - [`src/pages/Stats.jsx`](../frontend/src/pages/Stats.jsx) — `/stats` 통계 mock 페이지. 비교 대상 필터(STATE/SCHOOL_NUM/WORKER), 5축 막대그래프(대내/대외/인턴/알바/자격증, 본인 vs 평균), 본인 카테고리 분포, 부족한 경험 카드 + 추천. 백엔드 미반영 안내 인라인 노출. 백엔드 완성 시 `useMyStats(groupBy)` 훅으로 mock 변수 교체만 하면 됨.
- **변경**:
  - [`src/components/essay/QuestionEditor.jsx`](../frontend/src/components/essay/QuestionEditor.jsx) — 답변 textarea 위 우측에 글자수 카운터 추가 (`현재 / 최대` 자). 5/3 회의록 명시 TODO 항목. 초과 시 빨간 텍스트 + 초과 안내 라인 노출. **백엔드는 변경 없음** — `maxLength` 필드는 이미 `EssayQuestionCreateRequest` 에 존재, UI 노출만 추가.
  - [`src/App.jsx`](../frontend/src/App.jsx) — `/stats` 라우트를 Placeholder → 실 컴포넌트로 교체.
- **건드리지 않은 항목** (이번 세션 정책 — 백엔드 통신 필요한 것 제외):
  - `/essays/:id` 상세 페이지 — `EssayResponse.essayId` 누락 차단으로 그대로 Placeholder 유지.
  - 자격증 폼의 native date input → DatePicker 교체 — 사용자가 이전 "내 경험 한정"이라 명시.
  - 자소서 작성의 "내 이력에서 직접 찾기" 모달 — 핵심 외 기능, 별도 단위로.
- **삭제**: 없음.
- **검증**: `npx eslint src/` ✅ / `npx prettier --check src/` ✅ / `npm run build` 645ms ✅.

### P0 자소서 작성 + 목록 페이지 연결 (2026-05-09)

- **목표**: Swagger 에 이미 구현된 essay API 들을 `/write`, `/essays` 페이지에 연결. 백엔드가 응답 안 하는 부분(상세 라우팅용 `essayId`)은 추측 구현하지 말고 비활성 + 안내 노출.
- **신규 파일**:
  - [`src/components/essay/EssayMetaForm.jsx`](../frontend/src/components/essay/EssayMetaForm.jsx) — 회사명/희망직무/글로벌 요구사항 폼. swagger `EssayCreateRequest` / `EssayUpdateRequest` 동일 shape.
  - [`src/components/essay/QuestionEditor.jsx`](../frontend/src/components/essay/QuestionEditor.jsx) — 단일 문항 편집기. 추천(`/recommend`) → 초안 생성(`/generate`) → 재생성(`/regenerate`) → 저장(`POST /essays/:id/questions` 또는 `PATCH /essays/:id/questions/:qid`) 한 카드에 통합.
  - [`src/pages/Write.jsx`](../frontend/src/pages/Write.jsx) — `/write` 페이지. 2-stage machine (meta → questions). 메타 인라인 수정 (`PATCH /essays/:id`) 지원.
  - [`src/pages/MyEssays.jsx`](../frontend/src/pages/MyEssays.jsx) — `/essays` 목록. 클라이언트 검색. 카드 표시까지 정상이지만 **상세 진입 비활성** (백엔드 의존).
- **변경**: [`src/App.jsx`](../frontend/src/App.jsx) — `/write`, `/essays` 실 컴포넌트로 교체. `/essays/:id` 는 essayId 라우팅 차단으로 Placeholder 유지.
- **연결한 API** (모두 swagger 검증):
  - `POST /essays/create` — 자소서 메타 생성 → essayId 반환
  - `PATCH /essays/{essayId}` — 메타 수정
  - `GET /essays` — 목록
  - `POST /essays/recommend` — 관련 경험 추천
  - `POST /essays/generate` — AI 초안 생성
  - `POST /essays/regenerate` — AI 재생성
  - `POST /essays/{essayId}/questions` — 문항 신규 저장
  - `PATCH /essays/{essayId}/questions/{questionId}` — 문항 수정
- **확인 필요 / 추측한 부분 (위 PROJECT_STATUS 백엔드 의존 항목과 별개로 본 PR 에서 발견한 것들)**:
  - `EssayQuestionCreateRequest.response` 가 `minLength:1`(required) — "초안 생성" 호출에 questionId 가 필요하므로 신규 카드는 placeholder 텍스트(`"(작성 예정)"`)로 일단 저장 후 generate 호출. **백엔드가 실제로 이 우회를 받아주는지 통합 테스트 필요**. 받아주지 않으면 백엔드 측에 응답 필드 nullable 또는 `POST /essays/:id/questions/draft` 같은 분리된 endpoint 협의.
  - `EssayRecommendResponse.relatedExperience[]` 의 swagger 정의는 `{experienceId}` 만 — 노션 테스트 데이터엔 `experienceTitle`, `similarity` 도 있음. 둘 다 처리하되 title 누락 시 `useExperiences()` 캐시에서 매칭. **swagger 와 실 응답 불일치 — 백엔드 swagger 보강 필요**.
- **건드리지 않은 애매한 항목**:
  - `/essays/:id` 상세 페이지: `EssayResponse` 에 `essayId` 누락으로 라우팅 자체 불가능 → Placeholder 유지.
  - "이어쓰기" / "결과 입력" 버튼: 같은 이유로 미노출. 미생성 문항 여부 / 결과 진행 가능 여부 판정용 필드도 `EssayResponse` 에 없어 백엔드 보강 후 활성.
  - 자소서 합격 시 사용자 → WORKER 자동 전환 책임 분기: 백엔드 응답 후 결정.
- **백엔드 미구현 / 대기 항목**: Dashboard 실 데이터, Stats 실 데이터, 자격증 가중치는 본 PR 스코프 밖 — 그대로 둠.
- **삭제**: `frontend/src/data/essays.js` — 어디에서도 import 안 됨 (rg 0건). 옛 자소서 mock.
- **검증**: `npx eslint src/` ✅ / `npx prettier --check src/` ✅ / `npm run build` 623ms ✅. dev HMR 자동 반영.

### Dashboard PeersOrb 본인 5축 실 데이터 연결 (2026-05-09)

- **목표**: PeersOrb 가 모든 유저에게 동일한 mock 값을 보여주던 문제 해결. 본인 5축은 사용자 입력 데이터 기반으로.
- **변경**:
  - [`src/data/dashboard.js`](../frontend/src/data/dashboard.js) — 옛 `PEER_AXES` (이미 0-100 정규화된 가짜 me/peers 통합값) 제거. 대신 `PEERS_MOCK_AVG` (카테고리별 평균 카운트만, 동기 평균 mock) 로 분리.
  - [`src/pages/Dashboard.jsx`](../frontend/src/pages/Dashboard.jsx) — `useExperiences()` + `useCertificates()` 호출 → 본인 카테고리 카운트 (INTERNAL/EXTERNAL/INTERN/PARTTIME + 자격증) → `PEERS_MOCK_AVG` 와 통합 max 기준 0-100 정규화 → PeersOrb 에 전달. `useMemo` 로 캐싱.
- **본인 데이터 진실 / 동기 평균 mock 유지**:
  - 본인 5축은 `/my-experience` + `/my-certificates` 입력에 따라 즉시 변동 ✅
  - 동기 평균은 백엔드 학과 기반 통계 엔드포인트 미구현 → PEERS_MOCK_AVG 그대로
- **백엔드 의존 (신규 7번째 질의 후보)**: 학과 기반 동기 평균 — `groupBy=MAJOR` enum 추가 또는 별도 endpoint. 응답 후 PEERS_MOCK_AVG 변수만 교체하면 됨 (정규화 로직은 그대로).
- **검증**: `npx eslint src/` ✅ / `npx prettier --check src/` ✅ / `npm run build` 682ms ✅.

### 백엔드 IP 갱신: 98.92.68.10 (2026-05-09, EC2 재재시작)

- **사유**: EC2 또 재시작. `98.82.110.229` → `98.92.68.10`.
- **변경**: `vite.config.js` 의 `API_TARGET` 갱신, `.env.local.example` / `frontend/CLAUDE.md` 의 IP 안내 갱신, dev 서버 재시작.
- **검증**: 새 IP HTTP 200 (3.15s), proxy 통과 HTTP 200 (1.30s).
- **항목 6번 (Elastic IP 할당) 재강조 필요** — 같은 작업 반복.

### 백엔드 IP 갱신: 98.82.110.229 (2026-05-09)

- **사유**: EC2 재시작으로 IP 변경 (`3.239.83.170` → `98.82.110.229`). 인스턴스가 Elastic IP 미설정이라 재시작마다 변경됨.
- **변경**:
  - [`vite.config.js`](../frontend/vite.config.js): `API_TARGET` 기본값 갱신.
  - [`.env.local.example`](../frontend/.env.local.example): 현재 IP 안내 + Elastic IP 미설정 경고 추가.
  - [`frontend/CLAUDE.md`](../frontend/CLAUDE.md): API URL 안내 블록의 IP 갱신 + "재시작마다 IP 변경" 운영 노트 강화.
- **검증**: 새 IP HTTP 200 (3.34s), CORS preflight allow-origin 정상. dev proxy 통과 확인 — `http://localhost:3000/api/v3/api-docs` HTTP 200, 1.3s.
- **백엔드팀 신규 질의 (6번째)**: Elastic IP 할당해 재시작 시 IP 가 고정되도록 부탁 — 매 재시작마다 프론트 설정 갱신 + dev 서버 재시작은 비효율.

### DatePicker — 헤더 ▾ chevron + 미래 nav 비활성 (2026-05-09)

- **목표 1**: 헤더 텍스트("2026년 05월")가 클릭 가능함을 사용자가 인지 못 하던 발견성 문제.
- **목표 2**: 미래 셀이 회색 + line-through 로 산만하던 UI.
- **변경**: [`src/components/DatePicker.jsx`](../frontend/src/components/DatePicker.jsx)
  - `NavHeader` — `onLabelClick` 있는 경우(day/month view) 라벨 옆에 ▾ `ChevronDown` 아이콘 추가 + hover 시 배경 진해지고(bg-ink-200) 텍스트·chevron 색 primary 로 변경. 모든 디바이스에서 dropdown 임이 명확.
  - `NavHeader` 가 `disablePrev`/`disableNext` prop 받아 nav 버튼 비활성화 가능.
  - 메인 컴포넌트에서 `min`/`max` 의 연·월 분해 → 각 view 의 ◀▶ disable 조건 계산:
    - day view: 다음/이전 달이 max/min 의 달 범위 밖이면 ▶/◀ 비활성
    - month view: 다음/이전 연도가 max/min 의 연 범위 밖이면
    - year view: 다음/이전 12년 페이지가 max/min 의 연 포함 안 하면
  - 셀 disabled 스타일에서 `line-through` + `opacity-60` 제거 → `text-ink-300 cursor-not-allowed` 만. day/month/year view 모두 동일.
- **결과**: 미래 진입 자체가 차단되어 미래 셀 노출 빈도 거의 0. 같은 달 안의 미래 셀(예: 5/10~5/31)만 단순 회색으로 표시 → 시각 노이즈 대폭 감소. 헤더의 ▾ chevron 으로 drill-down 가능함을 시각 신호로 명시.
- **검증**: `npx eslint src/` ✅ / `npx prettier --check src/` ✅ / `npm run build` 639ms ✅.

### DatePicker — 연/월/일 drill-down view (2026-05-09)

- **목표**: 미래 날짜 비활성화 + 먼 과거(예: 2022년) 진입에 ◀ 36번 클릭이 필요했던 문제. 헤더 텍스트 클릭으로 빠른 점프 추가.
- **변경**: [`src/components/DatePicker.jsx`](../frontend/src/components/DatePicker.jsx) — 단일 day grid → `mode: 'day' | 'month' | 'year'` 3 view drill-down 으로 리팩토링.
  - **day view**: 기존 그리드 그대로. 헤더 "2026년 05월" 텍스트 클릭 시 `month` view 로.
  - **month view**: 4×3 월 그리드. ◀▶ 1년 단위. 헤더 "2026년" 텍스트 클릭 시 `year` view 로. 월 선택 시 `day` view 복귀.
  - **year view**: 4×3 연도 그리드(12년 페이지). ◀▶ 12년 단위. 연 선택 시 `month` view 복귀.
  - **min/max 제약**: 모든 view 에 적용 — month view 에서는 해당 월의 first/last day 가 범위 밖이면 disabled, year view 에서는 해당 연의 1/1 ~ 12/31 이 범위 밖이면 disabled. `max=today` 와 결합하면 "오늘 이후 연/월/일" 모두 그레이 처리.
  - 푸터의 "오늘"/"지우기" 버튼은 모든 view 공통 유지. 트리거 클릭 시 항상 `day` view 로 시작.
- **사용 표준**: react-datepicker / MUI DatePicker 와 동일한 drill-down 패턴 — 사용자 학습 비용 0.
- **검증**: `npx eslint src/` ✅ / `npx prettier --check src/` ✅ / `npm run build` 623ms ✅.

### 경험 폼 `관련 전공` 칩 셀렉터 (2026-05-09)

- **변경 사유**: free text 한 줄 입력 → 본인 전공/부전공을 빠르게 고르는 칩 + "직접 입력" 폴백.
- **변경 파일**: [`src/components/experience/ExperienceForm.jsx`](../frontend/src/components/experience/ExperienceForm.jsx) — `useMe()` 호출해 `major`/`minor` 를 칩으로 노출. 기존 데이터가 칩 값과 일치하면 자동 칩 선택, 다르면 직접 입력 모드 자동 표시.
- **백엔드 정합**: `relatedMajor` 는 swagger 상 `string max 100` free text 라 어떤 값이든 통과. 정합 깨짐 없음.
- **검증**: lint ✅ / prettier ✅ / build 632ms ✅.

### 날짜 미래 차단 — 백엔드 @PastOrPresent 정합 (2026-05-09)

- **확실히 알려진 백엔드 제약** (실측):
  - 경험 `endDate` — 미래 날짜 입력 시 `422 "endDate: 과거 또는 현재의 날짜여야 합니다"` (Spring `@PastOrPresent` 기본 한국어 메시지) ← 사용자 422 에러로 확정.
- **추정되는 제약 (실측 X — 미래 검증 시 사후 보정)**:
  - 경험 `startDate` — 보통 짝이라 같이 적용했을 가능성 높음.
  - 자격증 `getDate(취득일)` — 의미상 자연스러워 가정. 사용자 테스트 시 422 안 떨어지면 max 풀 수 있음.
- **스웨거가 이 제약을 노출하지 않는 이유**: `springdoc-openapi` 가 기본 설정에서 Bean Validation 어노테이션(`@PastOrPresent` 등)을 OpenAPI 스키마로 매핑하지 않음. 백엔드에서 `springdoc.openapi.bean-validation.enabled=true` 같은 설정 켜야 노출됨 — 현재 꺼져있음.
- **변경**:
  - [`src/components/experience/ExperienceForm.jsx`](../frontend/src/components/experience/ExperienceForm.jsx) — 시작일·종료일 DatePicker 모두 `max={todayIso()}` 사전 차단 + validate() 메시지.
  - [`src/components/certificate/CertificateForm.jsx`](../frontend/src/components/certificate/CertificateForm.jsx) — 취득일 native date input 도 같은 패턴 (자격증은 추정 제약). 만료일은 미래 허용 유지.
- **백엔드팀 신규 질의 (5번째)**: springdoc 의 Bean Validation 노출 켜기 또는 검증 어노테이션 붙은 필드 목록 공유.
- **검증**: `npx eslint src/` ✅ / `npx prettier --check src/` ✅ / `npm run build` 643ms ✅.

### 커스텀 캘린더 DatePicker + 경험 폼 적용 (2026-05-09)

- **목표**: 경험 페이지의 시작일/종료일 입력에서 OS 기본 캘린더(`<input type="date">`) 대신 일관된 디자인의 커스텀 캘린더 사용.
- **신규**:
  - [`src/components/DatePicker.jsx`](../frontend/src/components/DatePicker.jsx) — 재사용 가능한 캘린더 popover. `'YYYY-MM-DD'` 입출력 (백엔드 호환), `min`/`max` 범위 + 범위 밖 disabled, `allowClear`, viewport 잔여 공간 기반 위/아래 자동 펼침(`forceDirection` 으로 강제 가능), 외부 클릭/Esc 닫기, ←/→ 월 이동, 오늘/지우기 버튼. 일·토 컬러 분기, 오늘 하이라이트.
- **변경**:
  - [`src/components/experience/ExperienceForm.jsx`](../frontend/src/components/experience/ExperienceForm.jsx) — 시작일/종료일 `<input type="date">` → `DatePicker`. 종료일에 `min={form.startDate}` 전달해 시작일 이전 날짜는 disabled.
- **불변**: 자격증 폼(`CertificateForm.jsx`) 의 취득일/만료일은 그대로 native date input. 사용자가 경험 페이지에 한정해 요청. (필요 시 같은 패턴으로 즉시 교체 가능.)
- **검증**: `npx eslint src/` ✅ / `npx prettier --check src/` ✅ / `npm run build` 737ms ✅. dev HMR 자동 반영.

### P3 자격증 CRUD 페이지 구현 — 2026-05-09

- **목표**: `/my-certificates*` 3개 라우트의 Placeholder 교체. swagger CertificateRequest/Response 매핑.
- **신규 파일**:
  - [`src/components/certificate/CertificateForm.jsx`](../frontend/src/components/certificate/CertificateForm.jsx) — 신규/수정 공용 폼. 자격증명/발급기관/취득일/자격증번호 + "유효기간 있음" 체크박스 → 만료일 노출. 인라인 검증(필수/순서). swagger 의 모든 필드는 optional 이지만 UX 상 자격증명·발급기관·취득일을 필수로 강제.
  - [`src/pages/MyCertificates.jsx`](../frontend/src/pages/MyCertificates.jsx) — 목록. 클라이언트 검색(이름·기관·취득일), 카드(취득일/유효기간/발급번호). 인라인 삭제 2클릭 confirm + 5초 자동 취소.
  - [`src/pages/NewCertificate.jsx`](../frontend/src/pages/NewCertificate.jsx) — `useCreateCertificate` + Form 래퍼.
  - [`src/pages/EditCertificate.jsx`](../frontend/src/pages/EditCertificate.jsx) — 백엔드에 단건 GET 없으므로 `useCertificates()` 목록 캐시에서 ID 매칭 → `useUpdateCertificate`. URL 직접 진입 시 fetch 보장.
- **변경 파일**:
  - [`src/App.jsx`](../frontend/src/App.jsx) — 3개 Placeholder 라우트를 실 컴포넌트로 교체.
- **삭제**:
  - `frontend/src/data/certificates.js` — 어디에서도 import 안 됨 (rg 0건). 옛 자격증 mock.
- **백엔드 제약 반영**:
  - 검색 쿼리 파라미터 미지원 → 클라이언트 사이드 필터.
  - 4/27 회의록의 "메모 / 증빙 파일" 필드는 swagger 스키마에 없음 → 폼에 "준비 중" 안내 placeholder 만 표시. 메모 보기 버튼은 미구현.
  - 단건 GET `/certificates/:id` 없음 → 수정 페이지는 목록 캐시 활용 패턴.
- **검증**: `npx eslint src/` ✅ / `npx prettier --check src/` ✅ / `npm run build` 607ms ✅. dev HMR 자동 반영.

### Sidebar 분리 — fixed 칼럼 + 본문 padding-left (2026-05-09)

- **문제**: Layout 의 main 영역에 `pb-24 lg:pb-32` 를 추가하면서 본문이 viewport 보다 길어지면 `lg:static` 으로 정상 흐름에 들어가 있던 사이드바가 본문 끝까지 늘어나지 않아 하단 어두운 배경이 끊겨 보임.
- **해결**: 사이드바를 lg 이상에서도 `fixed inset-y-0 left-0` 로 두고, 본문 wrapper 에 `lg:pl-[232px]` 로 사이드바 폭만큼 들여씀.
- **변경**:
  - [`src/components/Sidebar.jsx`](../frontend/src/components/Sidebar.jsx): `lg:static lg:translate-x-0 lg:min-h-screen` → `fixed inset-y-0 left-0 z-40 lg:translate-x-0` 단일 형태. 모바일 drawer 도 같은 fixed 스타일을 공유 (transform 만 토글).
  - [`src/components/Layout.jsx`](../frontend/src/components/Layout.jsx): 외곽 `flex min-h-screen` → `min-h-screen` 으로 단순화. 본문 wrapper 에 `lg:pl-[232px] min-h-screen flex flex-col`. 사이드바와 본문이 더 이상 같은 flex row 안에서 서로 길이를 맞추지 않음.
- **결과**: 본문 길이와 무관하게 사이드바가 항상 viewport 전체 높이 (`inset-y-0`) 를 차지해 끊김 없음. nav 내부 자체 스크롤(`overflow-y-auto`) 도 그대로 작동.
- **검증**: `npx eslint src/` ✅ / `npx prettier --check src/` ✅ / `npm run build` 615ms ✅.

### 학점 항상 필수 + 진로 관심사 드롭다운 단순화 (2026-05-09)

- **변경 1: 학점 필수화** — 기존 "부전공 입력 시 필수" 조건부 → **항상 필수**.
  - [`src/pages/Onboarding.jsx`](../frontend/src/pages/Onboarding.jsx): `validate()` 의 `minor` 의존성 제거, 학점 빈값이면 즉시 에러. 학점 Field UI에서 `minorRequiresGpa` 변수와 hint "부전공 입력 시 필수" 제거. 헤더 doc-comment 도 갱신.
  - [`src/pages/Info.jsx`](../frontend/src/pages/Info.jsx): 동일 정책 적용 — `validate()` minor 의존 제거, Field 항상 `required={isEdit}`, hint 제거.
- **변경 2: 진로 관심사 드롭다운에서 검색 제거 + 항상 아래로 펼침**.
  - [`src/components/Combobox.jsx`](../frontend/src/components/Combobox.jsx): 새 props 추가
    - `searchable` (default `true`) — false 면 검색바 자체 미렌더.
    - `forceDirection?: 'down' | 'up'` — viewport 자동 감지를 무시하고 강제 방향. (학과 cascade 등 자동 감지가 유리한 곳은 그대로 자동.)
  - [`src/pages/Info.jsx`](../frontend/src/pages/Info.jsx) / [`src/pages/Onboarding.jsx`](../frontend/src/pages/Onboarding.jsx): `JobTreeSelect` 의 3개 Combobox 모두 `searchable={false}` + `forceDirection="down"`. `searchPlaceholder` prop 제거.
- **불변 (참고)**: 학과 cascade(`DeptCascadeSelect`)는 검색·자동 펼침 그대로 유지. 사용자 요청은 진로 관심사에 한정.
- **검증**: `npx eslint src/` ✅ / `npx prettier --check src/` ✅ / `npm run build` 623ms ✅.

### `/info` 검증 정책 Onboarding 일치 + 헤더 정리 (2026-05-09)

- **목표**: Info 페이지 수정 모드에서 Onboarding 과 동일한 인라인 검증 적용. 헤더의 학번·학년 부제는 학적 정보 카드와 중복이라 제거 + 이름을 아바타 옆에 수직 중앙 정렬.
- **변경**: [`src/pages/Info.jsx`](../frontend/src/pages/Info.jsx)
  - 검증 함수 `validate(draft)` 신규 — Onboarding 과 동일 규칙: 이름 ≥2자, 학번 8자리 숫자, 현재상태/전공/직무 대·중·소 필수, 학점 0~4.5(부전공 입력 시 필수), 부전공 ≠ 전공.
  - `submitted` state 추가 — 첫 "저장" 클릭 후 라이브 검증. enterEdit/cancelEdit 시 리셋.
  - `save()` 수정 — toast 한 줄 검증 → validate 전체 검증 + 인라인 에러 노출 + 토스트.
  - `Field` 컴포넌트에 `error`/`hint` prop 추가 (Onboarding 과 일치).
  - 학번 input — `inputMode="numeric"`, `maxLength={8}`, `onChange` 에서 숫자 외 문자 제거.
  - 현재 상태 select — `'선택 안 함'` 옵션 제거 → placeholder "선택" 패턴(필수 필드).
  - 학점 Field — 부전공이 비어있을 때 hint "부전공 입력 시 필수" 노출.
  - `JobTreeSelect` — `errors` prop 받아 각 Combobox 에 `hasError` 전달, 라벨에 `*` 마크.
  - `PlainSelect` 업그레이드 — `placeholder`/`hasError`/`disabled` 지원.
  - 헤더 — 부제 div(학번 · 학년) 제거. 이름은 `min-w-0 flex-1` h1 한 개로 아바타 옆 수직 중앙 정렬. `mb-4`→`mb-5`.

### 진로 관심사 Combobox 전환 + Combobox 위/아래 자동 펼침 (2026-05-09)

- **목표**: `/info` 의 진로 관심사 3단(대/중/소) 드롭다운을 검색 가능한 Combobox 로 교체. 옵션 수가 큼(대 13 / 중 ~114 / 소 ~1,125) → 검색 필수. 페이지 하단에서 펼치면 잘려 보이는 문제도 해결.
- **변경**:
  - [`src/components/Combobox.jsx`](../frontend/src/components/Combobox.jsx) — 열 때 `getBoundingClientRect()` 로 viewport 잔여 공간 측정 → 아래 공간 부족하면 **위로 펼침** (`bottom-full mb-1`). 충분하면 기본 아래(`top-full mt-1`).
  - [`src/pages/Info.jsx`](../frontend/src/pages/Info.jsx) — `JobTreeSelect` 의 3개 PlainSelect 를 Combobox 로 교체. 각 단계 검색·`allowClear` 적용.
  - [`src/pages/Onboarding.jsx`](../frontend/src/pages/Onboarding.jsx) — 일관성 위해 직무 트리 동일 적용. (현재 상태 enum 6개는 PlainSelect 유지 — 검색 불필요.)
  - [`src/components/Layout.jsx`](../frontend/src/components/Layout.jsx) — main 영역 패딩을 `py-5 lg:py-7` → `pt-5 lg:pt-7 pb-24 lg:pb-32`. 페이지 끝에 펼침 영역 충분 확보(이중 안전망).
- **검증**: `npx eslint src/` ✅ / `npx prettier --check src/` ✅ / `npm run build` 624ms ✅. dev HMR 자동 반영.

### 학과 선택 UX — 단과대→학과 cascade + 검색 (2026-05-09)

- **목표**: `/info`(전공·부전공)에서 단과대>학과 54개가 한 dropdown 에 펼쳐져 정보 과다. UX 개선 + 검색 기능.
- **신규 파일**:
  - [`src/components/Combobox.jsx`](../frontend/src/components/Combobox.jsx) — 재사용 가능한 검색형 dropdown. 외부 클릭/Esc 닫기, ↑/↓/Enter 키보드 nav, `allowClear` 옵션. 평면 옵션 리스트만 받음 (group 분리는 호출부 책임).
  - [`src/components/DeptCascadeSelect.jsx`](../frontend/src/components/DeptCascadeSelect.jsx) — 단과대 → 학과 2단계 cascade. 둘 다 Combobox. 외부 `value` 변동 시 단과대 자동 매칭 (파생값 + interim state, useEffect 동기화 회피). 단과대 변경 시 학과 자동 비움.
- **변경 파일**:
  - [`src/pages/Info.jsx`](../frontend/src/pages/Info.jsx) — 전공/부전공 셀렉터를 `DeptSelect` (single big optgroup) → `DeptCascadeSelect`. 옛 `DeptSelect` 함수 정의 제거. `KOOKMIN_DEPT_OPTIONS / KOOKMIN_COLLEGES` import 제거 (cascade 컴포넌트 내부로 이동).
  - [`src/pages/Onboarding.jsx`](../frontend/src/pages/Onboarding.jsx) — 일관성 위해 동일 cascade 적용. 옛 inline `DeptSelect` 함수 제거.
- **검증**: `npx eslint src/` ✅ / `npx prettier --check src/` ✅ / `npm run build` 607ms ✅. dev HMR 자동 반영.

### P1 경험 CRUD 페이지 구현 — 2026-05-09

- **목표**: `/my-experience*` 3개 라우트의 Placeholder 교체. 백엔드 `useExperiences*` 훅 100% 활용.
- **신규 파일**:
  - [`frontend/src/components/experience/ExperienceForm.jsx`](../frontend/src/components/experience/ExperienceForm.jsx) — 신규/수정 공용 폼. swagger `ExperienceRequest` 형식으로 onSubmit 콜백. 카테고리(4종 칩) / 제목 / 관련 전공 / 시작·종료일 / STAR 4 텍스트영역. 인라인 검증(필수/길이/날짜 순서).
  - [`frontend/src/pages/MyExperience.jsx`](../frontend/src/pages/MyExperience.jsx) — 목록. **검색 + 카테고리 필터 칩 + 항목 리스트가 하나의 .card 로 통합** (2026-05-10 개편). 검색은 제목/관련전공/STAR/카테고리 라벨 클라이언트 필터. row(badge·기간·제목·관련 전공·요약) + STAR 보기 토글(`line-clamp-2`). 로딩/에러/빈 상태 분기.
  - [`frontend/src/pages/NewExperience.jsx`](../frontend/src/pages/NewExperience.jsx) — `useCreateExperience` + ExperienceForm 래퍼.
  - [`frontend/src/pages/ExperienceDetail.jsx`](../frontend/src/pages/ExperienceDetail.jsx) — view/edit 토글 + 삭제(2클릭 confirm 패턴 — Modal 의존성 회피).
- **변경 파일**:
  - [`frontend/src/App.jsx`](../frontend/src/App.jsx) — 3개 Placeholder 라우트를 실 컴포넌트로 교체.
- **삭제**:
  - `frontend/src/data/experiences.js` — 더 이상 어디에서도 import 안 됨 (rg 0건). 옛 STAR mock.
- **백엔드 제약 반영**:
  - 백엔드가 검색 쿼리 파라미터 미지원 → 카테고리 필터는 클라이언트 사이드.
  - 4/27 디자인의 "역할 / 간단 요약 / 희망 직무" 필드는 swagger `ExperienceRequest`에 미반영 → 폼에 포함하지 않음 (백엔드 추가 후 보강 예정 — PROJECT_STATUS 백엔드 의존 항목 참조).
- **검증**: `npx eslint src/` ✅ / `npx prettier --check src/` ✅ / `npm run build` 619ms ✅. dev 서버 HMR 자동 갱신.

### AI 3종 훅 추가 + Dashboard 5축 정리 — 2026-05-09 (P0 사전 작업 + P2 완료)

- **목표**: 백엔드 답변 대기 중 차단 없는 작업 소화.
- **변경 파일**:
  - [`frontend/src/api/queries/useEssays.js`](../frontend/src/api/queries/useEssays.js): `useRecommendExperiences`, `useGenerateAnswer`, `useRegenerateAnswer` 3개 mutation hook 신규 추가. 헤더 주석 스웨거 검증 결과로 재작성, "백엔드 미구현" 잘못된 주장 제거, `recommand` 오타 정리.
  - [`frontend/src/components/dashboard/SeniorRoadmapCard.jsx`](../frontend/src/components/dashboard/SeniorRoadmapCard.jsx): `SeniorMilestone` 카드 안 카테고리 라벨 (`<span>{label}</span>`) 제거 — 4/27 디자인의 "활동 카테고리 앞 표시 지우기" 반영. 좌측 컬러 보더만 유지. `CAT_LABELS` import 제거.
- **확인 결과 (Dashboard 5축)**: 회의록 4/27의 "옛 5축 → 새 5축" 정정은 **이미 코드에 적용된 상태**였음. `PEER_AXES`도 (대내/대외/인턴/알바/자격증) 그대로, 로드맵 카테고리 매핑(parttime/internal/intern/activity/cert)도 정합. "마일스톤 달성 여부 표시"는 코드에 원래 없었음. 따라서 P2 작업 = SeniorMilestone 카테고리 라벨 1건만 처리. PROJECT_STATUS의 이전 가정("옛 5축 사용 중") 정정.
- **검증**: `npx eslint src/` ✅ / `npx prettier --check src/` ✅ / `npm run build` 611ms ✅.

### Swagger 명세 직접 검증 — 2026-05-09 (Notion CSV 무효화)

- **결론**: 백엔드 진실 원천은 **`https://logi.p-e.kr/api/swagger-ui/index.html`** (스펙 JSON `/api/v3/api-docs`). 노션 API CSV의 메서드/경로는 **부정확**. 프론트 `useEssays.js`가 가정한 PATCH/`/questions` 서브패스가 **실제로 맞음**.
- **새 실서버 IP**: `3.239.83.170` (옛 `3.238.29.250` 폐기). 도메인 `logi.p-e.kr` 살아남.
- **자소서 contract drift — 정정 결과**:
  - ❌ ~~메서드 불일치(PATCH vs PUT)~~ — 스웨거가 PATCH 라 프론트 훅이 옳음.
  - ❌ ~~경로 불일치(`/essays/:id/questions` vs `/essays/:id`)~~ — 스웨거가 `/questions` 서브패스 라 프론트 훅이 옳음.
  - ✅ **잔존**: `useEssays.js` 주석의 "AI 3종 미구현" 주장 **틀림** — 스웨거에 모두 있음. 다만 **훅 자체는 미작성**이라 새로 만들어야 함. 그리고 **`recommand` → `recommend` 오타** (스웨거가 정).
  - ✅ **잔존**: `EssayResponse` (목록 항목)에 **`essayId` 진짜 없음**. 목록→상세 라우팅 차단. 백엔드 추가 요청 필요.
  - ✅ **잔존**: `EssayDetailResponse`가 `globalReq` 대신 **`requirement`**, `updatedAt` 대신 **`modifiedDate`** (목록은 `updatedAt`임 — 일관성 없음). 페이지에서 normalize 어댑터 필요.
- **신규 필드 — 회의록 vs Swagger**:
  - `ExperienceRequest`에 **희망 직무 필드 없음** (4/27 "추가되어야 함" 그대로 미반영).
  - `CertificateRequest`에 **메모/증빙 파일 필드 없음**.
  - `UserMeResponse`에 **포트폴리오 링크 / 자기소개 필드 없음**.
  - `EssayQuestionCreateRequest`에 `maxLength` **이미 있음** (5/3 회의록 TODO 백엔드 반영 완료) — 프론트 UI에 노출만 하면 됨.
  - `GET /certificates/{id}` 단건 조회 **없음** (PUT/DELETE만 있음). 자격증 수정 진입 시 목록 캐시 활용 필요.
- **백엔드 미구현 (스웨거에 없음)**: `/users/me/stats`, `/users/me/dashboard`. 자격증 가중치(5/1)도 스웨거에 항목 없음.
- **enum 정합 재확인**: 스웨거의 `state` enum (`FRESH_MAN/SOPHOMORE/JUNIOR/SENIOR/JOBSEEKER/WORKER`)과 `major` 풀네임 enum 모두 `lib/enums-data.js`와 일치 ✅.

### Notion 회의록 동기화 — 2026-05-09 분석 (이전 — Swagger 검증으로 일부 정정됨)

- **목적**: Notion export(2026-05-09 시점)와 PROJECT_STATUS 비교, 누락된 기능 요구사항 / 디자인 변경사항 / 백엔드 진행상황 차이 정리.
- **핵심 발견**:
  - **백엔드 거의 다 완료**: API 명세 CSV에 따르면 essay 전체 (recommand/generate/regenerate/create/result/CRUD), certificate CRUD, experience CRUD, auth, GET·PUT /users/me 모두 `완료`. 미완료 둘만 남음 — `/users/me/stats`, `/users/me/dashboard`.
  - **이전 PROJECT_STATUS의 "AI 추천 게이트(미구현)" 가정이 무효**: 자소서 페이지 구현 시 즉시 실 API 호출 가능.
  - **Dashboard 5축 지표가 디자인 회의(4/27)와 어긋남**: 현재 코드의 `data/dashboard.js` `PEER_AXES`는 (학업/경험다양성/자소서/합격률/지원량). 새 명세는 (대내활동/대외활동/인턴/아르바이트/자격증). PeersOrb 데이터 + 로드맵 카테고리(학업→아르바이트, 프로젝트→대내활동) + 선배 로드맵 UI 정리(드롭다운/카테고리 표시/마일스톤 달성표시 제거) 동반 필요.
  - **새 기능 요구사항 (5/1, 5/3 회의)**:
    - 자격증 가중치 (자소서 합격 시 도움된 자격증 선택 → 통계 1등 표시) — 백엔드 API 미반영, 백엔드 협의 필요.
    - 자소서 작성 진입 시 회사명·희망직무·글로벌 요구사항 입력 화면(자소서 onboarding) — `/essays/create` body가 `{companyName, wishJob, globalReq}`로 이미 구현됨 (테스트 페이로드 확인).
    - 질문별 글자수 필드 (`maxLength`) — 백엔드 페이로드에 이미 존재(테스트 데이터 `maxLength: 600`), 프론트 UI에 노출/입력 필요.
    - 자소서 수정 페이지: 질문별 재생성 / 새 질문 추가 / 요구사항 옆 "적용하기"·"수정하기" 버튼.
- **데드라인**: 헤더 D-day 위젯 — **2026-05-22 최종 발표** (~13일 남음).
- **Notion 사양 vs 현 코드 outdated 항목**: 4/27 디자인 문서의 온보딩 페이지가 `ID/PW` 입력 필드 명시 — Google OAuth 결정 이전 사양이라 무시. 현재 Onboarding.jsx가 옳음.
- **enum 정합성 확인**: 노션 Enum 페이지(경험/자소서진행/현재상태/통계비교) 모두 `lib/enums-data.js`와 일치 ✅.

### Onboarding 폼 전면 개편 (2026-05-09)

- **목표**: 첫 로그인 온보딩 폼을 백엔드 `/users/me` PUT 계약과 완전히 일치시키고 인라인 검증 도입.
- **변경 파일**: [`frontend/src/pages/Onboarding.jsx`](../frontend/src/pages/Onboarding.jsx) 전면 재작성.
- **제거**: `frontend/src/data/onboarding.js` (mock `MAJORS` / `JOB_TREE`).
- **요점**:
  - 모든 enum 필드를 `lib/enums.js`의 백엔드 직렬화 값으로 직접 사용 (KookminDepartment, JobFirst/Second/Third, State).
  - 학년 필드 → 현재 상태로 통합 (FRESH_MAN/SOPHOMORE/JUNIOR/SENIOR/JOBSEEKER/WORKER 6개).
  - 폼 디폴트 값 제거 — 모든 필드 placeholder로 시작.
  - 인라인 검증: 첫 "시작하기" 클릭 후부터 라이브 검증.
  - 필수: 이름(2자+) / 학번(8자리 숫자) / 전공 / 현재상태 / 직무 대·중·소.
  - 옵셔널: 부전공, 학점(0~4.5). **부전공 선택 시 학점 필수**. 부전공은 전공과 다르게(옵션에서 제외).

## 진행 중인 작업

(현재 진행 중인 작업 없음 — 위 단위 종료, 다음 지시 대기.)

## 다음에 해야 할 작업 (우선순위 순)

> **D-12 (2026-05-22 최종 발표 기준, 2026-05-10 시점)** 으로 정렬. 데모 핵심 가치 제안(자소서 추천)을 먼저 작동시키는 순서.

### P0. 자소서 플로우 — ✅ 코어 완료 (2026-05-09)

#### `/write` — 자소서 작성 페이지 (4/27, 5/3 디자인)

- [x] 1단계: 회사명 / 희망직무 / 글로벌 요구사항 입력 폼 → `POST /essays/create`
- [x] 2단계 진입 후 문항 추가 버튼 → 문항 입력(질문 + 글자수 `maxLength`)
- [x] 문항 입력 완료 시 `POST /essays/recommend` 호출 → 추천 경험 상위 2개 자동 표시
- [x] 추가 추천 경험 카드 클릭으로 토글, 활용 경험 **최대 2개**
- [x] "초안 생성" → `POST /essays/generate`
- [x] 재생성 영역: 사용자 요구사항 입력 + "다시 생성" → `POST /essays/regenerate`. "요구사항 비우기" 버튼.
- [x] "이 문항 저장" → `POST /essays/:id/questions` (신규) / `PATCH /essays/:id/questions/:qid` (수정)
- [x] 글로벌 요구사항 인라인 수정 → `PATCH /essays/:id`
- [x] "작성 완료" → `/essays`로 이동
- [ ] **백엔드 의존**: "내 이력에서 직접 찾기" 모달 — 핵심 흐름 외라 본 PR 보류 (추후 추가).
- [ ] **백엔드 의존**: 이어쓰기 진입 모드 — `EssayResponse.essayId` 응답 누락으로 진입점 자체 차단. 백엔드 fix 후 활성.

#### `/essays` — 자소서 관리 페이지 (4/27)

- [x] "새 자소서 쓰기" 버튼 → `/write`
- [x] 검색창(기업명·직무) 필터링 (클라이언트 사이드)
- [x] 카드 표시: 회사명 / 직무 / 진행 상태(badge) / 최종 수정일
- [ ] **백엔드 의존**: 카드 클릭 → `/essays/:id` 상세 진입 — `EssayResponse.essayId` 누락 차단. 인라인 안내 노출 중.
- [ ] **백엔드 의존**: "이어쓰기" 버튼 — 미생성 문항 판정 필드 + essayId 둘 다 필요.
- [ ] **백엔드 의존**: "결과 입력" 드롭다운 → `PATCH /essays/:id/result`. essayId + 결과 진행 가능 여부 필드 필요.
- [ ] **백엔드 의존**: 합격 시 사용자 상태 자동 WORKER 전환 책임 분기 (백엔드 vs 프론트 PUT).

#### `/essays/:id` — 자소서 열람 페이지 (4/27)

- [ ] **백엔드 의존**: 페이지 자체가 essayId 라우팅 차단으로 진입 불가 → Placeholder 유지. essayId 추가 후 신규 작성 + 응답 키 정합 후 normalize 어댑터 작성.

### P1. 경험 CRUD — ✅ 코어 완료 (2026-05-09)

> 라이브 동작 확인 + "역할 / 간단 요약 / 희망 직무" 필드 보강은 백엔드 답변 후.

#### `/my-experience` — 내 경험 목록 (4/27, 2026-05-10 UI 개편)

- [x] 상단 "경험 추가" 버튼 → `/my-experience/new`
- [x] 검색·카테고리 필터·항목 리스트 **하나의 .card 안에 통합** (2026-05-10 개편). 항목은 카드 내부 row(divider 구분).
- [x] 카테고리 필터(클라이언트 사이드): 모두 / 대내 / 대외 / 인턴 / 알바
- [x] **검색 (클라이언트 사이드)**: 제목 / 관련 전공 / STAR 4항목 / 카테고리 라벨 부분일치 (2026-05-10 추가)
- [x] row 표시: 카테고리 badge · 진행 기간 · 제목 · 관련 전공 · S 한 줄 요약(line-clamp-2)
- [x] "STAR 보기/접기" 토글 — 4항목 line-clamp-2
- [x] row 클릭 → `/my-experience/:id`
- [x] 로딩/에러/빈 상태 (검색·필터 적용 시 통합 초기화 버튼)

#### `/my-experience/new` — 경험 추가 (4/27)

- [x] 카테고리 선택 (대내/대외/인턴/알바)
- [x] 기본 정보: 제목 / 관련 전공 / 시작일 / 종료일
- [x] STAR 4항목 textarea
- [x] 임시저장·진행중 체크박스 없음
- [x] 저장 → `POST /experiences` → 목록 이동
- [ ] **백엔드 의존**: 역할 / 간단 요약 / 희망 직무 필드 추가 후 폼에 반영

#### `/my-experience/:id` — 경험 열람/수정/삭제 (4/27)

- [x] view: 카테고리·기간·관련 전공·STAR 4항목 (truncate 없음)
- [x] edit 토글 → 같은 ExperienceForm 사용 → `PUT /experiences/:id`
- [x] 삭제 (2클릭 confirm + 5초 timeout 자동 취소) → `DELETE /experiences/:id`
- [x] 키워드 태그 등 회의록 제거 항목 미포함
- [ ] **백엔드 의존**: 신규 필드 추가 후 view/edit 양쪽 보강

### P2. Dashboard 5축 지표 교체 — ✅ 완료 (2026-05-09)

- [x] `data/dashboard.js`의 `PEER_AXES` 5축 — 이미 정합 상태였음 (대내활동/대외활동/인턴/알바/자격증)
- [x] `PeersOrb.jsx` 데이터 contract — 변경 불필요
- [x] `MyRoadmapCard.jsx` 카테고리 매핑 — 이미 정합 (parttime/internal/intern/activity/cert)
- [x] `SeniorRoadmapCard.jsx`: 상단 드롭다운 원래 없었음, 마일스톤 달성 표시 원래 없었음, **활동 카테고리 라벨 제거 완료** (2026-05-09)
- [ ] 백엔드 `/users/me/dashboard` 완성 후 mock → 실 데이터 훅 교체 (백엔드 의존)

### P2.5. `/info` 보강 (4/27 — baseline 누락 항목)

- [ ] 포트폴리오/링크 탭: GitHub / Notion / LinkedIn / 기술 블로그 등 사용자가 직접 추가 가능. **백엔드 스키마에 해당 필드 있는지 확인 필요** (`/users/me` 응답 shape) — 없으면 백엔드 협의
- [ ] 자기소개 한 줄 / 한 문단 입력 영역 — 수정 / 복사 버튼. 위와 동일하게 백엔드 필드 확인 필요

### P3. 자격증 CRUD — ✅ 코어 완료 (2026-05-09)

#### `/my-certificates` — 목록 (4/27)

- [x] 검색창: 자격증명 / 발급 기관 / 취득일 (클라이언트 필터)
- [x] 카드: 자격증명 / 취득 기관 / 취득일 / 유효기간(있음/없음) / 발급번호
- [x] 카드의 "수정" 버튼 → `/my-certificates/:id/edit`
- [x] "삭제" 버튼 → 2클릭 confirm → `DELETE /certificates/:id`
- [x] "자격증 추가" 버튼 → `/my-certificates/new`
- [ ] **백엔드 의존**: "팁 보기" 버튼 — 메모 필드 추가 후 구현

#### `/my-certificates/new` — 추가 (4/27)

- [x] 기본 정보: 자격증명 / 발급 기관 (분야·등급·점수 없음)
- [x] 일자: 취득일 / 자격증 번호 / "유효기간 있음" 체크박스 → 만료일
- [x] 상단 "상태" 섹션 없음
- [x] 저장 → `POST /certificates` → 목록으로
- [ ] **백엔드 의존**: 증빙 파일 첨부 / 학습 방법·교재 메모 — 폼에 "준비 중" placeholder 만 표시

#### `/my-certificates/:id/edit` — 수정 (4/27)

- [x] 백엔드 단건 GET 부재 → `useCertificates()` 목록 캐시에서 ID 매칭
- [x] 자격증명 / 발급 기관 / 취득일 / 만료일 / 발급번호 수정 → `PUT /certificates/:id`
- [x] 취소 → 변경 저장 안 함

### P4. 통계 페이지 — ✅ mock UI 완료 (2026-05-09)

- [x] 비교 대상 필터 (STATE / SCHOOL_NUM / WORKER, `lib/enums.js` 의 STATS_GROUP_LABEL 사용)
- [x] 5축 막대그래프 (대내/대외/인턴/알바/자격증) — 본인 vs 평균
- [x] 경험 카테고리 분포 차트 (본인 자체) — SVG 도넛 + 우측 범례 (2026-05-10 업데이트)
- [x] 비교 기준 표시 + 비교 대상 인원 수
- [x] 부족한 경험 카드 (카테고리별 미달 + 추천 경험) + 모두 충분 시 "다른 집단 비교 권고" 텍스트
- [x] "목표로 추가" 버튼 미노출
- [ ] **백엔드 의존**: `GET /users/me/stats?groupBy=` 구현 후 `useMyStats(groupBy)` 훅 추가하여 mock 변수 교체

### P5. (백엔드 협의 필요) 자격증 가중치 시스템

- [ ] 5/1 회의 새 기능. API 명세 CSV 미반영 — 백엔드와 별도 협의 후 페이지 추가
- [ ] 자소서 합/불 입력 시 도움된 자격증 선택 → 통계의 "기준 1등" 자격증 표시

### ⚠️ 백엔드 의존 항목 (Swagger 재검증 후, 2026-05-10 — 신규 4종 추가 흡수)

> 백엔드 진실 원천: **`https://3.238.245.5/api/swagger-ui/index.html`** (도메인 DNS 미갱신). 2026-05-10 재검증 결과 스웨거 **28개** 엔드포인트 = 프론트 hook 28개 1:1 매핑 완료 (백엔드가 신규 4종 추가). 아래는 hook 은 있지만 **백엔드 응답 결함으로 일부 동작이 막혀있는** 지점들.

#### 프론트 훅 보강 — 모두 완료 (2026-05-10 시점)

- [x] `useRecommendExperiences` (POST `/essays/recommend`) (2026-05-09)
- [x] `useGenerateAnswer` (POST `/essays/generate`) (2026-05-09)
- [x] `useRegenerateAnswer` (POST `/essays/regenerate`) (2026-05-09)
- [x] `useEssays.js` 주석의 "백엔드 미구현" 문구 정정, `recommand` → `recommend` 오타 수정 (2026-05-09)
- [x] `useWithdraw` (POST `/auth/withdraw`) (2026-05-10)
- [x] **`useDashboard` (GET `/users/me/dashboard`)** (2026-05-10) — 신규 백엔드 흡수
- [x] **`useMyStats(groupBy)` (GET `/users/me/stats?groupBy=`)** (2026-05-10) — 신규 백엔드 흡수
- [x] **`useEssay(id)` 안 normalize 어댑터** — `requirement`→`globalReq`, `modifiedDate`→`updatedAt` 정합 통일 (2026-05-10)
- [ ] `EssayResponse` 목록 항목에 `essayId` 없음 → **목록→상세 라우팅이 opportunistic 으로만 동작 (응답에 essayId 가 들어오면 자동 활성)**. 백엔드 응답 보강 필요.

#### 백엔드 의존 — 스웨거에 없거나 빠진 것

| 항목                                           | 상태                               | 데모 영향                                                                                                                                                   |
| ---------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /users/me/stats?groupBy=`                 | ✅ 구현됨 (2026-05-10)             | Stats 실 데이터 흡수 완료                                                                                                                                   |
| `GET /users/me/dashboard`                      | ✅ 구현됨 (2026-05-10)             | Dashboard 실 데이터 흡수 완료                                                                                                                               |
| `GET /essays/{essayId}`                        | ✅ 구현됨 (2026-05-10)             | EssayDetail 페이지 활성                                                                                                                                     |
| `GET /experiences/{experienceId}`              | ✅ 구현됨 (2026-05-10)             | ExperienceDetail 이미 hook 사용 중이라 영향 없음                                                                                                            |
| 자격증 가중치 (5/1 회의)                       | 명세 자체 없음                     | 데모 필수 X                                                                                                                                                 |
| `EssayResponse.essayId` 누락                   | 명세 누락 (스웨거 명시)            | **자소서 목록→상세 라우팅 opportunistic 비활성** — 백엔드 수정 필요                                                                                         |
| `GET /certificates/{id}` 단건 조회             | 없음 (PUT/DELETE만)                | 목록 캐시로 우회 가능                                                                                                                                       |
| `ExperienceRequest`에 "희망 직무" 필드         | 없음 (회의록 4/27 "추가되어야 함") | UI 자리 비활성화 후 백엔드 추가 시 활성                                                                                                                     |
| `CertificateRequest`에 메모/증빙/유효기간 토글 | 없음                               | 유효기간 토글 + 메모는 미반영. **PDF 첨부 UI 는 클라 활성** (form 보관, 저장 시 미전송) — 백엔드 multipart 엔드포인트 추가 시 즉시 전송 코드만 추가하면 됨. |
| `UserMeResponse`에 포트폴리오/자기소개         | 없음                               | /info 보강 항목                                                                                                                                             |
| `GraduateUserExperiences`에 표시명/회사/시즌   | 없음                               | SeniorRoadmapCard 가 "선배 1·2·3" index 라벨 사용                                                                                                           |

#### 동작 책임 — 백엔드팀 확인만 (스웨거로는 판단 불가)

- 자소서 합격 시 사용자 상태 → WORKER 자동 전환: `PATCH /essays/{id}/result` 핸들러가 처리? 프론트가 `PUT /users/me` 별도 호출?
- 자소서·자격증 검색: 백엔드가 쿼리 파라미터 지원 X (스웨거에 검색 query 없음) → **클라이언트 필터링으로 확정** (목록 GET 후 프론트에서 필터).
- **Bean Validation 어노테이션 노출**: springdoc 의 bean-validation 통합을 켜면 `@PastOrPresent`, `@NotNull`, `@Size` 등이 swagger 에 자동 반영. 현재 꺼져있어 422 에러 나올 때마다 프론트가 사후 보정 중. (예: 경험 `endDate` 의 `@PastOrPresent` 는 실측으로 발견.)

## 중요한 결정사항

- **HashRouter 사용**: BrowserRouter 아님. URL이 `#/...`. `main.jsx` 어댑터가 OAuth callback의 pathname을 hash로 옮김.
- **API base에 `/api` 포함**: 백엔드 `context-path: /api` 때문. `VITE_API_URL=http://localhost:8080/api`.
- **토큰 저장 키**: `localStorage.accessToken` / `localStorage.refreshToken`. 옛 단일 `localStorage.token` 키 폐기.
- **응답 unwrap 인터셉터**: axios가 `ApiResponse<T> = { statusCode, message, data }`의 `data`를 까서 호출부에 전달.
- **OAuth 게이트**: 백엔드가 `@kookmin.ac.kr` 도메인만 허용. 데모용 일반 계정 사용 불가.
- **enum 동기화**: 백엔드 enum은 `frontend/src/lib/enums-data.js`에 수동 동기화. 백엔드 변경 시 수동 갱신 필요(스크립트 도입 후보).
- **dev 서버 포트 강제 3000**: `vite.config.js`의 `strictPort`. 백엔드 OAuth redirect_uri와 일치시키기 위함.
- **Onboarding/Info 매핑 정책 통일**: 둘 다 enum 직접 사용. mock 매핑 레이어 없음.
- **학점 필드**: Onboarding/Info 둘 다 **항상 필수** (0~4.5 범위). 부전공 의존성 없음.
- **부전공 옵션 제외**: 부전공 select에서 전공과 동일한 학과는 옵션 자체에서 제거 (검증보다 강한 UI 가드).
- **Dashboard 5축 지표 교체 결정** (4/27 디자인): (학업/경험다양성/자소서/합격률/지원량) → (대내활동/대외활동/인턴/아르바이트/자격증). 로드맵 카테고리도 학업→아르바이트, 프로젝트→대내활동.
- **자소서 합격 시 사용자 상태 자동 WORKER 전환** (4/27 디자인) — `/essays/:id/result` 호출 시 백엔드가 처리하는지, 프론트가 `/users/me` PUT을 함께 호출해야 하는지는 백엔드 로직 확인 필요.
- **자소서 작성 진입 화면**: 회사명·희망직무·글로벌 요구사항 입력 후 문항 작성 단계 진입 (`/essays/create` body 형태로 백엔드와 정합).
- **날짜 필드 정책**: 백엔드 `@PastOrPresent` 가 걸린 날짜(경험 startDate/endDate, 자격증 getDate 등)는 프론트에서 `max=today` 로 미래 날짜를 입력 단계에서 차단. validate() 에서도 동일 메시지로 이중 안전망. 자격증 만료일처럼 미래가 의미 있는 필드는 max 미지정.
- **경험 `relatedMajor` 필드 정책**: 4/27 디자인에 명시되지 않은 필드지만 swagger `ExperienceRequest` 의 `required` 에 포함. UX 는 칩 셀렉터로 — `useMe()` 의 `major`/`minor` 를 "내 전공 · ...", "내 부전공 · ..." 칩으로 빠른 선택 + "직접 입력" 칩으로 다른 전공 활동도 자유 입력 가능. 백엔드는 `string max 100` free text 라 어떤 값이든 OK (정합 깨짐 없음). 디자인의 "역할/간단 요약/희망 직무" 는 백엔드 스키마 미반영 — 추가되면 보강.

## 남은 이슈 / 리스크

- **CORS allowed-origins 불일치**: 백엔드 yml은 `http://localhost:3000`만 허용. 통합 테스트 시 백엔드 yml 갱신 또는 프론트 3000 사용 필수.
- **`logi.p-e.kr` 도메인 DNS 갱신 안 됨**: DNS가 옛 IP 가리킴. 도메인으로 접속 시 connection timeout. **현재는 IP 직접 사용 (`https://3.238.245.5/api`, 2026-05-09 EC2 재재시작 후)** — 백엔드/인프라팀이 DNS 갱신할 때까지.
- **자체 서명 인증서**: 실서버 `https://3.238.245.5/api`는 자체서명. 브라우저 첫 방문 시 해당 URL 직접 열어 "고급 → 진행" 한 번 통과해야 fetch 호출이 SSL 차단되지 않음.
- **번들 크기 경고**: 프로덕션 빌드 결과 단일 청크 ~979 KB(gzip 274 KB). Three.js 등으로 부피 큼. 현재는 경고만; 배포 직전 코드 스플릿 검토.
- **dynamic import 경고**: `src/store/useAuth.js`가 `axios.js`에서 dynamic import + 다른 곳에서 static import. 의도된 cycle 회피이지만 청크 분리 효과 없음 — 현 동작에 문제는 없음.
- **테스트 부재**: 단위 테스트 없음. `npm test`는 lint+format 게이트. 실제 동작 검증은 dev 서버에서 수동.
- **Dashboard 5축 spec mismatch**: 해소됨 (2026-05-10) — 백엔드 `/users/me/dashboard` 흡수 후 5축 정합 100%.
- **자격증 가중치(5/1)는 백엔드 미반영**: API 명세 CSV에 항목 없음. 페이지 구현 전 백엔드 팀과 합의 필요.
- **합격 시 WORKER 전환의 책임 분기**: `/essays/:id/result` 호출 후 백엔드가 사용자 상태도 갱신하는지, 프론트가 별도로 `/users/me` PUT 해야 하는지 백엔드 코드 확인 필요. 통합 테스트 시 검증.

## 삭제한 파일 목록

| 파일                                 | 삭제 일자  | 사유                                                                                                                                       |
| ------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/src/data/onboarding.js`    | 2026-05-09 | Onboarding.jsx가 `lib/enums.js` 직접 사용으로 전환되어 `MAJORS`/`JOB_TREE` mock이 더 이상 import 되지 않음.                                |
| `frontend/src/data/profile.js`       | 2026-05-09 | `Info.jsx`가 `useMe` 훅으로 마이그레이션되어 하드코딩 PROFILE/INTRO_TEXTS/PROFILE_LINKS mock이 사용처 없음.                                |
| `frontend/src/data/experiences.js`   | 2026-05-09 | P1 경험 CRUD 페이지가 `useExperiences*` 훅 직접 사용으로 전환되어 mock import 0건.                                                         |
| `frontend/src/data/certificates.js`  | 2026-05-09 | P3 자격증 CRUD 페이지가 `useCertificates*` 훅 직접 사용으로 전환되어 mock import 0건.                                                      |
| `frontend/src/data/essays.js`        | 2026-05-09 | `/write`, `/essays` 페이지가 `useEssays*` 훅 직접 사용으로 전환되어 mock import 0건.                                                       |
| `frontend/src/components/Card.jsx`   | 2026-05-10 | `Card` / `CardHeader` 모두 외부 import 0건. `Info.jsx` 가 동명의 인라인 컴포넌트를 자체 정의해 사용 중이라 외부 컴포넌트는 잔여 dead code. |
| `frontend/src/assets/react.svg`      | 2026-05-10 | Vite 템플릿 잔재, 참조 0건.                                                                                                                |
| `frontend/src/assets/vite.svg`       | 2026-05-10 | Vite 템플릿 잔재, 참조 0건.                                                                                                                |
| `frontend/src/assets/hero.png`       | 2026-05-10 | 참조 0건 (랜딩은 SVG 인라인 사용). assets/ 디렉토리 자체도 빈 채 제거.                                                                     |
| `frontend/src/pages/Placeholder.jsx` | 2026-05-10 | `/essays/:id` 가 실 컴포넌트(`EssayDetail.jsx`)로 교체되어 모든 라우트가 실 페이지를 가짐. 외부 import 0건.                                |

## 삭제 후보 (즉시 삭제 안 함)

확실하지 않아 보존 — 현재 0건. 모든 옛 mock 은 구현 페이지 정착 시 정리 완료.

## 보존 — 의도적 미사용 (2026-05-09 재검증)

사용처 0건이지만 의도적으로 보존하는 항목들. rg 로 import 직접 검증함.

### 디자인 시스템 컴포넌트 (미구현 페이지에서 사용 예정)

- `components/Badge.jsx` — tone: gray|navy|green|red|amber. 카드 상태 뱃지에 사용 예정.
- `components/Button.jsx` — variant: default|primary|ghost|danger. 현재 페이지들은 className 직접 조합 패턴.
- (`components/Modal.jsx` 는 2026-05-10 시점 `Info.jsx` 회원 탈퇴 모달에서 실제 사용 중이라 본 섹션에서 제거.)

### lib 표면 (사용처 0건이지만 라이브러리 헬퍼라 보존)

- `lib/enums.js` 의 `KOOKMIN_DEPARTMENTS` / `JOB_TREE_BACKEND` re-export 라인 + `labelize` 함수. 외부에서 raw enum-data 직접 import 가 일어나지 않는 게 정상이라 표면 유지.
- `store/useAuth.js` 의 `setUser` action. 미사용이지만 store API 표면.

### useEssays.js 의 일부 훅 — 활성 (2026-05-10)

- `useEssay` / `useUpdateEssayResult` / `useDeleteEssay` — `/essays/:id` 페이지에서 사용 중. 진입 경로(`/essays` 카드 클릭)는 `EssayResponse.essayId` 응답에 의존하므로 백엔드 fix 전엔 직접 URL 진입만 가능 (opportunistic).

## 마지막 검증 명령어 / 결과

(2026-05-11, 경험·자격증 폼/목록 5종 폴리싱 직후)

```sh
cd frontend
npx eslint src/                # ✅ EXIT 0, 에러 없음
npx prettier --check src/      # ✅ "All matched files use Prettier code style!"
npm run build                  # ✅ 663ms, dist/ 생성.
                                #    chunk 사이즈 경고 + dynamic import 경고는 기존 이슈 (남은 이슈 참조).
```

`npm test`는 위 lint+prettier 두 명령을 묶은 것 (실 단위 테스트 없음).

런타임 검증:

- Dev 서버: `http://localhost:3000/` ✅ (Vite proxy 가 `/api` → `https://3.238.245.5` 포워딩, secure:false 로 cert CN mismatch 우회)
- 프록시 테스트: `POST http://localhost:3000/api/auth/login` 가짜 grantCode → HTTP 401 백엔드 응답 정상 도달 ✅
- Google OAuth 로그인 → /dashboard 도달 (사용자 확인 완료)

---

## Next Session Handoff

> 이 섹션은 **항상 문서의 맨 마지막**에 유지. 새 세션은 여기만 먼저 읽으면 됨.
> 작업 단위가 끝날 때마다 이 섹션을 갱신 — 위 본문보다 이 섹션이 stale 되면 의미 없음.

### 먼저 읽어야 할 맥락 (5개)

1. **역할**: 프론트엔드 담당. 백엔드 API 직접 구현 X. 백엔드가 만든 엔드포인트를 화면에 연결.
2. **D-11 마감**: 2026-05-22 최종 발표 (오늘 2026-05-11 기준).
3. **백엔드 진실 원천 = Swagger**: `https://3.238.245.5/api/swagger-ui/index.html` (현 IP, EC2 재시작마다 변동 — Elastic IP 미설정). **노션 API CSV 부정확** — 차이 있을 때 무조건 스웨거가 우선.
4. **백엔드 ↔ 프론트 hook 매핑** (2026-05-10 swagger 재재검증, 백엔드 신규 4종 추가):
   - 스웨거 엔드포인트 **28개** = 프론트 hook 28개 (1:1 매핑 완료, **미연결 0건**).
   - 새로 흡수된 4종: `GET /users/me/dashboard`, `GET /users/me/stats?groupBy=`, `GET /essays/{id}`, `GET /experiences/{id}`. 백엔드 미구현 항목 **0개**.
5. **현재 백엔드 차단 이슈** (구조적):
   - `EssayResponse` 목록 항목에 **`essayId` 없음** — `MyEssays.jsx` / `EssayListCard.jsx` 카드 클릭이 opportunistic 이라 응답에 essayId 가 들어오기만 하면 자동 활성. 안 들어오면 disabled + 안내 박스. **이 한 필드만 풀리면 자소서 흐름 완성**.
   - `EssayDetailResponse` 키 mismatch: `requirement`/`modifiedDate` — `useEssay` 안의 normalize 어댑터가 통일 키(`globalReq`/`updatedAt`)로 변환하므로 호출부 영향 없음.
   - `EssayQuestionCreateRequest.response` 가 `minLength:1` (required) — Write 페이지의 "초안 생성" 흐름에서 placeholder `"(작성 예정)"` 로 우회. 통합 테스트 시 백엔드가 우회 받아주는지 확인 필요.
   - `GraduateUserExperiences` 에 졸업생 표시명/회사/시즌 누락 — `SeniorRoadmapCard` 가 "선배 1·2·3" index 라벨로 노출. 메타 추가되면 같은 자리에 끼우면 됨.
   - `EssayRecommendResponse.relatedExperience[]` swagger 정의가 `{experienceId}` 만이지만 노션 테스트 데이터엔 `experienceTitle`, `similarity` 도 있음. 둘 다 처리. swagger 보강 요청.

### 바로 할 일 (다음 세션 시작 시 첫 행동)

**최근 진척 (2026-05-11)**:

- **경험·자격증 폼/목록 5종 폴리싱** — (1) 경험 폼 `관련 전공` 칩+직접입력 → 단일 Combobox(KOOKMIN_DEPT_OPTIONS, 필수). (2) 경험 목록 검색을 `experienceTitle` 만으로 좁힘. (3) 자격증 목록 검색 필터 통째로 제거. (4) 경험·자격증 삭제 confirm을 2클릭 인라인 → Modal 팝업으로 (취소/삭제 명시). (5) 자격증 폼의 "증빙·메모 준비 중" placeholder → 실제 PDF 파일 업로드 UI (.pdf, 10MB 제한, 클라 검증). 백엔드 multipart 엔드포인트 미연동이라 form state 보관만, 저장 시 미전송 — 캡션으로 안내.

**최근 진척 (2026-05-10)**:

- **PeersOrb 샌드위치 prism + 모달 확대 + mock 평균** — z=0 평면 가운데 두고 ±양쪽으로 솟는 양면 대칭 prism (회전 어느 각에서도 윤곽 또렷). 카드 우상단 Maximize 아이콘 → Modal 안에 chartMaxWidth=620 으로 큰 PeersOrb (Esc / X 닫기). 백엔드 동기/선배 평균이 비어 시연용 mock 5축 보강 (peer 3-5, senior 5-7).
- **PeersOrb 본인 5축 클라 직접 카운트** — 백엔드 `/users/me/dashboard` 의 myCount 가 0 으로 비어 와서 (집계 미구현/버그), Dashboard.jsx 가 `useExperiences()` + `useCertificates()` 로 본인 카테고리 카운트를 직접 계산. peerAvg / seniorAvg(mock) 는 그대로. 백엔드 dashboard myCount 정상화 시 코드 변경 없이 자연 수렴.
- **PeersOrb 선배 평균 + 색 커스텀 + nested prism** — 범례 swatch 클릭으로 native color picker (localStorage 영속화). axes 에 `seniors` 필드 추가 (백엔드 미구현이라 동기 평균 × 1.2 mock — 백엔드 senior 통계 나오면 한 줄 교체). 세 폴리곤 모두 같은 baseZ 에서 depth 단계화(0.07/0.10/0.13)로 stepped pyramid 중첩.
- **백엔드 신규 엔드포인트 4종 흡수** — `useDashboard` / `useMyStats(groupBy)` hook 신규, `useEssay` 안에 `EssayDetailResponse` normalize 어댑터, `/essays/:id` 페이지(`EssayDetail.jsx`) 신규 작성. Dashboard 의 PEERS_MOCK_AVG / SENIOR_ROADMAPS / SEMESTERS / ymToSemIndex 모두 제거하고 백엔드 `/users/me/dashboard` 응답으로 교체. Stats 의 200줄 MOCK 통째로 제거하고 `/users/me/stats?groupBy=` 응답 사용. SeniorRoadmapCard 가 졸업생 props 기반으로 재작성, 학기 축 자동 계산. MyEssays / EssayListCard 를 essayId opportunistic 으로 변경. 스웨거 28/28 매핑.
- **죽은 파일 정리** — `Placeholder.jsx` 제거 (모든 라우트가 실 컴포넌트). 5축 mock(`PEERS_MOCK_AVG`, `SEMESTERS`, `ymToSemIndex`, `SENIOR_ROADMAPS`) 도 `data/dashboard.js` 에서 제거.
- **회원 탈퇴 (POST /auth/withdraw) 연결** — `useWithdraw` mutation + `useAuth.clearSession` action + `/info` 하단 위험 영역 카드 + "탈퇴" 두 글자 입력 확인 모달.
- **대시보드 디자인 폴리싱** — PeersOrb 보라/Indigo 톤 전부 블루로 통일, SeniorRoadmapCard carousel → 텍스트 탭 + 마일스톤 인라인 dot, 강조색 전부 사이드바 톤(`#1B306F`)으로 통일.

**최근 진척 (2026-05-09)**:

- 로그인/dev proxy / 새 IP 적용 완료
- **모든 페이지 라우트 1차 구현 완료** — Onboarding, Info, Dashboard(mock), MyExperience CRUD, MyCertificates CRUD, Write, MyEssays, Stats(mock). 남은 Placeholder 는 `/essays/:id` 단 하나 (essayId 차단).
- DatePicker / Combobox / 학과 cascade / 진로 관심사 칩 / 글자수 카운터 등 UX 다듬기 완료
- 백엔드팀에 질의 발송됨: essayId 추가 / 합격 시 WORKER 책임 / 응답 키 정합 / 신규 필드 4종 / springdoc Bean Validation / Elastic IP

**다음 직접 작업 (백엔드 답변 도착 전)**:

1. **라이브 검증 일괄** — 진짜 계정으로 `/dashboard` 진입(`useDashboard` 응답 형태 확인), `/stats` 3개 그룹 전환(`useMyStats` 응답), `/essays/:id` 진입(직접 URL 또는 essayId 가 응답에 들어왔을 때) 한 번씩 동작 확인.
2. **시연 시드 데이터** — 본인 경험 5~10건, 자격증 2~3건, 자소서 1~2건 입력. 졸업생 데이터는 백엔드가 따로 생성해줘야 함 (없으면 SeniorRoadmapCard 가 안내 카드).
3. **시연 리허설** — `/dashboard` → `/my-experience` → `/my-certificates` → `/write` 한 사이클 → `/essays` → `/stats` 흐름 점검.

**백엔드 답변 받은 뒤**:

- **`EssayResponse.essayId` 풀리면** — `MyEssays` / `EssayListCard` 의 disabled 상태 자동 활성화 (코드 변경 불요, opportunistic). 안내 박스 자동 숨김.
- **EssayDetailResponse 키 통일** — 백엔드가 `globalReq`/`updatedAt` 으로 통일하면 `useEssay` 의 `normalizeEssayDetail` 한 줄만 제거.
- **폼 보강** — 신규 필드(경험 희망 직무 / 자격증 메모·증빙·유효기간 / `/info` 포트폴리오·자기소개) 추가.
- **GraduateUserExperiences 표시명/회사/시즌 추가되면** — `SeniorRoadmapCard` 의 `SeniorTabs` 라벨 + 우측 메타 영역에 끼움.

### 작업 시 자동 처리 (별도 지시 불요)

- 작업 완료 시 PROJECT_STATUS.md 모든 섹션 갱신 + 이 Handoff 섹션도 같이 갱신.
- 죽은 파일 `rg`로 확인 후 정리 (`삭제한 파일` 섹션에 기록). 확실치 않으면 `삭제 후보`에만 기록.
- `frontend/CLAUDE.md` 디렉토리 맵/정책 블록과의 일관성 점검.
- 검증: `npx eslint src/` + `npx prettier --check src/` + `npm run build` (위 섹션에 결과 기록).
- 보고는 5섹션 형식 (코드 변경 / 삭제 파일 / 업데이트 문서 / 검증 결과 / 다음 작업 추천).
