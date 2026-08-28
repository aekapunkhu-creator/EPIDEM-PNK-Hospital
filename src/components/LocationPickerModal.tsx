import React, { useEffect, useState } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  useMap 
} from '@vis.gl/react-google-maps';
import { LeafletLocationPicker } from './LeafletLocationPicker';
import { 
  MapPin, X, Check, Navigation, Compass, Crosshair, HelpCircle, ExternalLink, CheckCircle2, Sparkles 
} from 'lucide-react';
import { PHON_NA_KAEO_SUBDISTRICTS } from '../data/mockData';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
  subdistrictName?: string;
  patientName?: string;
  onSelectLocation: (lat: number, lng: number) => void;
  onShowToast?: (msg: string) => void;
}

// Controller to smoothly pan when coordinates change
const ModalMapController: React.FC<{
  center: { lat: number; lng: number };
}> = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(center);
  }, [map, center.lat, center.lng]);

  return null;
};

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  subdistrictName,
  patientName,
  onSelectLocation,
  onShowToast,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Default fallback: Phon Na Kaeo Center
  const defaultLat = initialLat && !isNaN(initialLat) && initialLat !== 0 ? initialLat : 17.2225884;
  const defaultLng = initialLng && !isNaN(initialLng) && initialLng !== 0 ? initialLng : 104.3093759;

  const [lat, setLat] = useState<number>(Number(defaultLat.toFixed(6)));
  const [lng, setLng] = useState<number>(Number(defaultLng.toFixed(6)));
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);

  // Reset when modal opens with new initial props
  useEffect(() => {
    if (isOpen) {
      let startLat = initialLat && !isNaN(initialLat) && initialLat !== 0 ? initialLat : 17.2225884;
      let startLng = initialLng && !isNaN(initialLng) && initialLng !== 0 ? initialLng : 104.3093759;

      // If no initial lat/lng provided but subdistrict is selected, center on subdistrict
      if ((!initialLat || initialLat === 0) && subdistrictName) {
        const foundSub = PHON_NA_KAEO_SUBDISTRICTS.find(s => s.name === subdistrictName);
        if (foundSub) {
          startLat = foundSub.lat;
          startLng = foundSub.lng;
        }
      }

      setLat(Number(startLat.toFixed(6)));
      setLng(Number(startLng.toFixed(6)));
      setGpsError(null);
      setFeedbackMsg(null);
      setIsSavedSuccess(false);
    }
  }, [isOpen, initialLat, initialLng, subdistrictName]);

  // Sync coordinates manually
  const handleUpdateCoordinates = (newLat: number, newLng: number) => {
    setLat(Number(newLat.toFixed(6)));
    setLng(Number(newLng.toFixed(6)));
  };

  // Get current GPS position from browser
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('เบราว์เซอร์นี้ไม่รองรับระบบ GPS ระบุตำแหน่ง');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = Number(position.coords.latitude.toFixed(6));
        const userLng = Number(position.coords.longitude.toFixed(6));
        handleUpdateCoordinates(userLat, userLng);
        setGpsLoading(false);
        setFeedbackMsg({
          type: 'success',
          text: `ตรวจพบพิกัด GPS ปัจจุบัน: Lat ${userLat}, Lng ${userLng}`
        });
        setTimeout(() => setFeedbackMsg(null), 3500);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError('ไม่สามารถดึงตำแหน่งพิกัด GPS ได้ โปรดตรวจสอบการอนุญาตระบุตำแหน่ง');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSave = () => {
    setIsSavedSuccess(true);
    const successMsg = `📍 บันทึกพิกัดตำแหน่งบ้านสำเร็จ: ละติจูด ${lat}, ลองจิจูด ${lng}${patientName ? ` (${patientName})` : ''}`;
    
    // Call parent toast if provided
    if (onShowToast) {
      onShowToast(successMsg);
    }
    
    onSelectLocation(lat, lng);
    
    // Small delay to let user see confirmation check before closing
    setTimeout(() => {
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-['Prompt',sans-serif]">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl border border-white/20">
              <MapPin className="w-5 h-5 text-amber-300 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight">ปักหมุดพิกัดตำแหน่งบ้านด้วย Google Maps</h3>
                <span className="text-[10px] bg-white/20 text-emerald-100 px-2 py-0.5 rounded-full font-mono">
                  Google Maps
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                {patientName ? `ผู้ป่วย: ${patientName}` : 'คลิกบนแผนที่ หรือลากหมุดแดงไปยังหลังคาบ้านที่ต้องการ'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Header Toolbar Controls */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {/* Subdistrict Quick Jump */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>เลื่อนไปยังตำบล:</span>
            <select
              onChange={(e) => {
                const subName = e.target.value;
                const found = PHON_NA_KAEO_SUBDISTRICTS.find(s => s.name === subName);
                if (found) {
                  handleUpdateCoordinates(found.lat, found.lng);
                }
              }}
              className="p-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">-- เลือกตำบลใน อ.โพนนาแก้ว --</option>
              {PHON_NA_KAEO_SUBDISTRICTS.map((s) => (
                <option key={s.code} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* GPS Button */}
            <button
              onClick={handleGetGPS}
              disabled={gpsLoading}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Crosshair className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span>{gpsLoading ? 'กำลังค้นหาพิกัด GPS...' : 'ใช้พิกัด GPS ปัจจุบัน'}</span>
            </button>
          </div>
        </div>

        {gpsError && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs font-medium">
            ⚠️ {gpsError}
          </div>
        )}

        {/* Map Container */}
        <div className="relative flex-1 min-h-[320px] sm:min-h-[400px] bg-slate-100">
          {apiKey && apiKey.trim() !== '' ? (
            <APIProvider apiKey={apiKey} language="th" region="TH">
              <Map
                id="modal-location-picker-map"
                defaultCenter={{ lat, lng }}
                defaultZoom={16}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                gestureHandling="greedy"
                fullscreenControl={true}
                streetViewControl={true}
                mapTypeControl={true}
                className="w-full h-full min-h-[320px] sm:min-h-[400px]"
                onClick={(e) => {
                  if (e.detail?.latLng) {
                    const clickLat = Number(e.detail.latLng.lat.toFixed(6));
                    const clickLng = Number(e.detail.latLng.lng.toFixed(6));
                    handleUpdateCoordinates(clickLat, clickLng);
                  }
                }}
              >
                <ModalMapController center={{ lat, lng }} />

                <AdvancedMarker
                  position={{ lat, lng }}
                  draggable={true}
                  onDragEnd={(e) => {
                    if (e.latLng) {
                      const dragLat = Number(e.latLng.lat.toFixed(6));
                      const dragLng = Number(e.latLng.lng.toFixed(6));
                      handleUpdateCoordinates(dragLat, dragLng);
                    }
                  }}
                  title="ลากหมุดเพื่อปรับตำแหน่งบ้าน"
                >
                  <div className="relative flex items-center justify-center cursor-grab active:cursor-grabbing">
                    <div className="absolute w-10 h-10 bg-red-500 opacity-30 rounded-full animate-ping pointer-events-none" />
                    <div className="w-9 h-9 rounded-full bg-red-600 border-3 border-white shadow-xl flex items-center justify-center text-white">
                      <MapPin className="w-5 h-5 fill-white text-white" />
                    </div>
                  </div>
                </AdvancedMarker>
              </Map>
            </APIProvider>
          ) : (
            <LeafletLocationPicker
              lat={lat}
              lng={lng}
              onUpdateCoordinates={handleUpdateCoordinates}
              className="w-full h-full min-h-[320px] sm:min-h-[400px]"
            />
          )}

          {/* Feedback message banner overlay */}
          {feedbackMsg && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1100] bg-slate-900/90 text-white px-4 py-2 rounded-2xl shadow-xl border border-emerald-500/40 flex items-center gap-2 text-xs font-semibold backdrop-blur-md animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Success Save Banner */}
          {isSavedSuccess && (
            <div className="absolute inset-0 z-[1200] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-3 animate-bounce">
                <Check className="w-9 h-9" />
              </div>
              <h4 className="text-lg font-bold text-emerald-300 mb-1">
                บันทึกพิกัดตำแหน่งสำเร็จเรียบร้อย!
              </h4>
              <p className="text-xs text-slate-300 font-mono">
                ละติจูด (Lat): {lat} | ลองจิจูด (Lng): {lng}
              </p>
            </div>
          )}

          {/* Help Overlay Badge */}
          <div className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs font-medium text-slate-700 flex items-center gap-1.5 pointer-events-none">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>คลิกบนแผนที่ หรือลากหมุดแดงไปยังหลังคาบ้าน</span>
          </div>
        </div>

        {/* Latitude & Longitude Direct Edit Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Latitude (ละติจูด N)
              </label>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) handleUpdateCoordinates(val, lng);
                }}
                className="w-full p-2.5 rounded-xl bg-white border border-slate-300 font-mono text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Longitude (ลองจิจูด E)
              </label>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) handleUpdateCoordinates(lat, val);
                }}
                className="w-full p-2.5 rounded-xl bg-white border border-slate-300 font-mono text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={isSavedSuccess}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-200 transition disabled:opacity-75"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกพิกัดตำแหน่ง</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
