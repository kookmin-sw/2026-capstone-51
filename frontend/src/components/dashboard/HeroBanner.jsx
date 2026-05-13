import { useNavigate } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';

/**
 * 대시보드 상단 — 사용자 인사 + 우측 액션.
 * KMU 포털 톤: 흰 카드 + 좌측 navy 액센트.
 */
export default function HeroBanner({ name, hasProfile = true }) {
  const nav = useNavigate();
  return (
    <div
      className="relative bg-paper border border-border rounded-lg flex items-center justify-between gap-4 mb-4 px-6 py-5"
      style={{ borderLeft: '3px solid #122E5B' }}
    >
      <div>
        <h1 className="m-0 text-[18px] font-semibold tracking-tight text-ink-900">
          {name ? `${name}님의 취업 준비 현황` : '취업 준비 현황'}
        </h1>
        <p className="mt-1.5 text-[13px] text-ink-500 leading-snug">
          {hasProfile
            ? '경험 기록, 자소서 작성, 학업 이력을 한 곳에서 관리하세요.'
            : '먼저 내 경험을 입력하면, 동기 비교·자소서 자동완성·맞춤 공고 추천이 시작됩니다.'}
        </p>
      </div>
      <div className="flex gap-2 items-center">
        {hasProfile ? (
          <>
            <button
              onClick={() => nav('/my-experience/new')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12.5px] font-semibold bg-paper border border-ink-200 text-ink-700 hover:bg-ink-50 transition-colors"
            >
              <Plus size={13} /> 경험 추가
            </button>
            <button
              onClick={() => nav('/write')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[12.5px] font-semibold text-white border transition-colors"
              style={{ background: '#183B73', borderColor: '#183B73' }}
            >
              <Pencil size={13} /> 새 자소서 작성
            </button>
          </>
        ) : (
          <button
            onClick={() => nav('/my-experience/new')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[12.5px] font-semibold text-white border transition-colors"
            style={{ background: '#183B73', borderColor: '#183B73' }}
          >
            <Plus size={13} /> 내 경험 입력 시작
          </button>
        )}
      </div>
    </div>
  );
}
