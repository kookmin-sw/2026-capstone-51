import { create } from 'zustand';
import { tokenStore, callLogout } from '../api/axios';

/**
 * 인증 상태 store.
 *  - 모듈 마운트 시 localStorage 기준으로 isAuthenticated 초기화.
 *  - setTokens / setUser / logout / clearSession 인터페이스 제공. 백엔드 /auth/login 은
 *    AuthCallback 페이지에서 직접 호출 (zustand 에 묶지 않음 — 단방향 흐름).
 *
 * API:
 *   isAuthenticated  — boolean
 *   user             — /users/me 응답 또는 null
 *   setTokens({ accessToken, refreshToken })  — 토큰 저장 + isAuthenticated true
 *   setUser(user)    — 유저 캐시
 *   logout()         — 클라이언트 토큰/유저 즉시 비움 + 백엔드 best-effort revoke.
 *   clearSession()   — 클라이언트 토큰/유저만 비움. 백엔드 호출 X.
 *                      회원 탈퇴 직후처럼 서버 측 세션이 이미 사라진 경우에 사용.
 *
 * 노트:
 *   - logout 은 sync 함수. 백엔드 호출은 fire-and-forget (await 안 함).
 *   - 다른 탭에서 토큰 변경 시 자동 동기화 안 됨. 필요 시 storage 이벤트 추가.
 */

export const useAuth = create((set) => ({
  user: null,
  isAuthenticated: !!tokenStore.getAccess(),

  setTokens: ({ accessToken, refreshToken } = {}) => {
    tokenStore.set({ accessToken, refreshToken });
    set({ isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    // 클라이언트 측 로그아웃은 즉시 — 진행 중인 다른 요청이 만료된 토큰으로
    // reissue 루프 빠지지 않게.
    const refreshToken = tokenStore.getRefresh();
    const accessToken = tokenStore.getAccess();
    tokenStore.clear();
    set({ user: null, isAuthenticated: false });

    // 백엔드 refresh token revoke 는 best-effort. 실패해도 무시.
    if (refreshToken && accessToken) {
      callLogout(accessToken, refreshToken).catch(() => {});
    }
  },

  clearSession: () => {
    tokenStore.clear();
    set({ user: null, isAuthenticated: false });
  },
}));
