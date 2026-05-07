import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import Layout from './components/Layout';
import Toaster from './components/Toaster';
import Placeholder from './pages/Placeholder';
import Onboarding from './pages/Onboarding';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';

/**
 * 라우팅 + 글로벌 프로바이더.
 *  - QueryClientProvider 로 react-query 활성화.
 *  - Toaster 는 라우터 밖에 마운트해 어떤 페이지에서 호출해도 보이게.
 *  - main.jsx 와 분리되어 있어 react-refresh 정상 동작.
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/write"
              element={
                <Placeholder
                  title="자소서 작성"
                  crumbs={['자소서', '작성하기']}
                />
              }
            />
            <Route
              path="/essays"
              element={
                <Placeholder title="자소서 관리" crumbs={['자소서', '관리']} />
              }
            />
            <Route
              path="/essays/:id"
              element={
                <Placeholder
                  title="자소서 열람"
                  crumbs={['자소서', '관리', '열람']}
                />
              }
            />
            <Route
              path="/stats"
              element={<Placeholder title="통계" crumbs={['통계']} />}
            />
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
                <Placeholder
                  title="내 자격증"
                  crumbs={['MyPage', '내 자격증']}
                />
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
      <Toaster />
    </QueryClientProvider>
  );
}
