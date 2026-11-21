import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { TaskDetailsModal } from '../../components/volunteer/TaskDetailsModal';
import { RouteMapModal } from '../../components/volunteer/RouteMapModal';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  Eye,
  Truck,
  X,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, mapAssignmentFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import { resolveAddressCoordinates } from '../../utils/geocoding';
import type { Assignment } from '../../types/assignment';

const isProduction = Boolean((import.meta as any).env?.PROD);

const AvailableTasks: React.FC = () => {
  const { user } = useAuth();
  const volunteer = user ? mockDataService.getVolunteerByUserId(user.id) : undefined;

  const [availableTasks, setAvailableTasks] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [mapTask, setMapTask] = useState<Assignment | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Volunteer Live Location (GPS or registered profile address)
  const [volunteerLocation, setVolunteerLocation] = useState<
    { latitude: number; longitude: number; label?: string; address?: string; isRealGps?: boolean } | undefined
  >(undefined);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'urgency' | 'expiry' | 'newest'>('urgency');

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
    setAcceptingId(assignmentId);

    try {
      try {
        const response = await apiClient.volunteer.acceptAssignment(assignmentId);
        if (response?.success) {
          // Immediately remove task from available list
          setAvailableTasks((prev) => prev.filter((t) => t.id !== assignmentId));
          setSelectedAssignment(null);
          setMapTask(null);
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
        setAvailableTasks((prev) => prev.filter((t) => t.id !== assignmentId));
        setSelectedAssignment(null);
        setMapTask(null);
        setFeedback({
          type: 'success',
          message: `Task claimed successfully! The delivery is now registered in your Assigned Tasks.`,
        });
      }
      refreshTasks();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to claim task.' });
    } finally {
      setAcceptingId(null);
    }
  };

  // Filter and sort available tasks
  const filteredTasks = useMemo(() => {
    return availableTasks
      .filter((task) => {
        const donation = mockDataService.getDonationById(task.donationId);
        const foodName = task.foodName || donation?.foodName || '';
        const category = task.category || donation?.category || '';
        const urgencyLevel = task.urgencyLevel || donation?.urgencyLevel || '';

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchFood = foodName.toLowerCase().includes(q);
          const matchPickup = task.pickup.address.toLowerCase().includes(q);
          const matchDrop = `${task.delivery.address} ${task.delivery.ngoName}`
            .toLowerCase()
            .includes(q);
          if (!matchFood && !matchPickup && !matchDrop) return false;
        }

        if (categoryFilter !== 'all' && category && category !== categoryFilter) {
          return false;
        }

        if (urgencyFilter !== 'all' && urgencyLevel && urgencyLevel !== urgencyFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const donA = mockDataService.getDonationById(a.donationId);
        const donB = mockDataService.getDonationById(b.donationId);

        const scoreA = a.urgencyScore ?? donA?.urgencyScore ?? 50;
        const scoreB = b.urgencyScore ?? donB?.urgencyScore ?? 50;

        if (sortBy === 'urgency') {
          return scoreB - scoreA;
        }
        if (sortBy === 'expiry') {
          const expA = new Date(a.expiryTime || donA?.expiryTime || 0).getTime();
          const expB = new Date(b.expiryTime || donB?.expiryTime || 0).getTime();
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
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-grow">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text"
            />
            <input
              type="text"
              placeholder="Search by food name, donor address, or destination shelter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-surface border border-border rounded-lg text-xs font-medium text-primary-text focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Categories</option>
              <option value="cooked_meals">Cooked Meals</option>
              <option value="bakery_items">Bakery Items</option>
              <option value="fruits_vegetables">Produce & Fruits</option>
              <option value="packaged_groceries">Groceries</option>
              <option value="dairy_products">Dairy</option>
            </select>

            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="px-3 py-2 bg-surface border border-border rounded-lg text-xs font-medium text-primary-text focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Urgency</option>
              <option value="critical">Critical (≤2h)</option>
              <option value="high">High (≤4h)</option>
              <option value="medium">Medium (≤8h)</option>
              <option value="low">Low (&gt;8h)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-surface border border-border rounded-lg text-xs font-medium text-primary-text focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="urgency">Sort by Urgency</option>
              <option value="expiry">Sort by Expiry</option>
              <option value="newest">Sort by Newest</option>
            </select>

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs">
                Reset
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
            const foodName = task.foodName || donation?.foodName || 'Surplus Food Rescue';
            const category = task.category || donation?.category || 'cooked_meals';
            const urgencyLevel = task.urgencyLevel || donation?.urgencyLevel || 'medium';
            const urgencyScore = task.urgencyScore ?? donation?.urgencyScore ?? 50;
            const quantity = task.quantity ?? donation?.quantity ?? 1;
            const unit = task.unit || donation?.unit || 'Package';
            const dietaryType = task.dietaryType || donation?.dietaryType || 'veg';
            const expiryTime = task.expiryTime || donation?.expiryTime;

            const urgencyVariant =
              urgencyLevel === 'critical'
                ? 'danger'
                : urgencyLevel === 'high'
                ? 'warning'
                : urgencyLevel === 'medium'
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
                        {foodName}
                      </h3>
                      <p className="text-xs text-secondary-text capitalize mt-0.5">
                        Category: {category.replace(/_/g, ' ')} •{' '}
                        {dietaryType}
                      </p>
                    </div>

                    <Badge variant={urgencyVariant} size="sm" className="capitalize flex-shrink-0">
                      {urgencyLevel} ({urgencyScore}/100)
                    </Badge>
                  </div>

                  {/* Quantity and Deadline */}
                  <div className="bg-surface-container-low p-2.5 rounded-md flex items-center justify-between text-xs">
                    <span className="text-secondary-text">Rescue Volume:</span>
                    <span className="font-bold text-sm text-primary">
                      {quantity} {unit}
                    </span>
                  </div>

                  {/* Route Overview */}
                  <div className="space-y-2 text-xs pt-1 border-t border-border">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-secondary-text block text-[11px]">Pickup Location:</span>
                        <span className="font-medium text-primary-text">
                          {task.pickup.address}
                        </span>
                        <span className="text-secondary-text block text-[11px]">
                          Contact: {task.pickup.contactPerson} {task.pickup.contactPhone ? `(${task.pickup.contactPhone})` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-secondary-text block text-[11px]">Delivery Shelter:</span>
                        <span className="font-medium text-primary-text">
                          {task.delivery.ngoName}
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
                      {expiryTime
                        ? new Date(expiryTime).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Urgent'}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions with Route Map & Accept */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-4 mt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAssignment(task)}
                    className="text-xs"
                  >
                    <Eye size={14} className="mr-1" />
                    Details
                  </Button>

                  {/* Route Map Button (Leaflet + Google Maps) */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMapTask(task)}
                    className="text-xs text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  >
                    <MapPin size={14} className="mr-1" />
                    Route Map
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleAcceptTask(task.id)}
                    disabled={acceptingId === task.id}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 size={14} className="mr-1" />
                    {acceptingId === task.id ? 'Claiming...' : 'Accept Task'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <TaskDetailsModal
        assignment={selectedAssignment}
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        onAccept={handleAcceptTask}
        currentVolunteerId={volunteer?.id}
      />

      {/* Leaflet Route Map Modal + Google Maps Navigation */}
      <RouteMapModal
        task={mapTask}
        isOpen={!!mapTask}
        onClose={() => setMapTask(null)}
        onAccept={handleAcceptTask}
        volunteerLocation={volunteerLocation}
        isAccepting={acceptingId === mapTask?.id}
      />
    </div>
  );
};

export default AvailableTasks;
