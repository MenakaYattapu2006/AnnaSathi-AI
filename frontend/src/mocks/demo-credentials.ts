export interface DemoAccount {
  email: string;
  password: string;
  role: 'admin' | 'ngo' | 'user';
  // Add additional fields as needed, e.g., name, token, etc.
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'admin@demo.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    email: 'ngo@demo.com',
    password: 'ngo123',
    role: 'ngo',
  },
  {
    email: 'user@demo.com',
    password: 'user123',
    role: 'user',
  },
];
