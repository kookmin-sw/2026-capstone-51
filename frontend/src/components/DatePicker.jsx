import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X as XIcon,
} from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * 커스텀 날짜 선택기 (캘린더 popover) — day / month / year 3 view drill-down.
 *
 * 기본 흐름 (react-datepicker / MUI 표준 패턴):
 *  - 'day' view 에서 헤더 (예: "2026년 05월") 클릭 → 'month' view (해당 연도의 12개월)
 *  - 'month' view 에서 헤더 (예: "2026년") 클릭 → 'year' view (12년 페이지)
 *  - 'year' view 에서 연도 클릭 → 'month' view 로 복귀 (그 연도)
 *  - 'month' view 에서 월 클릭 → 'day' view 로 복귀 (그 연·월)
 *  - 'day' view 에서 날짜 클릭 → 선택 + 닫힘
 *
 * Props:
 *  - value: 'YYYY-MM-DD' 또는 '' (없음)
 *  - onChange(v): 날짜 선택 시 'YYYY-MM-DD' 호출, allowClear 시 '' 호출
 *  - placeholder?: 미선택 시 트리거 텍스트
 *  - hasError?, disabled?, allowClear?
 *  - min?, max?: 선택 가능 범위 ('YYYY-MM-DD'). 범위 밖은 disabled — 모든 view 에 적용.
 *  - forceDirection?: 'down' | 'up'  — 강제 펼침 방향. 미지정 시 viewport 잔여 공간 기반 자동.
 *
 * 동작:
 *  - 트리거 클릭 → 'day' view 로 캘린더 열림. 외부 클릭 / Esc 로 닫힘.
 *  - 백엔드는 'YYYY-MM-DD' 받음 (HTML5 date input 과 호환). 화면 표시는 'YYYY.MM.DD'.
 */
export default function DatePicker({
  value,
  onChange,
  placeholder = '날짜 선택',
  hasError = false,
  disabled = false,
  allowClear = false,
  min,
  max,
  forceDirection,
}) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState('down');
  const [mode, setMode] = useState('day'); // 'day' | 'month' | 'year'
  const containerRef = useRef(null);

  // 캘린더가 보고 있는 월·연 (사용자가 화살표로 이동, 외부 value 와 별개).
  const initialView = useMemo(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      if (Number.isFinite(y) && Number.isFinite(m)) {
        return { year: y, month: m - 1 };
      }
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  }, [value]);

  const [view, setView] = useState(initialView);

  return null;
}
