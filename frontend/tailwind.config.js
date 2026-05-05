/** @type {import('tailwindcss').Config} */
// Logi — Kookmin University 자소서 플랫폼
// 기존 design system의 색 팔레트를 Tailwind에 그대로 등록한 형태.
// preview.html(CDN Tailwind)와 실제 Vite 프로젝트가 동일한 클래스명을 갖도록
// 이 객체는 preview.html에서 인라인으로도 그대로 주입됩니다.
export const theme = {
  extend: {
    colors: {
      // KMU 포털 톤
      primary: {
        50:  '#EEF4FF',
        500: '#4978CF',
        600: '#2F5FBC',
        800: '#234B8C',
        900: '#183B73',
      },
      // 사이드바 전용
      sidebar: {
        bg:     '#2B3A66',
        active: 'rgba(255,255,255,0.12)',
        hover:  'rgba(255,255,255,0.07)',
        divider:'rgba(255,255,255,0.12)',
      },
      // legacy alias로 navy-*, ink-*, green-* 도 그대로 노출
      navy: {
        50:  '#EEF4FF',
        500: '#4978CF',
        600: '#2F5FBC',
        700: '#234B8C',
        800: '#183B73',
        900: '#122E5B',
      },
      ink: {
        50:  '#F7F8FA',
        100: '#F3F5F9',
        150: '#EDF0F4',
        200: '#E5E8EF',
        300: '#CBD5E1',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#54607A',
        700: '#3F4A5B',
        800: '#2A3441',
        900: '#1F2937',
      },
      // 단일 accent — 기존 green-* alias는 primary 톤으로 통일됨
      green: {
        50:  '#EEF4FF',
        400: '#4978CF',
        500: '#2F5FBC',
        600: '#234B8C',
        700: '#183B73',
      },
      // 카테고리 (잡지 톤)
      cat: {
        study:    '#4A6FA5',
        activity: '#C97B3F',
        intern:   '#4A8C6F',
        project:  '#7A5AA3',
      },
      // 상태
      red: {
        50:  '#FEE2E2',
        500: '#EF4444',
        600: '#DC2626',
      },
      amber: {
        50:  '#FFF7E8',
        500: '#F59E0B',
        700: '#B45309',
      },
      teal: {
        50:  '#CCFBF1',
        600: '#0D9488',
      },
      success: { bg: '#ECFDF3', text: '#15803D' },
      paper:   '#FFFFFF',
      page:    '#F6F7FB',
      border:  '#E5E8EF',
    },
    fontFamily: {
      sans: [
        'Pretendard', '-apple-system', 'BlinkMacSystemFont',
        'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'sans-serif'
      ],
      mono: [
        'JetBrains Mono', 'SF Mono', 'ui-monospace', 'monospace'
      ],
    },
    borderRadius: {
      sm: '6px',
      md: '8px',
      lg: '12px',
      xl: '14px',
    },
    boxShadow: {
      sm:  '0 1px 2px rgba(15, 23, 42, 0.03)',
      md:  '0 2px 6px rgba(15, 23, 42, 0.06)',
      lg:  '0 8px 24px rgba(15, 23, 42, 0.08)',
      xl:  '0 24px 60px rgba(15, 23, 42, 0.16)',
    },
  },
};

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme,
  plugins: [],
};
