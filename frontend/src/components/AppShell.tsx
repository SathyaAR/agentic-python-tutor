import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { USE_MOCK_API } from '../api/client';
import { Logo } from './Logo';

/** Header for authenticated pages; the logo always links Home (frontend-spec.md §3). */
export function AppShell() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/curriculum" aria-label="PyMentor home" className="rounded focus-visible:ring-2 focus-visible:ring-primary">
            <Logo />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-text-muted sm:inline">
              Logged in as <span className="font-semibold text-text">{username}</span>
            </span>
            <button type="button" onClick={handleLogout} className="btn-secondary px-3 py-1.5">
              Log out
            </button>
          </div>
        </div>
      </header>
      {USE_MOCK_API && (
        <div className="bg-accent/30 px-4 py-1.5 text-center text-xs text-text">
          Demo mode — using an in-browser mock API. Grading and tutor replies are simulated.
        </div>
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
