import { useMemo, useState } from 'react';
import Combobox from './Combobox';
import { KOOKMIN_DEPT_OPTIONS, KOOKMIN_COLLEGES } from '../lib/enums';

/**
 * 단과대 → 학부학과 2단계 cascade. 각 단계는 검색 가능한 Combobox.
 *
 * Props:
 *  - value: 백엔드 직렬화 값(예: "공과대학 소프트웨어학과") 또는 '' (미선택).
 *           value 가 들어오면 단과대를 자동으로 매칭해 표시.
 *  - onChange(v): 학과 최종 선택 시 호출. allowClear 또는 단과대 변경으로 비워질 때 '' 호출.
 *  - excludeValue?: 학과 옵션에서 제외할 값 (전공/부전공 동일 방지).
 *  - allowClear?: 학과에 X 버튼 노출 (부전공 같은 옵션에서 사용).
 *  - hasError?: 에러 시 빨간 보더.
 *  - departmentPlaceholder?: 학과 콤보 placeholder 커스텀.
 *
 * 동작:
 *  - 단과대 변경 시 학과는 자동으로 비움 (cascade).
 *  - 외부 value 가 있으면 단과대 = 매칭 단과대(파생값). value 가 없을 때만 사용자
 *    interim 선택(pendingCollege)으로 단과대를 표시. → useEffect 동기화 불필요.
 */
export default function DeptCascadeSelect({
  value,
  onChange,
  excludeValue,
  allowClear = false,
  hasError = false,
  departmentPlaceholder,
}) {
  // 외부 value 에 맞는 단과대 (파생값)
  const matchedCollege = useMemo(() => {
    if (!value) return '';
    return KOOKMIN_DEPT_OPTIONS.find((d) => d.value === value)?.group ?? '';
  }, [value]);

  // 학과 미선택 상태에서 사용자가 단과대만 골라둘 수 있도록 interim state 유지
  const [pendingCollege, setPendingCollege] = useState('');
  const college = matchedCollege || pendingCollege;

  const collegeOptions = useMemo(
    () => KOOKMIN_COLLEGES.map((c) => ({ value: c, label: c })),
    []
  );

  const deptOptions = useMemo(
    () =>
      KOOKMIN_DEPT_OPTIONS.filter(
        (d) => d.group === college && d.value !== excludeValue
      ).map((d) => ({ value: d.value, label: d.label })),
    [college, excludeValue]
  );

  const onCollegeChange = (next) => {
    setPendingCollege(next);
    // 단과대가 바뀌면 기존 학과 선택은 무효
    if (value) onChange('');
  };

  return null;
}
