import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Truck,
  HeartHandshake,
  Building2,
  User,
  Users,
  Radio,
  FileCheck,
  ChevronRight,
  Lock,
  Leaf,
  Activity,
  Layers,
  Phone,
  Mail,
  RefreshCw,
  Box,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import TextType from '../components/common/TextType';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { BrandLogo } from '../components/common/BrandLogo';

const Landing: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'how-it-works' | 'features' | 'mission' | 'contact'>('home');
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const currentProgress = totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
      setScrollProgress(currentProgress);
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#fafaf9] dark:bg-[#0B0F17] font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-emerald-100 dark:bg-blue-950/60 dark:selection:bg-blue-900 selection:text-emerald-900 dark:selection:text-blue-100 min-h-screen transition-colors duration-200">
      {/* =========================================================================
          TOP NAVIGATION HEADER
      ========================================================================== */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#1E293B] shadow-[0_1px_8px_rgba(15,23,42,0.03)] transition-colors">
        {/* Dynamic Scroll Progress Bar */}
        <div
          className="absolute bottom-0 left-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-400 to-[#15803d] dark:from-blue-500 dark:via-cyan-400 dark:to-blue-600 transition-[width] duration-150 ease-out z-50"
          style={{ width: `${scrollProgress}%` }}
        />
        <div className="h-20 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
          {/* Logo & Brand Emblem */}
          <div className="flex items-center gap-3">
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.history.pushState(null, '', '/');
              }}
              className="no-underline cursor-pointer"
            >
              <BrandLogo size="md" />
            </a>
          </div>

          {/* Centered Navigation Pill */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-[#0F172A] border border-slate-200/60 dark:border-[#1E293B] text-xs font-semibold text-slate-600 dark:text-slate-400">
            <a
              href="#hero"
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 transition-all duration-150 rounded-lg ${
                activeTab === 'home'
                  ? 'bg-white dark:bg-[#111827] text-[#0f392b] dark:text-blue-400 font-extrabold shadow-sm scale-105'
                  : 'hover:text-slate-900 dark:hover:text-white hover:font-bold hover:bg-white/80 dark:hover:bg-[#1A232E] hover:scale-105 hover:shadow-xs'
              }`}
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setActiveTab('about')}
              className={`px-3 py-1.5 transition-all duration-150 rounded-lg ${
                activeTab === 'about'
                  ? 'bg-white dark:bg-[#111827] text-[#0f392b] dark:text-blue-400 font-extrabold shadow-sm scale-105'
                  : 'hover:text-slate-900 dark:hover:text-white hover:font-bold hover:bg-white/80 dark:hover:bg-[#1A232E] hover:scale-105 hover:shadow-xs'
              }`}
            >
              About Us
            </a>

            <a
              href="#ai-features"
              onClick={() => setActiveTab('features')}
              className={`px-3 py-1.5 transition-all duration-150 rounded-lg ${
                activeTab === 'features'
                  ? 'bg-white dark:bg-[#111827] text-[#0f392b] dark:text-blue-400 font-extrabold shadow-sm scale-105'
                  : 'hover:text-slate-900 dark:hover:text-white hover:font-bold hover:bg-white/80 dark:hover:bg-[#1A232E] hover:scale-105 hover:shadow-xs'
              }`}
            >
              Our Features
            </a>
            <a
              href="#mission"
              onClick={() => setActiveTab('mission')}
              className={`px-3 py-1.5 transition-all duration-150 rounded-lg ${
                activeTab === 'mission'
                  ? 'bg-white dark:bg-[#111827] text-[#0f392b] dark:text-blue-400 font-extrabold shadow-sm scale-105'
                  : 'hover:text-slate-900 dark:hover:text-white hover:font-bold hover:bg-white/80 dark:hover:bg-[#1A232E] hover:scale-105 hover:shadow-xs'
              }`}
            >
              Our Mission
            </a>
            <a
              href="#contact"
              onClick={() => setActiveTab('contact')}
              className={`px-3 py-1.5 transition-all duration-150 rounded-lg ${
                activeTab === 'contact'
                  ? 'bg-white dark:bg-[#111827] text-[#0f392b] dark:text-blue-400 font-extrabold shadow-sm scale-105'
                  : 'hover:text-slate-900 dark:hover:text-white hover:font-bold hover:bg-white/80 dark:hover:bg-[#1A232E] hover:scale-105 hover:shadow-xs'
              }`}
            >
              Contact
            </a>
          </nav>

          {/* Action CTAs & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme Mode"
              className="group relative flex items-center p-1 rounded-full bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#263342] hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-xs"
            >
              <div className="flex items-center gap-0.5 px-0.5">
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${
                    theme === 'light'
                      ? 'bg-white text-amber-500 shadow-sm'
                      : 'bg-transparent text-slate-500'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.166 17.834a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 6.166a.75.75 0 001.06 1.06l1.59-1.59a.75.75 0 00-1.061-1.061l-1.59 1.59z" />
                  </svg>
                </span>
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-[#11171D] text-emerald-400 shadow-sm'
                      : 'bg-transparent text-slate-400'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </button>

            {isAuthenticated && user ? (
              <Link
                to={`/${user.role}/dashboard`}
                className="inline-flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-[#15803d] dark:bg-blue-600 hover:bg-[#0f392b] dark:hover:bg-blue-500 text-white transition-all shadow-sm"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#0f392b] dark:text-blue-400 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-[#15803d] dark:bg-blue-600 hover:bg-[#0f392b] dark:hover:bg-blue-500 text-white transition-all shadow-sm"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              </>
            )}

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#1E293B] transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-red-500" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/95 dark:bg-[#111827]/98 backdrop-blur-2xl border-b border-slate-200 dark:border-[#1E293B] px-6 py-5 shadow-xl transition-all animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-2 pb-4 border-b border-slate-100 dark:border-[#1E293B]">
              <a
                href="#hero"
                onClick={() => {
                  setActiveTab('home');
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'home'
                    ? 'bg-emerald-50 dark:bg-blue-950/60 text-[#15803d] dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B]'
                }`}
              >
                <span>Home</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="#about"
                onClick={() => {
                  setActiveTab('about');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'about'
                    ? 'bg-emerald-50 dark:bg-blue-950/60 text-[#15803d] dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B]'
                }`}
              >
                <span>About Us</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="#how-it-works"
                onClick={() => {
                  setActiveTab('how-it-works');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'how-it-works'
                    ? 'bg-emerald-50 dark:bg-blue-950/60 text-[#15803d] dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B]'
                }`}
              >
                <span>How It Works</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="#ai-features"
                onClick={() => {
                  setActiveTab('features');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'features'
                    ? 'bg-emerald-50 dark:bg-blue-950/60 text-[#15803d] dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B]'
                }`}
              >
                <span>AI Features</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="#mission"
                onClick={() => {
                  setActiveTab('mission');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'mission'
                    ? 'bg-emerald-50 dark:bg-blue-950/60 text-[#15803d] dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B]'
                }`}
              >
                <span>Our Mission</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="#contact"
                onClick={() => {
                  setActiveTab('contact');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'contact'
                    ? 'bg-emerald-50 dark:bg-blue-950/60 text-[#15803d] dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B]'
                }`}
              >
                <span>Contact</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </nav>

            {!isAuthenticated && (
              <div className="pt-4 flex flex-col gap-2.5">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-[#15803d] dark:bg-blue-600 hover:bg-[#0f392b] transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="w-full pt-20 bg-[#fafaf9] dark:bg-[#0B0F17] transition-colors duration-200">
        <div className="flex flex-col w-full">
          {/* =========================================================================
              1. HERO SECTION (#hero) - Refined layout without photos
          ========================================================================== */}
          <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-28 bg-[#fafaf9] dark:bg-[#0B0F17] transition-colors duration-200" id="hero">
            {/* Ambient glowing backdrop blurs */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-emerald-100 dark:bg-blue-950/60/50 dark:bg-blue-950/20 blur-[130px] pointer-events-none rounded-full -z-10" />
            <div className="absolute top-1/3 -right-20 w-[420px] h-[420px] bg-slate-100/60 dark:bg-slate-800/10 blur-[110px] pointer-events-none rounded-full -z-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollReveal animation="fade-up" duration={700}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  {/* Left Column: Hero Text Content */}
                  <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
                    {/* AI Pill Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#1E293B] shadow-sm mb-5 max-w-full">
                      <span className="w-2 h-2 rounded-full bg-[#15803d] dark:bg-blue-500 animate-pulse shadow-[0_0_8px_#22c55e] shrink-0" />
                      <span className="text-[11px] sm:text-xs font-semibold tracking-wide text-slate-800 dark:text-slate-200 truncate">
                        AI-Powered Hunger Prevention &amp; Food Rescue Network
                      </span>
                    </div>

                    {/* Main Heading with TextType Transition */}
                    <h1 className="text-3xl sm:text-5xl lg:text-5.5xl font-extrabold text-[#0f392b] dark:text-white tracking-tight leading-[1.2] sm:leading-[1.15] mb-5 sm:mb-6 max-w-2xl">
                      <TextType
                        text="Bridging the Gap Between Food Waste and Hunger."
                        as="span"
                        typingSpeed={110}
                        initialDelay={500}
                        pauseDuration={4500}
                        deletingSpeed={75}
                        deleteMode="backspace"
                        typeEffect="fade"
                        cursorStyle="bar"
                        cursorGlide
                        showCursor
                        cursorColor="currentColor"
                        loop
                      >
                        {(renderedText) => {
                          const target = "Bridging the Gap Between Food Waste and Hunger.";
                          const part1 = "Bridging the Gap Between ";
                          const part2 = "Food Waste";
                          const part3 = " and ";
                          const part4 = "Hunger.";

                          let currentPart1 = "";
                          let currentPart2 = "";
                          let currentPart3 = "";
                          let currentPart4 = "";

                          if (renderedText.length <= part1.length) {
                            currentPart1 = renderedText;
                          } else if (renderedText.length <= part1.length + part2.length) {
                            currentPart1 = part1;
                            currentPart2 = renderedText.slice(part1.length);
                          } else if (renderedText.length <= part1.length + part2.length + part3.length) {
                            currentPart1 = part1;
                            currentPart2 = part2;
                            currentPart3 = renderedText.slice(part1.length + part2.length);
                          } else {
                            currentPart1 = part1;
                            currentPart2 = part2;
                            currentPart3 = part3;
                            currentPart4 = renderedText.slice(part1.length + part2.length + part3.length);
                          }

                          return (
                            <span>
                              {currentPart1}
                              {currentPart2 && (
                                <span className="bg-gradient-to-r from-[#15803d] to-[#0f392b] dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                                  {currentPart2}
                                </span>
                              )}
                              {currentPart3}
                              {currentPart4 && (
                                <span className="bg-gradient-to-r from-emerald-600 to-amber-700 dark:from-cyan-400 dark:to-blue-500 bg-clip-text text-transparent">
                                  {currentPart4}
                                </span>
                              )}
                            </span>
                          );
                        }}
                      </TextType>
                    </h1>

                    {/* Supporting Description */}
                    <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 max-w-xl leading-relaxed">
                      Every meal matters. AnnaSathi AI connects surplus food with people who need it through verified NGOs, dedicated volunteers, and intelligent AI-powered food rescue.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-6 w-full sm:w-auto">
                      <Link
                        to={isAuthenticated && user?.role === 'donor' ? '/donor/create-donation' : '/login'}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#15803d] dark:bg-blue-600 text-white font-semibold text-sm hover:bg-[#0f392b] dark:hover:bg-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <span>Donate Food</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        to="/register"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] text-[#0f392b] dark:text-blue-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-[#1A232E] hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 shadow-sm"
                      >
                        <HeartHandshake className="w-4 h-4 text-[#15803d] dark:text-blue-400" />
                        <span>Join as Volunteer</span>
                      </Link>
                    </div>

                    {/* Trust Subtext */}
                    <div className="flex items-center justify-center lg:justify-start gap-2 text-slate-600 dark:text-slate-400 pt-1 text-center lg:text-left">
                      <Leaf className="w-4 h-4 text-[#15803d] dark:text-blue-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">
                        Together, let's build a world where no meal goes to waste.
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Hero Visual Image Card with Floating Badges */}
                  <div className="lg:col-span-5 w-full relative">
                    <div className="relative mx-auto max-w-md lg:max-w-none">
                      {/* Ambient Image Glow */}
                      <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-blue-500/20 dark:from-blue-600/20 dark:via-cyan-500/15 dark:to-indigo-500/20 rounded-3xl blur-xl opacity-75 -z-10" />

                      {/* Main Featured Image Container */}
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-[#1E293B] shadow-2xl bg-white dark:bg-[#111827] group">
                        <img
                          src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop"
                          alt="Food rescue distribution and community meal sharing"
                          className="w-full h-[320px] sm:h-[380px] lg:h-[420px] object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="eager"
                        />
                        {/* Gradient overlay on image */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                        {/* Bottom Tag inside Image */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs backdrop-blur-md bg-black/40 px-3.5 py-2 rounded-xl border border-white/10">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <span className="font-medium tracking-wide">Live Food Rescue Logistics</span>
                          </div>
                          <span className="font-semibold text-emerald-300">100% Verified</span>
                        </div>
                      </div>

                      {/* Floating Badge 1: Top Right - Zero Waste Impact */}
                      <div className="absolute -top-4 -right-2 sm:-right-4 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border border-slate-200 dark:border-[#1E293B] rounded-2xl p-3 shadow-lg flex items-center gap-3 animate-float hidden sm:flex">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-blue-950/60 flex items-center justify-center text-[#15803d] dark:text-blue-400">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Route Match</div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">&lt; 15 Mins Dispatch</div>
                        </div>
                      </div>

                      {/* Floating Badge 2: Bottom Left - Community Impact */}
                      <div className="absolute -bottom-4 -left-2 sm:-left-4 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border border-slate-200 dark:border-[#1E293B] rounded-2xl p-3 shadow-lg flex items-center gap-3 hidden sm:flex">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-700 dark:text-amber-400">
                          <HeartHandshake className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Communities Fed</div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">98,500+ Nutritious Meals</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* =========================================================================
              2. IMPACT / PLATFORM INTRODUCTION (#impact)
          ========================================================================== */}
          <section className="py-16 lg:py-24 bg-slate-50 dark:bg-[#0C1217] border-y border-slate-200/70 dark:border-[#1E293B] relative transition-colors duration-200" id="impact">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
              {/* Section Header */}
              <ScrollReveal animation="fade-up" duration={600}>
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14">
                  <span className="text-xs text-[#15803d] dark:text-blue-400 tracking-widest uppercase mb-2 font-bold font-mono">
                    IMPACT OVERVIEW
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#0f392b] dark:text-white tracking-tight mb-4">
                    Small Actions. Bigger Impact.
                  </h2>
                  <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    One donation can make a difference. AnnaSathi AI brings donors, NGOs, and volunteers together to transform surplus food into meaningful support for communities.
                  </p>
                </div>
              </ScrollReveal>

              {/* 4 Stat / Telemetry Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stat Card 1 */}
                <ScrollReveal animation="fade-up" delay={50} duration={650}>
                  <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md h-full">
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center text-[#0f392b] dark:text-blue-400">
                        <Building2 className="w-6 h-6" />
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-[#15803d] dark:text-blue-400 bg-emerald-50 dark:bg-blue-950/60 border border-emerald-100 dark:border-blue-800/40 px-2 py-0.5 rounded-full font-bold font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] dark:bg-blue-500" /> 100%
                      </span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#0f392b] dark:text-white tracking-tight mb-1">
                        Active Donors
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        Continuous Inflow verified with restaurants, college canteens &amp; banquet partners.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono">
                      <span>Strict KYC Onboarding</span>
                      <CheckCircle2 className="w-4 h-4 text-[#15803d] dark:text-blue-400" />
                    </div>
                  </div>
                </ScrollReveal>

                {/* Stat Card 2 */}
                <ScrollReveal animation="fade-up" delay={120} duration={650}>
                  <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md h-full">
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center text-[#0f392b] dark:text-blue-400">
                        <HeartHandshake className="w-6 h-6" />
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-[#15803d] dark:text-blue-400 bg-emerald-50 dark:bg-blue-950/60 border border-emerald-100 dark:border-blue-800/40 px-2 py-0.5 rounded-full font-bold font-mono">
                        Geo-Routed
                      </span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#0f392b] dark:text-white tracking-tight mb-1">
                        Verified NGOs
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        Vetted distribution partners with capacity-checked shelters and community kitchens.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono">
                      <span>Demand-Matched Daily</span>
                      <MapPin className="w-4 h-4 text-[#15803d] dark:text-blue-400" />
                    </div>
                  </div>
                </ScrollReveal>

                {/* Stat Card 3 */}
                <ScrollReveal animation="fade-up" delay={190} duration={650}>
                  <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md h-full">
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center text-[#0f392b] dark:text-blue-400">
                        <Truck className="w-6 h-6" />
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-[#15803d] dark:text-blue-400 bg-emerald-50 dark:bg-blue-950/60 border border-emerald-100 dark:border-blue-800/40 px-2 py-0.5 rounded-full font-bold font-mono">
                        Real-Time
                      </span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#0f392b] dark:text-white tracking-tight mb-1">
                        Dedicated Squads
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        Community-driven volunteers dispatched instantly for rapid food pickup and handover.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono">
                      <span>Avg. 18 Min Dispatch</span>
                      <Activity className="w-4 h-4 text-[#15803d] dark:text-blue-400" />
                    </div>
                  </div>
                </ScrollReveal>

                {/* Stat Card 4 */}
                <ScrollReveal animation="fade-up" delay={260} duration={650}>
                  <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md h-full">
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center text-[#0f392b] dark:text-blue-400">
                        <ShieldCheck className="w-6 h-6" />
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-[#15803d] dark:text-blue-400 bg-emerald-50 dark:bg-blue-950/60 border border-emerald-100 dark:border-blue-800/40 px-2 py-0.5 rounded-full font-bold font-mono">
                        Audit Trail
                      </span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#0f392b] dark:text-white tracking-tight mb-1">
                        Deliveries Tracked
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        Zero-waste goal with end-to-end digital timestamps, temperature logs, and delivery receipts.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono">
                      <span>Full Lifecycle Safety</span>
                      <FileCheck className="w-4 h-4 text-[#15803d] dark:text-blue-400" />
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </section>

          {/* =========================================================================
              3. ABOUT ANNASATHI AI (#about) - Streamlined photo-free layout
          ========================================================================== */}
          <section className="py-20 lg:py-28 bg-[#fafaf9] dark:bg-[#0B0F17] relative transition-colors duration-200" id="about">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
              <ScrollReveal animation="fade-up" duration={600}>
                <div className="max-w-3xl mb-12">
                  <span className="text-xs text-[#15803d] dark:text-blue-400 tracking-widest uppercase mb-2 font-bold font-mono block">
                    THE CRISIS &amp; OUR SOLUTION
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#0f392b] dark:text-white tracking-tight">
                    Technology with a Purpose. Food with a Future.
                  </h2>
                </div>
              </ScrollReveal>

              {/* 4 Crisis Pillars in a balanced 4-column grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <ScrollReveal animation="fade-up" delay={50} duration={600}>
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col gap-3 transition-colors hover:shadow-md h-full">
                    <span className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1E293B] text-[#0f392b] dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Leaf className="w-5 h-5" />
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Surplus Wastage</h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Large quantities of surplus food are wasted every day across banquets, hotels, and college canteens.
                    </p>
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={120} duration={600}>
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col gap-3 transition-colors hover:shadow-md h-full">
                    <span className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1E293B] text-[#0f392b] dark:text-blue-400 flex items-center justify-center shrink-0">
                      <HeartHandshake className="w-5 h-5" />
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Nutritional Gap</h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Many communities and shelter residents still struggle to access fresh, balanced, nutritious meals daily.
                    </p>
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={190} duration={600}>
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col gap-3 transition-colors hover:shadow-md h-full">
                    <span className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1E293B] text-[#0f392b] dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Radio className="w-5 h-5" />
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Coordination Chasm</h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      Food donors and humanitarian organizations frequently lack an efficient, real-time bridge to connect.
                    </p>
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={260} duration={600}>
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col gap-3 transition-colors hover:shadow-md h-full">
                    <span className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1E293B] text-[#0f392b] dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Perishability Windows</h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Collection and distribution require immediate coordination, temperature tracking, and timely action.
                    </p>
                  </div>
                </ScrollReveal>
              </div>

              {/* Full Width Integrated AI Solution & Real-Time Engine Banner */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* AI Solution Mission Banner */}
                <div className="lg:col-span-8">
                  <ScrollReveal animation="fade-right" duration={700} className="h-full">
                    <div className="p-6 sm:p-8 rounded-2xl bg-[#0f392b] dark:bg-blue-950/90 text-white shadow-md relative overflow-hidden border border-emerald-950 dark:border-blue-800/40 flex flex-col justify-center h-full">
                      <div className="flex items-start gap-4">
                        <Sparkles className="w-8 h-8 text-emerald-300 dark:text-cyan-200 shrink-0 mt-1" />
                        <div>
                          <span className="text-lg font-bold text-emerald-300 dark:text-cyan-200 block mb-2">
                            Our Integrated AI Solution
                          </span>
                          <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                            AnnaSathi AI uses technology and artificial intelligence to connect surplus food donors with verified organizations and volunteers, helping food reach the right destination before it goes to waste.
                          </p>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>

                {/* Zero-Waste Telemetry Engine Card */}
                <div className="lg:col-span-4">
                  <ScrollReveal animation="fade-left" duration={700} className="h-full">
                    <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between transition-colors h-full">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-blue-400 uppercase tracking-wider">
                            Active Telemetry
                          </span>
                          <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 dark:bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 dark:bg-blue-500" />
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-[#0f392b] dark:text-white mb-1.5">
                          Zero-Waste Logistics Engine
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Real-time matching active across metropolitan nodes with end-to-end telemetry and verification.
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Match Reliability:</span>
                        <span className="font-bold text-emerald-600 dark:text-blue-400">99.8% SLA</span>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              4. HOW IT WORKS (#how-it-works)
          ========================================================================== */}
          <section className="py-20 lg:py-28 bg-slate-50 dark:bg-[#0C1217] border-y border-slate-200/70 dark:border-[#1E293B] relative transition-colors duration-200" id="how-it-works">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
              <ScrollReveal animation="fade-up" duration={600}>
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
                  <span className="text-xs text-[#15803d] dark:text-blue-400 tracking-widest uppercase mb-2 font-bold font-mono">
                    SEAMLESS 7-STEP WORKFLOW
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#0f392b] dark:text-white tracking-tight mb-4">
                    How Surplus Food Reaches Those in Need
                  </h2>
                  <p className="text-base text-slate-600 dark:text-slate-400">
                    From donor notification to shelter receipt, each phase is coordinated with machine precision and community care.
                  </p>
                </div>
              </ScrollReveal>

              {/* 7-Step Sequence Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                {/* STEP 1 */}
                <ScrollReveal animation="fade-up" delay={40} duration={600}>
                  <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E293B] text-[#0f392b] dark:text-blue-400 font-mono text-xs flex items-center justify-center font-bold">
                          01
                        </span>
                        <Building2 className="w-5 h-5 text-[#15803d] dark:text-blue-400" />
                      </div>
                      <h3 className="font-bold text-sm text-[#0f392b] dark:text-white mb-1.5">Donate Food</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Donors register, add food details, quantity, prep timestamp, expiry info, and pickup location.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E293B] text-right">
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 group-hover:text-[#15803d] dark:text-blue-400 transition-colors">Phase 1</span>
                    </div>
                  </div>
                </ScrollReveal>

                {/* STEP 2 */}
                <ScrollReveal animation="fade-up" delay={90} duration={600}>
                  <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E293B] text-[#0f392b] dark:text-blue-400 font-mono text-xs flex items-center justify-center font-bold">
                          02
                        </span>
                        <Sparkles className="w-5 h-5 text-[#15803d] dark:text-blue-400" />
                      </div>
                      <h3 className="font-bold text-sm text-[#0f392b] dark:text-white mb-1.5">AI Analysis</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        The AI system estimates food urgency and evaluates temperature and storage stability.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E293B] text-right">
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 group-hover:text-[#15803d] dark:text-blue-400 transition-colors">Phase 2</span>
                    </div>
                  </div>
                </ScrollReveal>

                {/* STEP 3 */}
                <ScrollReveal animation="fade-up" delay={140} duration={600}>
                  <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E293B] text-[#0f392b] dark:text-blue-400 font-mono text-xs flex items-center justify-center font-bold">
                          03
                        </span>
                        <Layers className="w-5 h-5 text-[#15803d] dark:text-blue-400" />
                      </div>
                      <h3 className="font-bold text-sm text-[#0f392b] dark:text-white mb-1.5">NGO Matching</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Platform recommends suitable verified NGOs based on proximity, capacity, and dietary criteria.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E293B] text-right">
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 group-hover:text-[#15803d] dark:text-blue-400 transition-colors">Phase 3</span>
                    </div>
                  </div>
                </ScrollReveal>

                {/* STEP 4 */}
                <ScrollReveal animation="fade-up" delay={190} duration={600}>
                  <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E293B] text-[#0f392b] dark:text-blue-400 font-mono text-xs flex items-center justify-center font-bold">
                          04
                        </span>
                        <HeartHandshake className="w-5 h-5 text-[#15803d] dark:text-blue-400" />
                      </div>
                      <h3 className="font-bold text-sm text-[#0f392b] dark:text-white mb-1.5">NGO Acceptance</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        The NGO reviews donation details and accepts or declines based on current kitchen meal capacity.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E293B] text-right">
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 group-hover:text-[#15803d] dark:text-blue-400 transition-colors">Phase 4</span>
                    </div>
                  </div>
                </ScrollReveal>

                {/* STEP 5 */}
                <ScrollReveal animation="fade-up" delay={240} duration={600}>
                  <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E293B] text-[#0f392b] dark:text-blue-400 font-mono text-xs flex items-center justify-center font-bold">
                          05
                        </span>
                        <Truck className="w-5 h-5 text-[#15803d] dark:text-blue-400" />
                      </div>
                      <h3 className="font-bold text-sm text-[#0f392b] dark:text-white mb-1.5">Volunteer Sync</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        An available neighborhood volunteer accepts the route delivery task via their live dashboard.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E293B] text-right">
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 group-hover:text-[#15803d] dark:text-blue-400 transition-colors">Phase 5</span>
                    </div>
                  </div>
                </ScrollReveal>

                {/* STEP 6 */}
                <ScrollReveal animation="fade-up" delay={290} duration={600}>
                  <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E293B] text-[#0f392b] dark:text-blue-400 font-mono text-xs flex items-center justify-center font-bold">
                          06
                        </span>
                        <Radio className="w-5 h-5 text-[#15803d] dark:text-blue-400" />
                      </div>
                      <h3 className="font-bold text-sm text-[#0f392b] dark:text-white mb-1.5">Live Delivery</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        The volunteer transports the food using turn-by-turn routing with real-time ETA updates.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E293B] text-right">
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 group-hover:text-[#15803d] dark:text-blue-400 transition-colors">Phase 6</span>
                    </div>
                  </div>
                </ScrollReveal>

                {/* STEP 7 */}
                <ScrollReveal animation="fade-up" delay={340} duration={600}>
                  <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E293B] text-[#0f392b] dark:text-blue-400 font-mono text-xs flex items-center justify-center font-bold">
                          07
                        </span>
                        <CheckCircle2 className="w-5 h-5 text-[#15803d] dark:text-blue-400" />
                      </div>
                      <h3 className="font-bold text-sm text-[#0f392b] dark:text-white mb-1.5">Confirmation</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        The NGO verifies food arrival, confirms quantity, and meals are served to people in need.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E293B] text-right">
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 group-hover:text-[#15803d] dark:text-blue-400 transition-colors">Phase 7</span>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </section>
          {/* =========================================================================
              6. AI-POWERED FEATURES (#ai-features)
          ========================================================================== */}
          <section className="py-20 lg:py-28 bg-slate-50 dark:bg-[#0C1217] border-y border-slate-200/70 dark:border-[#1E293B] relative transition-colors duration-200" id="ai-features">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
              <ScrollReveal animation="fade-up" duration={600}>
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
                  <span className="text-xs text-[#15803d] dark:text-blue-400 tracking-widest uppercase mb-2 font-bold font-mono">
                    INTELLIGENT INNOVATION
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#0f392b] dark:text-white tracking-tight mb-4">
                    Powered by AI. Driven by Humanity.
                  </h2>
                  <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    AnnaSathi AI combines state-of-the-art predictive intelligence with real-world logistics to make zero-waste food distribution smarter, faster, and reliable.
                  </p>
                </div>
              </ScrollReveal>

              {/* 5 Bento Style Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* FEATURE 1 */}
                <ScrollReveal animation="fade-up" delay={50} duration={650}>
                  <div className="bg-white dark:bg-[#111827] p-7 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center text-[#0f392b] dark:text-blue-400 group-hover:bg-[#15803d] dark:bg-blue-500 group-hover:text-white transition-colors">
                          <Clock className="w-6 h-6" />
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-blue-950/60 border border-emerald-100 dark:border-blue-800/40 text-[11px] font-mono text-[#15803d] dark:text-blue-400 font-bold">
                          REAL-TIME
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#0f392b] dark:text-white mb-2.5">
                        AI Food Urgency Estimation
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Analyzes food category, preparation timestamp, temperature, and ambient storage to compute an automated shelf-life urgency score, preventing spoilage before it happens.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span>Thermal &amp; Moisture Sensors</span>
                      <Radio className="w-4 h-4 text-[#15803d] dark:text-blue-400" />
                    </div>
                  </div>
                </ScrollReveal>

                {/* FEATURE 2 */}
                <ScrollReveal animation="fade-up" delay={120} duration={650}>
                  <div className="bg-white dark:bg-[#111827] p-7 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center text-[#0f392b] dark:text-blue-400 group-hover:bg-[#15803d] dark:bg-blue-500 group-hover:text-white transition-colors">
                          <MapPin className="w-6 h-6" />
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-blue-950/60 border border-emerald-100 dark:border-blue-800/40 text-[11px] font-mono text-[#15803d] dark:text-blue-400 font-bold">
                          ALGORITHMIC
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#0f392b] dark:text-white mb-2.5">
                        Intelligent NGO Matching
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Optimal algorithmic matching scoring proximity, dietary requirements, vehicle capacity, and real-time shelter dining schedules for zero transit bottlenecking.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span>Optimal Radial Proximity</span>
                      <Activity className="w-4 h-4 text-[#15803d] dark:text-blue-400" />
                    </div>
                  </div>
                </ScrollReveal>

                {/* FEATURE 3 */}
                <ScrollReveal animation="fade-up" delay={190} duration={650}>
                  <div className="bg-white dark:bg-[#111827] p-7 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center text-[#0f392b] dark:text-blue-400 group-hover:bg-[#15803d] dark:bg-blue-500 group-hover:text-white transition-colors">
                          <Activity className="w-6 h-6" />
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-blue-950/60 border border-emerald-100 dark:border-blue-800/40 text-[11px] font-mono text-[#15803d] dark:text-blue-400 font-bold">
                          PREDICTIVE
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#0f392b] dark:text-white mb-2.5">
                        AI Demand Prediction
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Predictive models analyzing historical food wastage cycles across banquet peaks to anticipate regional hunger demand and coordinate preemptive volunteer rosters.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span>Time-Series Pattern Analysis</span>
                      <Sparkles className="w-4 h-4 text-[#15803d] dark:text-blue-400" />
                    </div>
                  </div>
                </ScrollReveal>

                {/* FEATURE 4 */}
                <ScrollReveal animation="fade-up" delay={100} duration={650}>
                  <div className="bg-white dark:bg-[#111827] p-7 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all lg:col-span-1 h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center text-[#0f392b] dark:text-blue-400 group-hover:bg-[#15803d] dark:bg-blue-500 group-hover:text-white transition-colors">
                          <Sparkles className="w-6 h-6" />
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-blue-950/60 border border-emerald-100 dark:border-blue-800/40 text-[11px] font-mono text-[#15803d] dark:text-blue-400 font-bold">
                          NLP MULTILINGUAL
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#0f392b] dark:text-white mb-2.5">
                        AI Chatbot Assistant
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Multilingual conversational agent assisting donors with packaging instructions, NGO onboarding queries, and live operational help in vernacular languages.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span>24/7 Contextual Guidance</span>
                      <CheckCircle2 className="w-4 h-4 text-[#15803d] dark:text-blue-400" />
                    </div>
                  </div>
                </ScrollReveal>

                {/* FEATURE 5 (Spanning 2 columns on lg) */}
                <div className="lg:col-span-2">
                  <ScrollReveal animation="fade-up" delay={180} duration={650} className="h-full">
                    <div className="bg-white dark:bg-[#111827] p-7 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center text-[#0f392b] dark:text-blue-400 group-hover:bg-[#15803d] dark:bg-blue-500 group-hover:text-white transition-colors">
                            <Layers className="w-6 h-6" />
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-blue-950/60 border border-emerald-200 dark:border-blue-800/40 text-[11px] font-mono text-emerald-900 dark:text-cyan-300 font-bold">
                            HIGH AVAILABILITY
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#0f392b] dark:text-white mb-2.5">
                          Multi-Provider AI Architecture
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                          Robust dual-engine infrastructure powered by Google Gemini and NVIDIA NIM with automatic failover and zero latency spikes, ensuring 99.9% uptime for time-critical food rescue operations.
                        </p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#1E293B] px-2.5 py-1 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] dark:bg-blue-500" /> Google Gemini Core
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#1E293B] px-2.5 py-1 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] dark:bg-blue-500" /> NVIDIA NIM Inference
                          </span>
                        </div>
                        <span className="text-xs font-mono text-[#15803d] dark:text-blue-400 font-bold">&lt; 140ms Latency</span>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              7. REAL-TIME TRACKING AND TRANSPARENCY (#tracking)
          ========================================================================== */}
          <section className="py-20 lg:py-28 bg-[#fafaf9] dark:bg-[#0B0F17] relative transition-colors duration-200" id="tracking">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
              <ScrollReveal animation="fade-up" duration={600}>
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
                  <span className="text-xs text-[#15803d] dark:text-blue-400 tracking-widest uppercase mb-2 font-bold font-mono">
                    LIVE OPERATIONS MOCKUP
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#0f392b] dark:text-white tracking-tight mb-4">
                    Every Donation. Every Journey. Every Impact.
                  </h2>
                  <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    Clear operational visibility including donation status tracking, NGO acceptance updates, volunteer dispatching, live transit progress, digital delivery confirmation, and instant in-app alerts.
                  </p>
                </div>
              </ScrollReveal>

              {/* Live Mockup Board */}
              <ScrollReveal animation="zoom-in" duration={700}>
                <div className="bg-white dark:bg-[#111827] p-6 sm:p-10 rounded-2xl shadow-md border border-slate-200/80 dark:border-[#1E293B] max-w-5xl mx-auto transition-colors">
                  {/* Header row of the order card */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-[#1E293B]">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center text-[#0f392b] dark:text-blue-400 font-bold">
                        <Truck className="w-5 h-5" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-[#0f392b] dark:text-white">Donation #AS-8942</h3>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-blue-950/60 text-emerald-800 dark:text-cyan-300 text-[11px] font-mono font-bold">
                            LIVE IN TRANSIT
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">The Grand Canteen ➔ Sneha Shelter (4.2 km)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 block">Food Safety Temp</span>
                        <span className="text-xs sm:text-sm text-[#15803d] dark:text-blue-400 font-bold">64°C (Safe Consumable)</span>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-blue-950/60 border border-emerald-100 dark:border-blue-800/40 flex items-center justify-center text-[#15803d] dark:text-blue-400">
                        <Radio className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Interactive Stepper Flow */}
                  <div className="py-6 sm:py-8 overflow-x-auto scrollbar-hide">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 relative min-w-[340px] sm:min-w-0">
                      {/* Step 1 */}
                      <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-[#15803d] dark:bg-blue-500 text-white flex items-center justify-center mb-2 shadow-sm">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-[#0f392b] dark:text-white">Created</span>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">14:10 IST</span>
                      </div>
                      {/* Step 2 */}
                      <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-[#15803d] dark:bg-blue-500 text-white flex items-center justify-center mb-2 shadow-sm">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-[#0f392b] dark:text-white">NGO Accepted</span>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">14:14 IST</span>
                      </div>
                      {/* Step 3 */}
                      <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-[#15803d] dark:bg-blue-500 text-white flex items-center justify-center mb-2 shadow-sm">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-[#0f392b] dark:text-white">Volunteer Assigned</span>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">14:18 IST</span>
                      </div>
                      {/* Step 4 (Active) */}
                      <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-blue-950/70 text-emerald-800 dark:text-cyan-300 flex items-center justify-center mb-2 shadow-[0_0_12px_rgba(22,163,74,0.35)] animate-pulse">
                          <Truck className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-[#15803d] dark:text-blue-400">Picked Up (In Transit)</span>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">14:26 IST</span>
                      </div>
                      {/* Step 5 (Pending) */}
                      <div className="flex flex-col items-center text-center opacity-40">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center mb-2 text-slate-400">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Delivered</span>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">Est: 14:40</span>
                      </div>
                      {/* Step 6 (Pending) */}
                      <div className="flex flex-col items-center text-center opacity-40">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center mb-2 text-slate-400">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Receipt Confirmed</span>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">Awaiting Arrival</span>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Details Footer */}
                  <div className="pt-6 border-t border-slate-100 dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Leaf className="w-5 h-5 text-[#15803d] dark:text-blue-400" />
                      <span className="text-xs sm:text-sm text-[#0f392b] dark:text-cyan-300 font-medium">
                        45 wholesome prepared lunch boxes • Packed with eco-friendly containers
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 italic">
                      *Live automated food safety telemetry
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* =========================================================================
              8. OUR MISSION (#mission)
          ========================================================================== */}
          <section className="py-20 lg:py-28 bg-slate-50 dark:bg-[#0C1217] border-t border-slate-200/70 dark:border-[#1E293B] relative transition-colors duration-200" id="mission">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
              <ScrollReveal animation="fade-up" duration={600}>
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
                  <span className="text-xs text-[#15803d] dark:text-blue-400 tracking-widest uppercase mb-2 font-bold font-mono">
                    PURPOSE DRIVEN
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#0f392b] dark:text-white tracking-tight mb-4">
                    Building a Future Where No Food Goes to Waste.
                  </h2>
                  <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    Our mission is to reduce food waste, strengthen communities, and make food redistribution accessible through technology, collaboration, and compassion.
                  </p>
                </div>
              </ScrollReveal>

              {/* 3 Mission Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Pillar 1 */}
                <ScrollReveal animation="fade-up" delay={60} duration={650}>
                  <div className="bg-white dark:bg-[#111827] p-8 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-full">
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-blue-950/60 border border-emerald-100 dark:border-blue-800/40 flex items-center justify-center text-[#0f392b] dark:text-blue-400 mb-6">
                        <Leaf className="w-7 h-7 text-[#15803d] dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-bold text-[#0f392b] dark:text-white mb-3">
                        Reduce Food Waste
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Diverting edible, nutritious sustenance away from municipal landfills into community kitchens, significantly curbing methane emissions and ecological strain.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E293B]">
                      <span className="text-xs font-mono text-[#15803d] dark:text-blue-400 font-bold">
                        Landfill Diversion Target: 100%
                      </span>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Pillar 2 */}
                <ScrollReveal animation="fade-up" delay={140} duration={650}>
                  <div className="bg-white dark:bg-[#111827] p-8 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-full">
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-blue-950/60 border border-emerald-100 dark:border-blue-800/40 flex items-center justify-center text-[#0f392b] dark:text-blue-400 mb-6">
                        <HeartHandshake className="w-7 h-7 text-[#15803d] dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-bold text-[#0f392b] dark:text-white mb-3">
                        Support Hunger Prevention
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Ensuring vulnerable children, elderly, and unhoused citizens receive daily dignified meals prepared with high culinary safety and nutritional integrity.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E293B]">
                      <span className="text-xs font-mono text-[#15803d] dark:text-blue-400 font-bold">
                        Nutritional Security Focused
                      </span>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Pillar 3 */}
                <ScrollReveal animation="fade-up" delay={220} duration={650}>
                  <div className="bg-white dark:bg-[#111827] p-8 rounded-2xl border border-slate-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-full">
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-blue-950/60 border border-emerald-100 dark:border-blue-800/40 flex items-center justify-center text-[#0f392b] dark:text-blue-400 mb-6">
                        <Users className="w-7 h-7 text-[#15803d] dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-bold text-[#0f392b] dark:text-white mb-3">
                        Build Connected Communities
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Forging unbreakable civic bonds between hospitality leaders, civil society organizations, and local volunteers who care about neighborhood welfare.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E293B]">
                      <span className="text-xs font-mono text-[#15803d] dark:text-blue-400 font-bold">
                        Civic Solidarity &amp; Action
                      </span>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </section>

          {/* =========================================================================
              9. CALL-TO-ACTION SECTION (#cta)
          ========================================================================== */}
          <section className="py-20 lg:py-28 bg-[#0f392b] dark:bg-[#0B0F17] text-white relative overflow-hidden border-t dark:border-[#1E293B]" id="cta">
            {/* Ambient Green Glows behind CTA Banner */}
            <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-[#15803d] dark:bg-blue-500/20 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] bg-emerald-400/10 blur-[130px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
              <ScrollReveal animation="zoom-in" duration={700}>
                <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 dark:text-cyan-200 text-xs font-semibold mb-6 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#15803d] dark:bg-blue-500 animate-pulse" />
                    <span>Join the Zero-Hunger Movement</span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-6">
                    Be the Reason Someone Smiles Today.
                  </h2>
                  <p className="text-base text-emerald-100/80 max-w-2xl mb-10 leading-relaxed">
                    Whether you donate food, support an NGO, or volunteer your time, you can help turn surplus food into hope. Every minute and every meal count.
                  </p>

                  {/* 3 Clear Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <Link
                      to={isAuthenticated && user?.role === 'donor' ? '/donor/create-donation' : '/login'}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#15803d] dark:bg-blue-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all shadow-md"
                    >
                      <span>Donate Food</span>
                      <Building2 className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white dark:bg-[#111827] border border-transparent dark:border-[#1E293B] text-[#0f392b] dark:text-white text-sm font-semibold hover:bg-slate-100 dark:hover:bg-[#1A232E] transition-all shadow-sm"
                    >
                      <span>Join as NGO</span>
                      <HeartHandshake className="w-4 h-4 text-[#15803d] dark:text-blue-400" />
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-emerald-950/80 dark:bg-blue-950/60 border border-emerald-800 dark:border-blue-700 text-white text-sm font-semibold hover:bg-emerald-900 transition-all shadow-sm"
                    >
                      <span>Become a Volunteer</span>
                      <Truck className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>
        </div>
      </main>

      {/* =========================================================================
          GLOBAL FOOTER (#contact)
      ========================================================================== */}
      <footer className="w-full bg-slate-900 dark:bg-[#06090C] text-slate-200 border-t border-slate-800 dark:border-[#1E293B] transition-colors" id="contact">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-16 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-y-12 lg:gap-x-12">
            {/* Col 1: Brand & Overview (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <a
                href="#hero"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  window.history.pushState(null, '', '/');
                }}
                className="cursor-pointer no-underline w-fit"
              >
                <BrandLogo size="md" textColor="text-white" />
              </a>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
                Connecting surplus food with those who need it through AI, technology, and community collaboration.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 dark:bg-[#111827] border border-slate-700/60 dark:border-[#1E293B] w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-300 font-semibold font-mono">99.8% Surplus Rescue Uptime</span>
              </div>
            </div>

            {/* Col 2: Quick Links (3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Quick Links</h4>
              <nav className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <a href="#hero" className="text-emerald-400 font-semibold hover:underline w-fit">
                  Home
                </a>
                <a href="#about" className="text-slate-400 hover:text-white dark:hover:text-blue-300 transition-colors w-fit">
                  About Us
                </a>

                <a href="#ai-features" className="text-slate-400 hover:text-white dark:hover:text-blue-300 transition-colors w-fit">
                  Our Features
                </a>
                <a href="#mission" className="text-slate-400 hover:text-white dark:hover:text-blue-300 transition-colors w-fit">
                  Our Mission
                </a>
              </nav>
            </div>

            {/* Col 3: Get Involved (3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Get Involved</h4>
              <nav className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <Link to="/register" className="text-slate-400 hover:text-white dark:hover:text-blue-300 transition-colors w-fit">
                  Become a Donor
                </Link>
                <Link to="/register" className="text-slate-400 hover:text-white dark:hover:text-blue-300 transition-colors w-fit">
                  Register as NGO
                </Link>
                <Link to="/register" className="text-slate-400 hover:text-white dark:hover:text-blue-300 transition-colors w-fit">
                  Become a Volunteer
                </Link>
                <Link to="/login" className="text-slate-400 hover:text-white dark:hover:text-blue-300 transition-colors w-fit">
                  Admin Login
                </Link>
              </nav>
            </div>

            {/* Col 4: Legal & Contact (2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Legal &amp; Contact</h4>
              <nav className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <a href="#contact" className="text-slate-400 hover:text-white dark:hover:text-blue-300 transition-colors w-fit">
                  Contact Us
                </a>
                <a href="mailto:support@annasathi.org" className="text-slate-400 hover:text-white dark:hover:text-blue-300 transition-colors w-fit">
                  Email Support
                </a>
                <span className="text-slate-400 hover:text-white dark:hover:text-blue-300 transition-colors cursor-pointer w-fit">
                  Privacy Policy
                </span>
                <span className="text-slate-400 hover:text-white dark:hover:text-blue-300 transition-colors cursor-pointer w-fit">
                  Terms &amp; Conditions
                </span>
              </nav>
            </div>
          </div>

          {/* Sub-footer Strip */}
          <div className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-800 dark:border-[#1E293B] text-slate-400 text-xs sm:text-sm">
            <p className="text-center md:text-left text-slate-400">
              &copy; {new Date().getFullYear()} <span className="text-slate-200 font-semibold">AnnaSathi AI</span>. All Rights Reserved. Together, let's make every meal count.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Developed by</span>
              <a
                href="https://github.com/MenakaYattapu2006"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-semibold hover:text-emerald-400 transition-colors"
              >
                Menaka
              </a>
              <span className="text-slate-500">|</span>
              <a
                href="https://github.com/PavanputraYarramsetty"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-semibold hover:text-emerald-400 transition-colors"
              >
                Pavanputra
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Back to Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to Top"
        className={`fixed bottom-6 right-6 z-40 p-3 rounded-full bg-[#15803d] dark:bg-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#15803d] dark:focus:ring-blue-500 ${
          showScrollTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
    </div>
  );
};

export default Landing;






