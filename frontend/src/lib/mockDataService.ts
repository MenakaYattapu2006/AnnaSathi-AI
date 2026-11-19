import usersData from '../mocks/users.json';
import ngosData from '../mocks/ngos.json';
import donationsData from '../mocks/donations.json';
import volunteersData from '../mocks/volunteers.json';
import assignmentsData from '../mocks/assignments.json';
import notificationsData from '../mocks/notifications.json';
import dashboardStatsData from '../mocks/dashboard-stats.json';

import type {
  User,
  UserRole,
  UserStatus,
  NGO,
  NGOStatus,
  Donation,
  DonationStatus,
  FoodCategory,
  UrgencyLevel,
  Volunteer,
  VolunteerAvailability,
  Assignment,
  AssignmentStatus,
  Notification,
  NotificationStatus,
  DashboardStats,
  NGODashboardStats,
  VolunteerDashboardStats,
  AdminDashboardStats,
  AdminActivityLogEntry,
} from '../types';

const REGISTERED_USERS_KEY = 'annasathi_registered_users';
const UPDATED_USERS_KEY = 'annasathi_updated_users';
const REGISTERED_NGOS_KEY = 'annasathi_registered_ngos';
const UPDATED_NGOS_KEY = 'annasathi_updated_ngos';
const CREATED_DONATIONS_KEY = 'annasathi_created_donations';
const UPDATED_DONATIONS_KEY = 'annasathi_updated_donations';
const REJECTED_DONATIONS_KEY = 'annasathi_rejected_donations';
const UPDATED_VOLUNTEERS_KEY = 'annasathi_updated_volunteers';
const CREATED_ASSIGNMENTS_KEY = 'annasathi_created_assignments';
const UPDATED_ASSIGNMENTS_KEY = 'annasathi_updated_assignments';
const ADMIN_ACTIVITY_LOG_KEY = 'annasathi_admin_activity_log';

export interface VerifyNGOResult {
  success: boolean;
  ngo?: NGO;
  error?: string;
}

export interface UpdateUserStatusResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface AdminCancelDonationResult {
  success: boolean;
  donation?: Donation;
  error?: string;
}

export interface AcceptDonationResult {
  success: boolean;
  donation?: Donation;
  error?: string;
}

export interface RejectDonationResult {
  success: boolean;
  donation?: Donation;
  error?: string;
}

export interface CancelDonationResult {
  success: boolean;
  donation?: Donation;
  error?: string;
}

export interface UpdateNGOProfileResult {
  success: boolean;
  ngo?: NGO;
  error?: string;
}

export interface ConfirmReceiptResult {
  success: boolean;
  donation?: Donation;
  error?: string;
}

export interface AcceptAssignmentResult {
  success: boolean;
  assignment?: Assignment;
  donation?: Donation;
  error?: string;
}

export interface AssignmentActionResult {
  success: boolean;
  assignment?: Assignment;
  donation?: Donation;
  error?: string;
}

export interface UpdateVolunteerProfileResult {
  success: boolean;
  volunteer?: Volunteer;
  error?: string;
}

export interface NGORejectionRecord {
  donationId: string;
  ngoId: string;
  reason?: string;
  timestamp: string;
}

export interface UrgencyCalculation {
  score: number;
  level: UrgencyLevel;
  explanation: string;
}

// Helper to safely load persisted mock records from localStorage
function loadPersisted<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed to read ${key} from localStorage:`, err);
  }
  return [];
}

function savePersisted<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Failed to save ${key} to localStorage:`, err);
  }
}

// Initial static datasets (read-only base, never mutated)
const staticUsers: User[] = usersData as unknown as User[];
const staticNgos: NGO[] = ngosData as unknown as NGO[];
const staticDonations: Donation[] = donationsData as unknown as Donation[];
const staticVolunteers: Volunteer[] = volunteersData as unknown as Volunteer[];
const staticAssignments: Assignment[] = assignmentsData as unknown as Assignment[];
const staticNotifications: Notification[] = notificationsData as unknown as Notification[];
const staticDashboardStats = dashboardStatsData as any as Record<UserRole, DashboardStats>;

export const mockDataService = {
  // ─── Users ──────────────────────────────────────────────────────────
  getUsers: (): User[] => {
    const dynamicUsers = loadPersisted<User>(REGISTERED_USERS_KEY);
    const allUsers = [...staticUsers, ...dynamicUsers];
    const updatedUsers = loadPersisted<User>(UPDATED_USERS_KEY);
    const map = new Map(updatedUsers.map((u) => [u.id, u]));
    return allUsers.map((u) => map.get(u.id) || u);
  },
  getUserById: (id: string): User | undefined => {
    return mockDataService.getUsers().find((u) => u.id === id);
  },
  getUsersByRole: (role: UserRole): User[] => {
    return mockDataService.getUsers().filter((u) => u.role === role);
  },
  updateUserStatus: (
    targetUserId: string,
    newStatus: UserStatus,
    adminUserId: string
  ): UpdateUserStatusResult => {
    const adminUser = mockDataService.getUserById(adminUserId);
    if (!adminUser || adminUser.role !== 'admin') {
      return {
        success: false,
        error: 'Unauthorized: Only platform administrators can change user status.',
      };
    }
    const targetUser = mockDataService.getUserById(targetUserId);
    if (!targetUser) {
      return { success: false, error: 'User record not found.' };
    }

    // Safety restriction: Admins cannot deactivate their own administrative accounts
    if (targetUser.id === adminUser.id && newStatus !== 'active') {
      return {
        success: false,
        error: 'Safety restriction: Administrators cannot deactivate their own accounts.',
      };
    }

    const updatedUser: User = {
      ...targetUser,
      status: newStatus,
    };

    const currentUpdates = loadPersisted<User>(UPDATED_USERS_KEY).filter(
      (u) => u.id !== targetUserId
    );
    savePersisted<User>(UPDATED_USERS_KEY, [...currentUpdates, updatedUser]);

    mockDataService.logAdminActivity({
      actionType: newStatus === 'active' ? 'user_activated' : 'user_deactivated',
      adminId: adminUser.id,
      targetId: targetUser.id,
      targetType: 'user',
      description: `Changed account status of ${targetUser.name} (${targetUser.email}) to ${newStatus}.`,
    });

    return { success: true, user: updatedUser };
  },

  // ─── NGOs ───────────────────────────────────────────────────────────
  getNGOs: (): NGO[] => {
    const dynamicNgos = loadPersisted<NGO>(REGISTERED_NGOS_KEY);
    const allBase = [...staticNgos, ...dynamicNgos];
    const dynamicUpdates = loadPersisted<NGO>(UPDATED_NGOS_KEY);
    const updatesMap = new Map(dynamicUpdates.map((n) => [n.id, n]));
    return allBase.map((n) => updatesMap.get(n.id) || n);
  },
  getNGOById: (id: string): NGO | undefined => {
    return mockDataService.getNGOs().find((n) => n.id === id);
  },
  getNGOsByStatus: (status: NGOStatus): NGO[] => {
    return mockDataService.getNGOs().filter((n) => n.verificationStatus === status);
  },
  getNGOByUserId: (userId: string): NGO | undefined => {
    return mockDataService.getNGOs().find((n) => n.userId === userId);
  },
  createRegisteredNGO: (ngo: NGO): void => {
    const current = loadPersisted<NGO>(REGISTERED_NGOS_KEY);
    savePersisted<NGO>(REGISTERED_NGOS_KEY, [...current, ngo]);
  },
  updateNGOProfile: (
    ngoId: string,
    authenticatedUserId: string,
    updates: Partial<NGO>
  ): UpdateNGOProfileResult => {
    if (!authenticatedUserId || !authenticatedUserId.trim()) {
      return { success: false, error: 'Unauthorized: Missing user authentication.' };
    }
    const ngo = mockDataService.getNGOById(ngoId);
    if (!ngo) {
      return { success: false, error: 'Organization record not found.' };
    }
    // Authorization check: User can only update their own NGO profile
    if (ngo.userId !== authenticatedUserId && ngo.id !== authenticatedUserId) {
      return {
        success: false,
        error: 'Unauthorized: You can only edit your own organization profile.',
      };
    }

    if (updates.organizationName !== undefined && !updates.organizationName.trim()) {
      return { success: false, error: 'Organization name cannot be empty.' };
    }
    if (updates.contactPerson !== undefined && !updates.contactPerson.trim()) {
      return { success: false, error: 'Contact person cannot be empty.' };
    }
    if (updates.contactPhone !== undefined && !updates.contactPhone.trim()) {
      return { success: false, error: 'Contact phone cannot be empty.' };
    }
    if (updates.contactEmail !== undefined && !updates.contactEmail.trim()) {
      return { success: false, error: 'Contact email cannot be empty.' };
    }
    if (updates.capacity?.maxDailyMeals !== undefined && updates.capacity.maxDailyMeals < 0) {
      return { success: false, error: 'Max daily meal capacity cannot be negative.' };
    }

    // Security check: Protect verification status, verified date, and rejection reason from self-tampering
    const safeUpdates = { ...updates };
    delete (safeUpdates as any).verificationStatus;
    delete (safeUpdates as any).verifiedAt;
    delete (safeUpdates as any).rejectionReason;
    delete (safeUpdates as any).id;
    delete (safeUpdates as any).userId;

    const updatedNgo: NGO = {
      ...ngo,
      ...safeUpdates,
      address: safeUpdates.address ? { ...ngo.address, ...safeUpdates.address } : ngo.address,
      capacity: safeUpdates.capacity ? { ...ngo.capacity, ...safeUpdates.capacity } : ngo.capacity,
    };

    const currentUpdates = loadPersisted<NGO>(UPDATED_NGOS_KEY).filter((n) => n.id !== ngoId);
    savePersisted<NGO>(UPDATED_NGOS_KEY, [...currentUpdates, updatedNgo]);

    return { success: true, ngo: updatedNgo };
  },
  isNGOVerified: (userIdOrNgoId: string): boolean => {
    const ngo =
      mockDataService.getNGOById(userIdOrNgoId) ||
      mockDataService.getNGOByUserId(userIdOrNgoId);
    return ngo?.verificationStatus === 'verified';
  },

  /**
   * Admin action to verify an NGO.
   * Service-level validation strictly enforces admin role and updates verification timestamps.
   */
  verifyNGO: (ngoId: string, adminUserId: string): VerifyNGOResult => {
    const adminUser = mockDataService.getUserById(adminUserId);
    if (!adminUser || adminUser.role !== 'admin') {
      return {
        success: false,
        error: 'Unauthorized: Only platform administrators can verify NGOs.',
      };
    }
    const ngo = mockDataService.getNGOById(ngoId);
    if (!ngo) {
      return { success: false, error: 'NGO record not found.' };
    }

    const nowIso = new Date().toISOString();
    const updatedNgo: NGO = {
      ...ngo,
      verificationStatus: 'verified',
      verifiedAt: nowIso,
      rejectionReason: undefined,
    };

    const currentUpdates = loadPersisted<NGO>(UPDATED_NGOS_KEY).filter((n) => n.id !== ngoId);
    savePersisted<NGO>(UPDATED_NGOS_KEY, [...currentUpdates, updatedNgo]);

    mockDataService.logAdminActivity({
      actionType: 'ngo_verified',
      adminId: adminUser.id,
      targetId: ngo.id,
      targetType: 'ngo',
      description: `Verified NGO: ${ngo.organizationName} (Reg: ${ngo.registrationNumber || 'N/A'})`,
    });

    return { success: true, ngo: updatedNgo };
  },

  /**
   * Admin action to reject an NGO with a documented reason.
   */
  rejectNGO: (ngoId: string, adminUserId: string, reason: string): VerifyNGOResult => {
    const adminUser = mockDataService.getUserById(adminUserId);
    if (!adminUser || adminUser.role !== 'admin') {
      return {
        success: false,
        error: 'Unauthorized: Only platform administrators can reject NGOs.',
      };
    }
    if (!reason || !reason.trim()) {
      return { success: false, error: 'A specific reason must be provided for NGO rejection.' };
    }
    const ngo = mockDataService.getNGOById(ngoId);
    if (!ngo) {
      return { success: false, error: 'NGO record not found.' };
    }

    const updatedNgo: NGO = {
      ...ngo,
      verificationStatus: 'rejected',
      rejectionReason: reason.trim(),
    };

    const currentUpdates = loadPersisted<NGO>(UPDATED_NGOS_KEY).filter((n) => n.id !== ngoId);
    savePersisted<NGO>(UPDATED_NGOS_KEY, [...currentUpdates, updatedNgo]);

    mockDataService.logAdminActivity({
      actionType: 'ngo_rejected',
      adminId: adminUser.id,
      targetId: ngo.id,
      targetType: 'ngo',
      description: `Rejected NGO: ${ngo.organizationName} - Reason: ${reason.trim()}`,
    });

    return { success: true, ngo: updatedNgo };
  },

  // ─── Donations ──────────────────────────────────────────────────────
  getDonations: (): Donation[] => {
    const createdDonations = loadPersisted<Donation>(CREATED_DONATIONS_KEY);
    const allBase = [...staticDonations, ...createdDonations];

    const dynamicUpdates = loadPersisted<Donation>(UPDATED_DONATIONS_KEY);
    const updatesMap = new Map(dynamicUpdates.map((d) => [d.id, d]));

    return allBase.map((d) => updatesMap.get(d.id) || d);
  },
  getDonationById: (id: string): Donation | undefined => {
    return mockDataService.getDonations().find((d) => d.id === id);
  },
  getDonationsByStatus: (status: DonationStatus): Donation[] => {
    return mockDataService.getDonations().filter((d) => d.status === status);
  },
  getDonationsByDonor: (donorId: string): Donation[] => {
    if (!donorId || !donorId.trim()) return [];
    return mockDataService.getDonations().filter((d) => d.donorId === donorId);
  },
  getDonationsByCategory: (category: FoodCategory): Donation[] => {
    return mockDataService.getDonations().filter((d) => d.category === category);
  },
  getDonationsByUrgency: (urgency: UrgencyLevel): Donation[] => {
    return mockDataService.getDonations().filter((d) => d.urgencyLevel === urgency);
  },
  getAvailableDonationsForNGO: (ngoUserIdOrId?: string): Donation[] => {
    const ngo = ngoUserIdOrId
      ? mockDataService.getNGOById(ngoUserIdOrId) || mockDataService.getNGOByUserId(ngoUserIdOrId)
      : undefined;

    const rejections = loadPersisted<NGORejectionRecord>(REJECTED_DONATIONS_KEY);
    const rejectedIdsForThisNgo = new Set(
      ngo ? rejections.filter((r) => r.ngoId === ngo.id).map((r) => r.donationId) : []
    );

    return mockDataService.getDonations().filter((d) => {
      // Exclude donations already rejected by this NGO
      if (rejectedIdsForThisNgo.has(d.id)) return false;

      // Status CREATED is open to all NGOs
      if (d.status === 'CREATED') return true;

      // Status NGO_MATCHED is available if matched to this NGO (or unassigned match)
      if (d.status === 'NGO_MATCHED') {
        if (!d.matchedNgoId) return true;
        if (ngo && d.matchedNgoId === ngo.id) return true;
      }

      return false;
    });
  },
  getAcceptedDonationsForNGO: (ngoUserIdOrId: string): Donation[] => {
    const ngo =
      mockDataService.getNGOById(ngoUserIdOrId) ||
      mockDataService.getNGOByUserId(ngoUserIdOrId);
    if (!ngo) return [];
    return mockDataService
      .getDonations()
      .filter(
        (d) =>
          d.matchedNgoId === ngo.id &&
          (d.status === 'NGO_ACCEPTED' ||
            d.status === 'VOLUNTEER_ASSIGNED' ||
            d.status === 'PICKED_UP' ||
            d.status === 'DELIVERED' ||
            d.status === 'RECEIPT_CONFIRMED')
      );
  },

  /**
   * Persists a newly created donation by an authenticated donor.
   * Service-level validation strictly enforces:
   * 1. Valid donor ID.
   * 2. Non-empty food name and pickup address.
   * 3. Positive quantity.
   * 4. Expiry strictly in the future and later than preparation time.
   * 5. Initial status strictly set to 'CREATED'.
   * 6. Urgency score bounded in [0, 100].
   * 7. Unique donation ID.
   */
  createDonation: (donation: Donation): Donation => {
    if (!donation.id || !donation.id.trim()) {
      throw new Error('Service validation error: Donation must have a valid unique ID.');
    }
    if (!donation.donorId || !donation.donorId.trim()) {
      throw new Error('Service validation error: Missing authenticated donor ID.');
    }
    if (!donation.foodName || !donation.foodName.trim()) {
      throw new Error('Service validation error: Food name cannot be empty.');
    }
    if (typeof donation.quantity !== 'number' || donation.quantity <= 0) {
      throw new Error('Service validation error: Quantity must be a positive number.');
    }
    if (donation.status !== 'CREATED') {
      throw new Error('Service validation error: Initial donation status must be CREATED.');
    }
    if (
      typeof donation.urgencyScore !== 'number' ||
      donation.urgencyScore < 0 ||
      donation.urgencyScore > 100
    ) {
      throw new Error('Service validation error: Urgency score must be between 0 and 100.');
    }

    const prepTime = new Date(donation.preparationTime).getTime();
    const expiryTime = new Date(donation.expiryTime).getTime();
    const now = Date.now();

    if (isNaN(prepTime) || isNaN(expiryTime)) {
      throw new Error('Service validation error: Invalid preparation or expiry timestamp.');
    }
    if (expiryTime <= prepTime) {
      throw new Error('Service validation error: Expiry time must be later than preparation time.');
    }
    if (expiryTime <= now) {
      throw new Error('Service validation error: Expired food cannot be submitted.');
    }
    if (!donation.pickupAddress || !donation.pickupAddress.street || !donation.pickupAddress.street.trim()) {
      throw new Error('Service validation error: Pickup address street cannot be empty.');
    }

    const current = loadPersisted<Donation>(CREATED_DONATIONS_KEY);
    if (
      current.some((d) => d.id === donation.id) ||
      staticDonations.some((d) => d.id === donation.id)
    ) {
      throw new Error(`Service validation error: Donation ID ${donation.id} already exists.`);
    }

    savePersisted<Donation>(CREATED_DONATIONS_KEY, [donation, ...current]);
    return donation;
  },

  /**
   * Action function to cancel an active donation.
   * Service-level validation strictly enforces:
   * 1. Valid donor identity.
   * 2. Confirms donation ownership (donor can only cancel their own donation).
   * 3. Prevents repeated cancellation.
   * 4. Rejects cancellation after food has been PICKED_UP, DELIVERED, or RECEIPT_CONFIRMED.
   */
  cancelDonation: (donationId: string, donorId: string): CancelDonationResult => {
    if (!donorId || !donorId.trim()) {
      return { success: false, error: 'Unauthorized: Missing donor identity.' };
    }

    const donation = mockDataService.getDonationById(donationId);
    if (!donation) {
      return { success: false, error: 'Donation record not found.' };
    }

    if (donation.donorId !== donorId) {
      return { success: false, error: 'Unauthorized: You can only cancel your own donations.' };
    }

    if (donation.status === 'CANCELLED') {
      return { success: false, error: 'This donation is already cancelled.' };
    }

    const unCancellableStatuses: DonationStatus[] = [
      'PICKED_UP',
      'DELIVERED',
      'RECEIPT_CONFIRMED',
    ];

    if (unCancellableStatuses.includes(donation.status)) {
      return {
        success: false,
        error: `Cancellation rejected at service level: Cannot cancel a donation that is already ${donation.status.replace(
          '_',
          ' '
        )}. Food is already in transit or delivered.`,
      };
    }

    const updatedDonation: Donation = {
      ...donation,
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    };

    const currentUpdates = loadPersisted<Donation>(UPDATED_DONATIONS_KEY).filter(
      (d) => d.id !== donationId
    );
    savePersisted<Donation>(UPDATED_DONATIONS_KEY, [...currentUpdates, updatedDonation]);

    return { success: true, donation: updatedDonation };
  },

  /**
   * Action function for an administrator to cancel a donation listing with an audit reason.
   * Service-level validation strictly enforces admin role, verifies lifecycle state,
   * cascades cancellation to any active assignment, and records the event in the admin audit log.
   */
  adminCancelDonation: (
    donationId: string,
    adminUserId: string,
    reason: string
  ): AdminCancelDonationResult => {
    const adminUser = mockDataService.getUserById(adminUserId);
    if (!adminUser || adminUser.role !== 'admin') {
      return {
        success: false,
        error: 'Unauthorized: Only platform administrators can perform administrative cancellations.',
      };
    }
    const donation = mockDataService.getDonationById(donationId);
    if (!donation) {
      return { success: false, error: 'Donation record not found.' };
    }
    if (donation.status === 'CANCELLED') {
      return { success: false, error: 'This donation is already cancelled.' };
    }
    if (donation.status === 'RECEIPT_CONFIRMED') {
      return {
        success: false,
        error: 'Cannot cancel a donation that has already been verified and confirmed by the receiving NGO.',
      };
    }

    const nowIso = new Date().toISOString();
    const updatedDonation: Donation = {
      ...donation,
      status: 'CANCELLED',
      specialInstructions: reason
        ? `${donation.specialInstructions || ''} | Admin Cancel: ${reason.trim()}`.trim()
        : donation.specialInstructions,
      updatedAt: nowIso,
    };

    const currentUpdates = loadPersisted<Donation>(UPDATED_DONATIONS_KEY).filter(
      (d) => d.id !== donationId
    );
    savePersisted<Donation>(UPDATED_DONATIONS_KEY, [...currentUpdates, updatedDonation]);

    // Cascade cancellation to any active assignment linked to this donation
    const assignment = mockDataService.getAssignmentByDonationId(donationId);
    if (assignment && assignment.status !== 'cancelled' && assignment.status !== 'delivered') {
      const updatedAssignment: Assignment = {
        ...assignment,
        status: 'cancelled',
        notes: reason ? `${assignment.notes || ''} | Admin Cancelled: ${reason.trim()}`.trim() : assignment.notes,
      };
      const currentAsgns = loadPersisted<Assignment>(UPDATED_ASSIGNMENTS_KEY).filter(
        (a) => a.id !== assignment.id
      );
      savePersisted<Assignment>(UPDATED_ASSIGNMENTS_KEY, [...currentAsgns, updatedAssignment]);
    }

    mockDataService.logAdminActivity({
      actionType: 'donation_cancelled',
      adminId: adminUser.id,
      targetId: donation.id,
      targetType: 'donation',
      description: `Administrative cancellation for donation #${donation.id} (${donation.foodName}) - Reason: ${reason || 'Administrative action'}`,
    });

    return { success: true, donation: updatedDonation };
  },

  /**
   * Action function to accept a donation on behalf of an NGO.
   */
  acceptDonation: (donationId: string, ngoUserIdOrId: string): AcceptDonationResult => {
    // Role verification
    const user = mockDataService.getUserById(ngoUserIdOrId);
    if (user && user.role !== 'ngo') {
      return {
        success: false,
        error: 'Unauthorized: Only accounts with the NGO role may accept donations.',
      };
    }

    const ngo =
      mockDataService.getNGOById(ngoUserIdOrId) ||
      mockDataService.getNGOByUserId(ngoUserIdOrId);

    if (!ngo) {
      return { success: false, error: 'NGO record not found for this account.' };
    }

    if (ngo.verificationStatus === 'pending') {
      return {
        success: false,
        error:
          'Action rejected at service level: Your NGO verification is pending. You cannot accept donations until verified.',
      };
    }
    if (ngo.verificationStatus === 'rejected') {
      return {
        success: false,
        error: `Action rejected at service level: Your NGO verification was rejected (${
          ngo.rejectionReason || 'document mismatch'
        }). Donation acceptance is blocked.`,
      };
    }
    if (ngo.verificationStatus !== 'verified') {
      return {
        success: false,
        error: 'Action rejected at service level: Only verified NGOs may accept surplus food donations.',
      };
    }

    const donation = mockDataService.getDonationById(donationId);
    if (!donation) {
      return { success: false, error: 'Donation record not found.' };
    }

    if (donation.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Action rejected at service level: This donation has been cancelled by the donor.',
      };
    }
    if (donation.status !== 'CREATED' && donation.status !== 'NGO_MATCHED') {
      return {
        success: false,
        error: `Action rejected at service level: This donation has already been accepted (current status: ${donation.status}). Repeated acceptance is prevented.`,
      };
    }
    if (
      donation.status === 'NGO_MATCHED' &&
      donation.matchedNgoId &&
      donation.matchedNgoId !== ngo.id
    ) {
      return {
        success: false,
        error: 'Action rejected at service level: This donation is matched to another organization.',
      };
    }

    const updatedDonation: Donation = {
      ...donation,
      status: 'NGO_ACCEPTED',
      matchedNgoId: ngo.id,
      updatedAt: new Date().toISOString(),
    };

    const currentUpdates = loadPersisted<Donation>(UPDATED_DONATIONS_KEY).filter(
      (d) => d.id !== donationId
    );
    savePersisted<Donation>(UPDATED_DONATIONS_KEY, [...currentUpdates, updatedDonation]);

    return { success: true, donation: updatedDonation };
  },

  /**
   * Action function for an NGO to decline/reject a donation.
   * Service-level validation strictly enforces:
   * 1. Valid authenticated NGO identity with 'ngo' role.
   * 2. Verified NGO status.
   * 3. Donation exists.
   * 4. Prevents rejecting cancelled or completed donations.
   * 5. Prevents modifying donations accepted by another NGO.
   * 6. Prevents repeated rejection.
   * 7. Releases matched donation back to CREATED state so other NGOs can claim it.
   */
  rejectDonation: (
    donationId: string,
    ngoUserIdOrId: string,
    reason?: string
  ): RejectDonationResult => {
    // Role verification
    const user = mockDataService.getUserById(ngoUserIdOrId);
    if (user && user.role !== 'ngo') {
      return {
        success: false,
        error: 'Unauthorized: Only accounts with the NGO role may decline donations.',
      };
    }

    const ngo =
      mockDataService.getNGOById(ngoUserIdOrId) ||
      mockDataService.getNGOByUserId(ngoUserIdOrId);

    if (!ngo) {
      return { success: false, error: 'NGO record not found for this account.' };
    }

    if (ngo.verificationStatus === 'pending') {
      return {
        success: false,
        error:
          'Action rejected at service level: Your NGO verification is pending. You cannot manage donation claims until verified.',
      };
    }
    if (ngo.verificationStatus === 'rejected') {
      return {
        success: false,
        error: `Action rejected at service level: Your NGO verification was rejected (${
          ngo.rejectionReason || 'document mismatch'
        }). Donation management is blocked.`,
      };
    }
    if (ngo.verificationStatus !== 'verified') {
      return {
        success: false,
        error: 'Action rejected at service level: Only verified NGOs may manage donation claims.',
      };
    }

    const donation = mockDataService.getDonationById(donationId);
    if (!donation) {
      return { success: false, error: 'Donation record not found.' };
    }

    if (donation.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Cannot decline a donation that has already been cancelled.',
      };
    }

    if (
      donation.matchedNgoId &&
      donation.matchedNgoId !== ngo.id &&
      donation.status !== 'NGO_MATCHED'
    ) {
      return {
        success: false,
        error: 'Cannot decline a donation that has already been accepted by another organization.',
      };
    }

    if (donation.status !== 'CREATED' && donation.status !== 'NGO_MATCHED') {
      return {
        success: false,
        error: `Cannot decline a donation that is already ${donation.status.replace(
          '_',
          ' '
        )}. Only available or matched listings may be declined.`,
      };
    }

    const completedStatuses: DonationStatus[] = ['PICKED_UP', 'DELIVERED', 'RECEIPT_CONFIRMED'];
    if (completedStatuses.includes(donation.status)) {
      return {
        success: false,
        error: `Cannot decline a donation that is already ${donation.status.replace('_', ' ')}.`,
      };
    }

    const rejections = loadPersisted<NGORejectionRecord>(REJECTED_DONATIONS_KEY);
    if (rejections.some((r) => r.donationId === donationId && r.ngoId === ngo.id)) {
      return { success: false, error: 'You have already declined this donation.' };
    }

    let updatedDonation = donation;
    // If the donation was specifically matched to this NGO, release it back to open CREATED state
    if (donation.status === 'NGO_MATCHED' && donation.matchedNgoId === ngo.id) {
      updatedDonation = {
        ...donation,
        status: 'CREATED',
        matchedNgoId: undefined,
        updatedAt: new Date().toISOString(),
      };
      const currentUpdates = loadPersisted<Donation>(UPDATED_DONATIONS_KEY).filter(
        (d) => d.id !== donationId
      );
      savePersisted<Donation>(UPDATED_DONATIONS_KEY, [...currentUpdates, updatedDonation]);
    }

    savePersisted<NGORejectionRecord>(REJECTED_DONATIONS_KEY, [
      ...rejections,
      {
        donationId,
        ngoId: ngo.id,
        reason: reason || 'Declined by NGO',
        timestamp: new Date().toISOString(),
      },
    ]);

    return { success: true, donation: updatedDonation };
  },

  /**
   * Action function for an NGO to confirm receipt of delivered food.
   */
  confirmDonationReceipt: (
    donationId: string,
    ngoUserIdOrId: string,
    notes?: string
  ): ConfirmReceiptResult => {
    // Role verification
    const user = mockDataService.getUserById(ngoUserIdOrId);
    if (user && user.role !== 'ngo') {
      return {
        success: false,
        error: 'Unauthorized: Only accounts with the NGO role may confirm donation receipts.',
      };
    }

    const ngo =
      mockDataService.getNGOById(ngoUserIdOrId) ||
      mockDataService.getNGOByUserId(ngoUserIdOrId);

    if (!ngo) {
      return { success: false, error: 'NGO record not found for this account.' };
    }

    const donation = mockDataService.getDonationById(donationId);
    if (!donation) {
      return { success: false, error: 'Donation record not found.' };
    }

    if (donation.matchedNgoId !== ngo.id) {
      return {
        success: false,
        error: 'Unauthorized: This donation does not belong to your organization.',
      };
    }

    if (donation.status === 'RECEIPT_CONFIRMED') {
      return { success: false, error: 'Receipt has already been confirmed for this donation.' };
    }

    if (donation.status !== 'DELIVERED') {
      return {
        success: false,
        error: `Receipt can only be confirmed after food has been marked as delivered (current status: ${donation.status.replace(
          '_',
          ' '
        )}).`,
      };
    }

    const updatedDonation: Donation = {
      ...donation,
      status: 'RECEIPT_CONFIRMED',
      specialInstructions: notes
        ? `${donation.specialInstructions || ''} | NGO Receipt Note: ${notes}`.trim()
        : donation.specialInstructions,
      updatedAt: new Date().toISOString(),
    };

    const currentUpdates = loadPersisted<Donation>(UPDATED_DONATIONS_KEY).filter(
      (d) => d.id !== donationId
    );
    savePersisted<Donation>(UPDATED_DONATIONS_KEY, [...currentUpdates, updatedDonation]);

    return { success: true, donation: updatedDonation };
  },

  /**
   * Returns donation history for an NGO: only completed receipts (DELIVERED, RECEIPT_CONFIRMED).
   */
  getNGODonationHistory: (ngoUserIdOrId: string): Donation[] => {
    const ngo =
      mockDataService.getNGOById(ngoUserIdOrId) ||
      mockDataService.getNGOByUserId(ngoUserIdOrId);
    if (!ngo) return [];

    return mockDataService
      .getDonations()
      .filter(
        (d) =>
          d.matchedNgoId === ngo.id &&
          (d.status === 'DELIVERED' || d.status === 'RECEIPT_CONFIRMED')
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  /**
   * Returns dynamically calculated dashboard statistics for an NGO.
   */
  getNGODashboardStats: (ngoUserIdOrId: string): NGODashboardStats => {
    const ngo =
      mockDataService.getNGOById(ngoUserIdOrId) ||
      mockDataService.getNGOByUserId(ngoUserIdOrId);

    if (!ngo) {
      return {
        availableDonationsCount: 0,
        acceptedDonationsCount: 0,
        activeVolunteerAssignmentsCount: 0,
        completedDeliveriesCount: 0,
        receiptConfirmedCount: 0,
        totalMealsReceived: 0,
        categoryDistribution: [],
        recentDonations: [],
      };
    }

    const availableDonations = mockDataService.getAvailableDonationsForNGO(ngoUserIdOrId);
    const allNgoDonations = mockDataService
      .getDonations()
      .filter((d) => d.matchedNgoId === ngo.id);

    const acceptedDonations = allNgoDonations.filter((d) =>
      ['NGO_ACCEPTED', 'VOLUNTEER_ASSIGNED', 'PICKED_UP'].includes(d.status)
    );
    const completedDeliveries = allNgoDonations.filter(
      (d) => d.status === 'DELIVERED' || d.status === 'RECEIPT_CONFIRMED'
    );
    const receiptConfirmed = allNgoDonations.filter((d) => d.status === 'RECEIPT_CONFIRMED');

    const totalMeals = completedDeliveries.reduce(
      (acc, d) => acc + (d.numberOfServings || d.quantity || 0),
      0
    );

    const activeAssignments = mockDataService
      .getAssignments()
      .filter(
        (a) =>
          a.ngoId === ngo.id &&
          ['assigned', 'in_transit_to_pickup', 'picked_up', 'in_transit_to_delivery'].includes(
            a.status
          )
      );

    const catMap = new Map<FoodCategory, { count: number; totalQuantity: number; unit: string }>();
    const handledDonations = allNgoDonations.filter((d) => d.status !== 'CANCELLED');
    handledDonations.forEach((d) => {
      const existing = catMap.get(d.category) || {
        count: 0,
        totalQuantity: 0,
        unit: d.unit,
      };
      catMap.set(d.category, {
        count: existing.count + 1,
        totalQuantity: existing.totalQuantity + d.quantity,
        unit: d.unit,
      });
    });

    const categoryDistribution = Array.from(catMap.entries()).map(([category, val]) => ({
      category,
      count: val.count,
      totalQuantity: val.totalQuantity,
      unit: val.unit,
    }));

    const recentDonations = [...allNgoDonations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return {
      availableDonationsCount: availableDonations.length,
      acceptedDonationsCount: acceptedDonations.length,
      activeVolunteerAssignmentsCount: activeAssignments.length,
      completedDeliveriesCount: completedDeliveries.length,
      receiptConfirmedCount: receiptConfirmed.length,
      totalMealsReceived: totalMeals,
      categoryDistribution,
      recentDonations,
    };
  },

  /**
   * Mock Urgency Calculator.
   * Calculates a transparent rule-based score from 0-100 based on shelf life,
   * category perishability, and elapsed preparation time.
   */
  calculateUrgency: (
    category: FoodCategory,
    prepTimeIso: string,
    expiryTimeIso: string
  ): UrgencyCalculation => {
    const now = Date.now();
    const expiry = new Date(expiryTimeIso).getTime();
    const prep = new Date(prepTimeIso).getTime();

    const hoursUntilExpiry = Math.max(0, (expiry - now) / (1000 * 60 * 60));
    const hoursSincePrep = Math.max(0, (now - prep) / (1000 * 60 * 60));

    // Base score from category perishability weight
    const categoryWeights: Record<FoodCategory, number> = {
      cooked_meals: 40,
      dairy_products: 35,
      fruits_vegetables: 25,
      bakery_items: 20,
      packaged_food: 10,
      raw_groceries: 5,
    };

    let score = categoryWeights[category] || 20;

    // Shelf life modifier: shorter shelf life increases urgency exponentially
    if (hoursUntilExpiry <= 2) {
      score += 55;
    } else if (hoursUntilExpiry <= 4) {
      score += 45;
    } else if (hoursUntilExpiry <= 8) {
      score += 35;
    } else if (hoursUntilExpiry <= 16) {
      score += 25;
    } else if (hoursUntilExpiry <= 24) {
      score += 15;
    } else {
      score += 5;
    }

    // Age modifier: food prepared longer ago needs faster collection
    if (hoursSincePrep > 4 && category === 'cooked_meals') {
      score += 10;
    }

    // Clamp score strictly to [0, 100]
    score = Math.min(100, Math.max(5, Math.round(score)));

    let level: UrgencyLevel = 'low';
    if (score >= 85) level = 'critical';
    else if (score >= 70) level = 'high';
    else if (score >= 40) level = 'medium';

    const explanation =
      hoursUntilExpiry <= 3
        ? `Critical perishability: Approximately ${Math.round(hoursUntilExpiry)} hours remaining before expiry.`
        : hoursUntilExpiry <= 8
        ? `High urgency: Shelf life window of ${Math.round(hoursUntilExpiry)} hours requires rapid dispatch.`
        : `Moderate urgency: Stable food category with ${Math.round(hoursUntilExpiry)} hours shelf life.`;

    return { score, level, explanation };
  },

  // ─── Volunteers ─────────────────────────────────────────────────────
  getVolunteers: (): Volunteer[] => {
    const dynamicUpdates = loadPersisted<Volunteer>(UPDATED_VOLUNTEERS_KEY);
    const updatesMap = new Map(dynamicUpdates.map((v) => [v.id, v]));
    return staticVolunteers.map((v) => updatesMap.get(v.id) || v);
  },
  getVolunteerById: (id?: string): Volunteer | undefined => {
    if (!id) return undefined;
    return mockDataService.getVolunteers().find((v) => v.id === id);
  },
  getVolunteersByAvailability: (availability: VolunteerAvailability): Volunteer[] =>
    mockDataService.getVolunteers().filter((v) => v.availability === availability),
  getVolunteerByUserId: (userId: string): Volunteer | undefined =>
    mockDataService.getVolunteers().find((v) => v.userId === userId),

  updateVolunteerProfile: (
    volunteerId: string,
    authenticatedUserId: string,
    updates: Partial<Volunteer>
  ): UpdateVolunteerProfileResult => {
    if (!authenticatedUserId || !authenticatedUserId.trim()) {
      return { success: false, error: 'Unauthorized: Missing user authentication.' };
    }
    const volunteer = mockDataService.getVolunteerById(volunteerId);
    if (!volunteer) {
      return { success: false, error: 'Volunteer record not found.' };
    }
    // Authorization check: User can only update their own volunteer profile
    if (volunteer.userId !== authenticatedUserId && volunteer.id !== authenticatedUserId) {
      return {
        success: false,
        error: 'Unauthorized: You can only edit your own volunteer profile.',
      };
    }

    if (updates.name !== undefined && !updates.name.trim()) {
      return { success: false, error: 'Full name cannot be empty.' };
    }
    if (updates.phone !== undefined && !updates.phone.trim()) {
      return { success: false, error: 'Phone number cannot be empty.' };
    }
    if (updates.email !== undefined && (!updates.email.trim() || !updates.email.includes('@'))) {
      return { success: false, error: 'Valid email address is required.' };
    }

    // Protect administrative and immutable fields from being modified
    const safeUpdates = { ...updates };
    delete (safeUpdates as any).id;
    delete (safeUpdates as any).userId;
    delete (safeUpdates as any).totalDeliveriesCompleted;
    delete (safeUpdates as any).rating;
    delete (safeUpdates as any).createdAt;

    const updatedVolunteer: Volunteer = {
      ...volunteer,
      ...safeUpdates,
    };

    const currentUpdates = loadPersisted<Volunteer>(UPDATED_VOLUNTEERS_KEY).filter(
      (v) => v.id !== volunteerId
    );
    savePersisted<Volunteer>(UPDATED_VOLUNTEERS_KEY, [...currentUpdates, updatedVolunteer]);

    return { success: true, volunteer: updatedVolunteer };
  },

  // ─── Assignments ────────────────────────────────────────────────────
  getAssignments: (): Assignment[] => {
    const allAssignments = [...staticAssignments];
    const existingDonationIds = new Set(allAssignments.map((a) => a.donationId));

    // Derive assignments for any donations that have reached NGO_ACCEPTED or beyond, if no assignment exists yet
    const allDonations = mockDataService.getDonations();
    allDonations.forEach((d) => {
      if (
        (d.status === 'NGO_ACCEPTED' ||
          d.status === 'VOLUNTEER_ASSIGNED' ||
          d.status === 'PICKED_UP' ||
          d.status === 'DELIVERED' ||
          d.status === 'RECEIPT_CONFIRMED') &&
        !existingDonationIds.has(d.id)
      ) {
        const donor = staticUsers.find((u) => u.id === d.donorId);
        const ngo = staticNgos.find((n) => n.id === d.matchedNgoId);

        const syntheticAssignment: Assignment = {
          id: `asgn-${d.id}`,
          donationId: d.id,
          volunteerId: '',
          ngoId: d.matchedNgoId || '',
          status: 'available',
          pickup: {
            address: `${d.pickupAddress.street}, ${d.pickupAddress.city}`,
            contactPerson: donor?.name || (donor as any)?.profile?.organizationName || 'Food Donor',
            contactPhone: donor?.phone || '+91 98765 43210',
            estimatedPickupTime: d.preparationTime,
            verificationOtp: '5821',
          },
          delivery: {
            ngoName: ngo?.organizationName || 'Partner Shelter',
            address: ngo ? `${ngo.address.street}, ${ngo.address.city}` : 'Shelter Facility',
            contactPerson: ngo?.contactPerson || 'Shelter Director',
            contactPhone: ngo?.contactPhone || '+91 98765 43211',
            estimatedDeliveryTime: d.expiryTime,
          },
          assignedAt: d.updatedAt || d.createdAt,
          notes: d.specialInstructions,
        };
        allAssignments.push(syntheticAssignment);
        existingDonationIds.add(d.id);
      }
    });

    // Dynamic created assignments
    const createdAssignments = loadPersisted<Assignment>(CREATED_ASSIGNMENTS_KEY);
    createdAssignments.forEach((ca) => {
      if (!existingDonationIds.has(ca.donationId)) {
        allAssignments.push(ca);
        existingDonationIds.add(ca.donationId);
      }
    });

    // Dynamic updated assignments overlay
    const dynamicUpdates = loadPersisted<Assignment>(UPDATED_ASSIGNMENTS_KEY);
    const assignmentMap = new Map<string, Assignment>();
    allAssignments.forEach((a) => assignmentMap.set(a.id, a));
    dynamicUpdates.forEach((ua) => assignmentMap.set(ua.id, ua));

    return Array.from(assignmentMap.values());
  },
  getAssignmentById: (id: string): Assignment | undefined =>
    mockDataService.getAssignments().find((a) => a.id === id),
  getAvailableAssignments: (): Assignment[] => {
    return mockDataService.getAssignments().filter((a) => {
      const isUnassigned = !a.volunteerId || a.volunteerId === '' || a.status === 'available';
      if (!isUnassigned) return false;
      if (a.status === 'cancelled') return false;

      const donation = mockDataService.getDonationById(a.donationId);
      if (!donation) return false;
      if (donation.status === 'CANCELLED') return false;
      return donation.status === 'NGO_ACCEPTED';
    });
  },
  getAssignmentsByVolunteer: (volunteerUserIdOrId: string): Assignment[] => {
    const volunteer =
      mockDataService.getVolunteerById(volunteerUserIdOrId) ||
      mockDataService.getVolunteerByUserId(volunteerUserIdOrId);
    if (!volunteer) return [];
    return mockDataService.getAssignments().filter((a) => a.volunteerId === volunteer.id);
  },
  getAssignmentsByStatus: (status: AssignmentStatus): Assignment[] =>
    mockDataService.getAssignments().filter((a) => a.status === status),
  getAssignmentsByNgo: (ngoId: string): Assignment[] =>
    mockDataService.getAssignments().filter((a) => a.ngoId === ngoId),
  getAssignmentByDonationId: (donationId: string): Assignment | undefined =>
    mockDataService.getAssignments().find((a) => a.donationId === donationId),

  /**
   * Action function for a volunteer to accept an available delivery assignment.
   */
  acceptAssignment: (
    assignmentId: string,
    volunteerUserIdOrId: string
  ): AcceptAssignmentResult => {
    // 1. Role verification
    const user = mockDataService.getUserById(volunteerUserIdOrId);
    if (user && user.role !== 'volunteer') {
      return {
        success: false,
        error: 'Unauthorized: Only accounts with the volunteer role may accept delivery tasks.',
      };
    }

    const volunteer =
      mockDataService.getVolunteerById(volunteerUserIdOrId) ||
      mockDataService.getVolunteerByUserId(volunteerUserIdOrId);

    if (!volunteer) {
      return { success: false, error: 'Volunteer record not found for this account.' };
    }

    if (volunteer.status !== 'active') {
      return {
        success: false,
        error: 'Action rejected: Inactive volunteer accounts cannot accept tasks.',
      };
    }

    // 2. Assignment lookup
    const assignment = mockDataService.getAssignmentById(assignmentId);
    if (!assignment) {
      return { success: false, error: 'Assignment task record not found.' };
    }

    // 3. Prevent duplicate or conflicting acceptance
    if (
      (assignment.volunteerId && assignment.volunteerId.trim() !== '') ||
      assignment.status !== 'available'
    ) {
      return {
        success: false,
        error: 'Action rejected: This task has already been accepted by another volunteer.',
      };
    }

    // 4. Validate associated donation
    const donation = mockDataService.getDonationById(assignment.donationId);
    if (!donation) {
      return { success: false, error: 'Associated donation record not found.' };
    }
    if (donation.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Action rejected: This donation was cancelled by the donor.',
      };
    }
    if (donation.status !== 'NGO_ACCEPTED') {
      return {
        success: false,
        error: `Action rejected: Donation is not in an eligible state for volunteer claiming (current status: ${donation.status}).`,
      };
    }

    const nowIso = new Date().toISOString();

    const updatedAssignment: Assignment = {
      ...assignment,
      volunteerId: volunteer.id,
      status: 'assigned',
      assignedAt: nowIso,
    };

    const updatedDonation: Donation = {
      ...donation,
      status: 'VOLUNTEER_ASSIGNED',
      updatedAt: nowIso,
    };

    const currentAssignments = loadPersisted<Assignment>(UPDATED_ASSIGNMENTS_KEY).filter(
      (a) => a.id !== assignmentId
    );
    savePersisted<Assignment>(UPDATED_ASSIGNMENTS_KEY, [...currentAssignments, updatedAssignment]);

    const currentDonations = loadPersisted<Donation>(UPDATED_DONATIONS_KEY).filter(
      (d) => d.id !== donation.id
    );
    savePersisted<Donation>(UPDATED_DONATIONS_KEY, [...currentDonations, updatedDonation]);

    return { success: true, assignment: updatedAssignment, donation: updatedDonation };
  },

  /**
   * Action function for a volunteer to mark food as picked up from the donor.
   */
  pickupAssignment: (
    assignmentId: string,
    volunteerUserIdOrId: string,
    notes?: string
  ): AssignmentActionResult => {
    const user = mockDataService.getUserById(volunteerUserIdOrId);
    if (user && user.role !== 'volunteer') {
      return {
        success: false,
        error: 'Unauthorized: Only accounts with the volunteer role may mark tasks as picked up.',
      };
    }

    const volunteer =
      mockDataService.getVolunteerById(volunteerUserIdOrId) ||
      mockDataService.getVolunteerByUserId(volunteerUserIdOrId);

    if (!volunteer) {
      return { success: false, error: 'Volunteer record not found for this account.' };
    }

    const assignment = mockDataService.getAssignmentById(assignmentId);
    if (!assignment) {
      return { success: false, error: 'Assignment task record not found.' };
    }

    // Ownership check
    if (assignment.volunteerId !== volunteer.id) {
      return {
        success: false,
        error: 'Unauthorized: You can only update tasks assigned to your account.',
      };
    }

    // Status transition checks
    if (assignment.status === 'picked_up') {
      return { success: false, error: 'Food has already been marked as picked up.' };
    }
    if (assignment.status === 'delivered') {
      return { success: false, error: 'Cannot pick up a task that has already been delivered.' };
    }
    if (assignment.status === 'cancelled') {
      return { success: false, error: 'Cannot pick up a cancelled task.' };
    }
    if (assignment.status !== 'assigned' && assignment.status !== 'in_transit_to_pickup') {
      return {
        success: false,
        error: `Cannot mark picked up from status ${assignment.status}.`,
      };
    }

    const donation = mockDataService.getDonationById(assignment.donationId);
    if (!donation) {
      return { success: false, error: 'Associated donation record not found.' };
    }
    if (donation.status !== 'VOLUNTEER_ASSIGNED') {
      return {
        success: false,
        error: `Donation must be in VOLUNTEER_ASSIGNED status to confirm pickup (current status: ${donation.status}).`,
      };
    }

    const nowIso = new Date().toISOString();

    const updatedAssignment: Assignment = {
      ...assignment,
      status: 'picked_up',
      pickedUpAt: nowIso,
      pickup: {
        ...assignment.pickup,
        actualPickupTime: nowIso,
      },
      notes: notes
        ? `${assignment.notes || ''} | Pickup Note: ${notes}`.trim()
        : assignment.notes,
    };

    const updatedDonation: Donation = {
      ...donation,
      status: 'PICKED_UP',
      updatedAt: nowIso,
    };

    const currentAssignments = loadPersisted<Assignment>(UPDATED_ASSIGNMENTS_KEY).filter(
      (a) => a.id !== assignmentId
    );
    savePersisted<Assignment>(UPDATED_ASSIGNMENTS_KEY, [...currentAssignments, updatedAssignment]);

    const currentDonations = loadPersisted<Donation>(UPDATED_DONATIONS_KEY).filter(
      (d) => d.id !== donation.id
    );
    savePersisted<Donation>(UPDATED_DONATIONS_KEY, [...currentDonations, updatedDonation]);

    return { success: true, assignment: updatedAssignment, donation: updatedDonation };
  },

  /**
   * Action function for a volunteer to mark food as delivered to the destination NGO.
   */
  deliverAssignment: (
    assignmentId: string,
    volunteerUserIdOrId: string,
    deliveryNotes?: string
  ): AssignmentActionResult => {
    const user = mockDataService.getUserById(volunteerUserIdOrId);
    if (user && user.role !== 'volunteer') {
      return {
        success: false,
        error: 'Unauthorized: Only accounts with the volunteer role may mark tasks as delivered.',
      };
    }

    const volunteer =
      mockDataService.getVolunteerById(volunteerUserIdOrId) ||
      mockDataService.getVolunteerByUserId(volunteerUserIdOrId);

    if (!volunteer) {
      return { success: false, error: 'Volunteer record not found for this account.' };
    }

    const assignment = mockDataService.getAssignmentById(assignmentId);
    if (!assignment) {
      return { success: false, error: 'Assignment task record not found.' };
    }

    // Ownership check
    if (assignment.volunteerId !== volunteer.id) {
      return {
        success: false,
        error: 'Unauthorized: You can only update tasks assigned to your account.',
      };
    }

    if (assignment.status === 'delivered') {
      return { success: false, error: 'This task has already been marked as delivered.' };
    }
    if (assignment.status === 'cancelled') {
      return { success: false, error: 'Cannot deliver a cancelled task.' };
    }
    if (assignment.status === 'assigned' || assignment.status === 'in_transit_to_pickup') {
      return {
        success: false,
        error: 'Delivery cannot occur before food has been picked up from donor.',
      };
    }
    if (assignment.status !== 'picked_up' && assignment.status !== 'in_transit_to_drop') {
      return {
        success: false,
        error: `Cannot mark delivered from current status ${assignment.status}.`,
      };
    }

    const donation = mockDataService.getDonationById(assignment.donationId);
    if (!donation) {
      return { success: false, error: 'Associated donation record not found.' };
    }
    if (donation.status !== 'PICKED_UP') {
      return {
        success: false,
        error: `Donation must be in PICKED_UP status to confirm delivery (current status: ${donation.status}).`,
      };
    }

    const nowIso = new Date().toISOString();

    const updatedAssignment: Assignment = {
      ...assignment,
      status: 'delivered',
      deliveredAt: nowIso,
      delivery: {
        ...assignment.delivery,
        actualDeliveryTime: nowIso,
      },
      notes: deliveryNotes
        ? `${assignment.notes || ''} | Delivery Note: ${deliveryNotes}`.trim()
        : assignment.notes,
    };

    // Donation status transitions to DELIVERED (NGO confirms receipt separately)
    const updatedDonation: Donation = {
      ...donation,
      status: 'DELIVERED',
      updatedAt: nowIso,
    };

    // Increment volunteer's completed deliveries
    const updatedVolunteer: Volunteer = {
      ...volunteer,
      totalDeliveriesCompleted: (volunteer.totalDeliveriesCompleted || 0) + 1,
    };
    const currentVolunteers = loadPersisted<Volunteer>(UPDATED_VOLUNTEERS_KEY).filter(
      (v) => v.id !== volunteer.id
    );
    savePersisted<Volunteer>(UPDATED_VOLUNTEERS_KEY, [...currentVolunteers, updatedVolunteer]);

    const currentAssignments = loadPersisted<Assignment>(UPDATED_ASSIGNMENTS_KEY).filter(
      (a) => a.id !== assignmentId
    );
    savePersisted<Assignment>(UPDATED_ASSIGNMENTS_KEY, [...currentAssignments, updatedAssignment]);

    const currentDonations = loadPersisted<Donation>(UPDATED_DONATIONS_KEY).filter(
      (d) => d.id !== donation.id
    );
    savePersisted<Donation>(UPDATED_DONATIONS_KEY, [...currentDonations, updatedDonation]);

    return { success: true, assignment: updatedAssignment, donation: updatedDonation };
  },

  /**
   * Returns completed delivery history for a volunteer.
   */
  getVolunteerDeliveryHistory: (volunteerUserIdOrId: string): Assignment[] => {
    const volunteer =
      mockDataService.getVolunteerById(volunteerUserIdOrId) ||
      mockDataService.getVolunteerByUserId(volunteerUserIdOrId);
    if (!volunteer) return [];

    return mockDataService
      .getAssignments()
      .filter((a) => a.volunteerId === volunteer.id && a.status === 'delivered')
      .sort((a, b) => {
        const timeA = a.deliveredAt ? new Date(a.deliveredAt).getTime() : 0;
        const timeB = b.deliveredAt ? new Date(b.deliveredAt).getTime() : 0;
        return timeB - timeA;
      });
  },

  /**
   * Returns dynamically calculated dashboard statistics for a volunteer.
   */
  getVolunteerDashboardStats: (volunteerUserIdOrId: string): VolunteerDashboardStats => {
    const volunteer =
      mockDataService.getVolunteerById(volunteerUserIdOrId) ||
      mockDataService.getVolunteerByUserId(volunteerUserIdOrId);

    if (!volunteer) {
      return {
        availableTasksCount: 0,
        activeTasksCount: 0,
        completedTasksCount: 0,
        totalMealsDelivered: 0,
        recentAssignments: [],
        statusDistribution: [],
      };
    }

    const availableTasks = mockDataService.getAvailableAssignments();
    const myAssignments = mockDataService
      .getAssignments()
      .filter((a) => a.volunteerId === volunteer.id);

    const activeTasks = myAssignments.filter((a) =>
      ['assigned', 'in_transit_to_pickup', 'picked_up', 'in_transit_to_drop'].includes(a.status)
    );
    const completedTasks = myAssignments.filter((a) => a.status === 'delivered');

    // Calculate meals delivered from unique completed deliveries
    const completedDonationIds = new Set(completedTasks.map((a) => a.donationId));
    const allDonations = mockDataService.getDonations();
    const totalMeals = Array.from(completedDonationIds).reduce((sum, donId) => {
      const donation = allDonations.find((d) => d.id === donId);
      return sum + (donation ? donation.numberOfServings || donation.quantity || 0 : 0);
    }, 0);

    // Status distribution
    const statusMap = new Map<AssignmentStatus, number>();
    myAssignments.forEach((a) => {
      statusMap.set(a.status, (statusMap.get(a.status) || 0) + 1);
    });
    const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    const recentAssignments = [...myAssignments].sort((a, b) => {
      const timeA = new Date(a.assignedAt || 0).getTime();
      const timeB = new Date(b.assignedAt || 0).getTime();
      return timeB - timeA;
    });

    return {
      availableTasksCount: availableTasks.length,
      activeTasksCount: activeTasks.length,
      completedTasksCount: completedTasks.length,
      totalMealsDelivered: totalMeals,
      recentAssignments,
      statusDistribution,
    };
  },

  // ─── Notifications ──────────────────────────────────────────────────
  getNotifications: (): Notification[] => [...staticNotifications],
  getNotificationsByUser: (userId: string): Notification[] =>
    staticNotifications.filter((n) => n.recipientId === userId),
  getNotificationsByStatus: (userId: string, status: NotificationStatus): Notification[] =>
    staticNotifications.filter((n) => n.recipientId === userId && n.status === status),

  // ─── Dashboard Stats ────────────────────────────────────────────────
  getDashboardStats: (role: UserRole): DashboardStats => {
    return staticDashboardStats[role] ?? staticDashboardStats.donor;
  },

  // ─── Admin Management & Audit Logs ──────────────────────────────────
  getAdminActivityLogs: (): AdminActivityLogEntry[] => {
    return loadPersisted<AdminActivityLogEntry>(ADMIN_ACTIVITY_LOG_KEY).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  logAdminActivity: (
    entry: Omit<AdminActivityLogEntry, 'id' | 'timestamp'>
  ): AdminActivityLogEntry => {
    const logs = loadPersisted<AdminActivityLogEntry>(ADMIN_ACTIVITY_LOG_KEY);
    const newEntry: AdminActivityLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    savePersisted<AdminActivityLogEntry>(ADMIN_ACTIVITY_LOG_KEY, [newEntry, ...logs]);
    return newEntry;
  },

  /**
   * Returns platform-wide dashboard metrics calculated dynamically from actual mock records.
   */
  getAdminDashboardStats: (): AdminDashboardStats => {
    const allUsers = mockDataService.getUsers();
    const allNgos = mockDataService.getNGOs();
    const allVolunteers = mockDataService.getVolunteers();
    const allDonations = mockDataService.getDonations();
    const allAssignments = mockDataService.getAssignments();

    const donors = allUsers.filter((u) => u.role === 'donor');
    const verifiedNgos = allNgos.filter((n) => n.verificationStatus === 'verified');
    const pendingNgos = allNgos.filter((n) => n.verificationStatus === 'pending');
    const rejectedNgos = allNgos.filter((n) => n.verificationStatus === 'rejected');

    const availableDonations = allDonations.filter(
      (d) => d.status === 'CREATED' || d.status === 'NGO_MATCHED'
    );
    const acceptedDonations = allDonations.filter((d) => d.status === 'NGO_ACCEPTED');
    const activeDeliveries = allAssignments.filter((a) =>
      ['assigned', 'in_transit_to_pickup', 'picked_up', 'in_transit_to_drop'].includes(a.status)
    );
    const completedDeliveries = allAssignments.filter((a) => a.status === 'delivered');
    const receiptConfirmed = allDonations.filter((d) => d.status === 'RECEIPT_CONFIRMED');
    const cancelledDonations = allDonations.filter((d) => d.status === 'CANCELLED');

    // Donation status distribution
    const statusMap = new Map<DonationStatus, number>();
    allDonations.forEach((d) => {
      statusMap.set(d.status, (statusMap.get(d.status) || 0) + 1);
    });
    const donationStatusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    // User role distribution
    const roleMap = new Map<string, number>();
    allUsers.forEach((u) => {
      roleMap.set(u.role, (roleMap.get(u.role) || 0) + 1);
    });
    const userRoleDistribution = Array.from(roleMap.entries()).map(([role, count]) => ({
      role,
      count,
    }));

    // Food category distribution
    const catMap = new Map<FoodCategory, { count: number; totalQuantity: number }>();
    allDonations.forEach((d) => {
      const prev = catMap.get(d.category) || { count: 0, totalQuantity: 0 };
      catMap.set(d.category, {
        count: prev.count + 1,
        totalQuantity: prev.totalQuantity + (d.quantity || 0),
      });
    });
    const foodCategoryDistribution = Array.from(catMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      totalQuantity: data.totalQuantity,
    }));

    // NGO verification status distribution
    const ngoVerifMap = new Map<string, number>();
    allNgos.forEach((n) => {
      ngoVerifMap.set(n.verificationStatus, (ngoVerifMap.get(n.verificationStatus) || 0) + 1);
    });
    const ngoVerificationDistribution = Array.from(ngoVerifMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    const recentDonations = [...allDonations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);

    const recentUsers = [...allUsers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      }));

    return {
      totalUsers: allUsers.length,
      totalDonors: donors.length,
      totalNGOs: allNgos.length,
      verifiedNGOs: verifiedNgos.length,
      pendingNGOs: pendingNgos.length,
      rejectedNGOs: rejectedNgos.length,
      totalVolunteers: allVolunteers.length,
      totalDonations: allDonations.length,
      availableDonations: availableDonations.length,
      acceptedDonations: acceptedDonations.length,
      activeDeliveries: activeDeliveries.length,
      completedDeliveries: completedDeliveries.length,
      receiptConfirmedDonations: receiptConfirmed.length,
      cancelledDonations: cancelledDonations.length,
      donationStatusDistribution,
      userRoleDistribution,
      foodCategoryDistribution,
      ngoVerificationDistribution,
      recentDonations,
      recentUsers,
    };
  },
};
