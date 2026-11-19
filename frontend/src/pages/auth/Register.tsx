import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/user';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [role, setRole] = useState<UserRole>('donor');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name,
        email,
        phone,
        password,
        role,
        organizationName: organizationName.trim() || undefined,
      });

      // Redirect to login page - user must authenticate to enter their respective module
      navigate('/login', {
        state: {
          message: 'Account registered successfully! Please sign in with your credentials to access your dashboard.',
          email,
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration failed. Please verify your details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
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
          <h1 className="text-3xl font-extrabold text-primary-text">Create Account</h1>
          <p className="mt-1 text-sm text-secondary-text">
            Join the AnnaSathi AI food donation and hunger prevention network
          </p>
        </div>

        <div className="mt-6 card p-6 shadow-md border border-border">
          {error && (
            <div className="mb-4 bg-danger/10 border border-danger/30 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Ramesh Varma"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              required
            />

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

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError(null);
              }}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
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

            <div>
              <label className="block text-sm font-medium text-primary-text mb-1">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['donor', 'ngo', 'volunteer'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 text-xs font-semibold rounded-md border text-center capitalize transition-colors ${
                      role === r
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface text-primary-text border-border hover:bg-surface-container-low'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {(role === 'donor' || role === 'ngo') && (
              <Input
                label={role === 'ngo' ? 'Organization / Trust Name' : 'Company / Restaurant Name (Optional)'}
                type="text"
                placeholder={role === 'ngo' ? 'e.g. Karuna Seva Trust' : 'e.g. Paradise Kitchens'}
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full justify-center flex items-center gap-2 mt-4"
              disabled={isSubmitting}
            >
              <UserPlus size={18} />
              <span>{isSubmitting ? 'Creating Account...' : 'Complete Registration'}</span>
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-sm text-secondary-text">
              Already registered?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in with existing credentials
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
