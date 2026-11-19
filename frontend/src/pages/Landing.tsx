import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type CityFilter = 'all' | 'delhi' | 'mumbai' | 'bengaluru';
type EcoTab = 'donors' | 'ngos' | 'couriers';

interface LiveRescueItem {
  id: string;
  source: string;
  badgeText: string;
  badgeStyle: string;
  timeAgo: string;
  description: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  stat1Label: string;
  stat1Value: string;
  stat2Label: string;
  stat2Value: string;
  actionText: string;
  actionType: 'gps' | 'receipt' | 'claim';
  city: CityFilter;
}

const liveRescues: LiveRescueItem[] = [
  {
    id: 'res-1',
    source: 'ITC Grand Chola',
    badgeText: 'In Transit',
    badgeStyle: 'bg-secondary-fixed text-on-secondary-fixed',
    timeAgo: '11 mins ago',
    description: '185 packed dinner platters → Dispatched to Karuna Community Kitchen (Southend)',
    icon: 'moped',
    iconBg: 'bg-secondary-container/40',
    iconColor: 'text-on-secondary-container',
    stat1Label: 'Current Temp',
    stat1Value: '64°C (Insulated)',
    stat2Label: 'ETA Destination',
    stat2Value: '7 Minutes',
    actionText: 'Track GPS',
    actionType: 'gps',
    city: 'delhi',
  },
  {
    id: 'res-2',
    source: 'FreshBakery Co. Logistics Hub',
    badgeText: 'Delivered & Verified',
    badgeStyle: 'bg-surface-container-highest text-on-surface',
    timeAgo: '24 mins ago',
    description: '320 packs whole wheat bread, baked snacks → Received by Bal Sahyog Children Home',
    icon: 'check_circle',
    iconBg: 'bg-surface-container-highest',
    iconColor: 'text-primary',
    stat1Label: 'Handoff OTP',
    stat1Value: 'Verified #8912',
    stat2Label: 'Audit Certificate',
    stat2Value: '80G Generated',
    actionText: 'View Receipt',
    actionType: 'receipt',
    city: 'mumbai',
  },
  {
    id: 'res-3',
    source: 'Marriott Convention Center',
    badgeText: 'Matched • Pickup Alert',
    badgeStyle: 'bg-tertiary-fixed text-tertiary-container',
    timeAgo: '2 mins ago',
    description: '210 portions catered lunch buffet → Matched with Sneha Sadan Senior Care Dining',
    icon: 'radar',
    iconBg: 'bg-tertiary-fixed',
    iconColor: 'text-tertiary-container',
    stat1Label: 'AI Confidence',
    stat1Value: '99.1% High',
    stat2Label: 'Courier Step',
    stat2Value: 'En Route Kitchen',
    actionText: 'Claim Assistance',
    actionType: 'claim',
    city: 'bengaluru',
  },
];

const Landing: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // State
  const [activeEcoTab, setActiveEcoTab] = useState<EcoTab>('donors');
  const [activeCity, setActiveCity] = useState<CityFilter>('all');
  const [modalContent, setModalContent] = useState<{ title: string; body: string } | null>(null);

  // Quick Dispatch Form State
  const [dispatchForm, setDispatchForm] = useState({
    entityName: '',
    phone: '',
    portions: '',
    address: '',
  });
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchForm.entityName || !dispatchForm.phone || !dispatchForm.portions || !dispatchForm.address) {
      alert('Please fill in all dispatch details.');
      return;
    }
    setDispatchStatus(
      `✓ Emergency Dispatch Registered for ${dispatchForm.entityName}! Courier #402 with thermal insulation assigned to ${dispatchForm.address}. Real-time tracking link sent to ${dispatchForm.phone}.`
    );
    setTimeout(() => {
      if (isAuthenticated && user?.role === 'donor') {
        navigate('/donor/create-donation');
      }
    }, 2000);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
    }
  };

  const filteredRescues = activeCity === 'all'
    ? liveRescues
    : liveRescues.filter((r) => r.city === activeCity);

  return (
    <div className="bg-surface font-sans text-body-md text-on-surface min-h-screen">
      {/* =========================================================================
          TOP NAVIGATION HEADER
      ========================================================================== */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-gutter">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-space-sm group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm group-hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-[24px]">eco</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary leading-tight tracking-tight">
                AnnaSathi<span className="text-secondary font-headline-sm text-headline-sm ml-1">AI</span>
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Zero-Waste Rescue
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-gutter">
            <a
              href="#how-it-works"
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors"
            >
              How It Works
            </a>
            <a
              href="#live-radar"
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors"
            >
              Impact Radar
            </a>
            <a
              href="#network-ecosystem"
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors"
            >
              Network Ecosystem
            </a>
            <a
              href="#tax-and-compliance"
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors"
            >
              Tax &amp; Compliance
            </a>
            <a
              href="#about-us"
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors"
            >
              About Us
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-space-md">
            <a
              href="#live-radar"
              className="hidden sm:inline-flex items-center px-space-md py-space-sm font-label-lg text-label-lg text-primary hover:bg-surface-container-low hover:text-primary rounded-lg transition-colors"
            >
              Track Rescue
            </a>

            {isAuthenticated && user ? (
              <Link
                to={`/${user.role}/dashboard`}
                className="inline-flex items-center px-space-lg py-space-sm bg-primary-container text-on-primary font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-primary transition-all font-bold"
              >
                Dashboard →
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-space-md py-space-sm text-primary font-label-lg text-label-lg hover:bg-surface-container-low rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-space-lg py-space-sm bg-primary-container text-on-primary font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-primary transition-all font-bold"
                >
                  Get Started →
                </Link>
              </div>
            )}

            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN CONTAINER
      ========================================================================== */}
      <main className="w-full pt-20 bg-surface">
        <div className="flex flex-col w-full">
          {/* =========================================================================
              HERO SECTION
          ========================================================================== */}
          <section className="relative w-full overflow-hidden bg-gradient-to-b from-surface-container-low via-surface to-surface-container-lowest py-space-xl lg:py-24">
            {/* Atmospheric Ambient Glows */}
            <div className="pointer-events-none absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-secondary-fixed/30 blur-3xl"></div>
            <div className="pointer-events-none absolute top-1/2 -left-20 h-80 w-80 rounded-full bg-primary-fixed/40 blur-3xl"></div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Hero Content (7 cols) */}
                <div className="lg:col-span-7 flex flex-col items-start gap-space-lg">
                  {/* Live Network Indicator Pill */}
                  <div className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-lowest shadow-sm border border-outline-variant/30">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                    </span>
                    <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider font-bold">
                      AI-Powered Surplus Food Rescue Network
                    </span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                      Real-Time Dispatch Active
                    </span>
                  </div>

                  {/* Headline */}
                  <div className="flex flex-col gap-space-xs">
                    <span className="font-label-lg text-label-lg tracking-widest uppercase text-secondary font-bold">
                      Zero-Waste Culinary Intelligence
                    </span>
                    <h1 className="font-display-lg text-display-lg text-primary tracking-tight font-extrabold max-w-2xl">
                      Feed the Hungry, <br />
                      <span className="text-primary-container relative inline-block">
                        Not the Bin
                        <svg
                          className="absolute -bottom-2 left-0 w-full h-3 text-secondary-container"
                          fill="none"
                          preserveAspectRatio="none"
                          viewBox="0 0 200 12"
                        >
                          <path
                            d="M0,8 C50,2 150,2 200,8 L200,12 L0,12 Z"
                            fill="currentColor"
                            opacity="0.6"
                          ></path>
                        </svg>
                      </span>
                    </h1>
                  </div>

                  {/* Subtitle */}
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
                    AnnaSathi AI connects surplus food donors with verified shelters, community dining halls,
                    and agile couriers — powered by AI for maximum reach, strict food safety, and zero waste.
                  </p>

                  {/* Dual CTAs */}
                  <div className="flex flex-wrap items-center gap-space-md w-full sm:w-auto">
                    <a
                      href="#quick-dispatch"
                      className="inline-flex items-center justify-center gap-space-sm px-space-xl py-space-md bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg rounded-xl shadow-md transition-all duration-200 transform hover:-translate-y-0.5 font-bold"
                    >
                      <span className="material-symbols-outlined text-[20px]">takeout_dining</span>
                      <span>Donate Surplus Food</span>
                    </a>
                    <a
                      href="#live-radar"
                      className="inline-flex items-center justify-center gap-space-sm px-space-lg py-space-md bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-lg text-label-lg rounded-xl transition-all duration-200 font-semibold"
                    >
                      <span className="material-symbols-outlined text-[20px] text-secondary">radar</span>
                      <span>Explore Live Rescue Radar</span>
                    </a>
                  </div>

                  {/* Live Trust Stats Strip */}
                  <div className="pt-space-sm flex flex-wrap items-center gap-y-2 gap-x-6 text-on-surface-variant font-label-sm text-label-sm bg-surface-container-lowest/90 px-space-md py-space-xs rounded-xl shadow-sm border border-outline-variant/30">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-[16px]">bolt</span>
                      <span className="font-semibold text-on-surface">Match avg: 4.2 mins</span>
                    </div>
                    <span className="text-outline-variant">•</span>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-[16px]">thermostat</span>
                      <span className="font-semibold text-on-surface">100% Thermal Verified</span>
                    </div>
                    <span className="text-outline-variant">•</span>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
                      <span className="font-semibold text-on-surface">Auto 80G Tax Certificates</span>
                    </div>
                  </div>
                </div>

                {/* Right Hero Visual Showcase: Real-time Dynamic Rescue Card (5 cols) */}
                <div className="lg:col-span-5 relative">
                  {/* Decorative backing card */}
                  <div className="absolute inset-0 bg-secondary-fixed-dim/40 rounded-2xl transform rotate-2 scale-98 blur-[1px]"></div>
                  <div className="relative bg-surface-container-lowest rounded-2xl p-space-lg shadow-xl border border-outline-variant/30 flex flex-col gap-space-md">
                    {/* Card Header */}
                    <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high">
                      <div className="flex items-center gap-space-xs">
                        <span className="w-3 h-3 rounded-full bg-secondary animate-pulse"></span>
                        <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider">
                          Active Rescue Broadcast
                        </span>
                      </div>
                      <div className="px-space-sm py-1 bg-tertiary-fixed text-tertiary-container rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">timer</span>
                        <span className="font-label-sm text-label-sm font-bold">Window: 48m left</span>
                      </div>
                    </div>

                    {/* Donor & Batch Specs */}
                    <div className="flex gap-space-md items-start">
                      <div className="w-14 h-14 rounded-xl bg-surface-container-high flex-shrink-0 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[28px]">hotel</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">
                            The Grand Orchid Ballroom
                          </h2>
                          <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                          Sector 29, Cyber Hub • Verified 5-Star Kitchen
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                            140 Portions
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                            Dal Makhani, Rice, Roti
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-secondary-container/50 text-on-secondary-fixed font-label-sm text-label-sm font-bold">
                            100% Pure Veg
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mini Map / Geolocation Visual */}
                    <div className="relative w-full h-36 rounded-xl overflow-hidden bg-surface-container-high flex flex-col justify-end p-space-sm">
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-85"
                        style={{
                          backgroundImage:
                            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB4tY9epfgKJAVtOxZKjltkN7buymcKGgM5D_rOl3opNSiMJ-rzGqKUzmTUgWf0r7QlqyEICSgGF_WhVJDFPxT-YlCM7P3Sh3Bia5i2w6ah-N_5yXeujsXXB7gO-0bGmZAkKMavHPdRu8FvEo_QNLnrniy2DFUQSoa7mH-9AEEw0ptS3PDz4QA5uimlrAhPjalZEcC8qdcIvqEcQZlgeeP1S2sx-JSJiLdWIrn7TJfs')",
                        }}
                      ></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-transparent to-transparent"></div>

                      {/* Route Marker overlay */}
                      <div className="relative z-10 flex items-center justify-between text-on-primary">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded bg-secondary text-on-secondary font-label-sm text-label-sm font-bold">
                            AI Matched
                          </span>
                          <span className="font-body-sm text-body-sm text-surface-bright font-medium">
                            Target: Seva Shelter (1.8 km)
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-label-sm text-label-sm text-primary-fixed">
                          <span className="material-symbols-outlined text-[16px]">navigation</span>
                          <span>6 min courier arrival</span>
                        </div>
                      </div>
                    </div>

                    {/* Thermal & Safety Chain Sensor Telemetry */}
                    <div className="grid grid-cols-3 gap-2 bg-surface-container-low rounded-xl p-space-sm text-center">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-outline">Thermal Probe</span>
                        <span className="font-label-lg text-label-lg text-primary font-bold">68.4°C Safe</span>
                      </div>
                      <div className="flex flex-col border-x border-surface-container-highest">
                        <span className="font-label-sm text-label-sm text-outline">Match Accuracy</span>
                        <span className="font-label-lg text-label-lg text-secondary font-bold">98.4%</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-outline">Courier Assigned</span>
                        <span className="font-label-lg text-label-lg text-primary font-bold">Rider #402</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center justify-between pt-space-xs">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-[20px]">
                          format_image_left
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                          FSSAI Golden Hour Protocol
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setModalContent({
                            title: 'Active Rescue Telemetry – Batch #AR-8821',
                            body:
                              'Location: Sector 29, Cyber Hub\nDonor: The Grand Orchid Ballroom\nStatus: Rider #402 en route with insulated thermal container\nProbe Temp: 68.4°C (Safe Zone)\nTarget Destination: Seva Orphanage & Shelter\nETA: 6 Minutes\nFSSAI Chain of Custody: Logged and Cryptographically Signed.',
                          })
                        }
                        className="px-space-md py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors font-bold"
                      >
                        View Telemetry →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              TELEMETRY / REAL-TIME IMPACT STRIP
          ========================================================================== */}
          <section className="w-full bg-primary text-on-primary py-space-xl relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">
                {/* Metric 1 */}
                <div className="flex flex-col gap-1 p-space-md rounded-2xl bg-primary-container/40 border border-primary-fixed-dim/20">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-semibold">
                      Meals Redistributed
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm font-bold">
                      +180 today
                    </span>
                  </div>
                  <span className="font-display-lg text-display-lg text-on-primary font-extrabold tracking-tight">
                    142,892+
                  </span>
                  <p className="font-body-sm text-body-sm text-surface-container-highest">
                    Nutritious hot meals served to verified shelter networks
                  </p>
                </div>

                {/* Metric 2 */}
                <div className="flex flex-col gap-1 p-space-md rounded-2xl bg-primary-container/40 border border-primary-fixed-dim/20">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-semibold">
                      GHG Offset
                    </span>
                    <span className="material-symbols-outlined text-secondary-fixed text-[20px]">eco</span>
                  </div>
                  <span className="font-display-lg text-display-lg text-on-primary font-extrabold tracking-tight">
                    84.6 t
                  </span>
                  <p className="font-body-sm text-body-sm text-surface-container-highest">
                    CO2 emissions avoided, equivalent to planting 3,800 trees
                  </p>
                </div>

                {/* Metric 3 */}
                <div className="flex flex-col gap-1 p-space-md rounded-2xl bg-primary-container/40 border border-primary-fixed-dim/20">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-semibold">
                      Verified NGO Hubs
                    </span>
                    <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
                      corporate_fare
                    </span>
                  </div>
                  <span className="font-display-lg text-display-lg text-on-primary font-extrabold tracking-tight">
                    380+
                  </span>
                  <p className="font-body-sm text-body-sm text-surface-container-highest">
                    Accredited orphanages &amp; hunger relief centers in 12 metro hubs
                  </p>
                </div>

                {/* Metric 4 */}
                <div className="flex flex-col gap-1 p-space-md rounded-2xl bg-primary-container/40 border border-primary-fixed-dim/20">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-semibold">
                      Avg Redistribution Speed
                    </span>
                    <span className="material-symbols-outlined text-secondary-fixed text-[20px]">speed</span>
                  </div>
                  <span className="font-display-lg text-display-lg text-secondary-container font-extrabold tracking-tight">
                    16.4 min
                  </span>
                  <p className="font-body-sm text-body-sm text-surface-container-highest">
                    From kitchen completion to authenticated receipt at shelter
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              THE 4 CORE PILLARS OF ANNASATHI AI
          ========================================================================== */}
          <section className="w-full bg-surface py-space-xl lg:py-24" id="about-us">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-space-xl">
              {/* Section Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
                <div className="flex flex-col gap-space-xs max-w-2xl">
                  <span className="font-label-md text-label-md text-secondary uppercase font-bold tracking-widest">
                    Architected for Scalable Impact
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-primary font-extrabold tracking-tight">
                    The Algorithmic Food Rescue Engine
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant">
                    A frictionless ecosystem bridging food donors, grassroots non-profits, logistics partners,
                    and ethical algorithms into a synchronized relief web.
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                    Autonomous Protocol
                  </span>
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span className="font-label-sm text-label-sm text-primary font-bold">v3.4 Production</span>
                </div>
              </div>

              {/* Feature Image Display Banner */}
              <div className="w-full rounded-3xl overflow-hidden shadow-lg relative bg-surface-container-high">
                <img
                  alt="AnnaSathi AI Core Architecture Diagram and Mobile Dispatch Flow"
                  className="w-full h-auto object-cover max-h-[500px]"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxmSV78tsAHDOmpjm9G0BZPNT6f3Rd7qhC6lVcWr17DwbWUWWUSDT2CE2qyvy__oZ3CSIimtrbnT5s1Hfu5dn-oNVJyVsjfy5Ru6qPhnEV-SsWSyjSIsPz_S6fnrTm2D9hgYfxTK9Ocg7XsgFo_jicQGR2nU-7kVq_14G3v1Un6m99Q7SbPOLa_rBfVCIeqWVkrp9OdfTaI-qt330KEg-7pr_o5ypXI0_pIzLfCq-N6ofET5GkiAGJsA"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-primary/95 via-primary/60 to-transparent p-space-lg md:p-space-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md text-on-primary">
                  <div className="flex flex-col max-w-xl">
                    <span className="font-label-sm text-label-sm text-secondary-fixed uppercase tracking-wider font-bold">
                      End-to-End Orchestration
                    </span>
                    <span className="font-headline-md text-headline-md font-bold">
                      Instant Multimodal Matching with Automated Chain of Custody
                    </span>
                  </div>
                  <a
                    href="#how-it-works"
                    className="px-space-lg py-space-sm bg-secondary-container text-on-secondary-fixed font-label-lg text-label-lg rounded-xl hover:bg-secondary-fixed transition-colors font-bold whitespace-nowrap shadow-sm"
                  >
                    Read System Architecture →
                  </a>
                </div>
              </div>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg">
                {/* Pillar 1 */}
                <div className="group bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between border border-outline-variant/30">
                  <div className="flex flex-col gap-space-sm">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                      <span className="material-symbols-outlined text-[26px]">restaurant</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                      Reduce Food Waste
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Hotels, corporate cafeterias, and caterers easily turn surplus liability into documented
                      corporate social responsibility and 80G tax write-offs.
                    </p>
                  </div>
                  <div className="pt-space-md mt-space-md border-t border-surface-container-high flex items-center justify-between text-secondary font-label-sm text-label-sm font-bold">
                    <span>Zero Food to Landfills</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="group bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between border border-outline-variant/30">
                  <div className="flex flex-col gap-space-sm">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                      <span className="material-symbols-outlined text-[26px]">volunteer_activism</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                      Verified NGO Network
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Instant geofenced notifications to vetted community kitchens, orphanages, and night
                      shelters filtered by exact head-count and dietary safety.
                    </p>
                  </div>
                  <div className="pt-space-md mt-space-md border-t border-surface-container-high flex items-center justify-between text-secondary font-label-sm text-label-sm font-bold">
                    <span>FSSAI Verified Beneficiaries</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="group bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between border border-outline-variant/30">
                  <div className="flex flex-col gap-space-sm">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                      <span className="material-symbols-outlined text-[26px]">electric_moped</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                      Volunteer &amp; Courier Fleet
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Real-time route-optimization for quick delivery drivers equipped with insulated thermal
                      bags to safely transport meals in minutes.
                    </p>
                  </div>
                  <div className="pt-space-md mt-space-md border-t border-surface-container-high flex items-center justify-between text-secondary font-label-sm text-label-sm font-bold">
                    <span>Cold &amp; Hot Chain Monitored</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                </div>

                {/* Pillar 4 */}
                <div className="group bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between border border-outline-variant/30">
                  <div className="flex flex-col gap-space-sm">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                      <span className="material-symbols-outlined text-[26px]">psychology</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                      AI Multimodal Match
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Computer vision assesses food freshness, estimates volume, categorizes allergens, and
                      pairs it to the closest needy cluster before spoilage.
                    </p>
                  </div>
                  <div className="pt-space-md mt-space-md border-t border-surface-container-high flex items-center justify-between text-secondary font-label-sm text-label-sm font-bold">
                    <span>10-Minute Precision Window</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              STEP-BY-STEP AUTONOMOUS REDISTRIBUTION ENGINE
          ========================================================================== */}
          <section className="w-full bg-surface-container-low py-space-xl lg:py-24" id="how-it-works">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-space-xl">
              <div className="text-center max-w-3xl mx-auto flex flex-col gap-space-xs">
                <span className="font-label-md text-label-md text-secondary font-bold uppercase tracking-wider">
                  Precision Protocol
                </span>
                <h2 className="font-display-lg text-display-lg text-primary font-extrabold tracking-tight">
                  How AnnaSathi Orchestrates Live Rescues
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  Perishable food demands zero administrative latency. Our 3-step pipeline safeguards nutrition,
                  prevents health hazards, and proves custody in real-time.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
                {/* Step 1 */}
                <div className="relative bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <span className="font-display-lg text-display-lg text-surface-container-highest font-extrabold">
                      01
                    </span>
                    <span className="px-space-sm py-1 bg-surface-container rounded-full font-label-sm text-label-sm text-primary font-bold">
                      Instant Scan
                    </span>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <h3 className="font-headline-md text-headline-md text-primary font-bold">
                      Multimodal Vision Intake
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      The kitchen manager takes a 3-second camera sweep. AI extracts portion counts, identifies
                      dishes (Veg/Jain/Halal), detects thermal steam viability, and calculates expiration down to
                      10 minutes.
                    </p>
                  </div>
                  <div className="p-space-sm bg-surface-container rounded-xl flex items-center gap-space-sm mt-auto">
                    <span className="material-symbols-outlined text-secondary text-[24px]">camera_enhance</span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface font-bold">
                        Instant Tagging Engine
                      </span>
                      <span className="font-label-sm text-label-sm text-outline">
                        Accuracy verified via 12M culinary datasets
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <span className="font-display-lg text-display-lg text-surface-container-highest font-extrabold">
                      02
                    </span>
                    <span className="px-space-sm py-1 bg-secondary-container text-on-secondary-fixed rounded-full font-label-sm text-label-sm font-bold">
                      Sub-Minute Match
                    </span>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <h3 className="font-headline-md text-headline-md text-primary font-bold">
                      Dynamic Geofence Routing
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      The algorithm matches the donation against immediate shelter capacity, dietary
                      constraints of sheltered children or senior citizens, and dispatches the nearest
                      thermal-bag-equipped courier.
                    </p>
                  </div>
                  <div className="p-space-sm bg-surface-container rounded-xl flex items-center gap-space-sm mt-auto">
                    <span className="material-symbols-outlined text-secondary text-[24px]">share_location</span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface font-bold">
                        Proximity Holding Matrix
                      </span>
                      <span className="font-label-sm text-label-sm text-outline">
                        Optimized under 25-minute travel radius
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <span className="font-display-lg text-display-lg text-surface-container-highest font-extrabold">
                      03
                    </span>
                    <span className="px-space-sm py-1 bg-surface-container rounded-full font-label-sm text-label-sm text-primary font-bold">
                      Safe Handoff
                    </span>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <h3 className="font-headline-md text-headline-md text-primary font-bold">
                      Thermal Audit &amp; Tax Signoff
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      Upon shelter handoff, destination temperature is verified, OTP pin confirmed, and an
                      FSSAI-compliant chain-of-custody audit log generates an instant 80G tax rebate certificate
                      for the donor.
                    </p>
                  </div>
                  <div className="p-space-sm bg-surface-container rounded-xl flex items-center gap-space-sm mt-auto">
                    <span className="material-symbols-outlined text-secondary text-[24px]">verified_user</span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface font-bold">
                        Instant CSR Certificate
                      </span>
                      <span className="font-label-sm text-label-sm text-outline">
                        Signed PDF with tamper-proof QR code
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              LIVE RESCUE RADAR SIMULATION FEED
          ========================================================================== */}
          <section className="w-full bg-surface py-space-xl lg:py-24" id="live-radar">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-space-lg">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-xs">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                    </span>
                    <span className="font-label-md text-label-md text-secondary font-bold uppercase tracking-wider">
                      Live City Dispatch Telemetry
                    </span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg text-primary font-extrabold">
                    Active Rescues Happening Right Now
                  </h2>
                </div>

                {/* City Filter Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveCity('all')}
                    className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                      activeCity === 'all'
                        ? 'bg-primary text-on-primary font-bold shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    All Hubs
                  </button>
                  <button
                    onClick={() => setActiveCity('delhi')}
                    className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                      activeCity === 'delhi'
                        ? 'bg-primary text-on-primary font-bold shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    Delhi NCR
                  </button>
                  <button
                    onClick={() => setActiveCity('mumbai')}
                    className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                      activeCity === 'mumbai'
                        ? 'bg-primary text-on-primary font-bold shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    Mumbai
                  </button>
                  <button
                    onClick={() => setActiveCity('bengaluru')}
                    className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                      activeCity === 'bengaluru'
                        ? 'bg-primary text-on-primary font-bold shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    Bengaluru
                  </button>
                </div>
              </div>

              {/* Live Feed Table/Cards */}
              <div className="flex flex-col gap-space-sm">
                {filteredRescues.map((item) => (
                  <div
                    key={item.id}
                    className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-space-md">
                      <div
                        className={`w-12 h-12 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center font-bold flex-shrink-0`}
                      >
                        <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-headline-sm text-headline-sm text-primary font-bold">
                            {item.source}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md ${item.badgeStyle} font-label-sm text-label-sm font-bold`}
                          >
                            {item.badgeText}
                          </span>
                          <span className="font-label-sm text-label-sm text-outline">{item.timeAgo}</span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {item.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-space-lg border-t lg:border-t-0 pt-space-xs lg:pt-0 border-surface-container">
                      <div className="flex flex-col text-right">
                        <span className="font-label-sm text-label-sm text-outline">{item.stat1Label}</span>
                        <span className="font-label-md text-label-md text-primary font-bold">
                          {item.stat1Value}
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="font-label-sm text-label-sm text-outline">{item.stat2Label}</span>
                        <span className="font-label-md text-label-md text-secondary font-bold">
                          {item.stat2Value}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (item.actionType === 'gps') {
                            setModalContent({
                              title: `Live Courier GPS Telemetry – ${item.source}`,
                              body: `Live Telemetry Coordinates: 28.4595° N, 77.0266° E\nCourier: Rider #402 (Active Insulated Van)\nSpeed: 32 km/h • Heading: South-West\nCargo: 185 warm meals maintained at 64°C\nDestination: Karuna Community Kitchen\nETA: 7 Minutes remaining.`,
                            });
                          } else if (item.actionType === 'receipt') {
                            setModalContent({
                              title: `80G Tax Exemption & Food Safety Certificate`,
                              body: `Certificate ID: 80G-AS-2026-9042\nEntity: FreshBakery Co. Logistics Hub\nRecipient: Bal Sahyog Children Home (Reg: 12A/80G Verified)\nVolume: 320 bakery packs\nHandoff OTP: #8912 (Confirmed)\nDigital Signature: Verified FSSAI Chain of Custody\nStatus: Board-Ready PDF Generated.`,
                            });
                          } else {
                            if (isAuthenticated && user?.role === 'ngo') {
                              navigate('/ngo/available-donations');
                            } else {
                              setModalContent({
                                title: `Claim Rescue Batch – ${item.source}`,
                                body: `210 portions catered lunch buffet are currently available for immediate dispatch.\n\nSign in to your verified NGO account or register your shelter to receive immediate delivery right to your door.`,
                              });
                            }
                          }
                        }}
                        className="px-space-md py-2 rounded-lg bg-surface-container-low text-primary font-label-md text-label-md hover:bg-surface-container transition-colors font-semibold"
                      >
                        {item.actionText}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* =========================================================================
              STAKEHOLDER ECOSYSTEM SWITCHER
          ========================================================================== */}
          <section className="w-full bg-surface-container-low py-space-xl lg:py-24" id="network-ecosystem">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-space-xl">
              <div className="text-center max-w-2xl mx-auto flex flex-col gap-space-xs">
                <span className="font-label-md text-label-md text-secondary uppercase font-bold tracking-wider">
                  Tailored Portals
                </span>
                <h2 className="font-headline-lg text-headline-lg text-primary font-extrabold">
                  Engineered for Every Link in the Rescue Chain
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Select your institutional role to preview the specific benefits, compliance coverage, and tools
                  AnnaSathi puts at your fingertips.
                </p>
              </div>

              {/* Interactive Ecosystem Container with Tab Switching */}
              <div className="bg-surface-container-lowest rounded-3xl p-space-lg lg:p-space-xl shadow-lg border border-outline-variant/30 flex flex-col gap-space-lg">
                {/* Tab Navigation Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-surface-container rounded-2xl max-w-xl mx-auto">
                  <button
                    onClick={() => setActiveEcoTab('donors')}
                    className={`px-space-md py-2.5 rounded-xl font-label-md text-label-md transition-all ${
                      activeEcoTab === 'donors'
                        ? 'font-bold bg-primary text-on-primary shadow-sm'
                        : 'font-semibold text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Hotels &amp; Caterers (Donors)
                  </button>
                  <button
                    onClick={() => setActiveEcoTab('ngos')}
                    className={`px-space-md py-2.5 rounded-xl font-label-md text-label-md transition-all ${
                      activeEcoTab === 'ngos'
                        ? 'font-bold bg-primary text-on-primary shadow-sm'
                        : 'font-semibold text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    NGOs &amp; Shelters (Receivers)
                  </button>
                  <button
                    onClick={() => setActiveEcoTab('couriers')}
                    className={`px-space-md py-2.5 rounded-xl font-label-md text-label-md transition-all ${
                      activeEcoTab === 'couriers'
                        ? 'font-bold bg-primary text-on-primary shadow-sm'
                        : 'font-semibold text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Logistics &amp; Couriers
                  </button>
                </div>

                {/* Donors Tab Panel */}
                {activeEcoTab === 'donors' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
                    <div className="lg:col-span-6 flex flex-col gap-space-md">
                      <span className="px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold w-fit">
                        Zero Liability • Instant Tax Write-offs
                      </span>
                      <h3 className="font-headline-lg text-headline-lg text-primary font-bold">
                        Turn surplus kitchen inventory into certified ESG leadership
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        Don’t let nutritious excess go to waste after banquets, buffets, or conferences. AnnaSathi
                        removes operational friction with 30-second donation creation, automated courier routing,
                        and full legal indemnity under FSSAI surplus food regulations.
                      </p>
                      <ul className="flex flex-col gap-space-xs text-body-sm text-on-surface">
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            check_circle
                          </span>
                          <span>
                            Automatic 80G tax donation deduction receipt generated upon confirmed drop-off
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            check_circle
                          </span>
                          <span>Complete Good Samaritan legal protection against food liability</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            check_circle
                          </span>
                          <span>
                            Monthly ESG environmental impact digest quantifying kilograms saved and carbon credits
                          </span>
                        </li>
                      </ul>
                      <div className="pt-space-xs">
                        <Link
                          to={isAuthenticated && user?.role === 'donor' ? '/donor/create-donation' : '/register'}
                          className="inline-flex items-center gap-2 px-space-lg py-space-sm bg-primary text-on-primary font-label-lg text-label-lg rounded-xl shadow hover:bg-primary-container transition-colors font-bold"
                        >
                          <span>Enroll Commercial Kitchen</span>
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                    <div className="lg:col-span-6">
                      <div className="rounded-2xl overflow-hidden shadow-md bg-surface-container relative">
                        <div
                          className="bg-cover bg-center w-full h-80"
                          style={{
                            backgroundImage:
                              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDM3V5y4QO_LJFhCV2P_KdypdElITlSmcAmOC8h30NGQ_KDzD2Kn4ATjvoxsnRJG-C5HQoIdBGgTRxweZlFy9PTZTqgGR1-m4i4_HbIEjuh3puKzfC0buZfRauSLfRh1Xd9aHTkotCDZvpcQ21o7_K39B0Ad_yHSac0YO0gFQYFBkxSSOsfb8-KFDnlpqWlCQo6_o1TATjP6g8M5YeNGJ8xbshMZBTBLfsmrsaUdpgW')",
                          }}
                        ></div>
                        <div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md p-space-md rounded-xl shadow">
                          <span className="font-label-sm text-label-sm text-secondary font-bold uppercase">
                            Corporate Impact Partner
                          </span>
                          <p className="font-headline-sm text-headline-sm text-primary font-bold">
                            "Reduced our banquet waste volume to 0% in the first quarter alone."
                          </p>
                          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                            — Executive Chef Sanjay Roy, Metropolitan Palace
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NGOs Tab Panel */}
                {activeEcoTab === 'ngos' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
                    <div className="lg:col-span-6 flex flex-col gap-space-md">
                      <span className="px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold w-fit">
                        Predictable Free Fresh Meals
                      </span>
                      <h3 className="font-headline-lg text-headline-lg text-primary font-bold">
                        Reliable nutrition pipeline for orphanages, shelters &amp; dining halls
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        Shelters can claim high-quality prepared meals in real time. Set your shelter’s demographic
                        restrictions, dietary protocols (pure vegetarian, diabetic-friendly, high protein), and
                        receiving schedules to receive automated match alerts when food becomes available nearby.
                      </p>
                      <ul className="flex flex-col gap-space-xs text-body-sm text-on-surface">
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            check_circle
                          </span>
                          <span>FSSAI thermal probe data attached to every inbound dispatch</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            check_circle
                          </span>
                          <span>Direct delivery straight to your shelter doors via our courier network</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            check_circle
                          </span>
                          <span>Zero platform cost or subscription charges for verified 12A/80G non-profits</span>
                        </li>
                      </ul>
                      <div className="pt-space-xs">
                        <Link
                          to={isAuthenticated && user?.role === 'ngo' ? '/ngo/dashboard' : '/register'}
                          className="inline-flex items-center gap-2 px-space-lg py-space-sm bg-primary text-on-primary font-label-lg text-label-lg rounded-xl shadow hover:bg-primary-container transition-colors font-bold"
                        >
                          <span>Accredit Your Shelter</span>
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                    <div className="lg:col-span-6">
                      <div className="rounded-2xl overflow-hidden shadow-md bg-surface-container relative">
                        <div
                          className="bg-cover bg-center w-full h-80"
                          style={{
                            backgroundImage:
                              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDnLIhgxvN3Ui9UpWGbrq6_3rQ3QHd-cfWI7bCdwQ6bBVTqSy3u8CxiCkr8cBbM0BzVjkASLALuV8yCaBYee2YVSbYMno8KoJRIEQL177eWdNhYmGt53KxJLrjzzsdXm7k5sJnI6Dgzg7QBUObfjG8jcMIx27kCywaYXgNkV1zo6CuDlGIaXonEKNTknpM_XwRyEAYFgjHNpBbz5TSaixIKRk2STnfZxf2100TTqULy')",
                          }}
                        ></div>
                        <div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md p-space-md rounded-xl shadow">
                          <span className="font-label-sm text-label-sm text-secondary font-bold uppercase">
                            Verified Shelter Network
                          </span>
                          <p className="font-headline-sm text-headline-sm text-primary font-bold">
                            "Now we provide fresh dinners every evening without stressing over budget shortages."
                          </p>
                          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                            — Aruna Devi, Director, Bal Sanskar Trust
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Couriers Tab Panel */}
                {activeEcoTab === 'couriers' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
                    <div className="lg:col-span-6 flex flex-col gap-space-md">
                      <span className="px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold w-fit">
                        Flexible Gig Earnings &amp; Purpose
                      </span>
                      <h3 className="font-headline-lg text-headline-lg text-primary font-bold">
                        Deliver hot meals with hyper-localized batch incentives
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        Join India’s most meaningful dispatch network. Couriers and two-wheeler operators pick up
                        batch meals during off-peak delivery hours (10:30 PM - 1:00 AM) and deliver directly within
                        a 3 to 5 km hyper-local corridor.
                      </p>
                      <ul className="flex flex-col gap-space-xs text-body-sm text-on-surface">
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            check_circle
                          </span>
                          <span>Free high-grade thermal bags provided upon onboarding verification</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            check_circle
                          </span>
                          <span>Guaranteed fair payout per rescue trip + environmental tip bonuses</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            check_circle
                          </span>
                          <span>Flexible on-demand shifts that seamlessly complement your daytime schedule</span>
                        </li>
                      </ul>
                      <div className="pt-space-xs">
                        <Link
                          to={isAuthenticated && user?.role === 'volunteer' ? '/volunteer/dashboard' : '/register'}
                          className="inline-flex items-center gap-2 px-space-lg py-space-sm bg-primary text-on-primary font-label-lg text-label-lg rounded-xl shadow hover:bg-primary-container transition-colors font-bold"
                        >
                          <span>Join Volunteer Courier Fleet</span>
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                    <div className="lg:col-span-6">
                      <div className="rounded-2xl overflow-hidden shadow-md bg-surface-container relative">
                        <div
                          className="bg-cover bg-center w-full h-80"
                          style={{
                            backgroundImage:
                              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCFEcgBkX0GJslE1GAEN6rWaUVuQKLSKDnU9jNM2HJy7Ha0nrVvgtKTGKA3yIouT7MStMKf_l0WWRntQyxkFwdvGcnxKWIkPy8dDPd0PMTyM8SJzr8TqvKigX3A-mbDz2UbDAb3gpuh1_BnFIJIbupCN8pFUeq0_Q-8k5-qwvaiR8TQThae75HYl4h57gUhW7-cenXp5YMnclrmqQJqEHh50BPNQDMKhpBj1ffGAByg')",
                          }}
                        ></div>
                        <div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md p-space-md rounded-xl shadow">
                          <span className="font-label-sm text-label-sm text-secondary font-bold uppercase">
                            Active Field Courier
                          </span>
                          <p className="font-headline-sm text-headline-sm text-primary font-bold">
                            "Knowing that a 15-minute trip feeds 80 kids makes this the most rewarding ride of my night."
                          </p>
                          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                            — Vikrant S., Express Partner
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* =========================================================================
              VOICES FROM THE FIELD (TESTIMONIALS & SOCIAL PROOF)
          ========================================================================== */}
          <section className="w-full bg-surface py-space-xl lg:py-24">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-space-xl">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-md text-label-md text-secondary font-bold uppercase tracking-wider">
                    Verified Testimonials
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-primary font-extrabold">
                    Voices From The Zero-Waste Frontline
                  </h2>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className="material-symbols-outlined text-[20px] text-secondary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                  <span className="font-label-lg text-label-lg font-bold ml-2 text-primary">
                    4.9/5 from 420+ Partners
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
                {/* Card 1 */}
                <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center text-secondary">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className="material-symbols-outlined text-[18px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed italic">
                      "We host weddings with 1,000+ guests every weekend. Surplus estimation used to be a nightmare of
                      guilt. With AnnaSathi AI, couriers arrive within 12 minutes of dinner closing. The thermal logging
                      gives our kitchen zero liability."
                    </p>
                  </div>
                  <div className="pt-space-md mt-space-md border-t border-surface-container flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden flex-shrink-0">
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{
                          backgroundImage:
                            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDvQBnYmcyOka82Ms2uc9Rw-yMvRsDAnfA_iaDQvjz3wq2pl4uQWrE_mfF75j9toEw9exMYStxcUJKoxOpQy_LZ0J5RUM1fz_SguyVWXabxo-TIhjaH-Dge9hLBYuAySAd9_IDoI7E1NcrmNLnPBvUrJCOGed__wF88r3Kg9kdhYbkdJbtmDv9gkLk_mnZHbIbOVmmk-Dxw5Wv4im6KgjzzYF9cA1gy3tsGagk-8n_q')",
                        }}
                      ></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-primary font-bold">
                        Chef Rajesh Mehra
                      </span>
                      <span className="font-label-sm text-label-sm text-outline">
                        Executive Chef, The Royale Imperial Banquets
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center text-secondary">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className="material-symbols-outlined text-[18px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed italic">
                      "The speed and predictability are incredible. We care for 140 underprivileged children. Receiving
                      balanced, five-star hotel meals that are still hot and safely sealed has transformed our operating
                      budget and nutritional intake."
                    </p>
                  </div>
                  <div className="pt-space-md mt-space-md border-t border-surface-container flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden flex-shrink-0">
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{
                          backgroundImage:
                            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBURkaIefHiWHoctjvjvof-Sui3q4Jsy_7pu55iZOq6DKoBmdo3NO8JJvy5cYxFQQexqWVyQOPPCOHLYEgZzN_OLnLRW1DbdYGYO_7qfwCwvYDLEy5Z22bJ2IfZ76yqZCLx3BkMU5NHwn7spsIl3KVKy7cFy8k8QNvg5FYfc1SbiTrKVQI0g2KdLs7xy8CbRe6_mzfZagP4H8OMvJl0jPODZ_HBrjusaJrmguVv4v5P')",
                        }}
                      ></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-primary font-bold">
                        Dr. Sunita Kulkarni
                      </span>
                      <span className="font-label-sm text-label-sm text-outline">
                        Founder, Mother Teresa Child Care Foundation
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center text-secondary">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className="material-symbols-outlined text-[18px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed italic">
                      "From a CSR and compliance standpoint, AnnaSathi gives us auditable, board-ready impact figures.
                      We receive instant 80G tax deductions with digital audit trails, preventing over 42 metric tons of
                      food waste in our campus cafeterias."
                    </p>
                  </div>
                  <div className="pt-space-md mt-space-md border-t border-surface-container flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden flex-shrink-0">
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{
                          backgroundImage:
                            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCgLtyqh8J_TjqaATQzW4pWWVugOM3fZbwqlt3pcNf5D3XFh9JToUddN8v9460AWJpS2VQ8ioChqzL_vJsAStS9pHe6Ooa2_SgU6JUeNkAAqEhljqCw7zOLOGpceFVt2036tpOA-GEKWyFmAl4VbL5cEIwOkdLDhE_vlOmuXR4pTNIkynKwGKZINFM5xEGSwi-KRwCULnDySaMskiaDmSeU6-1oVjDD_IdMJb_UOYqi')",
                        }}
                      ></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-primary font-bold">
                        Amitav Ghosh
                      </span>
                      <span className="font-label-sm text-label-sm text-outline">
                        Head of ESG &amp; CSR, NexaTech Global Solutions
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              HIGH-CONVERSION CTA DISPATCH BANNER
          ========================================================================== */}
          <section
            className="w-full bg-primary-container text-on-primary py-space-xl lg:py-24 relative overflow-hidden"
            id="quick-dispatch"
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
              <div className="bg-primary rounded-3xl p-space-lg lg:p-space-xl shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-space-xl border border-primary-fixed-dim/20">
                <div className="flex flex-col gap-space-md max-w-xl">
                  <div className="inline-flex items-center gap-2 px-space-sm py-1 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm font-bold w-fit">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    <span>Immediate Response Active</span>
                  </div>
                  <h2 className="font-display-lg text-display-lg font-extrabold tracking-tight text-on-primary">
                    Be Part of India's Zero Waste Mission
                  </h2>
                  <p className="font-body-lg text-body-lg text-surface-container-high">
                    Have surplus prepared food right now? Input your institutional details and an accredited thermal
                    courier will be dispatched to your location in under 15 minutes.
                  </p>
                  <div className="flex items-center gap-6 text-on-primary font-label-sm text-label-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary-fixed text-[18px]">lock</span>
                      <span className="font-semibold">100% Free for Donors</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary-fixed text-[18px]">verified</span>
                      <span className="font-semibold">Section 135 Compliant</span>
                    </div>
                  </div>
                </div>

                {/* Quick Start Dispatch Box */}
                <div className="w-full lg:max-w-md bg-surface-container-lowest rounded-2xl p-space-lg text-on-surface shadow-xl flex flex-col gap-space-md border border-outline-variant/30">
                  <div className="flex flex-col gap-1">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">
                      Request Immediate Dispatch
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Instant thermal pickup or partner registration
                    </span>
                  </div>

                  {dispatchStatus && (
                    <div className="p-space-sm rounded-lg bg-secondary-container text-on-secondary-fixed font-body-sm text-body-sm font-medium">
                      {dispatchStatus}
                    </div>
                  )}

                  <form onSubmit={handleDispatchSubmit} className="flex flex-col gap-space-sm">
                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm text-primary uppercase font-bold">
                        Kitchen / Entity Name
                      </label>
                      <input
                        className="w-full px-space-sm py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. Radisson Blu Kitchen / Grand Caterers"
                        required
                        type="text"
                        value={dispatchForm.entityName}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, entityName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-space-sm">
                      <div className="flex flex-col gap-1">
                        <label className="font-label-sm text-label-sm text-primary uppercase font-bold">
                          Contact Phone
                        </label>
                        <input
                          className="w-full px-space-sm py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="+91 98765 43210"
                          required
                          type="tel"
                          value={dispatchForm.phone}
                          onChange={(e) => setDispatchForm({ ...dispatchForm, phone: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-sm text-label-sm text-primary uppercase font-bold">
                          Est. Portions
                        </label>
                        <input
                          className="w-full px-space-sm py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                          min="15"
                          placeholder="e.g. 80"
                          required
                          type="number"
                          value={dispatchForm.portions}
                          onChange={(e) => setDispatchForm({ ...dispatchForm, portions: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm text-primary uppercase font-bold">
                        Pickup Address &amp; City
                      </label>
                      <input
                        className="w-full px-space-sm py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Sector, Building, Street, City"
                        required
                        type="text"
                        value={dispatchForm.address}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, address: e.target.value })}
                      />
                    </div>
                    <button
                      className="mt-2 w-full py-3 bg-secondary hover:bg-secondary/90 text-on-secondary font-label-lg text-label-lg rounded-xl shadow-md transition-all flex items-center justify-center gap-2 font-bold cursor-pointer"
                      type="submit"
                    >
                      <span className="material-symbols-outlined text-[20px]">electric_bolt</span>
                      <span>Deploy Rescue Courier Now</span>
                    </button>
                  </form>
                  <span className="text-center font-label-sm text-label-sm text-outline">
                    Need urgent assistance? Call toll-free 1800-ANNASATHI (24/7 Ops Center)
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* =========================================================================
          INSTITUTIONAL FOOTER
      ========================================================================== */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant/40 mt-space-xl" id="tax-and-compliance">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-space-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-xl">
            <div className="lg:col-span-2 flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                  <span className="material-symbols-outlined text-[20px]">eco</span>
                </div>
                <span className="font-headline-sm text-headline-sm text-primary font-bold">AnnaSathi AI</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
                Engineering real-time algorithmic redistribution of perishable surplus meals from hotels,
                banquets, and commercial kitchens to accredited hunger relief shelters within safe-temperature
                windows.
              </p>
              <div className="flex flex-wrap items-center gap-space-xs">
                <span className="px-space-sm py-space-xs rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold">
                  FSSAI Compliant
                </span>
                <span className="px-space-sm py-space-xs rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold">
                  CSR Section 135
                </span>
                <span className="px-space-sm py-space-xs rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold">
                  80G Tax Deductible
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-space-sm">
              <span className="font-label-lg text-label-lg text-primary uppercase font-bold">Platform</span>
              <nav className="flex flex-col gap-space-xs">
                <a
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                  href="#how-it-works"
                >
                  How It Works
                </a>
                <a
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                  href="#live-radar"
                >
                  Impact Radar
                </a>
                <a
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                  href="#network-ecosystem"
                >
                  Network Ecosystem
                </a>
                <a
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                  href="#live-radar"
                >
                  Live Dispatch Tracker
                </a>
              </nav>
            </div>

            <div className="flex flex-col gap-space-sm">
              <span className="font-label-lg text-label-lg text-primary uppercase font-bold">
                Compliance &amp; Trust
              </span>
              <nav className="flex flex-col gap-space-xs">
                <a
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                  href="#tax-and-compliance"
                >
                  Tax &amp; Compliance
                </a>
                <a
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                  href="#about-us"
                >
                  About Us
                </a>
                <a
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                  href="#how-it-works"
                >
                  Food Safety Protocol
                </a>
                <Link
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                  to="/register"
                >
                  Partner Onboarding
                </Link>
              </nav>
            </div>

            <div className="flex flex-col gap-space-sm">
              <span className="font-label-lg text-label-lg text-primary uppercase font-bold">
                Stay Connected
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Receive dispatch updates, CSR impact digests, and surplus alerts.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-xs">
                  <input
                    className="w-full px-space-sm py-space-xs rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm placeholder:text-outline border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Enter institutional email"
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="px-space-md py-space-xs bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors shrink-0 font-bold"
                  >
                    Join
                  </button>
                </div>
                {newsletterSubscribed && (
                  <span className="text-secondary font-label-sm text-label-sm font-semibold">
                    ✓ Thank you for subscribing to zero-waste updates!
                  </span>
                )}
                <span className="font-label-sm text-label-sm text-outline">
                  Verified non-profit and commercial kitchen network
                </span>
              </form>
            </div>
          </div>

          <div className="mt-space-xl pt-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-md bg-surface-container rounded-xl px-space-lg py-space-md">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              © 2026 AnnaSathi AI. Built for a zero-waste tomorrow.
            </span>
            <div className="flex items-center gap-space-lg">
              <a
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
                href="#tax-and-compliance"
              >
                Privacy Policy
              </a>
              <a
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
                href="#tax-and-compliance"
              >
                Terms of Service
              </a>
              <a
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
                href="#tax-and-compliance"
              >
                CSR Guidelines
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          TELEMETRY / RECEIPT MODAL DIALOG
      ========================================================================== */}
      {modalContent && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalContent(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-lg shadow-2xl border border-outline-variant/30 flex flex-col gap-space-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-surface-container-high pb-space-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">verified</span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  {modalContent.title}
                </h3>
              </div>
              <button
                onClick={() => setModalContent(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <pre className="font-mono text-body-sm text-on-surface bg-surface-container-low p-space-md rounded-xl whitespace-pre-wrap leading-relaxed border border-outline-variant/30">
              {modalContent.body}
            </pre>
            <div className="flex justify-end gap-2 pt-space-xs">
              <button
                onClick={() => setModalContent(null)}
                className="px-space-lg py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors font-bold"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
