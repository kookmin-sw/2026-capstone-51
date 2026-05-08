import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import Modal from '../components/Modal';
import ExperienceForm from '../components/experience/ExperienceForm';
import {
  useExperience,
  useUpdateExperience,
  useDeleteExperience,
} from '../api/queries/useExperiences';
import {
  EXPERIENCE_CATEGORY_TO_FRONT,
  EXPERIENCE_CATEGORY_LABEL,
} from '../lib/enums';
import { toast } from '../store/useToast';

/**
 * /my-experience/:id — 경험 열람 + 수정 + 삭제.
 *
 * 모드:
 *  - view: 카테고리·기간·관련 전공·STAR 4항목 모두 표시 (truncate 없음).
 *  - edit: 같은 ExperienceForm 으로 토글 → PUT /experiences/:id.
 *
 * 삭제 확인은 모달 — "삭제하시겠습니까?" 팝업에서 [취소 / 삭제] 선택.
 */
export default function ExperienceDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const exp = useExperience(id);
  const update = useUpdateExperience();
  const del = useDeleteExperience();

  const [mode, setMode] = useState('view'); // 'view' | 'edit'
  const [confirmDelOpen, setConfirmDelOpen] = useState(false);

  if (exp.isLoading) {
    return (
      <>
        <Crumbs items={['MyPage', '내 경험', '열람']} />
        <div className="card animate-pulse">
          <div className="h-4 w-32 bg-ink-100 rounded mb-3" />
          <div className="h-6 w-2/3 bg-ink-100 rounded mb-4" />
          <div className="h-3 w-full bg-ink-100 rounded mb-2" />
          <div className="h-3 w-5/6 bg-ink-100 rounded" />
        </div>
      </>
    );
  }
  if (exp.isError) {
    return (
      <>
        <Crumbs items={['MyPage', '내 경험', '열람']} />
        <div className="card text-center py-8">
          <p className="text-[13px] text-ink-700 mb-3">
            {exp.error?.apiMessage || '경험을 불러오지 못했습니다.'}
          </p>
          <button
            type="button"
            onClick={() => exp.refetch()}
            className="btn-default"
          >
            다시 시도
          </button>
        </div>
      </>
    );
  }

  const data = exp.data;
  if (!data) {
    return (
      <>
        <Crumbs items={['MyPage', '내 경험', '열람']} />
        <div className="card text-center py-8 text-[13px] text-ink-500">
          응답이 비어있습니다.
        </div>
      </>
    );
  }

  const cat = EXPERIENCE_CATEGORY_TO_FRONT[data.experienceCategory];
  const label = EXPERIENCE_CATEGORY_LABEL[cat] || data.experienceCategory;

  const handleSave = (body) => {
    update.mutate(
      { id, body },
      {
        onSuccess: () => {
          toast.success('경험을 저장했어요.');
          setMode('view');
        },
        onError: (e) => {
          toast.error(
            e?.apiMessage || '저장 중 오류가 발생했습니다. 다시 시도해주세요.'
          );
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    del.mutate(id, {
      onSuccess: () => {
        toast.success('경험을 삭제했어요.');
        setConfirmDelOpen(false);
        nav('/my-experience');
      },
      onError: (e) => {
        toast.error(
          e?.apiMessage || '삭제 중 오류가 발생했습니다. 다시 시도해주세요.'
        );
      },
    });
  };

  return (
    <>
      <Crumbs items={['MyPage', '내 경험', '열람']} />

      <header className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] mb-1.5">
            <span className="badge-navy">{label}</span>
            <span className="text-ink-400">·</span>
            <span className="text-ink-500 tabular-nums">
              {data.startDate} ~ {data.endDate}
            </span>
          </div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink-900 break-keep">
            {data.experienceTitle}
          </h1>
        </div>

        {mode === 'view' && (
          <div className="flex gap-2 sm:shrink-0">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="btn-default"
            >
              <Pencil size={13} strokeWidth={2} />
              수정
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelOpen(true)}
              disabled={del.isPending}
              className="btn-default !text-red-600 !border-red-200 hover:!bg-red-50"
            >
              <Trash2 size={13} strokeWidth={2} />
              삭제
            </button>
          </div>
        )}
      </header>

      <Modal
        open={confirmDelOpen}
        onClose={() => (del.isPending ? null : setConfirmDelOpen(false))}
        title="삭제하시겠습니까?"
        sub={`'${data.experienceTitle || '이 경험'}' 항목이 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
        width={420}
        footer={
          <>
            <button
              type="button"
              className="btn-default"
              disabled={del.isPending}
              onClick={() => setConfirmDelOpen(false)}
            >
              취소
            </button>
            <button
              type="button"
              className="btn-default !text-red-600 !border-red-200 hover:!bg-red-50"
              disabled={del.isPending}
              onClick={handleConfirmDelete}
            >
              <Trash2 size={13} strokeWidth={2} />
              {del.isPending ? '삭제 중…' : '삭제'}
            </button>
          </>
        }
      >
        <></>
      </Modal>

      {mode === 'edit' ? (
        <div className="card">
          <ExperienceForm
            initialValue={data}
            onSubmit={handleSave}
            onCancel={() => setMode('view')}
            isPending={update.isPending}
            submitLabel="저장"
          />
        </div>
      ) : (
        <div className="grid gap-4">
          <section className="card">
            <h2 className="text-[14px] font-bold text-ink-900 mb-2">
              기본 정보
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <Item label="관련 전공" value={data.relatedMajor} />
              <Item
                label="진행 기간"
                value={`${data.startDate} ~ ${data.endDate}`}
              />
            </dl>
          </section>

          <section className="card">
            <h2 className="text-[14px] font-bold text-ink-900 mb-3">
              활동 내용 (STAR)
            </h2>
            <div className="grid gap-4">
              <Star label="Situation" text={data.starStructure?.s} />
              <Star label="Task" text={data.starStructure?.t} />
              <Star label="Action" text={data.starStructure?.a} />
              <Star label="Result" text={data.starStructure?.r} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}

/* ---------- 빌딩블록 ---------- */

function Item({ label, value }) {
  return (
    <div>
      <dt className="text-[11.5px] font-semibold text-ink-500 mb-0.5">
        {label}
      </dt>
      <dd className="text-[14px] text-ink-900 break-keep">
        {value || <span className="text-ink-400">—</span>}
      </dd>
    </div>
  );
}

function Star({ label, text }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-primary-700 mb-1">
        {label}
      </div>
      <p className="text-[13.5px] text-ink-800 leading-relaxed break-keep whitespace-pre-line">
        {text || <span className="text-ink-400">—</span>}
      </p>
    </div>
  );
}
