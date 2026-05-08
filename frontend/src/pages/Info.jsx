import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Save, Trash2, X as XIcon } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import Combobox from '../components/Combobox';
import DeptCascadeSelect from '../components/DeptCascadeSelect';
import Modal from '../components/Modal';
import { cn } from '../lib/cn';
import { useMe, useUpdateMe, useWithdraw } from '../api/queries/useMe';
import { useAuth } from '../store/useAuth';
import { toast } from '../store/useToast';
import {
  STATE_LABEL,
  STATE_OPTIONS,
  JOB_FIRST_OPTIONS,
  jobSecondOptions,
  jobThirdOptions,
  humanizeEnum,
} from '../lib/enums';

/**
 * 내 정보 페이지 — GET /users/me 조회 + 수정 모드에서 PUT /users/me.
 *
 * 모드:
 *   view  — 조회. 비어있는 필드는 "—" 로 표시.
 *   edit  — 수정. 필드 입력 후 저장 / 취소.
 *
 * 수정 가능 필드 (백엔드 UserMeRequest 기준):
 *   userName, schoolNumber, score, state(ENUM), major(KookminDepartment),
 *   minor(KookminDepartment | null), jobFirst, jobSecond, jobThird (한국 표준직업분류)
 *
 * 백엔드가 보낸 enum 값을 그대로 다시 보내므로 (정확 일치 필요) 드롭다운의
 * value 도 백엔드 enum 그대로. 라벨만 사람이 읽기 좋게 humanize.
 */
export default function Info() {
  const me = useMe();
  const updateMe = useUpdateMe();
  // mode/draft 모두 사용자 액션(수정 버튼)으로만 진입. me.data 변동에 따른
  // 자동 동기화는 안 함 — 수정 중에 서버 데이터가 덮어 쓰이면 사용자 입력
  // 손실되므로. view 모드에서는 draft 무시하고 me.data 직접 렌더.
  const [mode, setMode] = useState('view');
  const [draft, setDraft] = useState(null);
  // 첫 "저장" 클릭 후부터 라이브 검증 (Onboarding 패턴 일치).
  const [submitted, setSubmitted] = useState(false);
  const errors = mode === 'edit' && submitted && draft ? validate(draft) : {};

  if (me.isLoading) {
    return (
      <>
        <Crumbs items={['MyPage', '내 정보']} />
        <LoadingState />
      </>
    );
  }

  if (me.isError) {
    return (
      <>
        <Crumbs items={['MyPage', '내 정보']} />
        <ErrorState
          message={me.error?.apiMessage || '내 정보를 불러오지 못했습니다.'}
          onRetry={() => me.refetch()}
        />
      </>
    );
  }

  const data = me.data;
  if (!data) {
    return (
      <>
        <Crumbs items={['MyPage', '내 정보']} />
        <ErrorState message="응답이 비어있습니다." />
      </>
    );
  }

  const enterEdit = () => {
    setDraft(toDraft(data));
    setMode('edit');
  };
  const cancelEdit = () => {
    setDraft(toDraft(data));
    setMode('view');
  };

  const save = () => {
    const body = toRequest(draft);
    if (!body.userName?.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    if (updateMe.isPending) return;
    updateMe.mutate(body, {
      onSuccess: () => {
        toast.success('내 정보를 저장했어요.');
        setMode('view');
      },
      onError: (e) => {
        toast.error(
          e?.apiMessage || '저장 중 오류가 발생했어요. 다시 시도해주세요.'
        );
      },
    });
  };

  const isEdit = mode === 'edit';

  return (
    <>
      <Crumbs items={['MyPage', '내 정보']} />

      {/* 페이지 헤더 + 수정/저장 버튼 */}
      <header className="flex flex-wrap items-center gap-3 mb-4">
        <Avatar name={data.userName} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-bold tracking-tight text-ink-900 truncate">
            {data.userName || '회원'}
          </h1>
          <div className="text-[12.5px] text-ink-500 mt-0.5">
            {data.schoolNumber
              ? `학번 ${data.schoolNumber}`
              : '학번을 입력해주세요'}
            {data.state && (
              <>
                <span className="text-ink-300 mx-1.5">·</span>
                <span>{STATE_LABEL[data.state] || data.state}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2 sm:shrink-0 w-full sm:w-auto">
          {isEdit ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={updateMe.isPending}
                className="btn-default flex-1 sm:flex-none"
              >
                <XIcon size={14} strokeWidth={2} />
                취소
              </button>
              <button
                type="button"
                onClick={save}
                disabled={updateMe.isPending}
                className="btn-primary flex-1 sm:flex-none"
              >
                <Save size={14} strokeWidth={2} />
                {updateMe.isPending ? '저장 중…' : '저장'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={enterEdit}
              className="btn-default ml-auto sm:ml-0"
            >
              <Pencil size={13} strokeWidth={2} />
              수정
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-4">
        {/* 기본 정보 */}
        <Card title="기본 정보">
          <Grid cols={2}>
            <Field label="이름" required>
              {isEdit ? (
                <input
                  className="field text-[14px] py-2.5"
                  value={draft?.userName ?? ''}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, userName: e.target.value }))
                  }
                  placeholder="홍길동"
                />
              ) : (
                <ReadOnly value={data.userName} />
              )}
            </Field>
            <Field label="학번">
              {isEdit ? (
                <input
                  className="field text-[14px] py-2.5"
                  value={draft?.schoolNumber ?? ''}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, schoolNumber: e.target.value }))
                  }
                  placeholder="20221234"
                />
              ) : (
                <ReadOnly value={data.schoolNumber} />
              )}
            </Field>
          </Grid>
        </Card>

        {/* 학적 정보 */}
        <Card
          title="학적 정보"
          sub="같은 전공·학번 친구들과의 비교 통계에 활용됩니다."
        >
          <Grid cols={2}>
            <Field label="현재 상태">
              {isEdit ? (
                <DeptOrPlainSelect
                  value={draft?.state ?? ''}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, state: v || null }))
                  }
                  options={[
                    { value: '', label: '선택 안 함' },
                    ...STATE_OPTIONS,
                  ]}
                />
              ) : (
                <ReadOnly value={data.state ? STATE_LABEL[data.state] : null} />
              )}
            </Field>
            <Field label="학점 (4.5 만점)">
              {isEdit ? (
                <input
                  type="number"
                  min="0"
                  max="4.5"
                  step="0.01"
                  className="field text-[14px] py-2.5"
                  value={draft?.score ?? ''}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, score: e.target.value }))
                  }
                  placeholder="3.85"
                />
              ) : (
                <ReadOnly
                  value={
                    data.score == null ? null : Number(data.score).toFixed(2)
                  }
                />
              )}
            </Field>
          </Grid>
          <Grid cols={2}>
            <Field label="전공">
              {isEdit ? (
                <DeptSelect
                  value={draft?.major ?? ''}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, major: v || null }))
                  }
                  allowEmpty
                />
              ) : (
                <ReadOnly value={data.major} />
              )}
            </Field>
            <Field label="부전공">
              {isEdit ? (
                <DeptSelect
                  value={draft?.minor ?? ''}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, minor: v || null }))
                  }
                  allowEmpty
                  emptyLabel="없음"
                />
              ) : (
                <ReadOnly value={data.minor} fallback="없음" />
              )}
            </Field>
          </Grid>
        </Card>

        {/* 진로 관심사 */}
        <Card title="진로 관심사" sub="자소서 추천과 경험 분석에 활용됩니다.">
          {isEdit ? (
            <JobTreeSelect
              value={{
                first: draft?.jobFirst ?? '',
                second: draft?.jobSecond ?? '',
                third: draft?.jobThird ?? '',
              }}
              onChange={(next) => setDraft((d) => ({ ...d, ...next }))}
            />
          ) : (
            <Grid cols={3}>
              <Field label="대분류">
                <ReadOnly value={humanizeEnum(data.jobFirst)} />
              </Field>
              <Field label="중분류">
                <ReadOnly value={humanizeEnum(data.jobSecond)} />
              </Field>
              <Field label="소분류">
                <ReadOnly value={humanizeEnum(data.jobThird)} />
              </Field>
            </Grid>
          )}
        </Card>
      </div>
    </>
  );
}

/* ---------- 데이터 변환 ---------- */

const toDraft = (d) => ({
  userName: d.userName ?? '',
  schoolNumber: d.schoolNumber ?? '',
  state: d.state ?? null,
  score: d.score == null ? '' : String(d.score),
  major: d.major ?? null,
  minor: d.minor ?? null,
  jobFirst: d.jobFirst ?? null,
  jobSecond: d.jobSecond ?? null,
  jobThird: d.jobThird ?? null,
});

const toRequest = (draft) => {
  const score =
    draft.score === '' || draft.score == null
      ? null
      : Number.parseFloat(draft.score);
  return {
    userName: (draft.userName ?? '').trim(),
    schoolNumber: (draft.schoolNumber ?? '').trim() || null,
    state: draft.state || null,
    score: Number.isFinite(score) ? score : null,
    major: draft.major || null,
    minor: draft.minor || null,
    jobFirst: draft.jobFirst || null,
    jobSecond: draft.jobSecond || null,
    jobThird: draft.jobThird || null,
  };
};

/* ---------- 빌딩 블록 ---------- */

function Avatar({ name }) {
  const initial = (name || '?').trim().charAt(0) || '?';
  return (
    <span className="grid place-items-center w-12 h-12 rounded-full bg-primary-50 text-primary-800 font-bold text-[16px] shrink-0">
      {initial}
    </span>
  );
}

function Card({ title, sub, children }) {
  return (
    <section className="card">
      <div className="mb-4">
        <h2 className="text-[15px] font-bold text-ink-900 tracking-tight">
          {title}
        </h2>
        {sub && <p className="text-[12px] text-ink-500 mt-1">{sub}</p>}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Grid({ cols = 2, children }) {
  const gridClass =
    cols === 3
      ? 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5'
      : 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5';
  return <div className={gridClass}>{children}</div>;
}

function Field({ label, required, children }) {
  return (
    <div className="grid gap-1.5">
      <label className="flex items-center gap-1 text-[12.5px] font-semibold text-ink-700">
        {label}
        {required && <span className="text-primary-600 font-bold">*</span>}
      </label>
      {children}
    </div>
  );
}

function ReadOnly({ value, fallback = '—' }) {
  const display = value == null || value === '' ? fallback : value;
  const muted = value == null || value === '';
  return (
    <div
      className={cn(
        'min-h-[40px] px-3 py-2.5 rounded-md bg-ink-50 text-[14px] break-keep',
        muted ? 'text-ink-400' : 'text-ink-900'
      )}
    >
      {display}
    </div>
  );
}

/* ---------- Selects ---------- */

function PlainSelect({ value, onChange, options, className }) {
  return (
    <div className="relative">
      <select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'field text-[14px] py-2.5 pr-9 cursor-pointer appearance-none bg-paper',
          className
        )}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
      />
    </div>
  );
}

// alias 로 사용하는 단순 select
const DeptOrPlainSelect = PlainSelect;

/**
 * KookminDepartment 단과대 → 학과 그룹 select.
 * value 는 백엔드 직렬화 값(풀네임) 그대로 — onChange 도 같은 문자열 반환.
 */
function DeptSelect({
  value,
  onChange,
  allowEmpty,
  emptyLabel = '선택 안 함',
}) {
  return (
    <div className="relative">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="field text-[14px] py-2.5 pr-9 cursor-pointer appearance-none bg-paper"
      >
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {KOOKMIN_COLLEGES.map((college) => {
          const inCollege = KOOKMIN_DEPT_OPTIONS.filter(
            (o) => o.group === college
          );
          return (
            <optgroup key={college} label={college}>
              {inCollege.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
      />
    </div>
  );
}

/**
 * 직무 3단 트리 select.
 *  - first 선택 → second 옵션 갱신, second/third 초기화
 *  - second 선택 → third 옵션 갱신, third 초기화
 *  - 모든 단계는 "선택 안 함" 허용 (null 허용)
 */
function JobTreeSelect({ value, onChange }) {
  const { first, second, third } = value;

  const seconds = useMemo(() => jobSecondOptions(first), [first]);
  const thirds = useMemo(() => jobThirdOptions(first, second), [first, second]);

  const onFirst = (v) => {
    onChange({
      jobFirst: v || null,
      jobSecond: null,
      jobThird: null,
    });
  };
  const onSecond = (v) => {
    onChange({ jobSecond: v || null, jobThird: null });
  };
  const onThird = (v) => {
    onChange({ jobThird: v || null });
  };

  return (
    <Grid cols={3}>
      <Field label="대분류">
        <PlainSelect
          value={first}
          onChange={onFirst}
          options={[{ value: '', label: '선택 안 함' }, ...JOB_FIRST_OPTIONS]}
        />
      </Field>
      <Field label="중분류">
        <PlainSelect
          value={second}
          onChange={onSecond}
          options={[
            { value: '', label: first ? '선택 안 함' : '대분류부터 선택' },
            ...seconds,
          ]}
          className={!first ? 'opacity-60' : ''}
        />
      </Field>
      <Field label="소분류">
        <PlainSelect
          value={third}
          onChange={onThird}
          options={[
            { value: '', label: second ? '선택 안 함' : '중분류부터 선택' },
            ...thirds,
          ]}
          className={!second ? 'opacity-60' : ''}
        />
      </Field>
    </Grid>
  );
}

/* ---------- Loading / Error ---------- */

function LoadingState() {
  return (
    <div className="card">
      <div className="animate-pulse">
        <div className="h-5 w-24 bg-ink-100 rounded mb-3" />
        <div className="h-4 w-2/3 bg-ink-100 rounded mb-2" />
        <div className="h-4 w-1/2 bg-ink-100 rounded mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-10 bg-ink-100 rounded" />
          <div className="h-10 bg-ink-100 rounded" />
          <div className="h-10 bg-ink-100 rounded" />
          <div className="h-10 bg-ink-100 rounded" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="card text-center py-10">
      <div className="text-[14px] font-semibold text-ink-900 mb-1">
        내 정보를 불러올 수 없어요
      </div>
      <p className="text-[13px] text-ink-500 break-keep mb-4">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-default">
          다시 시도
        </button>
      )}
    </div>
  );
}
