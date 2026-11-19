import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { NGODonationDetailsModal } from '../../components/ngo/NGODonationDetailsModal';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Clock,
  Calendar,
  Eye,
  Filter,
  XCircle,
  X,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, mapDonationFromDb, mapNgoFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import { Loading } from '../../components/common/Loading';
import type { NGO } from '../../types/ngo';
import type { Donation, FoodCategory, UrgencyLevel } from '../../types/donation';

const isProduction = Boolean((import.meta as any).env?.PROD);

const AvailableDonations: React.FC = () => {
  const { user } = useAuth();
  const [ngo, setNgo] = useState<NGO | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const verificationStatus = ngo?.verificationStatus || 'pending';
  const isVerified = verificationStatus === 'verified';
  const isPending = verificationStatus === 'pending';
  const isRejected = verificationStatus === 'rejected';

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'urgency' | 'newest' | 'expiry'>('urgency');

  const refreshDonations = async () => {
    setIsLoading(true);
    try {
      const ngoRes = await apiClient.ngo.getMe().catch(() => null);
      if (ngoRes?.ngo) {
        setNgo(mapNgoFromDb(ngoRes.ngo));
      }

      const donRes = await apiClient.ngo.getAvailableDonations();
      if (donRes?.donations) {
        setDonations(donRes.donations.map(mapDonationFromDb));
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      if (isProduction) {
        setFeedback({ type: 'error', message: err.message || 'Failed to load donations from server.' });
        setIsLoading(false);
        return;
      }
    }

    if (user) {
      setNgo(mockDataService.getNGOByUserId(user.id) || null);
      setDonations(mockDataService.getAvailableDonationsForNGO(user.id));
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    refreshDonations();
  }, [user]);

  const handleAcceptDonation = async (donationId: string) => {
    if (!user) return;
    setFeedback(null);

    try {
      try {
        const response = await apiClient.ngo.acceptDonation(donationId);
        if (response?.success) {
          setFeedback({
            type: 'success',
            message: `Successfully accepted donation! It is now recorded under Accepted Donations.`,
          });
          refreshDonations();
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setFeedback({ type: 'error', message: apiErr.message || 'Server error: Unable to accept donation.' });
          return;
        }
      }

      // Local mock fallback for dev offline
      const result = mockDataService.acceptDonation(donationId, user.id);
      if (!result.success) {
        setFeedback({ type: 'error', message: result.error || 'Failed to accept donation.' });
      } else {
        setFeedback({
          type: 'success',
          message: `Successfully accepted "${result.donation?.foodName}". The donation is now recorded under Accepted Donations.`,
        });
        refreshDonations();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to accept donation.' });
    }
  };

  const handleDeclineDonation = async (donationId: string) => {
    if (!user) return;
    setFeedback(null);

    try {
      try {
        const response = await apiClient.ngo.rejectDonation(donationId, 'Declined by NGO');
        if (response?.success) {
          setFeedback({
            type: 'success',
            message: 'You have declined this food listing. It has been removed from your available listings.',
          });
          refreshDonations();
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setFeedback({ type: 'error', message: apiErr.message || 'Server error: Unable to decline donation.' });
          return;
        }
      }

      const result = mockDataService.rejectDonation(donationId, user.id, 'Declined by NGO from available listings');
      if (!result.success) {
        setFeedback({ type: 'error', message: result.error || 'Failed to decline donation.' });
      } else {
        setFeedback({
          type: 'success',
          message: 'You have declined this food listing. It has been removed from your available listings.',
        });
        refreshDonations();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to decline donation.' });
    }
  };

  // Filter and sort donations
  const filteredDonations = useMemo(() => {
    return donations
      .filter((d) => {
        // Search filter
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

        // Category filter
        if (categoryFilter !== 'all' && d.category !== categoryFilter) {
          return false;
        }

        // Urgency filter
        if (urgencyFilter !== 'all' && d.urgencyLevel !== urgencyFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'urgency') {
          return b.urgencyScore - a.urgencyScore;
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'expiry') {
          return new Date(a.expiryTime).getTime() - new Date(b.expiryTime).getTime();
        }
        return 0;
      });
  }, [donations, searchQuery, categoryFilter, urgencyFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || categoryFilter !== 'all' || urgencyFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setUrgencyFilter('all');
    setSortBy('urgency');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Available Food Donations"
        description="Browse surplus food listings available for claiming by verified NGO partners"
      />

      {/* Dynamic Action Feedback Alert */}
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

      {/* Prominent Verification Status Banners */}
      {isPending && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-warning flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h2 className="text-sm font-semibold text-primary-text">Acceptance Restricted – Verification Pending</h2>
            <p className="text-sm text-secondary-text mt-0.5">
              Your organization registration is currently under review by administrators.
              You may inspect surplus food details, but the mock service will strictly reject donation acceptance calls until verified.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 flex items-start gap-3">
          <ShieldAlert className="text-danger flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h2 className="text-sm font-semibold text-primary-text">Acceptance Blocked – Verification Rejected</h2>
            <p className="text-sm text-secondary-text mt-0.5">
              Donation acceptance is blocked at the service layer because your NGO verification was rejected.
              Reason: {ngo?.rejectionReason || 'Document criteria not met.'}
            </p>
          </div>
        </div>
      )}

      {isVerified && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-success">
            <ShieldCheck size={18} className="flex-shrink-0" />
            <span className="font-semibold text-primary-text">
              Verified Organization: You can claim any active listing below.
            </span>
          </div>
          <span className="text-secondary-text hidden sm:inline">
            Fast response times ensure meals reach those in need before expiry.
          </span>
        </div>
      )}

      {/* Filter and Search Controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Query */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text"
            />
            <input
              type="text"
              placeholder="Search food, location, donor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary capitalize"
            >
              <option value="all">All Food Categories</option>
              <option value="cooked_meals">Cooked Meals</option>
              <option value="raw_groceries">Raw Groceries</option>
              <option value="bakery_items">Bakery Items</option>
              <option value="packaged_food">Packaged Food</option>
              <option value="fruits_vegetables">Fruits & Vegetables</option>
              <option value="dairy_products">Dairy Products</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary capitalize"
            >
              <option value="all">All Urgency Levels</option>
              <option value="critical">Critical Urgency (&gt;85)</option>
              <option value="high">High Urgency (70–84)</option>
              <option value="medium">Medium Urgency (40–69)</option>
              <option value="low">Low Urgency (&lt;40)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="urgency">Sort by Highest Urgency</option>
              <option value="expiry">Sort by Earliest Expiry</option>
              <option value="newest">Sort by Newest First</option>
            </select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs px-2.5 py-2 flex-shrink-0"
                title="Clear all active filters"
              >
                <X size={14} />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Available Donations List */}
      {isLoading ? (
        <Card className="p-12">
          <Loading message="Discovering available surplus food donations..." />
        </Card>
      ) : filteredDonations.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<Search size={48} className="text-secondary-text" />}
            title={hasActiveFilters ? 'No donations match your filters' : 'No available food listings'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search criteria or clearing active category and urgency filters.'
                : 'There are currently no open surplus food listings in your region. Please check back shortly.'
            }
            action={
              hasActiveFilters
                ? {
                    label: 'Clear Filters',
                    onClick: clearFilters,
                  }
                : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDonations.map((donation) => {
            const donor = mockDataService.getUserById(donation.donorId);
            const urgencyVariant =
              donation.urgencyLevel === 'critical'
                ? 'danger'
                : donation.urgencyLevel === 'high'
                ? 'warning'
                : donation.urgencyLevel === 'medium'
                ? 'info'
                : 'neutral';

            const isMatchedSpecifically =
              donation.status === 'NGO_MATCHED' && donation.matchedNgoId === ngo?.id;

            return (
              <Card
                key={donation.id}
                className={`p-5 flex flex-col justify-between transition-shadow hover:shadow-md border ${
                  isMatchedSpecifically ? 'border-primary/50 bg-primary/[0.02]' : 'border-border'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Title, Category & Urgency Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-primary-text">
                          {donation.foodName}
                        </h3>
                        {isMatchedSpecifically && (
                          <Badge variant="info" size="sm">
                            AI Matched to You
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-secondary-text capitalize mt-0.5">
                        Category: {donation.category.replace(/_/g, ' ')} • {donation.dietaryType}
                      </p>
                    </div>

                    <Badge variant={urgencyVariant} size="sm" className="capitalize flex-shrink-0">
                      {donation.urgencyLevel} ({donation.urgencyScore}/100)
                    </Badge>
                  </div>

                  {/* Quantity & Servings */}
                  <div className="bg-surface-container-low p-2.5 rounded-md flex items-center justify-between text-xs">
                    <span className="text-secondary-text">Available Quantity:</span>
                    <span className="font-bold text-sm text-primary">
                      {donation.quantity} {donation.unit}
                      {donation.numberOfServings ? ` (~${donation.numberOfServings} servings)` : ''}
                    </span>
                  </div>

                  {/* Timestamps */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-secondary-text">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-secondary-text flex-shrink-0" />
                      <span>
                        Prep:{' '}
                        {new Date(donation.preparationTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-warning flex-shrink-0" />
                      <span className="font-medium text-primary-text">
                        Expires:{' '}
                        {new Date(donation.expiryTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Location & Donor */}
                  <div className="space-y-1.5 text-xs text-secondary-text pt-2 border-t border-border">
                    <div className="flex items-start gap-1.5">
                      <MapPin size={14} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="truncate">
                        {donation.pickupAddress.street}, {donation.pickupAddress.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User size={14} className="text-secondary-text flex-shrink-0" />
                      <span>
                        Donor: {donor?.profile?.organizationName || donor?.name || 'Local Food Partner'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDonation(donation)}
                    className="text-xs"
                  >
                    <Eye size={14} className="mr-1" />
                    Details
                  </Button>

                  {isVerified && isMatchedSpecifically && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-danger hover:border-danger hover:bg-danger/5"
                      onClick={() => handleDeclineDonation(donation.id)}
                    >
                      Decline
                    </Button>
                  )}

                  <div
                    title={
                      !isVerified
                        ? `Acceptance disabled: Organization verification is ${verificationStatus}`
                        : undefined
                    }
                  >
                    <Button
                      size="sm"
                      disabled={!isVerified}
                      onClick={() => handleAcceptDonation(donation.id)}
                      className={`text-xs ${!isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <CheckCircle2 size={14} className="mr-1" />
                      Accept Donation
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Donation Details Modal */}
      <NGODonationDetailsModal
        donation={selectedDonation}
        ngo={ngo}
        isOpen={!!selectedDonation}
        onClose={() => setSelectedDonation(null)}
        onAccept={isVerified ? handleAcceptDonation : undefined}
        onDecline={isVerified ? handleDeclineDonation : undefined}
      />
    </div>
  );
};

export default AvailableDonations;
