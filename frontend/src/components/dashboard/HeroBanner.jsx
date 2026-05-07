import { Link } from 'react-router-dom';
import { PencilLine, Sparkles } from 'lucide-react';

/**
 * 대시보드 최상단 배너.
 *  - hasProfile=false 이면 온보딩 유도 카피.
 *  - hasProfile=true 이면 자소서 작성/내 경험 추가로 바로 진입하는 CTA.
 */
export default function HeroBanner({ hasProfile = true, name = '회원' }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 text-white shadow-md mb-4">
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute -right-8 bottom-0 w-40 h-40 rounded-full bg-white/5 blur-xl" />
      <div className="relative px-6 py-7">
        <div className="flex items-center gap-2 text-[12px] text-white/70 mb-2">
          <Sparkles size={14} strokeWidth={2} />
          <span>오늘의 Logi</span>
        </div>
        <h1 className="text-[22px] font-bold tracking-tight leading-tight">
          {hasProfile
            ? `${name}님, 오늘도 한 줄 더 써볼까요?`
            : `${name}님, 자소서 시작 준비를 도와드릴게요.`}
        </h1>
        <p className="mt-2 text-[13px] text-white/75 max-w-xl">
          {hasProfile
            ? '동기 비교와 선배 로드맵을 참고해서, 부족한 축을 채워보세요.'
            : '먼저 내 경험을 입력하면 동기 비교 · 선배 로드맵이 활성화됩니다.'}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {hasProfile ? (
            <>
              <Link
                to="/write"
                className="btn-base bg-white text-primary-900 hover:bg-white/90"
              >
                <PencilLine size={14} strokeWidth={2.2} />
                자소서 작성
              </Link>
              <Link
                to="/my-experience/new"
                className="btn-base bg-white/10 border border-white/20 text-white hover:bg-white/15"
              >
                경험 추가
              </Link>
            </>
          ) : (
            <Link
              to="/onboarding"
              className="btn-base bg-white text-primary-900 hover:bg-white/90"
            >
              온보딩 시작하기
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
