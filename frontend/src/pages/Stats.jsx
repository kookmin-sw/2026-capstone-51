import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Crumbs from '../components/Crumbs';
import { cn } from '../lib/cn';
import {
  STATS_GROUP_LABEL,
  pickStat,
  weakPointLabel,
  EXPERIENCE_CATEGORY_LABEL,
} from '../lib/enums';
import { useMyStats } from '../api/queries/useMe';
import { CAT_COLORS } from '../data/dashboard';

const GROUP_KEYS = Object.keys(STATS_GROUP_LABEL);

function cycleGroup(current, direction) {
  const idx = GROUP_KEYS.indexOf(current);
  const next = (idx + direction + GROUP_KEYS.length) % GROUP_KEYS.length;
  return GROUP_KEYS[next];
}

/**
 * /stats — 통계 페이지.
 *
 * 데이터 소스: GET /users/me/stats?groupBy=  (응답: { statistics, weakPoints[] })
 *  - statistics.{partTime,external,internal,license,intern}.{avg, userCount, myCount}
 *      → pickStat 으로 프론트 5축 키(parttime/activity/internal/cert/intern) 로 매핑.
 *  - weakPoints[]: { type, recommendedItems[] } — 부족한 카테고리 + 추천 항목.
 *
 * groupBy: 'STATE' | 'SCHOOL_NUM' | 'WORKER' (lib/enums.js STATS_GROUP_LABEL)
 *
 * 디자인 (2026-05-10 통합 카드 개편):
 *  - 단일 .card !p-0 셸 안에 3개 섹션을 divider 로 분리:
 *    1. FiveAxisCompare — 좌우 chevron carousel 로 비교 그룹(STATE/SCHOOL_NUM/WORKER) 토글.
 *       상단 필터 버튼은 제거됨.
 *    2. MyDistribution — 2D 도넛(260px). 슬라이스마다 흰색 stroke (작은 슬라이스는 stroke 얇게)
 *       로 경계/외곽선. hover 시 scale(1.05) + drop-shadow 로 z 축으로 솟듯이 강조,
 *       마우스 커서 우측에 따라다니는 툴팁(라벨/건수/%). 범례는 하단 우측에 작게.
 *    3. Shortages — 부족 카테고리 + 추천 경험. 없으면 "다른 집단 비교 권고".
 */
const FIVE_AXIS = [
  { key: 'internal', label: '대내활동' },
  { key: 'activity', label: '대외활동' },
  { key: 'intern', label: '인턴' },
  { key: 'parttime', label: '아르바이트' },
  { key: 'cert', label: '자격증' },
];

export default function Stats() {
  const [groupBy, setGroupBy] = useState('STATE'); // 'STATE' | 'SCHOOL_NUM' | 'WORKER'
  const q = useMyStats(groupBy);

  return null;
}
