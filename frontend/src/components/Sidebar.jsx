import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  PencilLine,
  BarChart3,
  User,
  ChevronDown,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { NAV, RELATED_SITES, CURRENT_USER } from '../data/sidebar';
import { useAuth } from '../store/useAuth';

const ICONS = { Home, PencilLine, BarChart3, User };

/**
 * 좌측 사이드바.
 *  - lg 이상: 항상 노출되는 가로 232px 칼럼.
 *  - lg 미만: 화면 밖에서 슬라이드 인하는 drawer. open prop 으로 토글, onClose 로 닫힘.
 *
 * NAV 데이터:
 *  - top: true  → 단일 링크
 *  - group: true → 라벨 + 자식 링크 리스트
 */
export default function Sidebar({ open = false, onClose }) {
  const navigate = useNavigate();
  const logout = useAuth((s) => s.logout);

  // TODO(PR#3): useAuth.logout 안에서 POST /auth/logout 호출까지 추가.
  // 지금은 클라이언트 토큰만 비우고 랜딩으로 이동.
  const handleLogout = () => {
    logout();
    onClose?.();
    navigate('/landing');
  };

  // 네비게이션 링크 공통 className. isActive 시 좌측 4px 인디케이터 + 더 진한 배경 + 굵은 글씨.
  const topLinkClass = ({ isActive }) =>
    cn(
      'relative flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors',
      isActive
        ? 'bg-white/[0.16] text-white font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-white'
        : 'font-medium text-white/80 hover:bg-sidebar-hover'
    );

  const childLinkClass = ({ isActive }) =>
    cn(
      'relative block px-3 py-1.5 rounded-md text-[12.5px] transition-colors',
      isActive
        ? 'bg-white/[0.16] text-white font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-white'
        : 'font-medium text-white/75 hover:bg-sidebar-hover hover:text-white'
    );

  return (
    <>
      {/* Backdrop — 모바일 drawer 모드에서 사이드바 열릴 때만 노출 */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'flex flex-col w-[232px] shrink-0 bg-sidebar-bg text-white/80',
          // lg 이상: 정적 칼럼.
          'lg:static lg:translate-x-0 lg:min-h-screen',
          // lg 미만: drawer (fixed, 화면 밖에서 슬라이드).
          'fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="주 메뉴"
      >
        {/* Brand + 모바일 닫기 버튼 */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <span className="grid place-items-center w-8 h-8 rounded-md bg-white/10 text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 4v16M5 20h12"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="18" cy="7" r="2" fill="currentColor" />
            </svg>
          </span>
          <div className="leading-tight flex-1 min-w-0">
            <div className="text-white font-bold text-[15px]">Logi</div>
            <div className="text-white/55 text-[10.5px]">
              Kookmin University
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="메뉴 닫기"
            className="lg:hidden grid place-items-center w-8 h-8 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3.5 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            if (item.top) {
              const Icon = ICONS[item.icon];
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={topLinkClass}
                  end={item.path === '/dashboard'}
                  onClick={onClose}
                >
                  {Icon && <Icon size={17} strokeWidth={1.8} />}
                  <span>{item.label}</span>
                </NavLink>
              );
            }
            // Group
            const Icon = ICONS[item.icon];
            return (
              <div key={item.id} className="pt-2">
                <div className="flex items-center gap-2.5 px-3 py-1.5 text-white/55 text-[11.5px] font-semibold tracking-wide uppercase">
                  {Icon && <Icon size={14} strokeWidth={1.8} />}
                  <span>{item.label}</span>
                </div>
                <div className="space-y-0.5 ml-3 mt-0.5">
                  {item.children.map((c) => (
                    <NavLink
                      key={c.id}
                      to={c.path}
                      className={childLinkClass}
                      onClick={onClose}
                    >
                      {c.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Related sites */}
          <div className="mt-6 pt-3 border-t border-white/10">
            <div className="flex items-center gap-1 px-3 py-1.5 text-white/55 text-[11.5px] font-semibold uppercase tracking-wide">
              <span>관련 사이트</span>
              <ChevronDown size={11} />
            </div>
            <div className="space-y-0.5">
              {RELATED_SITES.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-1 text-[12px] text-white/60 hover:text-white transition-colors"
                >
                  · {s.label}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* Dev preview links — 라우트 밖 페이지 미리보기 (DEV 빌드에서만 노출) */}
        {import.meta.env.DEV && (
          <div className="px-3.5 py-2 border-t border-white/10 text-[10.5px]">
            <div className="text-white/40 mb-1 uppercase tracking-wider">
              미리보기
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              <NavLink
                to="/landing"
                onClick={onClose}
                className="text-white/60 hover:text-white"
              >
                랜딩
              </NavLink>
              <NavLink
                to="/onboarding"
                onClick={onClose}
                className="text-white/60 hover:text-white"
              >
                온보딩
              </NavLink>
            </div>
          </div>
        )}

        {/* User footer */}
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-t border-white/10">
          <span className="grid place-items-center w-8 h-8 rounded-full bg-white/15 text-white text-[12px] font-bold">
            {CURRENT_USER.initial}
          </span>
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-white text-[12.5px] font-semibold truncate">
              {CURRENT_USER.name}
            </div>
            <div className="text-white/55 text-[10.5px] truncate">
              {CURRENT_USER.sub}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="로그아웃"
            aria-label="로그아웃"
            className="grid place-items-center w-7 h-7 rounded-md text-white/65 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={14} strokeWidth={1.8} />
          </button>
        </div>
      </aside>
    </>
  );
}
