import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { DonationDetailsModal } from '../../components/donor/DonationDetailsModal';
import {
  Search,
  Filter,
  PlusCircle,
  Package,
  Calendar,
  Building2,
  CheckCircle2,
  Eye,
  XCircle,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mockDataService } from '../../lib/mockDataService';
import type { Donation, DonationStatus, FoodCategory, UrgencyLevel } from '../../types/donation';

const statusBadgeMap: Record<DonationStatus, { variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; label: string }> = {
  CREATED: { variant: 'neutral', label: 'Created' },
  NGO_MATCHED: { variant: 'info', label: 'NGO Matched' },
  NGO_ACCEPTED: { variant: 'success', label: 'NGO Accepted' },
  VOLUNTEER_ASSIGNED: { variant: 'info', label: 'Volunteer Assigned' },
  PICKED_UP: { variant: 'warning', label: 'Picked Up' },
  DELIVERED: { variant: 'success', label: 'Delivered' },
  RECEIPT_CONFIRMED: { variant: 'success', label: 'Receipt Confirmed' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
};

const MyDonations: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Load donations strictly for authenticated donor
  const reloadDonations = () => {
    if (user) {
      setDonations(mockDataService.getDonationsByDonor(user.id));
    }
  };

  useEffect(() => {
    reloadDonations();
  }, [user]);

  // Handle post-creation banner if navigated from CreateDonation
  useEffect(() => {
    if (location.state && (location.state as { newDonationCreated?: boolean }).newDonationCreated) {
      setBannerMessage('Food donation listing published successfully! Nearby verified NGOs can now review and claim it.');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Client-side search, filtering, and sorting
  const filteredDonations = useMemo(() => {
    return donations
      .filter((d) => {
        const matchesSearch =
          searchQuery.trim() === '' ||
          d.foodName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
          selectedStatus === 'all' || d.status === selectedStatus;

        const matchesCategory =
          selectedCategory === 'all' || d.category === selectedCategory;

        const matchesUrgency =
          selectedUrgency === 'all' || d.urgencyLevel === selectedUrgency;

        return matchesSearch && matchesStatus && matchesCategory && matchesUrgency;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [donations, searchQuery, selectedStatus, selectedCategory, selectedUrgency, sortOrder]);

  const handleOpenDetails = (d: Donation) => {
    setSelectedDonation(d);
    setIsDetailsOpen(true);
  };

  const handleDonationCancelled = (_updated: Donation) => {
    reloadDonations();
    setBannerMessage('Donation was cancelled successfully.');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <PageHeader
          title="My Food Donations"
          description="Track active surplus listings, claim statuses, and volunteer delivery progress"
          className="mb-0"
        />
        <Link to="/donor/create-donation">
          <Button className="flex items-center gap-2">
            <PlusCircle size={18} />
            <span>Create New Donation</span>
          </Button>
        </Link>
      </div>

      {bannerMessage && (
        <div className="mb-6 bg-success/10 border border-success/30 rounded-lg p-4 flex items-center justify-between gap-3 text-success">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="flex-shrink-0" />
            <p className="text-sm font-medium">{bannerMessage}</p>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-success hover:opacity-75 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 text-secondary-text" size={18} />
            <input
              type="text"
              placeholder="Search by food name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border bg-white text-primary-text pl-9 pr-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-md border border-border bg-white text-primary-text px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="CREATED">Created (Open)</option>
              <option value="NGO_MATCHED">NGO Matched</option>
              <option value="NGO_ACCEPTED">NGO Accepted</option>
              <option value="VOLUNTEER_ASSIGNED">Volunteer Assigned</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="DELIVERED">Delivered</option>
              <option value="RECEIPT_CONFIRMED">Receipt Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-md border border-border bg-white text-primary-text px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              <option value="cooked_meals">Cooked Meals</option>
              <option value="raw_groceries">Raw Groceries</option>
              <option value="bakery_items">Bakery Items</option>
              <option value="packaged_food">Packaged Food</option>
              <option value="fruits_vegetables">Fruits & Vegetables</option>
              <option value="dairy_products">Dairy Products</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex gap-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="w-full rounded-md border border-border bg-white text-primary-text px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Donations List / Cards */}
      {filteredDonations.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<Package size={56} className="text-primary" />}
            title="No donations found"
            description={
              donations.length === 0
                ? "You haven't published any food donations yet. Click 'Create New Donation' to get started."
                : 'No donations match your selected filters. Try resetting your search or filter parameters.'
            }
            action={
              donations.length === 0
                ? {
                    label: 'Create Donation',
                    onClick: () => (window.location.href = '/donor/create-donation'),
                  }
                : {
                    label: 'Reset Filters',
                    onClick: () => {
                      setSearchQuery('');
                      setSelectedStatus('all');
                      setSelectedCategory('all');
                      setSelectedUrgency('all');
                    },
                    variant: 'outline',
                  }
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDonations.map((d) => {
            const statusConfig = statusBadgeMap[d.status] || {
              variant: 'neutral',
              label: d.status,
            };

            const urgencyVariant =
              d.urgencyLevel === 'critical'
                ? 'danger'
                : d.urgencyLevel === 'high'
                ? 'warning'
                : d.urgencyLevel === 'medium'
                ? 'info'
                : 'neutral';

            const matchedNgo = d.matchedNgoId
              ? mockDataService.getNGOById(d.matchedNgoId)
              : undefined;

            return (
              <Card
                key={d.id}
                className="p-5 hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-secondary-text">{d.id}</span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <Badge variant={statusConfig.variant} size="sm">
                        {statusConfig.label}
                      </Badge>
                      <Badge variant={urgencyVariant} size="sm" className="capitalize">
                        {d.urgencyLevel} ({d.urgencyScore})
                      </Badge>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-primary-text">{d.foodName}</h3>
                  <p className="text-xs text-secondary-text capitalize mt-0.5">
                    {d.category.replace('_', ' ')} • {d.dietaryType}
                  </p>

                  <div className="my-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-primary">
                      {d.quantity} {d.unit}
                    </span>
                    {d.numberOfServings && (
                      <span className="text-xs text-secondary-text">
                        (~{d.numberOfServings} meals)
                      </span>
                    )}
                  </div>

                  {matchedNgo && (
                    <div className="mb-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-xs flex items-center gap-2">
                      <Building2 size={16} className="text-primary flex-shrink-0" />
                      <span className="text-primary-text truncate">
                        Claimed by: <strong>{matchedNgo.organizationName}</strong>
                      </span>
                    </div>
                  )}

                  <div className="space-y-1 text-xs text-secondary-text">
                    <div className="flex items-center gap-1">
                      <Calendar size={13} className="text-primary" />
                      <span>Expires: {new Date(d.expiryTime).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-secondary-text">
                    Created {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDetails(d)}
                    className="flex items-center gap-1.5"
                  >
                    <Eye size={14} />
                    <span>View Details</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <DonationDetailsModal
        donation={selectedDonation}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onDonationCancelled={handleDonationCancelled}
        currentUserId={user?.id}
      />
    </div>
  );
};

export default MyDonations;
