import React from 'react';
import { Check, XCircle } from 'lucide-react';
import type { DonationStatus } from '../../types/donation';

interface DonationProgressTrackerProps {
  status: DonationStatus;
  className?: string;
}

const LIFECYCLE_STEPS: { status: DonationStatus; label: string }[] = [
  { status: 'CREATED', label: 'Created' },
  { status: 'NGO_MATCHED', label: 'NGO Matched' },
  { status: 'NGO_ACCEPTED', label: 'NGO Accepted' },
  { status: 'VOLUNTEER_ASSIGNED', label: 'Volunteer Assigned' },
  { status: 'PICKED_UP', label: 'Picked Up' },
  { status: 'DELIVERED', label: 'Delivered' },
  { status: 'RECEIPT_CONFIRMED', label: 'Receipt Confirmed' },
];

export const DonationProgressTracker: React.FC<DonationProgressTrackerProps> = ({
  status,
  className = '',
}) => {
  if (status === 'CANCELLED') {
    return (
      <div className={`p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger flex items-center gap-3 ${className}`}>
        <XCircle size={24} className="flex-shrink-0" />
        <div>
          <p className="font-semibold text-sm">Donation Cancelled</p>
          <p className="text-xs text-danger/80">This donation was cancelled before pickup and is no longer active.</p>
        </div>
      </div>
    );
  }

  const currentIndex = LIFECYCLE_STEPS.findIndex((s) => s.status === status);

  return (
    <div className={`w-full py-4 ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Background track line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-border w-full z-0" />
        {/* Active progress track line */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-300 z-0"
          style={{
            width: `${(Math.max(0, currentIndex) / (LIFECYCLE_STEPS.length - 1)) * 100}%`,
          }}
        />

        {LIFECYCLE_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center group">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-primary text-white shadow-sm'
                    : isCurrent
                    ? 'bg-accent text-white ring-4 ring-accent/20'
                    : 'bg-surface border-2 border-border text-secondary-text'
                }`}
              >
                {isCompleted ? <Check size={14} /> : idx + 1}
              </div>
              <span
                className={`text-[10px] mt-2 hidden sm:block text-center max-w-[70px] leading-tight ${
                  isCurrent
                    ? 'font-bold text-primary-text'
                    : isCompleted
                    ? 'font-medium text-primary'
                    : 'text-secondary-text'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* Mobile label below */}
      <div className="mt-3 sm:hidden text-center">
        <span className="text-xs font-semibold text-primary">
          Current Stage: {LIFECYCLE_STEPS[Math.max(0, currentIndex)]?.label}
        </span>
      </div>
    </div>
  );
};



