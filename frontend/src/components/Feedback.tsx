// Shared loading / error states (frontend-spec.md §7).

export function LoadingLabel({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
      {label}
    </div>
  );
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">
          Retry
        </button>
      )}
    </div>
  );
}
