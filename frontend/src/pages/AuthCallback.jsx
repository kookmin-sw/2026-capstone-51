import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../store/useAuth';
import { toast } from '../store/useToast';

/**
 * Google OAuth 콜백 처리.
 *  - URL ?code=... 로 들어옴 (main.jsx 에서 pathname → hash 어댑팅 후 도달).
 *  - POST /auth/login 으로 grant code 교환 → { accessToken, refreshToken, firstLogin }.
 *  - useAuth.setTokens 후 firstLogin 분기.
 *  - useRef 가드로 StrictMode 더블 마운트에서 중복 호출 방지.
 *
 * 실패 시:
 *  - 에러 토스트 + /landing 으로 replace (히스토리 stack 안 쌓이게).
 */
export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setTokens = useAuth((s) => s.setTokens);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const error = params.get('error');
    const code = params.get('code');

    if (error) {
      toast.error('Google 로그인이 취소되었습니다.');
      navigate('/landing', { replace: true });
      return;
    }
    if (!code) {
      toast.error('로그인 정보를 받지 못했습니다. 다시 시도해주세요.');
      navigate('/landing', { replace: true });
      return;
    }

    (async () => {
      try {
        const res = await api.post('/auth/login', { grantCode: code });
        const { accessToken, refreshToken, firstLogin } = res.data;
        if (!accessToken || !refreshToken) {
          throw new Error('토큰 응답이 비어있습니다.');
        }
        setTokens({ accessToken, refreshToken });
        navigate(firstLogin ? '/onboarding' : '/dashboard', { replace: true });
      } catch (e) {
        toast.error(e.apiMessage || '로그인 처리 중 오류가 발생했습니다.');
        navigate('/landing', { replace: true });
      }
    })();
  }, [params, navigate, setTokens]);

  return (
    <div className="min-h-screen grid place-items-center bg-page px-6">
      <div className="text-center">
        <div className="inline-block w-8 h-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin mb-3" />
        <div className="text-[14px] text-ink-600">로그인 처리 중...</div>
      </div>
    </div>
  );
}
