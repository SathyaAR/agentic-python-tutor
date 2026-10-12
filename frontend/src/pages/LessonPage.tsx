import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { useCurriculum, useLesson, useNextLesson, useSubmitCode } from '../api/hooks';
import { CodeEditor } from '../components/CodeEditor';
import { ErrorMessage, LoadingLabel } from '../components/Feedback';
import { ProgressBar } from '../components/ProgressBar';
import { SubmissionResult } from '../components/SubmissionResult';
import { TutorChat } from '../components/TutorChat';
import { renderInlineCode } from '../components/InlineCode';
import type { LessonSession } from '../types/api';

export function LessonPage() {
  const { lessonId = '' } = useParams();
  const lesson = useLesson(lessonId);

  return (
    <div>
      <Link to="/curriculum" className="mb-4 inline-block text-sm font-medium text-primary hover:text-primary-hover">
        ← Back to Curriculum
      </Link>
      {lesson.isLoading && <LoadingLabel label="Loading your lesson…" />}
      {lesson.error && <ErrorMessage message={errorMessage(lesson.error)} onRetry={() => lesson.refetch()} />}
      {/* key: reset editor state when navigating to the next lesson */}
      {lesson.data && <LessonBody key={lesson.data.id} lesson={lesson.data} />}
    </div>
  );
}

function LessonBody({ lesson }: { lesson: LessonSession }) {
  const navigate = useNavigate();
  const curriculum = useCurriculum();
  const submit = useSubmitCode(lesson.id);
  const nextLesson = useNextLesson();
  const [code, setCode] = useState(lesson.starter_code);

  const mastery = curriculum.data?.find((e) => e.topic_id === lesson.topic_id)?.mastery_level;
  const result = submit.data ?? lesson.latest_submission ?? null;
  const passed = lesson.status === 'passed' || submit.data?.status === 'passed';

  const goNext = () =>
    nextLesson.mutate(undefined, {
      onSuccess: (next) => navigate(`/lessons/${next.id}`),
      onError: () => navigate('/curriculum'), // 400: curriculum finished
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-4">
        <section className="card p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-sm font-bold uppercase tracking-wider text-primary">{lesson.topic_name}</h1>
            {mastery !== undefined && <ProgressBar level={mastery} />}
          </div>
          <p className="leading-relaxed">{renderInlineCode(lesson.explanation)}</p>
        </section>

        <section className="card p-5">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Exercise</h2>
          <p className="mb-4">{renderInlineCode(lesson.exercise_prompt)}</p>
          <p className="mb-1.5 font-mono text-xs text-text-muted">exercise.py</p>
          <CodeEditor value={code} onChange={setCode} readOnly={passed} />
          <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
            {submit.isPending && <LoadingLabel label="Grading your code…" />}
            {!passed && (
              <button type="button" className="btn-secondary" onClick={() => setCode(lesson.starter_code)} disabled={submit.isPending}>
                Reset
              </button>
            )}
            <button
              type="button"
              className="btn-primary"
              onClick={() => submit.mutate(code)}
              disabled={submit.isPending || passed}
            >
              {passed ? 'Passed ✓' : 'Submit'}
            </button>
          </div>
          {submit.error && (
            <div className="mt-3">
              <ErrorMessage message={errorMessage(submit.error)} onRetry={() => submit.mutate(code)} />
            </div>
          )}
        </section>

        {result && <SubmissionResult submission={result} onNextLesson={goNext} nextBusy={nextLesson.isPending} />}
      </div>

      <TutorChat lessonId={lesson.id} />
    </div>
  );
}
