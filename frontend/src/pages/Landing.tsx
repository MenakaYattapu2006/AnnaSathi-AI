import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Users, Truck, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';

const features = [
  {
    icon: <Heart size={32} className="text-primary" />,
    title: 'Reduce Food Waste',
    description: 'Connect surplus food from restaurants, hotels and events with people who need it most.',
  },
  {
    icon: <Users size={32} className="text-primary" />,
    title: 'NGO Network',
    description: 'Verified NGOs and community kitchens can discover and claim available donations instantly.',
  },
  {
    icon: <Truck size={32} className="text-primary" />,
    title: 'Volunteer Delivery',
    description: 'Volunteers collect and deliver food to shelters, ensuring timely and safe distribution.',
  },
  {
    icon: <ShieldCheck size={32} className="text-primary" />,
    title: 'AI-Powered Matching',
    description: 'Intelligent urgency prediction and donor-NGO matching powered by AI for maximum impact.',
  },
];

/**
 * Public landing page.
 */
const Landing: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav bar */}
      <header className="site-header">
        <div className="flex items-center gap-2">
          <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
          <span className="font-bold text-lg text-white">AnnaSathi AI</span>
        </div>
        <nav className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <Link to={`/${user.role}/dashboard`}>
              <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-primary">
                Dashboard <ArrowRight size={16} className="ml-1" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-primary">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-white">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="page-container py-20 text-center">
        <h1 className="text-5xl font-extrabold text-primary-text leading-tight mb-4">
          Feed the Hungry,<br />
          <span className="text-primary">Not the Bin</span>
        </h1>
        <p className="text-lg text-secondary-text max-w-2xl mx-auto mb-8">
          AnnaSathi AI connects surplus food donors with NGOs, community kitchens and
          volunteers — powered by AI for maximum reach and zero waste.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/register">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">Log in</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="page-container pb-20">
        <div className="grid-4">
          {features.map((f) => (
            <div key={f.title} className="card p-6 text-center">
              <div className="mb-4 flex justify-center">{f.icon}</div>
              <h3 className="text-lg font-semibold text-primary-text mb-2">{f.title}</h3>
              <p className="text-sm text-secondary-text">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <p>&copy; 2026 AnnaSathi AI. Built for a better tomorrow.</p>
      </footer>
    </div>
  );
};

export default Landing;
