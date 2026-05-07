import { create } from 'zustand';
import { tokenStore } from '../api/axios';

/**
 * 인증 상태 store.
 *  - 모듈 마운트 시 localStorage 기준으로 isAuthenticated 초기화.
 *  - 실제 backend 호출 (/auth/login, /auth/logout) 은 PR#3 (로그인 플로우) 에서
 *    이 store 위에 얹어 처리. 본 PR 은 토큰/유저 보관 인터페이스만 제공.
 *
 * API:
 *   isAuthenticated  — boolean
 *   user             — /users/me 응답 또는 null
 *   setTokens({ accessToken, refreshToken })  — 토큰 저장 + isAuthenticated true
 *   setUser(user)    — 유저 캐시
 *   logout()         — 토큰/유저 비움. backend /auth/logout 은 미호출 (PR#3 에서 추가).
 *
 * 노트:
 *   - 다른 탭에서 토큰 변경 시 동기화 안 됨. 필요해지면 storage 이벤트 리스너 추가.
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
    // TODO(PR#3): POST /auth/logout (refresh token revoke) 호출 후 토큰 비우기.
    tokenStore.clear();
    set({ user: null, isAuthenticated: false });
  },
}));
