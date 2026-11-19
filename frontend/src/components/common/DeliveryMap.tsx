import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapCoordinate {
  latitude: number;
  longitude: number;
  label?: string;
  type?: 'pickup' | 'delivery' | 'volunteer';
}

interface DeliveryMapProps {
  pickupLocation?: MapCoordinate;
  deliveryLocation?: MapCoordinate;
  volunteerLocation?: MapCoordinate;
  height?: string;
  showRoute?: boolean;
}

export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  pickupLocation,
  deliveryLocation,
  volunteerLocation,
  height = '380px',
  showRoute = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix standard Leaflet default marker icons for Vite bundlers
    const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
    const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
    });

    // Default center: India (Hyderabad / Mumbai region)
    const initialLat = pickupLocation?.latitude || volunteerLocation?.latitude || 17.385044;
    const initialLng = pickupLocation?.longitude || volunteerLocation?.longitude || 78.486671;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const points: [number, number][] = [];

    // Pickup Marker
    if (pickupLocation && pickupLocation.latitude && pickupLocation.longitude) {
      const pickupIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="background-color: #10B981; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white; font-weight: bold; font-size: 13px;">
            P
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([pickupLocation.latitude, pickupLocation.longitude], { icon: pickupIcon })
        .bindPopup(`<b>Pickup Location</b><br/>${pickupLocation.label || 'Donor Location'}`);
      layerGroup.addLayer(marker);
      points.push([pickupLocation.latitude, pickupLocation.longitude]);
    }

    // Delivery Marker
    if (deliveryLocation && deliveryLocation.latitude && deliveryLocation.longitude) {
      const deliveryIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="background-color: #6366F1; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white; font-weight: bold; font-size: 13px;">
            D
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([deliveryLocation.latitude, deliveryLocation.longitude], { icon: deliveryIcon })
        .bindPopup(`<b>Delivery Point</b><br/>${deliveryLocation.label || 'NGO Destination'}`);
      layerGroup.addLayer(marker);
      points.push([deliveryLocation.latitude, deliveryLocation.longitude]);
    }

    // Volunteer Live Location Marker
    if (volunteerLocation && volunteerLocation.latitude && volunteerLocation.longitude) {
      const volunteerIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="position: relative;">
            <div style="background-color: #F59E0B; color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.4); border: 2px solid white; font-weight: bold; font-size: 13px; z-index: 2;">
              🛵
            </div>
            <div style="position: absolute; top: -4px; left: -4px; width: 42px; height: 42px; border-radius: 50%; background: rgba(245, 158, 11, 0.35); animation: pulse 2s infinite; z-index: 1;"></div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([volunteerLocation.latitude, volunteerLocation.longitude], { icon: volunteerIcon })
        .bindPopup(`<b>Live Volunteer Rider</b><br/>${volunteerLocation.label || 'Active delivery in progress'}`);
      layerGroup.addLayer(marker);
      points.push([volunteerLocation.latitude, volunteerLocation.longitude]);
    }

    // Draw route line if multiple points exist
    if (showRoute && points.length >= 2) {
      const polyline = L.polyline(points, {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.8,
        dashArray: '6, 8',
      });
      layerGroup.addLayer(polyline);
    }

    // Fit map bounds to show all markers
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [pickupLocation, deliveryLocation, volunteerLocation, showRoute]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div ref={mapContainerRef} style={{ height, width: '100%', zIndex: 1 }} />
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md border border-gray-200 text-xs text-gray-700 flex items-center space-x-3 z-10">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          Pickup
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
          Delivery
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          Volunteer Rider
        </span>
      </div>
    </div>
  );
};
