import { useMemo, useState } from 'react';
import Crumbs from '../components/Crumbs';
import ErrorBoundary from '../components/ErrorBoundary';
import HeroBanner from '../components/dashboard/HeroBanner';
import Modal from '../components/Modal';
import PeersOrb from '../components/PeersOrb';
import EssayListCard from '../components/dashboard/EssayListCard';
import MyRoadmapCard from '../components/dashboard/MyRoadmapCard';
import SeniorRoadmapCard from '../components/dashboard/SeniorRoadmapCard';
import { useMe, useDashboard } from '../api/queries/useMe';
import { useExperiences } from '../api/queries/useExperiences';
import { useCertificates } from '../api/queries/useCertificates';
import {
  EXPERIENCE_CATEGORY_TO_FRONT,
  KOOKMIN_DEPT_OPTIONS,
  pickStat,
} from '../lib/enums';

/**
 * 5축 정의 — PeersOrb 의 데이터 contract 와 정합 (label/me/peers, 0-100 정규화).
 * 키는 STATS_BACK_TO_FRONT 의 결과(parttime/activity/internal/intern/cert)와 일치.
 */
const AXIS_DEFS = [
  { key: 'internal', label: '대내활동' },
  { key: 'activity', label: '대외활동' },
  { key: 'intern', label: '인턴' },
  { key: 'parttime', label: '알바' },
  { key: 'cert', label: '자격증' },
];

// 백엔드 통계 미구현 — 시연용 mock 평균. 백엔드가 statistics.*.avg 채우면 그 값이 우선.
// 선배 통계는 백엔드에 아예 없어 항상 mock.
const PEER_MOCK = { internal: 3, activity: 4, intern: 2, parttime: 5, cert: 4 };
const SENIOR_MOCK = {
  internal: 5,
  activity: 6,
  intern: 3,
  parttime: 7,
  cert: 6,
};

/**
 * 대시보드 — 카드 스택.
 *  1) 상단 통합 카드 (hasProfile=true) — HeroBanner 그라데이션 띠 + PeersOrb (좌) +
 *     EssayListCard (우) 를 한 .card 안에 합쳐 놓은 hero 영역. 자소서 작성하기 CTA 는
 *     EssayListCard 우하단에 위치.
 *  2) MyRoadmapCard (내 학기별 마일스톤 압축 타임라인)
 *  3) SeniorRoadmapCard (선배 비교 타임라인 carousel)
 *
 * !hasProfile 일 때만 HeroBanner 단독(온보딩 CTA 포함) + placeholder 안내.
 *
 * 통합 카드 안의 PeersOrb / EssayListCard 는 각각 ErrorBoundary 로 감싸 — 한 영역
 * (예: PeersOrb 의 WebGL 실패) 이 throw 해도 나머지 영역 + 사이드바는 정상 렌더.
 */
export default function Dashboard() {
  // 신규 사용자(=내 경험 비어있음) 시뮬레이션 토글은 기획상 보류, 추후 데모용 hook 자리만 유지.
  const [hasProfile] = useState(true);
  const [orbExpanded, setOrbExpanded] = useState(false);
  // 사용자 이름 — 로딩 중/실패 시 default '회원' 표시 (HeroBanner default).
  const me = useMe();
  const dash = useDashboard();
  // 본인 5축은 백엔드 /users/me/dashboard 의 myCount 가 0 으로 비어 와서 (집계 미구현/버그)
  // /experiences + /certificates 응답으로 직접 카운트. 동기 평균은 dashboard 응답 그대로.
  const exps = useExperiences();
  const certs = useCertificates();
  const userName = me.data?.userName?.trim() || undefined;

  // 5축 평균 + 비교 인원수 — GET /users/me/dashboard 응답.
  const stats = dash.data?.statistics;
  const peerCount = stats?.partTime?.userCount ?? 0;

  // PeersOrb 부제 — 본인 학과·학번 + 백엔드가 알려준 비교 인원수.
  const peersSub = useMemo(() => {
    const deptOption = KOOKMIN_DEPT_OPTIONS.find(
      (d) => d.value === me.data?.major
    );
    const dept = deptOption?.label || me.data?.major || '학과';
    const sn = me.data?.schoolNumber;
    const cohort = sn && /^\d{8}$/.test(sn) ? `${sn.slice(2, 4)}학번` : '';
    const left = [dept, cohort].filter(Boolean).join(' ');
    const countText = peerCount > 0 ? `${peerCount}명 기준` : '집계 대기';
    return `${left} · 익명 집계 · ${countText}`;
  }, [me.data?.major, me.data?.schoolNumber, peerCount]);

  const axes = useMemo(() => {
    // 본인 카운트 — /experiences 의 experienceCategory 별 + /certificates 길이.
    const myCount = {
      internal: 0,
      activity: 0,
      intern: 0,
      parttime: 0,
      cert: 0,
    };
    for (const e of exps.data || []) {
      const k = EXPERIENCE_CATEGORY_TO_FRONT[e.experienceCategory];
      if (k) myCount[k] += 1;
    }
    myCount.cert = (certs.data || []).length;

    const peerAvg = pickStat(stats, 'avg');
    // 동기 평균 — 백엔드가 0/undefined 면 mock 으로 보강. 양수면 그대로 사용.
    const peerAvgFor = (key) => peerAvg[key] || PEER_MOCK[key];
    // 선배 평균 — 백엔드 미구현이라 항상 mock. 추후 pickStat(stats, 'seniorAvg') 로 교체.
    const seniorAvgFor = (key) => SENIOR_MOCK[key];
    // 통합 max 기준 0-100 정규화 — 본인/동기/선배 중 큰 값을 100 으로.
    const max = Math.max(
      ...AXIS_DEFS.flatMap((a) => [
        myCount[a.key] || 0,
        peerAvgFor(a.key),
        seniorAvgFor(a.key),
      ])
    );
    const safeMax = max > 0 ? max : 1;
    return AXIS_DEFS.map((a) => ({
      key: a.key,
      label: a.label,
      me: Math.round(((myCount[a.key] || 0) / safeMax) * 100),
      peers: Math.round((peerAvgFor(a.key) / safeMax) * 100),
      seniors: Math.round((seniorAvgFor(a.key) / safeMax) * 100),
    }));
  }, [exps.data, certs.data, stats]);

  return (
    <>
      <Crumbs items={['대시보드']} />
      {hasProfile ? (
        <div className="grid gap-4">
          <section className="card !p-0 overflow-hidden">
            <HeroBanner embedded hasProfile name={userName} />
            {/* body 상단에 배너 톤이 옅게 번지는 그라데이션 — 위 100px 동안 #2A4DA8 8% → 0% 로 자연스럽게 사라져
                배너의 짙은 블루 → 카드 본문 흰색 사이 경계가 색감으로 이어지게. */}
            <div
              className="grid gap-4 p-4 lg:grid-cols-2 lg:items-stretch lg:gap-0 lg:p-0 lg:divide-x lg:divide-ink-150"
              style={{
                background:
                  'linear-gradient(180deg, rgba(42, 77, 168, 0.08) 0px, rgba(42, 77, 168, 0) 100px)',
              }}
            >
              <div className="lg:p-4">
                <ErrorBoundary
                  name="동기 비교"
                  fallback={<InnerError name="동기 비교" />}
                >
                  <PeersOrb
                    embedded
                    axes={axes}
                    sub={peersSub}
                    onExpand={() => setOrbExpanded(true)}
                  />
                </ErrorBoundary>
              </div>
              <div className="lg:p-4 flex flex-col">
                <ErrorBoundary
                  name="내 자소서"
                  fallback={<InnerError name="내 자소서" />}
                >
                  <EssayListCard embedded />
                </ErrorBoundary>
              </div>
            </div>
          </section>
          <ErrorBoundary name="내 로드맵">
            <MyRoadmapCard />
          </ErrorBoundary>
          <ErrorBoundary name="선배 로드맵">
            <SeniorRoadmapCard
              graduates={dash.data?.graduateUserExperiences || []}
              isLoading={dash.isLoading}
              isError={dash.isError}
              onRetry={() => dash.refetch()}
            />
          </ErrorBoundary>
        </div>
      ) : (
        <>
          <HeroBanner hasProfile={hasProfile} name={userName} />
          <div className="bg-paper border border-border rounded-lg p-10 text-center text-ink-500 text-sm">
            내 경험을 먼저 입력하면 동기 비교 · 선배 로드맵이 활성화됩니다.
          </div>
        </>
      )}
      <Modal
        open={orbExpanded}
        onClose={() => setOrbExpanded(false)}
        width={720}
      >
        <ErrorBoundary name="동기 비교">
          <PeersOrb embedded axes={axes} sub={peersSub} chartMaxWidth={620} />
        </ErrorBoundary>
      </Modal>
    </>
  );
}

/**
 * 통합 카드 내부 영역 ErrorBoundary fallback — 외곽 카드 스타일을 다시 두르지 않고
 * 빈 영역 자리표시만. 상단 통합 카드 안에서 카드-in-카드 중첩을 피하기 위함.
 */
function InnerError({ name }) {
  return (
    <div className="text-center py-8 text-[12.5px] text-ink-500">
      {name} 영역을 표시할 수 없어요.
    </div>
  );
}
