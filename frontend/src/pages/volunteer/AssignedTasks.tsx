import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { TaskDetailsModal } from '../../components/volunteer/TaskDetailsModal';
import { RouteMapModal } from '../../components/volunteer/RouteMapModal';
import {
  Truck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  Eye,
  Building2,
  X,
  Package,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, mapAssignmentFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import { Loading } from '../../components/common/Loading';
import { resolveAddressCoordinates } from '../../utils/geocoding';
import type { Assignment, AssignmentStatus } from '../../types/assignment';

const isProduction = Boolean((import.meta as any).env?.PROD);

const statusBadgeMap: Record<
  AssignmentStatus,
  { variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; label: string }
> = {
  available: { variant: 'info', label: 'Available' },
  assigned: { variant: 'info', label: 'Assigned (Pending Pickup)' },
  in_transit_to_pickup: { variant: 'warning', label: 'En Route to Pickup' },
  picked_up: { variant: 'warning', label: 'Picked Up (In Transit)' },
  in_transit_to_drop: { variant: 'warning', label: 'In Transit to Shelter' },
  delivered: { variant: 'success', label: 'Delivered' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
};

const AssignedTasks: React.FC = () => {
  const { user } = useAuth();
  const volunteer = user ? mockDataService.getVolunteerByUserId(user.id) : undefined;

  const [myTasks, setMyTasks] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [mapTask, setMapTask] = useState<Assignment | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Volunteer Live Location (GPS or registered profile address)
  const [volunteerLocation, setVolunteerLocation] = useState<
    { latitude: number; longitude: number; label?: string; address?: string; isRealGps?: boolean } | undefined
  >(undefined);

  // Status Filter Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'pending_pickup' | 'in_transit' | 'delivered'>('all');

  // Detect live GPS location on mount, or fall back to volunteer's registered address
  React.useEffect(() => {
    let resolved = false;

    const setFromRegisteredAddress = async () => {
      const parts = [
        user?.profile?.address,
        user?.profile?.city,
        user?.profile?.state,
        user?.profile?.pincode,
      ].filter(Boolean);
      const volAddr = parts.join(', ');

      if (volAddr) {
        try {
          const coords = await resolveAddressCoordinates(volAddr);
          if (!resolved) {
            setVolunteerLocation({
              latitude: coords.latitude,
              longitude: coords.longitude,
              address: volAddr,
              label: `${user?.name || 'Volunteer Location'} (${volAddr})`,
              isRealGps: false,
            });
          }
        } catch {
          if (!resolved) {
            setVolunteerLocation({
              latitude: 0,
              longitude: 0,
              address: volAddr,
              label: volAddr,
              isRealGps: false,
            });
          }
        }
      }
    };

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolved = true;
          setVolunteerLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            label: 'Your Live Location (GPS)',
            isRealGps: true,
          });
        },
        () => {
          // Fall back to volunteer registered address
          setFromRegisteredAddress();
        },
        { timeout: 5000 }
      );
    } else {
      setFromRegisteredAddress();
    }
  }, [user]);

  const refreshTasks = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.volunteer.getAssignedTasks();
      if (response?.tasks) {
        setMyTasks(response.tasks.map(mapAssignmentFromDb));
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      if (isProduction) {
        setFeedback({ type: 'error', message: err.message || 'Failed to load assigned tasks from server.' });
        setIsLoading(false);
        return;
      }
    }

    if (user) {
      setMyTasks(mockDataService.getAssignmentsByVolunteer(user.id));
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    refreshTasks();
  }, [user]);

  const handlePickup = async (assignmentId: string, notes?: string) => {
    if (!user) return;
    setFeedback(null);
    setUpdatingId(assignmentId);

    try {
      try {
        const response = await apiClient.volunteer.pickupAssignment(assignmentId, notes);
        if (response?.success) {
          setFeedback({
            type: 'success',
            message: 'Food marked as picked up! Status updated to Picked Up (In Transit).',
          });
          setSelectedAssignment(null);
          await refreshTasks();
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setFeedback({ type: 'error', message: apiErr.message || 'Server error: Failed to record pickup.' });
          return;
        }
      }

      const result = mockDataService.pickupAssignment(assignmentId, user.id, notes);
      if (!result.success) {
        setFeedback({ type: 'error', message: result.error || 'Failed to update pickup status.' });
      } else {
        setFeedback({
          type: 'success',
          message: 'Food marked as picked up! Status updated to Picked Up (In Transit).',
        });
        setSelectedAssignment(null);
        await refreshTasks();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update pickup status.' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeliver = async (assignmentId: string, deliveryNotes?: string) => {
    if (!user) return;
    setFeedback(null);
    setUpdatingId(assignmentId);

    try {
      try {
        const response = await apiClient.volunteer.deliverAssignment(assignmentId, deliveryNotes);
        if (response?.success) {
          setFeedback({
            type: 'success',
            message: 'Delivery marked as complete! Awaiting NGO final receipt confirmation.',
          });
          setSelectedAssignment(null);
          await refreshTasks();
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setFeedback({ type: 'error', message: apiErr.message || 'Server error: Failed to record delivery.' });
          return;
        }
      }

      const result = mockDataService.deliverAssignment(assignmentId, user.id, deliveryNotes);
      if (!result.success) {
        setFeedback({ type: 'error', message: result.error || 'Failed to update delivery status.' });
      } else {
        setFeedback({
          type: 'success',
          message: 'Delivery marked as complete! Awaiting NGO final receipt confirmation.',
        });
        setSelectedAssignment(null);
        await refreshTasks();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update delivery status.' });
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter tasks based on active tab
  const filteredTasks = useMemo(() => {
    return myTasks.filter((task) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'pending_pickup') {
        return task.status === 'assigned' || task.status === 'in_transit_to_pickup';
      }
      if (activeTab === 'in_transit') {
        return task.status === 'picked_up' || task.status === 'in_transit_to_drop';
      }
      if (activeTab === 'delivered') {
        return task.status === 'delivered';
      }
      return true;
    });
  }, [myTasks, activeTab]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Assigned Tasks"
        description="Delivery tasks claimed by you: manage pickup verification and shelter drop-offs"
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

      {/* Filter Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-md transition-colors ${
            activeTab === 'all'
              ? 'border-b-2 border-primary text-primary bg-primary/5'
              : 'text-secondary-text hover:text-primary-text'
          }`}
        >
          All Tasks ({myTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('pending_pickup')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-md transition-colors ${
            activeTab === 'pending_pickup'
              ? 'border-b-2 border-primary text-primary bg-primary/5'
              : 'text-secondary-text hover:text-primary-text'
          }`}
        >
          Pending Pickup (
          {myTasks.filter((t) => t.status === 'assigned' || t.status === 'in_transit_to_pickup').length}
          )
        </button>
        <button
          onClick={() => setActiveTab('in_transit')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-md transition-colors ${
            activeTab === 'in_transit'
              ? 'border-b-2 border-primary text-primary bg-primary/5'
              : 'text-secondary-text hover:text-primary-text'
          }`}
        >
          In Transit (
          {myTasks.filter((t) => t.status === 'picked_up' || t.status === 'in_transit_to_drop').length}
          )
        </button>
        <button
          onClick={() => setActiveTab('delivered')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-md transition-colors ${
            activeTab === 'delivered'
              ? 'border-b-2 border-primary text-primary bg-primary/5'
              : 'text-secondary-text hover:text-primary-text'
          }`}
        >
          Delivered ({myTasks.filter((t) => t.status === 'delivered').length})
        </button>
      </div>

      {/* Task Cards List */}
      {filteredTasks.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<Truck size={48} className="text-secondary-text" />}
            title="No tasks in this category"
            description="You have no tasks matching this filter tab. Browse Available Tasks to claim new deliveries."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const donation = mockDataService.getDonationById(task.donationId);
            const ngo = mockDataService.getNGOById(task.ngoId);
            const conf = statusBadgeMap[task.status] || {
              variant: 'neutral',
              label: task.status,
            };

            const canPickup = task.status === 'assigned' || task.status === 'in_transit_to_pickup';
            const canDeliver = task.status === 'picked_up' || task.status === 'in_transit_to_drop';

            return (
              <Card
                key={task.id}
                className="p-5 border border-border hover:border-primary/40 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Side: Food & Route Details */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-base text-primary-text">
                        {donation?.foodName || 'Food Rescue Task'}
                      </h3>
                      <Badge variant={conf.variant} size="sm">
                        {conf.label}
                      </Badge>
                      {donation?.category && (
                        <Badge variant="neutral" size="sm" className="capitalize">
                          {donation.category.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>

                    {/* Route Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-surface-container-low p-3 rounded-md space-y-1">
                        <span className="font-semibold text-secondary-text block uppercase text-[10px] flex items-center gap-1">
                          <MapPin size={12} className="text-primary" />
                          <span>Pickup Point (Donor)</span>
                        </span>
                        <p className="font-medium text-primary-text">{task.pickup.address}</p>
                        <p className="text-secondary-text">
                          Contact: {task.pickup.contactPerson} ({task.pickup.contactPhone})
                        </p>
                        {task.pickup.verificationOtp && (
                          <p className="text-[11px] text-primary font-mono pt-1">
                            Pickup OTP: <strong>{task.pickup.verificationOtp}</strong>
                          </p>
                        )}
                      </div>

                      <div className="bg-surface-container-low p-3 rounded-md space-y-1">
                        <span className="font-semibold text-secondary-text block uppercase text-[10px] flex items-center gap-1">
                          <Building2 size={12} className="text-primary" />
                          <span>Delivery Destination (Shelter)</span>
                        </span>
                        <p className="font-medium text-primary-text">
                          {ngo?.organizationName || task.delivery.ngoName}
                        </p>
                        <p className="text-secondary-text">{task.delivery.address}</p>
                        <p className="text-secondary-text">
                          Receiver: {task.delivery.contactPerson} ({task.delivery.contactPhone})
                        </p>
                      </div>
                    </div>

                    {/* Timestamps & Food Volume */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary-text pt-1">
                      <span className="font-bold text-primary">
                        {donation ? `${donation.quantity} ${donation.unit}` : 'Food Package'}
                        {donation?.numberOfServings ? ` (~${donation.numberOfServings} servings)` : ''}
                      </span>
                      <span>•</span>
                      <span>
                        Assigned on{' '}
                        {new Date(task.assignedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {task.pickedUpAt && (
                        <>
                          <span>•</span>
                          <span className="text-warning">
                            Picked up:{' '}
                            {new Date(task.pickedUpAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </>
                      )}
                      {task.deliveredAt && (
                        <>
                          <span>•</span>
                          <span className="text-success font-medium">
                            Delivered:{' '}
                            {new Date(task.deliveredAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Interactive Action Buttons */}
                  <div className="flex sm:flex-row lg:flex-col items-end justify-end gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMapTask(task)}
                      className="text-xs w-full sm:w-auto text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                    >
                      <MapPin size={14} className="mr-1" />
                      Route Map
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAssignment(task)}
                      className="text-xs w-full sm:w-auto"
                    >
                      <Eye size={14} className="mr-1" />
                      View Details
                    </Button>

                    {canPickup && (
                      <Button
                        size="sm"
                        onClick={() => handlePickup(task.id)}
                        disabled={updatingId === task.id}
                        className="text-xs w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      >
                        <Truck size={14} className="mr-1" />
                        {updatingId === task.id ? 'Marking Picked Up...' : 'Mark Picked Up'}
                      </Button>
                    )}

                    {canDeliver && (
                      <Button
                        size="sm"
                        onClick={() => handleDeliver(task.id)}
                        disabled={updatingId === task.id}
                        className="text-xs w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                      >
                        <CheckCircle2 size={14} className="mr-1" />
                        {updatingId === task.id ? 'Marking Delivered...' : 'Mark Delivered'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Task Details & Status Confirmation Modal */}
      <TaskDetailsModal
        assignment={selectedAssignment}
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        onPickup={handlePickup}
        onDeliver={handleDeliver}
        currentVolunteerId={volunteer?.id}
      />

      {/* Leaflet Route Map Modal + Google Maps Navigation */}
      <RouteMapModal
        task={mapTask}
        isOpen={!!mapTask}
        onClose={() => setMapTask(null)}
        volunteerLocation={volunteerLocation}
      />
    </div>
  );
};

export default AssignedTasks;
