import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Toaster from './components/Toaster';
import Onboarding from './pages/Onboarding';
import Landing from './pages/Landing';
import SplashScreen from './pages/SplashScreen';
import Dashboard from './pages/Dashboard';
import Info from './pages/Info';
import MyExperience from './pages/MyExperience';
import NewExperience from './pages/NewExperience';
import ExperienceDetail from './pages/ExperienceDetail';
import MyCertificates from './pages/MyCertificates';
import NewCertificate from './pages/NewCertificate';
import CertificateDetail from './pages/CertificateDetail';
import Write from './pages/Write';
import MyEssays from './pages/MyEssays';
import EssayDetail from './pages/EssayDetail';
import Stats from './pages/Stats';

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
          <Route path="/auth/callback" element={<SplashScreen />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/write" element={<Write />} />
              <Route path="/essays" element={<MyEssays />} />
              <Route path="/essays/:id" element={<EssayDetail />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/info" element={<Info />} />
              <Route path="/my-experience" element={<MyExperience />} />
              <Route path="/my-experience/new" element={<NewExperience />} />
              <Route path="/my-experience/:id" element={<ExperienceDetail />} />
              <Route path="/my-certificates" element={<MyCertificates />} />
              <Route path="/my-certificates/new" element={<NewCertificate />} />
              <Route
                path="/my-certificates/:id"
                element={<CertificateDetail />}
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
