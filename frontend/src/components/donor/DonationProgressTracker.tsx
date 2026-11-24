import React from 'react';
import {
  Check,
  XCircle,
  PackagePlus,
  Users2,
  Building2,
  UserCheck,
  Truck,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import type { DonationStatus } from '../../types/donation';

interface DonationProgressTrackerProps {
  status: DonationStatus;
  className?: string;
}

const LIFECYCLE_STEPS: {
  status: DonationStatus;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}[] = [
  { status: 'CREATED', label: 'Donation Created', shortLabel: 'Created', icon: PackagePlus },
  { status: 'NGO_MATCHED', label: 'NGO Matched', shortLabel: 'Matched', icon: Users2 },
  { status: 'NGO_ACCEPTED', label: 'NGO Accepted', shortLabel: 'Accepted', icon: Building2 },
  { status: 'VOLUNTEER_ASSIGNED', label: 'Volunteer Assigned', shortLabel: 'Assigned', icon: UserCheck },
  { status: 'PICKED_UP', label: 'Food Picked Up', shortLabel: 'Picked Up', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', shortLabel: 'Delivered', icon: CheckCircle2 },
  { status: 'RECEIPT_CONFIRMED', label: 'Receipt Confirmed', shortLabel: 'Confirmed', icon: FileCheck },
];

export const DonationProgressTracker: React.FC<DonationProgressTrackerProps> = ({
  status,
  className = '',
}) => {
  if (status === 'CANCELLED') {
    return (
      <div className={`p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3.5 ${className}`}>
        <XCircle size={26} className="text-rose-600 flex-shrink-0" />
        <div>
          <p className="font-bold text-sm text-rose-900">Donation Cancelled</p>
          <p className="text-xs text-rose-700 mt-0.5">This donation was cancelled and is no longer moving through the rescue pipeline.</p>
        </div>
      </div>
    );
  }

  const currentIndex = LIFECYCLE_STEPS.findIndex((s) => s.status === status);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;
  const progressPercent = (activeIndex / (LIFECYCLE_STEPS.length - 1)) * 100;

  return (
    <div className={`w-full py-3 px-2 ${className}`}>
      {/* Tracker Bar Container with strictly equal grid columns */}
      <div className="relative">
        {/* Background track rail */}
        <div className="absolute top-5 left-4 right-4 h-1.5 bg-slate-200 rounded-full z-0" />

        {/* Animated Active Progress Rail */}
        <div
          className="absolute top-5 left-4 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-[#0f392b] rounded-full z-0 transition-all duration-700 ease-out shadow-xs"
          style={{
            width: `calc(${progressPercent}% * (100% - 2rem) / 100)`,
          }}
        />

        {/* Step Nodes in perfectly equal width grid columns */}
        <div className="grid grid-cols-7 relative z-10">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const isPending = idx > activeIndex;
            const StepIcon = step.icon;

            return (
              <div
                key={step.status}
                className="flex flex-col items-center text-center px-0.5 group"
              >
                {/* Step Node Circle */}
                <div
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-[#0f392b] text-white shadow-sm ring-2 ring-[#0f392b]/30'
                      : isCurrent
                      ? 'bg-[#0f392b] text-white shadow-md ring-4 ring-emerald-500/30 scale-110'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -inset-1 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
                  )}

                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} className="text-emerald-300" />
                  ) : isCurrent ? (
                    <StepIcon size={18} strokeWidth={2.5} className="text-emerald-300" />
                  ) : (
                    <span className="text-xs font-semibold">{idx + 1}</span>
                  )}
                </div>

                {/* Step Number + Label */}
                <div className="mt-2.5 flex flex-col items-center">
                  <span
                    className={`text-[9px] uppercase tracking-wider font-bold transition-colors ${
                      isCurrent
                        ? 'text-emerald-700'
                        : isCompleted
                        ? 'text-slate-500'
                        : 'text-slate-400'
                    }`}
                  >
                    Step {idx + 1}
                  </span>
                  <span
                    className={`text-[11px] leading-tight mt-0.5 transition-colors line-clamp-2 max-w-[80px] ${
                      isCurrent
                        ? 'font-bold text-slate-900'
                        : isCompleted
                        ? 'font-semibold text-slate-700'
                        : 'font-normal text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic current status indicator banner */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-500">Current Phase:</span>
          <span className="font-bold text-[#0f392b]">
            {LIFECYCLE_STEPS[activeIndex]?.label}
          </span>
        </div>
        <span className="text-slate-400 font-medium text-[11px]">
          {activeIndex + 1} of {LIFECYCLE_STEPS.length} Completed
        </span>
      </div>
    </div>
  );
};



