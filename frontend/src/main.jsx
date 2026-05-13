import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import Layout from './components/Layout';
import Placeholder from './pages/Placeholder';
import Onboarding from './pages/Onboarding';
import Landing from './pages/Landing';
import SplashScreen from './pages/SplashScreen';
import Dashboard from './pages/Dashboard';
import Write from './pages/Write';
import Essays from './pages/Essays';
import EssayView from './pages/EssayView';
import EssayEdit from './pages/EssayEdit';
import Stats from './pages/Stats';

/**
 * App entry — Vite 프로젝트에서는 main.jsx 하나가 진입점.
 * preview.html(CDN 모드)에서는 동일한 코드를 Babel로 직접 실행합니다.
 */
function App() {
  return (
    <HashRouter>
      <Routes>
        {/* 최초 진입 시 랜딩 페이지 */}
        <Route index element={<Navigate to="/landing" replace />} />

        {/* 사이드바 없는 단독 화면 */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/auth/callback" element={<SplashScreen />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* 메인 앱 — 사이드바 레이아웃 */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/write" element={<Write />} />
          <Route path="/essays" element={<Essays />} />
          <Route path="/essays/:id" element={<EssayView />} />
          <Route path="/essays/:id/edit" element={<EssayEdit />} />
          <Route path="/stats" element={<Stats />} />
          <Route
            path="/info"
            element={
              <Placeholder title="내 정보" crumbs={['MyPage', '내 정보']} />
            }
          />
          <Route
            path="/my-experience"
            element={
              <Placeholder title="내 경험" crumbs={['MyPage', '내 경험']} />
            }
          />
          <Route
            path="/my-experience/new"
            element={
              <Placeholder
                title="경험 추가"
                crumbs={['MyPage', '내 경험', '추가']}
              />
            }
          />
          <Route
            path="/my-experience/:id"
            element={
              <Placeholder
                title="경험 열람"
                crumbs={['MyPage', '내 경험', '열람']}
              />
            }
          />
          <Route
            path="/my-certificates"
            element={
              <Placeholder title="내 자격증" crumbs={['MyPage', '내 자격증']} />
            }
          />
          <Route
            path="/my-certificates/new"
            element={
              <Placeholder
                title="자격증 추가"
                crumbs={['MyPage', '내 자격증', '추가']}
              />
            }
          />
          <Route
            path="/my-certificates/:id/edit"
            element={
              <Placeholder
                title="자격증 수정"
                crumbs={['MyPage', '내 자격증', '수정']}
              />
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

// Google OAuth가 redirect_uri(`/auth/callback?code=...`)로 돌려보내는 시점엔
// 해시가 비어 있어 HashRouter가 index로 빠진다. SPA 로드 직후 server-path를
// 해시 경로로 재작성해 `/auth/callback` 라우트가 받도록 한다.
if (
  window.location.pathname === '/auth/callback' &&
  window.location.hash === ''
) {
  const search = window.location.search;
  window.history.replaceState({}, '', `/#/auth/callback${search}`);
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
