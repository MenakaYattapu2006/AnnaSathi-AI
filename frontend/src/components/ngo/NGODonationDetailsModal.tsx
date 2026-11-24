import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { DonationProgressTracker } from '../donor/DonationProgressTracker';
import {
  MapPin,
  Clock,
  User,
  Truck,
  AlertTriangle,
  Info,
  Calendar,
  CheckCircle2,
  FileCheck,
  XCircle,
} from 'lucide-react';
import { mockDataService } from '../../lib/mockDataService';
import type { Donation, DonationStatus } from '../../types/donation';
import type { NGO } from '../../types/ngo';

interface NGODonationDetailsModalProps {
  donation: Donation | null;
  ngo: NGO | undefined;
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (donationId: string) => void;
  onDecline?: (donationId: string) => void;
  onConfirmReceipt?: (donationId: string, notes?: string) => void;
}

const statusBadgeMap: Record<
  DonationStatus,
  { variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; label: string }
> = {
  CREATED: { variant: 'neutral', label: 'Listing Created' },
  NGO_MATCHED: { variant: 'info', label: 'Matched to NGO' },
  NGO_ACCEPTED: { variant: 'success', label: 'Accepted by NGO' },
  VOLUNTEER_ASSIGNED: { variant: 'info', label: 'Volunteer Assigned' },
  PICKED_UP: { variant: 'warning', label: 'Picked Up' },
  DELIVERED: { variant: 'success', label: 'Delivered to Shelter' },
  RECEIPT_CONFIRMED: { variant: 'success', label: 'Receipt Confirmed' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
};

export const NGODonationDetailsModal: React.FC<NGODonationDetailsModalProps> = ({
  donation,
  ngo,
  isOpen,
  onClose,
  onAccept,
  onDecline,
  onConfirmReceipt,
}) => {
  const [receiptNotes, setReceiptNotes] = useState('');
  const [showReceiptInput, setShowReceiptInput] = useState(false);

  if (!donation) return null;

  const donor = mockDataService.getUserById(donation.donorId);
  const assignment = mockDataService.getAssignmentByDonationId(donation.id);
  const volunteer = assignment
    ? mockDataService.getVolunteerById(assignment.volunteerId)
    : undefined;

  const isVerified = ngo?.verificationStatus === 'verified';
  const isAvailableForAccept =
    donation.status === 'CREATED' ||
    (donation.status === 'NGO_MATCHED' && (!donation.matchedNgoId || donation.matchedNgoId === ngo?.id));
  const isMatchedToThisNgo = ngo && donation.matchedNgoId === ngo.id;
  const canConfirmReceipt = isMatchedToThisNgo && donation.status === 'DELIVERED';

  const statusConfig = statusBadgeMap[donation.status] || {
    variant: 'neutral',
    label: donation.status,
  };

  const urgencyVariant =
    donation.urgencyLevel === 'critical'
      ? 'danger'
      : donation.urgencyLevel === 'high'
      ? 'warning'
      : donation.urgencyLevel === 'medium'
      ? 'info'
      : 'neutral';

  const handleConfirmSubmit = () => {
    if (onConfirmReceipt) {
      onConfirmReceipt(donation.id, receiptNotes);
      setShowReceiptInput(false);
      setReceiptNotes('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={donation.foodName}
      size="xl"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <span className="text-xs font-semibold text-secondary-text uppercase tracking-wider">
            Current Status
          </span>
          <Badge variant={statusConfig.variant} size="sm">
            {statusConfig.label}
          </Badge>
        </div>
        {/* Verification Alert Banner if NGO is not verified */}
        {!isVerified && isAvailableForAccept && (
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-2.5 text-warning-text">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 text-warning" />
            <div className="text-xs">
              <p className="font-semibold text-primary-text">Acceptance Restricted</p>
              <p className="text-secondary-text">
                Your organization verification is currently {ngo?.verificationStatus || 'pending'}.
                Only verified NGOs may claim food donations.
              </p>
            </div>
          </div>
        )}

        {/* Progress Tracker */}
        <div>
          <h4 className="text-xs font-semibold text-secondary-text uppercase tracking-wider mb-2">
            Logistics Pipeline
          </h4>
          <DonationProgressTracker status={donation.status} />
        </div>

        {/* Food & Urgency Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-lg">
          <div>
            <span className="text-xs text-secondary-text block">Category & Type</span>
            <span className="font-medium text-primary-text capitalize">
              {donation.category.replace('_', ' ')} • {donation.dietaryType}
            </span>
          </div>
          <div>
            <span className="text-xs text-secondary-text block">Quantity & Volume</span>
            <span className="font-bold text-primary">
              {donation.quantity} {donation.unit}
              {donation.numberOfServings ? ` (~${donation.numberOfServings} servings)` : ''}
            </span>
          </div>
          <div>
            <span className="text-xs text-secondary-text block">Preparation Timestamp</span>
            <span className="font-medium text-primary-text flex items-center gap-1.5 text-sm">
              <Calendar size={14} className="text-secondary-text" />
              {new Date(donation.preparationTime).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
          <div>
            <span className="text-xs text-secondary-text block">Expiry Deadline</span>
            <span className="font-medium text-primary-text flex items-center gap-1.5 text-sm">
              <Clock size={14} className="text-secondary-text" />
              {new Date(donation.expiryTime).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
          <div className="sm:col-span-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-secondary-text block">AI Perishability Score</span>
                <span className="text-xs text-secondary-text">
                  Dynamically estimated based on ambient shelf life and preparation time
                </span>
              </div>
              <Badge variant={urgencyVariant} size="md" className="capitalize font-mono">
                {donation.urgencyLevel} ({donation.urgencyScore}/100)
              </Badge>
            </div>
          </div>
        </div>

        {/* Pickup Location & Donor Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-border rounded-lg p-3.5 space-y-2">
            <h5 className="text-xs font-semibold text-secondary-text uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={14} className="text-primary" />
              <span>Pickup Location</span>
            </h5>
            <p className="text-sm font-medium text-primary-text">
              {donation.pickupAddress.street}
            </p>
            <p className="text-xs text-secondary-text">
              {donation.pickupAddress.city}, {donation.pickupAddress.state} -{' '}
              {donation.pickupAddress.pincode}
            </p>
            {donation.pickupAddress.landmark && (
              <p className="text-xs text-secondary-text italic">
                Landmark: {donation.pickupAddress.landmark}
              </p>
            )}
          </div>

          <div className="border border-border rounded-lg p-3.5 space-y-2">
            <h5 className="text-xs font-semibold text-secondary-text uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} className="text-primary" />
              <span>Donor Contact</span>
            </h5>
            <p className="text-sm font-semibold text-primary-text">
              {donation.donorName || donor?.name || 'Authorized Food Donor'}
            </p>
            {(donation.donorOrganization || donor?.profile?.organizationName) && (
              <p className="text-xs text-secondary-text font-medium">
                {donation.donorOrganization || donor?.profile?.organizationName}
              </p>
            )}
            <p className="text-xs text-secondary-text">
              {donation.donorPhone || donor?.phone || 'Phone upon dispatch'}
              {(donation.donorEmail || donor?.email) && ` • ${donation.donorEmail || donor?.email}`}
            </p>
          </div>
        </div>

        {/* Delivery OTP Card for NGO verification */}
        {donation.deliveryOtp && (
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider block">
                Shelter Delivery Confirmation OTP
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Provide this 6-digit code to the volunteer rider upon food handover at your shelter facility.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-mono font-bold text-lg tracking-widest shadow-xs">
                {donation.deliveryOtp}
              </span>
            </div>
          </div>
        )}

        {/* Volunteer Logistics Section */}
        <div className="border border-border rounded-lg p-3.5 space-y-2">
          <h5 className="text-xs font-semibold text-secondary-text uppercase tracking-wider flex items-center gap-1.5">
            <Truck size={14} className="text-primary" />
            <span>Volunteer Dispatch Status</span>
          </h5>
          {donation.volunteerName || volunteer ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <div>
                <p className="font-semibold text-primary-text">
                  {donation.volunteerName || volunteer?.name}
                </p>
                <p className="text-xs text-secondary-text">
                  Contact: {donation.volunteerPhone || volunteer?.phone}
                  {volunteer?.vehicleType && ` • Vehicle: ${volunteer.vehicleType}`}
                </p>
              </div>
              <Badge variant="info" size="sm" className="capitalize">
                {donation.volunteerStatus
                  ? donation.volunteerStatus.replace(/_/g, ' ')
                  : assignment?.status
                  ? assignment.status.replace(/_/g, ' ')
                  : 'Assigned'}
              </Badge>
            </div>
          ) : donation.status === 'RECEIPT_CONFIRMED' || donation.status === 'DELIVERED' ? (
            <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-md border border-emerald-200">
              ✓ Food rescue and delivery successfully completed and fulfilled.
            </p>
          ) : (
            <p className="text-xs text-secondary-text">
              No volunteer has been dispatched yet. Volunteer coordination will be automated upon
              pickup confirmation.
            </p>
          )}
        </div>

        {/* Special Instructions */}
        {donation.specialInstructions && (
          <div className="bg-surface-container-low p-3.5 rounded-lg flex items-start gap-2.5 text-xs text-secondary-text">
            <Info size={16} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-primary-text block mb-0.5">
                Handling Instructions:
              </span>
              <span>{donation.specialInstructions}</span>
            </div>
          </div>
        )}

        {/* Confirm Receipt Form (for DELIVERED status) */}
        {showReceiptInput && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
            <h5 className="text-sm font-semibold text-primary-text flex items-center gap-1.5">
              <FileCheck size={16} className="text-primary" />
              <span>Confirm Food Receipt & Distribution</span>
            </h5>
            <p className="text-xs text-secondary-text">
              Confirm that this food delivery has been received in good condition by your community
              kitchen or shelter.
            </p>
            <textarea
              className="w-full text-xs p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
              rows={2}
              placeholder="Add optional notes (e.g. food quality verified, meals distributed at evening drive)..."
              value={receiptNotes}
              onChange={(e) => setReceiptNotes(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowReceiptInput(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmSubmit}>
                Confirm Receipt
              </Button>
            </div>
          </div>
        )}

        {/* Receipt Confirmed Info */}
        {donation.status === 'RECEIPT_CONFIRMED' && (
          <div className="p-3 bg-success/10 border border-success/30 rounded-lg flex items-center gap-2.5 text-success">
            <CheckCircle2 size={18} className="flex-shrink-0" />
            <span className="text-xs font-semibold">
              Delivery receipt signed and confirmed by your organization.
            </span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          {isAvailableForAccept && (
            <>
              {onDecline && isVerified && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-danger hover:border-danger hover:bg-danger/5"
                  onClick={() => {
                    onDecline(donation.id);
                    onClose();
                  }}
                >
                  <XCircle size={14} className="mr-1" />
                  Decline Listing
                </Button>
              )}
              {onAccept && (
                <Button
                  size="sm"
                  disabled={!isVerified}
                  className={!isVerified ? 'opacity-50 cursor-not-allowed' : ''}
                  onClick={() => {
                    if (isVerified) {
                      onAccept(donation.id);
                      onClose();
                    }
                  }}
                >
                  <CheckCircle2 size={14} className="mr-1" />
                  Accept Donation
                </Button>
              )}
            </>
          )}

          {canConfirmReceipt && !showReceiptInput && onConfirmReceipt && (
            <Button size="sm" onClick={() => setShowReceiptInput(true)}>
              <FileCheck size={14} className="mr-1" />
              Confirm Delivery Receipt
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};



