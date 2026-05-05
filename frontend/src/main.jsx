import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Placeholder from './pages/Placeholder';
import Onboarding from './pages/Onboarding';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';

const queryClient = new QueryClient();

function App() {
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
    </QueryClientProvider>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
