import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Pencil,
  Plus,
  Sparkles,
  ArrowLeft,
  Check,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import Crumbs from '../components/Crumbs';
import { Card } from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { ESSAYS, RECOMMENDED, mockGenerateDraft } from '../data/essays';

/* ------------------------------------------------------------------ *
 * 자소서 수정.
 *  - 열람과 동일한 형태. 단 우측 상단의 [수정하기] 버튼이 각 카드/섹션마다 있음.
 *  - 클릭 시 해당 영역만 편집 모드. 아래에 [적용하기] 버튼이 등장.
 *  - 각 질문 카드 아래에서 응답 재생성 가능 (Sparkles 버튼 → 요구사항 인풋 → 다시 생성).
 *  - 맨 아래 [새 질문 추가] — 자소서 작성 페이지의 카드와 동일한 폼이 펼쳐짐.
 * ------------------------------------------------------------------ */

export default function EssayEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const original = ESSAYS.find((e) => String(e.id) === String(id)) || ESSAYS[0];

  const [meta, setMeta] = React.useState({
    co: original.co,
    job: original.job,
    requirements: original.requirements,
  });
  const [editingMeta, setEditingMeta] = React.useState(false);

  const [questions, setQuestions] = React.useState(
    (original.questions || []).map((q) => ({ ...q }))
  );

  const updateQ = (qid, patch) =>
    setQuestions((qs) =>
      qs.map((q) => (q.id === qid ? { ...q, ...patch } : q))
    );
  const removeQ = (qid) => setQuestions((qs) => qs.filter((q) => q.id !== qid));
  const addQuestion = () => {
    const sorted = [...RECOMMENDED].sort((a, b) => b.match - a.match);
    const llmDefault = sorted.slice(0, 2).map((r) => r.id);
    const id = Date.now();
    setQuestions((qs) => [
      ...qs,
      {
        id,
        _new: true,
        title: '',
        limit: 800,
        used: llmDefault,
        draft: '',
      },
    ]);
  };

  return (
    <>
      <Crumbs items={['자소서', '관리', meta.co, '수정']} />
      <div className="page-h flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h1>{meta.co} 자소서 수정</h1>
          <div className="sub">
            각 영역 우측 상단의 수정하기 버튼으로 편집할 수 있어요.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate(`/essays/${original.id}`)}>
            <ArrowLeft size={13} /> 취소
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate(`/essays/${original.id}`)}
          >
            <Check size={13} /> 저장
          </Button>
        </div>
      </div>

      {/* 지원 정보 섹션 */}
      <MetaSection
        meta={meta}
        setMeta={setMeta}
        editing={editingMeta}
        setEditing={setEditingMeta}
      />

      {/* 질문 카드들 */}
      <div className="flex flex-col gap-4 mt-4">
        {questions.map((q, i) => (
          <QuestionEditCard
            key={q.id}
            q={q}
            index={i}
            requirements={meta.requirements}
            onChange={(patch) => updateQ(q.id, patch)}
            onRemove={() => removeQ(q.id)}
          />
        ))}
      </div>

      {/* 새 질문 추가 */}
      <button
        onClick={addQuestion}
        className="w-full mt-4 py-4 rounded-md border border-dashed border-ink-300 bg-paper hover:bg-ink-50 text-[13px] font-semibold text-ink-700 inline-flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={14} /> 새 질문 추가
      </button>
    </>
  );
}

/* ============== 지원 정보 ============== */
function MetaSection({ meta, setMeta, editing, setEditing }) {
  const [draft, setDraft] = React.useState(meta);
  React.useEffect(() => {
    if (editing) setDraft(meta);
  }, [editing]);

  if (!editing) {
    return (
      <Card>
        <div className="flex items-start justify-between mb-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            지원 정보
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-ink-500 hover:text-primary-700 inline-flex items-center gap-1 text-[12px] font-semibold"
          >
            <Pencil size={12} /> 수정하기
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="회사명" value={meta.co} />
          <Field label="희망 직무" value={meta.job} />
        </div>
        <div className="mt-3">
          <Field label="공통 요구사항" value={meta.requirements} multiline />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-primary-800">
          지원 정보 · 수정 중
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="회사명">
          <input
            className="field"
            value={draft.co}
            onChange={(e) => setDraft({ ...draft, co: e.target.value })}
          />
        </FieldInput>
        <FieldInput label="희망 직무">
          <input
            className="field"
            value={draft.job}
            onChange={(e) => setDraft({ ...draft, job: e.target.value })}
          />
        </FieldInput>
      </div>
      <div className="mt-3">
        <FieldInput label="공통 요구사항">
          <textarea
            className="field min-h-[88px]"
            value={draft.requirements}
            onChange={(e) =>
              setDraft({ ...draft, requirements: e.target.value })
            }
          />
        </FieldInput>
      </div>
      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-ink-150">
        <Button onClick={() => setEditing(false)}>취소</Button>
        <Button
          variant="primary"
          onClick={() => {
            setMeta(draft);
            setEditing(false);
          }}
        >
          <Check size={13} /> 적용하기
        </Button>
      </div>
    </Card>
  );
}

/* ============== 질문 카드 ============== */
function QuestionEditCard({ q, index, requirements, onChange, onRemove }) {
  const [editing, setEditing] = React.useState(!!q._new);
  const [draft, setDraft] = React.useState({
    title: q.title,
    limit: q.limit,
    used: q.used || [],
    draft: q.draft,
    requirements: '',
    altDraft: '',
  });
  React.useEffect(() => {
    if (editing)
      setDraft({
        title: q.title,
        limit: q.limit,
        used: q.used || [],
        draft: q.draft,
        requirements: '',
        altDraft: '',
      });
  }, [editing]);
  const [busyEditGen, setBusyEditGen] = React.useState(false);

  // 재생성 영역 (편집 여부와 무관하게 카드 하단에서 가능)
  const [reqInput, setReqInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [altDraft, setAltDraft] = React.useState('');

  const apply = () => {
    onChange(draft);
    setEditing(false);
  };

  const regenerate = () => {
    setBusy(true);
    setTimeout(() => {
      setAltDraft(
        mockGenerateDraft({
          question: q.title,
          picked: q.used || [],
          requirements: (requirements || '') + ' / ' + reqInput,
        })
      );
      setBusy(false);
    }, 600);
  };

  // ---------- READ MODE ----------
  if (!editing) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-900 text-white grid place-items-center text-[11px] font-bold">
              Q{index + 1}
            </span>
            <span className="text-[11px] text-ink-500 font-semibold">
              {q.limit}자 이내
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditing(true)}
              className="text-ink-500 hover:text-primary-700 inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1"
            >
              <Pencil size={12} /> 수정하기
            </button>
            <button
              onClick={onRemove}
              className="text-ink-400 hover:text-red-500 transition-colors p-1.5"
              title="질문 삭제"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div className="text-[14.5px] font-bold text-ink-900 leading-relaxed mb-3">
          {q.title || (
            <span className="text-ink-400 italic font-normal">
              문항이 비어 있습니다.
            </span>
          )}
        </div>

        {q.draft ? (
          <div className="text-[13.5px] leading-[1.75] text-ink-800 whitespace-pre-wrap break-keep">
            {q.draft}
          </div>
        ) : (
          <div className="text-[12.5px] text-ink-400 italic">
            아직 작성된 답변이 없습니다.
          </div>
        )}
        {q.draft && (
          <div className="text-right text-[11.5px] text-ink-500 font-mono mt-2">
            {q.draft.length} / {q.limit}
          </div>
        )}

        <UsedExperiences ids={q.used} />

        {/* 응답 재생성 */}
        <RegenBlock
          reqInput={reqInput}
          setReqInput={setReqInput}
          altDraft={altDraft}
          setAltDraft={setAltDraft}
          busy={busy}
          regenerate={regenerate}
          onAccept={() => {
            onChange({ draft: altDraft });
            setAltDraft('');
            setReqInput('');
          }}
          limit={q.limit}
        />
      </Card>
    );
  }

  // ---------- EDIT MODE ----------
  const sorted = [...RECOMMENDED].sort((a, b) => b.match - a.match);
  const llmDefault = sorted.slice(0, 2).map((r) => r.id);
  const rest = sorted.filter((r) => !llmDefault.includes(r.id));
  const togglePick = (id) => {
    const has = draft.used.includes(id);
    if (has) setDraft({ ...draft, used: draft.used.filter((x) => x !== id) });
    else if (draft.used.length < 2)
      setDraft({ ...draft, used: [...draft.used, id] });
  };

  return (
    <Card className="border-primary-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary-900 text-white grid place-items-center text-[11px] font-bold">
            Q{index + 1}
          </span>
          <span className="text-[11px] text-primary-800 font-bold uppercase tracking-wider">
            수정 중
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-ink-400 hover:text-red-500 transition-colors p-1.5"
          title="질문 삭제"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* 1. 문항 */}
      <FieldInput label="문항">
        <textarea
          className="field min-h-[68px]"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="자소서 문항을 입력하세요."
        />
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11.5px] text-ink-500">글자 제한</span>
          <input
            type="number"
            className="field max-w-[110px] py-1 text-[12px]"
            value={draft.limit}
            min={100}
            step={100}
            onChange={(e) =>
              setDraft({ ...draft, limit: Number(e.target.value) || 0 })
            }
          />
          <span className="text-[11.5px] text-ink-500">자</span>
        </div>
      </FieldInput>

      {/* 2. 경험 */}
      <FieldInput
        label={`이 문항에 쓸 경험 · ${draft.used.length}/2`}
        hint="AI 추천 상위 2개를 자동 선택했어요. 최대 2개까지 선택할 수 있어요."
      >
        <div className="grid gap-2 mb-2">
          {llmDefault.map((id) => {
            const r = sorted.find((x) => x.id === id);
            return (
              <ExpRow
                key={id}
                r={r}
                llm
                picked={draft.used.includes(id)}
                disabled={!draft.used.includes(id) && draft.used.length >= 2}
                onToggle={() => togglePick(id)}
              />
            );
          })}
        </div>
        <div className="text-[11px] font-semibold text-ink-500 mb-1.5 mt-2">
          그 외 경험 · 유사도 순
        </div>
        <div className="max-h-[180px] overflow-y-auto pr-1 flex flex-col gap-2 border border-ink-150 rounded-md p-2 bg-ink-50/50">
          {rest.map((r) => (
            <ExpRow
              key={r.id}
              r={r}
              picked={draft.used.includes(r.id)}
              disabled={!draft.used.includes(r.id) && draft.used.length >= 2}
              onToggle={() => togglePick(r.id)}
            />
          ))}
        </div>
      </FieldInput>

      {/* 3. 초안 */}
      <FieldInput label="답변 초안">
        <textarea
          className="field min-h-[180px] leading-relaxed"
          value={draft.draft}
          onChange={(e) => setDraft({ ...draft, draft: e.target.value })}
          placeholder="여기에 답변 초안을 작성하거나, 아래 [생성하기] 버튼을 누르세요."
        />
        <div className="text-right text-[11.5px] text-ink-500 font-mono mt-1">
          {draft.draft.length} / {draft.limit}
        </div>

        {/* 생성/재생성 — 작성 페이지와 동일 흐름 */}
        <div className="mt-3 rounded-md bg-ink-50 border border-ink-150 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={13} className="text-primary-700" />
            <span className="text-[12px] font-bold text-ink-800">AI 초안</span>
          </div>

          {!draft.draft ? (
            <Button
              variant="primary"
              disabled={!draft.title || draft.used.length === 0 || busyEditGen}
              onClick={() => {
                setBusyEditGen(true);
                setTimeout(() => {
                  const generated = mockGenerateDraft({
                    question: draft.title,
                    picked: draft.used,
                    requirements,
                  });
                  setDraft({
                    ...draft,
                    draft: generated,
                    altDraft: '',
                    requirements: '',
                  });
                  setBusyEditGen(false);
                }, 500);
              }}
            >
              {busyEditGen ? (
                '생성 중…'
              ) : (
                <>
                  <Sparkles size={13} /> 생성하기
                </>
              )}
            </Button>
          ) : (
            <>
              <textarea
                className="field min-h-[60px] text-[12.5px]"
                placeholder="추가/수정 요구사항을 적으면 다시 생성할 때 반영됩니다. (예: 더 짧게, 결론 먼저)"
                value={draft.requirements}
                onChange={(e) =>
                  setDraft({ ...draft, requirements: e.target.value })
                }
              />
              <div className="flex justify-end mt-2">
                <Button
                  variant="primary"
                  disabled={busyEditGen}
                  onClick={() => {
                    setBusyEditGen(true);
                    setTimeout(() => {
                      const altDraft = mockGenerateDraft({
                        question: draft.title,
                        picked: draft.used,
                        requirements:
                          (requirements || '') +
                          ' / ' +
                          (draft.requirements || ''),
                      });
                      setDraft({ ...draft, altDraft });
                      setBusyEditGen(false);
                    }, 500);
                  }}
                >
                  {busyEditGen ? (
                    '생성 중…'
                  ) : (
                    <>
                      <Sparkles size={13} /> 다시 생성하기
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* 다시 생성한 답변 (텍스트폼 2) */}
        {draft.altDraft && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-bold text-primary-800">
                다시 생성한 답변
              </span>
            </div>
            <textarea
              className="field min-h-[180px] leading-relaxed bg-primary-50/40"
              value={draft.altDraft}
              onChange={(e) => setDraft({ ...draft, altDraft: e.target.value })}
            />
            <div className="text-right text-[11.5px] text-ink-500 font-mono mt-1">
              {draft.altDraft.length} / {draft.limit}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                onClick={() =>
                  setDraft({ ...draft, altDraft: '', requirements: '' })
                }
              >
                원래 답변 저장하기
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  setDraft({
                    ...draft,
                    draft: draft.altDraft,
                    altDraft: '',
                    requirements: '',
                  })
                }
              >
                <Check size={13} /> 후의 답변 저장하기
              </Button>
            </div>
          </div>
        )}
      </FieldInput>

      <div className="flex justify-end gap-2 pt-3 border-t border-ink-150 mt-2">
        <Button onClick={() => setEditing(false)}>취소</Button>
        <Button variant="primary" onClick={apply}>
          <Check size={13} /> 적용하기
        </Button>
      </div>
    </Card>
  );
}

/* ============== 보조 ============== */
function FieldInput({ label, hint, children }) {
  return (
    <div className="mt-3 first:mt-0">
      <div className="text-[12px] font-semibold text-ink-700 mb-1.5">
        {label}
      </div>
      {children}
      {hint && (
        <div className="text-[11.5px] text-ink-500 mt-1.5 leading-relaxed">
          {hint}
        </div>
      )}
    </div>
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

function ExpRow({ r, picked, disabled, llm, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`text-left p-2.5 rounded-md border flex items-start gap-2.5 transition-colors
        ${picked ? 'border-primary-700 bg-primary-50' : 'border-ink-200 bg-paper hover:bg-ink-50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded-sm border-[1.5px] grid place-items-center text-[10px] font-bold text-white
        ${picked ? 'bg-primary-800 border-primary-800' : 'bg-paper border-ink-300'}`}
      >
        {picked ? '✓' : ''}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="text-[12.5px] font-bold text-ink-900 truncate">
            {r.title}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {llm && <Badge tone="navy">AI 추천</Badge>}
            <Badge tone="green">매칭 {r.match}%</Badge>
          </div>
        </div>
        <div className="text-[11px] text-ink-500">
          {r.cat} · {r.dur} · {r.tags}
        </div>
      </div>
    </button>
  );
}

function UsedExperiences({ ids = [] }) {
  const navigate = useNavigate();
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

function RegenBlock({
  reqInput,
  setReqInput,
  altDraft,
  setAltDraft,
  busy,
  regenerate,
  onAccept,
  limit,
}) {
  return (
    <div className="mt-4 pt-4 border-t border-dashed border-ink-200">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={13} className="text-primary-700" />
        <span className="text-[12px] font-bold text-ink-800">응답 재생성</span>
      </div>

      <div className="flex items-stretch gap-2">
        <input
          className="field flex-1"
          placeholder="요구사항을 입력하세요. (예: 더 짧게, 결론 먼저, 결과 수치 강조)"
          value={reqInput}
          onChange={(e) => setReqInput(e.target.value)}
        />
        <Button variant="primary" disabled={busy} onClick={regenerate}>
          {busy ? (
            '생성 중…'
          ) : (
            <>
              <Sparkles size={13} /> 다시 생성
            </>
          )}
        </Button>
      </div>

      {altDraft && (
        <div className="mt-3 rounded-md bg-primary-50/40 border border-primary-50 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-bold text-primary-800">
              새 답변 후보
            </span>
          </div>
          <textarea
            className="field min-h-[160px] leading-relaxed bg-paper"
            value={altDraft}
            onChange={(e) => setAltDraft(e.target.value)}
          />
          <div className="text-right text-[11.5px] text-ink-500 font-mono mt-1">
            {altDraft.length} / {limit}
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={() => setAltDraft('')}>버리기</Button>
            <Button variant="primary" onClick={onAccept}>
              <Check size={13} /> 이 답변 적용하기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
