import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import { useEssays } from '../api/queries/useEssays';
import { PROGRESS_LABEL, PROGRESS_TONE } from '../lib/enums';
import { cn } from '../lib/cn';

/**
 * /essays — 자소서 관리 목록.
 *
 * 디자인 (2026-05-10 번호 매긴 콤팩트 리스트로 개편):
 *  - 단일 .card !p-0 셸 안에 검색창 + <ol> 번호 매긴 row 리스트.
 *  - 각 row 는 두 줄(번호 + 회사명·상태 뱃지 / 직무·최종수정일) 콤팩트.
 *  - 우측 ghost 상세 버튼.
 *  - 검색: 회사명 / 직무 클라이언트 필터 (백엔드 query param 미지원).
 *
 * 백엔드 contract:
 *  - 스웨거 `EssayResponse` 에 `essayId` 누락이지만, 응답에 essayId 가 들어올 경우
 *    상세 진입을 자동 활성화하도록 opportunistic 처리. 누락 시에만 비활성 + 안내 노출.
 *  - "결과 입력" / "이어쓰기" 는 상세 페이지로 이전.
 */
export default function MyEssays() {
  const [query, setQuery] = useState('');
  const list = useEssays();

  const items = useMemo(() => list.data || [], [list.data]);
  // 백엔드가 essayId 를 응답에 실어주는지 — 한 건이라도 있으면 클릭 활성.
  const hasEssayId = items.some((e) => !!e.essayId);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((e) =>
      [e.companyName, e.wishJob]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q))
    );
  }, [items, query]);

  return null;
}
