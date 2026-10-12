import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { CredentialsForm } from './CredentialsForm';

export function SignupForm() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  return (
    <CredentialsForm
      submitLabel="Create account"
      busyLabel="Creating account…"
      passwordAutoComplete="new-password"
      onSubmit={async (creds) => {
        await signup(creds);
        // A brand-new user has no curriculum yet (frontend-spec.md §6).
        navigate('/assessment', { replace: true });
      }}
    />
  );
}
