export interface DemoAccount {
  email: string;
  password: string;
  role: string;
  name: string;
}

/** Empty demo accounts — authentication is handled by the real backend in production */
export const DEMO_ACCOUNTS: DemoAccount[] = [];
