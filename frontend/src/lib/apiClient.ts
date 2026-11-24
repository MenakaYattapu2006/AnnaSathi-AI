/**
 * AnnaSathi AI - Universal Type-Safe API Client
 * Connects frontend to the Node.js/Express REST backend with session cookies and graceful fallbacks.
 */

import type { Donation } from '../types/donation';
import type { NGO } from '../types/ngo';
import type { Volunteer } from '../types/volunteer';
import type { Assignment } from '../types/assignment';
import type { Notification } from '../types/notification';
import type { User } from '../types/user';
import { resolveStateFromLocation } from '../utils/geocoding';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? '/api/v1'
    : 'http://localhost:5000/api/v1'
);

export class ApiClientError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)annasathi_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// ─────────────────────────────────────────────────────────────
// Normalization Mappers: Bridge Supabase Schema to Frontend Types
// ─────────────────────────────────────────────────────────────

export function mapDonationFromDb(row: any): Donation {
  if (!row) return row;
  return {
    id: row.id,
    donorId: row.donor_id || row.donorId,
    foodName: row.food_name || row.foodName || '',
    category: row.category,
    quantity: Number(row.quantity),
    unit: row.unit,
    numberOfServings: row.number_of_servings != null ? Number(row.number_of_servings) : row.numberOfServings,
    dietaryType: row.dietary_type || row.dietaryType || 'veg',
    preparationTime: row.preparation_time || row.preparationTime || '',
    expiryTime: row.expiry_time || row.expiryTime || '',
    pickupAddress: row.pickupAddress || {
      street: row.street || row.pickup_address || '',
      city: row.city || '',
      state: row.state && row.state !== 'Telangana'
        ? row.state
        : resolveStateFromLocation(`${row.street || ''} ${row.city || ''}`, row.pincode),
      pincode: row.pincode || '',
      latitude: Number(row.latitude) || 17.385,
      longitude: Number(row.longitude) || 78.4867,
      landmark: row.landmark || '',
    },
    matchedNgoId: row.matched_ngo_id || row.matchedNgoId,
    urgencyScore: Number(row.urgency_score ?? row.urgencyScore ?? 50),
    urgencyLevel: row.urgency_level || row.urgencyLevel || 'medium',
    status: row.status,
    specialInstructions: row.special_instructions || row.specialInstructions,
    imageUrl: row.image_url || row.imageUrl,
    pickupOtp: row.pickup_otp || row.verification_otp || row.pickupOtp,
    deliveryOtp: row.delivery_otp || row.deliveryOtp,
    donorName: row.donor_name || row.donorName,
    donorPhone: row.donor_phone || row.donorPhone,
    donorEmail: row.donor_email || row.donorEmail,
    donorOrganization: row.donor_org || row.donorOrganization,
    volunteerName: row.volunteer_name || row.volunteerName,
    volunteerPhone: row.volunteer_phone || row.volunteerPhone,
    volunteerStatus: row.assignment_status || row.volunteerStatus,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

export function mapNgoFromDb(row: any): NGO {
  if (!row) return row;
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    organizationName: row.organization_name || row.organizationName || '',
    registrationNumber: row.registration_number || row.darpan_id || row.registrationNumber || '',
    contactPerson: row.contact_person || row.contact_name || row.contactPerson || '',
    contactPhone: row.contact_phone || row.contactPhone || '',
    contactEmail: row.contact_email || row.contactEmail || '',
    description: row.description || '',
    address: row.address || {
      street: row.street || '',
      city: row.city || '',
      state: row.state || 'Telangana',
      pincode: row.pincode || '',
      latitude: Number(row.latitude) || 17.385,
      longitude: Number(row.longitude) || 78.4867,
    },
    serviceArea: row.service_areas || row.serviceArea || [],
    foodRequirements: row.requirements || row.foodRequirements || [],
    capacity: {
      maxDailyMeals: Number(row.max_daily_meals ?? row.capacity?.maxDailyMeals ?? 100),
      currentAvailableCapacity: Number(row.current_available_capacity ?? row.capacity?.currentAvailableCapacity ?? 100),
      hasColdStorage: Boolean(row.has_cold_storage ?? row.capacity?.hasColdStorage),
    },
    verificationStatus: (row.verification_status || row.verificationStatus || 'pending').toLowerCase() as any,
    verifiedAt: row.verified_at || row.verifiedAt,
    rejectionReason: row.rejection_reason || row.verification_notes || row.rejectionReason,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

export function mapVolunteerFromDb(row: any): Volunteer {
  if (!row) return row;
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    vehicleType: row.vehicle_type || row.vehicleType || 'two_wheeler',
    serviceArea: row.service_areas || row.serviceArea || [],
    availability: row.availability || 'available',
    status: row.status || 'active',
    currentLocation: (row.current_latitude && row.current_longitude) ? {
      latitude: Number(row.current_latitude),
      longitude: Number(row.current_longitude),
      lastUpdated: row.location_updated_at || new Date().toISOString(),
    } : undefined,
    totalDeliveriesCompleted: Number(row.total_deliveries_completed || 0),
    rating: Number(row.rating || 5.0),
    assignedTaskIds: row.assignedTaskIds || [],
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

export function mapAssignmentFromDb(row: any): Assignment {
  if (!row) return row;
  return {
    id: row.id || row.assignment_id || `asgn-${Date.now()}`,
    donationId: row.donation_id || row.donationId || '',
    volunteerId: row.volunteer_id || row.volunteerId || '',
    ngoId: row.ngo_id || row.ngoId || '',
    status: row.status || row.assignment_status || 'available',
    pickup: row.pickup || {
      address: row.pickup_address || row.street || '',
      street: row.pickup_street || row.street || '',
      city: row.pickup_city || row.city || '',
      state: row.pickup_state || row.state || '',
      pincode: row.pickup_pincode || row.pincode || '',
      contactPerson: row.pickup_contact_person || row.contact_person || '',
      contactPhone: row.pickup_contact_phone || row.contact_phone || '',
      estimatedPickupTime: row.estimated_pickup_time || '',
      actualPickupTime: row.actual_pickup_time,
      verificationOtp: row.verification_otp,
      latitude: Number(row.pickup_latitude ?? row.latitude ?? 17.4156),
      longitude: Number(row.pickup_longitude ?? row.longitude ?? 78.4357),
    },
    delivery: row.delivery || {
      ngoName: row.delivery_ngo_name || row.destination_ngo_name || row.organization_name || '',
      address: row.delivery_address || '',
      street: row.delivery_street || '',
      city: row.delivery_city || '',
      state: row.delivery_state || '',
      pincode: row.delivery_pincode || '',
      contactPerson: row.delivery_contact_person || '',
      contactPhone: row.delivery_contact_phone || '',
      estimatedDeliveryTime: row.estimated_delivery_time || '',
      actualDeliveryTime: row.actual_delivery_time,
      deliveryOtp: row.delivery_otp || row.deliveryOtp,
      recipientSignatureName: row.recipient_signature_name,
      latitude: Number(row.delivery_latitude ?? 17.3850),
      longitude: Number(row.delivery_longitude ?? 78.4867),
    },
    assignedAt: row.assigned_at || row.assignedAt || row.created_at || new Date().toISOString(),
    pickedUpAt: row.picked_up_at || row.pickedUpAt,
    deliveredAt: row.actual_delivery_time || row.deliveredAt,
    notes: row.notes || '',
    foodName: row.food_name || row.foodName || row.donation_title || 'Surplus Food',
    category: row.category || row.food_category || 'cooked_meals',
    quantity: row.quantity != null ? Number(row.quantity) : 1,
    unit: row.unit || 'units',
    urgencyScore: row.urgency_score != null ? Number(row.urgency_score) : 50,
    urgencyLevel: row.urgency_level || row.urgencyLevel || 'MEDIUM',
    dietaryType: row.dietary_type || row.dietaryType || 'Veg',
    expiryTime: row.expiry_time || row.expiryTime || new Date().toISOString(),
    volunteerName: row.volunteer_name || row.volunteerName,
    volunteerPhone: row.volunteer_phone || row.volunteerPhone,
  };
}

export function mapNotificationFromDb(row: any): Notification {
  if (!row) return row;
  return {
    id: row.id,
    recipientId: row.recipient_id || row.recipientId,
    title: row.title,
    message: row.message,
    type: row.type,
    status: row.status,
    relatedEntityId: row.related_entity_id || row.relatedEntityId,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    readAt: row.read_at || row.readAt,
  };
}

export function mapUserFromDb(row: any): User {
  if (!row) return row;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    phone: row.phone || '',
    status: row.is_active === false ? 'suspended' : (row.status || 'active'),
    profile: {
      address: row.address,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      organizationName: row.organization_name || row.organizationName,
    },
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Double-Submit CSRF Token for mutating requests
  const method = (options.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken && !headers.has('X-CSRF-Token')) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Automatically passes HttpOnly session cookies
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiClientError(
        data.error || data.message || (Array.isArray(data.errors) ? data.errors[0] : null) || `API request failed with status ${response.status}`,
        response.status,
        data.details || data.errors
      );
    }

    return data;
  } catch (err: any) {
    if (err instanceof ApiClientError) {
      throw err;
    }
    // Network errors or backend offline
    throw new ApiClientError(
      err.message || 'Unable to connect to AnnaSathi backend services. Ensure backend server is running.',
      0
    );
  }
}

export const apiClient = {
  // Base request method
  request,

  // Auth Endpoints
  auth: {
    login: (email: string, password: string) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    verifyLoginOtp: (email: string, otp: string) =>
      request('/auth/verify-login-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      }),

    register: (userData: {
      name: string;
      email: string;
      phone?: string;
      password?: string;
      role: string;
      organizationName?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
    }) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),

    verifyRegisterOtp: (email: string, otp: string, registrationData?: any) =>
      request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp, registrationData }),
      }),

    resendRegisterOtp: (email: string) =>
      request('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    logout: () =>
      request('/auth/logout', {
        method: 'POST',
      }),

    getMe: () => request('/auth/me'),

    forgotPassword: (email: string) =>
      request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (email: string, otp: string, newPassword: string) =>
      request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword }),
      }),
  },

  // Donation Endpoints
  donations: {
    getPublicActivity: () => request('/donations/public-activity'),

    getAll: (params?: { status?: string; donorId?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return request(`/donations${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => request(`/donations/${id}`),

    create: (donationData: any) =>
      request('/donations', {
        method: 'POST',
        body: JSON.stringify(donationData),
      }),

    update: (id: string, donationData: any) =>
      request(`/donations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(donationData),
      }),

    cancel: (id: string, reason?: string) =>
      request(`/donations/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }),

    getTracking: (id: string) => request(`/donations/${id}/tracking`),

    getMatches: (id: string) => request(`/donations/${id}/matches`),
  },

  // NGO Endpoints
  ngo: {
    getMe: () => request('/ngo/me'),

    updateMe: (profileData: any) =>
      request('/ngo/me', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }),

    uploadDocument: (formData: FormData) =>
      request('/ngo/documents', {
        method: 'POST',
        body: formData,
      }),

    getVerificationStatus: () => request('/ngo/verification'),

    getAvailableDonations: () => request('/ngo/available-donations'),

    getAcceptedDonations: () => request('/ngo/accepted-donations'),

    acceptDonation: (donationId: string) =>
      request(`/ngo/accept/${donationId}`, {
        method: 'POST',
      }),

    rejectDonation: (donationId: string, reason?: string) =>
      request(`/ngo/reject/${donationId}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),

    confirmReceipt: (donationId: string, notes?: string) =>
      request(`/ngo/confirm-receipt/${donationId}`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
  },

  // Volunteer Endpoints
  volunteer: {
    getMe: () => request('/volunteer/me'),

    updateMe: (profileData: any) =>
      request('/volunteer/me', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }),

    updateAvailability: (availability: string) =>
      request('/volunteer/availability', {
        method: 'PATCH',
        body: JSON.stringify({ availability }),
      }),

    getAvailableTasks: () => request('/volunteer/available-tasks'),

    getAssignedTasks: () => request('/volunteer/assigned-tasks'),

    acceptAssignment: (assignmentId: string) =>
      request(`/volunteer/accept/${assignmentId}`, {
        method: 'POST',
      }),

    pickupAssignment: (assignmentId: string, notes?: string, otp?: string) =>
      request(`/volunteer/pickup/${assignmentId}`, {
        method: 'POST',
        body: JSON.stringify({ notes, otp }),
      }),

    deliverAssignment: (assignmentId: string, notes?: string, otp?: string) =>
      request(`/volunteer/deliver/${assignmentId}`, {
        method: 'POST',
        body: JSON.stringify({ notes, otp }),
      }),

    getHistory: () => request('/volunteer/history'),

    updateLocation: (coords: { latitude: number; longitude: number; heading?: number; speed?: number; donationId?: string }) =>
      request('/volunteer/location', {
        method: 'POST',
        body: JSON.stringify(coords),
      }),
  },

  // Admin Endpoints
  admin: {
    getStats: () => request('/admin/stats'),

    listUsers: (params?: { role?: string; is_active?: boolean; search?: string; page?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return request(`/admin/users${query ? `?${query}` : ''}`);
    },

    updateUserStatus: (id: string, isActive: boolean) =>
      request(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      }),

    updateUserDetails: (id: string, data: { name?: string; email?: string; phone?: string; role?: string; status?: string }) =>
      request(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteUser: (id: string) =>
      request(`/admin/users/${id}`, {
        method: 'DELETE',
      }),

    listNGOs: (params?: { status?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request(`/admin/ngos${query ? `?${query}` : ''}`);
    },

    reviewNGOVerification: (id: string, status: 'VERIFIED' | 'REJECTED', notes?: string) =>
      request(`/admin/ngos/${id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }),

    listDonations: (params?: { status?: string; page?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return request(`/admin/donations${query ? `?${query}` : ''}`);
    },

    getTelemetry: () => request('/admin/telemetry'),

    getCities: () => request('/admin/cities'),

    getAuditLogs: (params?: { limit?: number; page?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return request(`/admin/audit-logs${query ? `?${query}` : ''}`);
    },
  },

  // AI Endpoints
  ai: {
    predictUrgency: (data: {
      foodCategory: string;
      preparationTime?: string;
      expiryTime: string;
      storageCondition?: string;
      quantity?: number;
    }) =>
      request('/ai/urgency/predict', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    predictDemand: (data: { city?: string; zone?: string; date?: string; pastTrends?: any[] }) =>
      request('/ai/demand/predict', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    chat: (message: string, sessionId?: string, roleContext?: string) =>
      request('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, sessionId, roleContext }),
      }),
  },

  // Notification Endpoints
  notifications: {
    getAll: (unreadOnly = false) => request(`/notifications${unreadOnly ? '?unread_only=true' : ''}`),

    getUnreadCount: () => request('/notifications/unread-count'),

    markRead: (id: string) =>
      request(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),

    markAllRead: () =>
      request('/notifications/mark-all-read', {
        method: 'POST',
      }),
  },
};
