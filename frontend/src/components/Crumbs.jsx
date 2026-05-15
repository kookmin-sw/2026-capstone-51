import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * 페이지 상단 breadcrumb. 마지막 항목은 현재 페이지로 간주해 강조 + 클릭 불가.
 * items: string[] | { label, to? }[]
 *  - to 가 있으면 클릭 시 해당 라우트로 이동 (react-router Link).
 *  - to 가 없으면 단순 텍스트 (예: 라우트 없는 그룹 헤더 "MyPage" / "자소서").
 *  - 마지막 항목은 to 가 있어도 무시 — 현재 페이지를 다시 누르는 건 의미 없음.
 */
export default function Crumbs({ items = [] }) {
  const norm = items.map((it) => (typeof it === 'string' ? { label: it } : it));
  const lastIdx = norm.length - 1;
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-ink-500 mb-3">
      {norm.map((it, i) => {
        const isLast = i === lastIdx;
        const clickable = !isLast && it.to;
        return (
          <Fragment key={i}>
            {i > 0 && (
              <ChevronRight
                size={12}
                strokeWidth={2}
                className="text-ink-300"
              />
            )}
            {clickable ? (
              <Link
                to={it.to}
                className="hover:text-ink-900 hover:underline underline-offset-2 transition-colors"
              >
                {it.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-ink-700 font-semibold' : ''}>
                {it.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
