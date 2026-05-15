import { useMemo, useState } from 'react';
import { CAT_COLORS } from '../../data/dashboard';

/**
 * 선배(졸업생) N명을 탭으로 전환하며 보는 카드.
 *
 * 데이터 소스: GET /users/me/dashboard 의 graduateUserExperiences[].
 *  shape: [{ userId, partTimeHistory[], internHistory[], licenseHistory[],
 *            internalHistory[], externalHistory[] }, ...]
 *  각 history element: { name, experienceId, startDate, endDate }
 *
 * 백엔드 응답에 졸업생 표시명 / 합격 회사 / 합격 시즌 메타가 없어
 * 탭은 "선배 1·2·3" index 라벨로 노출. 메타 필드 추가되면 같은 위치에 끼우면 됨.
 *
 * 학기 축은 졸업생의 가장 이른 startDate 부터 가장 늦은 endDate 까지 자동 확장.
 * 데이터 비어있으면 안내 카드.
 */
export default function SeniorRoadmapCard({
  graduates = [],
  isLoading = false,
  isError = false,
  onRetry,
}) {
  const [idx, setIdx] = useState(0);
  const safeIdx = idx < graduates.length ? idx : 0;
  const senior = graduates[safeIdx];

  // 카테고리 history → 마일스톤 통일 shape: { y, m, cat, title, date }
  const milestones = useMemo(() => {
    if (!senior) return [];
    const out = [];
    const push = (cat, list) => {
      (list || []).forEach((it) => {
        if (!it.startDate) return;
        const [y, m] = it.startDate.split('-').map(Number);
        out.push({
          y,
          m,
          cat,
          title: it.name || '제목 없음',
          date: `${shortYM(it.startDate)} ~ ${shortYM(it.endDate)}`,
        });
      });
    };
    push('parttime', senior.partTimeHistory);
    push('intern', senior.internHistory);
    push('cert', senior.licenseHistory);
    push('internal', senior.internalHistory);
    push('activity', senior.externalHistory);
    return out;
  }, [senior]);

  // 학기 축 — 가장 이른 (year, half) 부터 가장 늦은 까지.
  const semesters = useMemo(() => buildSemestersFrom(milestones), [milestones]);

  const buckets = useMemo(() => {
    const arr = semesters.map(() => []);
    if (!semesters.length) return arr;
    const baseY = semesters[0].y;
    const baseH = semesters[0].h;
    milestones.forEach((mile) => {
      const idx = semIndex(baseY, baseH, mile.y, mile.m);
      if (idx >= 0 && idx < arr.length) arr[idx].push(mile);
    });
    return arr;
  }, [semesters, milestones]);

  // ---------- Fallback states ----------
  if (isLoading) return <SkeletonCard />;
  if (isError) {
    return (
      <NoticeCard
        title="선배 로드맵을 불러오지 못했어요"
        sub="잠시 후 다시 시도해주세요."
        onRetry={onRetry}
      />
    );
  }
  if (graduates.length === 0) {
    return (
      <NoticeCard
        title="아직 비교할 선배 데이터가 없어요"
        sub="졸업생 데이터가 쌓이면 학기별 비교 타임라인이 나타납니다."
      />
    );
  }
  if (!senior || milestones.length === 0) {
    return (
      <section className="card">
        <header className="mb-4">
          <h2 className="text-[15px] font-bold text-ink-900 mb-2">
            선배 로드맵
          </h2>
          <SeniorTabs graduates={graduates} idx={safeIdx} setIdx={setIdx} />
        </header>
        <div className="text-center py-6 text-[12.5px] text-ink-500 break-keep">
          선택한 선배의 활동 내역이 비어있어요.
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <header className="mb-4">
        <h2 className="text-[15px] font-bold text-ink-900 mb-2">선배 로드맵</h2>
        <SeniorTabs graduates={graduates} idx={safeIdx} setIdx={setIdx} />
      </header>

      <div className="overflow-x-auto -mx-1 px-1">
        <div
          className="relative pt-2 pb-1"
          style={{ minWidth: `${Math.max(640, semesters.length * 80)}px` }}
        >
          <div className="absolute left-0 right-0 top-[34px] h-px bg-ink-200" />
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${semesters.length}, 1fr)`,
            }}
          >
            {semesters.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center">
                <div className="text-[11px] font-semibold text-ink-500 mb-2">
                  {s.label}
                </div>
                <div className="relative h-3 w-full flex justify-center items-center">
                  <span className="block w-2 h-2 rounded-full bg-ink-300" />
                </div>
                <div className="mt-3 flex flex-col items-stretch gap-1.5 w-full">
                  {buckets[i].map((m, j) => (
                    <SeniorMilestone key={j} item={m} />
                  ))}
                </div>
                <div className="text-[10px] text-ink-400 mt-2">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SeniorTabs({ graduates, idx, setIdx }) {
  return (
    <div
      className="flex items-center gap-1 -ml-1"
      role="tablist"
      aria-label="선배 선택"
    >
      {graduates.map((_, i) => {
        const active = i === idx;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setIdx(i)}
            className={
              'px-2 py-1 text-[12.5px] rounded transition-colors ' +
              (active
                ? 'font-semibold text-ink-900 underline underline-offset-[6px] decoration-2 decoration-sidebar-bg'
                : 'text-ink-500 hover:text-ink-800')
            }
          >
            선배 {i + 1}
          </button>
        );
      })}
    </div>
  );
}

function SeniorMilestone({ item }) {
  const color = CAT_COLORS[item.cat] || '#6B7280';
  return (
    <div
      className="rounded-md border border-ink-150 bg-paper px-2 py-1.5 hover:border-ink-300 transition-colors"
      title={`${item.title} · ${item.date}`}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <div className="text-[11px] font-semibold text-ink-800 truncate">
          {item.title}
        </div>
      </div>
      <div className="text-[10px] text-ink-500 truncate">{item.date}</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <section className="card animate-pulse">
      <div className="h-4 w-24 bg-ink-100 rounded mb-2" />
      <div className="h-3 w-40 bg-ink-100 rounded mb-5" />
      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-3 w-8 bg-ink-100 rounded" />
            <div className="w-3 h-3 bg-ink-100 rounded-full" />
            <div className="h-12 w-full bg-ink-100 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

function NoticeCard({ title, sub, onRetry }) {
  return (
    <section className="card text-center py-8">
      <h2 className="text-[14px] font-bold text-ink-900 mb-1">{title}</h2>
      <p className="text-[12.5px] text-ink-500 mb-4 break-keep">{sub}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-default btn-sm">
          다시 시도
        </button>
      )}
    </section>
  );
}

/* ---------- 헬퍼 ---------- */

/** y, m → (baseY, baseH) 기준 학기 인덱스. 1학기=1~6월, 2학기=7~12월. */
function semIndex(baseY, baseH, y, m) {
  const h = m <= 6 ? 1 : 2;
  return (y - baseY) * 2 + (h - baseH);
}

/** 마일스톤 배열 → 학기 축 자동 생성. baseY 가 1학년 가정으로 라벨링. */
function buildSemestersFrom(milestones) {
  if (!milestones.length) return [];
  let minY = milestones[0].y;
  let minH = milestones[0].m <= 6 ? 1 : 2;
  let maxY = minY;
  let maxH = minH;
  milestones.forEach(({ y, m }) => {
    const h = m <= 6 ? 1 : 2;
    if (y < minY || (y === minY && h < minH)) {
      minY = y;
      minH = h;
    }
    if (y > maxY || (y === maxY && h > maxH)) {
      maxY = y;
      maxH = h;
    }
  });
  const count = (maxY - minY) * 2 + (maxH - minH) + 1;
  const sems = [];
  for (let i = 0; i < count; i++) {
    const yearOffset = Math.floor((i + (minH - 1)) / 2);
    const h = ((i + (minH - 1)) % 2) + 1;
    const grade = yearOffset + 1;
    const y = minY + yearOffset;
    sems.push({
      id: `${grade}-${h}-${y}`,
      y,
      h,
      label: `${grade}-${h}`,
      sub: `'${String(y).slice(2)}-${h}`,
    });
  }
  return sems;
}

/** 'YYYY-MM-DD' → 'YY.MM' */
function shortYM(d) {
  if (!d) return '—';
  const [y, m] = d.split('-');
  return `${y.slice(2)}.${m}`;
}
