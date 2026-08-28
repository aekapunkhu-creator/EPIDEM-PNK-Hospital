import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HomeVisitRecord, Patient, SubdistrictInfo } from '../types';
import { 
  Navigation, MapPin, Compass, ArrowRight, Share2, Copy, Check, 
  ExternalLink, Car, Plus, Trash2, ArrowUp, ArrowDown, Sparkles,
  Calendar, Phone, User, Stethoscope, AlertTriangle, Layers, Send, Route
} from 'lucide-react';
import L from 'leaflet';
import { 
  PHON_NA_KAEO_FACILITIES, 
  LandmarkLocation, 
  getGoogleMapsDirectionsUrl, 
  getGoogleMapsMultiStopUrl, 
  openGoogleMapsNavigation, 
  openGoogleMapsMultiStop,
  formatCoordinates 
} from '../utils/navigation';
import { PHON_NA_KAEO_SUBDISTRICTS } from '../data/mockData';

interface HomeVisitRoutePlannerProps {
  homeVisits?: HomeVisitRecord[];
  patients?: Patient[];
  subdistricts?: SubdistrictInfo[];
  onOpenNewVisitForPatient?: (patientId: string) => void;
  onSendLineNotify?: (message: string) => void;
}

export interface RouteStop {
  id: string;
  patientId?: string;
  patientHN: string;
  patientName: string;
  subdistrict: string;
  village: string;
  houseNo?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  priority: 'ด่วนมาก (High)' | 'ตามรอบปกติ (Routine)' | 'ครบถ้วน';
  statusNote?: string;
  treatmentRegimen?: string;
}

export const HomeVisitRoutePlanner: React.FC<HomeVisitRoutePlannerProps> = ({
  homeVisits = [],
  patients = [],
  subdistricts = PHON_NA_KAEO_SUBDISTRICTS,
  onOpenNewVisitForPatient,
  onSendLineNotify
}) => {
  // Departure Starting point
  const [startPointType, setStartPointType] = useState<string>('facility');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('hosp-phon');
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);

  // Selected Patients for the Trip
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [selectedSubdistrictFilter, setSelectedSubdistrictFilter] = useState<string>('ทั้งหมด');

  // Interactive Leaflet Map for Route
  const routeMapRef = useRef<HTMLDivElement | null>(null);
  const routeMapInstance = useRef<L.Map | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Derive candidate patients for visiting
  const candidatePatients = useMemo(() => {
    const active = (patients || []).filter(p => p.status === 'Active');
    return active.map(p => {
      const pVisits = (homeVisits || []).filter(v => v.patientId === p.id || v.patientHN === p.hn);
      const lastVisit = pVisits.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];
      const dotsLogs = p.dotsLogs || [];
      const recentMissed = dotsLogs.slice(-7).filter(l => !l.taken).length;
      
      let priority: 'ด่วนมาก (High)' | 'ตามรอบปกติ (Routine)' | 'ครบถ้วน' = 'ตามรอบปกติ (Routine)';
      let statusNote = 'ติดตามการกินยาตามรอบ';

      if (recentMissed >= 2) {
        priority = 'ด่วนมาก (High)';
        statusNote = `เสี่ยงขาดยา (ลืมกินยา ${recentMissed} วัน)`;
      } else if (!lastVisit) {
        priority = 'ด่วนมาก (High)';
        statusNote = 'ยังไม่เคยเยี่ยมหลังเริ่มรักษา';
      } else if (lastVisit.referralRequired || lastVisit.status === 'พบปัญหา/ต้องติดตามใกล้ชิด') {
        priority = 'ด่วนมาก (High)';
        statusNote = 'รอบล่าสุดพบปัญหา/อาการข้างเคียง';
      }

      // Check if coordinates exist
      const lat = p.lat || lastVisit?.visitLat;
      const lng = p.lng || lastVisit?.visitLng;

      return {
        id: p.id,
        patientHN: p.hn,
        patientName: `${p.prefix}${p.firstName} ${p.lastName}`,
        subdistrict: p.subdistrict,
        village: p.village,
        houseNo: p.houseNo,
        phone: p.phone,
        lat,
        lng,
        priority,
        statusNote,
        treatmentRegimen: p.regimen
      };
    });
  }, [patients, homeVisits]);

  // Initialize with high priority patients on first load
  useEffect(() => {
    if (selectedPatientIds.length === 0 && candidatePatients.length > 0) {
      const highPriority = candidatePatients.filter(p => p.priority === 'ด่วนมาก (High)').slice(0, 4);
      const initial = highPriority.length > 0 ? highPriority : candidatePatients.slice(0, 3);
      setSelectedPatientIds(initial.map(p => p.id));
    }
  }, [candidatePatients]);

  // Sync routeStops from selectedPatientIds in order
  useEffect(() => {
    const stops: RouteStop[] = [];
    selectedPatientIds.forEach(id => {
      const found = candidatePatients.find(p => p.id === id);
      if (found) stops.push(found);
    });
    setRouteStops(stops);
  }, [selectedPatientIds, candidatePatients]);

  // Get start location object
  const startLocation = useMemo(() => {
    if (startPointType === 'current_gps' && currentGps) {
      return {
        name: 'พิกัดปัจจุบันของผู้ปฏิบัติงาน (GPS)',
        lat: currentGps.lat,
        lng: currentGps.lng
      };
    }
    const facility = PHON_NA_KAEO_FACILITIES.find(f => f.id === selectedFacilityId) || PHON_NA_KAEO_FACILITIES[0];
    return {
      name: facility.name,
      lat: facility.lat,
      lng: facility.lng
    };
  }, [startPointType, currentGps, selectedFacilityId]);

  // Handle GPS detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ของคุณไม่รองรับการตรวจจับพิกัด GPS');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCurrentGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setStartPointType('current_gps');
        setGpsLoading(false);
      },
      err => {
        alert('ไม่สามารถดึงตำแหน่ง GPS ได้: ' + err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Reorder stops
  const moveStop = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= routeStops.length) return;

    const newStops = [...routeStops];
    const temp = newStops[index];
    newStops[index] = newStops[targetIndex];
    newStops[targetIndex] = temp;

    setRouteStops(newStops);
    setSelectedPatientIds(newStops.map(s => s.id));
  };

  const removeStop = (id: string) => {
    setSelectedPatientIds(prev => prev.filter(pId => pId !== id));
  };

  const toggleSelectPatient = (patient: RouteStop) => {
    if (selectedPatientIds.includes(patient.id)) {
      removeStop(patient.id);
    } else {
      setSelectedPatientIds(prev => [...prev, patient.id]);
    }
  };

  // Google Maps URLs
  const multiStopGoogleMapsUrl = useMemo(() => {
    return getGoogleMapsMultiStopUrl(
      { lat: startLocation.lat, lng: startLocation.lng, name: startLocation.name },
      routeStops.map(s => ({
        lat: s.lat,
        lng: s.lng,
        address: `${s.houseNo ? `บ้านเลขที่ ${s.houseNo} ` : ''}${s.village} ${s.subdistrict}`,
        name: s.patientName
      }))
    );
  }, [startLocation, routeStops]);

  // Copy Link Handler
  const handleCopyLink = () => {
    navigator.clipboard.writeText(multiStopGoogleMapsUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Launch Full Navigation
  const handleLaunchFullNavigation = () => {
    openGoogleMapsMultiStop(
      { lat: startLocation.lat, lng: startLocation.lng, name: startLocation.name },
      routeStops.map(s => ({
        lat: s.lat,
        lng: s.lng,
        address: `${s.houseNo ? `บ้านเลขที่ ${s.houseNo} ` : ''}${s.village} ${s.subdistrict}`,
        name: s.patientName
      }))
    );
  };

  // Initialize Route Preview Map
  useEffect(() => {
    if (!routeMapRef.current) return;

    if (!routeMapInstance.current) {
      const map = L.map(routeMapRef.current, {
        center: [17.2225884, 104.3093759],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      routeMapInstance.current = map;
    }

    const map = routeMapInstance.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    if (polylineLayerRef.current) {
      map.removeLayer(polylineLayerRef.current);
    }

    const latLngs: L.LatLngExpression[] = [];

    // 1. Add Start Point Marker
    if (startLocation.lat && startLocation.lng) {
      const startIcon = L.divIcon({
        className: 'custom-start-marker',
        html: `
          <div style="
            background-color: #0f172a;
            color: #38bdf8;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 16px;
          ">
            🏥
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const startMarker = L.marker([startLocation.lat, startLocation.lng], { icon: startIcon });
      startMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px;">
          <div style="font-weight: bold; color: #0284c7;">จุดเริ่มต้นการเดินทาง (Origin)</div>
          <div>${startLocation.name}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">${formatCoordinates(startLocation.lat, startLocation.lng)}</div>
        </div>
      `);
      markersGroup.addLayer(startMarker);
      latLngs.push([startLocation.lat, startLocation.lng]);
    }

    // 2. Add Stop Markers
    routeStops.forEach((stop, idx) => {
      const stopNumber = idx + 1;
      if (!stop.lat || !stop.lng) return;

      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div style="
            background-color: #10b981;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 13px;
          ">
            ${stopNumber}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const stopMarker = L.marker([stop.lat, stop.lng], { icon: stopIcon });
      const gmapsUrl = getGoogleMapsDirectionsUrl({
        lat: stop.lat,
        lng: stop.lng,
        address: `${stop.houseNo || ''} ${stop.village} ${stop.subdistrict}`,
        name: stop.patientName
      });

      stopMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; min-width: 180px;">
          <div style="font-weight: bold; color: #0f172a; margin-bottom: 2px;">
            จุดแวะที่ ${stopNumber}: ${stop.patientName}
          </div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">
            HN: ${stop.patientHN} | ${stop.village}
          </div>
          <div style="margin-bottom: 6px; font-size: 11px; color: #047857;">
            ${stop.statusNote || 'ตามรอบการรักษา'}
          </div>
          <a href="${gmapsUrl}" target="_blank" rel="noreferrer" style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background-color: #0284c7;
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 11px;
            text-decoration: none;
          ">
            🧭 เปิดนำทาง Google Maps
          </a>
        </div>
      `);

      markersGroup.addLayer(stopMarker);
      latLngs.push([stop.lat, stop.lng]);
    });

    // 3. Draw Connecting Route Polyline
    if (latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: '#0284c7',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8'
      }).addTo(map);
      polylineLayerRef.current = polyline;
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 13);
    }
  }, [startLocation, routeStops]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-sky-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-sky-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sky-300 text-xs font-semibold tracking-wide uppercase">
            <Compass className="w-4 h-4 text-sky-400" />
            <span>Google Maps Route Planner & Turn-by-Turn Navigation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <span>ระบบวางแผนเส้นทางและนำทางเยี่ยมบ้านด้วย Google Maps</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
            จัดลำดับจุดแวะเยี่ยมบ้านผู้ป่วยวัณโรคในอำเภอโพนนาแก้ว คำนวณเส้นทาง และเปิดนำทางแบบเลี้ยวต่อเลี้ยว (Turn-by-Turn GPS) ในแอป Google Maps ทันที
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={handleLaunchFullNavigation}
            disabled={routeStops.length === 0}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>เปิดนำทางเส้นทางทั้งหมดใน Google Maps ({routeStops.length} จุด)</span>
          </button>

          <button
            onClick={handleCopyLink}
            disabled={routeStops.length === 0}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
            title="คัดลอกลิงก์ Google Maps"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
            <span className="hidden sm:inline">{copiedLink ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Route Configuration & Stops (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Step 1: จุดเริ่มต้นการเดินทาง (Origin Facility) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <MapPin className="w-4 h-4 text-sky-600" />
                <span>1. จุดเริ่มต้นออกเดินทาง (Origin)</span>
              </div>
              <span className="text-[11px] bg-sky-50 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                จุดที่ 0
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStartPointType('facility')}
                  className={`p-2.5 rounded-xl text-left border font-semibold transition ${
                    startPointType === 'facility'
                      ? 'bg-sky-50 border-sky-300 text-sky-900 ring-1 ring-sky-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-[11px] text-slate-500 font-normal">สถานบริการสุขภาพ</div>
                  <div>รพ. / รพ.สต. ในพื้นที่</div>
                </button>

                <button
                  type="button"
                  onClick={handleDetectGPS}
                  className={`p-2.5 rounded-xl text-left border font-semibold transition ${
                    startPointType === 'current_gps'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-1 ring-emerald-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-[11px] text-slate-500 font-normal">พิกัดของฉันขณะนี้</div>
                  <div className="flex items-center gap-1">
                    <Compass className={`w-3 h-3 text-emerald-600 ${gpsLoading ? 'animate-spin' : ''}`} />
                    <span>{gpsLoading ? 'กำลังตรวจหา...' : currentGps ? 'GPS เรียลไทม์' : 'ดึง GPS ปัจจุบัน'}</span>
                  </div>
                </button>
              </div>

              {startPointType === 'facility' && (
                <div>
                  <label className="text-[11px] text-slate-600 font-medium block mb-1">เลือกจุดเริ่มต้น:</label>
                  <select
                    value={selectedFacilityId}
                    onChange={e => setSelectedFacilityId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-800 focus:ring-2 focus:ring-sky-500"
                  >
                    {PHON_NA_KAEO_FACILITIES.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.subdistrict})</option>
                    ))}
                  </select>
                </div>
              )}

              {startPointType === 'current_gps' && currentGps && (
                <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] flex items-center justify-between">
                  <span>พิกัดปัจจุบัน: {currentGps.lat.toFixed(5)}, {currentGps.lng.toFixed(5)}</span>
                  <button
                    onClick={handleDetectGPS}
                    className="text-emerald-700 font-bold underline hover:text-emerald-900"
                  >
                    รีเฟรช GPS
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: รายการจุดแวะเยี่ยมบ้านตามลำดับ (Ordered Stops) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Route className="w-4 h-4 text-emerald-600" />
                <span>2. ลำดับจุดแวะเยี่ยมบ้าน ({routeStops.length} หลัง)</span>
              </div>
              <span className="text-[11px] text-slate-500">
                ลาก/ปรับลำดับขึ้นลงได้
              </span>
            </div>

            {routeStops.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Car className="w-6 h-6 mx-auto text-slate-400" />
                <div>ยังไม่ได้เลือกบ้านผู้ป่วยในเส้นทางนี้</div>
                <div className="text-[11px] text-slate-400">เลือกผู้ป่วยจากกล่องด้านล่างเพื่อเพิ่มเข้าสู่เส้นทาง</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {routeStops.map((stop, idx) => (
                  <div
                    key={stop.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {stop.patientName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          HN: {stop.patientHN} | {stop.village}, {stop.subdistrict}
                        </div>
                        {stop.lat && stop.lng ? (
                          <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1">
                            <span>📍 {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-600 font-medium">
                            ⚠️ อิงตามที่อยู่หมู่บ้าน
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Direct Google Maps Single Stop */}
                      <button
                        onClick={() => openGoogleMapsNavigation({
                          lat: stop.lat,
                          lng: stop.lng,
                          address: `${stop.houseNo || ''} ${stop.village} ${stop.subdistrict}`,
                          name: stop.patientName
                        })}
                        className="p-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold text-[11px] flex items-center gap-1"
                        title="เปิดนำทางไปยังจุดนี้โดยเฉพาะใน Google Maps"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">นำทาง</span>
                      </button>

                      {/* Reorder Buttons */}
                      <button
                        disabled={idx === 0}
                        onClick={() => moveStop(idx, 'up')}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                        title="เลื่อนขึ้น"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        disabled={idx === routeStops.length - 1}
                        onClick={() => moveStop(idx, 'down')}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                        title="เลื่อนลง"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => removeStop(stop.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-100"
                        title="ลบออกจากเส้นทางนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Action bar */}
            {routeStops.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={handleLaunchFullNavigation}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Navigation className="w-4 h-4 fill-current" />
                  <span>เริ่มนำทางเส้นทางทั้งหมดใน Google Maps</span>
                </button>
              </div>
            )}
          </div>

          {/* Step 3: รายชื่อผู้ป่วยที่พร้อมเพิ่มเข้าสู่เส้นทาง (Patient Selector) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <User className="w-4 h-4 text-purple-600" />
                <span>3. เลือกผู้ป่วยเพิ่มเข้าสู่เส้นทาง</span>
              </div>

              <select
                value={selectedSubdistrictFilter}
                onChange={e => setSelectedSubdistrictFilter(e.target.value)}
                className="text-xs p-1 rounded-lg border border-slate-200 bg-slate-50"
              >
                <option value="ทั้งหมด">ทุกตำบล</option>
                {(subdistricts || PHON_NA_KAEO_SUBDISTRICTS).map(s => (
                  <option key={s.code} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              {candidatePatients
                .filter(p => selectedSubdistrictFilter === 'ทั้งหมด' || p.subdistrict === selectedSubdistrictFilter)
                .map(patient => {
                  const isSelected = selectedPatientIds.includes(patient.id);
                  return (
                    <div
                      key={patient.id}
                      onClick={() => toggleSelectPatient(patient)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by parent div
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {patient.patientName} <span className="font-normal text-slate-500 font-mono text-[11px]">(HN: {patient.patientHN})</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {patient.village}, {patient.subdistrict}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          patient.priority === 'ด่วนมาก (High)'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {patient.priority === 'ด่วนมาก (High)' ? 'ด่วน' : 'ตามรอบ'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

        </div>

        {/* Right Column: Interactive Map Preview & Route Cards (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Map Preview Container */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <MapPin className="w-4 h-4 text-sky-600" />
                <span>แผนที่เส้นทางการเดินทาง (Route Preview & GPS Waypoints)</span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block" /> จุดเริ่มต้น
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> จุดแวะเยี่ยม
                </span>
              </div>
            </div>

            <div className="h-[420px] w-full relative">
              <div ref={routeMapRef} className="w-full h-full z-0" />
            </div>
          </div>

          {/* Quick Guide & Travel Instructions */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 text-xs text-sky-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-sky-900">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>คำแนะนำสำหรับการลงพื้นที่ด้วย Google Maps</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
              <li>
                เมื่อกดปุ่ม <strong>"เปิดนำทางเส้นทางทั้งหมดใน Google Maps"</strong> ระบบจะสร้าง Multi-Stop Route เปิดในแอป Google Maps ของคุณทันที
              </li>
              <li>
                สามารถกดนำทางทีละหลัง (Turn-by-Turn) หรือสลับปรับลำดับบ้านที่ใกล้กันเพื่อประหยัดเวลาเดินทาง
              </li>
              <li>
                สามารถกด <strong>"คัดลอกลิงก์"</strong> เพื่อส่งเข้ากลุ่ม LINE ของทีม รพ.สต. หรือ อสม. ผู้กำกับยา เพื่อเปิดนำทางพร้อมกัน
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
