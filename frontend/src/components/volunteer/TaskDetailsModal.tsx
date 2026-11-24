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
  Info,
  ShieldCheck,
  Package,
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
  onPickup?: (assignmentId: string, notes?: string) => void | Promise<void>;
  onDeliver?: (assignmentId: string, notes?: string) => void | Promise<void>;
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

  const handlePickupSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (onPickup) {
        await onPickup(assignment.id, pickupNotes);
      } else {
        await apiClient.volunteer.pickupAssignment(assignment.id, pickupNotes);
      }
      setShowPickupInput(false);
      setPickupNotes('');
      onClose();
    } catch (err: any) {
      console.error('Failed to confirm pickup:', err);
      try {
        if (currentVolunteerId) {
          mockDataService.pickupAssignment(assignment.id, currentVolunteerId, pickupNotes);
        }
      } catch {}
      setShowPickupInput(false);
      setPickupNotes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeliverSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (onDeliver) {
        await onDeliver(assignment.id, deliveryNotes);
      } else {
        await apiClient.volunteer.deliverAssignment(assignment.id, deliveryNotes);
      }
      setShowDeliveryInput(false);
      setDeliveryNotes('');
      onClose();
    } catch (err: any) {
      console.error('Failed to confirm delivery:', err);
      try {
        if (currentVolunteerId) {
          mockDataService.deliverAssignment(assignment.id, currentVolunteerId, deliveryNotes);
        }
      } catch {}
      setShowDeliveryInput(false);
      setDeliveryNotes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={donation?.foodName || 'Delivery Task Details'}
      className="max-w-2xl"
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
              <span className="block font-medium text-primary-text">
                {assignment.pickup.contactPhone}
              </span>
            </div>
            {assignment.pickup.verificationOtp && (
              <div className="mt-1 p-1.5 bg-primary/10 rounded text-center border border-primary/20">
                <span className="text-[10px] text-secondary-text block">Demo Pickup OTP (Simulated)</span>
                <span className="font-mono font-bold text-sm text-primary tracking-wider">
                  {assignment.pickup.verificationOtp}
                </span>
                <span className="text-[9px] text-secondary-text/80 block mt-0.5">
                  Illustrative demonstration code only; production verification will use transactional Brevo OTP.
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
              <span className="block font-medium text-primary-text">
                {assignment.delivery.contactPhone}
              </span>
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

        {/* Pickup Action Input Form */}
        {showPickupInput && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
            <h5 className="text-sm font-semibold text-primary-text flex items-center gap-1.5">
              <Truck size={16} className="text-primary" />
              <span>Confirm Food Pickup from Donor</span>
            </h5>
            <p className="text-xs text-secondary-text">
              Confirm that you have arrived at the donor facility, inspected packaging, and loaded the food into your vehicle.
            </p>
            <input
              type="text"
              placeholder="Optional notes (e.g. food packages loaded in insulated bag)..."
              value={pickupNotes}
              onChange={(e) => setPickupNotes(e.target.value)}
              className="w-full text-xs p-2 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowPickupInput(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handlePickupSubmit}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
              >
                <Truck size={14} className="mr-1" />
                {isSubmitting ? 'Confirming Pickup...' : 'Confirm Pickup'}
              </Button>
            </div>
          </div>
        )}

        {/* Delivery Action Input Form */}
        {showDeliveryInput && (
          <div className="p-4 bg-success/5 border border-success/20 rounded-lg space-y-3">
            <h5 className="text-sm font-semibold text-primary-text flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-success" />
              <span>Confirm Food Delivery to NGO Shelter</span>
            </h5>
            <p className="text-xs text-secondary-text">
              Confirm that you have safely arrived at the NGO distribution center and handed over the food surplus to the shelter staff.
            </p>
            <input
              type="text"
              placeholder="Optional notes (e.g. handed over to kitchen coordinator Meera)..."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="w-full text-xs p-2 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowDeliveryInput(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeliverSubmit}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
              >
                <CheckCircle2 size={14} className="mr-1" />
                {isSubmitting ? 'Confirming Delivery...' : 'Confirm Delivery'}
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



