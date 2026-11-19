import { UserRole } from './user';
import { FoodCategory, DonationStatus, Donation } from './donation';
import { Assignment, AssignmentStatus } from './assignment';

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface ImpactStats {
  mealsRescued: number;
  co2PreventedKg: number;
  waterSavedLiters: number;
  beneficiariesServed: number;
}

export interface DonationSummary {
  category: FoodCategory;
  count: number;
  totalQuantity: number;
  unit: string;
}

export interface DashboardStats {
  role: UserRole;
  primaryStats: {
    totalCount: number;
    activeCount: number;
    completedCount: number;
    pendingCount: number;
  };
  impact: ImpactStats;
  recentTrends: {
    monthlyActivity: ChartDataPoint[];
    donationsByCategory: DonationSummary[];
    statusBreakdown: Record<DonationStatus, number>;
  };
  lastUpdated: string;
}

export interface NGODashboardStats {
  availableDonationsCount: number;
  acceptedDonationsCount: number;
  activeVolunteerAssignmentsCount: number;
  completedDeliveriesCount: number;
  receiptConfirmedCount: number;
  totalMealsReceived: number;
  categoryDistribution: { category: FoodCategory; count: number; totalQuantity: number; unit: string }[];
  recentDonations: Donation[];
}

export interface VolunteerDashboardStats {
  availableTasksCount: number;
  activeTasksCount: number;
  completedTasksCount: number;
  totalMealsDelivered: number;
  recentAssignments: Assignment[];
  statusDistribution: { status: AssignmentStatus; count: number }[];
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalDonors: number;
  totalNGOs: number;
  verifiedNGOs: number;
  pendingNGOs: number;
  rejectedNGOs: number;
  totalVolunteers: number;
  totalDonations: number;
  availableDonations: number;
  acceptedDonations: number;
  activeDeliveries: number;
  completedDeliveries: number;
  receiptConfirmedDonations: number;
  cancelledDonations: number;
  donationStatusDistribution: { status: DonationStatus; count: number }[];
  userRoleDistribution: { role: string; count: number }[];
  foodCategoryDistribution: { category: FoodCategory; count: number; totalQuantity: number }[];
  ngoVerificationDistribution: { status: string; count: number }[];
  recentDonations: Donation[];
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[];
}

/**
 * Admin activity log entry for audit tracking.
 * Demonstration-only persistence — not a production audit trail.
 */
export type AdminActionType =
  | 'ngo_verified'
  | 'ngo_rejected'
  | 'user_activated'
  | 'user_deactivated'
  | 'donation_cancelled'
  | 'admin_action';

export interface AdminActivityLogEntry {
  id: string;
  actionType: AdminActionType;
  adminId: string;
  targetId: string;
  targetType: 'user' | 'ngo' | 'donation' | 'assignment';
  description: string;
  timestamp: string;
}
