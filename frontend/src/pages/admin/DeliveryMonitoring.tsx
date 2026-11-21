import React, { useState, useEffect, useMemo } from 'react';
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
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { DeliveryMap } from '../../components/common/DeliveryMap';
import { apiClient, mapAssignmentFromDb, mapDonationFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import type { Assignment, AssignmentStatus, Donation } from '../../types';

const isProduction = Boolean((import.meta as any).env?.PROD);

export const DeliveryMonitoring: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'active' | 'delivered' | 'cancelled'>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [telemetryRes, donRes] = await Promise.all([
        apiClient.admin.getTelemetry(),
        apiClient.admin.listDonations(),
      ]);

      if (telemetryRes?.data) {
        setAssignments(telemetryRes.data.map(mapAssignmentFromDb));
      }
      if (donRes?.data?.donations) {
        setDonations(donRes.data.donations.map(mapDonationFromDb));
      }
      if (telemetryRes?.data || donRes?.data?.donations) {
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Failed to load live delivery telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
        return (
          <div>
            <p className="font-semibold text-primary-text">{donation?.foodName || 'Food Item'}</p>
            <p className="text-xs text-secondary-text">Assignment: #{a.id}</p>
            <p className="text-xs text-secondary-text">
              Donation: #{a.donationId} {donation ? `(${donation.quantity} ${donation.unit})` : ''}
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
        return (
          <div>
            <p className="font-medium text-primary-text text-sm">{vol?.name || a.volunteerId}</p>
            <p className="text-xs text-secondary-text">{vol?.phone || 'Field Volunteer'}</p>
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
        const displayStatus = (a.status || 'available').replace(/_/g, ' ').toUpperCase();
        return (
          <div className="space-y-1">
            <Badge
              size="sm"
              variant={
                a.status === 'delivered'
                  ? 'success'
                  : a.status === 'cancelled'
                  ? 'danger'
                  : a.status === 'available'
                  ? 'warning'
                  : 'info'
              }
            >
              {displayStatus}
            </Badge>
            {receiptConfirmed && (
              <Badge size="sm" variant="success" className="block text-[10px] text-center">
                NGO Confirmed
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

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            statusFilter === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary-text hover:text-primary-text'
          }`}
        >
          All Assignments ({counts.all})
        </button>
        <button
          onClick={() => setStatusFilter('available')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
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
          onClick={() => setStatusFilter('active')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
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
          onClick={() => setStatusFilter('delivered')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
                  Contact: <strong className="text-primary-text">{selectedAssignment.pickup?.contactPerson || 'Donor Contact'}</strong> ({selectedAssignment.pickup?.contactPhone || 'N/A'})
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
                  Contact: <strong className="text-primary-text">{selectedAssignment.delivery?.contactPerson || 'Shelter Coordinator'}</strong> ({selectedAssignment.delivery?.contactPhone || 'N/A'})
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
