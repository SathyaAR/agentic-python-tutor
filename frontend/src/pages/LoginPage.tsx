import { useState } from 'react';
import { Link } from 'react-router-dom';
import { USE_MOCK_API } from '../api/client';
import { resetMockDb } from '../api/mock/server';
import { DEMO_USER } from '../api/mock/data';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  const [resetDone, setResetDone] = useState(false);
  return (
    <AuthLayout
      title="Log in"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:text-primary-hover">
            Sign up
          </Link>
        </>
      }
    >
      <LoginForm />
      {USE_MOCK_API && (
        <div className="mt-4 rounded-md bg-accent/25 px-3 py-2 text-xs leading-relaxed">
          <strong>Demo mode.</strong> Log in as <code>{DEMO_USER.username}</code> / <code>{DEMO_USER.password}</code>{' '}
          (assessment already done), or sign up to take the assessment.{' '}
          <button
            type="button"
            className="font-semibold text-primary underline underline-offset-2"
            onClick={() => {
              resetMockDb();
              setResetDone(true);
            }}
          >
            {resetDone ? 'Demo data reset ✓' : 'Reset demo data'}
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
