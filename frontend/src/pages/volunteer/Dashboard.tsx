import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DashboardStatCard } from '../../components/common/DashboardStatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { TaskDetailsModal } from '../../components/volunteer/TaskDetailsModal';
import {
  ClipboardList,
  ClipboardCheck,
  Clock,
  Truck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowRight,
  User,
  ShieldCheck,
  Star,
  Package,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, mapVolunteerFromDb, mapAssignmentFromDb, mapDonationFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import type { Volunteer } from '../../types/volunteer';
import type { Assignment, AssignmentStatus } from '../../types/assignment';

const isProduction = Boolean((import.meta as any).env?.PROD);

const statusBadgeMap: Record<
  AssignmentStatus,
  { variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; label: string }
> = {
  available: { variant: 'info', label: 'Available' },
  assigned: { variant: 'info', label: 'Assigned (Pending Pickup)' },
  in_transit_to_pickup: { variant: 'warning', label: 'En Route to Pickup' },
  picked_up: { variant: 'warning', label: 'In Transit to Shelter' },
  in_transit_to_drop: { variant: 'warning', label: 'In Transit to Drop' },
  delivered: { variant: 'success', label: 'Delivered' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
};

const VolunteerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [volunteer, setVolunteer] = useState<Volunteer | undefined>(undefined);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [stats, setStats] = useState({
    availableTasksCount: 0,
    activeTasksCount: 0,
    completedTasksCount: 0,
    totalMealsDelivered: 0,
    recentAssignments: [] as Assignment[],
    statusDistribution: [] as { status: AssignmentStatus; count: number }[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);

  const handleToggleAvailability = async () => {
    const currentIsAvailable = volunteer?.availability === 'available';
    const nextAvailability = currentIsAvailable ? 'offline' : 'available';

    setIsTogglingAvailability(true);
    setFeedback(null);
    try {
      const res = await apiClient.volunteer.updateAvailability(nextAvailability);
      if (res?.success) {
        setVolunteer((prev) => (prev ? { ...prev, availability: nextAvailability } : prev));
        setFeedback({
          type: 'success',
          message:
            nextAvailability === 'available'
              ? 'You are now Online & Available! Live tasks will be visible.'
              : 'You are now Offline. You will not receive available tasks until you toggle back to available.',
        });
        await loadData();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to update availability status.',
      });
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const volRes = await apiClient.volunteer.getMe().catch(() => null);
      if (volRes?.volunteer) {
        setVolunteer(mapVolunteerFromDb(volRes.volunteer));
      }

      const [availRes, myTasksRes] = await Promise.all([
        apiClient.volunteer.getAvailableTasks().catch(() => ({ tasks: [] })),
        apiClient.volunteer.getAssignedTasks().catch(() => ({ tasks: [] })),
      ]);

      if (myTasksRes?.tasks) {
        const myTasks: Assignment[] = myTasksRes.tasks.map(mapAssignmentFromDb);
        const activeCount = myTasks.filter((t) =>
          ['assigned', 'in_transit_to_pickup', 'picked_up', 'in_transit_to_drop'].includes(t.status)
        ).length;
        const completedCount = myTasks.filter((t) => t.status === 'delivered').length;

        setStats({
          availableTasksCount: (availRes?.tasks || []).length,
          activeTasksCount: activeCount,
          completedTasksCount: completedCount,
          totalMealsDelivered: (volRes?.volunteer?.total_deliveries_completed || 0) * 50,
          recentAssignments: myTasks.slice(0, 5),
          statusDistribution: [],
        });
        setIsLoading(false);
        return;
      }
    } catch {
      if (isProduction) {
        setIsLoading(false);
        return;
      }
    }

    if (user) {
      setVolunteer(mockDataService.getVolunteerByUserId(user.id));
      setStats(mockDataService.getVolunteerDashboardStats(user.id));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePickup = async (assignmentId: string, notes?: string) => {
    setIsUpdating(true);
    setFeedback(null);
    try {
      try {
        const res = await apiClient.volunteer.pickupAssignment(assignmentId, notes);
        if (res?.success) {
          setFeedback({
            type: 'success',
            message: 'Food marked as picked up! Status updated to In Transit to Shelter.',
          });
          setSelectedAssignment(null);
          await loadData();
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setFeedback({ type: 'error', message: apiErr.message || 'Server error: Failed to record pickup.' });
          return;
        }
      }

      if (user) {
        const result = mockDataService.pickupAssignment(assignmentId, user.id, notes);
        if (result.success) {
          setFeedback({
            type: 'success',
            message: 'Food marked as picked up! Status updated to In Transit to Shelter.',
          });
        } else {
          setFeedback({ type: 'error', message: result.error || 'Failed to record pickup.' });
        }
      }
      setSelectedAssignment(null);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to record pickup.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeliver = async (assignmentId: string, notes?: string) => {
    setIsUpdating(true);
    setFeedback(null);
    try {
      try {
        const res = await apiClient.volunteer.deliverAssignment(assignmentId, notes);
        if (res?.success) {
          setFeedback({
            type: 'success',
            message: 'Delivery marked as complete! Awaiting NGO final confirmation.',
          });
          setSelectedAssignment(null);
          await loadData();
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setFeedback({ type: 'error', message: apiErr.message || 'Server error: Failed to record delivery.' });
          return;
        }
      }

      if (user) {
        const result = mockDataService.deliverAssignment(assignmentId, user.id, notes);
        if (result.success) {
          setFeedback({
            type: 'success',
            message: 'Delivery marked as complete! Awaiting NGO final confirmation.',
          });
        } else {
          setFeedback({ type: 'error', message: result.error || 'Failed to record delivery.' });
        }
      }
      setSelectedAssignment(null);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to record delivery.' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Find active task currently in progress
  const activeTask = stats.recentAssignments.find((a) =>
    ['assigned', 'in_transit_to_pickup', 'picked_up', 'in_transit_to_drop'].includes(a.status)
  );

  const activeDonation = activeTask
    ? ((activeTask as any).donation || mockDataService.getDonationById(activeTask.donationId))
    : undefined;

  const vehicleLabelMap: Record<string, string> = {
    two_wheeler: 'Two-Wheeler / Bike',
    four_wheeler: 'Car / 4-Wheeler',
    van: 'Cargo Van',
    none: 'On Foot',
  };

  return (
    <div className="space-y-6">
      {/* Header with Volunteer Greeting & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader
          title="Volunteer Dashboard"
          description={`Welcome back, ${volunteer?.name || user?.name || 'Food Hero'}`}
          className="mb-0"
        />
        <div className="flex items-center gap-3">
          {/* Availability Toggle Switch */}
          <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-lg">
            <span className="text-xs font-medium text-secondary-text">Status:</span>
            <button
              type="button"
              onClick={handleToggleAvailability}
              disabled={isTogglingAvailability}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                volunteer?.availability === 'available' ? 'bg-success' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              title="Toggle Online/Offline Availability"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  volunteer?.availability === 'available' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-semibold ${volunteer?.availability === 'available' ? 'text-success' : 'text-secondary-text'}`}>
              {volunteer?.availability === 'available' ? 'Available' : 'Unavailable / Offline'}
            </span>
          </div>

          {volunteer?.vehicleType && (
            <Badge variant="neutral" size="md" className="flex items-center gap-1 px-3 py-1.5">
              <Truck size={14} />
              <span>{vehicleLabelMap[volunteer.vehicleType] || volunteer.vehicleType}</span>
            </Badge>
          )}
        </div>
      </div>

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

      {/* Active Task Banner Alert */}
      {activeTask && (
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-primary text-white flex-shrink-0 mt-0.5">
              <Truck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-primary tracking-wide">
                  Active Delivery In Progress
                </span>
                <Badge variant="warning" size="sm">
                  {statusBadgeMap[activeTask.status]?.label || activeTask.status}
                </Badge>
              </div>
              <h4 className="font-bold text-base text-primary-text mt-0.5">
                {activeTask.foodName || activeDonation?.foodName || 'Assigned Food Package'}
              </h4>
              <p className="text-xs text-secondary-text mt-0.5">
                Pickup: {activeTask.pickup.address} &rarr; Destination: {activeTask.delivery.address}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
            {activeTask.status === 'assigned' || activeTask.status === 'in_transit_to_pickup' ? (
              <Button
                size="sm"
                onClick={() => handlePickup(activeTask.id)}
                disabled={isUpdating}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold shadow-xs"
              >
                <Truck size={14} className="mr-1.5" />
                {isUpdating ? 'Marking Picked Up...' : 'Mark Picked Up'}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleDeliver(activeTask.id)}
                disabled={isUpdating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
              >
                <CheckCircle2 size={14} className="mr-1.5" />
                {isUpdating ? 'Marking Delivered...' : 'Mark Delivered'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedAssignment(activeTask)}
            >
              Update Progress
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/volunteer/assigned')}
            >
              My Tasks
            </Button>
          </div>
        </div>
      )}

      {/* Dynamic Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Available Tasks"
          value={stats.availableTasksCount}
          icon={<ClipboardList size={24} />}
          description={
            stats.availableTasksCount > 0
              ? `${stats.availableTasksCount} task${stats.availableTasksCount === 1 ? '' : 's'} waiting for pickup`
              : 'No open tasks nearby'
          }
          badgeVariant="info"
        />
        <DashboardStatCard
          title="Active Deliveries"
          value={stats.activeTasksCount}
          icon={<Clock size={24} />}
          description="In pickup or transport"
          badgeVariant="warning"
        />
        <DashboardStatCard
          title="Completed Deliveries"
          value={stats.completedTasksCount}
          icon={<ClipboardCheck size={24} />}
          description={`${volunteer?.totalDeliveriesCompleted || stats.completedTasksCount} lifetime runs`}
          badgeVariant="success"
        />
        <DashboardStatCard
          title="Meals Delivered"
          value={stats.totalMealsDelivered.toLocaleString()}
          icon={<Package size={24} />}
          description="Rescued and delivered"
          badgeVariant="success"
        />
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/volunteer/available')}
          className="flex items-center gap-1.5"
        >
          <ClipboardList size={16} />
          <span>Browse Available Tasks ({stats.availableTasksCount})</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/volunteer/assigned')}
          className="flex items-center gap-1.5"
        >
          <Truck size={16} />
          <span>My Active Tasks ({stats.activeTasksCount})</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/volunteer/history')}
          className="flex items-center gap-1.5"
        >
          <ClipboardCheck size={16} />
          <span>Delivery History ({stats.completedTasksCount})</span>
        </Button>
      </div>

      {/* Main Grid: Recent Activity & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-base text-primary-text">Recent Delivery Tasks</h3>
                <p className="text-xs text-secondary-text">
                  Your claimed deliveries and food rescue dispatches
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/volunteer/assigned')}
                className="text-xs"
              >
                <span>View All</span>
                <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>

            {stats.recentAssignments.length === 0 ? (
              <EmptyState
                icon={<Truck size={40} className="text-secondary-text" />}
                title="No assigned tasks yet"
                description="You currently have no tasks assigned. Browse available food rescue dispatches to start delivering."
                action={{
                  label: 'Browse Available Tasks',
                  onClick: () => navigate('/volunteer/available'),
                }}
              />
            ) : (
              <div className="space-y-3">
                {stats.recentAssignments.slice(0, 5).map((asgn) => {
                  const don = mockDataService.getDonationById(asgn.donationId);
                  const conf = statusBadgeMap[asgn.status] || {
                    variant: 'neutral',
                    label: asgn.status,
                  };

                  return (
                    <div
                      key={asgn.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-surface-container-low rounded-lg border border-border/60 hover:border-border transition-colors gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-primary-text">
                            {don?.foodName || 'Food Rescue Package'}
                          </span>
                          <Badge variant={conf.variant} size="sm">
                            {conf.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary-text">
                          <span className="font-medium text-primary">
                            {don ? `${don.quantity} ${don.unit}` : 'Package'}
                            {don?.numberOfServings ? ` (~${don.numberOfServings} servings)` : ''}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            To: {asgn.delivery.ngoName}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(asgn.assignedAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAssignment(asgn)}
                        className="text-xs self-end sm:self-center"
                      >
                        <Eye size={14} className="mr-1" />
                        Details
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Status Breakdown & Profile Snapshot */}
        <div className="space-y-6">
          {/* Volunteer Status & Impact Snapshot Card */}
          <Card className="p-5">
            <h3 className="font-bold text-base text-primary-text mb-1">Volunteer Profile</h3>
            <p className="text-xs text-secondary-text mb-4">
              Registered dispatch credentials
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-xs text-secondary-text">Volunteer Rating</span>
                <span className="font-bold text-primary flex items-center gap-1">
                  <Star size={15} className="fill-warning text-warning" />
                  <span>{volunteer?.rating ? volunteer.rating.toFixed(1) : '4.9'} / 5.0</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-xs text-secondary-text">Registered Vehicle</span>
                <span className="font-medium text-primary-text text-xs">
                  {volunteer?.vehicleType ? vehicleLabelMap[volunteer.vehicleType] : 'Bike'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-xs text-secondary-text">Service Areas</span>
                <span className="font-medium text-primary-text text-xs text-right max-w-[160px] truncate">
                  {volunteer?.serviceArea?.join(', ') || [user?.profile?.city || (user as any)?.city, user?.profile?.pincode || (user as any)?.pincode].filter(Boolean).join(' - ') || 'Local Area'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-secondary-text">Member Since</span>
                <span className="font-medium text-primary-text text-xs">
                  {volunteer?.createdAt
                    ? new Date(volunteer.createdAt).toLocaleDateString([], {
                        month: 'short',
                        year: 'numeric',
                      })
                    : '2026'}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4 text-xs"
              onClick={() => navigate('/volunteer/profile')}
            >
              Edit Volunteer Profile
            </Button>
          </Card>

          {/* Task Status Distribution */}
          <Card className="p-5">
            <h3 className="font-bold text-base text-primary-text mb-1">Task Distribution</h3>
            <p className="text-xs text-secondary-text mb-4">
              Breakdown of your dispatch workload
            </p>

            {stats.statusDistribution.length === 0 ? (
              <p className="text-xs text-secondary-text text-center py-4">
                No tasks recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.statusDistribution.map((item) => {
                  const total = stats.recentAssignments.length || 1;
                  const pct = Math.round((item.count / total) * 100);
                  const conf = statusBadgeMap[item.status as AssignmentStatus] || { label: item.status, variant: 'neutral' as const };

                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-primary-text capitalize">
                          {conf.label}
                        </span>
                        <span className="text-secondary-text">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        assignment={selectedAssignment}
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        onPickup={handlePickup}
        onDeliver={handleDeliver}
        currentVolunteerId={volunteer?.id}
      />
    </div>
  );
};

export default VolunteerDashboard;




