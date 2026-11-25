import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from './Card';
import { Badge } from './Badge';

export interface DashboardStatCardProps {
  /** Statistic title, e.g. "Total Donations" */
  title: string;
  /** Main numeric value */
  value: string | number;
  /** Optional description or sub-text */
  description?: string;
  /** Optional trend delta – positive = up, negative = down */
  trend?: number;
  /** Icon to display on the left side */
  icon?: React.ReactNode;
  /** Optional badge variant (success/warning/danger/info/neutral) */
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

/**
 * Small card that displays a key statistic on the dashboard.
 * - Shows an optional icon, the title, the value and an optional trend indicator.
 * - Uses the design-system utilities from `components.css` and the `Badge` component.
 */
export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  description,
  trend,
  icon,
  badgeVariant,
}) => {
  const trendPositive = typeof trend === 'number' && trend > 0;
  const trendNegative = typeof trend === 'number' && trend < 0;

  const trendLabel = trend !== undefined ? `${trend > 0 ? '+' : ''}${trend}%` : undefined;
  const resolvedBadgeVariant = badgeVariant ?? (trendPositive ? 'success' : trendNegative ? 'danger' : 'neutral');

  const trendIcon = trendPositive ? (
    <ArrowUp className="text-success" size={14} />
  ) : trendNegative ? (
    <ArrowDown className="text-danger" size={14} />
  ) : null;

  return (
    <Card className="p-5 hover:border-emerald-500/25 transition-all">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100/80 flex items-center justify-center flex-shrink-0 shadow-xs">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-0.5 tracking-tight">{value}</p>
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
        {trend !== undefined && (
          <Badge variant={resolvedBadgeVariant} size="sm">
            {trendIcon}
            <span className="ml-0.5">{trendLabel}</span>
          </Badge>
        )}
      </div>
    </Card>
  );
};



