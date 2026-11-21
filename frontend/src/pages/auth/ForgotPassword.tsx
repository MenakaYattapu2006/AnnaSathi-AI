import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  // Step 1: Request OTP | Step 2: Verify OTP & Set New Password
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Step 1: Request OTP via Brevo
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await apiClient.auth.forgotPassword(email.trim());
      setStep(2);
      setResendCooldown(60);
      setSuccess(`Verification code dispatched to ${email.trim()}. Please check your inbox.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      await apiClient.auth.forgotPassword(email.trim());
      setResendCooldown(60);
      setSuccess('A fresh reset code has been sent to your email.');
    } catch (err: any) {
      setError(err?.message || 'Failed to resend reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2: Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.auth.resetPassword(email.trim(), cleanOtp, newPassword);
      // Navigate to login with success message
      navigate('/login', {
        state: {
          message: 'Password reset successfully! Please sign in with your new password.',
          email: email.trim(),
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. The code may be expired or invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between text-slate-900 dark:text-slate-100 font-sans antialiased bg-slate-50 dark:bg-[#090D10] relative selection:bg-brand-900 selection:text-white transition-colors duration-200">
      {/* Subtle Dot Grid Background */}
      <div className="fixed inset-0 grid-bg-pattern pointer-events-none z-0" />

      {/* Ambient Top Lighting */}
      <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full border-b border-slate-200/80 dark:border-[#1E293B] bg-white/70 dark:bg-[#11171D]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-900 via-emerald-800 to-teal-700 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-900/10 transition-transform group-hover:scale-105">
              <KeyRound className="w-5 h-5 text-emerald-300" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              AnnaSathi AI
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Brevo Email Verification Protected</span>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#11171D] rounded-2xl border border-slate-200/90 dark:border-[#1E293B] shadow-premium p-8 sm:p-10 relative overflow-hidden transition-colors">
            {/* Accent Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-900 via-emerald-600 to-teal-500" />

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/40 text-brand-900 dark:text-emerald-300 mb-4 shadow-sm">
                <KeyRound className="w-6 h-6 text-brand-900 dark:text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {step === 1 ? 'Reset Your Password' : 'Enter Verification Code'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                {step === 1
                  ? 'Enter your registered email to receive a secure recovery code via Brevo'
                  : `Enter the 6-digit code sent to ${email} and choose your new password`}
              </p>
            </div>

            {/* Notifications */}
            {success && (
              <div className="mb-6 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl p-3.5 flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">{success}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl p-3.5 flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* Step 1: Request OTP */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label
                    htmlFor="email-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
                  >
                    Registered Email Address
                  </label>
                  <div className="relative rounded-lg shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      placeholder="name@example.com"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-900 dark:focus:border-emerald-500 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 dark:bg-[#131B22] hover:bg-white dark:hover:bg-[#18222b] transition-all placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-900 hover:bg-[#134E3F] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-900/40 transition-all disabled:opacity-60 cursor-pointer"
                >
                  <span>{isLoading ? 'Dispatching Reset Code...' : 'Send Recovery Code'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Step 2: Verify OTP & Enter New Password */}
            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* 6-Digit OTP Input */}
                <div>
                  <label
                    htmlFor="otp-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
                  >
                    6-Digit Security Code
                  </label>
                  <input
                    id="otp-input"
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      setError(null);
                    }}
                    placeholder="123456"
                    className="block w-full py-2.5 px-3 text-center text-xl font-bold tracking-[8px] text-brand-900 dark:text-emerald-400 border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-900 dark:focus:border-emerald-500 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 dark:bg-[#131B22] outline-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-slate-400">Valid for 10 minutes</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isLoading}
                      className="text-xs text-brand-900 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
                  >
                    New Password
                  </label>
                  <div className="relative rounded-lg shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Min. 8 characters"
                      className="block w-full pl-10 pr-10 py-2 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-900 dark:focus:border-emerald-500 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 dark:bg-[#131B22] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative rounded-lg shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Confirm password"
                      className="block w-full pl-10 pr-10 py-2 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-900 dark:focus:border-emerald-500 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 dark:bg-[#131B22] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-900 hover:bg-[#134E3F] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-900/40 transition-all disabled:opacity-60 cursor-pointer"
                >
                  <span>{isLoading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Back to Step 1 */}
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 pt-1 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change email address</span>
                </button>
              </form>
            )}

            {/* Back to Sign In */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-[#1E293B] text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-brand-900 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  Back to Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-[#1E293B] bg-white/60 dark:bg-[#11171D]/60 backdrop-blur-xs py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} AnnaSathi AI Technologies Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Security Desk</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ForgotPassword;
