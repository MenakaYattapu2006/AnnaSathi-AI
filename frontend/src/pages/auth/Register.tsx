import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  AlertCircle,
  UserPlus,
  Mail,
  Lock,
  Phone,
  User,
  Building2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/user';

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
    <div className="min-h-screen flex flex-col justify-between text-slate-900 font-sans antialiased bg-slate-50 relative selection:bg-brand-900 selection:text-white">
      {/* Subtle Dot Grid Background */}
      <div className="fixed inset-0 grid-bg-pattern pointer-events-none z-0" />

      {/* Ambient Top Lighting */}
      <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Global Header Bar */}
      <header className="w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="w-9 h-9 rounded-lg bg-brand-900 flex items-center justify-center text-white font-bold tracking-wider shadow-sm">
              AS
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                AnnaSathi AI
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700/80 mt-0.5">
                Enterprise Logistics Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Zero-Waste Operations Live</span>
            </div>
            <span className="hidden md:inline-block text-slate-300">|</span>
            <div className="hidden md:flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>256-Bit TLS Secured</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-12 relative z-10">
        <div className="w-full max-w-lg">
          {/* Premium Registration Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-premium p-8 sm:p-10 relative overflow-hidden">
            {/* Accent Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-900 via-emerald-600 to-teal-500" />

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 border border-emerald-100 text-brand-900 mb-4 shadow-sm">
                <UserPlus className="w-6 h-6 text-brand-900" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Create Partner Account
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Join the AnnaSathi AI zero-waste food distribution network
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3.5 flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="register-name"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="register-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    placeholder="e.g. Ramesh Varma"
                    className="block w-full pl-10 pr-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-lg focus:border-brand-900 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 hover:bg-white transition-all placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="register-email"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="register-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-lg focus:border-brand-900 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 hover:bg-white transition-all placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="register-phone"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Phone Number
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="register-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError(null);
                    }}
                    placeholder="+91 98765 43210"
                    className="block w-full pl-10 pr-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-lg focus:border-brand-900 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 hover:bg-white transition-all placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="register-password"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400">Min 6 characters</span>
                </div>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter secure password"
                    className="block w-full pl-10 pr-10 py-2 text-sm text-slate-900 border border-slate-300 rounded-lg focus:border-brand-900 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 hover:bg-white transition-all placeholder:text-slate-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Your Operational Role
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['donor', 'ngo', 'volunteer'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border text-center uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                        role === r
                          ? 'bg-brand-900 text-white border-brand-900 shadow-sm'
                          : 'bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Organization Name (if donor or ngo) */}
              {(role === 'donor' || role === 'ngo') && (
                <div>
                  <label
                    htmlFor="org-name"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    {role === 'ngo' ? 'Organization / Trust Name' : 'Company / Restaurant Name (Optional)'}
                  </label>
                  <div className="relative rounded-lg shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      id="org-name"
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder={role === 'ngo' ? 'e.g. Karuna Seva Trust' : 'e.g. Paradise Kitchens'}
                      className="block w-full pl-10 pr-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-lg focus:border-brand-900 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 hover:bg-white transition-all placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-900 hover:bg-[#134E3F] text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-900/40 focus:ring-offset-2 transition-all duration-150 disabled:opacity-60 cursor-pointer mt-4"
              >
                <span>{isSubmitting ? 'Creating Partner Account...' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Already registered?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-brand-900 hover:text-emerald-700 underline decoration-emerald-500/30 underline-offset-4 transition-colors"
                >
                  Sign in with existing credentials
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white/60 backdrop-blur-xs py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} AnnaSathi AI Technologies Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Compliance</span>
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Security Desk</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Register;
