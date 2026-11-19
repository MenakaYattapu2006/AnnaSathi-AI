import usersData from '../mocks/users.json';
import { DEMO_ACCOUNTS, type DemoAccount } from '../mocks/demo-credentials';
import type { User, UserRole } from '../types/user';
import type { NGO } from '../types/ngo';
import { mockDataService } from './mockDataService';

export interface RegisterInput {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  organizationName?: string;
  city?: string;
}

/**
 * DEMONSTRATION-ONLY STORAGE NOTICE:
 * This is mock authentication designed for local hackathon evaluation.
 * In compliance with security guidelines:
 * 1. Plaintext passwords are NEVER stored in browser localStorage.
 * 2. User profile records stored in localStorage NEVER contain passwords.
 * 3. Session persistence stored in localStorage NEVER contains passwords.
 * 4. Passwords are never logged to the console.
 * 
 * Resulting Mock Limitation:
 * Because passwords are intentionally not stored in localStorage, newly registered users
 * can log out and log back in within the same active tab session via transient memory,
 * but after a full browser restart/refresh while logged out, re-authenticating a newly
 * registered user without a real hashed database is not possible. For fresh testing
 * across reloads, use the clearly labelled public demo accounts.
 */
const SESSION_STORAGE_KEY = 'annasathi_mock_session';
const REGISTERED_USERS_KEY = 'annasathi_registered_users';

// Transient in-memory credentials map (scoped strictly to runtime memory; NEVER written to localStorage)
const transientCredentialsMap = new Map<string, string>();

/** Explicitly extracts only safe User fields, ensuring no password or sensitive keys exist. */
function sanitizeUser(user: User): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    profileImage: user.profileImage,
    profile: user.profile,
    createdAt: user.createdAt,
  };
}

function loadStoredRegisteredUsers(): User[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => sanitizeUser(item as User));
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored registered users from localStorage:', err);
  }
  return [];
}

function saveRegisteredUsers(users: User[]): void {
  try {
    const safeUsers = users.map(sanitizeUser);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(safeUsers));
  } catch (err) {
    console.warn('Failed to persist registered users to localStorage:', err);
  }
}

export const mockAuthService = {
  /**
   * Retrieves all preconfigured demonstration accounts.
   */
  getDemoAccounts: (): DemoAccount[] => {
    return DEMO_ACCOUNTS;
  },

  /**
   * Authenticates a user against demo accounts or registered mock accounts.
   */
  login: async (email: string, password: string): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 150));

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      throw new Error('Please enter both email and password.');
    }

    // 1. Check against known demo accounts
    const demoMatch = DEMO_ACCOUNTS.find((d) => d.email.toLowerCase() === cleanEmail);
    if (demoMatch) {
      if (demoMatch.password !== cleanPassword) {
        throw new Error('Invalid password for demo account.');
      }

      const userRecord = (usersData as User[]).find(
        (u) => u.email.toLowerCase() === cleanEmail
      );

      if (userRecord) {
        const safeRecord = sanitizeUser(userRecord);
        mockAuthService.saveSession(safeRecord);
        return safeRecord;
      }
    }

    // 2. Check against newly registered users (via transient in-memory credentials)
    const registeredUsers = loadStoredRegisteredUsers();
    const registeredMatch = registeredUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (registeredMatch) {
      const expectedPassword = transientCredentialsMap.get(cleanEmail);

      if (expectedPassword) {
        if (expectedPassword !== cleanPassword) {
          throw new Error('Invalid credentials.');
        }
        const safeMatch = sanitizeUser(registeredMatch);
        mockAuthService.saveSession(safeMatch);
        return safeMatch;
      }

      // If credentials are not in transient memory (e.g. browser was refreshed after logout):
      throw new Error(
        'For security, passwords are not stored in browser localStorage. Please sign in using a preconfigured Demo Account or re-register.'
      );
    }

    // 3. Fallback check for static users from users.json with standard demo password
    const staticUser = (usersData as User[]).find(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (staticUser) {
      if (cleanPassword === 'demo123' || cleanPassword === 'password123') {
        const safeStatic = sanitizeUser(staticUser);
        mockAuthService.saveSession(safeStatic);
        return safeStatic;
      }
      throw new Error('Invalid password. For demo accounts, use the password from the demo cards.');
    }

    throw new Error('No account found with this email address.');
  },

  /**
   * Registers a new demonstration user.
   * Enforces:
   * - Public admin registration rejection.
   * - Duplicate email checks across static and registered accounts.
   * - Passwords are NEVER written to localStorage.
   * - Automatic creation of an NGO record with 'pending' status if role is NGO.
   */
  register: async (input: RegisterInput): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Reject public admin registration
    if (input.role === 'admin') {
      throw new Error('Public registration for administrator accounts is not permitted.');
    }

    const cleanEmail = input.email.trim().toLowerCase();
    const cleanName = input.name.trim();

    if (!cleanName) {
      throw new Error('Full name is required.');
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }
    if (input.password && input.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // Check duplicate in static users.json
    const existingInStatic = (usersData as User[]).some(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (existingInStatic) {
      throw new Error('An account with this email address already exists.');
    }

    // Check duplicate in registered users
    const registeredUsers = loadStoredRegisteredUsers();
    const existingInRegistered = registeredUsers.some(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (existingInRegistered) {
      throw new Error('An account with this email address already exists.');
    }

    const newUserId = `usr-${input.role}-${Date.now().toString(36)}`;
    const organizationName = input.organizationName?.trim() || cleanName;
    const city = input.city?.trim() || 'Hyderabad';

    // Pure User object — strictly conforming to User interface without password
    const newUser: User = {
      id: newUserId,
      name: cleanName,
      email: cleanEmail,
      phone: input.phone?.trim() || '+91 98000 00000',
      role: input.role,
      status: 'active',
      profile: {
        organizationName,
        city,
        state: 'Telangana',
      },
      createdAt: new Date().toISOString(),
    };

    // Store password strictly in transient memory (never in localStorage)
    if (input.password) {
      transientCredentialsMap.set(cleanEmail, input.password);
    }

    // If registered as NGO, create an unverified (pending) NGO record
    if (input.role === 'ngo') {
      const newNgo: NGO = {
        id: `ngo-${Date.now().toString(36)}`,
        userId: newUserId,
        organizationName,
        registrationNumber: `REG/PENDING/${Date.now().toString().slice(-4)}`,
        contactPerson: cleanName,
        contactPhone: input.phone?.trim() || '+91 98000 00000',
        contactEmail: cleanEmail,
        address: {
          street: 'Community Road',
          city,
          state: 'Telangana',
          pincode: '500001',
          latitude: 17.3850,
          longitude: 78.4867,
        },
        serviceArea: [city],
        foodRequirements: [],
        capacity: {
          maxDailyMeals: 200,
          currentAvailableCapacity: 200,
          hasColdStorage: false,
        },
        verificationStatus: 'pending', // Strictly pending for all new registrations
        createdAt: new Date().toISOString(),
      };
      mockDataService.createRegisteredNGO(newNgo);
    }

    // Persist pure user record without password
    saveRegisteredUsers([...registeredUsers, newUser]);

    // Save session without password
    mockAuthService.saveSession(newUser);
    return newUser;
  },

  /**
   * Saves user to localStorage mock session.
   * Guarantees no password fields are included.
   */
  saveSession: (user: User): void => {
    try {
      const safeUser = sanitizeUser(user);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeUser));
    } catch (err) {
      console.warn('Unable to write session to localStorage:', err);
    }
  },

  /**
   * Clears the current mock session.
   */
  logout: (): void => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (err) {
      console.warn('Unable to clear session from localStorage:', err);
    }
  },

  /**
   * Retrieves the currently active user session from localStorage.
   * Guarantees returned user has no password fields.
   */
  getCurrentUser: (): User | null => {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const candidate = parsed as User;
        if (candidate.id && candidate.role && candidate.email) {
          return sanitizeUser(candidate);
        }
      }
    } catch (err) {
      console.warn('Corrupted or malformed session found in localStorage, clearing.');
      mockAuthService.logout();
    }
    return null;
  },
};
