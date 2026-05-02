import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Award } from 'lucide-react';
import { CAT_LABELS, CAT_COLORS } from '../../data/dashboard';
import { useMe } from '../../api/queries/useMe';
import { useExperiences } from '../../api/queries/useExperiences';
import { useCertificates } from '../../api/queries/useCertificates';
import { EXPERIENCE_CATEGORY_TO_FRONT } from '../../lib/enums';

/**
 * 내 학기별 마일스톤 압축 타임라인 — 본인 입력 데이터(경험·자격증) 기반.
 *
 * 데이터 소스:
 *  - useMe().schoolNumber (앞 4자리 = 입학년도) → cohortYear
 *  - useExperiences() → 카테고리별 경험 마일스톤 (startDate 의 연월로 학기 매핑)
 *  - useCertificates() → 자격증 취득 마일스톤 (getDate)
 *
 * 학기 축 정책 (옵션 F):
 *  - 입학년도부터 1-1 ~ 4-2 의 8학기 기본
 *  - 본인 데이터의 가장 늦은 학기가 9학기 이상이면 (휴학·초과학기 케이스) 자동 확장
 *  - 휴학 학기는 마일스톤 0건이라 자연스럽게 빈 학기로 표시
 *  - 학기 정의: 1학기 = 1~6월, 2학기 = 7~12월 (기존 data/dashboard.js 의 ymToSemIndex 와 동일)
 *
 * Fallback:
 *  - 학번이 8자리 숫자가 아니면 → 안내 카드 (학번 입력 유도)
 *  - 경험 + 자격증 둘 다 0건이면 → 안내 카드 (경험/자격증 추가 CTA)
 */
export default function MyRoadmapCard() {
  const me = useMe();
  const exps = useExperiences();
  const certs = useCertificates();

  const cohortYear = useMemo(() => {
    const sn = me.data?.schoolNumber;
    if (!sn || !/^\d{8}$/.test(sn)) return null;
    return Number(sn.slice(0, 4));
  }, [me.data?.schoolNumber]);

  // 경험·자격증 → 마일스톤 통일 shape: { y, m, cat, title, date, detail }
  const milestones = useMemo(() => {
    const list = [];
    (exps.data || []).forEach((e) => {
      if (!e.startDate) return;
      const [y, m] = e.startDate.split('-').map(Number);
      const cat = EXPERIENCE_CATEGORY_TO_FRONT[e.experienceCategory];
      if (!cat) return;
      list.push({
        y,
        m,
        cat,
        title: e.experienceTitle || '제목 없음',
        date: `${shortYM(e.startDate)} ~ ${shortYM(e.endDate)}`,
        detail: truncate(e.starStructure?.s, 40),
        // 카드 클릭 시 이동할 경로 — 경험은 목록 탭, 자격증은 자격증 목록 탭.
        to: '/my-experience',
      });
    });
    (certs.data || []).forEach((c) => {
      if (!c.getDate) return;
      const [y, m] = c.getDate.split('-').map(Number);
      list.push({
        y,
        m,
        cat: 'cert',
        title: c.certificateName || '자격증',
        date: `${shortDate(c.getDate)} 취득`,
        detail: c.issuingOrganization || '',
        to: '/my-certificates',
      });
    });
    return list;
  }, [exps.data, certs.data]);

  // 동적 SEMESTERS — 입학년도 + 8학기 기본, 데이터의 가장 늦은 학기까지 확장.
  const semesters = useMemo(() => {
    if (cohortYear == null) return [];
    let count = 8;
    milestones.forEach((mile) => {
      const idx = ymToSemIdx(cohortYear, mile.y, mile.m);
      if (idx + 1 > count) count = idx + 1;
    });
    return buildSemesters(cohortYear, count);
  }, [cohortYear, milestones]);

  const todaySemIndex = useMemo(() => {
    if (cohortYear == null) return null;
    const t = new Date();
    const idx = ymToSemIdx(cohortYear, t.getFullYear(), t.getMonth() + 1);
    return idx >= 0 && idx < semesters.length ? idx : null;
  }, [cohortYear, semesters.length]);

  const buckets = useMemo(() => {
    const arr = semesters.map(() => []);
    milestones.forEach((mile) => {
      const idx = ymToSemIdx(cohortYear, mile.y, mile.m);
      if (idx >= 0 && idx < arr.length) arr[idx].push(mile);
    });
    return arr;
  }, [semesters, milestones, cohortYear]);

  // ---------- Fallback states ----------
  if (me.isLoading || exps.isLoading || certs.isLoading) {
    return <SkeletonCard />;
  }
  if (cohortYear == null) {
    return (
      <NoticeCard
        title="학번이 입력되지 않았어요"
        sub="학번을 입력하면 학기별 로드맵을 그려드려요."
        ctaTo="/info"
        ctaLabel="내 정보로 이동"
      />
    );
  }
  if (milestones.length === 0) {
    return (
      <NoticeCard
        title="아직 등록된 경험·자격증이 없어요"
        sub="첫 항목을 추가하면 학기별 로드맵에 자동으로 반영됩니다."
        ctas={[
          { to: '/my-experience/new', label: '경험 추가' },
          { to: '/my-certificates/new', label: '자격증 추가' },
        ]}
      />
    );
  }

  // ---------- 정상 렌더 ----------
  return (
    <section className="card">
      <header className="flex items-end justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-ink-900">내 로드맵</h2>
          <p className="text-[12px] text-ink-500 mt-0.5">
            학기별 마일스톤
            {todaySemIndex != null && semesters[todaySemIndex] && (
              <> — {semesters[todaySemIndex].label} 학기 진행 중</>
            )}
          </p>
        </div>
        <Legend />
      </header>

      {/* Track — 좁은 화면에서는 가로 스크롤 */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div
          className="relative pt-2 pb-1"
          style={{ minWidth: `${Math.max(640, semesters.length * 80)}px` }}
        >
          <div className="absolute left-0 right-0 top-[34px] h-px bg-ink-200" />
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${semesters.length}, 1fr)` }}
          >
            {semesters.map((s, i) => {
              const isToday = i === todaySemIndex;
              const isPast = todaySemIndex != null && i < todaySemIndex;
              return (
                <div key={s.id} className="flex flex-col items-center">
                  <div
                    className={
                      'text-[11px] font-semibold mb-2 ' +
                      (isToday ? 'text-sidebar-bg' : 'text-ink-500')
                    }
                  >
                    {s.label}
                  </div>
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
