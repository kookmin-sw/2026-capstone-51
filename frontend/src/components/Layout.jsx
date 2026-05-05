import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

/**
 * 사이드바 + 메인 content 슬롯.
 * react-router-dom v6의 <Outlet/> 으로 자식 라우트가 렌더링됩니다.
 */
export default function Layout() {
  return (
    <div className="flex min-h-screen bg-page text-ink-900">
      <Sidebar />
      <main className="flex-1 min-w-0 px-8 py-7">
        <div className="max-w-[1100px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
