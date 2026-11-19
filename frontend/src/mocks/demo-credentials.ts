import type { UserRole } from '../types/user';

export interface DemoAccount {
  role: UserRole;
  name: string;
  email: string;
  password: string;
  description: string;
  badgeColor: string;
}

/**
 * Demonstration Credentials for AnnaSathi AI.
 * 
 * NOTE: These credentials are strictly for local prototyping and college hackathon demonstration.
 * In production, authentication will be securely handled via Supabase PostgreSQL, Edge Functions,
 * and Brevo OTP transactional verification.
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'donor',
    name: 'Ravi Kumar (Grand Palace Hall)',
    email: 'ravi@example.com',
    password: 'demo@donor123',
    description: 'Surplus food donor managing restaurant and banquet contributions.',
    badgeColor: 'bg-primary text-white',
  },
  {
    role: 'ngo',
    name: 'Meera Iyer (AnnaDaan Foundation)',
    email: 'contact@annadaan.org',
    password: 'demo@ngo123',
    description: 'Verified NGO coordinator accepting food donations for community kitchens.',
    badgeColor: 'bg-secondary text-white',
  },
  {
    role: 'volunteer',
    name: 'Priya Sharma (Student Volunteer)',
    email: 'priya.s@example.com',
    password: 'demo@vol123',
    description: 'Active field volunteer picking up and delivering rescued food.',
    badgeColor: 'bg-accent text-white',
  },
  {
    role: 'admin',
    name: 'System Administrator',
    email: 'admin@annasathi.org',
    password: 'demo@admin123',
    description: 'Platform administrator overseeing verification, compliance and telemetry.',
    badgeColor: 'bg-primary-text text-white',
  },
];
