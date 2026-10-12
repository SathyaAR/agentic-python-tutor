import type { CurriculumEntry, TopicStatus } from '../types/api';
import { ProgressBar } from './ProgressBar';

const BADGE: Record<TopicStatus, { label: string; className: string }> = {
  completed: { label: 'Completed', className: 'bg-success/10 text-success' },
  current: { label: 'Current', className: 'bg-accent text-text' },
  locked: { label: 'Locked', className: 'bg-background text-text-muted' },
};

interface Props {
  entries: CurriculumEntry[];
  onStartCurrent: () => void;
  starting: boolean;
}

/** Ordered topic list; only the `current` row is clickable (frontend-spec.md §4). */
export function CurriculumTrack({ entries, onStartCurrent, starting }: Props) {
  const sorted = [...entries].sort((a, b) => a.order_index - b.order_index);
  return (
    <ol className="card divide-y divide-border overflow-hidden">
      {sorted.map((entry, i) => {
        const badge = BADGE[entry.status];
        const content = (
          <>
            <span className="flex min-w-0 items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  entry.status === 'completed'
                    ? 'bg-success text-white'
                    : entry.status === 'current'
                      ? 'bg-primary text-white'
                      : 'bg-background text-text-muted'
                }`}
                aria-hidden
              >
                {entry.status === 'completed' ? '✓' : i + 1}
              </span>
              <span className="truncate font-medium">{entry.topic_name}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3 sm:gap-5">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
              <span className="hidden sm:inline-flex">
                <ProgressBar level={entry.mastery_level} />
              </span>
            </span>
          </>
        );
        const row = 'flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left';
        return (
          <li key={entry.id} className={entry.status === 'locked' ? 'opacity-55' : ''}>
            {entry.status === 'current' ? (
              <button
                type="button"
                onClick={onStartCurrent}
                disabled={starting}
                className={`${row} border-l-4 border-primary bg-primary/5 transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary`}
              >
                {content}
              </button>
            ) : (
              <div className={row}>{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
