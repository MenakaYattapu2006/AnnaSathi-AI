import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { DEMO_ACCOUNTS, type DemoAccount } from '../../mocks/demo-credentials';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectDemoAccount = (account: DemoAccount) => {
    setSelectedDemoRole(account.role);
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const loggedInUser = await login(email, password);
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

        {/* Administrator Quick-Access & Clean State Notice */}
        <div className="mt-6 bg-surface-container-low border border-primary/20 rounded-lg p-3 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Sparkles className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-primary-text uppercase tracking-wide">
                  Clean Database State
                </p>
                <p className="text-xs text-secondary-text mt-0.5">
                  Register fresh Donor, NGO, or Volunteer accounts via{' '}
                  <Link to="/register" className="text-primary font-semibold hover:underline">
                    Create Account
                  </Link>
                  . Use Administrator to verify newly registered NGOs.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedDemoRole('admin');
                setEmail('admin@annasathi.org');
                setPassword('demo@admin123');
                setError(null);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded border border-primary bg-primary text-white hover:bg-primary/90 whitespace-nowrap shadow-sm"
            >
              Fill Admin
            </button>
          </div>
        </div>

        {/* Card Form */}
        <div className="mt-4 card p-6 shadow-md border border-border">
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
