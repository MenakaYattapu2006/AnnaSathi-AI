import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types/user';
import { mockAuthService, type RegisterInput } from '../lib/mockAuthService';
import { apiClient } from '../lib/apiClient';
import usersData from '../mocks/users.json';

export type { UserRole };

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: RegisterInput) => Promise<User>;
  logout: () => void;
  /** Demonstration and development helper only to switch perspectives */
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isProduction = Boolean((import.meta as any).env?.PROD);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Safely restore authenticated session on initial mount
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        // Attempt session verification with live backend
        const response = await apiClient.auth.getMe();
        if (response?.user && isMounted) {
          setUser(response.user);
          return;
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      try {
        const response = await apiClient.auth.login(email, password);
        if (response?.user) {
          setUser(response.user);
          mockAuthService.saveSession(response.user);
          return response.user;
        }
      } catch (err: any) {
        // In production, or on real validation errors, propagate error immediately
        if (isProduction || err.status === 400 || err.status === 401) {
          throw err;
        }
      }

      if (isProduction) {
        throw new Error('Production authentication failed: unable to connect to backend.');
      }

      // Backend offline fallback to mock authentication strictly in development mode
      const authenticatedUser = await mockAuthService.login(email, password);
      setUser(authenticatedUser);
      return authenticatedUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterInput): Promise<User> => {
    setIsLoading(true);
    try {
      try {
        const response = await apiClient.auth.register({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: userData.password,
          role: userData.role,
          organizationName: userData.organizationName,
        });
        if (response?.user) {
          // Registration succeeded. Do NOT auto-login.
          // User must explicitly log in with their credentials to access their dashboard module.
          return response.user;
        }
      } catch (err: any) {
        if (isProduction || err.status === 400 || err.status === 409) {
          throw err;
        }
      }

      if (isProduction) {
        throw new Error('Production registration failed: unable to connect to backend.');
      }

      // Offline mock fallback strictly in local development if backend offline
      const newUser = await mockAuthService.register(userData);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.auth.logout();
    } catch {
      // Ignore network errors on logout
    }
    mockAuthService.logout();
    setUser(null);
  }, []);

  // Demo / Dev utility for quick evaluation of role-based views
  const switchRole = useCallback((role: UserRole) => {
    const targetUser = (usersData as User[]).find((u) => u.role === role);
    if (targetUser) {
      mockAuthService.saveSession(targetUser);
      setUser(targetUser);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
