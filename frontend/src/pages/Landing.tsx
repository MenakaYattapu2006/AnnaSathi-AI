import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Radio,
  Clock,
  Sparkles,
  CheckCircle2,
  HeartHandshake,
  Building2,
  Truck,
  Leaf,
  Users,
  AlertTriangle,
  ChevronRight,
  FileCheck,
  TrendingUp,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DeliveryMap } from '../components/common/DeliveryMap';

type CityFilter = 'all' | 'hyderabad' | 'bengaluru' | 'mumbai' | 'delhi';
type EcoTab = 'donors' | 'ngos' | 'volunteers';

interface RescueRecord {
  id: string;
  source: string;
  city: CityFilter;
  badgeText: string;
  badgeVariant: 'active' | 'completed' | 'urgent';
  portions: string;
  foodType: string;
  destination: string;
  timeAgo: string;
  temperature: string;
  aiConfidence: string;
  courierId: string;
  pickupCoord: { latitude: number; longitude: number; label: string };
  volunteerCoord: { latitude: number; longitude: number; label: string };
  deliveryCoord: { latitude: number; longitude: number; label: string };
}

const cityCoordinates: Record<CityFilter, { lat: number; lng: number; zoom: number }> = {
  all: { lat: 17.4485, lng: 78.3908, zoom: 13 },
  hyderabad: { lat: 17.4485, lng: 78.3908, zoom: 13 },
  bengaluru: { lat: 12.9750, lng: 77.6350, zoom: 13 },
  mumbai: { lat: 19.0600, lng: 72.8650, zoom: 13 },
  delhi: { lat: 28.5950, lng: 77.1800, zoom: 13 },
};

const liveRescuesData: RescueRecord[] = [
  {
    id: 'res-hyd-1',
    source: 'The Grand Orchid Ballroom',
    city: 'hyderabad',
    badgeText: 'In Transit • 7m ETA',
    badgeVariant: 'active',
    portions: '140 Portions',
    foodType: 'Fresh Dal Makhani, Steamed Rice, Butter Roti (100% Pure Veg)',
    destination: 'Karuna Seva Orphanage & Shelter (Gachibowli)',
    timeAgo: '8 mins ago',
    temperature: '68.4°C Safe (Insulated)',
    aiConfidence: '99.4%',
    courierId: 'Rider #402',
    pickupCoord: { latitude: 17.448294, longitude: 78.391485, label: 'Grand Orchid Kitchen (Madhapur)' },
    volunteerCoord: { latitude: 17.441294, longitude: 78.385485, label: 'Courier #402 (In Transit)' },
    deliveryCoord: { latitude: 17.432294, longitude: 78.378485, label: 'Karuna Seva Shelter (Gachibowli)' },
  },
  {
    id: 'res-blr-1',
    source: 'Marriott Convention Center',
    city: 'bengaluru',
    badgeText: 'AI Matched • En Route Pickup',
    badgeVariant: 'urgent',
    portions: '210 Portions',
    foodType: 'Catered Buffet Platters, Paneer Curry, Pulao',
    destination: 'Sneha Sadan Senior Community Dining',
    timeAgo: '3 mins ago',
    temperature: '64.0°C Insulated',
    aiConfidence: '98.8%',
    courierId: 'Rider #214',
    pickupCoord: { latitude: 12.978, longitude: 77.6408, label: 'Marriott Kitchen (Indiranagar)' },
    volunteerCoord: { latitude: 12.973, longitude: 77.632, label: 'Rider #214 (En Route)' },
    deliveryCoord: { latitude: 12.965, longitude: 77.625, label: 'Sneha Sadan Dining Hall' },
  },
  {
    id: 'res-mum-1',
    source: 'FreshBakery Logistics Hub',
    city: 'mumbai',
    badgeText: 'Delivered & 80G Certified',
    badgeVariant: 'completed',
    portions: '320 Packs',
    foodType: 'Whole Wheat Loaves, Protein Rolls, Baked Snacks',
    destination: 'Bal Sahyog Children Home (Bandra East)',
    timeAgo: '22 mins ago',
    temperature: 'Ambient Insulated',
    aiConfidence: '99.9%',
    courierId: 'Rider #108',
    pickupCoord: { latitude: 19.065, longitude: 72.868, label: 'FreshBakery Hub (BKC)' },
    volunteerCoord: { latitude: 19.058, longitude: 72.86, label: 'Rider #108 (Delivered)' },
    deliveryCoord: { latitude: 19.049, longitude: 72.852, label: 'Bal Sahyog Children Home' },
  },
  {
    id: 'res-del-1',
    source: 'ITC Maurya Kitchens',
    city: 'delhi',
    badgeText: 'In Transit • 12m ETA',
    badgeVariant: 'active',
    portions: '185 Portions',
    foodType: 'Packed Dinner Meals, Subzi, Jeera Rice, Parathas',
    destination: 'Rain Basera Community Shelter (Chanakyapuri)',
    timeAgo: '14 mins ago',
    temperature: '66.2°C Safe',
    aiConfidence: '99.1%',
    courierId: 'Rider #305',
    pickupCoord: { latitude: 28.598, longitude: 77.175, label: 'ITC Maurya Diplomatic Enclave' },
    volunteerCoord: { latitude: 28.591, longitude: 77.182, label: 'Rider #305 (In Transit)' },
    deliveryCoord: { latitude: 28.583, longitude: 77.19, label: 'Rain Basera Shelter' },
  },
];

export const Landing: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [activeCity, setActiveCity] = useState<CityFilter>('all');
  const [activeEcoTab, setActiveEcoTab] = useState<EcoTab>('donors');
  const [selectedRescueId, setSelectedRescueId] = useState<string>('res-hyd-1');

  // Quick Donation Intake Simulation
  const [quickEntity, setQuickEntity] = useState('');
  const [quickPortions, setQuickPortions] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickLocation, setQuickLocation] = useState('');
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);

  const filteredRescues =
    activeCity === 'all'
      ? liveRescuesData
      : liveRescuesData.filter((r) => r.city === activeCity);

  const activeSelectedRescue =
    liveRescuesData.find((r) => r.id === selectedRescueId) || liveRescuesData[0];

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEntity || !quickPortions || !quickPhone || !quickLocation) {
      alert('Please fill out the donation details.');
      return;
    }
    setQuickSuccess(
      `✓ Surplus donation registered for ${quickEntity}! Immediate rescue courier #402 dispatched to ${quickLocation}. Real-time tracking link sent to ${quickPhone}.`
    );
    setTimeout(() => {
      if (isAuthenticated && user?.role === 'donor') {
        navigate('/donor/create-donation');
      } else {
        navigate('/login');
      }
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased relative selection:bg-brand-900 selection:text-white">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 grid-bg-pattern pointer-events-none z-0 opacity-80" />

      {/* Top Ambient Glow */}
      <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* ─────────────────────────────────────────────────────────────────────────────
          1. NAVIGATION HEADER (Spacious, balanced, wide)
      ────────────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-6">
          {/* Brand Logo & Emblem */}
          <Link to="/" className="flex items-center gap-3 no-underline group flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-900 via-emerald-800 to-teal-700 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-900/10 transition-transform group-hover:scale-105">
              <svg
                className="w-5 h-5 text-emerald-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
                  fill="currentColor"
                  fillOpacity="0.25"
                />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              AnnaSathi AI
            </span>
          </Link>

          {/* Centered Navigation Links with Generous Spacing */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10 text-sm font-semibold text-slate-600">
            <a
              href="#how-it-works"
              className="hover:text-emerald-800 transition-colors py-1 hover:border-b-2 hover:border-emerald-700"
            >
              How It Works
            </a>
            <a
              href="#live-radar"
              className="hover:text-emerald-800 transition-colors py-1 hover:border-b-2 hover:border-emerald-700"
            >
              Live Radar &amp; Map
            </a>
            <a
              href="#network-ecosystem"
              className="hover:text-emerald-800 transition-colors py-1 hover:border-b-2 hover:border-emerald-700"
            >
              Ecosystem
            </a>
            <a
              href="#about-us"
              className="hover:text-emerald-800 transition-colors py-1 hover:border-b-2 hover:border-emerald-700"
            >
              About Project
            </a>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {isAuthenticated && user ? (
              <Link
                to={`/${user.role}/dashboard`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-[#134E3F] text-white text-sm font-semibold shadow-sm transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-brand-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-[#134E3F] text-white text-sm font-semibold shadow-sm transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. HERO SECTION (Wide, spaced, clear, with Leaflet Map Preview)
      ────────────────────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 sm:py-20 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              {/* Live Status Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 shadow-xs text-xs font-semibold text-emerald-900">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                <span>AI-Powered Surplus Food Rescue Network</span>
                <span className="text-slate-300">|</span>
                <span className="text-emerald-700 font-medium">Real-Time Dispatch Active</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                  Zero-Waste Culinary Intelligence
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                  Feed the Hungry,{' '}
                  <span className="text-emerald-800 block mt-1">Not the Bin.</span>
                </h1>
              </div>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                AnnaSathi AI connects surplus food donors—hotels, banquet halls, restaurants, and caterers—with verified shelters and agile couriers within the golden hour, using Google Gemini and NVIDIA NIM AI for strict food safety and zero landfill waste.
              </p>

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to={isAuthenticated && user?.role === 'donor' ? '/donor/create-donation' : '/login'}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-brand-900 hover:bg-[#134E3F] text-white font-semibold text-sm sm:text-base shadow-sm transition-all transform hover:-translate-y-0.5"
                >
                  <Leaf className="w-5 h-5 text-emerald-300" />
                  <span>Donate Surplus Food</span>
                </Link>

                <a
                  href="#live-radar"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm sm:text-base shadow-xs transition-colors"
                >
                  <Radio className="w-4 h-4 text-emerald-700" />
                  <span>Explore Live Radar</span>
                </a>

                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-slate-700 hover:text-emerald-800 font-semibold text-sm transition-colors"
                >
                  <span>Register as NGO / Volunteer</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Value Badges */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200/80">
                <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                  <Clock className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>Average Match: 4.2 Mins</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>100% Thermal &amp; FSSAI Safe</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                  <FileCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>Auto 80G Tax Certificates</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Leaflet Map Showcase (5 cols) */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-premium p-6 relative overflow-hidden">
                {/* Accent Trim Gradient */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-900 via-emerald-600 to-teal-500" />

                {/* Broadcast Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Active Rescue Broadcast
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                    Golden Hour: 45m left
                  </span>
                </div>

                {/* Donor & Food Description */}
                <div className="py-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-base">The Grand Orchid Ballroom</h3>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      5-Star Kitchen
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Sector 29, Cyber Hub • 140 Portions • Pure Veg
                  </p>
                </div>

                {/* Leaflet Live Map Component */}
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
                  <DeliveryMap
                    pickupLocation={{
                      latitude: 17.448294,
                      longitude: 78.391485,
                      label: 'Grand Orchid Kitchen (Madhapur)',
                      type: 'pickup',
                    }}
                    deliveryLocation={{
                      latitude: 17.432294,
                      longitude: 78.378485,
                      label: 'Karuna Seva Shelter (Gachibowli)',
                      type: 'delivery',
                    }}
                    volunteerLocation={{
                      latitude: 17.441294,
                      longitude: 78.385485,
                      label: 'Courier #402 (In Transit)',
                      type: 'volunteer',
                    }}
                    height="210px"
                    showRoute={true}
                  />
                </div>

                {/* Telemetry Indicator Strip */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                      Thermal Probe
                    </span>
                    <span className="font-bold text-xs text-emerald-800">68.4°C Safe</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                      AI Accuracy
                    </span>
                    <span className="font-bold text-xs text-emerald-800">99.4% Match</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                      Courier
                    </span>
                    <span className="font-bold text-xs text-slate-800">Rider #402</span>
                  </div>
                </div>

                <div className="mt-4">
                  <a
                    href="#live-radar"
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-brand-900 hover:bg-[#134E3F] text-white text-xs font-semibold transition-colors"
                  >
                    <span>View Interactive Telemetry Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. KEY IMPACT NUMBERS RIBBON (Full-Width, High Impact)
      ────────────────────────────────────────────────────────────────────────────── */}
      <section className="w-full bg-brand-900 text-white py-14 relative z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-emerald-800/60">
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-300">18,500+</p>
              <p className="text-sm font-medium text-emerald-100/90 mt-1">Surplus Meals Rescued</p>
            </div>
            <div className="pt-4 md:pt-0 md:pl-6">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-300">120+</p>
              <p className="text-sm font-medium text-emerald-100/90 mt-1">Verified Shelters &amp; NGOs</p>
            </div>
            <div className="pt-4 md:pt-0 md:pl-6">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-300">&lt; 4.5 Mins</p>
              <p className="text-sm font-medium text-emerald-100/90 mt-1">AI Match Speed</p>
            </div>
            <div className="pt-4 md:pt-0 md:pl-6">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-300">42.8 Tons</p>
              <p className="text-sm font-medium text-emerald-100/90 mt-1">CO₂ Landfill Emissions Saved</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. HOW IT WORKS (Spacious, Step-by-Step Architecture)
      ────────────────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-white relative z-10 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Zero-Waste Protocol
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How AnnaSathi AI Works
            </h2>
            <p className="text-base text-slate-600">
              From commercial kitchen surplus to hungry bellies in under 60 minutes through four streamlined, AI-orchestrated stages.
            </p>
          </div>

          {/* 4 Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/90 hover:border-emerald-300 hover:shadow-subtle-card transition-all duration-200 relative group">
              <div className="w-12 h-12 rounded-xl bg-brand-50 border border-emerald-100 text-brand-900 flex items-center justify-center font-extrabold text-lg mb-5 shadow-xs group-hover:scale-105 transition-transform">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Surplus Ingestion</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Commercial kitchen staff list surplus portions, preparation timestamp, and dietary tags (Veg, Non-Veg, Jain) in under 60 seconds.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-emerald-800">
                <span>Instant Photo &amp; Tagging</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/90 hover:border-emerald-300 hover:shadow-subtle-card transition-all duration-200 relative group">
              <div className="w-12 h-12 rounded-xl bg-brand-50 border border-emerald-100 text-brand-900 flex items-center justify-center font-extrabold text-lg mb-5 shadow-xs group-hover:scale-105 transition-transform">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Matchmaking</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Gemini &amp; NVIDIA NIM algorithms evaluate nearby verified NGOs based on head-count needs, dietary affinity, and travel proximity.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-emerald-800">
                <span>&lt; 5 Min Automated Match</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/90 hover:border-emerald-300 hover:shadow-subtle-card transition-all duration-200 relative group">
              <div className="w-12 h-12 rounded-xl bg-brand-50 border border-emerald-100 text-brand-900 flex items-center justify-center font-extrabold text-lg mb-5 shadow-xs group-hover:scale-105 transition-transform">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Golden-Hour Dispatch</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Volunteer couriers receive turn-by-turn routing with thermal bag handling instructions to deliver hot, hygienic food safely.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-emerald-800">
                <span>Real-Time GPS Tracking</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/90 hover:border-emerald-300 hover:shadow-subtle-card transition-all duration-200 relative group">
              <div className="w-12 h-12 rounded-xl bg-brand-50 border border-emerald-100 text-brand-900 flex items-center justify-center font-extrabold text-lg mb-5 shadow-xs group-hover:scale-105 transition-transform">
                04
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Audit &amp; 80G Receipt</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The receiving shelter confirms handoff with a secure OTP. An automated digital 80G tax certificate and ESG impact report are generated.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-emerald-800">
                <span>Tax &amp; ESG Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. LIVE RESCUE RADAR & INTERACTIVE LEAFLET MAP (Spacious Split View)
      ────────────────────────────────────────────────────────────────────────────── */}
      <section id="live-radar" className="py-20 lg:py-28 bg-slate-50 relative z-10 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-10">
          {/* Section Header & City Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Radio className="w-4 h-4 text-emerald-700 animate-pulse" />
                <span>Live Distribution Telemetry</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Urban Food Rescue Radar
              </h2>
              <p className="text-sm text-slate-600">
                Select a city to inspect live food rescue coordinates, active courier runs, and distribution destinations on the interactive Leaflet map.
              </p>
            </div>

            {/* City Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'all', label: 'All Metros' },
                  { id: 'hyderabad', label: 'Hyderabad' },
                  { id: 'bengaluru', label: 'Bengaluru' },
                  { id: 'mumbai', label: 'Mumbai' },
                  { id: 'delhi', label: 'Delhi NCR' },
                ] as { id: CityFilter; label: string }[]
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveCity(c.id);
                    const match = liveRescuesData.find(
                      (r) => c.id === 'all' || r.city === c.id
                    );
                    if (match) setSelectedRescueId(match.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    activeCity === c.id
                      ? 'bg-brand-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Map + Cards Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Interactive Leaflet Map Box (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-premium p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-sm text-slate-900">
                    Live Route:{' '}
                    <span className="text-emerald-800 font-semibold">
                      {activeSelectedRescue.source} → {activeSelectedRescue.destination}
                    </span>
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-500 capitalize">
                  {activeSelectedRescue.city}
                </span>
              </div>

              {/* Leaflet Map Frame */}
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                <DeliveryMap
                  pickupLocation={activeSelectedRescue.pickupCoord}
                  deliveryLocation={activeSelectedRescue.deliveryCoord}
                  volunteerLocation={activeSelectedRescue.volunteerCoord}
                  height="420px"
                  showRoute={true}
                />
              </div>

              <div className="mt-3 px-2 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Pickup (Donor)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span>Courier In-Transit</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Delivery (Shelter)</span>
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  OpenStreetMap • 100% Verified Telemetry
                </span>
              </div>
            </div>

            {/* Live Rescue Cards Feed (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {filteredRescues.map((rescue) => {
                const isSelected = rescue.id === activeSelectedRescue.id;
                return (
                  <div
                    key={rescue.id}
                    onClick={() => setSelectedRescueId(rescue.id)}
                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-white border-brand-900 shadow-md ring-1 ring-brand-900/10'
                        : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {rescue.source}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          rescue.badgeVariant === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : rescue.badgeVariant === 'urgent'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rescue.badgeText}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                      {rescue.foodType}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <span>Dest: {rescue.destination.split('(')[0]}</span>
                      <span className="font-semibold text-emerald-800">
                        {rescue.portions}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          6. ROLE-BASED ECOSYSTEM (Donors, NGOs, Volunteers)
      ────────────────────────────────────────────────────────────────────────────── */}
      <section id="network-ecosystem" className="py-20 lg:py-28 bg-white relative z-10 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Stakeholder Benefits
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              An Ecosystem Built for Everyone
            </h2>
            <p className="text-base text-slate-600">
              Whether you produce surplus food, operate a community dining hall, or have an hour to deliver meals, AnnaSathi AI empowers your contribution.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 rounded-xl bg-slate-100 border border-slate-200 gap-1.5">
              <button
                type="button"
                onClick={() => setActiveEcoTab('donors')}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeEcoTab === 'donors'
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Food Donors
              </button>
              <button
                type="button"
                onClick={() => setActiveEcoTab('ngos')}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeEcoTab === 'ngos'
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                NGOs &amp; Shelters
              </button>
              <button
                type="button"
                onClick={() => setActiveEcoTab('volunteers')}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeEcoTab === 'volunteers'
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Volunteer Couriers
              </button>
            </div>
          </div>

          {/* Tab Content Cards */}
          <div className="max-w-4xl mx-auto bg-slate-50 rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm">
            {activeEcoTab === 'donors' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 border border-emerald-100 text-brand-900 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-brand-900" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Commercial Kitchens, Hotels &amp; Banquet Facilities
                    </h3>
                    <p className="text-sm text-slate-500">
                      Transform surplus preparation into CSR credit, 80G tax deductions, and verified ESG metrics.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Instant Listing &lt; 60 Sec</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        No paperwork. Enter food type and portions; our AI handles the rest.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Good Samaritan Protection</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Compliant with FSSAI Surplus Food Regulations and liability safeguards.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Instant 80G Certificates</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Receive digitally signed income tax certificates for every verified handover.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">ESG &amp; Carbon Telemetry</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Track landfill greenhouse emissions averted for your corporate sustainability reports.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                  <span className="text-xs text-slate-500">
                    Ready to partner your kitchen?
                  </span>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-[#134E3F] text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <span>Register as Food Donor</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {activeEcoTab === 'ngos' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 border border-emerald-100 text-brand-900 flex items-center justify-center">
                    <HeartHandshake className="w-6 h-6 text-brand-900" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Shelters, Orphanages &amp; Community Dining Halls
                    </h3>
                    <p className="text-sm text-slate-500">
                      Reliable, high-quality nutrition delivered straight to your doorstep free of charge.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Tailored Diet Matching</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Receive meals aligned with your beneficiaries (Pure Veg, Jain, Halal, etc.).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Capacity-Aware Routing</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Our AI never overburdens your kitchen with more food than you can serve or store.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Zero Administrative Overhead</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        One-click accept and simple OTP verification upon delivery.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Strict Quality Assurance</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Every donation is audited for preparation time and golden-hour viability.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                  <span className="text-xs text-slate-500">
                    Need meals for your organization?
                  </span>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-[#134E3F] text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <span>Register Your NGO</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {activeEcoTab === 'volunteers' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 border border-emerald-100 text-brand-900 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-brand-900" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Volunteer Couriers &amp; Logistics Partners
                    </h3>
                    <p className="text-sm text-slate-500">
                      Turn spare hours into lifelines for hungry children and families in your neighborhood.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Hyper-Local Missions</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Accept deliveries along your daily commute with intelligent route clustering.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Turn-by-Turn GPS Guidance</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Built-in Leaflet navigation with direct contact info for both donor and shelter.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Community Badges &amp; Credits</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Earn verifiable volunteer hours and recognition certificates for every successful rescue.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Thermal Support Equipment</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Access to insulated transport containers and temperature monitoring guidelines.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                  <span className="text-xs text-slate-500">
                    Have 45 minutes to save a meal?
                  </span>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-[#134E3F] text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <span>Join as Volunteer Courier</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          7. ABOUT THE PROJECT & AI INTELLIGENCE ARCHITECTURE
      ────────────────────────────────────────────────────────────────────────────── */}
      <section id="about-us" className="py-20 lg:py-28 bg-slate-50 relative z-10 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Technology &amp; Mission
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              About AnnaSathi AI
            </h2>
            <p className="text-base text-slate-600">
              Every day, thousands of kilograms of pristine, wholesome prepared food are discarded while urban communities face nutrition deficits. AnnaSathi AI bridges this gap through high-velocity AI routing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Google Gemini &amp; NVIDIA NIM</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our dual-engine backend uses Google Gemini for conversational intake and vision analysis, paired with NVIDIA NIM for micro-second heuristic dispatch optimization.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="text-base font-bold text-slate-900">The FSSAI Golden Hour</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cooked food safety degrades rapidly. AnnaSathi AI enforces a strict 60-to-90 minute window from donor kitchen to beneficiary dining table, ensuring zero health risk.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Verifiable Transparency</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every transaction generates cryptographic audit timestamps, digital OTP verifications, and automated 80G tax certificates backed by PostgreSQL on Supabase.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          8. CALL TO ACTION (Clean, Spacious Banner)
      ────────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-brand-900 text-white relative z-10 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Prevent Food Waste in Your Kitchen?
          </h2>
          <p className="text-base text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of food businesses and non-profits creating a zero-waste future today. Get started in less than 2 minutes.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-emerald-50 text-brand-900 font-bold text-sm sm:text-base shadow-sm transition-all"
            >
              Register as a Partner
            </Link>
            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-semibold text-sm sm:text-base border border-emerald-600/50 shadow-sm transition-all"
            >
              Sign In to Your Module
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          9. GLOBAL FOOTER (Clear, balanced, 4-column)
      ────────────────────────────────────────────────────────────────────────────── */}
      <footer className="w-full border-t border-slate-200 bg-white py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Col 1: Brand & Mission */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-900 flex items-center justify-center text-white">
                  <Leaf className="w-4 h-4 text-emerald-300" />
                </div>
                <span className="font-bold text-slate-900 text-lg">AnnaSathi AI</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Zero-Waste Surplus Food Rescue Network. Powered by AI and community passion to eliminate hunger and landfill greenhouse gas emissions.
              </p>
            </div>

            {/* Col 2: Platform Links */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Platform
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <a href="#how-it-works" className="hover:text-emerald-800 transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#live-radar" className="hover:text-emerald-800 transition-colors">
                    Live Rescue Radar
                  </a>
                </li>
                <li>
                  <a href="#network-ecosystem" className="hover:text-emerald-800 transition-colors">
                    Stakeholder Ecosystem
                  </a>
                </li>
                <li>
                  <a href="#about-us" className="hover:text-emerald-800 transition-colors">
                    Safety &amp; Compliance
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Portal Access */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Portals
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <Link to="/donor/dashboard" className="hover:text-emerald-800 transition-colors">
                    Donor Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/ngo/dashboard" className="hover:text-emerald-800 transition-colors">
                    NGO Verification &amp; Intake
                  </Link>
                </li>
                <li>
                  <Link to="/volunteer/dashboard" className="hover:text-emerald-800 transition-colors">
                    Volunteer Delivery Portal
                  </Link>
                </li>
                <li>
                  <Link to="/admin/dashboard" className="hover:text-emerald-800 transition-colors">
                    Admin Governance Center
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Trust & Compliance */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Compliance &amp; Trust
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <span>FSSAI Good Samaritan Protected</span>
                </li>
                <li>
                  <span>80G Income Tax Deductions</span>
                </li>
                <li>
                  <span>ISO 27001 Data Privacy</span>
                </li>
                <li>
                  <span>256-Bit TLS Secured</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} AnnaSathi AI Technologies Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-800 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-800 cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-800 cursor-pointer">Security Desk</span>
              <span className="hover:text-slate-800 cursor-pointer">Contact Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
