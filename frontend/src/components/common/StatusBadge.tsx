import React from 'react';
import { Badge, type BadgeVariant } from './Badge';

export interface StatusConfig {
  label: string;
  variant: BadgeVariant;
  dot?: boolean;
}

const STATUS_DICTIONARY: Record<string, StatusConfig> = {
  // Donation Statuses
  created: { label: 'Listing Created', variant: 'neutral', dot: true },
  ngo_matched: { label: 'NGO Matched', variant: 'info', dot: true },
  ngo_accepted: { label: 'Shelter Accepted', variant: 'brand', dot: true },
  volunteer_assigned: { label: 'Volunteer Assigned', variant: 'info', dot: true },
  picked_up: { label: 'Picked Up (In Transit)', variant: 'warning', dot: true },
  in_transit: { label: 'In Transit', variant: 'warning', dot: true },
  delivered: { label: 'Delivered at Shelter', variant: 'success', dot: true },
  receipt_confirmed: { label: 'Receipt Confirmed', variant: 'success', dot: true },
  cancelled: { label: 'Cancelled', variant: 'danger', dot: true },
  expired: { label: 'Listing Expired', variant: 'danger', dot: true },

  // Assignment / Logistics Statuses
  available: { label: 'Awaiting Volunteer', variant: 'warning', dot: true },
  assigned: { label: 'Assigned to Volunteer', variant: 'info', dot: true },
  in_transit_to_pickup: { label: 'En Route to Pickup', variant: 'warning', dot: true },
  in_transit_to_drop: { label: 'In Transit to Shelter', variant: 'warning', dot: true },

  // Volunteer Availability
  online: { label: 'Active & Available', variant: 'success', dot: true },
  offline: { label: 'Currently Offline', variant: 'neutral', dot: true },
  busy: { label: 'On Active Task', variant: 'warning', dot: true },

  // NGO Verification Statuses
  verified: { label: 'Verified NGO', variant: 'success', dot: true },
  pending: { label: 'Pending Verification', variant: 'warning', dot: true },
  rejected: { label: 'Verification Declined', variant: 'danger', dot: true },
  suspended: { label: 'Account Suspended', variant: 'danger', dot: true },
  active: { label: 'Active', variant: 'success', dot: true },
};

export const getStatusConfig = (rawStatus?: string): StatusConfig => {
  if (!rawStatus) {
    return { label: 'Unknown', variant: 'neutral', dot: false };
  }
  const key = rawStatus.trim().toLowerCase();
  if (STATUS_DICTIONARY[key]) {
    return STATUS_DICTIONARY[key];
  }
  // Humanize generic underscores/casing fallback
  const formatted = rawStatus
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { label: formatted, variant: 'neutral', dot: true };
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  className = '',
  customLabel,
}) => {
  const config = getStatusConfig(status);
  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={config.dot}
      className={className}
    >
      {customLabel || config.label}
    </Badge>
  );
};
