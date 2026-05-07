import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Google OAuth 는 redirect_uri 에 fragment(#) 를 허용하지 않아 pathname 으로 돌아옴.
// HashRouter 는 pathname 을 안 보므로 React 마운트 전에 hash 로 옮겨 라우팅이 잡히게 함.
// 예: /auth/callback?code=XXX  →  /#/auth/callback?code=XXX
if (
  typeof window !== 'undefined' &&
  window.location.pathname === '/auth/callback'
) {
  const search = window.location.search;
  window.history.replaceState(null, '', '/#/auth/callback' + search);
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
