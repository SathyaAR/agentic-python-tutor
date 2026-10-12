import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { useAssessment, useCurriculum, useSubmitAssessment } from '../api/hooks';
import { AssessmentQuestion } from '../components/AssessmentQuestion';
import { ErrorMessage, LoadingLabel } from '../components/Feedback';

export function AssessmentPage() {
  const navigate = useNavigate();
  const curriculum = useCurriculum();
  const questions = useAssessment();
  const submit = useSubmitAssessment();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Already assessed? The assessment is one-time (api-contract-spec.md §4), so go Home.
  if (curriculum.isSuccess && !submit.isPending && !submit.isSuccess) return <Navigate to="/curriculum" replace />;

  if (questions.isLoading) return <LoadingLabel label="Loading your assessment…" />;
  if (questions.error) return <ErrorMessage message={errorMessage(questions.error)} onRetry={() => questions.refetch()} />;
  const list = questions.data ?? [];

  const unansweredMcq = list.filter((q) => q.type === 'mcq' && !answers[q.id]).length;
  const answeredCount = list.filter((q) => answers[q.id]?.trim()).length;

  const handleSubmit = () => {
    submit.mutate(
      list.map((q) => ({ question_id: q.id, answer: answers[q.id] ?? '' })),
      { onSuccess: () => navigate('/curriculum', { replace: true }) },
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Skill assessment</h1>
        <p className="mt-1 text-text-muted">
          A quick diagnostic so PyMentor can build a curriculum around what you already know. Leave a code question
          blank if you&apos;re not sure — that&apos;s useful signal too.
        </p>
      </header>

      <div className="space-y-4">
        {list.map((q, i) => (
          <AssessmentQuestion
            key={q.id}
            question={q}
            index={i}
            answer={answers[q.id] ?? ''}
            onChange={(a) => setAnswers((prev) => ({ ...prev, [q.id]: a }))}
          />
        ))}
      </div>

      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 py-4 backdrop-blur">
        <span className="text-sm text-text-muted">
          {answeredCount} of {list.length} answered
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {submit.isPending && <LoadingLabel label="Building your personalized curriculum…" />}
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={unansweredMcq > 0 || submit.isPending}>
            {unansweredMcq > 0 ? `Answer ${unansweredMcq} more to submit` : 'Submit assessment'}
          </button>
        </div>
      </div>
      {submit.error && <ErrorMessage message={errorMessage(submit.error)} onRetry={handleSubmit} />}
    </div>
  );
}
