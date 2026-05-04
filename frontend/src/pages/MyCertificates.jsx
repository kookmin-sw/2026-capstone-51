import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import Modal from '../components/Modal';
import {
  useCertificates,
  useDeleteCertificate,
} from '../api/queries/useCertificates';
import { toast } from '../store/useToast';

/**
 * /my-certificates — 내 자격증 목록.
 *
 * 디자인:
 *  - 단일 .card !p-0 셸 안에 <ol> 번호 매긴 row 리스트 (검색 필터 없음).
 *  - 각 row 는 두 줄(번호 + 자격증명 / 발급기관·취득일·유효기간·발급번호) 콤팩트.
 *  - 수정/삭제는 우측 ghost 아이콘 버튼.
 *  - 삭제는 모달 확인 — "삭제하시겠습니까?" 팝업에서 [취소 / 삭제] 선택.
 */
export default function MyCertificates() {
  const [pendingDel, setPendingDel] = useState(null); // null | certificate item
  const list = useCertificates();
  const del = useDeleteCertificate();
  const nav = useNavigate();

  const items = useMemo(() => list.data || [], [list.data]);

  const handleConfirmDelete = () => {
    if (!pendingDel) return;
    del.mutate(pendingDel.certificateId, {
      onSuccess: () => {
        toast.success('자격증을 삭제했어요.');
        setPendingDel(null);
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
      <Crumbs items={['MyPage', '내 자격증']} />

      <header className="flex items-end justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink-900">
            내 자격증
          </h1>
          <p className="text-[12.5px] text-ink-500 mt-1">
            취득한 자격증을 정리해두면 자소서·통계에 활용됩니다.
          </p>
        </div>
        <Link to="/my-certificates/new" className="btn-primary">
          <Plus size={14} strokeWidth={2.2} />
          자격증 추가
        </Link>
      </header>

      <section className="card !p-0 overflow-hidden">
        {list.isLoading ? (
          <Loading />
        ) : list.isError ? (
          <ErrorState
            message={
              list.error?.apiMessage || '자격증 목록을 불러오지 못했습니다.'
            }
            onRetry={() => list.refetch()}
          />
        ) : items.length === 0 ? (
          <Empty />
        ) : (
          <ol className="divide-y divide-ink-150">
            {items.map((c, i) => (
              <CertRow
                key={c.certificateId}
                index={i + 1}
                item={c}
                onEdit={() => nav(`/my-certificates/${c.certificateId}/edit`)}
                onDelete={() => setPendingDel(c)}
              />
            ))}
          </ol>
        )}
      </section>

      {/* 삭제 확인 모달 */}
      <Modal
        open={!!pendingDel}
        onClose={() => (del.isPending ? null : setPendingDel(null))}
        title="삭제하시겠습니까?"
        sub={
          pendingDel
            ? `'${pendingDel.certificateName || '이 자격증'}' 항목이 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`
            : ''
        }
        width={420}
        footer={
          <>
            <button
              type="button"
              className="btn-default"
              disabled={del.isPending}
              onClick={() => setPendingDel(null)}
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
    </>
  );
}

/* ---------- 행 ---------- */
