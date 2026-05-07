import { QueryClient } from '@tanstack/react-query';

/**
 * 전역 QueryClient.
 *  - staleTime 30s — 같은 데이터 짧은 시간 내 중복 fetch 방지.
 *  - 4xx 는 재시도 안 함 (인증 만료는 axios 인터셉터가 reissue 처리).
 *  - refetchOnWindowFocus 끔 — 캡스톤 시연 환경에서 의도치 않은 재호출 방지.
 *  - mutation 재시도 끔 — 사용자 명시 액션은 자동 반복 안 함.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => {
        const status = error?.response?.status;
        if (status >= 400 && status < 500) return false;
        return count < 2;
      },
    },
    mutations: {
      retry: 0,
    },
  },
});
