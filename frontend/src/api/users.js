import api from './axios';
import { STATS_BACK_TO_FRONT } from '../lib/enums';
import { PEER_AXES } from '../data/dashboard';

/**
 * 사용자 본인 프로필 갱신. 온보딩 완료 시 호출.
 * 백엔드: PUT /users/me  (ApiResponse 래핑 응답)
 */
export async function updateMyProfile(profile) {
  const res = await api.put('/users/me', profile);
  return res.data?.data ?? res.data;
}

/**
 * 현재 로그인한 사용자의 프로필 조회. 사이드바/헤더의 이름 표시에 사용.
 * 응답의 `data.userName` 등을 그대로 활용.
 */
export async function getMe() {
  const res = await api.get('/users/me');
  return res.data?.data ?? res.data;
}

/**
 * 대시보드용 집계 데이터 조회 (PeersOrb 5축, 내 로드맵, 선배 로드맵).
 *
 * 백엔드 DashboardResponse 의 `statistics` 새 schema:
 *  - 동기 평균 (flat):    statistics.{back}Avg     (예: partTimeAvg, internAvg)
 *  - 내 경험 수 (nested): statistics.user.{back}Count (예: user.partTimeCount)
 *  여기서 {back} = partTime / external / internal / license / intern.
 *
 * 어댑터:
 *  - peers 축 = statistics.{back}Avg
 *  - me 축    = statistics.user.{back}Count (없으면 userExperiences.{*}History 길이로 fallback)
 *  - 한 쪽이 전 축 0 이면 그 쪽만 PEER_AXES mock 으로 대체. peerAxesMock 플래그로
 *    Dashboard 가 경고 문구를 분기.
 *  - userExperiences.{partTime|intern|license|internal|external}History → myRoadmap[]
 *  - graduateUserExperiences[] → seniorRoadmaps[]
 */
export async function getMyDashboard() {
  const res = await api.get('/users/me/dashboard');
  const raw = res.data?.data ?? res.data;
  return adaptDashboard(raw);
}

/* ===================== 백엔드 응답 → 친구 키 어댑터 ===================== */

const AXIS_DEFS = [
  { key: 'internal', label: '대내활동' },
  { key: 'activity', label: '대외활동' },
  { key: 'intern', label: '인턴' },
  { key: 'parttime', label: '알바' },
  { key: 'cert', label: '자격증' },
];

// 백엔드 history 키 → 프론트 카테고리 키
const HISTORY_TO_CAT = {
  partTimeHistory: 'parttime',
  internHistory: 'intern',
  licenseHistory: 'cert',
  internalHistory: 'internal',
  externalHistory: 'activity',
};

function adaptDashboard(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const { peerAxes, peerAxesMock } = buildPeerAxes(
    raw.statistics,
    raw.userExperiences
  );
  return {
    ...raw,
    peerAxes,
    peerAxesMock,
    myRoadmap: buildRoadmap(raw.userExperiences),
    seniorRoadmaps: buildSeniors(raw.graduateUserExperiences),
  };
}

function buildPeerAxes(statistics, userExperiences) {
  // 새 schema 추출 — peers 는 flat (`{back}Avg`), me 는 nested (`user.{back}Count`).
  const peers = {};
  const meFromStats = {};
  if (statistics && typeof statistics === 'object') {
    for (const [back, front] of Object.entries(STATS_BACK_TO_FRONT)) {
      peers[front] = Number(statistics[`${back}Avg`]) || 0;
      meFromStats[front] =
        Number(statistics.user?.[`${back}Count`]) || 0;
    }
  }
  // me 우선순위: statistics.user.*Count 우선, 거기서 전부 0 이면 userExperiences history 길이로 fallback.
  const meHasFromStats = AXIS_DEFS.some(
    ({ key }) => Number(meFromStats[key]) > 0
  );
  const me = meHasFromStats
    ? meFromStats
    : countMyExperiences(userExperiences);

  // me / peers 를 독립적으로 평가 — 비어 있는 쪽만 mock 으로 대체.
  const meEmpty = AXIS_DEFS.every(({ key }) => !Number(me[key]));
  const peersEmpty = AXIS_DEFS.every(({ key }) => !Number(peers[key]));
  const peerAxes = AXIS_DEFS.map(({ key, label }) => {
    const mock = PEER_AXES.find((p) => p.key === key);
    return {
      key,
      label,
      me: meEmpty ? Number(mock?.me ?? 0) : Number(me[key] ?? 0),
      peers: peersEmpty ? Number(mock?.peers ?? 0) : Number(peers[key] ?? 0),
    };
  });
  return { peerAxes, peerAxesMock: { me: meEmpty, peers: peersEmpty } };
}

function countMyExperiences(userExperiences) {
  const out = { parttime: 0, activity: 0, intern: 0, internal: 0, cert: 0 };
  if (!userExperiences || typeof userExperiences !== 'object') return out;
  for (const [historyKey, cat] of Object.entries(HISTORY_TO_CAT)) {
    const list = userExperiences[historyKey];
    if (Array.isArray(list)) out[cat] = list.length;
  }
  return out;
}

function buildRoadmap(userExperiences) {
  if (!userExperiences || typeof userExperiences !== 'object') return [];
  const items = [];
  for (const [historyKey, cat] of Object.entries(HISTORY_TO_CAT)) {
    const list = userExperiences[historyKey];
    if (!Array.isArray(list)) continue;
    for (const it of list) {
      const start = parseYm(it.startDate);
      const end = parseYm(it.endDate);
      items.push({
        y: start.y,
        m: start.m,
        endY: end.y || start.y,
        endM: end.m || start.m,
        cat,
        title: it.name || '(제목 없음)',
        date: fmtRange(it.startDate, it.endDate),
        detail: '',
      });
    }
  }
  return items.sort((a, b) => a.y - b.y || a.m - b.m);
}

function buildSeniors(graduateUserExperiences) {
  if (!Array.isArray(graduateUserExperiences)) return [];
  return graduateUserExperiences
    .map((g) => ({
      userName: g.userName ?? '',
      co: '',
      year: '',
      items: buildRoadmap(g),
    }))
    .filter((s) => s.items.length > 0);
}

function parseYm(s) {
  const m = /^(\d{4})-(\d{1,2})/.exec(s ?? '');
  if (!m) return { y: 0, m: 0 };
  return { y: Number(m[1]), m: Number(m[2]) };
}

function fmtRange(start, end) {
  const fmt = (s) => {
    const m = /^(\d{4})-(\d{2})/.exec(s ?? '');
    return m ? `${m[1].slice(2)}.${m[2]}` : '';
  };
  const a = fmt(start);
  const b = fmt(end);
  if (!a && !b) return '';
  if (!b || a === b) return a;
  return `${a} ~ ${b}`;
}

/**
 * 통계 페이지 데이터 조회.
 *  - groupBy: 'STATE' | 'SCHOOL_NUM' | 'WORKER'
 *  - 응답: { my, average, max, weakPoints, topRankers }
 *  - 프론트에서 groupBy별로 캐싱하므로 재선택해도 추가 호출 없음.
 */
export async function getMyStats(groupBy) {
  const res = await api.get('/users/me/stats', { params: { groupBy } });
  return res.data?.data ?? res.data;
}
