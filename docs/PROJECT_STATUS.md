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
