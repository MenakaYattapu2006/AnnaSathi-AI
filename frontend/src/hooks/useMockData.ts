import { useState, useEffect } from 'react';
import { mockDataService } from '../lib/mockDataService';
import type {
  Donation,
  NGO,
  Assignment,
  Notification,
  DashboardStats,
  UserRole,
  DonationStatus,
  FoodCategory,
  UrgencyLevel,
  NGOStatus,
} from '../types';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to retrieve all donations with optional client-side filtering.
 */
export function useDonations(filter?: {
  status?: DonationStatus;
  category?: FoodCategory;
  urgency?: UrgencyLevel;
}) {
  const [state, setState] = useState<AsyncState<Donation[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    try {
      let list = mockDataService.getDonations();
      if (filter?.status) {
        list = list.filter((d) => d.status === filter.status);
      }
      if (filter?.category) {
        list = list.filter((d) => d.category === filter.category);
      }
      if (filter?.urgency) {
        list = list.filter((d) => d.urgencyLevel === filter.urgency);
      }
      setState({ data: list, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [filter?.status, filter?.category, filter?.urgency]);

  return state;
}

/**
 * Hook to retrieve donations created by a specific donor.
 */
export function useDonationsByDonor(donorId?: string) {
  const [state, setState] = useState<AsyncState<Donation[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!donorId) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    try {
      const data = mockDataService.getDonationsByDonor(donorId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [donorId]);

  return state;
}

/**
 * Hook to retrieve available donations for NGOs to discover and accept.
 */
export function useAvailableDonations() {
  const [state, setState] = useState<AsyncState<Donation[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    try {
      const data = mockDataService.getAvailableDonationsForNGO();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, []);

  return state;
}

/**
 * Hook to retrieve NGO listings with optional status filtering.
 */
export function useNGOs(status?: NGOStatus) {
  const [state, setState] = useState<AsyncState<NGO[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    try {
      const data = status ? mockDataService.getNGOsByStatus(status) : mockDataService.getNGOs();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [status]);

  return state;
}

/**
 * Hook to retrieve assignments by volunteer ID.
 */
export function useAssignmentsByVolunteer(volunteerId?: string) {
  const [state, setState] = useState<AsyncState<Assignment[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!volunteerId) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    try {
      const data = mockDataService.getAssignmentsByVolunteer(volunteerId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [volunteerId]);

  return state;
}

/**
 * Hook to retrieve notifications for a user.
 */
export function useNotifications(userId?: string) {
  const [state, setState] = useState<AsyncState<Notification[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    try {
      const data = mockDataService.getNotificationsByUser(userId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [userId]);

  return state;
}

/**
 * Hook to retrieve dashboard statistics by role.
 */
export function useDashboardStats(role: UserRole) {
  const [state, setState] = useState<AsyncState<DashboardStats>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    try {
      const data = mockDataService.getDashboardStats(role);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [role]);

  return state;
}
