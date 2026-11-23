import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  MapPin,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Truck,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/user';

const Register: React.FC = () => {
  const navigate = useNavigate();

  // Step state: 'form' for entering details, 'otp' for Brevo verification
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [role, setRole] = useState<UserRole>('donor');
  const [vehicleType, setVehicleType] = useState<'two_wheeler' | 'four_wheeler' | 'van' | 'none'>('two_wheeler');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Fields
  const [otp, setOtp] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Submit Form & Trigger Brevo OTP
  const handleInitiateRegistration = async (e: React.FormEvent) => {
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
    if (!phone.trim() || phone.trim().length < 8) {
      setError('Please provide a valid phone number (at least 8 digits).');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!address.trim()) {
      setError('Please enter your street address or facility location.');
      return;
    }
    if (!city.trim()) {
      setError('Please enter your city.');
      return;
    }
    if (!state.trim()) {
      setError('Please enter your state.');
      return;
    }
    if (!pincode.trim() || pincode.trim().length < 4) {
      setError('Please enter a valid postal / PIN code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.auth.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
        vehicleType: role === 'volunteer' ? vehicleType : undefined,
        organizationName: organizationName.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      });

      if (response?.success) {
        setStep('otp');
        setOtp('');
        setSimulatedOtp(response?.simulatedOtp || null);
        setResendCooldown(45);
        setSuccessNotice(
          `A 6-digit verification code has been dispatched via Brevo to ${email.trim()}.`
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initiate registration. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify Brevo OTP & Finalize Registration
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setError('Please enter the full 6-digit numeric verification code.');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await apiClient.auth.verifyRegisterOtp(email.trim(), cleanOtp, {
        name: name.trim(),
        phone: phone.trim(),
        password,
        role,
        vehicleType: role === 'volunteer' ? vehicleType : undefined,
        organizationName: organizationName.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      });

      if (response?.success) {
        navigate('/login', {
          state: {
            message:
              'Account successfully verified and created! Please sign in with your credentials to access your dashboard.',
            email: email.trim(),
          },
        });
      }
    } catch (err: any) {
      setError(
        err?.message || 'Invalid or expired verification code. Please check your email and try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP via Brevo
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setError(null);
    setIsResending(true);

    try {
      const res = await apiClient.auth.resendRegisterOtp(email.trim());
      if (res?.success) {
        setSimulatedOtp(res?.simulatedOtp || null);
        setResendCooldown(45);
        setSuccessNotice(`A fresh verification code has been dispatched via Brevo to ${email.trim()}.`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between text-slate-900 dark:text-slate-100 font-sans antialiased bg-slate-50 dark:bg-[#090D10] relative selection:bg-brand-900 selection:text-white transition-colors duration-200">
      {/* Subtle Dot Grid Background */}
      <div className="fixed inset-0 grid-bg-pattern pointer-events-none z-0" />

      {/* Ambient Top Lighting */}
      <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Global Header Bar */}
      <header className="w-full border-b border-slate-200/80 dark:border-[#1E293B] bg-white/70 dark:bg-[#11171D]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-900 via-emerald-800 to-teal-700 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-900/10 transition-transform group-hover:scale-105">
              <svg
                className="w-5 h-5 text-emerald-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill="currentColor" fillOpacity="0.25" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              AnnaSathi AI
            </span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Brevo OTP Protected Registration</span>
            </div>
            <span className="hidden md:inline-block text-slate-300 dark:text-slate-700">|</span>
            <div className="hidden md:flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>TLS Secured</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-12 relative z-10">
        <div className="w-full max-w-xl">
          {/* Registration Card */}
          <div className="bg-white dark:bg-[#11171D] rounded-2xl border border-slate-200/90 dark:border-[#1E293B] shadow-premium p-8 sm:p-10 relative overflow-hidden transition-colors">
            {/* Accent Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-900 via-emerald-600 to-teal-500" />

            {/* Error Notification */}
            {error && (
              <div className="mb-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 rounded-xl p-3.5 flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* STEP 1: Registration Form */}
            {step === 'form' ? (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/40 text-brand-900 dark:text-emerald-300 mb-4 shadow-sm">
                    <UserPlus className="w-6 h-6 text-brand-900 dark:text-emerald-400" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Create Partner Account
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                    Step 1 of 2: Enter your organization or individual details
                  </p>
                </div>

                <form onSubmit={handleInitiateRegistration} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="register-name"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                    >
                      Full Name *
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
                        className="block w-full pl-10 pr-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-900 dark:focus:border-emerald-500 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 dark:bg-[#131B22] hover:bg-white dark:hover:bg-[#18222b] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Email & Phone Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Email Address */}
                    <div>
                      <label
                        htmlFor="register-email"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                      >
                        Email Address *
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
                          className="block w-full pl-10 pr-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-900 dark:focus:border-emerald-500 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 dark:bg-[#131B22] hover:bg-white dark:hover:bg-[#18222b] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label
                        htmlFor="register-phone"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                      >
                        Phone Number *
                      </label>
                      <div className="relative rounded-lg shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          id="register-phone"
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            setError(null);
                          }}
                          placeholder="9876543210"
                          className="block w-full pl-10 pr-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-900 dark:focus:border-emerald-500 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 dark:bg-[#131B22] hover:bg-white dark:hover:bg-[#18222b] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="register-password"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                    >
                      Account Password *
                    </label>
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
                        placeholder="At least 8 characters"
                        className="block w-full pl-10 pr-10 py-2 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-900 dark:focus:border-emerald-500 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 dark:bg-[#131B22] hover:bg-white dark:hover:bg-[#18222b] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Registering As *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('donor')}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                          role === 'donor'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-[#131B22] border-slate-300 dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Food Donor
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('ngo')}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                          role === 'ngo'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-[#131B22] border-slate-300 dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        NGO / Shelter
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('volunteer')}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                          role === 'volunteer'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-[#131B22] border-slate-300 dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Volunteer Rider
                      </button>
                    </div>
                  </div>

                  {/* Registered Vehicle Type (for Volunteer Riders) */}
                  {role === 'volunteer' && (
                    <div>
                      <label
                        htmlFor="register-vehicle"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                      >
                        Registered Vehicle Type *
                      </label>
                      <div className="relative rounded-lg shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Truck className="w-4 h-4" />
                        </div>
                        <select
                          id="register-vehicle"
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value as any)}
                          className="block w-full pl-10 pr-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-900 dark:focus:border-emerald-500 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 dark:bg-[#131B22] hover:bg-white dark:hover:bg-[#18222b] transition-all outline-none"
                        >
                          <option value="two_wheeler">Two-Wheeler (Motorcycle / Scooter / Bike)</option>
                          <option value="four_wheeler">Four-Wheeler (Car / Auto / Hatchback / SUV)</option>
                          <option value="van">Cargo Van / Small Commercial Truck</option>
                          <option value="none">On Foot / Bicycle (Short Distance)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Organization Name (for NGOs and Commercial Donors) */}
                  {role !== 'volunteer' && (
                    <div>
                      <label
                        htmlFor="register-org"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                      >
                        {role === 'ngo' ? 'NGO / Organization Name *' : 'Business / Restaurant Name (Optional)'}
                      </label>
                      <div className="relative rounded-lg shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <input
                          id="register-org"
                          type="text"
                          required={role === 'ngo'}
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          placeholder={role === 'ngo' ? 'e.g. Hope Foundation' : 'e.g. Grand Palace Caterers'}
                          className="block w-full pl-10 pr-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-900 dark:focus:border-emerald-500 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 dark:bg-[#131B22] hover:bg-white dark:hover:bg-[#18222b] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  <div>
                    <label
                      htmlFor="register-address"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                    >
                      Street / Facility Address *
                    </label>
                    <div className="relative rounded-lg shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <input
                        id="register-address"
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Aditya Nagar, ADB Road, Surampalem"
                        className="block w-full pl-10 pr-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-900 dark:focus:border-emerald-500 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 dark:bg-[#131B22] hover:bg-white dark:hover:bg-[#18222b] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* City, State, PIN Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label
                        htmlFor="register-city"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                      >
                        City *
                      </label>
                      <input
                        id="register-city"
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Surampalem"
                        className="block w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-900 dark:focus:border-emerald-500 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 dark:bg-[#131B22] hover:bg-white dark:hover:bg-[#18222b] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="register-state"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                      >
                        State *
                      </label>
                      <input
                        id="register-state"
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Andhra Pradesh"
                        className="block w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-900 dark:focus:border-emerald-500 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 dark:bg-[#131B22] hover:bg-white dark:hover:bg-[#18222b] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="register-pincode"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                      >
                        PIN Code *
                      </label>
                      <input
                        id="register-pincode"
                        type="text"
                        required
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="533437"
                        className="block w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-900 dark:focus:border-emerald-500 focus:ring-2 focus:ring-brand-900/20 bg-slate-50/40 dark:bg-[#131B22] hover:bg-white dark:hover:bg-[#18222b] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-900 hover:bg-[#134E3F] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-900/40 focus:ring-offset-2 transition-all duration-150 disabled:opacity-60 cursor-pointer mt-5"
                  >
                    <span>{isSubmitting ? 'Sending Verification Code...' : 'Register & Verify Email via Brevo'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              /* STEP 2: Brevo OTP Verification */
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
                    <Mail className="w-7 h-7" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Verify Your Email
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                    We have dispatched a 6-digit one-time verification code via <strong>Brevo</strong> to:
                  </p>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                    {email}
                  </p>
                </div>

                {/* Success Notice if freshly sent/resent */}
                {successNotice && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-600" />
                    <span>{successNotice}</span>
                  </div>
                )}

                {/* Developer Simulator Notice if Brevo Key is pending setup */}
                {simulatedOtp && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-900 dark:text-amber-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                      <Sparkles size={14} />
                      <span>Brevo Email Simulator Active</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Your verification OTP code is:{' '}
                      <strong className="font-mono text-sm tracking-widest text-amber-900 dark:text-amber-100 bg-amber-200/50 dark:bg-amber-900/50 px-2 py-0.5 rounded">
                        {simulatedOtp}
                      </strong>
                    </p>
                  </div>
                )}

                {/* OTP Form */}
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label
                      htmlFor="register-otp"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 text-center"
                    >
                      Enter 6-Digit Code
                    </label>
                    <div className="relative max-w-xs mx-auto">
                      <input
                        id="register-otp"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        required
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, ''));
                          setError(null);
                        }}
                        placeholder="••••••"
                        autoFocus
                        className="block w-full py-3 px-4 text-center font-mono text-2xl font-bold tracking-[0.4em] text-slate-900 dark:text-white border-2 border-slate-300 dark:border-[#1E293B] rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 bg-slate-50/50 dark:bg-[#131B22] outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-400"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-2">
                      Check your email inbox or spam folder. Code is valid for 10 minutes.
                    </p>
                  </div>

                  {/* Verification Submit Button */}
                  <button
                    type="submit"
                    disabled={isVerifying || otp.length !== 6}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:ring-offset-2 transition-all duration-150 disabled:opacity-50 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{isVerifying ? 'Verifying Code...' : 'Verify & Complete Registration'}</span>
                  </button>

                  {/* Resend & Edit Details Controls */}
                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('form');
                        setError(null);
                      }}
                      className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Edit Details / Email</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isResending}
                      className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                      <span>
                        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code via Brevo'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Login Link */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-[#1E293B] text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-brand-900 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline decoration-emerald-500/30 underline-offset-4 transition-colors"
                >
                  Sign in with credentials
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
