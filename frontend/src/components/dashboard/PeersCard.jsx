현import React from 'react';
import { Users } from 'lucide-react';
import { PEER_AXES } from '../../data/dashboard';

function radarPoints(values, cx, cy, r) {
  const n = values.length;
  return values.map((v, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const rr = r * (v / 100);
    return [cx + rr * Math.cos(angle), cy + rr * Math.sin(angle)];
  });
}

/**
 * 5축 레이더: 대내활동 / 대외활동 / 인턴 / 알바 / 자격증.
 * me (브랜드 블루) vs peers 평균 (회색 점선) 비교.
 */
export default function PeersCard() {
  const cx = 260,
    cy = 220,
    r = 150;
  const me = radarPoints(
    PEER_AXES.map((a) => a.me),
    cx,
    cy,
    r
  );
  const peers = radarPoints(
    PEER_AXES.map((a) => a.peers),
    cx,
    cy,
    r
  );
  const mePath =
    me.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ') + 'Z';
  const peersPath =
    peers.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ') +
    'Z';

  return (
    <section className="bg-paper border border-border rounded-lg p-5 mb-4">
      <div className="mb-3">
        <h2 className="m-0 text-[15px] font-semibold text-ink-900 flex items-center gap-1.5">
          <Users size={16} /> 내 동기들은 뭐하고 있을까?
        </h2>
        <div className="mt-1 text-xs text-ink-500">
          소프트웨어학부 22학번 · 익명 집계 · 214명 기준
        </div>
      </div>

      <div
        className="rounded-md flex justify-center"
        style={{
          background: '#F8FAFC',
          border: '1px solid #E5E9EF',
          padding: '20px 12px 16px',
        }}
      >
        <div className="w-full" style={{ maxWidth: 560 }}>
          <svg viewBox="0 0 520 440" width="100%" className="block">
            {[0.25, 0.5, 0.75, 1].map((s, i) => {
              const pts = PEER_AXES.map((_, idx) => {
                const angle =
                  -Math.PI / 2 + (idx * 2 * Math.PI) / PEER_AXES.length;
                return [
                  cx + r * s * Math.cos(angle),
                  cy + r * s * Math.sin(angle),
                ];
              });
              return (
                <polygon
                  key={i}
                  points={pts.map((p) => p.join(',')).join(' ')}
                  fill="none"
                  stroke="#D7DEE8"
                  strokeWidth="1"
                />
              );
            })}
            {PEER_AXES.map((a, idx) => {
              const angle =
                -Math.PI / 2 + (idx * 2 * Math.PI) / PEER_AXES.length;
              return (
                <line
                  key={idx}
                  x1={cx}
                  y1={cy}
                  x2={cx + r * Math.cos(angle)}
                  y2={cy + r * Math.sin(angle)}
                  stroke="#D7DEE8"
                  strokeWidth="1"
                />
              );
            })}
            <path
              d={peersPath}
              fill="rgba(156,163,175,0.14)"
              stroke="#9CA3AF"
              strokeWidth="1.4"
              strokeDasharray="4,3"
            />
            <path
              d={mePath}
              fill="rgba(47, 95, 188, 0.16)"
              stroke="#2F5FBC"
              strokeWidth="1.8"
            />
            {me.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#2F5FBC" />
            ))}
            {PEER_AXES.map((a, idx) => {
              const angle =
                -Math.PI / 2 + (idx * 2 * Math.PI) / PEER_AXES.length;
              const lx = cx + (r + 26) * Math.cos(angle);
              const ly = cy + (r + 26) * Math.sin(angle);
              return (
                <text
                  key={idx}
                  x={lx}
                  y={ly}
                  fontSize="13"
                  fontWeight="500"
                  fill="#1F2937"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {a.label}
                </text>
              );
            })}
          </svg>
          <div className="flex gap-5 justify-center mt-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
              <span
                className="rounded-sm"
                style={{ width: 11, height: 11, background: '#2F5FBC' }}
              />{' '}
              나
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
              <span
                className="rounded-sm"
                style={{
                  width: 11,
                  height: 11,
                  background: '#9CA3AF',
                  opacity: 0.6,
                }}
              />{' '}
              동기 평균
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
