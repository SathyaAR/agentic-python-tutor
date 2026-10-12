import type { Submission } from '../types/api';
import { renderInlineCode } from './InlineCode';

const STATUS = {
  passed: { label: 'All tests passed', className: 'text-success' },
  partial: { label: 'Some tests passed', className: 'text-text' },
  failed: { label: 'Tests failed', className: 'text-error' },
} as const;

interface Props {
  submission: Submission;
  onNextLesson?: () => void;
  nextBusy?: boolean;
}

/** Per-test results + Code Reviewer feedback + "Next Lesson" on pass (frontend-spec.md §4). */
export function SubmissionResult({ submission, onNextLesson, nextBusy }: Props) {
  const status = STATUS[submission.status];
  const passedCount = submission.test_results.filter((t) => t.passed).length;
  return (
    <section className="card p-5" aria-live="polite">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className={`font-semibold ${status.className}`}>
          {status.label}{' '}
          <span className="font-normal text-text-muted">
            ({passedCount}/{submission.test_results.length})
          </span>
        </h3>
        {submission.mastery_level !== undefined && (
          <span className="text-xs text-text-muted">Mastery now {submission.mastery_level}/5</span>
        )}
      </div>
      <ul className="space-y-1.5 font-mono text-sm">
        {submission.test_results.map((t, i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-x-2">
            <span className={t.passed ? 'text-success' : 'text-error'} aria-label={t.passed ? 'passed' : 'failed'}>
              {t.passed ? '✓' : '✗'}
            </span>
            <span>
              {t.input} → {t.expected_output}
            </span>
            {!t.passed && <span className="text-text-muted">(got {t.actual_output})</span>}
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Code review</p>
        <p className="text-sm leading-relaxed">{renderInlineCode(submission.reviewer_feedback)}</p>
      </div>
      {submission.status === 'passed' && onNextLesson && (
        <div className="mt-4 flex justify-end">
          <button type="button" className="btn-primary" onClick={onNextLesson} disabled={nextBusy}>
            {nextBusy ? 'Preparing your next lesson…' : submission.advanced === false ? 'Back to Curriculum' : 'Next Lesson →'}
          </button>
        </div>
      )}
    </section>
  );
}
