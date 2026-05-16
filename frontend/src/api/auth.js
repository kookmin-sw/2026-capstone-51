import api from './axios';

/**
 * 인증 API — 백엔드 `/auth` 엔드포인트 호출 헬퍼.
 * 백엔드는 Google grant code를 받아 자체 JWT(access/refresh)를 발급합니다.
 */

/**
 * Google 동의 화면으로 리다이렉트. 사용자가 동의하면
 * `${VITE_GOOGLE_REDIRECT_URI}?code=...` 로 돌아옵니다.
 */
export function redirectToGoogleLogin() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    alert(
      'Google OAuth 설정이 비어 있습니다. .env 의 VITE_GOOGLE_CLIENT_ID / VITE_GOOGLE_REDIRECT_URI 를 채워주세요.'
    );
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * 백엔드에 grant code + redirectUri 를 보내 access/refresh 토큰을 받아옵니다.
 * redirectUri 는 Google OAuth 요청 시 사용한 값과 동일해야 합니다 (백엔드의
 * Google token exchange 단계에서 동일성 검증).
 * 응답: { accessToken, refreshToken, firstLogin }
 */
export async function exchangeGoogleCode(grantCode, redirectUri) {
  const res = await api.post('/auth/login', { grantCode, redirectUri });
  return res.data?.data ?? res.data;
}

/**
 * axios 에러(혹은 일반 Error)를 콘솔에 자세히 출력.
 * 백엔드 ApiResponse `{ statusCode, message, data }` 형태와
 * 네트워크/요청 단계 에러를 구분해서 보여줍니다.
 */
export function logApiError(label, err) {
  // axios 에러: response가 있으면 서버 응답을 받은 케이스
  if (err?.isAxiosError || err?.response || err?.request) {
    const { response, request, config, code, message } = err;
    if (response) {
      const body = response.data ?? {};
      console.groupCollapsed(
        `[${label}] HTTP ${response.status} ${response.statusText} — ${body?.message ?? message}`
      );
      console.error('url      :', config?.baseURL ?? '', config?.url ?? '');
      console.error('method   :', config?.method?.toUpperCase());
      console.error('status   :', response.status, response.statusText);
      console.error('code     :', body?.statusCode ?? code ?? '(none)');
      console.error('message  :', body?.message ?? message);
      console.error('response :', body);
      console.error('headers  :', response.headers);
      console.error('error    :', err);
      console.groupEnd();
      return;
    }
    if (request) {
      console.groupCollapsed(
        `[${label}] 응답을 받지 못함 (네트워크/CORS/타임아웃) — ${code ?? message}`
      );
      console.error('url     :', config?.baseURL ?? '', config?.url ?? '');
      console.error('method  :', config?.method?.toUpperCase());
      console.error('code    :', code);
      console.error('message :', message);
      console.error('error   :', err);
      console.groupEnd();
      return;
    }
  }
  // 그 외(요청 구성 실패 등 일반 Error)
  console.groupCollapsed(`[${label}] ${err?.message ?? '알 수 없는 오류'}`);
  console.error('error :', err);
  console.error('stack :', err?.stack);
  console.groupEnd();
}
