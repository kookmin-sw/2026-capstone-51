import { X } from 'lucide-react';
import { cn } from '../lib/cn';
import { useToast } from '../store/useToast';

/**
 * 토스트 알림 컨테이너. App 루트에 한 번 마운트.
 *  - useToast store 의 toasts 를 우상단 스택으로 렌더.
 *  - 모바일에서는 화면 폭에 맞춰 좌우 16px margin.
 *  - role="status" + aria-live="polite" 로 접근성 보강.
 */
export default function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);

  if (!toasts.length) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="알림"
      className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-[min(360px,calc(100vw-32px))]"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'flex items-start gap-2 px-4 py-3 rounded-lg shadow-lg border bg-paper text-[13px] leading-relaxed',
            t.tone === 'error' && 'border-red-500 text-red-600',
            t.tone === 'success' && 'border-[#1F7A4E] text-[#1F7A4E]',
            t.tone === 'info' && 'border-ink-200 text-ink-800'
          )}
        >
          <div className="flex-1 break-keep whitespace-pre-line">{t.msg}</div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="알림 닫기"
            className="-mr-1 -mt-0.5 grid place-items-center w-6 h-6 rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
}
