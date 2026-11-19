import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DashboardStatCard } from '../../components/common/DashboardStatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Table, type TableColumn } from '../../components/common/Table';
import { EmptyState } from '../../components/common/EmptyState';
import { DonationDetailsModal } from '../../components/donor/DonationDetailsModal';
import {
  Package,
  CheckCircle,
  Clock,
  Heart,
  PlusCircle,
  TrendingUp,
  PieChart,
  Eye,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mockDataService } from '../../lib/mockDataService';
import type { Donation, DonationStatus } from '../../types/donation';

const statusBadgeMap: Record<DonationStatus, { variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; label: string }> = {
  CREATED: { variant: 'neutral', label: 'Created' },
  NGO_MATCHED: { variant: 'info', label: 'Matched' },
  NGO_ACCEPTED: { variant: 'success', label: 'Accepted' },
  VOLUNTEER_ASSIGNED: { variant: 'info', label: 'Vol. Assigned' },
  PICKED_UP: { variant: 'warning', label: 'In Transit' },
  DELIVERED: { variant: 'success', label: 'Delivered' },
  RECEIPT_CONFIRMED: { variant: 'success', label: 'Confirmed' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
};

const DonorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Retrieve actual donation records for this donor
  const donorDonations = useMemo(() => {
    return user ? mockDataService.getDonationsByDonor(user.id) : [];
  }, [user]);

  // Dynamically calculate actual counts from the donor's records
  const stats = useMemo(() => {
    const total = donorDonations.length;

    const completed = donorDonations.filter(
      (d) => d.status === 'DELIVERED' || d.status === 'RECEIPT_CONFIRMED'
    ).length;

    const active = donorDonations.filter(
      (d) =>
        d.status !== 'DELIVERED' &&
        d.status !== 'RECEIPT_CONFIRMED' &&
        d.status !== 'CANCELLED'
    ).length;

    const cancelled = donorDonations.filter((d) => d.status === 'CANCELLED').length;

    // Sum actual meals delivered across verified completed deliveries
    const deliveredMeals = donorDonations
      .filter((d) => d.status === 'DELIVERED' || d.status === 'RECEIPT_CONFIRMED')
      .reduce((sum, d) => {
        return sum + (d.numberOfServings || (d.unit === 'meals' ? d.quantity : d.quantity * 2));
      }, 0);

    // Sum active meals currently in pipeline
    const inPipelineMeals = donorDonations
      .filter(
        (d) =>
          d.status !== 'DELIVERED' &&
          d.status !== 'RECEIPT_CONFIRMED' &&
          d.status !== 'CANCELLED'
      )
      .reduce((sum, d) => {
        return sum + (d.numberOfServings || (d.unit === 'meals' ? d.quantity : d.quantity * 2));
      }, 0);

    return {
      total,
      active,
      completed,
      cancelled,
      deliveredMeals,
      inPipelineMeals,
    };
  }, [donorDonations]);

  // Calculate real category distribution from actual donations
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    donorDonations.forEach((d) => {
      if (d.status !== 'CANCELLED') {
        const cat = d.category.replace('_', ' ');
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    const totalValid = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: totalValid > 0 ? Math.round((count / totalValid) * 100) : 0,
    }));
  }, [donorDonations]);

  // Calculate real status distribution from actual donations
  const statusCounts = useMemo(() => {
    const counts: Record<DonationStatus, number> = {
      CREATED: 0,
      NGO_MATCHED: 0,
      NGO_ACCEPTED: 0,
      VOLUNTEER_ASSIGNED: 0,
      PICKED_UP: 0,
      DELIVERED: 0,
      RECEIPT_CONFIRMED: 0,
      CANCELLED: 0,
    };

    donorDonations.forEach((d) => {
      if (counts[d.status] !== undefined) {
        counts[d.status]++;
      }
    });

    return counts;
  }, [donorDonations]);

  // Recent 5 donations sorted descending by creation time
  const recentDonations = useMemo(() => {
    return [...donorDonations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [donorDonations]);

  const recentColumns: TableColumn<Donation>[] = [
    {
      header: 'Food Item',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-primary-text">{row.foodName}</p>
          <p className="text-xs text-secondary-text capitalize">{row.category.replace('_', ' ')}</p>
        </div>
      ),
    },
    {
      header: 'Quantity',
      accessor: (row) => (
        <span className="font-medium text-primary-text">
          {row.quantity} {row.unit}
        </span>
      ),
    },
    {
      header: 'Urgency',
      accessor: (row) => {
        const variant =
          row.urgencyLevel === 'critical'
            ? 'danger'
            : row.urgencyLevel === 'high'
            ? 'warning'
            : row.urgencyLevel === 'medium'
            ? 'info'
            : 'neutral';
        return (
          <Badge variant={variant} size="sm" className="capitalize">
            {row.urgencyLevel} ({row.urgencyScore})
          </Badge>
        );
      },
    },
    {
      header: 'Status',
      accessor: (row) => {
        const conf = statusBadgeMap[row.status] || { variant: 'neutral', label: row.status };
        return <Badge variant={conf.variant} size="sm">{conf.label}</Badge>;
      },
    },
    {
      header: 'Date',
      accessor: (row) => (
        <span className="text-xs text-secondary-text">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Action',
      accessor: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedDonation(row);
            setIsDetailsOpen(true);
          }}
          className="flex items-center gap-1 text-xs"
        >
          <Eye size={12} />
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ───── Welcome Section ───── */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-white/80 flex items-center gap-1.5 mb-1">
              <Sparkles size={14} className="text-accent" />
              Donor Command Center
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {user?.name || 'Valued Donor'}
            </h1>
            <p className="mt-1 text-white/80 text-sm max-w-xl">
              Thank you for keeping surplus food out of landfills and feeding local communities.
              List your surplus banquet, hotel, or catered meals today to initiate immediate relief.
            </p>
          </div>

          <Link to="/donor/create-donation">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-white font-bold flex items-center gap-2 shadow-md w-full sm:w-auto justify-center"
            >
              <PlusCircle size={20} />
              <span>Create Donation</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ───── Dynamic Statistics Cards (Real Mock Calculations) ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Total Donations"
          value={stats.total}
          icon={<Package size={24} />}
          description="Total listings published"
          badgeVariant="neutral"
        />
        <DashboardStatCard
          title="Active Drives"
          value={stats.active}
          icon={<Clock size={24} />}
          description={`${stats.inPipelineMeals} meals in pipeline`}
          badgeVariant="warning"
        />
        <DashboardStatCard
          title="Completed Deliveries"
          value={stats.completed}
          icon={<CheckCircle size={24} />}
          description="Verified delivered"
          badgeVariant="success"
        />
        <DashboardStatCard
          title="Meals Delivered"
          value={stats.deliveredMeals.toLocaleString()}
          icon={<Heart size={24} />}
          description="From completed deliveries"
          badgeVariant="success"
        />
      </div>

      {/* ───── Real Dataset Visualizations ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-primary-text flex items-center gap-2">
              <PieChart size={18} className="text-primary" />
              <span>Food Category Breakdown</span>
            </h3>
            <span className="text-xs text-secondary-text">Derived from your listings</span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <EmptyState
              title="No donation data yet"
              description="Publish your first food listing to view category metrics."
            />
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-primary-text capitalize">{cat.name}</span>
                    <span className="text-secondary-text">
                      {cat.count} listings ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden border border-border/40">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Lifecycle Status Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-primary-text flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              <span>Lifecycle Status Distribution</span>
            </h3>
            <span className="text-xs text-secondary-text">Current record statuses</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-surface-container-low rounded-lg text-center border border-border/50">
              <span className="text-xs text-secondary-text block">Open / Created</span>
              <span className="text-xl font-bold text-primary-text mt-1 block">
                {statusCounts.CREATED + statusCounts.NGO_MATCHED}
              </span>
            </div>
            <div className="p-3 bg-surface-container-low rounded-lg text-center border border-border/50">
              <span className="text-xs text-secondary-text block">Accepted by NGO</span>
              <span className="text-xl font-bold text-primary mt-1 block">
                {statusCounts.NGO_ACCEPTED + statusCounts.VOLUNTEER_ASSIGNED}
              </span>
            </div>
            <div className="p-3 bg-surface-container-low rounded-lg text-center border border-border/50">
              <span className="text-xs text-secondary-text block">In Transit</span>
              <span className="text-xl font-bold text-accent mt-1 block">
                {statusCounts.PICKED_UP}
              </span>
            </div>
            <div className="p-3 bg-surface-container-low rounded-lg text-center border border-border/50">
              <span className="text-xs text-secondary-text block">Delivered</span>
              <span className="text-xl font-bold text-success mt-1 block">
                {statusCounts.DELIVERED + statusCounts.RECEIPT_CONFIRMED}
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-surface border border-border text-xs text-secondary-text flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <XCircle size={14} className="text-danger" />
              Cancelled Listings:
            </span>
            <Badge variant={statusCounts.CANCELLED > 0 ? 'danger' : 'neutral'} size="sm">
              {statusCounts.CANCELLED}
            </Badge>
          </div>
        </Card>
      </div>

      {/* ───── Recent Donations Table ───── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-primary-text">Recent Food Donations</h2>
            <p className="text-xs text-secondary-text">Your latest 5 listings and current fulfillment stages</p>
          </div>
          <Link to="/donor/my-donations">
            <Button variant="outline" size="sm">
              View All ({donorDonations.length})
            </Button>
          </Link>
        </div>

        <Table
          columns={recentColumns}
          data={recentDonations}
          emptyState={
            <EmptyState
              icon={<Package size={48} className="text-primary" />}
              title="No donations published yet"
              description="Click 'Create Donation' to list your surplus food and begin feeding local communities."
              action={{
                label: 'Create Donation',
                onClick: () => (window.location.href = '/donor/create-donation'),
              }}
            />
          }
        />
      </Card>

      {/* Donation Details Modal */}
      <DonationDetailsModal
        donation={selectedDonation}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        currentUserId={user?.id}
      />
    </div>
  );
};

export default DonorDashboard;
