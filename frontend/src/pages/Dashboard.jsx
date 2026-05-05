import React, { useState } from 'react';
import Crumbs from '../components/Crumbs';
import HeroBanner from '../components/dashboard/HeroBanner';
import PeersOrb from '../components/PeersOrb';
import MyRoadmapCard from '../components/dashboard/MyRoadmapCard';
import SeniorRoadmapCard from '../components/dashboard/SeniorRoadmapCard';
import { PEER_AXES } from '../data/dashboard';

/**
 * 대시보드 — 4개 카드 세로 스택.
 *  1) HeroBanner (인사 + 주요 액션)
 *  2) PeersOrb   (5축 입체 레이더)
 *  3) MyRoadmapCard (내 학기별 마일스톤 압축 타임라인)
 *  4) SeniorRoadmapCard (선배 비교 타임라인 carousel)
 */
export default function Dashboard() {
  // 신규 사용자(=내 경험 비어있음) 시뮬레이션 토글은 기획상 보류, 추후 데모용 hook 자리만 유지.
  const [hasProfile] = useState(true);

  return (
    <>
      <Crumbs items={['대시보드']} />
      <HeroBanner hasProfile={hasProfile} />
      {hasProfile ? (
        <div className="grid gap-4">
          <PeersOrb axes={PEER_AXES} />
          <MyRoadmapCard />
          <SeniorRoadmapCard />
        </div>
      ) : (
        <div className="bg-paper border border-border rounded-lg p-10 text-center text-ink-500 text-sm">
          내 경험을 먼저 입력하면 동기 비교 · 선배 로드맵이 활성화됩니다.
        </div>
      )}
    </>
  );
}
