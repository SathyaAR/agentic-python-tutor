import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { SignupForm } from '../components/SignupForm';

export function SignupPage() {
  return (
    <AuthLayout
      title="Create your account"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthLayout>
  );
}
