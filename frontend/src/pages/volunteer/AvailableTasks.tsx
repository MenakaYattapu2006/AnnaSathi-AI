import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { TaskDetailsModal } from '../../components/volunteer/TaskDetailsModal';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  Calendar,
  Eye,
  Building2,
  X,
  Truck,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, mapAssignmentFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import { Loading } from '../../components/common/Loading';
import type { Assignment } from '../../types/assignment';

const isProduction = Boolean((import.meta as any).env?.PROD);

const AvailableTasks: React.FC = () => {
  const { user } = useAuth();
  const volunteer = user ? mockDataService.getVolunteerByUserId(user.id) : undefined;

  const [availableTasks, setAvailableTasks] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'urgency' | 'expiry' | 'newest'>('urgency');

  const refreshTasks = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.volunteer.getAvailableTasks();
      if (response?.tasks) {
        setAvailableTasks(response.tasks.map(mapAssignmentFromDb));
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      if (isProduction) {
        setFeedback({ type: 'error', message: err.message || 'Failed to load available tasks from server.' });
        setIsLoading(false);
        return;
      }
    }

    setAvailableTasks(mockDataService.getAvailableAssignments());
    setIsLoading(false);
  };

  React.useEffect(() => {
    refreshTasks();
  }, [user]);

  const handleAcceptTask = async (assignmentId: string) => {
    if (!user) return;
    setFeedback(null);

    try {
      try {
        const response = await apiClient.volunteer.acceptAssignment(assignmentId);
        if (response?.success) {
          setFeedback({
            type: 'success',
            message: `Task claimed successfully! The delivery is now registered in your Assigned Tasks.`,
          });
          refreshTasks();
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setFeedback({ type: 'error', message: apiErr.message || 'Server error: Failed to accept assignment.' });
          return;
        }
      }

      const result = mockDataService.acceptAssignment(assignmentId, user.id);
      if (!result.success) {
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to claim task. It may have already been accepted.',
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Task claimed successfully! The delivery is now registered in your Assigned Tasks.`,
        });
      }
      refreshTasks();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to claim task.' });
    }
  };

  // Filter and sort available tasks
  const filteredTasks = useMemo(() => {
    return availableTasks
      .filter((task) => {
        const donation = mockDataService.getDonationById(task.donationId);

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchFood = donation?.foodName.toLowerCase().includes(q) || false;
          const matchPickup = task.pickup.address.toLowerCase().includes(q);
          const matchDrop = `${task.delivery.address} ${task.delivery.ngoName}`
            .toLowerCase()
            .includes(q);
          if (!matchFood && !matchPickup && !matchDrop) return false;
        }

        if (categoryFilter !== 'all' && donation && donation.category !== categoryFilter) {
          return false;
        }

        if (urgencyFilter !== 'all' && donation && donation.urgencyLevel !== urgencyFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const donA = mockDataService.getDonationById(a.donationId);
        const donB = mockDataService.getDonationById(b.donationId);

        if (sortBy === 'urgency') {
          return (donB?.urgencyScore || 0) - (donA?.urgencyScore || 0);
        }
        if (sortBy === 'expiry') {
          const expA = donA ? new Date(donA.expiryTime).getTime() : 0;
          const expB = donB ? new Date(donB.expiryTime).getTime() : 0;
          return expA - expB;
        }
        if (sortBy === 'newest') {
          const timeA = new Date(a.assignedAt || 0).getTime();
          const timeB = new Date(b.assignedAt || 0).getTime();
          return timeB - timeA;
        }
        return 0;
      });
  }, [availableTasks, searchQuery, categoryFilter, urgencyFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || categoryFilter !== 'all' || urgencyFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setUrgencyFilter('all');
    setSortBy('urgency');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Available Delivery Tasks"
        description="Surplus food rescue runs ready for volunteer pickup and transport to shelters"
      />

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-start justify-between gap-3 border ${
            feedback.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-danger/10 border-danger/30 text-danger'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-medium">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-current hover:opacity-75 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text"
            />
            <input
              type="text"
              placeholder="Search food, pickup, shelter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary capitalize"
            >
              <option value="all">All Food Categories</option>
              <option value="cooked_meals">Cooked Meals</option>
              <option value="raw_groceries">Raw Groceries</option>
              <option value="bakery_items">Bakery Items</option>
              <option value="packaged_food">Packaged Food</option>
              <option value="fruits_vegetables">Fruits & Vegetables</option>
              <option value="dairy_products">Dairy Products</option>
            </select>
          </div>

          <div>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary capitalize"
            >
              <option value="all">All Urgency Levels</option>
              <option value="critical">Critical Urgency (&gt;85)</option>
              <option value="high">High Urgency (70–84)</option>
              <option value="medium">Medium Urgency (40–69)</option>
              <option value="low">Low Urgency (&lt;40)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="urgency">Sort by Highest Urgency</option>
              <option value="expiry">Sort by Earliest Expiry</option>
              <option value="newest">Sort by Newest Tasks</option>
            </select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs px-2.5 py-2 flex-shrink-0"
                title="Clear all filters"
              >
                <X size={14} />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Available Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<Truck size={48} className="text-secondary-text" />}
            title={hasActiveFilters ? 'No tasks match your filters' : 'No available tasks currently'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search query or clearing active category filters.'
                : 'All surplus donations have active volunteer dispatches. Please check back shortly for newly accepted listings.'
            }
            action={
              hasActiveFilters
                ? {
                    label: 'Clear Filters',
                    onClick: clearFilters,
                  }
                : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const donation = mockDataService.getDonationById(task.donationId);
            const donor = donation ? mockDataService.getUserById(donation.donorId) : undefined;
            const ngo = mockDataService.getNGOById(task.ngoId);

            const urgencyVariant =
              donation?.urgencyLevel === 'critical'
                ? 'danger'
                : donation?.urgencyLevel === 'high'
                ? 'warning'
                : donation?.urgencyLevel === 'medium'
                ? 'info'
                : 'neutral';

            return (
              <Card
                key={task.id}
                className="p-5 flex flex-col justify-between border border-border hover:border-primary/50 transition-all hover:shadow-md"
              >
                <div className="space-y-3">
                  {/* Top: Title & Urgency */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-primary-text">
                        {donation?.foodName || 'Surplus Food Rescue'}
                      </h3>
                      <p className="text-xs text-secondary-text capitalize mt-0.5">
                        Category: {donation?.category.replace(/_/g, ' ') || 'Food Package'} •{' '}
                        {donation?.dietaryType || 'Veg'}
                      </p>
                    </div>

                    <Badge variant={urgencyVariant} size="sm" className="capitalize flex-shrink-0">
                      {donation?.urgencyLevel || 'Medium'} ({donation?.urgencyScore || 50}/100)
                    </Badge>
                  </div>

                  {/* Quantity and Deadline */}
                  <div className="bg-surface-container-low p-2.5 rounded-md flex items-center justify-between text-xs">
                    <span className="text-secondary-text">Rescue Volume:</span>
                    <span className="font-bold text-sm text-primary">
                      {donation ? `${donation.quantity} ${donation.unit}` : '1 Package'}
                      {donation?.numberOfServings ? ` (~${donation.numberOfServings} meals)` : ''}
                    </span>
                  </div>

                  {/* Route Overview */}
                  <div className="space-y-2 text-xs pt-1 border-t border-border">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-secondary-text block text-[11px]">Pickup Location:</span>
                        <span className="font-medium text-primary-text">
                          {task.pickup.address}
                        </span>
                        <span className="text-secondary-text block text-[11px]">
                          Contact: {task.pickup.contactPerson}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-success flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-secondary-text block text-[11px]">Delivery Shelter:</span>
                        <span className="font-medium text-primary-text">
                          {ngo?.organizationName || task.delivery.ngoName}
                        </span>
                        <span className="text-secondary-text block text-[11px]">
                          {task.delivery.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expiry Clock */}
                  <div className="flex items-center gap-1.5 text-xs text-secondary-text pt-2 border-t border-border">
                    <Clock size={13} className="text-warning flex-shrink-0" />
                    <span>
                      Expiry:{' '}
                      {donation
                        ? new Date(donation.expiryTime).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Urgent'}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAssignment(task)}
                    className="text-xs"
                  >
                    <Eye size={14} className="mr-1" />
                    Details
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleAcceptTask(task.id)}
                    className="text-xs"
                  >
                    <CheckCircle2 size={14} className="mr-1" />
                    Accept Task
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details & Acceptance Modal */}
      <TaskDetailsModal
        assignment={selectedAssignment}
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        onAccept={handleAcceptTask}
        currentVolunteerId={volunteer?.id}
      />
    </div>
  );
};

export default AvailableTasks;
