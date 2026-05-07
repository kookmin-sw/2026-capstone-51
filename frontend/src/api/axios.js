import axios from 'axios';
import { toast } from '../store/useToast';

/**
 * 백엔드 API 클라이언트.
 *
 * 응답 정책:
 *  - 성공 응답은 ApiResponse<T> = { statusCode, message, data } 래퍼.
 *    인터셉터에서 자동으로 response.data = body.data 로 unwrap → 호출부는
 *    `api.get(...).then(r => r.data)` 만 하면 됨.
 *  - 에러 응답도 같은 래퍼. `error.apiMessage` 에 백엔드 한국어 메시지를 노출.
 *
 * 인증 정책:
 *  - access/refresh 모두 localStorage. 토큰 키는 tokenStore 통해 접근.
 *    XSS 위험은 인지하고 있고 캡스톤 데모 범위에서 허용. 추후 필요 시
 *    refresh 만 httpOnly 쿠키로 옮기는 옵션 검토.
 *  - 401/403 발생 시 한 번만 /auth/reissue 시도. 동시에 여러 요청이 401
 *    터지면 큐잉했다가 새 토큰으로 일괄 재실행.
 *  - reissue 실패 → 토큰 비우고 에러 반환. 라우팅 처리는 호출부 / Guard.
 */

const baseURL = import.meta.env.VITE_API_URL;

const TOKEN_KEYS = { access: 'accessToken', refresh: 'refreshToken' };

export const tokenStore = {
  getAccess: () => localStorage.getItem(TOKEN_KEYS.access),
  getRefresh: () => localStorage.getItem(TOKEN_KEYS.refresh),
  set: ({ accessToken, refreshToken } = {}) => {
    if (accessToken) localStorage.setItem(TOKEN_KEYS.access, accessToken);
    if (refreshToken) localStorage.setItem(TOKEN_KEYS.refresh, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEYS.access);
    localStorage.removeItem(TOKEN_KEYS.refresh);
  },
};

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// 요청 — Authorization 헤더 자동 부착.
api.interceptors.request.use((config) => {
  const t = tokenStore.getAccess();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

/* === Refresh queue ===
 * 한 번에 여러 요청이 401 을 받으면 reissue 한 번만 호출하고 나머지는 큐.
 */
let isRefreshing = false;
let refreshQueue = [];

const flushQueue = (newAccess, error) => {
  refreshQueue.forEach(({ resolve, reject, config }) => {
    if (error) reject(error);
    else {
      config.headers.Authorization = `Bearer ${newAccess}`;
      resolve(api(config));
    }
  });
  refreshQueue = [];
};

const reissueOnce = async () => {
  // /auth/reissue 는 access 토큰 없이 호출 (인터셉터 우회용 별도 axios 인스턴스).
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) throw new Error('no refresh token');
  const res = await axios.post(
    `${baseURL}/auth/reissue`,
    { refreshToken },
    { withCredentials: true }
  );
  const body = res.data;
  const data = body && 'data' in body ? body.data : body;
  if (!data?.accessToken) throw new Error('reissue: no accessToken');
  tokenStore.set({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  return data.accessToken;
};

// 응답 인터셉터.
api.interceptors.response.use(
  (response) => {
    // ApiResponse<T> 자동 unwrap.
    const body = response.data;
    if (body && typeof body === 'object' && 'data' in body) {
      response.data = body.data;
    }
    return response;
  },
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const apiBody = error.response?.data;
    if (apiBody && typeof apiBody === 'object' && 'message' in apiBody) {
      error.apiMessage = apiBody.message || null;
    }

    // /auth/* 자체 호출 실패는 재시도 안 함.
    const isAuthEndpoint = original?.url?.includes('/auth/');

    if (
      (status === 401 || status === 403) &&
      original &&
      !original._retry &&
      !isAuthEndpoint
    ) {
      original._retry = true;

      if (isRefreshing) {
        // 진행 중인 reissue 끝나면 그 토큰으로 재실행.
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject, config: original });
        });
      }

      if (!tokenStore.getRefresh()) {
        tokenStore.clear();
        return Promise.reject(error);
      }

      isRefreshing = true;
      try {
        const newAccess = await reissueOnce();
        flushQueue(newAccess, null);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (e) {
        flushQueue(null, e);
        tokenStore.clear();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    // 자동 토스트 — 네트워크/서버 에러만. 4xx 는 페이지에서 처리.
    if (!error.response) {
      toast.error('네트워크 연결을 확인해주세요.');
    } else if (status >= 500) {
      toast.error(
        error.apiMessage ||
          '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      );
    }

    return Promise.reject(error);
  }
);

export default api;
