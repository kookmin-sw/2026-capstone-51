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
