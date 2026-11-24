import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Truck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  Users,
  Package,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Table, type TableColumn } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { DeliveryMap } from '../../components/common/DeliveryMap';
import { apiClient, mapAssignmentFromDb, mapDonationFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import type { Assignment, AssignmentStatus, Donation } from '../../types';

const isProduction = Boolean((import.meta as any).env?.PROD);

export const DeliveryMonitoring: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync state with URL params
  const initialTab = (searchParams.get('tab') as any) || 'all';
  const initialQuery = searchParams.get('q') || '';

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'active' | 'delivered' | 'cancelled'>(
    ['all', 'available', 'active', 'delivered', 'cancelled'].includes(initialTab) ? initialTab : 'all'
  );
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Update URL params when tab or search query changes
  const handleTabChange = (newTab: 'all' | 'available' | 'active' | 'delivered' | 'cancelled') => {
    setStatusFilter(newTab);
    const newParams = new URLSearchParams(searchParams);
    if (newTab === 'all') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', newTab);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (!val.trim()) {
      newParams.delete('q');
    } else {
      newParams.set('q', val.trim());
    }
    setSearchParams(newParams, { replace: true });
  };

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [telemetryRes, donRes] = await Promise.all([
        apiClient.admin.getTelemetry().catch(() => null),
        apiClient.admin.listDonations().catch(() => null),
      ]);

      if (telemetryRes?.data) {
        setAssignments(telemetryRes.data.map(mapAssignmentFromDb));
      }
      if (donRes?.data?.donations) {
        setDonations(donRes.data.donations.map(mapDonationFromDb));
      }
      if (telemetryRes?.data || donRes?.data?.donations) {
        if (!silent) setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Failed to load live delivery telemetry:', err);
    }

    // Fallback to local mock data if backend not reachable
    if (!isProduction) {
      setAssignments(mockDataService.getAssignments());
      setDonations(mockDataService.getDonations());
    }
    if (!silent) setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    // Auto-polling: Refresh telemetry silently every 20 seconds
    const pollInterval = setInterval(() => {
      loadData(true);
    }, 20000);

    return () => clearInterval(pollInterval);
  }, []);

  const counts = useMemo(() => {
    return {
      all: assignments.length,
      available: assignments.filter((a) => !a.volunteerId || a.status === 'available').length,
      active: assignments.filter((a) =>
        ['assigned', 'in_transit_to_pickup', 'picked_up', 'in_transit_to_drop'].includes(a.status)
      ).length,
      delivered: assignments.filter((a) => a.status === 'delivered').length,
      cancelled: assignments.filter((a) => a.status === 'cancelled').length,
    };
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const isAvailable = !a.volunteerId || a.status === 'available';
      const isActive = ['assigned', 'in_transit_to_pickup', 'picked_up', 'in_transit_to_drop'].includes(a.status);
      const isDelivered = a.status === 'delivered';
      const isCancelled = a.status === 'cancelled';

      let matchesTab = true;
      if (statusFilter === 'available') matchesTab = isAvailable;
      else if (statusFilter === 'active') matchesTab = isActive;
      else if (statusFilter === 'delivered') matchesTab = isDelivered;
      else if (statusFilter === 'cancelled') matchesTab = isCancelled;

      const donation = donations.find((d) => d.id === a.donationId);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (a.id || '').toLowerCase().includes(q) ||
        (a.pickup?.contactPerson || '').toLowerCase().includes(q) ||
        (a.pickup?.address || '').toLowerCase().includes(q) ||
        (a.delivery?.ngoName || '').toLowerCase().includes(q) ||
        (a.delivery?.address || '').toLowerCase().includes(q) ||
        (donation?.foodName || '').toLowerCase().includes(q) ||
        (a.volunteerId || '').toLowerCase().includes(q)
      );

      return matchesTab && matchesSearch;
    });
  }, [assignments, donations, statusFilter, searchQuery]);

  const columns: TableColumn<Assignment>[] = [
    {
      header: 'Task / Food Details',
      accessor: (a) => {
        const donation = donations.find((d) => d.id === a.donationId);
        const foodTitle = a.foodName || donation?.foodName || 'Surplus Food';
        const qty = a.quantity || donation?.quantity;
        const unit = a.unit || donation?.unit || 'units';
        return (
          <div>
            <p className="font-semibold text-primary-text">{foodTitle}</p>
            <p className="text-xs text-secondary-text">Assignment: #{a.id.slice(0, 8)}</p>
            <p className="text-xs text-secondary-text">
              Donation: #{a.donationId.slice(0, 8)} {qty ? `(${qty} ${unit})` : ''}
            </p>
          </div>
        );
      },
    },
    {
      header: 'Assigned Volunteer',
      accessor: (a) => {
        if (!a.volunteerId || a.status === 'available') {
          return (
            <Badge size="sm" variant="warning">
              Awaiting Volunteer
            </Badge>
          );
        }
        const vol = mockDataService.getVolunteerById(a.volunteerId);
        const volName = a.volunteerName || vol?.name || a.volunteerId;
        const volPhone = a.volunteerPhone || vol?.phone || 'Field Volunteer';
        return (
          <div>
            <p className="font-medium text-primary-text text-sm">{volName}</p>
            <p className="text-xs text-secondary-text">{volPhone}</p>
          </div>
        );
      },
    },
    {
      header: 'Logistics Route',
      accessor: (a) => (
        <div className="text-xs space-y-0.5">
          <p className="text-secondary-text truncate max-w-[200px]">
            <strong className="text-primary-text">From:</strong> {a.pickup?.address || 'Pickup Point'}
          </p>
          <p className="text-secondary-text truncate max-w-[200px]">
            <strong className="text-primary-text">To:</strong> {a.delivery?.ngoName || 'NGO'}{a.delivery?.address ? ` (${a.delivery.address})` : ''}
          </p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (a) => {
        const donation = donations.find((d) => d.id === a.donationId);
        const receiptConfirmed = donation?.status === 'RECEIPT_CONFIRMED';
        return (
          <div className="space-y-1">
            <StatusBadge status={a.status || 'available'} />
            {receiptConfirmed && (
              <Badge size="sm" variant="success" dot className="block text-[10px] text-center mt-1">
                Receipt Confirmed
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessor: (a) => (
        <Button variant="outline" size="sm" onClick={() => setSelectedAssignment(a)}>
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Logistics & Assignment Monitoring"
        description="Live overview of surplus food transport operations, active transit routes, and completed deliveries."
      />

      {/* Visual Status Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => handleTabChange('all')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-100 border-slate-400 shadow-sm'
              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">All Deliveries</span>
            <Package size={16} className="text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{counts.all}</p>
          <span className="text-[11px] text-slate-500">Total logged transfers</span>
        </div>

        <div
          onClick={() => handleTabChange('available')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'available'
              ? 'bg-amber-50 border-amber-400 shadow-sm'
              : 'bg-white border-slate-200/90 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Volunteer</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900">{counts.available}</p>
          <span className="text-[11px] text-amber-700">Open for pickup</span>
        </div>

        <div
          onClick={() => handleTabChange('active')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-sky-50 border-sky-400 shadow-sm'
              : 'bg-white border-slate-200/90 hover:border-sky-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-sky-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">In Transit / Active</span>
            <Truck size={16} className="text-sky-600" />
          </div>
          <p className="text-2xl font-black text-sky-900">{counts.active}</p>
          <span className="text-[11px] text-sky-700">En route / Transporting</span>
        </div>

        <div
          onClick={() => handleTabChange('delivered')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'delivered'
              ? 'bg-emerald-50 border-emerald-400 shadow-sm'
              : 'bg-white border-slate-200/90 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Delivered</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900">{counts.delivered}</p>
          <span className="text-[11px] text-emerald-700">Handed over to shelter</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => handleTabChange('all')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            statusFilter === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary-text hover:text-primary-text'
          }`}
        >
          All Assignments ({counts.all})
        </button>
        <button
          onClick={() => handleTabChange('available')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'available'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary-text hover:text-primary-text'
          }`}
        >
          Unassigned / Open
          <span className="px-1.5 py-0.2 rounded-full text-xs bg-warning/10 text-warning font-bold">
            {counts.available}
          </span>
        </button>
        <button
          onClick={() => handleTabChange('active')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'active'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary-text hover:text-primary-text'
          }`}
        >
          In Transit / Active
          <span className="px-1.5 py-0.2 rounded-full text-xs bg-info/10 text-info font-bold">
            {counts.active}
          </span>
        </button>
        <button
          onClick={() => handleTabChange('delivered')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'delivered'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary-text hover:text-primary-text'
          }`}
        >
          Delivered ({counts.delivered})
        </button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 text-secondary-text" size={18} />
          <input
            type="text"
            placeholder="Search by assignment ID, food name, NGO, volunteer..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-md text-sm bg-surface text-primary-text focus:outline-none focus:border-primary"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <Table
          columns={columns}
          data={filteredAssignments}
          emptyState={
            <EmptyState
              title="No delivery assignments match this filter"
              description="Adjust your search criteria to inspect logistics tasks."
            />
          }
        />
      </Card>

      {/* Inspection Modal */}
      {selectedAssignment && (
        <Modal
          isOpen={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          title={`Delivery Inspection: #${selectedAssignment.id}`}
          size="xl"
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <p className="font-bold text-base text-primary-text">
                  Assignment #{selectedAssignment.id}
                </p>
                <p className="text-xs text-secondary-text">Linked Donation: #{selectedAssignment.donationId}</p>
              </div>
              <Badge
                variant={
                  selectedAssignment.status === 'delivered'
                    ? 'success'
                    : selectedAssignment.status === 'cancelled'
                    ? 'danger'
                    : 'info'
                }
              >
                {selectedAssignment.status.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Route Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-surface-hover rounded-md text-xs space-y-1 border border-border/50">
                <p className="font-bold text-primary-text flex items-center gap-1">
                  <MapPin size={14} className="text-primary" /> Pickup Location
                </p>
                <p className="text-secondary-text">{selectedAssignment.pickup?.address || 'Pickup Point'}</p>
                <p className="text-secondary-text">
                  Contact: <strong className="text-primary-text">{selectedAssignment.pickup?.contactPerson || 'Donor Contact'}</strong> (
                  {selectedAssignment.pickup?.contactPhone ? (
                    <a
                      href={`tel:${selectedAssignment.pickup.contactPhone.replace(/\s+/g, '')}`}
                      className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      {selectedAssignment.pickup.contactPhone}
                    </a>
                  ) : (
                    'N/A'
                  )}
                  )
                </p>
                {selectedAssignment.pickup?.actualPickupTime && (
                  <p className="text-success font-medium">
                    Picked up at: {new Date(selectedAssignment.pickup.actualPickupTime).toLocaleTimeString()}
                  </p>
                )}
              </div>

              <div className="p-3 bg-surface-hover rounded-md text-xs space-y-1 border border-border/50">
                <p className="font-bold text-primary-text flex items-center gap-1">
                  <Building2 size={14} className="text-secondary" /> Destination NGO
                </p>
                <p className="font-semibold text-primary-text">{selectedAssignment.delivery?.ngoName || 'NGO Partner'}</p>
                <p className="text-secondary-text">{selectedAssignment.delivery?.address || 'Shelter Destination'}</p>
                <p className="text-secondary-text">
                  Contact: <strong className="text-primary-text">{selectedAssignment.delivery?.contactPerson || 'Shelter Coordinator'}</strong> (
                  {selectedAssignment.delivery?.contactPhone ? (
                    <a
                      href={`tel:${selectedAssignment.delivery.contactPhone.replace(/\s+/g, '')}`}
                      className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      {selectedAssignment.delivery.contactPhone}
                    </a>
                  ) : (
                    'N/A'
                  )}
                  )
                </p>
                {selectedAssignment.delivery?.actualDeliveryTime && (
                  <p className="text-success font-medium">
                    Delivered at: {new Date(selectedAssignment.delivery.actualDeliveryTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            {/* Live Leaflet OpenStreetMap Telemetry View */}
            <div className="space-y-1">
              <span className="font-semibold text-primary-text block text-xs">Live Telemetry & Route Map</span>
              {(() => {
                const linkedDonation = donations.find((d) => d.id === selectedAssignment.donationId);
                const pickupCoord = linkedDonation?.pickupAddress?.latitude && linkedDonation?.pickupAddress?.longitude
                  ? {
                      latitude: linkedDonation.pickupAddress.latitude,
                      longitude: linkedDonation.pickupAddress.longitude,
                      label: linkedDonation.pickupAddress.street,
                    }
                  : { latitude: selectedAssignment.pickup?.latitude || 16.5378, longitude: selectedAssignment.pickup?.longitude || 81.6233, label: selectedAssignment.pickup?.address || 'Pickup Point' };

                const deliveryCoord = {
                  latitude: selectedAssignment.delivery?.latitude || pickupCoord.latitude + 0.022,
                  longitude: selectedAssignment.delivery?.longitude || pickupCoord.longitude + 0.028,
                  label: selectedAssignment.delivery?.ngoName || 'Destination Shelter',
                };

                const volunteerCoord = selectedAssignment.volunteerId
                  ? {
                      latitude: pickupCoord.latitude + 0.011,
                      longitude: pickupCoord.longitude + 0.014,
                      label: `Active Volunteer #${selectedAssignment.volunteerId}`,
                    }
                  : undefined;

                return (
                  <DeliveryMap
                    pickupLocation={pickupCoord}
                    deliveryLocation={deliveryCoord}
                    volunteerLocation={volunteerCoord}
                    height="200px"
                  />
                );
              })()}
            </div>

            {/* Volunteer Details */}
            <div className="p-3 bg-surface-hover rounded-md text-xs">
              <span className="font-semibold text-primary-text block mb-1">Volunteer Assignment</span>
              {selectedAssignment.volunteerId ? (
                <p className="text-secondary-text">
                  Volunteer ID: <strong className="text-primary-text">{selectedAssignment.volunteerId}</strong> • Assigned: {new Date(selectedAssignment.assignedAt).toLocaleString()}
                </p>
              ) : (
                <p className="text-warning font-medium">This delivery task has not been accepted by a volunteer yet.</p>
              )}
            </div>

            {selectedAssignment.notes && (
              <div className="p-3 bg-surface-hover rounded-md text-xs">
                <span className="font-semibold text-primary-text block mb-1">Audit & Field Notes</span>
                <p className="text-secondary-text">{selectedAssignment.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setSelectedAssignment(null)}>
                Close Inspection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DeliveryMonitoring;



