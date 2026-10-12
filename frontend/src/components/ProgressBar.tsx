/** Mastery indicator, 0–5 dots (frontend-spec.md §4). */
export function ProgressBar({ level, max = 5 }: { level: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`Mastery ${level} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${i < level ? 'bg-primary' : 'border border-border bg-surface'}`}
        />
      ))}
    </span>
  );
}
