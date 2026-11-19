import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Calendar,
  Building2,
  Users,
  MapPin,
  XCircle,
  Eye,
  ArrowUpDown,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Table, type TableColumn } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { DonationProgressTracker } from '../../components/donor/DonationProgressTracker';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, mapDonationFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import { Loading } from '../../components/common/Loading';
import type { Donation, DonationStatus, FoodCategory, UrgencyLevel } from '../../types';

const isProduction = Boolean((import.meta as any).env?.PROD);

export const DonationManagement: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DonationStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | FoodCategory>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | UrgencyLevel>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'urgency_high' | 'quantity_high'>('newest');

  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [cancellingDonation, setCancellingDonation] = useState<Donation | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const loadDonations = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.admin.listDonations();
      if (response?.data?.donations) {
        setDonations(response.data.donations.map(mapDonationFromDb));
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

    setDonations(mockDataService.getDonations());
    setIsLoading(false);
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const filteredDonations = useMemo(() => {
    return donations
      .filter((d) => {
        const matchesSearch =
          d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.foodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.pickupAddress.city.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
        const matchesUrgency = urgencyFilter === 'all' || d.urgencyLevel === urgencyFilter;
        return matchesSearch && matchesStatus && matchesCategory && matchesUrgency;
      })
      .sort((a, b) => {
        if (sortBy === 'urgency_high') {
          return b.urgencyScore - a.urgencyScore;
        }
        if (sortBy === 'quantity_high') {
          return b.quantity - a.quantity;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [donations, searchQuery, statusFilter, categoryFilter, urgencyFilter, sortBy]);

  const handleAdminCancel = async () => {
    if (!cancellingDonation || !currentAdmin) return;
    if (!cancelReason.trim()) {
      setFeedback({ type: 'error', message: 'A specific reason is required for administrative cancellation.' });
      return;
    }

    try {
      try {
        const response = await apiClient.donations.cancel(cancellingDonation.id, cancelReason.trim());
        if (response?.success) {
          setFeedback({
            type: 'success',
            message: `Donation #${cancellingDonation.id} (${cancellingDonation.foodName}) cancelled administratively.`,
          });
          loadDonations();
          setCancellingDonation(null);
          setCancelReason('');
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setFeedback({ type: 'error', message: apiErr.message || 'Server error: Failed to cancel donation.' });
          return;
        }
      }

      const result = mockDataService.adminCancelDonation(
        cancellingDonation.id,
        currentAdmin.id,
        cancelReason.trim()
      );

      if (result.success) {
        setFeedback({
          type: 'success',
          message: `Donation #${cancellingDonation.id} (${cancellingDonation.foodName}) cancelled administratively.`,
        });
        loadDonations();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to cancel donation.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to cancel donation.' });
    } finally {
      setCancellingDonation(null);
      setCancelReason('');
    }
  };

  const columns: TableColumn<Donation>[] = [
    {
      header: 'Donation Listing',
      accessor: (d) => (
        <div>
          <p className="font-semibold text-primary-text">{d.foodName}</p>
          <p className="text-xs text-secondary-text">ID: #{d.id}</p>
          <span className="text-xs text-secondary-text capitalize">
            {d.category.replace(/_/g, ' ')} • {d.dietaryType}
          </span>
        </div>
      ),
    },
    {
      header: 'Quantity & Urgency',
      accessor: (d) => (
        <div>
          <p className="font-semibold text-primary-text text-sm">
            {d.quantity} {d.unit}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                d.urgencyLevel === 'critical'
                  ? 'bg-danger'
                  : d.urgencyLevel === 'high'
                  ? 'bg-warning'
                  : 'bg-success'
              }`}
            />
            <span className="text-xs text-secondary-text capitalize font-medium">
              Score: {d.urgencyScore}/100 ({d.urgencyLevel})
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (d) => (
        <Badge
          size="sm"
          variant={
            d.status === 'RECEIPT_CONFIRMED'
              ? 'success'
              : d.status === 'CANCELLED'
              ? 'danger'
              : d.status === 'NGO_ACCEPTED' || d.status === 'VOLUNTEER_ASSIGNED'
              ? 'info'
              : 'neutral'
          }
        >
          {d.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      header: 'Location / Timestamps',
      accessor: (d) => (
        <div className="text-xs text-secondary-text">
          <p className="text-primary-text">{d.pickupAddress.city}</p>
          <p>Expires: {new Date(d.expiryTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (d) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedDonation(d)}>
            Audit
          </Button>
          {d.status !== 'CANCELLED' && d.status !== 'RECEIPT_CONFIRMED' && (
            <Button
              variant="outline"
              size="sm"
              className="text-danger border-danger/40 hover:bg-danger/10"
              onClick={() => setCancellingDonation(d)}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donation Governance & Inspection"
        description="Oversee surplus food rescue workflows, monitor lifecycle states, and handle administrative interventions."
      />

      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-success/10 text-success border border-success/30'
              : 'bg-danger/10 text-danger border border-danger/30'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-secondary-text" size={18} />
            <input
              type="text"
              placeholder="Search by ID, food title, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm bg-surface text-primary-text focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-primary-text focus:outline-none focus:border-primary"
          >
            <option value="all">All Lifecycle States</option>
            <option value="CREATED">Created</option>
            <option value="NGO_MATCHED">NGO Matched</option>
            <option value="NGO_ACCEPTED">NGO Accepted</option>
            <option value="VOLUNTEER_ASSIGNED">Volunteer Assigned</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="DELIVERED">Delivered</option>
            <option value="RECEIPT_CONFIRMED">Receipt Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-primary-text focus:outline-none focus:border-primary"
          >
            <option value="all">All Food Categories</option>
            <option value="cooked_meals">Cooked Meals</option>
            <option value="raw_groceries">Raw Groceries</option>
            <option value="bakery_items">Bakery Items</option>
            <option value="packaged_food">Packaged Food</option>
            <option value="fruits_vegetables">Fruits & Vegetables</option>
            <option value="dairy_products">Dairy Products</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-primary-text focus:outline-none focus:border-primary"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="urgency_high">Sort: Highest Urgency</option>
            <option value="quantity_high">Sort: Largest Quantity</option>
          </select>
        </div>
      </Card>

      {/* Donation Table */}
      <Card className="p-0 overflow-hidden">
        <Table
          columns={columns}
          data={filteredDonations}
          emptyState={
            <EmptyState
              title="No donation records found"
              description="Adjust your search filters to view food listings."
            />
          }
        />
      </Card>

      {/* Donation Audit Modal */}
      {selectedDonation && (
        <Modal
          isOpen={!!selectedDonation}
          onClose={() => setSelectedDonation(null)}
          title={`Donation Audit: #${selectedDonation.id} - ${selectedDonation.foodName}`}
        >
          <div className="space-y-4 text-sm">
            {/* Progress Tracker */}
            <div className="p-4 bg-surface-hover rounded-lg border border-border/60">
              <DonationProgressTracker status={selectedDonation.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-secondary-text block">Category & Diet</span>
                <span className="text-primary-text font-medium capitalize">
                  {selectedDonation.category.replace(/_/g, ' ')} ({selectedDonation.dietaryType})
                </span>
              </div>
              <div>
                <span className="text-xs text-secondary-text block">Quantity</span>
                <span className="text-primary-text font-bold">
                  {selectedDonation.quantity} {selectedDonation.unit}{' '}
                  {selectedDonation.numberOfServings ? `(~${selectedDonation.numberOfServings} servings)` : ''}
                </span>
              </div>
              <div>
                <span className="text-xs text-secondary-text block">Preparation Time</span>
                <span className="text-primary-text">
                  {new Date(selectedDonation.preparationTime).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs text-secondary-text block">Expiry Deadline</span>
                <span className="text-primary-text font-medium text-danger">
                  {new Date(selectedDonation.expiryTime).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3 bg-surface-hover rounded-md text-xs space-y-1">
              <p className="font-semibold text-primary-text">Pickup Address</p>
              <p className="text-secondary-text">
                {selectedDonation.pickupAddress.street}, {selectedDonation.pickupAddress.city},{' '}
                {selectedDonation.pickupAddress.state} {selectedDonation.pickupAddress.pincode}
              </p>
              {selectedDonation.pickupAddress.landmark && (
                <p className="text-secondary-text">Landmark: {selectedDonation.pickupAddress.landmark}</p>
              )}
            </div>

            {selectedDonation.specialInstructions && (
              <div className="p-3 bg-surface-hover rounded-md text-xs">
                <span className="font-semibold text-primary-text block mb-0.5">Instructions & Audit Notes:</span>
                <p className="text-secondary-text">{selectedDonation.specialInstructions}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setSelectedDonation(null)}>
                Close
              </Button>
              {selectedDonation.status !== 'CANCELLED' && selectedDonation.status !== 'RECEIPT_CONFIRMED' && (
                <Button
                  variant="outline"
                  className="text-danger border-danger/50 hover:bg-danger/10"
                  onClick={() => {
                    const target = selectedDonation;
                    setSelectedDonation(null);
                    setCancellingDonation(target);
                  }}
                >
                  Admin Cancel
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Cancellation Modal */}
      {cancellingDonation && (
        <Modal
          isOpen={!!cancellingDonation}
          onClose={() => {
            setCancellingDonation(null);
            setCancelReason('');
          }}
          title={`Administrative Cancellation: #${cancellingDonation.id}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-secondary-text">
              You are about to administratively cancel donation listing{' '}
              <strong className="text-primary-text">{cancellingDonation.foodName}</strong>. Any active volunteer assignment linked to this donation will also be cancelled.
            </p>
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">
                Mandatory Cancellation Reason *
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Safety inspection failure, reported spoiled food, donor emergency withdrawal..."
                className="w-full p-2.5 border border-border rounded-md text-sm bg-surface text-primary-text focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCancellingDonation(null);
                  setCancelReason('');
                }}
              >
                Go Back
              </Button>
              <Button
                variant="outline"
                className="text-danger border-danger/50 hover:bg-danger/10"
                onClick={handleAdminCancel}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DonationManagement;
