import { Link } from 'react-router-dom';
import {
  SEMESTERS,
  TODAY_SEM_INDEX,
  MY_ROADMAP,
  CAT_LABELS,
  CAT_COLORS,
  ymToSemIndex,
} from '../../data/dashboard';

/**
 * 내 학기별 마일스톤 압축 타임라인.
 *  - 가로축: 학기(1-1 ~ 4-2), TODAY 하이라이트.
 *  - 마일스톤 점은 카테고리 색상으로 학기 위치에 배치.
 *  - 너무 많은 마일스톤이 한 학기에 몰리면 세로 stack.
 */
export default function MyRoadmapCard() {
  // 학기별로 mile 그룹화
  const buckets = SEMESTERS.map(() => []);
  MY_ROADMAP.forEach((it) => {
    const idx = ymToSemIndex(it.y, it.m);
    buckets[idx].push(it);
  });

  return (
    <section className="card">
      <header className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-ink-900">내 로드맵</h2>
          <p className="text-[12px] text-ink-500 mt-0.5">
            학기별 마일스톤 — 4-1 학기 진행 중
          </p>
        </div>
        <Legend />
      </header>

      {/* Track */}
      <div className="relative pt-2 pb-1">
        {/* 가로 baseline */}
        <div className="absolute left-0 right-0 top-[34px] h-px bg-ink-200" />

        <div className="grid grid-cols-8 gap-1">
          {SEMESTERS.map((s, i) => {
            const isToday = i === TODAY_SEM_INDEX;
            const isPast = i < TODAY_SEM_INDEX;
            return (
              <div key={s.id} className="flex flex-col items-center">
                {/* 학기 라벨 */}
                <div
                  className={
                    'text-[11px] font-semibold mb-2 ' +
                    (isToday ? 'text-primary-800' : 'text-ink-500')
                  }
                >
                  {s.label}
                </div>

                {/* 점 위치 (baseline) */}
                <div className="relative h-3 w-full flex justify-center">
                  <span
                    className={
                      'block w-2.5 h-2.5 rounded-full border-2 ' +
                      (isToday
                        ? 'bg-primary-600 border-primary-200'
                        : isPast
                          ? 'bg-ink-300 border-paper'
                          : 'bg-paper border-ink-300')
                    }
                  />
                </div>

                {/* 마일스톤 stack */}
                <div className="mt-3 flex flex-col items-stretch gap-1.5 w-full">
                  {buckets[i].map((m, j) => (
                    <Milestone key={j} item={m} />
                  ))}
                  {buckets[i].length === 0 && (
                    <div className="h-1" aria-hidden />
                  )}
                </div>

                {/* 보조 라벨 */}
                <div className="text-[10px] text-ink-400 mt-2">{s.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Link to="/my-experience" className="btn-default btn-sm">
          내 경험 전체 보기
        </Link>
      </div>
    </section>
  );
}

function Milestone({ item }) {
  const color = CAT_COLORS[item.cat] || '#6B7280';
  return (
    <div
      className="rounded-md border border-ink-150 bg-paper px-2 py-1.5"
      style={{ borderLeft: `3px solid ${color}` }}
      title={`${item.title} · ${item.date}`}
    >
      <div className="text-[11px] font-semibold text-ink-800 truncate">
        {item.title}
      </div>
      <div className="text-[10px] text-ink-500 truncate">{item.detail}</div>
    </div>
  );
}

function Legend() {
  const cats = Object.keys(CAT_LABELS);
  return (
    <ul className="hidden sm:flex items-center gap-3">
      {cats.map((c) => (
        <li
          key={c}
          className="flex items-center gap-1.5 text-[11px] text-ink-600"
        >
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: CAT_COLORS[c] }}
          />
          {CAT_LABELS[c]}
        </li>
      ))}
    </ul>
  );
}
