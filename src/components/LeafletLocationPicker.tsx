import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, MapPin, Navigation, Crosshair } from 'lucide-react';

interface LeafletLocationPickerProps {
  lat: number;
  lng: number;
  onUpdateCoordinates: (lat: number, lng: number) => void;
  className?: string;
}

export const LeafletLocationPicker: React.FC<LeafletLocationPickerProps> = ({
  lat,
  lng,
  onUpdateCoordinates,
  className = "w-full h-full min-h-[320px] sm:min-h-[400px]"
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = lat && !isNaN(lat) && lat !== 0 ? lat : 17.2225884;
    const initialLng = lng && !isNaN(lng) && lng !== 0 ? lng : 104.3093759;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      maxZoom: 19
    });

    streetLayer.addTo(map);
    (map as any)._streetLayer = streetLayer;
    (map as any)._satelliteLayer = satelliteLayer;

    // Draggable Pin Icon
    const pinIcon = L.divIcon({
      className: 'custom-picker-pin',
      html: `
        <div class="relative flex items-center justify-center cursor-grab active:cursor-grabbing" style="width:40px;height:40px;margin-left:-20px;margin-top:-20px;">
          <div class="absolute w-10 h-10 bg-red-500 opacity-30 rounded-full animate-ping pointer-events-none"></div>
          <div class="w-9 h-9 rounded-full bg-red-600 border-3 border-white shadow-2xl flex items-center justify-center text-white font-bold">
            <svg class="w-5 h-5 fill-white text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: pinIcon,
      draggable: true
    }).addTo(map);

    markerRef.current = marker;

    // Drag event
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      const newLat = Number(position.lat.toFixed(6));
      const newLng = Number(position.lng.toFixed(6));
      onUpdateCoordinates(newLat, newLng);
    });

    // Map click event
    map.on('click', (e: L.LeafletMouseEvent) => {
      const newLat = Number(e.latlng.lat.toFixed(6));
      const newLng = Number(e.latlng.lng.toFixed(6));
      marker.setLatLng([newLat, newLng]);
      onUpdateCoordinates(newLat, newLng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const streetLayer = (map as any)._streetLayer;
    const satelliteLayer = (map as any)._satelliteLayer;

    if (mapType === 'satellite') {
      if (map.hasLayer(streetLayer)) map.removeLayer(streetLayer);
      if (!map.hasLayer(satelliteLayer)) satelliteLayer.addTo(map);
    } else {
      if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
      if (!map.hasLayer(streetLayer)) streetLayer.addTo(map);
    }
  }, [mapType]);

  // Sync marker position & map center when lat/lng props change
  useEffect(() => {
    if (!lat || !lng || isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

    const map = mapInstanceRef.current;
    const marker = markerRef.current;

    if (marker) {
      const curPos = marker.getLatLng();
      if (Math.abs(curPos.lat - lat) > 0.00001 || Math.abs(curPos.lng - lng) > 0.00001) {
        marker.setLatLng([lat, lng]);
      }
    }

    if (map) {
      const curCenter = map.getCenter();
      if (Math.abs(curCenter.lat - lat) > 0.0001 || Math.abs(curCenter.lng - lng) > 0.0001) {
        map.panTo([lat, lng]);
      }
    }
  }, [lat, lng]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Layer Toggle Control */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200">
        <button
          type="button"
          onClick={() => setMapType('street')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            mapType === 'street'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>แผนที่ถนน</span>
        </button>
        <button
          type="button"
          onClick={() => setMapType('satellite')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            mapType === 'satellite'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>ดาวเทียม (Satellite)</span>
        </button>
      </div>
    </div>
  );
};
