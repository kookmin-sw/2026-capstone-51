import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/useAuth';

/**
 * 인증 가드. useAuth.isAuthenticated 가 false 면 /landing 으로 replace.
 *
 * 라우트에서:
 *   <Route element={<ProtectedRoute />}>
 *     <Route element={<Layout />}>
 *       <Route path="..." ... />
 *     </Route>
 *   </Route>
 *
 * isAuthenticated 는 zustand 구독으로 변동 감지 — 진행 중인 API 호출이
 * reissue 실패 (axios 가 세션 만료 알림) 로 인해 false 로 바뀌면 자동으로
 * /landing 으로 보내짐.
 */
export default function ProtectedRoute() {
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }
  return <Outlet />;
}
