import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

/**
 * 대시보드 최상단 배너.
 *  - hasProfile=false 이면 온보딩 유도 카피 + CTA.
 *  - hasProfile=true 이면 카피만 노출. (자소서 작성 CTA 는 같이 묶인 EssayListCard 의
 *    우하단 "자소서 작성하기" 버튼이 담당하므로 중복 제거.)
 *  - embedded=true 이면 상단 통합 카드 안에 들어가는 버전 — 외곽 border/shadow/radius/margin
 *    제거, 그라데이션 배경만 유지해서 카드 상단 띠처럼 보이게.
 */
export default function HeroBanner({
  hasProfile = true,
  name = '회원',
  embedded = false,
}) {
  return (
    <div
      className={
        embedded
          ? 'relative overflow-hidden text-white'
          : 'relative overflow-hidden rounded-2xl border border-white/5 text-white shadow-lg mb-3'
      }
      style={{
        // 사이드바(#1B306F)와 톤 통일된 솔리드 + 미세 그라데이션. 옛 mesh + blob 제거.
        background: 'linear-gradient(135deg, #1B306F 0%, #2A4DA8 100%)',
      }}
    >
      <div className="relative px-5 py-4">
        <div className="flex items-center gap-2 text-[11px] text-white/70 mb-1">
          <Sparkles size={13} strokeWidth={2} />
          <span>오늘의 Logi</span>
        </div>
        <h1 className="text-[18px] font-bold tracking-tight leading-tight">
          {hasProfile
            ? `${name}님, 오늘도 한 줄 더 써볼까요?`
            : `${name}님, 자소서 시작 준비를 도와드릴게요.`}
        </h1>
        <p className="mt-1 text-[12px] text-white/75 max-w-xl">
          {hasProfile
            ? '동기 비교와 선배 로드맵을 참고해서, 부족한 축을 채워보세요.'
            : '먼저 내 경험을 입력하면 동기 비교 · 선배 로드맵이 활성화됩니다.'}
        </p>

        {!hasProfile && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              to="/onboarding"
              className="btn-base bg-white text-sidebar-bg hover:bg-white/90"
            >
              온보딩 시작하기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
