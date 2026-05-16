import { Link } from 'react-router-dom';
import {
  EXPERIENCE_CATEGORY_TO_FRONT,
  EXPERIENCE_CATEGORY_LABEL,
  EXPERIENCE_CATEGORY_TONE,
} from '../../lib/enums';

/**
 * 문항에 사용한 경험 목록 — 자소서 열람·수정 카드에서 공용.
 * items: [{ experienceId, experienceTitle, experienceCategory }] (GET /essays/:id 의 question.relatedExperiences)
 * 카테고리 뱃지 + 제목 → `/my-experience/:experienceId` 링크.
 * 비어 있거나 null 이면 섹션 자체를 렌더하지 않음.
 */
export default function UsedExperiences({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-4 pt-3 border-t border-dashed border-ink-200">
      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-2">
        사용한 경험
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((ex) => {
          const cat = EXPERIENCE_CATEGORY_TO_FRONT[ex.experienceCategory];
          const label =
            EXPERIENCE_CATEGORY_LABEL[cat] || ex.experienceCategory || '';
          const tone = EXPERIENCE_CATEGORY_TONE[cat] || 'navy';
          return (
            <li key={ex.experienceId}>
              <Link
                to={`/my-experience/${ex.experienceId}`}
                className="inline-flex items-center gap-2 max-w-full hover:underline underline-offset-2"
              >
                {label && <span className={`badge-${tone}`}>{label}</span>}
                <span className="text-[13px] font-semibold text-ink-900 truncate">
                  {ex.experienceTitle}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
