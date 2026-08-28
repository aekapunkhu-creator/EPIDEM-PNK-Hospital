import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Patient, HouseholdContact } from '../types';
import { Layers, MapPin, Navigation, ExternalLink, Eye, Phone } from 'lucide-react';

interface LeafletSpotMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  patients: Patient[];
  contacts: HouseholdContact[];
  onSelectPatient: (patient: Patient) => void;
  onOpenShareLocationModal?: (patient?: Patient) => void;
}

export const LeafletSpotMap: React.FC<LeafletSpotMapProps> = ({
  center,
  zoom,
  patients,
  contacts,
  onSelectPatient,
  onOpenShareLocationModal
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: zoom,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19
    });

    streetLayer.addTo(map);
    (map as any)._streetLayer = streetLayer;
    (map as any)._satelliteLayer = satelliteLayer;

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map type (street vs satellite)
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

  // Update center and zoom when props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([center.lat, center.lng], zoom, { duration: 1 });
  }, [center.lat, center.lng, zoom]);

  // Update markers
  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;

    markersLayer.clearLayers();

    // Add Patient Markers
    patients.forEach(p => {
      const lat = p.lat && p.lat !== 0 ? p.lat : 17.2225;
      const lng = p.lng && p.lng !== 0 ? p.lng : 104.3093;

      const isSmearPos = p.status === 'Active' && p.tbType === 'Pulmonary Smear+';
      const isSmearNeg = p.status === 'Active' && p.tbType !== 'Pulmonary Smear+';
      const isCured = p.status === 'Cured' || p.status === 'Completed';

      let colorClass = 'bg-emerald-500';
      if (isSmearPos) colorClass = 'bg-red-600';
      else if (isSmearNeg) colorClass = 'bg-orange-500';

      const customIcon = L.divIcon({
        className: 'custom-tb-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group" style="width:36px;height:36px;margin-left:-18px;margin-top:-18px;">
            ${isSmearPos ? '<div class="absolute inset-0 rounded-full bg-red-500 opacity-60 animate-ping"></div>' : ''}
            <div class="w-8 h-8 rounded-full ${colorClass} border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-[11px] transform transition-transform group-hover:scale-110">
              TB
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Create popup HTML
      const popupDiv = document.createElement('div');
      popupDiv.className = "font-['Prompt',sans-serif] text-slate-800 p-1 min-w-[240px]";
      popupDiv.innerHTML = `
        <div class="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-100 pb-1">
          <span class="font-bold text-xs text-slate-900">${p.prefix}${p.firstName} ${p.lastName}</span>
          <span class="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">${p.hn}</span>
        </div>
        <div class="text-[11px] text-slate-600 space-y-0.5 mb-2.5">
          <p>📍 ${p.subdistrict} (${p.village})</p>
          <p>💊 สูตรยา: <b class="text-slate-800">${p.regimen}</b></p>
          <p>👤 อสม.: <span class="text-emerald-700 font-medium">${p.dotsSupervisorName || '-'}</span></p>
          <p class="text-[10px] font-mono text-slate-400">พิกัด: ${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
        </div>
        <div class="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
          <button id="btn-patient-detail-${p.id}" class="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition text-center shadow-sm">
            ดูประวัติผู้ป่วย
          </button>
          <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" rel="noopener noreferrer" class="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold transition text-center flex items-center justify-center gap-1 border border-slate-300">
            <span>นำทาง Maps</span>
            <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
        </div>
      `;

      // Attach button click handler after popup opens
      marker.bindPopup(popupDiv);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-patient-detail-${p.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectPatient(p);
            marker.closePopup();
          };
        }
      });

      markersLayer.addLayer(marker);
    });

    // Add Contact Markers
    contacts.forEach((c, idx) => {
      const contactLat = 17.210 + (idx * 0.003 % 0.03);
      const contactLng = 104.300 + (idx * 0.004 % 0.03);

      const contactIcon = L.divIcon({
        className: 'custom-contact-marker',
        html: `
          <div class="w-6 h-6 rounded-full bg-amber-400 border-2 border-white shadow-md flex items-center justify-center text-amber-950 font-bold text-[9px] cursor-pointer hover:scale-110 transition" style="margin-left:-12px;margin-top:-12px;">
            CT
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });

      const marker = L.marker([contactLat, contactLng], { icon: contactIcon });
      marker.bindPopup(`
        <div class="font-['Prompt',sans-serif] text-slate-800 p-1 min-w-[200px]">
          <p class="font-bold text-xs text-amber-800 mb-1">
            ผู้สัมผัสร่วมบ้าน: ${c.prefix}${c.firstName} ${c.lastName}
          </p>
          <p class="text-[11px] text-slate-600">
            ผู้ป่วยดัชนี: <b>${c.indexPatientName}</b><br/>
            ตำบล: ${c.subdistrict}<br/>
            ผลคัดกรอง: <span class="font-bold text-slate-800">${c.outcome}</span>
          </p>
        </div>
      `);

      markersLayer.addLayer(marker);
    });

  }, [patients, contacts, onSelectPatient]);

  return (
    <div className="w-full h-full relative">
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
