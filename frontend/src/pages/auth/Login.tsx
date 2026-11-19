import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

interface LocationState {
  message?: string;
  email?: string;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  const [email, setEmail] = useState<string>(locationState?.email || '');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage] = useState<string | null>(locationState?.message || null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const loggedInUser = await login(email, password);
      // Route user strictly into their authenticated role module
      navigate(`/${loggedInUser.role}/dashboard`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo & Heading */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 no-underline mb-2">
            <svg
              className="h-10 w-10 text-primary mx-auto"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            </svg>
          </Link>
          <h1 className="text-3xl font-extrabold text-primary-text">Welcome to AnnaSathi AI</h1>
          <p className="mt-1 text-sm text-secondary-text">
            Sign in to access food donation, collection, and delivery workflows
          </p>
        </div>

        {/* Card Form */}
        <div className="mt-6 card p-6 shadow-md border border-border">
          {/* Post-Registration Success Notification */}
          {successMessage && (
            <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-md p-3 flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-danger/10 border border-danger/30 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-secondary-text hover:text-primary-text p-1 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full justify-center flex items-center gap-2 mt-2"
              disabled={isSubmitting}
            >
              <LogIn size={18} />
              <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-sm text-secondary-text">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Register as a New User
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
