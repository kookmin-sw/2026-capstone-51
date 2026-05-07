import { create } from 'zustand';

/**
 * 토스트 알림 store.
 *  - useToast() 훅으로 toasts/dismiss 구독.
 *  - 컴포넌트 외부에서는 toast.info / toast.success / toast.error 헬퍼 사용
 *    (예: axios 인터셉터에서 자동 토스트 발사).
 *
 * 톤:
 *   info / success / error
 * 옵션:
 *   durationMs (기본 4000, 0 이면 수동 dismiss 만)
 */

let _id = 0;

export const useToast = create((set) => ({
  toasts: [],
  push: (msg, opts = {}) => {
    if (!msg) return;
    const id = ++_id;
    const tone = opts.tone || 'info';
    const durationMs = opts.durationMs ?? 4000;
    set((s) => ({ toasts: [...s.toasts, { id, msg, tone, durationMs }] }));
    if (durationMs > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, durationMs);
    }
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// 컴포넌트 밖에서 부르는 헬퍼.
export const toast = {
  info: (msg, opts) => useToast.getState().push(msg, { ...opts, tone: 'info' }),
  success: (msg, opts) =>
    useToast.getState().push(msg, { ...opts, tone: 'success' }),
  error: (msg, opts) =>
    useToast.getState().push(msg, { ...opts, tone: 'error' }),
};
