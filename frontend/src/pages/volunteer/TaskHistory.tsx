import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { TaskDetailsModal } from '../../components/volunteer/TaskDetailsModal';
import {
  History,
  Search,
  CheckCircle2,
  Calendar,
  MapPin,
  Eye,
  Building2,
  X,
  Package,
  Truck,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mockDataService } from '../../lib/mockDataService';
import type { Assignment } from '../../types/assignment';

const VolunteerTaskHistory: React.FC = () => {
  const { user } = useAuth();
  const volunteer = user ? mockDataService.getVolunteerByUserId(user.id) : undefined;

  const [historyTasks, setHistoryTasks] = useState<Assignment[]>(() =>
    user ? mockDataService.getVolunteerDeliveryHistory(user.id) : []
  );
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Filter and sort completed delivery history
  const filteredTasks = useMemo(() => {
    return historyTasks
      .filter((task) => {
        const donation = mockDataService.getDonationById(task.donationId);

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchFood = donation?.foodName.toLowerCase().includes(q) || false;
          const matchPickup = task.pickup.address.toLowerCase().includes(q);
          const matchNgo = task.delivery.ngoName.toLowerCase().includes(q);
          if (!matchFood && !matchPickup && !matchNgo) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = a.deliveredAt ? new Date(a.deliveredAt).getTime() : 0;
        const timeB = b.deliveredAt ? new Date(b.deliveredAt).getTime() : 0;
        return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [historyTasks, searchQuery, sortBy]);

  // Aggregate metrics calculated from unique deliveries
  const totalDeliveries = historyTasks.length;
  const completedDonationIds = Array.from(new Set(historyTasks.map((a) => a.donationId)));
  const allDonations = mockDataService.getDonations();
  const totalMealsDelivered = completedDonationIds.reduce((sum, donId) => {
    const donation = allDonations.find((d) => d.id === donId);
    return sum + (donation ? donation.numberOfServings || donation.quantity || 0 : 0);
  }, 0);

  const confirmedReceiptsCount = completedDonationIds.filter((donId) => {
    const donation = allDonations.find((d) => d.id === donId);
    return donation?.status === 'RECEIPT_CONFIRMED';
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery History"
        description="Archive of your completed food rescue runs and verified deliveries"
      />

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Truck size={22} />
          </div>
          <div>
            <span className="text-xs text-secondary-text block">Completed Deliveries</span>
            <span className="font-bold text-lg text-primary-text">{totalDeliveries}</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-success/10 text-success">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-xs text-secondary-text block">Meals Delivered</span>
            <span className="font-bold text-lg text-primary-text">
              {totalMealsDelivered.toLocaleString()}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-info/10 text-info">
            <FileCheck size={22} />
          </div>
          <div>
            <span className="text-xs text-secondary-text block">NGO Receipts Signed</span>
            <span className="font-bold text-lg text-primary-text">
              {confirmedReceiptsCount} / {completedDonationIds.length}
            </span>
          </div>
        </Card>
      </div>

      {/* Search and Sort Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text"
            />
            <input
              type="text"
              placeholder="Search by food item, donor pickup, shelter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="newest">Sort by Most Recent</option>
              <option value="oldest">Sort by Oldest First</option>
            </select>

            {searchQuery.trim() !== '' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="text-xs px-2.5 py-2 flex-shrink-0"
                title="Clear search"
              >
                <X size={14} />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Delivery History List */}
      {filteredTasks.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<History size={48} className="text-secondary-text" />}
            title={searchQuery.trim() !== '' ? 'No history matching search' : 'No completed deliveries yet'}
            description={
              searchQuery.trim() !== ''
                ? 'Try searching with different keywords.'
                : 'Completed delivery runs will be logged in your historical archive.'
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const donation = mockDataService.getDonationById(task.donationId);
            const ngo = mockDataService.getNGOById(task.ngoId);
            const isConfirmed = donation?.status === 'RECEIPT_CONFIRMED';

            return (
              <Card
                key={task.id}
                className="p-4 border border-border hover:border-primary/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-primary-text">
                        {donation?.foodName || 'Food Rescue Run'}
                      </h4>
                      <Badge variant="success" size="sm">
                        Delivered to Shelter
                      </Badge>
                      {isConfirmed && (
                        <Badge variant="success" size="sm" className="bg-success/20 text-success">
                          NGO Receipt Confirmed
                        </Badge>
                      )}
                      {donation?.category && (
                        <Badge variant="neutral" size="sm" className="capitalize">
                          {donation.category.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary-text">
                      <span className="font-semibold text-primary">
                        {donation ? `${donation.quantity} ${donation.unit}` : 'Package'}
                        {donation?.numberOfServings ? ` (~${donation.numberOfServings} servings)` : ''}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Building2 size={12} />
                        Delivered to: {ngo?.organizationName || task.delivery.ngoName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {task.deliveredAt
                          ? new Date(task.deliveredAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Completed'}
                      </span>
                    </div>

                    {task.notes && (
                      <p className="text-xs text-secondary-text italic pt-0.5">
                        Note: {task.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAssignment(task)}
                      className="text-xs"
                    >
                      <Eye size={14} className="mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Task Details Modal */}
      <TaskDetailsModal
        assignment={selectedAssignment}
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        currentVolunteerId={volunteer?.id}
      />
    </div>
  );
};

export default VolunteerTaskHistory;
