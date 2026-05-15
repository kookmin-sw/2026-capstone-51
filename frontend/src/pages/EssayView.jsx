import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, ArrowLeft } from 'lucide-react';
import Crumbs from '../components/Crumbs';
import { Card } from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { useEssay } from '../api/queries/useEssays';
import { PROGRESS_LABEL, PROGRESS_TONE } from '../lib/enums';

/* ------------------------------------------------------------------ *
 * 자소서 열람 (백엔드 GET /essays/:id).
 *  - useEssay(id) → normalizeEssayDetail 어댑터로 globalReq/updatedAt 통일.
 *  - questions[].question/response/maxLength 백엔드 키 그대로 사용.
 *  - 친구 mock 의 UsedExperiences (q.used) 는 백엔드 QuestionResponse 가 relatedExperience
 *    필드를 안 주므로 표시하지 않음 (수정 모드에서 추천 받아 새로 선택만 가능).
 * ------------------------------------------------------------------ */

export default function EssayView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const q = useEssay(id);

  if (q.isLoading) {
    return (
      <>
        <Crumbs items={['자소서', '관리', '열람']} />
        <Card className="text-center text-[13px] text-ink-500 py-12">
          불러오는 중…
        </Card>
      </>
    );
  }

  if (q.isError || !q.data) {
    return (
      <>
        <Crumbs items={['자소서', '관리', '열람']} />
        <Card className="text-center py-10">
          <p className="text-[13px] text-ink-700 mb-3">
            {q.error?.apiMessage || '자소서를 불러오지 못했습니다.'}
          </p>
          <Button onClick={() => navigate('/essays')}>
            <ArrowLeft size={13} /> 목록으로
          </Button>
        </Card>
      </>
    );
  }

  const essay = q.data;
  const questions = essay.questions ?? [];
  const progress = essay.progress ?? 'IN_PROGRESS';

  return (
    <>
      <Crumbs items={['자소서', '관리', essay.companyName || '열람']} />
      <div className="page-h flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h1>{essay.companyName || '(회사명 없음)'}</h1>
          <div className="sub flex items-center gap-2">
            {essay.wishJob || '(직무 미입력)'}
            <Badge tone={PROGRESS_TONE[progress] ?? 'gray'}>
              {PROGRESS_LABEL[progress] ?? progress}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/essays')}>
            <ArrowLeft size={13} /> 목록으로
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate(`/essays/${id}/edit`)}
          >
            <Pencil size={13} /> 수정하기
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-3">
          지원 정보
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="회사명" value={essay.companyName} />
          <Field label="희망 직무" value={essay.wishJob} />
        </div>
        <div className="mt-3">
          <Field label="공통 요구사항" value={essay.globalReq} multiline />
        </div>
      </Card>

      {questions.length === 0 ? (
        <Card className="text-center text-[13px] text-ink-500 py-12">
          아직 등록된 문항이 없습니다.
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {questions.map((qq, i) => (
            <Card key={qq.questionId ?? i}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-6 h-6 rounded-full bg-primary-900 text-white grid place-items-center text-[11px] font-bold">
                  Q{qq.questionNum ?? i + 1}
                </span>
                <span className="text-[11px] text-ink-500 font-semibold">
                  {qq.maxLength}자 이내
                </span>
              </div>
              <div className="text-[14.5px] font-bold text-ink-900 leading-relaxed mb-3">
                {qq.question}
              </div>
              {qq.response ? (
                <div className="text-[13.5px] leading-[1.75] text-ink-800 whitespace-pre-wrap break-keep">
                  {qq.response}
                </div>
              ) : (
                <div className="text-[12.5px] text-ink-400 italic">
                  아직 작성되지 않았습니다.
                </div>
              )}
              {qq.response && (
                <div className="text-right text-[11.5px] text-ink-500 font-mono mt-3">
                  {qq.response.length} / {qq.maxLength}
                </div>
              )}
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
