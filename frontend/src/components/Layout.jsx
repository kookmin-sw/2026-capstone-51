import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getMe } from '../api/users';
import { setCurrentUser } from '../lib/useCurrentUser';
import { logApiError } from '../api/auth';

/**
 * 사이드바 + 메인 content 슬롯.
 * Layout이 마운트되는 시점(=로그인 후 보호 라우트 진입)에 GET /users/me 를
 * 한 번 호출해 currentUser 캐시를 갱신한다. 로그아웃→재로그인 시에도 동일하게
 * 새 사용자로 갱신되므로 사이드바/헤더 이름이 자동으로 따라온다.
 */
export default function Layout() {
  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((u) => {
        if (!cancelled) setCurrentUser(u);
      })
      .catch((err) => {
        if (!cancelled) logApiError('현재 사용자 로드 실패 (GET /users/me)', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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