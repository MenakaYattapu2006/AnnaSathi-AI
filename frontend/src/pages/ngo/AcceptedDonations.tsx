import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { NGODonationDetailsModal } from '../../components/ngo/NGODonationDetailsModal';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Truck,
  Eye,
  Search,
  User,
  X,
  FileCheck,
  AlertCircle,
  PackageCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, mapDonationFromDb, mapNgoFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import { Loading } from '../../components/common/Loading';
import type { NGO } from '../../types/ngo';
import type { Donation, DonationStatus } from '../../types/donation';

const isProduction = Boolean((import.meta as any).env?.PROD);

const statusBadgeMap: Record<
  DonationStatus,
  { variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; label: string }
> = {
  CREATED: { variant: 'neutral', label: 'Created' },
  NGO_MATCHED: { variant: 'info', label: 'Matched' },
  NGO_ACCEPTED: { variant: 'info', label: 'Accepted (Awaiting Volunteer)' },
  VOLUNTEER_ASSIGNED: { variant: 'info', label: 'Volunteer Assigned' },
  PICKED_UP: { variant: 'warning', label: 'In Transit to Shelter' },
  DELIVERED: { variant: 'success', label: 'Delivered' },
  RECEIPT_CONFIRMED: { variant: 'success', label: 'Receipt Confirmed' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
};

const AcceptedDonations: React.FC = () => {
  const { user } = useAuth();
  const [ngo, setNgo] = useState<NGO | undefined>(undefined);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'urgency'>('newest');

  const refreshDonations = async () => {
    setIsLoading(true);
    try {
      const [ngoRes, response] = await Promise.all([
        apiClient.ngo.getMe().catch(() => null),
        apiClient.ngo.getAcceptedDonations(),
      ]);

      if (ngoRes?.ngo) {
        setNgo(mapNgoFromDb(ngoRes.ngo));
      }
      if (response?.donations) {
        setDonations(response.donations.map(mapDonationFromDb));
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      if (isProduction) {
        setFeedback({ type: 'error', message: err.message || 'Failed to load accepted donations from server.' });
        setIsLoading(false);
        return;
      }
    }

    if (user) {
      setNgo(mockDataService.getNGOByUserId(user.id));
      setDonations(mockDataService.getAcceptedDonationsForNGO(user.id));
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    refreshDonations();
  }, [user]);

  const handleConfirmReceipt = async (donationId: string, notes?: string) => {
    if (!user) return;
    setFeedback(null);

    try {
      try {
        const response = await apiClient.ngo.confirmReceipt(donationId, notes);
        if (response?.success) {
          setFeedback({
            type: 'success',
            message: `Successfully confirmed receipt! Donation has been recorded in distribution history.`,
          });
          refreshDonations();
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setFeedback({ type: 'error', message: apiErr.message || 'Server error: Failed to confirm receipt.' });
          return;
        }
      }

      const result = mockDataService.confirmDonationReceipt(donationId, user.id, notes);
      if (!result.success) {
        setFeedback({ type: 'error', message: result.error || 'Failed to confirm receipt.' });
      } else {
        setFeedback({
          type: 'success',
          message: `Successfully confirmed receipt of "${result.donation?.foodName}". Receipt has been recorded in distribution history.`,
        });
        refreshDonations();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to confirm receipt.' });
    }
  };

  // Filter and sort accepted donations
  const filteredDonations = useMemo(() => {
    return donations
      .filter((d) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = d.foodName.toLowerCase().includes(q);
          const matchLocation = `${d.pickupAddress.street} ${d.pickupAddress.city}`
            .toLowerCase()
            .includes(q);
          const donor = mockDataService.getUserById(d.donorId);
          const matchDonor = donor?.name?.toLowerCase().includes(q) || false;
          if (!matchName && !matchLocation && !matchDonor) return false;
        }

        if (statusFilter !== 'all' && d.status !== statusFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        if (sortBy === 'urgency') {
          return b.urgencyScore - a.urgencyScore;
        }
        return 0;
      });
  }, [donations, searchQuery, statusFilter, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accepted Donations"
        description="Donation listings claimed by your organization currently in logistics or delivery"
      />

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-start justify-between gap-3 border ${
            feedback.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-danger/10 border-danger/30 text-danger'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-medium">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-current hover:opacity-75 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search and Status Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text"
            />
            <input
              type="text"
              placeholder="Search by food name, location, donor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="NGO_ACCEPTED">Accepted (Awaiting Volunteer)</option>
              <option value="VOLUNTEER_ASSIGNED">Volunteer Assigned</option>
              <option value="PICKED_UP">In Transit</option>
              <option value="DELIVERED">Delivered (Pending Receipt Confirmation)</option>
              <option value="RECEIPT_CONFIRMED">Receipt Confirmed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="newest">Sort by Recently Updated</option>
              <option value="urgency">Sort by Urgency Score</option>
            </select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="text-xs px-2.5 py-2 flex-shrink-0"
                title="Clear filters"
              >
                <X size={14} />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* List of Accepted Donations */}
      {isLoading ? (
        <Card className="p-12">
          <Loading message="Loading accepted food donations from server..." />
        </Card>
      ) : filteredDonations.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<PackageCheck size={48} className="text-secondary-text" />}
            title={hasActiveFilters ? 'No accepted donations match your filters' : 'No accepted donations yet'}
            description={
              hasActiveFilters
                ? 'Try clearing your search query or status filter to view all accepted records.'
                : 'Browse Available Donations to claim food surplus for your community kitchen or shelter.'
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDonations.map((donation) => {
            const donor = mockDataService.getUserById(donation.donorId);
            const assignment = mockDataService.getAssignmentByDonationId(donation.id);
            const volunteer = assignment
              ? mockDataService.getVolunteerById(assignment.volunteerId)
              : undefined;

            const conf = statusBadgeMap[donation.status] || {
              variant: 'neutral',
              label: donation.status,
            };

            const canConfirmReceipt = donation.status === 'DELIVERED';

            return (
              <Card key={donation.id} className="p-5 border border-border hover:border-primary/40 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Side: Food & Donor Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-base text-primary-text">
                        {donation.foodName}
                      </h3>
                      <Badge variant={conf.variant} size="sm">
                        {conf.label}
                      </Badge>
                      <Badge variant="neutral" size="sm" className="capitalize">
                        {donation.category.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1.5 gap-x-4 text-xs text-secondary-text">
                      <div>
                        <span className="block text-secondary-text/80">Quantity:</span>
                        <span className="font-bold text-primary text-sm">
                          {donation.quantity} {donation.unit}
                          {donation.numberOfServings ? ` (~${donation.numberOfServings} servings)` : ''}
                        </span>
                      </div>

                      <div>
                        <span className="block text-secondary-text/80">Donor:</span>
                        <span className="font-medium text-primary-text flex items-center gap-1">
                          <User size={13} className="text-secondary-text" />
                          {donation.donorOrganization || donation.donorName || donor?.profile?.organizationName || donor?.name || 'Food Donor'}
                        </span>
                      </div>

                      <div>
                        <span className="block text-secondary-text/80">Pickup Address:</span>
                        <span className="font-medium text-primary-text flex items-center gap-1 truncate">
                          <MapPin size={13} className="text-primary flex-shrink-0" />
                          {donation.pickupAddress.street}, {donation.pickupAddress.city}
                        </span>
                      </div>
                    </div>

                    {/* Volunteer Assignment Info Box */}
                    <div className="mt-2 p-2.5 bg-surface-container-low rounded-md flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Truck size={15} className="text-primary flex-shrink-0" />
                        {donation.volunteerName || volunteer ? (
                          <span>
                            Volunteer: <strong>{donation.volunteerName || volunteer?.name}</strong>{' '}
                            {donation.volunteerPhone || volunteer?.phone ? `(${donation.volunteerPhone || volunteer?.phone})` : ''}
                            {volunteer?.vehicleType && ` • Vehicle: ${volunteer.vehicleType}`}
                          </span>
                        ) : donation.status === 'RECEIPT_CONFIRMED' || donation.status === 'DELIVERED' ? (
                          <span className="text-emerald-700 font-medium">
                            ✓ Food rescue transport fulfilled &amp; received
                          </span>
                        ) : (
                          <span className="text-secondary-text italic">
                            Awaiting volunteer assignment for shelter transport
                          </span>
                        )}
                      </div>
                      <span className="text-secondary-text text-[11px]">
                        Updated {new Date(donation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Action Buttons */}
                  <div className="flex sm:flex-row lg:flex-col items-end justify-end gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDonation(donation)}
                      className="text-xs w-full sm:w-auto"
                    >
                      <Eye size={14} className="mr-1" />
                      View Details
                    </Button>

                    {canConfirmReceipt && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedDonation(donation)}
                        className="text-xs w-full sm:w-auto"
                      >
                        <FileCheck size={14} className="mr-1" />
                        Confirm Receipt
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <NGODonationDetailsModal
        donation={selectedDonation}
        ngo={ngo}
        isOpen={!!selectedDonation}
        onClose={() => setSelectedDonation(null)}
        onConfirmReceipt={handleConfirmReceipt}
      />
    </div>
  );
};

export default AcceptedDonations;



