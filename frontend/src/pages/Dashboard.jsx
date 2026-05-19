import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Users, ChevronRight } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import HeroBanner from '../components/dashboard/HeroBanner';
import PeersOrb from '../components/PeersOrb';
import RoadmapCard from '../components/dashboard/RoadmapCard';
import CategoryLegend from '../components/dashboard/CategoryLegend';
import { getMyDashboard } from '../api/users';
import { logApiError } from '../api/auth';
import { useMe } from '../api/queries/useMe';
import { kookminDeptLabel } from '../lib/enums';

/**
 * 대시보드 — API(/users/me/dashboard)로 받은 데이터를 렌더.
 *  - PeersOrb         : data.peerAxes
 *  - 내 로드맵         : data.myRoadmap     (없으면 등록 유도 카드)
 *  - 선배 로드맵       : data.seniorRoadmaps (없으면 안내 카드)
 */
export default function Dashboard() {
  const { data: user } = useMe();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seniorIdx, setSeniorIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getMyDashboard()
      .then((d) => {
        if (!cancelled) setData(d ?? {});
      })
      .catch((err) => {
        if (cancelled) return;
        logApiError('대시보드 로드 실패 (GET /users/me/dashboard)', err);
        setData({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <>
        <Crumbs items={['대시보드']} />
        <div className="bg-paper border border-border rounded-lg p-16 text-center text-ink-500 text-sm">
          불러오는 중…
        </div>
      </>
    );
  }

  // 어댑터(adaptDashboard)가 5축을 항상 채워서 내려준다 — me/peers 중 비어 있는 쪽만
  // 내부적으로 PEER_AXES 로 대체. 어느 쪽이 mock 인지 peerAxesMock 으로 받아 경고 문구를 분기.
  const peerAxes = data?.peerAxes ?? [];
  const peerAxesMock = data?.peerAxesMock ?? { me: false, peers: false };
  const peerWarning =
    peerAxesMock.me && peerAxesMock.peers
      ? '아직 데이터가 없어 표시되는 그래프는 예시예요. 경험을 등록하면 실제 그래프가 보입니다.'
      : peerAxesMock.me
        ? '아직 등록한 경험이 없어 내 데이터는 예시로 표시돼요. 경험을 등록해 보세요.'
        : peerAxesMock.peers
          ? '아직 동기 데이터가 부족해 평균은 예시로 표시돼요.'
          : undefined;

  const myRoadmap = data?.myRoadmap ?? [];
  const seniorList = data?.seniorRoadmaps ?? [];
  const senior = seniorList[seniorIdx];

  // 내 로드맵 연도 범위
  //  - 시작: min(학번 입학년도, 모든 경험 종료일자 중 가장 빠른 것)
  //  - 끝  : max(모든 경험 종료일자 중 가장 최근)
  // 마커가 종료 시점에 찍히므로 범위도 종료일자 기준.
  const myRange = computeRange(
    myRoadmap,
    parseEnrollmentYear(user?.schoolNumber)
  );
  const seniorRange = senior ? computeRange(senior.items, null) : null;

  return (
    <>
      <Crumbs items={['대시보드']} />
      <HeroBanner name={user?.userName} hasProfile={true} />
      <DashboardToc />
      <div className="grid gap-4">
        <div id="section-peers" className="scroll-mt-4 min-w-0">
          <PeersOrb
            axes={peerAxes}
            sub={user?.major ? `${kookminDeptLabel(user.major)} · 익명 집계` : '익명 집계'}
            warning={peerWarning}
          />
        </div>

        <div id="section-my-roadmap" className="scroll-mt-4 min-w-0">
          {myRoadmap.length > 0 ? (
            <RoadmapCard
              title="나의 학창시절 로드맵"
              items={myRoadmap}
              showNowMarker
              rangeStart={myRange?.start}
              rangeEnd={myRange?.end}
            />
          ) : (
            <EmptyRoadmapCard
              title="나의 학창시절 로드맵"
              icon={FolderOpen}
              message="아직 등록한 경험이 없어서 로드맵을 표시할 수 없어요."
              cta="경험을 등록하러 가볼까요?"
            />
          )}
        </div>

        <div id="section-senior-roadmap" className="scroll-mt-4 min-w-0">
          {senior && (senior.items?.length ?? 0) > 0 ? (
            <RoadmapCard
              title="취업 선배의 로드맵 비교"
              carousel={{
                list: seniorList,
                idx: seniorIdx,
                onChange: setSeniorIdx,
              }}
              items={senior.items}
              rangeStart={seniorRange?.start}
              rangeEnd={seniorRange?.end}
              seniorName={
                senior.userName ? `취업선배 ${senior.userName}` : undefined
              }
            />
          ) : (
            <EmptyRoadmapCard
              title="취업 선배의 로드맵 비교"
              icon={Users}
              message="아직 데이터가 없어서 로드맵을 표시할 수 없어요."
            />
          )}
        </div>
      </div>
    </>
  );
}

/**
 * 학번(예: 20223059) 앞 4자리 → 입학년도(2022). 형식이 아니면 null.
 */
function parseEnrollmentYear(schoolNumber) {
  const s = String(schoolNumber ?? '').trim();
  if (!/^\d{4}/.test(s)) return null;
  const y = Number(s.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

/**
 * 로드맵 표시용 연도 범위.
 *   start.y = min(enrollmentYear, 모든 item.endY 중 최소)
 *   end.y   = max(모든 item.endY)            (학번은 끝 연도에 영향 X)
 * items 가 없으면 null — Roadmap 의 기본 범위(2022~2026) 사용.
 */
function computeRange(items, enrollmentYear) {
  const ends = (items ?? [])
    .map((it) => Number(it.endY))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (ends.length === 0) return null;
  const minEnd = Math.min(...ends);
  const maxEnd = Math.max(...ends);
  const startY = Math.min(enrollmentYear ?? Infinity, minEnd);
  return {
    start: { y: startY, m: 1 },
    end: { y: maxEnd, m: 12 },
  };
}

/**
 * 대시보드 상단 목차 — HeroBanner 와 본문 사이에 위치.
 * 같은 페이지 내 anchor 로 부드럽게 스크롤. 라우팅은 발생하지 않음.
 */
function DashboardToc() {
  const items = [
    { id: 'section-peers', label: '내 동기들은 뭐하고 있을까?' },
    { id: 'section-my-roadmap', label: '나의 학창시절 로드맵' },
    { id: 'section-senior-roadmap', label: '취업 선배의 로드맵 비교' },
  ];
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <section className="bg-paper border border-border rounded-lg p-4 mb-4 min-w-0">
      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-2">
        목차
      </div>
      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {items.map((it, i) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => scrollTo(it.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-transparent hover:bg-ink-50 hover:border-ink-150 transition-colors text-left"
            >
              <span className="text-[11px] font-bold text-primary-700 tabular-nums shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[13px] font-semibold text-ink-900 truncate flex-1">
                {it.label}
              </span>
              <ChevronRight size={14} className="text-ink-400 shrink-0" />
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * 로드맵 데이터가 없을 때 보여주는 빈 상태 카드.
 * RoadmapCard 와 톤(헤더 + 옅은 내부 박스)을 맞춰서 시각적으로 같은 자리에 있도록.
 */
function EmptyRoadmapCard({ title, icon: Icon, message, cta }) {
  const nav = useNavigate();
  return (
    <section className="bg-paper border border-border rounded-lg p-5 mb-4 min-w-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="m-0 text-[15px] font-semibold text-ink-900">{title}</h2>
        <CategoryLegend />
      </div>
      <div
        className="rounded-md flex flex-col items-center justify-center text-center py-16 px-6"
        style={{ background: '#fafbfc', border: '1px solid #E5E9EF' }}
      >
        {Icon && (
          <div
            className="grid place-items-center w-12 h-12 rounded-full mb-3"
            style={{ background: '#EEF2F8', color: '#5C6B83' }}
          >
            <Icon size={22} strokeWidth={1.6} />
          </div>
        )}
        <p className="text-[13.5px] text-ink-500 leading-relaxed m-0">
          {message}
        </p>
        {cta && (
          <button
            onClick={() => nav('/my-experience/new')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12.5px] font-semibold text-white transition-colors"
            style={{ background: '#183B73', borderColor: '#183B73' }}
          >
            <Plus size={13} /> {cta}
          </button>
        )}
      </div>
    </section>
  );
}
