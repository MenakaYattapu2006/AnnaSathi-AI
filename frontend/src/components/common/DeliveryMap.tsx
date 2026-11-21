import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapCoordinate {
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

  // Initialize Map
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

    const initialLat =
      pickupLocation?.latitude || deliveryLocation?.latitude || volunteerLocation?.latitude || 16.5378;
    const initialLng =
      pickupLocation?.longitude || deliveryLocation?.longitude || volunteerLocation?.longitude || 81.6233;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([initialLat, initialLng], 12);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a>',
        maxZoom: 19,
      }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Invalidate map size after container rendering completes (crucial inside Modals)
      const t1 = setTimeout(() => map.invalidateSize(), 150);
      const t2 = setTimeout(() => map.invalidateSize(), 400);

      const handleResize = () => map.invalidateSize();
      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        window.removeEventListener('resize', handleResize);
        map.remove();
        mapInstanceRef.current = null;
      };
    }
  }, []);

  // Update Markers, Route and Map Bounds whenever coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersRef.current;
    if (!map || !layerGroup) return;

    // Re-calculate size to prevent Leaflet container offset issues
    map.invalidateSize();

    layerGroup.clearLayers();

    const allPoints: [number, number][] = [];
    const routePoints: [number, number][] = [];

    // 1. Volunteer Live Location Marker (First waypoint on route)
    if (
      volunteerLocation &&
      !isNaN(volunteerLocation.latitude) &&
      !isNaN(volunteerLocation.longitude) &&
      (volunteerLocation.latitude !== 0 || volunteerLocation.longitude !== 0)
    ) {
      const volPt: [number, number] = [volunteerLocation.latitude, volunteerLocation.longitude];
      allPoints.push(volPt);
      routePoints.push(volPt);

      const volunteerIcon = L.divIcon({
        className: 'custom-map-pin-icon',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="background-color: #F59E0B; color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.35); border: 2.5px solid white; font-weight: bold; font-size: 14px; position: relative; z-index: 2;">
              🛵
            </div>
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(245, 158, 11, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; z-index: 1;"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const marker = L.marker(volPt, { icon: volunteerIcon }).bindPopup(
        `<div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
           <b style="color: #D97706;">Volunteer Live Location</b><br/>
           ${volunteerLocation.label || 'On-duty courier standby'}
         </div>`
      );
      layerGroup.addLayer(marker);
    }

    // 2. Pickup Location Marker (Donor)
    if (
      pickupLocation &&
      !isNaN(pickupLocation.latitude) &&
      !isNaN(pickupLocation.longitude) &&
      (pickupLocation.latitude !== 0 || pickupLocation.longitude !== 0)
    ) {
      const pickPt: [number, number] = [pickupLocation.latitude, pickupLocation.longitude];
      allPoints.push(pickPt);
      routePoints.push(pickPt);

      const pickupIcon = L.divIcon({
        className: 'custom-map-pin-icon',
        html: `
          <div style="background-color: #10B981; color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.35); border: 2.5px solid white; font-weight: bold; font-size: 14px;">
            P
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -19],
      });

      const marker = L.marker(pickPt, { icon: pickupIcon }).bindPopup(
        `<div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
           <b style="color: #059669;">Pickup Point (Donor)</b><br/>
           ${pickupLocation.label || 'Food donor location'}
         </div>`
      );
      layerGroup.addLayer(marker);
    }

    // 3. Delivery Location Marker (NGO Destination)
    if (
      deliveryLocation &&
      !isNaN(deliveryLocation.latitude) &&
      !isNaN(deliveryLocation.longitude) &&
      (deliveryLocation.latitude !== 0 || deliveryLocation.longitude !== 0)
    ) {
      const delPt: [number, number] = [deliveryLocation.latitude, deliveryLocation.longitude];
      allPoints.push(delPt);
      routePoints.push(delPt);

      const deliveryIcon = L.divIcon({
        className: 'custom-map-pin-icon',
        html: `
          <div style="background-color: #6366F1; color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.35); border: 2.5px solid white; font-weight: bold; font-size: 14px;">
            D
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -19],
      });

      const marker = L.marker(delPt, { icon: deliveryIcon }).bindPopup(
        `<div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
           <b style="color: #4F46E5;">Destination Shelter (NGO)</b><br/>
           ${deliveryLocation.label || 'Beneficiary shelter'}
         </div>`
      );
      layerGroup.addLayer(marker);
    }

    // 4. Draw Polyline Route: Volunteer -> Pickup -> Delivery
    if (showRoute && routePoints.length >= 2) {
      const polyline = L.polyline(routePoints, {
        color: '#2563EB',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      });
      layerGroup.addLayer(polyline);
    }

    // 5. Fit bounds with padding so all pins and the route are visible
    if (allPoints.length === 1) {
      map.setView(allPoints[0], 13);
    } else if (allPoints.length > 1) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    // Extra refresh after bounds fit
    const refreshTimer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(refreshTimer);
  }, [pickupLocation, deliveryLocation, volunteerLocation, showRoute]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-[#1E293B] shadow-sm">
      <div ref={mapContainerRef} style={{ height, width: '100%', zIndex: 1 }} />
      <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-[#11171D]/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md border border-slate-200 dark:border-[#1E293B] text-xs text-slate-700 dark:text-slate-200 flex flex-wrap items-center gap-3 z-10">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
          Pickup (P)
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shadow-xs"></span>
          Delivery (D)
        </span>
        {volunteerLocation && (
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-xs"></span>
            Volunteer Rider (🛵)
          </span>
        )}
      </div>
    </div>
  );
};
