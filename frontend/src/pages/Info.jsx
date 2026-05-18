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
    setSubmitted(false);
    setMode('edit');
  };
  const cancelEdit = () => {
    setDraft(toDraft(data));
    setSubmitted(false);
    setMode('view');
  };

  const save = () => {
    setSubmitted(true);
    const errs = validate(draft);
    if (Object.keys(errs).length > 0) {
      toast.error('입력값을 다시 확인해주세요.');
      return;
    }
    if (updateMe.isPending) return;
    const body = toRequest(draft);
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

      {/* 페이지 헤더 + 수정/저장 버튼.
          부제(학번·학년)는 학적 정보 카드와 중복이라 제거 — 이름만 아바타 옆에 수직 중앙 정렬. */}
      <header className="flex flex-wrap items-center gap-3 mb-5">
        <Avatar name={data.userName} />
        <h1 className="min-w-0 flex-1 text-[22px] font-bold tracking-tight text-ink-900 truncate">
          {data.userName || '회원'}
        </h1>
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
        {/* 기본 / 학적 / 진로 관심사 — 하나의 카드 안에서 섹션 헤딩으로 분리. */}
        <section className="card">
          <div className="grid gap-6">
            <Section title="기본 정보">
              <Grid cols={2}>
                <Field label="이름" required={isEdit} error={errors.userName}>
                  {isEdit ? (
                    <input
                      className={cn(
                        'field text-[14px] py-2.5',
                        errors.userName && 'border-red-500 focus:border-red-500'
                      )}
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
                <Field
                  label="학번"
                  required={isEdit}
                  error={errors.schoolNumber}
                >
                  {isEdit ? (
                    <input
                      className={cn(
                        'field text-[14px] py-2.5',
                        errors.schoolNumber &&
                          'border-red-500 focus:border-red-500'
                      )}
                      value={draft?.schoolNumber ?? ''}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          schoolNumber: e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 8),
                        }))
                      }
                      placeholder="20221234"
                      inputMode="numeric"
                      maxLength={8}
                    />
                  ) : (
                    <ReadOnly value={data.schoolNumber} />
                  )}
                </Field>
              </Grid>
            </Section>

            <Section
              title="학적 정보"
              sub="같은 전공·학번 친구들과의 비교 통계에 활용됩니다."
              divider
            >
              <Grid cols={2}>
                <Field label="현재 상태" required={isEdit} error={errors.state}>
                  {isEdit ? (
                    <Combobox
                      value={draft?.state ?? ''}
                      onChange={(v) =>
                        setDraft((d) => ({ ...d, state: v || null }))
                      }
                      options={STATE_OPTIONS}
                      placeholder="선택"
                      searchable={false}
                      forceDirection="down"
                      compact
                      hasError={!!errors.state}
                    />
                  ) : (
                    <ReadOnly
                      value={data.state ? STATE_LABEL[data.state] : null}
                    />
                  )}
                </Field>
                <Field
                  label="학점 (4.5 만점)"
                  required={isEdit}
                  error={errors.score}
                >
                  {isEdit ? (
                    <input
                      type="number"
                      min="0"
                      max="4.5"
                      step="0.01"
                      className={cn(
                        'field text-[14px] py-2.5',
                        errors.score && 'border-red-500 focus:border-red-500'
                      )}
                      value={draft?.score ?? ''}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, score: e.target.value }))
                      }
                      placeholder="3.85"
                    />
                  ) : (
                    <ReadOnly
                      value={
                        data.score == null
                          ? null
                          : Number(data.score).toFixed(2)
                      }
                    />
                  )}
                </Field>
              </Grid>
              <Grid cols={2}>
                <Field label="전공" required={isEdit} error={errors.major}>
                  {isEdit ? (
                    <DeptCascadeSelect
                      value={draft?.major ?? ''}
                      onChange={(v) =>
                        setDraft((d) => ({ ...d, major: v || null }))
                      }
                      excludeValue={draft?.minor || undefined}
                      hasError={!!errors.major}
                    />
                  ) : (
                    <ReadOnly value={data.major} />
                  )}
                </Field>
                <Field label="부전공" error={errors.minor}>
                  {isEdit ? (
                    <DeptCascadeSelect
                      value={draft?.minor ?? ''}
                      onChange={(v) =>
                        setDraft((d) => ({ ...d, minor: v || null }))
                      }
                      excludeValue={draft?.major || undefined}
                      allowClear
                      hasError={!!errors.minor}
                    />
                  ) : (
                    <ReadOnly value={data.minor} fallback="없음" />
                  )}
                </Field>
              </Grid>
            </Section>

            <Section
              title="진로 관심사"
              sub="자소서 추천과 경험 분석에 활용됩니다."
              divider
            >
              {isEdit ? (
                <JobTreeSelect
                  value={{
                    first: draft?.jobFirst ?? '',
                    second: draft?.jobSecond ?? '',
                    third: draft?.jobThird ?? '',
                  }}
                  onChange={(next) => setDraft((d) => ({ ...d, ...next }))}
                  errors={errors}
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
            </Section>
          </div>
        </section>

        {!isEdit && <DangerZone />}
      </div>
    </>
  );
}

/* ---------- 회원 탈퇴 ---------- */

/**
 * 위험 영역 — 회원 탈퇴 카드 + 확인 모달.
 *  - POST /auth/withdraw 성공 시 모든 react-query 캐시 wipe + zustand clearSession +
 *    /landing 으로 replace 라우팅.
 *  - "탈퇴" 두 글자 정확 입력해야 버튼 활성화. 오발 방지.
 *  - edit 모드에서는 카드 자체가 숨겨져 호출부에서 분기.
 */
function DangerZone() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const clearSession = useAuth((s) => s.clearSession);
  const withdraw = useWithdraw();

  const close = () => {
    if (withdraw.isPending) return;
    setOpen(false);
    setConfirmText('');
  };

  const onConfirm = () => {
    if (withdraw.isPending) return;
    withdraw.mutate(undefined, {
      onSuccess: () => {
        qc.clear();
        clearSession();
        toast.success('회원 탈퇴가 완료되었어요.');
        navigate('/landing', { replace: true });
      },
      onError: (e) => {
        toast.error(
          e?.apiMessage ||
            '탈퇴 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.'
        );
      },
    });
  };

  const canConfirm = confirmText.trim() === '탈퇴' && !withdraw.isPending;

  return (
    <>
      <section className="card border-red-500/30 bg-red-50/30">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center w-8 h-8 rounded-md bg-red-50 text-red-600 shrink-0">
            <AlertTriangle size={16} strokeWidth={2} />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-ink-900 tracking-tight">
              회원 탈퇴
            </h2>
            <p className="text-[12.5px] text-ink-500 mt-1 break-keep leading-relaxed">
              계정을 삭제하면 자소서·경험·자격증·통계 데이터가 모두 사라지고
              복구할 수 없어요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-base bg-paper border border-red-500/40 text-red-600 hover:bg-red-50 shrink-0"
          >
            <Trash2 size={13} strokeWidth={2} />
            회원 탈퇴
          </button>
        </div>
      </section>

      <Modal
        open={open}
        onClose={close}
        title="정말 탈퇴하시겠어요?"
        sub={
          <>
            계정을 삭제하면 그동안 작성한 자소서, 등록한 경험·자격증, 통계
            데이터가 즉시 삭제되며{' '}
            <b className="text-ink-800">복구할 수 없어요.</b>
            <br />
            계속하려면 아래에 <b className="text-ink-800">탈퇴</b> 두 글자를
            입력해주세요.
          </>
        }
        width={460}
        footer={
          <>
            <button
              type="button"
              onClick={close}
              disabled={withdraw.isPending}
              className="btn-default"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm}
              className={cn(
                'btn-base text-white',
                canConfirm
                  ? 'bg-red-600 border border-red-600 hover:bg-red-700'
                  : 'bg-red-600/40 border border-red-600/40 cursor-not-allowed'
              )}
            >
              <Trash2 size={13} strokeWidth={2} />
              {withdraw.isPending ? '처리 중…' : '탈퇴하기'}
            </button>
          </>
        }
      >
        <input
          type="text"
          autoFocus
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="탈퇴"
          disabled={withdraw.isPending}
          className="field text-[14px] py-2.5"
          aria-label="탈퇴 확인 입력"
        />
      </Modal>
    </>
  );
}

/* ---------- 검증 (Onboarding 과 동일 정책) ---------- */

/**
 * 검증 규칙 (Onboarding 와 일치):
 *  - userName trim 후 2자 이상
 *  - schoolNumber 8자리 숫자
 *  - state / major / jobFirst / jobSecond / jobThird / score 모두 필수
 *  - score 0~4.5
 *  - minor 가 있으면 major 와 같지 않아야 함 (부전공은 옵셔널)
 */
function validate(draft) {
  const e = {};
  if (!draft) return e;
  if ((draft.userName ?? '').trim().length < 2) {
    e.userName = '이름은 2자 이상 입력해주세요.';
  }
  if (!/^\d{8}$/.test((draft.schoolNumber ?? '').trim())) {
    e.schoolNumber = '학번은 8자리 숫자로 입력해주세요.';
  }
  if (!draft.state) e.state = '현재 상태를 선택해주세요.';
  if (!draft.major) e.major = '전공을 선택해주세요.';
  if (draft.minor && draft.minor === draft.major) {
    e.minor = '부전공은 전공과 다르게 선택해주세요.';
  }
  if (draft.score === '' || draft.score == null) {
    e.score = '학점을 입력해주세요.';
  } else {
    const n = Number.parseFloat(draft.score);
    if (!Number.isFinite(n) || n < 0 || n > 4.5) {
      e.score = '학점은 0 ~ 4.5 사이로 입력해주세요.';
    }
  }
  if (!draft.jobFirst) e.jobFirst = '대분류를 선택해주세요.';
  if (!draft.jobSecond) e.jobSecond = '중분류를 선택해주세요.';
  if (!draft.jobThird) e.jobThird = '소분류를 선택해주세요.';
  return e;
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

/**
 * 단일 카드 안에서 의미 단위(기본 / 학적 / 진로 관심사)를 시각적으로
 * 분리하는 인라인 섹션. divider 가 true 이면 위쪽에 가는 구분선 + 여백을
 * 둬서 이전 섹션과 구분.
 */
function Section({ title, sub, divider, children }) {
  return (
    <div className={cn(divider && 'pt-6 border-t border-border')}>
      <div className="mb-4">
        <h2 className="text-[14px] font-bold text-ink-900 tracking-tight">
          {title}
        </h2>
        {sub && <p className="text-[12px] text-ink-500 mt-1">{sub}</p>}
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}

function Grid({ cols = 2, children }) {
  const gridClass =
    cols === 3
      ? 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5'
      : 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5';
  return <div className={gridClass}>{children}</div>;
}

function Field({ label, required, hint, error, children }) {
  return (
    <div className="grid gap-1.5">
      <label className="flex items-center gap-1 text-[12.5px] font-semibold text-ink-700">
        {label}
        {required && <span className="text-primary-600 font-bold">*</span>}
      </label>
      {children}
      {error ? (
        <div className="text-[11.5px] text-red-600 mt-0.5 break-keep">
          {error}
        </div>
      ) : hint ? (
        <div className="text-[11.5px] text-ink-500 mt-0.5">{hint}</div>
      ) : null}
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

/**
 * 직무 3단 트리 select.
 *  - first 선택 → second 옵션 갱신, second/third 초기화
 *  - second 선택 → third 옵션 갱신, third 초기화
 *  - 모든 단계는 비우기(null) 허용 — Combobox 의 allowClear X 버튼으로.
 *  - 옵션 수가 큼 (대분류 13 / 중분류 ~114 / 소분류 ~1,125) → 검색 가능한 Combobox 필수.
 */
function JobTreeSelect({ value, onChange, errors = {} }) {
  const { first, second, third } = value;

  const seconds = useMemo(() => jobSecondOptions(first), [first]);
  const thirds = useMemo(() => jobThirdOptions(first, second), [first, second]);

  const onFirst = (v) =>
    onChange({ jobFirst: v || null, jobSecond: null, jobThird: null });
  const onSecond = (v) => onChange({ jobSecond: v || null, jobThird: null });
  const onThird = (v) => onChange({ jobThird: v || null });

  return (
    <Grid cols={3}>
      <Field label="대분류" required error={errors.jobFirst}>
        <Combobox
          value={first || ''}
          onChange={onFirst}
          options={JOB_FIRST_OPTIONS}
          placeholder="대분류 선택"
          searchable={false}
          forceDirection="down"
          compact
          hasError={!!errors.jobFirst}
        />
      </Field>
      <Field label="중분류" required error={errors.jobSecond}>
        <Combobox
          value={second || ''}
          onChange={onSecond}
          options={seconds}
          placeholder={first ? '중분류 선택' : '대분류부터 선택'}
          searchable={false}
          forceDirection="down"
          compact
          disabled={!first}
          hasError={!!errors.jobSecond}
        />
      </Field>
      <Field label="소분류" required error={errors.jobThird}>
        <Combobox
          value={third || ''}
          onChange={onThird}
          options={thirds}
          placeholder={second ? '소분류 선택' : '중분류부터 선택'}
          searchable={false}
          forceDirection="down"
          compact
          disabled={!second}
          hasError={!!errors.jobThird}
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
