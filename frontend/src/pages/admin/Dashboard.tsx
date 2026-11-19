import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Building2,
  HeartHandshake,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { DashboardStatCard } from '../../components/common/DashboardStatCard';
import { mockDataService } from '../../lib/mockDataService';
import type { AdminDashboardStats, AdminActivityLogEntry } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLogEntry[]>([]);

  useEffect(() => {
    const data = mockDataService.getAdminDashboardStats();
    setStats(data);
    setActivityLogs(mockDataService.getAdminActivityLogs().slice(0, 5));
  }, []);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Admin Control Center"
        description="Platform-wide governance, NGO compliance, donation telemetry, and audit monitoring."
      />

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Total Registered Users"
          value={stats.totalUsers}
          description={`${stats.totalDonors} Donors • ${stats.totalNGOs} NGOs • ${stats.totalVolunteers} Volunteers`}
          icon={<Users size={24} />}
          badgeVariant="info"
        />
        <DashboardStatCard
          title="Pending NGO Verifications"
          value={stats.pendingNGOs}
          description={`${stats.verifiedNGOs} verified organizations active`}
          icon={<ShieldCheck size={24} />}
          badgeVariant={stats.pendingNGOs > 0 ? 'warning' : 'success'}
        />
        <DashboardStatCard
          title="Total Surplus Donations"
          value={stats.totalDonations}
          description={`${stats.availableDonations} available • ${stats.acceptedDonations} accepted`}
          icon={<Package size={24} />}
          badgeVariant="neutral"
        />
        <DashboardStatCard
          title="Active Deliveries"
          value={stats.activeDeliveries}
          description={`${stats.completedDeliveries} completed deliveries`}
          icon={<Truck size={24} />}
          badgeVariant="success"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <NavLink
          to="/admin/ngo-verification"
          className="card p-4 hover:border-primary/50 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="font-semibold text-primary-text text-sm">Verify NGOs</p>
              <p className="text-xs text-secondary-text">{stats.pendingNGOs} pending review</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-secondary-text group-hover:text-primary transition-colors" />
        </NavLink>

        <NavLink
          to="/admin/users"
          className="card p-4 hover:border-primary/50 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <p className="font-semibold text-primary-text text-sm">Manage Users</p>
              <p className="text-xs text-secondary-text">Directory & Permissions</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-secondary-text group-hover:text-primary transition-colors" />
        </NavLink>

        <NavLink
          to="/admin/donations"
          className="card p-4 hover:border-primary/50 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <p className="font-semibold text-primary-text text-sm">Donation Listings</p>
              <p className="text-xs text-secondary-text">Audit & lifecycle tracking</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-secondary-text group-hover:text-primary transition-colors" />
        </NavLink>

        <NavLink
          to="/admin/deliveries"
          className="card p-4 hover:border-primary/50 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 text-success flex items-center justify-center">
              <Truck size={20} />
            </div>
            <div>
              <p className="font-semibold text-primary-text text-sm">Delivery Logistics</p>
              <p className="text-xs text-secondary-text">{stats.activeDeliveries} in transit</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-secondary-text group-hover:text-primary transition-colors" />
        </NavLink>
      </div>

      {/* Telemetry Breakdown Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donation Lifecycle Status Breakdown */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-primary-text flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Donation Lifecycle Breakdown
            </h3>
            <span className="text-xs text-secondary-text font-medium">{stats.totalDonations} total listings</span>
          </div>
          <div className="space-y-3">
            {stats.donationStatusDistribution.map((item) => {
              const pct = stats.totalDonations > 0 ? Math.round((item.count / stats.totalDonations) * 100) : 0;
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-primary-text capitalize">
                      {item.status.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <span className="text-secondary-text">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-border/40 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        item.status === 'RECEIPT_CONFIRMED'
                          ? 'bg-success'
                          : item.status === 'CANCELLED'
                          ? 'bg-danger'
                          : item.status === 'NGO_ACCEPTED' || item.status === 'VOLUNTEER_ASSIGNED'
                          ? 'bg-secondary'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Platform User Role Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-primary-text flex items-center gap-2">
              <Users size={18} className="text-primary" />
              Community Network Breakdown
            </h3>
            <span className="text-xs text-secondary-text font-medium">{stats.totalUsers} registered</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-surface-hover rounded-lg border border-border/60">
              <p className="text-xs text-secondary-text">Surplus Donors</p>
              <p className="text-xl font-bold text-primary-text mt-1">{stats.totalDonors}</p>
            </div>
            <div className="p-3 bg-surface-hover rounded-lg border border-border/60">
              <p className="text-xs text-secondary-text">NGO Partners</p>
              <p className="text-xl font-bold text-primary-text mt-1">
                {stats.totalNGOs}{' '}
                <span className="text-xs font-normal text-secondary-text">
                  ({stats.verifiedNGOs} verified)
                </span>
              </p>
            </div>
            <div className="p-3 bg-surface-hover rounded-lg border border-border/60">
              <p className="text-xs text-secondary-text">Active Volunteers</p>
              <p className="text-xl font-bold text-primary-text mt-1">{stats.totalVolunteers}</p>
            </div>
            <div className="p-3 bg-surface-hover rounded-lg border border-border/60">
              <p className="text-xs text-secondary-text">Receipts Confirmed</p>
              <p className="text-xl font-bold text-success mt-1">{stats.receiptConfirmedDonations}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50">
            <p className="text-xs font-semibold text-primary-text mb-2">NGO Verification Queue</p>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                {stats.verifiedNGOs} Verified
              </Badge>
              <Badge variant="warning" size="sm">
                {stats.pendingNGOs} Pending
              </Badge>
              <Badge variant="danger" size="sm">
                {stats.rejectedNGOs} Rejected
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Platform Records & Activity Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Platform Donations */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-primary-text flex items-center gap-2">
              <Package size={18} className="text-primary" />
              Recent Donations
            </h3>
            <NavLink to="/admin/donations" className="text-xs font-medium text-primary hover:underline">
              View all
            </NavLink>
          </div>
          <div className="divide-y divide-border/60">
            {stats.recentDonations.map((d) => (
              <div key={d.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-text">{d.foodName}</p>
                  <p className="text-xs text-secondary-text">
                    {d.quantity} {d.unit} • {d.pickupAddress.city} • Urgency: {d.urgencyScore}/100
                  </p>
                </div>
                <Badge
                  size="sm"
                  variant={
                    d.status === 'RECEIPT_CONFIRMED'
                      ? 'success'
                      : d.status === 'CANCELLED'
                      ? 'danger'
                      : d.status === 'NGO_ACCEPTED'
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  {d.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Admin Activity / Audit Log */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-primary-text flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              Administrative Audit Log
            </h3>
            <span className="text-xs text-secondary-text">Demonstration Log</span>
          </div>

          {activityLogs.length === 0 ? (
            <p className="text-xs text-secondary-text py-4 text-center">
              No administrative actions logged in this session yet. Actions like NGO verification or account adjustments will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-surface-hover rounded-md text-xs border border-border/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-primary-text capitalize">
                      {log.actionType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-secondary-text">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-secondary-text">{log.description}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
