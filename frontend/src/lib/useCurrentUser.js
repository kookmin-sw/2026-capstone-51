import { useEffect, useState } from 'react';

/**
 * 현재 로그인한 사용자 정보를 localStorage + 커스텀 이벤트로 공유.
 * - `setCurrentUser(user)` 로 캐시 갱신 후 이벤트 dispatch → 모든 구독자 재렌더.
 * - 컴포넌트는 `useCurrentUser()` 로 캐시값 구독. 로그아웃 후 재로그인해도
 *   Layout이 마운트되며 다시 fetch → 캐시가 새 사용자로 교체된다.
 */
const STORAGE_KEY = 'currentUser';
const EVENT = 'currentUser:updated';

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function useCurrentUser() {
  const [user, setUser] = useState(readCache);
  useEffect(() => {
    const onUpdate = () => setUser(readCache());
    window.addEventListener(EVENT, onUpdate);
    return () => window.removeEventListener(EVENT, onUpdate);
  }, []);
  return user;
}
