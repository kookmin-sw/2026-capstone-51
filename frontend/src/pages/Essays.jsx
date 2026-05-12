import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { ESSAYS } from '../data/essays';

/* ------------------------------------------------------------------ *
 * 자소서 관리.
 *  - 행 전체 클릭 시 자소서 열람으로 이동
 *  - 액션 컬럼은 "결과 입력" 으로 통일 (작성 중 / 제출 완료 모두 적용)
 *    · 작성 중: "결과 입력" 버튼 (제출됨으로 전환 + 결과 선택)
 *    · 제출 완료: 현재 결과 뱃지 + 결과 변경 드롭다운
 * ------------------------------------------------------------------ */

const RESULT_LABELS = {
  pending: '결과 대기',
  pass: '서류 합격',
  fail: '서류 탈락',
};
const RESULT_TONES = {
  pending: 'gray',
  pass: 'green',
  fail: 'red',
};

export default function Essays() {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');
  const [list, setList] = React.useState(ESSAYS);
  const [openId, setOpenId] = React.useState(null); // 결과 입력 드롭다운

  const setResult = (id, result) => {
    setList((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: 'submitted', result, dday: '제출 완료' }
          : e
      )
    );
    setOpenId(null);
  };

  const filtered = list.filter((e) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (e.co + ' ' + e.job).toLowerCase().includes(q);
  });

  return (
    <>
      <Crumbs items={['자소서', '관리']} />
      <div className="page-h flex items-start justify-between gap-4 mb-4">
        <div>
          <h1>자소서 관리</h1>
          <div className="sub">
            작성한 모든 자소서를 한 곳에서 관리하고 결과를 기록하세요.
          </div>
        </div>
        <Button variant="primary" onClick={() => navigate('/write')}>
          <Plus size={13} /> 새 자소서 쓰기
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-[12px] text-ink-500">
          전체 <b className="text-ink-800 font-bold">{list.length}</b>건
        </div>
        <div className="flex items-center gap-2 bg-paper border border-ink-200 rounded-md px-3 py-1.5 min-w-[260px]">
          <Search size={13} className="text-ink-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="기업명 · 직무로 검색"
            className="bg-transparent outline-none text-[13px] flex-1 placeholder:text-ink-400"
          />
        </div>
      </div>

      {/* 표 */}
      <section className="bg-paper border border-ink-200 rounded-md overflow-visible">
        <div
          className="grid items-center px-5 py-2.5 bg-ink-50 border-b border-ink-200 text-[11.5px] font-semibold text-ink-500 tracking-wide"
          style={{ gridTemplateColumns: '1fr 130px 110px 200px' }}
        >
          <div>기업 · 직무</div>
          <div>마감 / 상태</div>
          <div>마지막 수정</div>
          <div className="text-right">액션</div>
        </div>
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-ink-500">
            조건에 맞는 자소서가 없습니다.
          </div>
        ) : (
          filtered.map((e, i) => (
            <Row
              key={e.id}
              e={e}
              isLast={i === filtered.length - 1}
              open={openId === e.id}
              onOpen={() => setOpenId(openId === e.id ? null : e.id)}
              onClickRow={() => navigate(`/essays/${e.id}`)}
              onSetResult={(r) => setResult(e.id, r)}
            />
          ))
        )}
      </section>
    </>
  );
}

function Row({ e, isLast, open, onOpen, onClickRow, onSetResult }) {
  const submitted = e.status === 'submitted';
  return (
    <div
      onClick={onClickRow}
      className={`grid items-center px-5 py-3.5 cursor-pointer hover:bg-ink-50/60 transition-colors
        ${isLast ? '' : 'border-b border-ink-150'}`}
      style={{ gridTemplateColumns: '1fr 130px 110px 200px' }}
    >
      {/* 기업 · 직무 */}
      <div className="min-w-0 pr-3">
        <div className="text-[14px] font-bold text-ink-900 truncate">
          {e.co}
        </div>
        <div className="text-[12px] text-ink-500 truncate mt-0.5">{e.job}</div>
      </div>

      {/* 마감/상태 */}
      <div className="text-[12px]">
        {submitted ? (
          <span className="text-ink-500">제출 완료</span>
        ) : (
          <>
            <div className="font-bold text-ink-800">{e.dday}</div>
            <div className="text-[11px] text-ink-500 mt-0.5">
              {e.prog}/{e.total} 문항
            </div>
          </>
        )}
      </div>

      {/* 마지막 수정 */}
      <div className="text-[12px] text-ink-600">{e.updated}</div>

      {/* 액션 — 결과 입력으로 통일 */}
      <div
        className="flex justify-end relative"
        onClick={(ev) => ev.stopPropagation()}
      >
        {submitted ? (
          <div className="flex items-center gap-2">
            <Badge tone={RESULT_TONES[e.result]}>
              {RESULT_LABELS[e.result]}
            </Badge>
            <Button size="sm" onClick={onOpen}>
              결과 변경 ▾
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="primary" onClick={onOpen}>
            결과 입력 ▾
          </Button>
        )}

        {open && (
          <div className="absolute right-0 top-full mt-1 z-30 bg-paper border border-ink-200 rounded-md shadow-lg w-44 py-1">
            {['pass', 'fail', 'pending'].map((r) => (
              <button
                key={r}
                onClick={() => onSetResult(r)}
                className="w-full text-left px-3 py-1.5 text-[12.5px] hover:bg-ink-50 flex items-center gap-2"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    r === 'pass'
                      ? 'bg-[#1F7A4E]'
                      : r === 'fail'
                        ? 'bg-red-500'
                        : 'bg-ink-400'
                  }`}
                />
                {RESULT_LABELS[r]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
