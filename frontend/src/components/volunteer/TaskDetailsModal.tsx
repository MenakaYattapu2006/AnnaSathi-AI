import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  MapPin,
  Clock,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  Truck,
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldCheck,
  Package,
  Phone,
} from 'lucide-react';
import { DonationProgressTracker } from '../donor/DonationProgressTracker';
import { mockDataService } from '../../lib/mockDataService';
import { apiClient } from '../../lib/apiClient';
import type { Assignment, AssignmentStatus } from '../../types/assignment';

interface TaskDetailsModalProps {
  assignment: Assignment | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (assignmentId: string) => void | Promise<void>;
  onPickup?: (assignmentId: string, notes?: string, otp?: string) => void | Promise<void>;
  onDeliver?: (assignmentId: string, notes?: string, otp?: string) => void | Promise<void>;
  currentVolunteerId?: string;
  defaultAction?: 'pickup' | 'deliver';
}

const statusBadgeMap: Record<
  AssignmentStatus,
  { variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; label: string }
> = {
  available: { variant: 'info', label: 'Ready for Pickup' },
  assigned: { variant: 'info', label: 'Assigned to You' },
  in_transit_to_pickup: { variant: 'warning', label: 'En Route to Pickup' },
  picked_up: { variant: 'warning', label: 'Picked Up (In Transit)' },
  in_transit_to_drop: { variant: 'warning', label: 'In Transit to NGO' },
  delivered: { variant: 'success', label: 'Delivered to Shelter' },
  cancelled: { variant: 'danger', label: 'Task Cancelled' },
};

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  assignment,
  isOpen,
  onClose,
  onAccept,
  onPickup,
  onDeliver,
  currentVolunteerId,
  defaultAction,
}) => {
  const [pickupNotes, setPickupNotes] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [pickupOtp, setPickupOtp] = useState('');
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [showPickupInput, setShowPickupInput] = useState(false);
  const [showDeliveryInput, setShowDeliveryInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-expand pickup or deliver action if defaultAction is specified
  React.useEffect(() => {
    if (defaultAction === 'pickup') {
      setShowPickupInput(true);
      setShowDeliveryInput(false);
    } else if (defaultAction === 'deliver') {
      setShowDeliveryInput(true);
      setShowPickupInput(false);
    }
  }, [defaultAction, isOpen]);

  if (!assignment) return null;

  const donation = mockDataService.getDonationById(assignment.donationId);
  const donor = donation ? mockDataService.getUserById(donation.donorId) : undefined;
  const ngo = mockDataService.getNGOById(assignment.ngoId);

  const statusConfig = statusBadgeMap[assignment.status] || {
    variant: 'neutral',
    label: assignment.status,
  };

  const isAvailable = assignment.status === 'available' || !assignment.volunteerId;
  const canPickup = assignment.status === 'assigned' || assignment.status === 'in_transit_to_pickup';
  const canDeliver = assignment.status === 'picked_up' || assignment.status === 'in_transit_to_drop';

  const urgencyVariant =
    donation?.urgencyLevel === 'critical'
      ? 'danger'
      : donation?.urgencyLevel === 'high'
      ? 'warning'
      : donation?.urgencyLevel === 'medium'
      ? 'info'
      : 'neutral';

  const handlePickupSubmit = async (customOtp?: string) => {
    setOtpError(null);
    const otpToUse = customOtp !== undefined ? customOtp : pickupOtp;
    const cleanOtp = otpToUse.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter the 6-digit verification OTP provided by the food donor.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onPickup) {
        await onPickup(assignment.id, pickupNotes, cleanOtp);
      } else {
        await apiClient.volunteer.pickupAssignment(assignment.id, pickupNotes, cleanOtp);
      }
      setShowPickupInput(false);
      setPickupNotes('');
      setPickupOtp('');
      onClose();
    } catch (err: any) {
      console.error('Failed to confirm pickup:', err);
      setOtpError(err?.message || 'Invalid Pickup OTP. Please verify with the donor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeliverSubmit = async (customOtp?: string) => {
    setOtpError(null);
    const otpToUse = customOtp !== undefined ? customOtp : deliveryOtp;
    const cleanOtp = otpToUse.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter the 6-digit confirmation OTP provided by the shelter representative.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onDeliver) {
        await onDeliver(assignment.id, deliveryNotes, cleanOtp);
      } else {
        await apiClient.volunteer.deliverAssignment(assignment.id, deliveryNotes, cleanOtp);
      }
      setShowDeliveryInput(false);
      setDeliveryNotes('');
      setDeliveryOtp('');
      onClose();
    } catch (err: any) {
      console.error('Failed to confirm delivery:', err);
      setOtpError(err?.message || 'Invalid Delivery OTP. Please verify with the shelter representative.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={donation?.foodName || 'Delivery Task Details'}
      size="xl"
    >
      <div className="space-y-6">
        {/* Status header banner */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <span className="text-xs font-semibold text-secondary-text uppercase tracking-wider">
            Task Status
          </span>
          <Badge variant={statusConfig.variant} size="sm">
            {statusConfig.label}
          </Badge>
        </div>

        {/* Lifecycle Progress Tracker */}
        <div className="p-4 bg-surface rounded-xl border border-border shadow-xs">
          <DonationProgressTracker
            status={
              donation?.status ||
              (assignment.status === 'delivered'
                ? 'DELIVERED'
                : assignment.status === 'picked_up'
                ? 'PICKED_UP'
                : assignment.status === 'assigned'
                ? 'VOLUNTEER_ASSIGNED'
                : 'NGO_ACCEPTED')
            }
          />
        </div>

        {/* Food & Urgency Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-lg">
          <div>
            <span className="text-xs text-secondary-text block">Quantity & Servings</span>
            <span className="font-bold text-primary">
              {donation ? `${donation.quantity} ${donation.unit}` : 'Bulk food package'}
              {donation?.numberOfServings ? ` (~${donation.numberOfServings} servings)` : ''}
            </span>
          </div>

          <div>
            <span className="text-xs text-secondary-text block">Category & Diet</span>
            <span className="font-medium text-primary-text capitalize">
              {donation?.category ? donation.category.replace(/_/g, ' ') : 'Food Rescue'} •{' '}
              {donation?.dietaryType || 'Standard'}
            </span>
          </div>

          <div>
            <span className="text-xs text-secondary-text block">Expiry Deadline</span>
            <span className="font-medium text-primary-text flex items-center gap-1 text-xs">
              <Clock size={13} className="text-warning" />
              {donation
                ? new Date(donation.expiryTime).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : 'Expiring shortly'}
            </span>
          </div>

          <div>
            <span className="text-xs text-secondary-text block">Urgency Rating</span>
            <Badge variant={urgencyVariant} size="sm" className="capitalize">
              {donation?.urgencyLevel || 'Medium'} ({donation?.urgencyScore || 50}/100)
            </Badge>
          </div>
        </div>

        {/* Route Details: Pickup & Delivery Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pickup Point */}
          <div className="border border-border rounded-lg p-3.5 space-y-2">
            <h5 className="text-xs font-semibold text-secondary-text uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={14} className="text-primary" />
              <span>1. Pickup From (Donor)</span>
            </h5>
            <p className="text-sm font-semibold text-primary-text">
              {donor?.profile?.organizationName || donor?.name || assignment.pickup.contactPerson}
            </p>
            <p className="text-xs text-secondary-text">{assignment.pickup.address}</p>
            <div className="text-xs text-secondary-text pt-1 border-t border-border/50">
              <span className="block">Contact: {assignment.pickup.contactPerson}</span>
              {assignment.pickup.contactPhone && (
                <a
                  href={`tel:${assignment.pickup.contactPhone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline mt-0.5"
                >
                  <Phone size={12} className="text-emerald-600" />
                  {assignment.pickup.contactPhone}
                </a>
              )}
            </div>
            {assignment.pickup.actualPickupTime && (
              <div className="mt-1 p-1.5 bg-emerald-500/10 rounded text-center">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">Picked Up On</span>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {new Date(assignment.pickup.actualPickupTime).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Delivery Point */}
          <div className="border border-border rounded-lg p-3.5 space-y-2">
            <h5 className="text-xs font-semibold text-secondary-text uppercase tracking-wider flex items-center gap-1.5">
              <Building2 size={14} className="text-primary" />
              <span>2. Deliver To (NGO Shelter)</span>
            </h5>
            <p className="text-sm font-semibold text-primary-text">
              {ngo?.organizationName || assignment.delivery.ngoName}
            </p>
            <p className="text-xs text-secondary-text">{assignment.delivery.address}</p>
            <div className="text-xs text-secondary-text pt-1 border-t border-border/50">
              <span className="block">Receiver: {assignment.delivery.contactPerson}</span>
              {assignment.delivery.contactPhone && (
                <a
                  href={`tel:${assignment.delivery.contactPhone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline mt-0.5"
                >
                  <Phone size={12} className="text-emerald-600" />
                  {assignment.delivery.contactPhone}
                </a>
              )}
            </div>
            {assignment.delivery.actualDeliveryTime && (
              <div className="mt-1 p-1.5 bg-success/10 rounded text-center">
                <span className="text-[10px] text-success block">Delivered On</span>
                <span className="text-xs font-medium text-success">
                  {new Date(assignment.delivery.actualDeliveryTime).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Special Instructions & Notes */}
        {assignment.notes && (
          <div className="bg-surface-container-low p-3 rounded-lg flex items-start gap-2 text-xs text-secondary-text">
            <Info size={15} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-primary-text block">Dispatch Notes:</span>
              <span>{assignment.notes}</span>
            </div>
          </div>
        )}

        {/* Pickup Action Input Form with Donor OTP verification */}
        {showPickupInput && (
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3.5">
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-emerald-600 dark:text-emerald-400" />
              <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                Verify &amp; Confirm Food Pickup
              </h5>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Ask the food donor at the pickup location for their <strong>6-digit Pickup OTP</strong> to verify and collect this package.
            </p>

            {otpError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Enter Donor Pickup OTP *
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="6-digit code (e.g. 549281)"
                value={pickupOtp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPickupOtp(val);
                  if (otpError) setOtpError(null);
                  if (val.length === 6) {
                    handlePickupSubmit(val);
                  }
                }}
                className="w-full text-center tracking-widest font-mono text-lg font-bold p-2.5 rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pickup Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Inspected and safely loaded into thermal bag..."
                value={pickupNotes}
                onChange={(e) => setPickupNotes(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => { setShowPickupInput(false); setOtpError(null); }} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handlePickupSubmit}
                disabled={isSubmitting || pickupOtp.trim().length !== 6}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
              >
                <Truck size={14} className="mr-1.5" />
                {isSubmitting ? 'Verifying OTP...' : 'Verify OTP & Mark Picked Up'}
              </Button>
            </div>
          </div>
        )}

        {/* Delivery Action Input Form with NGO OTP verification */}
        {showDeliveryInput && (
          <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-3.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400" />
              <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                Verify &amp; Confirm Shelter Delivery
              </h5>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Ask the NGO shelter coordinator at the destination for their <strong>6-digit Delivery Confirmation OTP</strong> to complete handover.
            </p>

            {otpError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Enter Shelter Delivery OTP *
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="6-digit code (e.g. 718392)"
                value={deliveryOtp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setDeliveryOtp(val);
                  if (otpError) setOtpError(null);
                  if (val.length === 6) {
                    handleDeliverSubmit(val);
                  }
                }}
                className="w-full text-center tracking-widest font-mono text-lg font-bold p-2.5 rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Handover Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Handed over to kitchen staff coordinator..."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => { setShowDeliveryInput(false); setOtpError(null); }} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeliverSubmit}
                disabled={isSubmitting || deliveryOtp.trim().length !== 6}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
              >
                <CheckCircle2 size={14} className="mr-1.5" />
                {isSubmitting ? 'Verifying OTP...' : 'Verify OTP & Mark Delivered'}
              </Button>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          {isAvailable && onAccept && (
            <Button
              size="sm"
              onClick={() => {
                onAccept(assignment.id);
                onClose();
              }}
            >
              <CheckCircle2 size={14} className="mr-1" />
              Accept Delivery Task
            </Button>
          )}

          {canPickup && !showPickupInput && (
            <Button size="sm" onClick={() => setShowPickupInput(true)}>
              <Truck size={14} className="mr-1" />
              Confirm Food Picked Up
            </Button>
          )}

          {canDeliver && !showDeliveryInput && (
            <Button size="sm" onClick={() => setShowDeliveryInput(true)}>
              <CheckCircle2 size={14} className="mr-1" />
              Confirm Delivery Complete
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};



