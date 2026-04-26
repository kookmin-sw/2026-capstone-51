import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// 포트 3000 고정 — 백엔드 OAuth redirect_uri 가 http://localhost:3000/auth/callback 으로 등록되어 있음.
// 다른 포트로 띄우면 구글 로그인 콜백이 실패함. strictPort: true 라 충돌 시 다른 포트로 fallback 안 함.
// IPv4 localhost 로 명시 — 기본 ::1 (IPv6) 만 바인딩되면 일부 환경에서 ERR_CONNECTION_REFUSED.
//
// Dev 시 백엔드 프록시:
//   브라우저 → http://localhost:3000/api/* → Vite proxy → https://<API_TARGET>/api/*
//   - 인증서 CN 이 logi.p-e.kr 전용이라 IP 직접 호출 시 ERR_CERT_COMMON_NAME_INVALID 발생.
//     proxy 의 secure:false 로 dev 단계에서 cert 검증을 끔 (프로덕션 브라우저 호출 아니라 dev 노드 → 백엔드 호출이라 안전).
//   - 같은 origin(localhost:3000)으로 호출하므로 CORS 도 무관.
//   - 프론트 코드의 axios baseURL 은 `/api` 한 줄이면 됨.
//   - VITE_API_PROXY_TARGET 으로 IP 또는 도메인 지정. 미설정 시 IP 직접 사용 (도메인 logi.p-e.kr 은 DNS 갱신 후 사용).
const API_TARGET =
  process.env.VITE_API_PROXY_TARGET || 'https://3.238.28.206';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: '127.0.0.1',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
