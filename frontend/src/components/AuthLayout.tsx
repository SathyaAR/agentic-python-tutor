import type { ReactNode } from 'react';
import { Logo } from './Logo';

/** Centered card layout for /login and /signup (architecture-blueprint.md §1.1). */
export function AuthLayout({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Logo size="lg" />
          <p className="text-sm text-text-muted">Your personalized Python tutor</p>
        </div>
        <div className="card p-6">
          <h1 className="mb-5 text-lg font-semibold">{title}</h1>
          {children}
          <div className="mt-5 border-t border-border pt-4 text-center text-sm text-text-muted">{footer}</div>
        </div>
      </div>
    </div>
  );
}
