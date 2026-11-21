import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { DeliveryMap } from '../common/DeliveryMap';
import type { Assignment } from '../../types/assignment';
import { resolveAddressCoordinates } from '../../utils/geocoding';
import {
  ExternalLink,
  Navigation,
  CheckCircle2,
  Phone,
  User,
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
    address?: string;
    isRealGps?: boolean;
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
  // State for resolved coordinates
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: task?.pickup?.latitude || 0,
    longitude: task?.pickup?.longitude || 0,
  });
  const [deliveryCoords, setDeliveryCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: task?.delivery?.latitude || 0,
    longitude: task?.delivery?.longitude || 0,
  });
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!task) return;

    let isMounted = true;
    setIsResolving(true);

    const resolveLocations = async () => {
      try {
        const [pLoc, dLoc] = await Promise.all([
          resolveAddressCoordinates(
            task.pickup.address,
            task.pickup.latitude,
            task.pickup.longitude
          ),
          resolveAddressCoordinates(
            task.delivery.address || task.delivery.ngoName,
            task.delivery.latitude,
            task.delivery.longitude
          ),
        ]);

        if (isMounted) {
          setPickupCoords({ latitude: pLoc.latitude, longitude: pLoc.longitude });
          setDeliveryCoords({ latitude: dLoc.latitude, longitude: dLoc.longitude });
          setIsResolving(false);
        }
      } catch {
        if (isMounted) {
          setIsResolving(false);
        }
      }
    };

    resolveLocations();

    return () => {
      isMounted = false;
    };
  }, [task?.id, task?.pickup.address, task?.delivery.address]);

  if (!task) return null;

  // Determine origin for Google Maps:
  // 1. Volunteer live device GPS (if permitted by device and valid)
  // 2. Volunteer registered address string (from volunteer profile)
  // 3. Fallback: Donor Pickup Address (if volunteer location is completely unknown)
  const volLat = volunteerLocation?.latitude;
  const volLng = volunteerLocation?.longitude;
  const isRealGps = Boolean(volunteerLocation?.isRealGps && volLat && volLng && volLat !== 0);

  let originParam = '';
  if (isRealGps) {
    originParam = `${volLat},${volLng}`;
  } else if (volunteerLocation?.address && volunteerLocation.address.trim()) {
    originParam = encodeURIComponent(volunteerLocation.address.trim());
  } else if (volLat && volLng && volLat !== 0 && (volLat !== 17.0878 || volLng !== 82.0668)) {
    originParam = `${volLat},${volLng}`;
  }

  // Google Maps Full Delivery Route URL:
  // Origin: Volunteer Location/Address
  // Waypoint: Pickup Address (Donor Location)
  // Destination: Delivery Shelter (NGO Location)
  const fullRouteGoogleMapsUrl = originParam
    ? `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${encodeURIComponent(
        task.delivery.address
      )}&waypoints=${encodeURIComponent(task.pickup.address)}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
        task.pickup.address
      )}&destination=${encodeURIComponent(task.delivery.address)}&travelmode=driving`;

  // Navigate to Pickup Point: from volunteer origin to donor pickup
  const pickupGoogleMapsUrl = originParam
    ? `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${encodeURIComponent(
        task.pickup.address
      )}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        task.pickup.address
      )}&travelmode=driving`;

  // Navigate to Destination Shelter: from donor pickup to NGO shelter
  const deliveryGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    task.pickup.address
  )}&destination=${encodeURIComponent(task.delivery.address)}&travelmode=driving`;

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
                {isResolving && <span className="ml-2 text-primary text-[11px] font-medium">Updating pin coordinates...</span>}
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
              latitude: pickupCoords.latitude,
              longitude: pickupCoords.longitude,
              label: `Pickup: ${task.pickup.address}`,
              type: 'pickup',
            }}
            deliveryLocation={{
              latitude: deliveryCoords.latitude,
              longitude: deliveryCoords.longitude,
              label: `Shelter: ${task.delivery.ngoName || task.delivery.address}`,
              type: 'delivery',
            }}
            volunteerLocation={
              hasGps && volLat != null && volLng != null
                ? {
                    latitude: volLat,
                    longitude: volLng,
                    label: volunteerLocation?.label || 'Your Live Location (GPS)',
                    type: 'volunteer',
                  }
                : undefined
            }
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
