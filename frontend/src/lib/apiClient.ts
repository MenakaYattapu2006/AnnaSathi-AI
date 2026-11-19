/**
 * AnnaSathi AI - Universal Type-Safe API Client
 * Connects frontend to the Node.js/Express REST backend with session cookies and graceful fallbacks.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api/v1';

class ApiClientError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
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
        data.error || data.message || `API request failed with status ${response.status}`,
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
    }) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),

    verifyRegisterOtp: (email: string, otp: string) =>
      request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
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

    resetPassword: (token: string, password: string) =>
      request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),
  },

  // Donation Endpoints
  donations: {
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

    pickupAssignment: (assignmentId: string) =>
      request(`/volunteer/pickup/${assignmentId}`, {
        method: 'POST',
      }),

    deliverAssignment: (assignmentId: string, notes?: string) =>
      request(`/volunteer/deliver/${assignmentId}`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
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
