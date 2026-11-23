import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { DonationProgressTracker } from './DonationProgressTracker';
import {
  MapPin,
  Clock,
  Building2,
  Truck,
  AlertTriangle,
  Info,
  Calendar,
  XCircle,
} from 'lucide-react';
import { apiClient, mapDonationFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import type { Donation, DonationStatus } from '../../types/donation';

const isProduction = Boolean((import.meta as any).env?.PROD);

interface DonationDetailsModalProps {
  donation: Donation | null;
  isOpen: boolean;
  onClose: () => void;
  onDonationCancelled?: (updated: Donation) => void;
  currentUserId?: string;
}

const statusBadgeMap: Record<DonationStatus, { variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; label: string }> = {
  CREATED: { variant: 'neutral', label: 'Listing Created' },
  NGO_MATCHED: { variant: 'info', label: 'NGO Matched' },
  NGO_ACCEPTED: { variant: 'success', label: 'NGO Accepted' },
  VOLUNTEER_ASSIGNED: { variant: 'info', label: 'Volunteer Assigned' },
  PICKED_UP: { variant: 'warning', label: 'Food Picked Up' },
  DELIVERED: { variant: 'success', label: 'Delivered to Shelter' },
  RECEIPT_CONFIRMED: { variant: 'success', label: 'Receipt Confirmed' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
};

export const DonationDetailsModal: React.FC<DonationDetailsModalProps> = ({
  donation,
  isOpen,
  onClose,
  onDonationCancelled,
  currentUserId,
}) => {
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!donation) return null;

  const matchedNgo = donation.matchedNgoId
    ? mockDataService.getNGOById(donation.matchedNgoId)
    : undefined;

  const assignment = mockDataService.getAssignmentByDonationId(donation.id);
  const volunteer = assignment
    ? mockDataService.getVolunteerById(assignment.volunteerId)
    : undefined;

  const isCancellable =
    donation.status === 'CREATED' ||
    donation.status === 'NGO_MATCHED' ||
    donation.status === 'NGO_ACCEPTED' ||
    donation.status === 'VOLUNTEER_ASSIGNED';

  const handleCancelClick = () => {
    setCancelError(null);
    setConfirmCancelOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!currentUserId) return;
    setCancelError(null);

    try {
      try {
        const response = await apiClient.donations.cancel(donation.id);
        if (response?.donation) {
          const mapped = mapDonationFromDb(response.donation);
          setConfirmCancelOpen(false);
          if (onDonationCancelled) {
            onDonationCancelled(mapped);
          }
          onClose();
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setCancelError(apiErr.message || 'Server error: Failed to cancel donation.');
          return;
        }
      }

      // Local mock fallback for development offline mode
      const result = mockDataService.cancelDonation(donation.id, currentUserId);
      if (!result.success) {
        setCancelError(result.error || 'Failed to cancel donation.');
      } else if (result.donation) {
        setConfirmCancelOpen(false);
        if (onDonationCancelled) {
          onDonationCancelled(result.donation);
        }
        onClose();
      }
    } catch (err: any) {
      setCancelError(err.message || 'An unexpected error occurred while canceling.');
    }
  };

  const urgencyVariant =
    donation.urgencyLevel === 'critical'
      ? 'danger'
      : donation.urgencyLevel === 'high'
      ? 'warning'
      : donation.urgencyLevel === 'medium'
      ? 'info'
      : 'neutral';

  const statusConfig = statusBadgeMap[donation.status] || {
    variant: 'neutral',
    label: donation.status,
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Donation Lifecycle Details">
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-border pb-4">
            <div>
              <span className="text-xs font-mono text-secondary-text">ID: {donation.id}</span>
              <h2 className="text-xl font-bold text-primary-text mt-0.5">{donation.foodName}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant={statusConfig.variant} size="sm">
                  {statusConfig.label}
                </Badge>
                <Badge variant={urgencyVariant} size="sm" className="capitalize">
                  Urgency: {donation.urgencyLevel} ({donation.urgencyScore}/100)
                </Badge>
                <span className="text-xs text-secondary-text capitalize px-2 py-0.5 bg-surface-container-low rounded">
                  {donation.category.replace('_', ' ')} • {donation.dietaryType}
                </span>
              </div>
            </div>
            <div className="text-right sm:text-right">
              <span className="text-2xl font-black text-primary">
                {donation.quantity} {donation.unit}
              </span>
              {donation.numberOfServings && (
                <span className="block text-xs text-secondary-text">
                  ~{donation.numberOfServings} meals estimated
                </span>
              )}
            </div>
          </div>

          {/* Progress Tracker */}
          <div>
            <h3 className="text-xs uppercase font-bold text-secondary-text tracking-wider mb-1">
              Lifecycle Progress Tracker
            </h3>
            <DonationProgressTracker status={donation.status} />
          </div>

          {/* Logistics & Timestamps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-surface-container-low rounded-lg border border-border/50">
              <span className="text-xs text-secondary-text flex items-center gap-1 mb-1 font-semibold">
                <Calendar size={14} className="text-primary" />
                Preparation & Expiry
              </span>
              <p className="text-xs text-primary-text">
                <strong>Prepared:</strong> {new Date(donation.preparationTime).toLocaleString()}
              </p>
              <p className="text-xs text-primary-text mt-0.5">
                <strong>Expires:</strong> {new Date(donation.expiryTime).toLocaleString()}
              </p>
            </div>

            <div className="p-3 bg-surface-container-low rounded-lg border border-border/50">
              <span className="text-xs text-secondary-text flex items-center gap-1 mb-1 font-semibold">
                <MapPin size={14} className="text-primary" />
                Pickup Location
              </span>
              <p className="text-xs text-primary-text font-medium">{donation.pickupAddress.street}</p>
              <p className="text-xs text-secondary-text">
                {donation.pickupAddress.city}, PIN: {donation.pickupAddress.pincode}
                {donation.pickupAddress.landmark ? ` (${donation.pickupAddress.landmark})` : ''}
              </p>
            </div>
          </div>

          {/* Instructions */}
          {donation.specialInstructions && (
            <div className="p-3 bg-surface-container-low rounded-lg border border-border/50 text-xs">
              <span className="font-semibold text-primary-text block mb-0.5">Special Instructions:</span>
              <p className="text-secondary-text">{donation.specialInstructions}</p>
            </div>
          )}

          {/* Matched NGO Card */}
          {matchedNgo && (
            <div className="p-3.5 rounded-lg border border-primary/30 bg-primary/5 flex items-start gap-3">
              <Building2 className="text-primary flex-shrink-0 mt-0.5" size={20} />
              <div className="text-xs">
                <span className="font-bold text-primary-text block text-sm">
                  Matched NGO: {matchedNgo.organizationName}
                </span>
                <p className="text-secondary-text mt-0.5">
                  Contact: {matchedNgo.contactPerson} ({matchedNgo.contactPhone})
                </p>
                <p className="text-secondary-text">
                  Service Area: {matchedNgo.serviceArea.join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Volunteer Assignment Card */}
          {volunteer && (
            <div className="p-3.5 rounded-lg border border-accent/30 bg-accent/5 flex items-start gap-3">
              <Truck className="text-accent flex-shrink-0 mt-0.5" size={20} />
              <div className="text-xs">
                <span className="font-bold text-primary-text block text-sm">
                  Assigned Volunteer: {volunteer.name}
                </span>
                <p className="text-secondary-text mt-0.5">
                  Phone: {volunteer.phone} • Vehicle: {volunteer.vehicleType.replace('_', ' ')}
                </p>
                <p className="text-secondary-text">Rating: ★ {volunteer.rating} / 5.0</p>
              </div>
            </div>
          )}

          {/* Cancellation Option */}
          {isCancellable && (
            <div className="pt-2 border-t border-border flex justify-between items-center">
              <span className="text-xs text-secondary-text">
                Eligible for cancellation before pickup.
              </span>
              <Button variant="outline" size="sm" onClick={handleCancelClick} className="border-danger/40 text-danger hover:bg-danger/10 hover:text-danger">
                Cancel Donation
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirmation Modal for Cancellation */}
      <Modal
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        title="Confirm Donation Cancellation"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger">
            <AlertTriangle size={24} className="flex-shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-sm">Are you sure you want to cancel this donation?</p>
              <p className="mt-1 text-danger/90">
                This will release any matched NGO and cancel active volunteer dispatch. This action cannot be reversed.
              </p>
            </div>
          </div>

          {cancelError && (
            <p className="text-xs text-danger font-medium">{cancelError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmCancelOpen(false)}>
              Keep Active
            </Button>
            <Button size="sm" onClick={handleConfirmCancel} className="bg-danger hover:bg-danger/90 text-white">
              Yes, Cancel Donation
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};



