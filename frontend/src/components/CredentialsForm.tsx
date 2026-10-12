import { useState, type FormEvent } from 'react';
import { errorMessage } from '../api/client';
import { ErrorMessage } from './Feedback';
import type { Credentials } from '../types/api';

interface Props {
  submitLabel: string;
  busyLabel: string;
  passwordAutoComplete: 'current-password' | 'new-password';
  onSubmit: (creds: Credentials) => Promise<void>;
}

/** Username + password form shared by LoginForm and SignupForm. */
export function CredentialsForm({ submitLabel, busyLabel, passwordAutoComplete, onSubmit }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter both a username and a password.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onSubmit({ username: username.trim(), password });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="username" className="text-sm font-medium">Username</label>
        <input
          id="username"
          className="input"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <input
          id="password"
          type="password"
          className="input"
          autoComplete={passwordAutoComplete}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <ErrorMessage message={error} />}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? busyLabel : submitLabel}
      </button>
    </form>
  );
}
