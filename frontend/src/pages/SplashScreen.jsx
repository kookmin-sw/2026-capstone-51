import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeGoogleCode, logApiError } from '../api/auth';

/*
 * 좌표 계산 메모
 * ─────────────────────────────────────────────────────
 * 연필 기준점(pivot): translate(140, 60)
 * 연필 회전: rotate(-35deg)
 * 촉 끝 로컬 좌표: (0, 40)
 *
 * rotate(-35) 후 촉 끝의 pivot 기준 오프셋:
 *   dx = 40 * sin(35°) ≈ +22.9
 *   dy = 40 * cos(35°) ≈ +32.8
 * → 아무 translate 없을 때 촉 끝 SVG 좌표: (140+22.9, 60+32.8) = (162.9, 92.8)
 *
 * pencilMove translate(tx, ty)를 더하면 촉 끝 = (162.9+tx, 92.8+ty)
 *
 * 각 줄 시작/끝에 촉 끝을 맞추려면:
 *   tx = line_x - 162.9,  ty = line_y - 92.8
 *
 * 1번 줄 (y=80):  시작 x=50  → tx=-112.9, ty=-12.8  /  끝 x=180 → tx=17.1, ty=-12.8
 * 2번 줄 (y=105): 시작 x=50  → tx=-112.9, ty=12.2   /  끝 x=210 → tx=47.1, ty=12.2
 * 3번 줄 (y=130): 시작 x=50  → tx=-112.9, ty=37.2   /  끝 x=160 → tx=-2.9, ty=37.2
 * ─────────────────────────────────────────────────────
 */

const animationStyles = `
  @keyframes drawLine1 {
    0%   { stroke-dashoffset: 120; opacity: 0; }
    5%   { opacity: 1; }
    20%  { stroke-dashoffset: 0; }
    75%  { stroke-dashoffset: 0; opacity: 1; }
    90%  { opacity: 0; }
    100% { stroke-dashoffset: 120; opacity: 0; }
  }
  @keyframes drawLine2 {
    0%   { stroke-dashoffset: 120; opacity: 0; }
    25%  { stroke-dashoffset: 120; opacity: 0; }
    30%  { opacity: 1; }
    45%  { stroke-dashoffset: 0; }
    75%  { stroke-dashoffset: 0; opacity: 1; }
    90%  { opacity: 0; }
    100% { stroke-dashoffset: 120; opacity: 0; }
  }
  @keyframes drawLine3 {
    0%   { stroke-dashoffset: 120; opacity: 0; }
    48%  { stroke-dashoffset: 120; opacity: 0; }
    53%  { opacity: 1; }
    68%  { stroke-dashoffset: 0; }
    75%  { stroke-dashoffset: 0; opacity: 1; }
    90%  { opacity: 0; }
    100% { stroke-dashoffset: 120; opacity: 0; }
  }

  /*
   * 연필 pivot: (50, 60)
   * rotate(-35) 후 촉 끝 오프셋: dx=+22.9, dy=+32.8
   * 촉 끝 절대좌표 (translate 없을 때): (72.9, 92.8)
   * tx = line_x - 72.9,  ty = line_y - 92.8
   *
   * 1번 줄 y=80:  시작 tx=-23, ty=-13 / 끝 tx=+157, ty=-13
   * 2번 줄 y=105: 시작 tx=-23, ty=+12 / 끝 tx=+157, ty=+12
   * 3번 줄 y=130: 시작 tx=-23, ty=+37 / 끝 tx=+157, ty=+37
   */
  @keyframes pencilMove {
    0%   { transform: translate(-23px, -13px); animation-timing-function: ease-in-out; }
    20%  { transform: translate(157px, -13px); animation-timing-function: ease-in; }
    25%  { transform: translate(-23px,  12px); animation-timing-function: ease-in-out; }
    45%  { transform: translate(157px,  12px); animation-timing-function: ease-in; }
    50%  { transform: translate(-23px,  37px); animation-timing-function: ease-in-out; }
    70%  { transform: translate(157px,  37px); animation-timing-function: ease-in; }
    75%  { transform: translate(-23px, -13px); animation-timing-function: ease-in-out; }
    100% { transform: translate(-23px, -13px); }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .line-1 {
    stroke-dasharray: 180;
    stroke-dashoffset: 180;
    animation: drawLine1 3s ease-in-out infinite;
  }
  .line-2 {
    stroke-dasharray: 180;
    stroke-dashoffset: 180;
    animation: drawLine2 3s ease-in-out infinite;
  }
  .line-3 {
    stroke-dasharray: 180;
    stroke-dashoffset: 180;
    animation: drawLine3 3s ease-in-out infinite;
  }
  .pencil-group {
    animation: pencilMove 3s ease-in-out infinite;
  }
  .fade-in-up {
    animation: fadeInUp 0.8s ease-out forwards;
  }
  .fade-in-up-delay {
    opacity: 0;
    animation: fadeInUp 0.8s ease-out 0.4s forwards;
  }
`;

export default function LogiSplashScreen() {
  const [dots, setDots] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Google redirect_uri(`/auth/callback`)로 돌아온 직후: ?code를 백엔드와 교환
  // → 최초 로그인이면 온보딩, 아니면 랜딩으로 이동.
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const errorUri = searchParams.get('error_uri');

    if (error) {
      // Google이 동의 화면에서 직접 돌려보낸 OAuth 에러(예: access_denied)
      console.groupCollapsed(
        `[Google OAuth] 동의 단계 에러 — ${error}${
          errorDescription ? `: ${errorDescription}` : ''
        }`,
      );
      console.error('error             :', error);
      console.error('error_description :', errorDescription ?? '(none)');
      console.error('error_uri         :', errorUri ?? '(none)');
      console.error(
        '전체 쿼리        :',
        Object.fromEntries(searchParams.entries()),
      );
      console.groupEnd();
      navigate('/landing', { replace: true });
      return;
    }
    if (!code) {
      console.warn(
        '[Google OAuth] code가 없는 채로 /auth/callback 진입 — 쿼리:',
        Object.fromEntries(searchParams.entries()),
      );
      navigate('/landing', { replace: true });
      return;
    }

    let cancelled = false;
    exchangeGoogleCode(code)
      .then((token) => {
        if (cancelled) return;
        if (token?.accessToken) {
          localStorage.setItem('token', token.accessToken);
        }
        if (token?.refreshToken) {
          localStorage.setItem('refreshToken', token.refreshToken);
        }
        navigate(token?.firstLogin ? '/onboarding' : '/dashboard', {
          replace: true,
        });
      })
      .catch((e) => {
        if (cancelled) return;
        logApiError('Google 로그인 교환 실패 (POST /auth/login)', e);
        navigate('/landing', { replace: true });
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  const dotsText = '.'.repeat(dots);

  return (
    <>
      <style>{animationStyles}</style>

      <div className="flex items-center justify-center w-full h-screen bg-white">
        <div className="flex flex-col items-center gap-6">
          {/* Animation Scene */}
          <div className="relative w-80 h-64">
            <svg
              viewBox="-20 -20 340 270"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 w-full h-full overflow-visible"
            >
              <filter id="shadow">
                <feDropShadow
                  dx="3"
                  dy="4"
                  stdDeviation="4"
                  floodColor="#00000018"
                />
              </filter>

              {/* Paper */}
              <rect
                x="30"
                y="20"
                width="220"
                height="170"
                rx="4"
                fill="#ffffff"
                stroke="#E5E8EF"
                strokeWidth="1.5"
                filter="url(#shadow)"
              />
              <rect
                x="246"
                y="24"
                width="4"
                height="162"
                rx="2"
                fill="#EDF0F4"
              />
              <line
                x1="30"
                y1="20"
                x2="30"
                y2="190"
                stroke="#CBD5E1"
                strokeWidth="1"
              />

              {/* Ruled lines (background) */}
              <line
                x1="50"
                y1="80"
                x2="230"
                y2="80"
                stroke="#F3F5F9"
                strokeWidth="1"
              />
              <line
                x1="50"
                y1="105"
                x2="230"
                y2="105"
                stroke="#F3F5F9"
                strokeWidth="1"
              />
              <line
                x1="50"
                y1="130"
                x2="230"
                y2="130"
                stroke="#F3F5F9"
                strokeWidth="1"
              />

              {/* Writing lines (animated) — 회색 선과 동일한 너비 x1=50, x2=230 */}
              <line
                className="line-1"
                x1="50"
                y1="80"
                x2="230"
                y2="80"
                stroke="#2A3441"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <line
                className="line-2"
                x1="50"
                y1="105"
                x2="230"
                y2="105"
                stroke="#2A3441"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <line
                className="line-3"
                x1="50"
                y1="130"
                x2="230"
                y2="130"
                stroke="#2A3441"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* Pencil — pivot: (50, 60), rotate(-35deg), 촉 끝 로컬(0,40) */}
              <g
                className="pencil-group"
                style={{ transformOrigin: '50px 60px' }}
              >
                <g transform="translate(50, 60) rotate(-35)">
                  {/* 촉 끝 (로컬 y=40) */}
                  <polygon points="0,40 -5,26 5,26" fill="#d4a97a" />
                  <polygon points="0,40 -2,33 2,33" fill="#2A3441" />
                  {/* 나무 부분 */}
                  <rect x="-5" y="18" width="10" height="8" fill="#e8c99a" />
                  {/* 몸통 */}
                  <rect x="-5" y="-34" width="10" height="52" fill="#f5c842" />
                  <line
                    x1="-5"
                    y1="-34"
                    x2="-5"
                    y2="18"
                    stroke="#e0b830"
                    strokeWidth="0.8"
                  />
                  <line
                    x1="5"
                    y1="-34"
                    x2="5"
                    y2="18"
                    stroke="#e0b830"
                    strokeWidth="0.8"
                  />
                  {/* 금속 고리 (ferrule) */}
                  <rect x="-5.5" y="-42" width="11" height="8" fill="#b0b0b0" />
                  <line
                    x1="-5.5"
                    y1="-39"
                    x2="5.5"
                    y2="-39"
                    stroke="#909090"
                    strokeWidth="0.8"
                  />
                  <line
                    x1="-5.5"
                    y1="-36"
                    x2="5.5"
                    y2="-36"
                    stroke="#909090"
                    strokeWidth="0.8"
                  />
                  {/* 지우개 */}
                  <rect
                    x="-5"
                    y="-52"
                    width="10"
                    height="10"
                    rx="1.5"
                    fill="#f48080"
                  />
                  {/* 하이라이트 */}
                  <line
                    x1="-2"
                    y1="-32"
                    x2="-2"
                    y2="17"
                    stroke="#ffe97a"
                    strokeWidth="1.5"
                    opacity="0.5"
                  />
                </g>
              </g>
            </svg>
          </div>

          {/* Logo */}
          <div className="fade-in-up flex justify-center">
            <span className="text-5xl font-bold text-primary-500">Log</span>
            <span
              className="text-5xl font-bold text-primary-500"
              style={{ paddingRight: '0.3em' }}
            >
              I
            </span>
          </div>

          {/* Loading text — 검정색, 가운데 정렬 */}
          <div className="fade-in-up-delay flex items-baseline justify-center">
            <span className="text-lg font-sans text-ink-900">
              잠시만 기다려주세요
            </span>
            <span
              className="text-lg font-sans text-ink-900"
              style={{ minWidth: '1.5rem' }}
            >
              {dotsText}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
