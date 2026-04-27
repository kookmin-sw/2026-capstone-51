import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

/**
 * 사이드바 + 메인 content 슬롯.
 *  - lg 이상: Sidebar 가 항상 노출, 메인은 그 우측.
 *  - lg 미만: 햄버거 + 풀폭 메인. Sidebar 는 drawer.
 *  - drawer 는 backdrop 클릭 / X 버튼 / 메뉴 안의 NavLink 클릭으로 닫힘 (Sidebar 내부에서 onClose 호출).
 */
export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    // Sidebar 는 fixed 라 정상 흐름에서 빠져있고, 본문은 lg 이상에서 `lg:pl-[232px]` 로 사이드바 폭만큼 들여씀.
    // → 본문이 아무리 길어져도 사이드바는 항상 viewport 전체 높이를 채워 끊겨 보이지 않음.
    <div className="min-h-screen bg-page text-ink-900">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="lg:pl-[232px] min-h-screen flex flex-col">
        {/* 모바일 전용 상단 바 — 햄버거 + 브랜드 */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-2 h-12 px-3 bg-paper border-b border-border">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="메뉴 열기"
            className="p-2 -ml-2 rounded-md text-ink-700 hover:bg-ink-100 transition-colors"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          <div className="font-bold text-ink-900 tracking-tight">Logi</div>
        </header>

        {/* pb 를 크게 잡아 페이지 하단의 Combobox 펼침 영역이 잘리지 않도록 함.
            (Combobox 의 viewport 감지 자동 펼침과 이중 안전망.) */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 pt-5 lg:pt-7 pb-24 lg:pb-32">
          <div className="max-w-[1100px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
