import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import { cn } from '../lib/cn';
import { useExperiences } from '../api/queries/useExperiences';
import {
  EXPERIENCE_CATEGORY_TO_FRONT,
  EXPERIENCE_CATEGORY_LABEL,
  EXPERIENCE_CATEGORY_OPTIONS,
} from '../lib/enums';

/**
 * /my-experience — 내 경험 목록.
 *
 * 디자인 (2026-05-10 번호 매긴 콤팩트 리스트로 개편):
 *  - 단일 .card !p-0 셸 안에 검색창 + 카테고리 필터 + <ol> 번호 매긴 row 리스트.
 *  - 각 row 는 한두 줄(번호 + 카테고리 뱃지 + 제목 + 기간/전공) 콤팩트.
 *  - STAR 미리보기/토글은 제거 (상세 페이지에서 전체 노출).
 *  - 검색·필터 모두 클라이언트 사이드 (백엔드 query param 미지원).
 *  - 검색 대상: 제목 (experienceTitle) 부분일치만.
 *  - row 클릭 → /my-experience/:id.
 */
export default function MyExperience() {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const exps = useExperiences();

  const items = useMemo(() => exps.data || [], [exps.data]);

  const byCategory = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(
      (e) => EXPERIENCE_CATEGORY_TO_FRONT[e.experienceCategory] === filter
    );
  }, [items, filter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter((e) =>
      String(e.experienceTitle || '')
        .toLowerCase()
        .includes(q)
    );
  }, [byCategory, query]);

  const isFiltered = filter !== 'all' || query.trim().length > 0;

  return (
    <>
      <Crumbs items={['MyPage', '내 경험']} />

      <header className="flex items-end justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink-900">
            내 경험
          </h1>
          <p className="text-[12.5px] text-ink-500 mt-1">
            STAR 구조로 저장한 경험은 자소서 추천에 활용됩니다.
          </p>
        </div>
        <Link to="/my-experience/new" className="btn-primary">
          <Plus size={14} strokeWidth={2.2} />
          경험 추가
        </Link>
      </header>

      <section className="card !p-0 overflow-hidden">
        {/* 검색창 */}

  return null;
}
