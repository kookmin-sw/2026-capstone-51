import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2, FileText } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import Modal from '../components/Modal';
import CertificateForm from '../components/certificate/CertificateForm';
import {
  useCertificates,
  useUpdateCertificate,
  useDeleteCertificate,
} from '../api/queries/useCertificates';
import { toast } from '../store/useToast';

/**
 * /my-certificates/:id — 자격증 열람 + 수정 + 삭제.
 *
 * 모드:
 *  - view: 자격증명·발급기관·취득일·유효기간·자격증번호 + 첨부 PDF 다운로드 링크 (item.fileUrl).
 *  - edit: 같은 CertificateForm 으로 토글 → PUT /certificates/:id (PDF 새로 첨부 시 presigned 흐름 자동).
 *
 * 백엔드 단건 GET 없음 — 목록 캐시에서 ID 매칭 (EditCertificate 패턴 차용).
 * 삭제 확인은 모달.
 */
export default function CertificateDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const list = useCertificates();
  const update = useUpdateCertificate();
  const del = useDeleteCertificate();

  const item = useMemo(
    () => (list.data || []).find((c) => c.certificateId === id),
    [list.data, id]
  );

  const [mode, setMode] = useState('view'); // 'view' | 'edit'
  const [confirmDelOpen, setConfirmDelOpen] = useState(false);

  const crumbs = [
    'MyPage',
    { label: '내 자격증', to: '/my-certificates' },
    '열람',
  ];

  if (list.isLoading) {
    return (
      <>
        <Crumbs items={crumbs} />
        <div className="card animate-pulse">
          <div className="h-4 w-32 bg-ink-100 rounded mb-3" />
          <div className="h-6 w-2/3 bg-ink-100 rounded mb-4" />
          <div className="h-3 w-full bg-ink-100 rounded mb-2" />
          <div className="h-3 w-5/6 bg-ink-100 rounded" />
        </div>
      </>
    );
  }
  if (list.isError) {
    return (
      <>
        <Crumbs items={crumbs} />
        <div className="card text-center py-8">
          <p className="text-[13px] text-ink-700 mb-3">
            {list.error?.apiMessage || '자격증을 불러오지 못했습니다.'}
          </p>
          <button
            type="button"
            onClick={() => list.refetch()}
            className="btn-default"
          >
            다시 시도
          </button>
        </div>
      </>
    );
  }
  if (!item) {
    return (
      <>
        <Crumbs items={crumbs} />
        <div className="card text-center py-8">
          <p className="text-[13px] text-ink-700 mb-3 break-keep">
            해당 자격증을 찾을 수 없어요. 목록에서 다시 선택해주세요.
          </p>
          <button
            type="button"
            onClick={() => nav('/my-certificates')}
            className="btn-default"
          >
            목록으로
          </button>
        </div>
      </>
    );
  }

  const handleSave = (body) => {
    update.mutate(
      { id, body },
      {
        onSuccess: () => {
          toast.success('자격증을 저장했어요.');
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
        toast.success('자격증을 삭제했어요.');
        setConfirmDelOpen(false);
        nav('/my-certificates');
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
      <Crumbs items={crumbs} />

      <header className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-[12px] text-ink-500 mb-1.5">자격증</div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink-900 break-keep">
            {item.certificateName || '(이름 없음)'}
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
        sub={`'${item.certificateName || '이 자격증'}' 항목이 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
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
          <CertificateForm
            initialValue={item}
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
              <Item label="발급 기관" value={item.issuingOrganization} />
              <Item label="자격증 번호" value={item.certificateCode} />
              <Item label="취득일" value={fmtDate(item.getDate)} />
              <Item
                label="유효기간"
                value={
                  item.expirationDate
                    ? fmtDate(item.expirationDate)
                    : '기간 제한 없음'
                }
              />
            </dl>
          </section>

          <section className="card">
            <h2 className="text-[14px] font-bold text-ink-900 mb-2">
              증빙 자료
            </h2>
            {item.fileUrl ? (
              <a
                href={item.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-ink-200 bg-paper px-4 py-3 flex items-center gap-3 hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
              >
                <FileText
                  size={20}
                  strokeWidth={1.6}
                  className="text-primary-600 shrink-0"
                />
                <div className="flex-1 min-w-0 text-[13px] font-semibold text-ink-900">
                  첨부 PDF 보기
                </div>
                <span className="text-[11.5px] text-ink-500">
                  새 탭에서 열기 ↗
                </span>
              </a>
            ) : (
              <div className="rounded-md border border-dashed border-ink-300 bg-ink-50/40 px-4 py-5 flex items-center gap-3">
                <FileText
                  size={20}
                  strokeWidth={1.6}
                  className="text-ink-400 shrink-0"
                />
                <div className="text-[12.5px] text-ink-500 break-keep">
                  첨부된 자료가 없어요. 수정에서 PDF 를 추가할 수 있어요.
                </div>
              </div>
            )}
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

function fmtDate(d) {
  if (!d) return '';
  return d.slice(0, 10).replaceAll('-', '.');
}
