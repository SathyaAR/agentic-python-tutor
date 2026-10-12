import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError, errorMessage } from '../api/client';
import { useCurriculum, useNextLesson } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { CurriculumTrack } from '../components/CurriculumTrack';
import { ErrorMessage, LoadingLabel } from '../components/Feedback';

export function HomePage() {
  const { username } = useAuth();
  const navigate = useNavigate();
  const curriculum = useCurriculum();
  const nextLesson = useNextLesson();

  // 404 "assessment not completed" means: go take the assessment (frontend-spec.md §8).
  if (curriculum.error instanceof ApiError && curriculum.error.status === 404) {
    return <Navigate to="/assessment" replace />;
  }
  if (curriculum.isLoading) return <LoadingLabel label="Loading your curriculum…" />;
  if (curriculum.error) {
    return <ErrorMessage message={errorMessage(curriculum.error)} onRetry={() => curriculum.refetch()} />;
  }

  const entries = curriculum.data ?? [];
  const current = entries.find((e) => e.status === 'current');
  const completed = entries.filter((e) => e.status === 'completed').length;
  const avgMastery = entries.length ? entries.reduce((s, e) => s + e.mastery_level, 0) / entries.length : 0;

  const startLesson = () =>
    nextLesson.mutate(undefined, { onSuccess: (lesson) => navigate(`/lessons/${lesson.id}`) });

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Welcome to PyMentor{username ? `, ${username}` : ''}</h1>
        <p className="mt-1 text-text-muted">Your personalized Python curriculum, built from your assessment.</p>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Topics completed" value={`${completed} / ${entries.length}`} />
        <Stat label="Average mastery" value={`${avgMastery.toFixed(1)} / 5`} />
        <Stat label="Up next" value={current?.topic_name ?? 'All done 🎉'} className="col-span-2 sm:col-span-1" />
      </section>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        {current ? (
          <button type="button" className="btn-primary px-5 py-2.5" onClick={startLesson} disabled={nextLesson.isPending}>
            {nextLesson.isPending ? 'Preparing your lesson…' : `Continue Learning — ${current.topic_name}`}
          </button>
        ) : (
          <p className="rounded-md bg-success/10 px-4 py-2 text-sm font-medium text-success">
            You&apos;ve completed every topic in your curriculum. Nice work!
          </p>
        )}
      </div>
      {nextLesson.error && (
        <div className="mb-4">
          <ErrorMessage message={errorMessage(nextLesson.error)} onRetry={startLesson} />
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Your learning path</h2>
      <CurriculumTrack entries={entries} onStartCurrent={startLesson} starting={nextLesson.isPending} />
    </div>
  );
}

function Stat({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`card px-4 py-3 ${className}`}>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-0.5 truncate font-semibold">{value}</p>
    </div>
  );
}
