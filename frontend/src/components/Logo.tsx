export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-12 w-12 text-lg' : 'h-8 w-8 text-sm';
  const text = size === 'lg' ? 'text-3xl' : 'text-lg';
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`${box} inline-flex items-center justify-center rounded-lg bg-primary font-bold text-accent`}>
        Py
      </span>
      <span className={`${text} font-bold tracking-tight text-text`}>PyMentor</span>
    </span>
  );
}
