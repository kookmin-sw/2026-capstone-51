import { NavLink } from 'react-router-dom';
import {
  Home,
  PencilLine,
  BarChart3,
  User,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { NAV, RELATED_SITES } from '../data/sidebar';
import { useCurrentUser } from '../lib/useCurrentUser';

const ICONS = { Home, PencilLine, BarChart3, User };

/**
 * 좌측 사이드바.
 * - top: true  → 단일 링크
 * - group: true → 라벨 + 자식 링크 리스트
 */
export default function Sidebar() {
  const user = useCurrentUser();
  const name = user?.userName ?? '';
  const initial = name ? name.slice(0, 1) : '·';
  const sub = user?.major ?? '';
  return (
    <aside className="flex flex-col w-[232px] shrink-0 bg-sidebar-bg text-white/80 min-h-screen">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <img
          src="/logo2.svg"
          alt="Logi 로고"
          className="w-9 h-9 object-contain shrink-0"
        />
        <div className="leading-tight">
          <div className="text-white font-bold text-[15px]">Logi</div>
          <div className="text-white/55 text-[10.5px]">Kookmin University</div>
        </div>
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
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-active text-white'
                      : 'text-white/80 hover:bg-sidebar-hover'
                  )
                }
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
                    className={({ isActive }) =>
                      cn(
                        'block px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-active text-white'
                          : 'text-white/75 hover:bg-sidebar-hover hover:text-white'
                      )
                    }
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
                className="block px-3 py-1 text-[12px] text-white/60 hover:text-white transition-colors"
              >
                · {s.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* User footer */}
      <div className="flex items-center gap-2.5 px-3.5 py-3 border-t border-white/10">
        <span className="grid place-items-center w-8 h-8 rounded-full bg-white/15 text-white text-[12px] font-bold">
          {initial}
        </span>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="text-white text-[12.5px] font-semibold truncate">
            {name || ' '}
          </div>
          <div className="text-white/55 text-[10.5px] truncate">
            {sub || ' '}
          </div>
        </div>
        <button
          title="로그아웃"
          className="grid place-items-center w-7 h-7 rounded-md text-white/65 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogOut size={14} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}
