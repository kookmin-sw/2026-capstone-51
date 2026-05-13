import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Users } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import HeroBanner from '../components/dashboard/HeroBanner';
import PeersOrb from '../components/PeersOrb';
import RoadmapCard from '../components/dashboard/RoadmapCard';
import CategoryLegend from '../components/dashboard/CategoryLegend';
import { getMyDashboard } from '../api/users';
import { logApiError } from '../api/auth';
import { useCurrentUser } from '../lib/useCurrentUser';
import { PEER_AXES } from '../data/dashboard';

/**
 * 대시보드 — API(/users/me/dashboard)로 받은 데이터를 렌더.
 *  - PeersOrb         : data.peerAxes
 *  - 내 로드맵         : data.myRoadmap     (없으면 등록 유도 카드)
 *  - 선배 로드맵       : data.seniorRoadmaps (없으면 안내 카드)
 */
export default function Dashboard() {
  const user = useCurrentUser();
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

  // API 응답이 빈 배열/누락이면 PeersOrb가 입력 데이터 없이 렌더링되며
  // three.js 내부에서 터지기 때문에, 그래프가 어색하지 않도록 임시 데이터로
  // fallback 하고 그래프 하단에 빨간 경고 문구를 노출한다.
  const peerAxesFromApi = data?.peerAxes ?? [];
  const hasPeerData = peerAxesFromApi.length > 0;
  const peerAxes = hasPeerData ? peerAxesFromApi : PEER_AXES;

  const myRoadmap = data?.myRoadmap ?? [];
  const seniorList = data?.seniorRoadmaps ?? [];
  const senior = seniorList[seniorIdx];

  return (
    <>
      <Crumbs items={['대시보드']} />
      <HeroBanner name={user?.userName} hasProfile={true} />
      <div className="grid gap-4">
        <PeersOrb
          axes={peerAxes}
          sub={
            user?.major
              ? `${user.major} · 익명 집계`
              : '익명 집계'
          }
          warning={
            hasPeerData
              ? undefined
              : '현재 사용자가 등록한 경험이 없어서 등록 후 실제 그래프를 볼 수 있어요.'
          }
        />

        {myRoadmap.length > 0 ? (
          <RoadmapCard
            title="나의 학창시절 로드맵"
            items={myRoadmap}
            showNowMarker
          />
        ) : (
          <EmptyRoadmapCard
            title="나의 학창시절 로드맵"
            icon={FolderOpen}
            message="아직 등록한 경험이 없어서 로드맵을 표시할 수 없어요."
            cta="경험을 등록하러 가볼까요?"
          />
        )}

        {senior && (senior.items?.length ?? 0) > 0 ? (
          <RoadmapCard
            title="취업 선배의 로드맵 비교"
            carousel={{
              list: seniorList,
              idx: seniorIdx,
              onChange: setSeniorIdx,
            }}
            items={senior.items}
          />
        ) : (
          <EmptyRoadmapCard
            title="취업 선배의 로드맵 비교"
            icon={Users}
            message="아직 데이터가 없어서 로드맵을 표시할 수 없어요."
          />
        )}
      </div>
    </>
  );
}

/**
 * 로드맵 데이터가 없을 때 보여주는 빈 상태 카드.
 * RoadmapCard 와 톤(헤더 + 옅은 내부 박스)을 맞춰서 시각적으로 같은 자리에 있도록.
 */
function EmptyRoadmapCard({ title, icon: Icon, message, cta }) {
  const nav = useNavigate();
  return (
    <section className="bg-paper border border-border rounded-lg p-5 mb-4">
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