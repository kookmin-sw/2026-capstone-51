import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, ArrowLeft, ChevronRight } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import { Card } from '../components/Card';
import Button from '../components/Button';
import { ESSAYS, RECOMMENDED } from '../data/essays';

/* ------------------------------------------------------------------ *
 * 자소서 열람.
 *  - 상단 상태/문항/마지막수정 strip 제거.
 *  - 회사명 / 희망 직무 / 공통 요구사항 섹션이 상단에 표시됨.
 *  - 우측 상단: 수정하기 → /essays/:id/edit
 * ------------------------------------------------------------------ */

export default function EssayView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const essay = ESSAYS.find((e) => String(e.id) === String(id)) || ESSAYS[0];

  return (
    <>
      <Crumbs items={['자소서', '관리', essay.co]} />
      <div className="page-h flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h1>{essay.co}</h1>
          <div className="sub">{essay.job}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/essays')}>
            <ArrowLeft size={13} /> 목록으로
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate(`/essays/${essay.id}/edit`)}
          >
            <Pencil size={13} /> 수정하기
          </Button>
        </div>
      </div>

      {/* 상단 — 회사 / 직무 / 공통 요구사항 */}
      <Card className="mb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-3">
          지원 정보
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="회사명" value={essay.co} />
          <Field label="희망 직무" value={essay.job} />
        </div>
        <div className="mt-3">
          <Field label="공통 요구사항" value={essay.requirements} multiline />
        </div>
      </Card>

      {/* 문항들 */}
      {(essay.questions || []).length === 0 ? (
        <Card className="text-center text-[13px] text-ink-500 py-12">
          아직 등록된 문항이 없습니다.
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {essay.questions.map((q, i) => (
            <Card key={q.id}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-6 h-6 rounded-full bg-primary-900 text-white grid place-items-center text-[11px] font-bold">
                  Q{i + 1}
                </span>
                <span className="text-[11px] text-ink-500 font-semibold">
                  {q.limit}자 이내
                </span>
              </div>
              <div className="text-[14.5px] font-bold text-ink-900 leading-relaxed mb-3">
                {q.title}
              </div>
              {q.draft ? (
                <div className="text-[13.5px] leading-[1.75] text-ink-800 whitespace-pre-wrap break-keep">
                  {q.draft}
                </div>
              ) : (
                <div className="text-[12.5px] text-ink-400 italic">
                  아직 작성되지 않았습니다.
                </div>
              )}
              {q.draft && (
                <div className="text-right text-[11.5px] text-ink-500 font-mono mt-3">
                  {q.draft.length} / {q.limit}
                </div>
              )}
              <UsedExperiences ids={q.used} navigate={navigate} />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function Field({ label, value, multiline }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-ink-500 mb-1">{label}</div>
      <div
        className={`text-[13.5px] text-ink-800 ${multiline ? 'leading-relaxed whitespace-pre-wrap' : 'font-medium'}`}
      >
        {value || <span className="text-ink-400 italic">미입력</span>}
      </div>
    </div>
  );
}

/* 질문 카드 하단 — 사용한 경험. 클릭 시 해당 경험 열람으로 이동. */
function UsedExperiences({ ids = [], navigate }) {
  if (!ids.length) return null;
  const used = ids
    .map((id) => RECOMMENDED.find((r) => r.id === id))
    .filter(Boolean);
  if (!used.length) return null;
  return (
    <div className="mt-4 pt-3 border-t border-dashed border-ink-200">
      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-2">
        사용한 경험
      </div>
      <div className="flex flex-wrap gap-2">
        {used.map((r) => (
          <button
            key={r.id}
            disabled={!r.expId}
            onClick={() => r.expId && navigate(`/my-experience/${r.expId}`)}
            className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-ink-200 bg-paper text-[12px] text-ink-800 transition-colors
              ${r.expId ? 'hover:border-primary-700 hover:bg-primary-50 cursor-pointer' : 'opacity-70 cursor-default'}`}
          >
            <span className="font-semibold">{r.title.split(' — ')[0]}</span>
            <span className="text-ink-400 text-[11px]">· {r.cat}</span>
            {r.expId && (
              <ChevronRight
                size={11}
                className="text-ink-400 group-hover:text-primary-700"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
