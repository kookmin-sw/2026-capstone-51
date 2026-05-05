import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 랜딩 / 로그인 페이지 — 풀-블리드 split-screen.
 * 좌(브랜드) 1.1fr / 우(로그인) 1fr.
 * 좌측 패널 hover: 마우스 따라가는 스포트라이트 + glow blob + feature stagger.
 */
function GoogleIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const leftRef = useRef(null);
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 40 });

  const handleSignIn = (firstLogin) => {
    navigate(firstLogin ? '/onboarding' : '/dashboard');
  };

  const handleMouseMove = (e) => {
    const rect = leftRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const features = [
    '경험 정보를 STAR 구조로 모아두기',
    '문항마다 가장 잘 맞는 경험을 추천',
    '학과·학번·학년 친구들과 비교 통계',
  ];

  return (
    <div className="min-h-screen w-full grid grid-cols-[1.1fr_1fr]">
      {/* Left — brand pane (full bleed) */}
      <div
        ref={leftRef}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onMouseMove={handleMouseMove}
        className="relative flex flex-col justify-between text-white overflow-hidden px-20 py-20"
        style={{
          background:
            'linear-gradient(155deg, #0E2752 0%, #183B73 55%, #2F5FBC 100%)',
          minHeight: '100vh',
        }}
      >
        {/* Spotlight overlay — 마우스 위치 추적 */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: hover ? 1 : 0,
            background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, rgba(140, 180, 255, 0.32) 0%, rgba(140, 180, 255, 0.10) 30%, transparent 60%)`,
          }}
        />

        {/* Bottom-left blob */}
        <div
          aria-hidden="true"
          className="absolute -bottom-40 -left-32 w-[420px] h-[420px] rounded-full pointer-events-none transition-all duration-700 ease-out"
          style={{
            background:
              'radial-gradient(circle, rgba(80, 130, 220, 0.35) 0%, transparent 70%)',
            transform: hover
              ? 'translate(20px, -20px) scale(1.1)'
              : 'translate(0,0) scale(1)',
            filter: 'blur(28px)',
          }}
        />

        {/* Top block — emblem + tagline */}
        <div className="relative max-w-[560px]">
          <div
            className="grid place-items-center w-14 h-14 rounded-[14px] mb-9 transition-transform duration-500"
            style={{
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.26)',
              transform: hover
                ? 'rotate(-6deg) scale(1.05)'
                : 'rotate(0) scale(1)',
              boxShadow: hover ? '0 16px 36px rgba(120,170,255,0.4)' : 'none',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 4v16M5 20h12"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="18" cy="7" r="2" fill="currentColor" />
            </svg>
          </div>
          <div
            className="text-[14px] uppercase tracking-[0.1em] font-medium mb-7"
            style={{ color: 'rgba(255,255,255,0.70)' }}
          >
            Kookmin University
          </div>
          <h1
            className="text-[88px] font-bold leading-[0.95] tracking-[-0.03em] m-0 mb-6"
            style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
          >
            Logi
          </h1>
          <p
            className="text-[19px] leading-[1.65] max-w-[460px]"
            style={{ color: 'rgba(255,255,255,0.86)' }}
          >
            내가 쌓아온 경험을 기록하고,
            <br />
            자소서 한 문항씩 함께 정리해 주는
            <br />
            국민대 학생을 위한 자소서 도우미.
          </p>
        </div>

        {/* Bottom block — feature list */}
        <ul
          className="relative list-none p-0 m-0 flex flex-col gap-4 text-[16px] max-w-[440px]"
          style={{ color: 'rgba(255,255,255,0.88)' }}
        >
          {features.map((t, i) => (
            <li
              key={t}
              className="flex items-center gap-3.5 transition-all duration-500 ease-out"
              style={{
                transform: hover ? 'translateX(10px)' : 'translateX(0)',
                transitionDelay: hover ? `${i * 80}ms` : '0ms',
                opacity: hover ? 1 : 0.85,
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 transition-all duration-500"
                style={{
                  background: hover
                    ? 'rgba(180, 210, 255, 1)'
                    : 'rgba(255,255,255,0.55)',
                  boxShadow: hover ? '0 0 16px rgba(180,210,255,0.85)' : 'none',
                  transitionDelay: hover ? `${i * 80}ms` : '0ms',
                }}
              />
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Right — login pane (full bleed) */}
      <div
        className="flex flex-col justify-center px-20 py-20 min-h-screen"
        style={{
          background: 'linear-gradient(180deg, #FBFCFE 0%, #EEF2F8 100%)',
        }}
      >
        <div className="max-w-[440px] w-full">
          <h2 className="text-[34px] font-bold text-[#1F2937] m-0 mb-4 tracking-[-0.02em] leading-[1.2]">
            로그인하고
            <br />
            시작하기
          </h2>
          <p className="text-[15px] text-[#6B7280] leading-[1.75] mb-12">
            국민대 구글 계정으로 로그인하세요.
            <br />
            처음 방문하시면 간단한 정보 입력 후 바로 시작할 수 있어요.
          </p>

          <button
            onClick={() => handleSignIn(true)}
            className="flex items-center justify-center gap-3 w-full px-6 py-[18px] bg-white border border-[#DADCE0] rounded-[14px] text-[16px] font-semibold text-[#3C4043] hover:bg-[#F8FAFE] hover:border-[#C8CDD3] hover:shadow-lg transition-all"
          >
            <GoogleIcon />
            <span>Google 계정으로 로그인</span>
          </button>

          <div className="mt-12 text-[12.5px] text-[#6B7280] leading-[1.85]">
            본 서비스는 국민대학교 소프트웨어융합대학 캡스톤디자인 51팀이
            운영합니다.
            <br />
            로그인 시{' '}
            <a href="#" className="text-[#2F5FBC] hover:underline">
              서비스 이용약관
            </a>
            과{' '}
            <a href="#" className="text-[#2F5FBC] hover:underline">
              개인정보 처리방침
            </a>
            에 동의하게 됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}
