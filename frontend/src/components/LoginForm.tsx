import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { CredentialsForm } from './CredentialsForm';

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  return (
    <CredentialsForm
      submitLabel="Log In"
      busyLabel="Logging in…"
      passwordAutoComplete="current-password"
      onSubmit={async (creds) => {
        await login(creds);
        // HomePage redirects to /assessment if it isn't done yet (frontend-spec.md §8).
        navigate('/curriculum', { replace: true });
      }}
    />
  );
}
