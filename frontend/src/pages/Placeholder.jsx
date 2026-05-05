import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Crumbs from '../components/Crumbs';

/**
 * Placeholder 페이지. 라우트 동작 확인용 — 점진적으로 실제 페이지로 교체됩니다.
 */
export default function Placeholder({ title, crumbs = [] }) {
  return (
    <>
      <Crumbs items={crumbs.length ? crumbs : [title]} />
      <div className="page-h">
        <h1>{title}</h1>
        <div className="sub">이 페이지는 점진적으로 옮기는 중입니다.</div>
      </div>
      <div className="card mt-4 text-[13px] text-ink-500 leading-relaxed">
        <div className="font-semibold text-ink-700 mb-2">
          아직 작업 중인 페이지입니다.
        </div>
        <p>
          원본{' '}
          <code className="font-mono text-[12px] bg-ink-100 px-1.5 py-0.5 rounded">
            app.html
          </code>
          의 해당 페이지가 아직 분리되지 않았습니다.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 mt-3 text-primary-700 font-semibold"
        >
          대시보드로 돌아가기 <ChevronRight size={13} />
        </Link>
      </div>
    </>
  );
}
