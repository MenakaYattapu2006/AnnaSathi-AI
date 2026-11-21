import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { DeliveryMap } from '../common/DeliveryMap';
import type { Assignment } from '../../types/assignment';
import {
  MapPin,
  ExternalLink,
  Navigation,
  CheckCircle2,
  Clock,
  Phone,
  User,
  Building2,
  Package,
} from 'lucide-react';

interface RouteMapModalProps {
  task: Assignment | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (taskId: string) => Promise<void> | void;
  volunteerLocation?: {
    latitude: number;
    longitude: number;
    label?: string;
  };
  isAccepting?: boolean;
}

export const RouteMapModal: React.FC<RouteMapModalProps> = ({
  task,
  isOpen,
  onClose,
  onAccept,
  volunteerLocation,
  isAccepting = false,
}) => {
  if (!task) return null;

  // Safe coordinates fallback (Hyderabad central if none specified)
  const pickupLat = task.pickup.latitude || 17.4156;
  const pickupLng = task.pickup.longitude || 78.4357;
  const deliveryLat = task.delivery.latitude || 17.3850;
  const deliveryLng = task.delivery.longitude || 78.4867;

  // Volunteer rider location (GPS or nearby pickup)
  const volLat = volunteerLocation?.latitude || 17.4000;
  const volLng = volunteerLocation?.longitude || 78.4500;

  // Google Maps Full Delivery Route URL:
  // Origin: Volunteer Current Location (or Pickup Address if GPS not available)
  // Waypoint: Pickup Address (Donor Location)
  // Destination: Delivery Shelter (NGO Location)
  const hasGps = Boolean(volunteerLocation?.latitude && volunteerLocation?.longitude);
  
  const fullRouteGoogleMapsUrl = hasGps
    ? `https://www.google.com/maps/dir/?api=1&origin=${volLat},${volLng}&destination=${encodeURIComponent(
        task.delivery.address
      )}&waypoints=${encodeURIComponent(task.pickup.address)}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
        task.pickup.address
      )}&destination=${encodeURIComponent(task.delivery.address)}&travelmode=driving`;

  const pickupGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    task.pickup.address
  )}&travelmode=driving`;

  const deliveryGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    task.delivery.address
  )}&travelmode=driving`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delivery Route & Live Map"
      size="xl"
    >
      <div className="space-y-4">
        {/* Header Task Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-[#131B22] rounded-xl border border-slate-200 dark:border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                {task.foodName || 'Surplus Food Rescue Task'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {task.quantity ? `${task.quantity} ${task.unit || 'units'}` : 'Rescue Package'} •{' '}
                <span className="capitalize">{task.dietaryType || 'Veg'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {task.urgencyLevel && (
              <Badge
                variant={
                  task.urgencyLevel === 'critical'
                    ? 'danger'
                    : task.urgencyLevel === 'high'
                    ? 'warning'
                    : 'info'
                }
                size="sm"
                className="capitalize"
              >
                {task.urgencyLevel} Urgency
              </Badge>
            )}
            <Badge variant="neutral" size="sm">
              Status: {task.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        {/* Interactive Leaflet Route Map */}
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#1E293B]">
          <DeliveryMap
            height="340px"
            pickupLocation={{
              latitude: pickupLat,
              longitude: pickupLng,
              label: `Pickup: ${task.pickup.address}`,
              type: 'pickup',
            }}
            deliveryLocation={{
              latitude: deliveryLat,
              longitude: deliveryLng,
              label: `Shelter: ${task.delivery.ngoName || task.delivery.address}`,
              type: 'delivery',
            }}
            volunteerLocation={{
              latitude: volLat,
              longitude: volLng,
              label: hasGps ? 'Your Live Location (GPS)' : 'Delivery Rider (Standby)',
              type: 'volunteer',
            }}
            showRoute={true}
          />
        </div>

        {/* Route Waypoints & Google Maps Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Pickup Card */}
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Pickup Point (Donor)
              </span>
              <a
                href={pickupGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
              >
                <Navigation size={12} />
                Navigate Here
              </a>
            </div>
            <p className="text-slate-800 dark:text-slate-200 font-medium">
              {task.pickup.address}
            </p>
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <User size={12} />
                {task.pickup.contactPerson || 'Donor Contact'}
              </span>
              {task.pickup.contactPhone && (
                <span className="flex items-center gap-1">
                  <Phone size={12} />
                  {task.pickup.contactPhone}
                </span>
              )}
            </div>
          </div>

          {/* Delivery Card */}
          <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                Destination Shelter (NGO)
              </span>
              <a
                href={deliveryGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-indigo-700 dark:text-indigo-400 hover:underline font-medium"
              >
                <Navigation size={12} />
                Navigate Here
              </a>
            </div>
            <p className="text-slate-800 dark:text-slate-200 font-medium">
              {task.delivery.ngoName && <strong className="block">{task.delivery.ngoName}</strong>}
              {task.delivery.address}
            </p>
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <User size={12} />
                {task.delivery.contactPerson || 'Shelter Coordinator'}
              </span>
              {task.delivery.contactPhone && (
                <span className="flex items-center gap-1">
                  <Phone size={12} />
                  {task.delivery.contactPhone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* External Google Maps Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-[#1E293B]">
          <a
            href={fullRouteGoogleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all text-center"
          >
            <ExternalLink size={14} />
            <span>Open Full Route in Google Maps</span>
          </a>

          <div className="w-full sm:w-auto flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close Map
            </Button>

            {onAccept && task.status === 'available' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onAccept(task.id)}
                disabled={isAccepting}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 size={14} className="mr-1.5" />
                {isAccepting ? 'Accepting...' : 'Accept This Task'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
