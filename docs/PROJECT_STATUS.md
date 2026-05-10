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
