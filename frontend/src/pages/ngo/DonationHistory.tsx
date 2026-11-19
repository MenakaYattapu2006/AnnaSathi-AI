import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { NGODonationDetailsModal } from '../../components/ngo/NGODonationDetailsModal';
import {
  History,
  Search,
  CheckCircle2,
  Calendar,
  MapPin,
  Eye,
  FileCheck,
  Package,
  User,
  X,
  Truck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mockDataService } from '../../lib/mockDataService';
import type { Donation } from '../../types/donation';

const NGODonationHistory: React.FC = () => {
  const { user } = useAuth();
  const ngo = user ? mockDataService.getNGOByUserId(user.id) : undefined;

  const [historyDonations, setHistoryDonations] = useState<Donation[]>(() =>
    user ? mockDataService.getNGODonationHistory(user.id) : []
  );
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'DELIVERED' | 'RECEIPT_CONFIRMED'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const refreshHistory = () => {
    if (user) {
      setHistoryDonations(mockDataService.getNGODonationHistory(user.id));
    }
  };

  const handleConfirmReceipt = (donationId: string, notes?: string) => {
    if (!user) return;
    mockDataService.confirmDonationReceipt(donationId, user.id, notes);
    refreshHistory();
  };

  // Filter and sort donations
  const filteredDonations = useMemo(() => {
    return historyDonations
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
        if (sortBy === 'oldest') {
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        }
        return 0;
      });
  }, [historyDonations, searchQuery, statusFilter, sortBy]);

  // Aggregate metrics
  const totalCollections = historyDonations.length;
  const totalMealsRescued = historyDonations.reduce(
    (acc, d) => acc + (d.numberOfServings || d.quantity || 0),
    0
  );
  const confirmedReceiptsCount = historyDonations.filter(
    (d) => d.status === 'RECEIPT_CONFIRMED'
  ).length;

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donation Collection History"
        description="Archive of completed surplus food deliveries and confirmed distribution receipts"
      />

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Package size={22} />
          </div>
          <div>
            <span className="text-xs text-secondary-text block">Completed Collections</span>
            <span className="font-bold text-lg text-primary-text">{totalCollections}</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-success/10 text-success">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-xs text-secondary-text block">Meals Rescued</span>
            <span className="font-bold text-lg text-primary-text">{totalMealsRescued.toLocaleString()}</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-info/10 text-info">
            <FileCheck size={22} />
          </div>
          <div>
            <span className="text-xs text-secondary-text block">Receipts Confirmed</span>
            <span className="font-bold text-lg text-primary-text">
              {confirmedReceiptsCount} / {totalCollections}
            </span>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text"
            />
            <input
              type="text"
              placeholder="Search by food name, donor, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Completed Statuses</option>
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
              <option value="newest">Sort by Most Recent</option>
              <option value="oldest">Sort by Oldest First</option>
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

      {/* History Items List */}
      {filteredDonations.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<History size={48} className="text-secondary-text" />}
            title={hasActiveFilters ? 'No history matching your filters' : 'No collection history yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search query or filter options.'
                : 'Completed deliveries and distribution receipts will be recorded here.'
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDonations.map((donation) => {
            const donor = mockDataService.getUserById(donation.donorId);
            const assignment = mockDataService.getAssignmentByDonationId(donation.id);
            const volunteer = assignment
              ? mockDataService.getVolunteerById(assignment.volunteerId)
              : undefined;

            const isConfirmed = donation.status === 'RECEIPT_CONFIRMED';

            return (
              <Card
                key={donation.id}
                className="p-4 border border-border hover:border-primary/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-primary-text">{donation.foodName}</h4>
                      <Badge variant={isConfirmed ? 'success' : 'info'} size="sm">
                        {isConfirmed ? 'Receipt Confirmed' : 'Delivered to Shelter'}
                      </Badge>
                      <Badge variant="neutral" size="sm" className="capitalize">
                        {donation.category.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary-text">
                      <span className="font-semibold text-primary">
                        {donation.quantity} {donation.unit}
                        {donation.numberOfServings ? ` (~${donation.numberOfServings} servings)` : ''}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        Donor: {donor?.profile?.organizationName || donor?.name || 'Partner Donor'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {donation.pickupAddress.street}, {donation.pickupAddress.city}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Delivered on {new Date(donation.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {volunteer && (
                      <div className="text-xs text-secondary-text flex items-center gap-1.5 pt-1">
                        <Truck size={12} className="text-primary flex-shrink-0" />
                        <span>
                          Delivered by volunteer: <strong>{volunteer.name}</strong> ({volunteer.vehicleType})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDonation(donation)}
                      className="text-xs"
                    >
                      <Eye size={14} className="mr-1" />
                      View Details
                    </Button>

                    {!isConfirmed && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedDonation(donation)}
                        className="text-xs"
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

export default NGODonationHistory;
