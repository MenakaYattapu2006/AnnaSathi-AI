import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DashboardStatCard } from '../../components/common/DashboardStatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { NGODonationDetailsModal } from '../../components/ngo/NGODonationDetailsModal';
import {
  Search,
  CheckCircle2,
  Package,
  Users,
  AlertTriangle,
  ShieldCheck,
  XCircle,
  Truck,
  ArrowRight,
  Clock,
  MapPin,
  Utensils,
  Eye,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, mapNgoFromDb, mapDonationFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import type { NGO } from '../../types/ngo';
import type { Donation, DonationStatus, FoodCategory } from '../../types/donation';

const isProduction = Boolean((import.meta as any).env?.PROD);

const statusBadgeMap: Record<
  DonationStatus,
  { variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; label: string }
> = {
  CREATED: { variant: 'neutral', label: 'Created' },
  NGO_MATCHED: { variant: 'info', label: 'Matched' },
  NGO_ACCEPTED: { variant: 'success', label: 'Accepted' },
  VOLUNTEER_ASSIGNED: { variant: 'info', label: 'Volunteer Assigned' },
  PICKED_UP: { variant: 'warning', label: 'In Transit' },
  DELIVERED: { variant: 'success', label: 'Delivered' },
  RECEIPT_CONFIRMED: { variant: 'success', label: 'Receipt Confirmed' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
};

const NGODashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ngo, setNgo] = useState<NGO | undefined>(undefined);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [stats, setStats] = useState({
    availableDonationsCount: 0,
    acceptedDonationsCount: 0,
    activeVolunteerAssignmentsCount: 0,
    completedDeliveriesCount: 0,
    receiptConfirmedCount: 0,
    totalMealsReceived: 0,
    categoryDistribution: [] as { category: FoodCategory; count: number; totalQuantity: number; unit: string }[],
    recentDonations: [] as Donation[],
  });
  const [isLoading, setIsLoading] = useState(true);

  const verificationStatus =
    ngo?.verificationStatus ||
    (user as any)?.ngo?.verification_status?.toLowerCase() ||
    (user as any)?.verificationStatus ||
    'pending';

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      let currentNgo: NGO | undefined = undefined;
      try {
        const ngoRes = await apiClient.ngo.getMe().catch(() => null);
        if (ngoRes?.ngo && isMounted) {
          currentNgo = mapNgoFromDb(ngoRes.ngo);
          setNgo(currentNgo);
        } else if ((user as any)?.ngo && isMounted) {
          currentNgo = mapNgoFromDb((user as any).ngo);
          setNgo(currentNgo);
        }

        const [availRes, acceptedRes] = await Promise.all([
          apiClient.ngo.getAvailableDonations().catch(() => ({ donations: [] })),
          apiClient.ngo.getAcceptedDonations().catch(() => ({ donations: [] })),
        ]);

        if (isMounted && acceptedRes?.donations) {
          const acceptedList: Donation[] = acceptedRes.donations.map(mapDonationFromDb);
          const availCount = (availRes?.donations || []).length;
          const activeVolCount = acceptedList.filter(
            (d) => d.status === 'VOLUNTEER_ASSIGNED' || d.status === 'PICKED_UP'
          ).length;
          const completedCount = acceptedList.filter((d) => d.status === 'DELIVERED').length;
          const confirmedCount = acceptedList.filter((d) => d.status === 'RECEIPT_CONFIRMED').length;
          const totalMeals = acceptedList
            .filter((d) => d.status === 'DELIVERED' || d.status === 'RECEIPT_CONFIRMED')
            .reduce((sum, d) => sum + (d.numberOfServings || (d.unit === 'meals' ? d.quantity : d.quantity * 2)), 0);

          const categoryMap: Record<string, { category: FoodCategory; count: number; totalQuantity: number; unit: string }> = {};
          acceptedList.forEach((d) => {
            if (!categoryMap[d.category]) {
              categoryMap[d.category] = { category: d.category, count: 0, totalQuantity: 0, unit: d.unit };
            }
            categoryMap[d.category].count += 1;
            categoryMap[d.category].totalQuantity += Number(d.quantity);
          });

          setStats({
            availableDonationsCount: availCount,
            acceptedDonationsCount: acceptedList.length,
            activeVolunteerAssignmentsCount: activeVolCount,
            completedDeliveriesCount: completedCount,
            receiptConfirmedCount: confirmedCount,
            totalMealsReceived: totalMeals,
            categoryDistribution: Object.values(categoryMap),
            recentDonations: acceptedList.slice(0, 5),
          });
          setIsLoading(false);
          return;
        }
      } catch {
        if (isProduction) {
          if (isMounted) setIsLoading(false);
          return;
        }
      }

      if (!currentNgo && user && isMounted) {
        const mockNgo = mockDataService.getNGOByUserId(user.id);
        if (mockNgo) setNgo(mockNgo);
        setStats(mockDataService.getNGODashboardStats(user.id));
      }
      if (isMounted) setIsLoading(false);
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const orgDisplayName =
    ngo?.organizationName || user?.profile?.organizationName || user?.name || 'Partner Organization';

  return (
    <div className="space-y-6">
      {/* Header and Verification Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader
          title="NGO Dashboard"
          description={`Welcome back, ${orgDisplayName}`}
          className="mb-0"
        />
        <div className="flex items-center gap-2">
          {verificationStatus === 'verified' && (
            <Badge variant="success" size="md" className="flex items-center gap-1.5 px-3 py-1.5 font-medium">
              <ShieldCheck size={16} />
              <span>Verified Organization</span>
            </Badge>
          )}
          {verificationStatus === 'pending' && (
            <Badge variant="warning" size="md" className="flex items-center gap-1.5 px-3 py-1.5 font-medium">
              <AlertTriangle size={16} />
              <span>Verification Pending</span>
            </Badge>
          )}
          {verificationStatus === 'rejected' && (
            <Badge variant="danger" size="md" className="flex items-center gap-1.5 px-3 py-1.5 font-medium">
              <XCircle size={16} />
              <span>Verification Rejected</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Verification Status Notice Banners */}
      {verificationStatus === 'pending' && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-warning flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h2 className="text-sm font-semibold text-primary-text">Documentation Under Review</h2>
            <p className="text-sm text-secondary-text mt-0.5">
              Your NGO registration documents are currently pending verification by platform administrators.
              You can browse available food listings, but claiming food donations is disabled at the service level until your organization is verified.
            </p>
          </div>
        </div>
      )}

      {verificationStatus === 'rejected' && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="text-danger flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h2 className="text-sm font-semibold text-primary-text">Verification Application Rejected</h2>
            <p className="text-sm text-secondary-text mt-0.5">
              Reason: {ngo?.rejectionReason || 'Registration credentials could not be authenticated.'} Please submit revised registration documents to platform administrators.
            </p>
          </div>
        </div>
      )}

      {verificationStatus === 'verified' && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-start gap-3">
          <ShieldCheck className="text-success flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h2 className="text-sm font-semibold text-primary-text">Verified Partner Organization</h2>
            <p className="text-sm text-secondary-text mt-0.5">
              Your organization is verified to claim surplus food donations, coordinate volunteer pickups, and confirm distribution receipts.
            </p>
          </div>
        </div>
      )}

      {/* Dynamic KPI Cards Calculated from Actual Mock Records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Available to Claim"
          value={stats.availableDonationsCount}
          icon={<Search size={24} />}
          description={
            stats.availableDonationsCount > 0
              ? `${stats.availableDonationsCount} active surplus listing${stats.availableDonationsCount === 1 ? '' : 's'}`
              : 'No listings currently open'
          }
          badgeVariant="info"
        />
        <DashboardStatCard
          title="Active in Pipeline"
          value={stats.acceptedDonationsCount}
          icon={<CheckCircle2 size={24} />}
          description="Accepted, awaiting or in transit"
          badgeVariant="success"
        />
        <DashboardStatCard
          title="Active Volunteer Runs"
          value={stats.activeVolunteerAssignmentsCount}
          icon={<Truck size={24} />}
          description="Dispatches assigned or en route"
          badgeVariant="info"
        />
        <DashboardStatCard
          title="Meals Received"
          value={stats.totalMealsReceived.toLocaleString()}
          icon={<Package size={24} />}
          description={`${stats.completedDeliveriesCount} completed deliveries (${stats.receiptConfirmedCount} confirmed)`}
          badgeVariant="success"
        />
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/ngo/available')}
          className="flex items-center gap-1.5"
        >
          <Search size={16} />
          <span>Browse Available Food ({stats.availableDonationsCount})</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/ngo/accepted')}
          className="flex items-center gap-1.5"
        >
          <CheckCircle2 size={16} />
          <span>View Accepted Donations ({stats.acceptedDonationsCount})</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/ngo/history')}
          className="flex items-center gap-1.5"
        >
          <FileCheck size={16} />
          <span>Collection History ({stats.completedDeliveriesCount})</span>
        </Button>
      </div>

      {/* Main Content Grid: Recent Activity & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-base text-primary-text">Recent Organization Activity</h3>
                <p className="text-xs text-secondary-text">
                  Recent donations claimed, in transit, or received by {orgDisplayName}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/ngo/accepted')}
                className="text-xs"
              >
                <span>View All</span>
                <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>

            {stats.recentDonations.length === 0 ? (
              <EmptyState
                icon={<Utensils size={40} className="text-secondary-text" />}
                title="No recent donation activity"
                description="Your organization has not claimed or received any donations yet. Browse available food listings to get started."
                action={{
                  label: 'Browse Available Food',
                  onClick: () => navigate('/ngo/available'),
                }}
              />
            ) : (
              <div className="space-y-3">
                {stats.recentDonations.slice(0, 5).map((donation) => {
                  const conf = statusBadgeMap[donation.status] || {
                    variant: 'neutral',
                    label: donation.status,
                  };
                  return (
                    <div
                      key={donation.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-surface-container-low rounded-lg border border-border/60 hover:border-border transition-colors gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-primary-text">
                            {donation.foodName}
                          </span>
                          <Badge variant={conf.variant} size="sm">
                            {conf.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary-text">
                          <span className="font-medium text-primary">
                            {donation.quantity} {donation.unit}
                            {donation.numberOfServings ? ` (~${donation.numberOfServings} servings)` : ''}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {donation.pickupAddress.street}, {donation.pickupAddress.city}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(donation.updatedAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDonation(donation)}
                        className="text-xs self-end sm:self-center"
                      >
                        <Eye size={14} className="mr-1" />
                        Details
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Category Distribution & Capacity */}
        <div className="space-y-6">
          {/* Category Distribution Card */}
          <Card className="p-5">
            <h3 className="font-bold text-base text-primary-text mb-1">Food Category Distribution</h3>
            <p className="text-xs text-secondary-text mb-4">
              Breakdown of surplus food types claimed by your organization
            </p>

            {stats.categoryDistribution.length === 0 ? (
              <p className="text-xs text-secondary-text text-center py-6">
                No category data available yet.
              </p>
            ) : (
              <div className="space-y-3.5">
                {(() => {
                  const totalCategoryCount =
                    stats.categoryDistribution.reduce((acc, c) => acc + c.count, 0) || 1;
                  return stats.categoryDistribution.map((item) => {
                    const percentage = Math.min(
                      100,
                      Math.round((item.count / totalCategoryCount) * 100)
                    );
                    return (
                      <div key={item.category} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-primary-text capitalize">
                            {item.category.replace(/_/g, ' ')}
                          </span>
                          <span className="text-secondary-text">
                            {item.count} listing{item.count === 1 ? '' : 's'} ({item.totalQuantity}{' '}
                            {item.unit})
                          </span>
                        </div>
                        <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </Card>

          {/* Operational Capacity Card */}
          <Card className="p-5">
            <h3 className="font-bold text-base text-primary-text mb-1">Operational Capacity</h3>
            <p className="text-xs text-secondary-text mb-4">
              Registered distribution capacity
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-xs text-secondary-text">Daily Meal Capacity</span>
                <span className="font-bold text-primary">
                  {ngo?.capacity?.maxDailyMeals || 300} meals/day
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-xs text-secondary-text">Cold Storage Facility</span>
                <span className="font-medium text-primary-text text-xs">
                  {ngo?.capacity?.hasColdStorage ? 'Available On-site' : 'No Cold Storage'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-secondary-text">Service Areas</span>
                <span className="font-medium text-primary-text text-xs text-right max-w-[160px] truncate">
                  {ngo?.serviceArea?.join(', ') || 'Hyderabad'}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4 text-xs"
              onClick={() => navigate('/ngo/profile')}
            >
              Manage Organization Profile
            </Button>
          </Card>
        </div>
      </div>

      {/* Donation Details Modal */}
      <NGODonationDetailsModal
        donation={selectedDonation}
        ngo={ngo}
        isOpen={!!selectedDonation}
        onClose={() => setSelectedDonation(null)}
      />
    </div>
  );
};

export default NGODashboard;



