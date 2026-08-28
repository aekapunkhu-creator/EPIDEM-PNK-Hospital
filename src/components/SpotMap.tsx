import React, { useState, useEffect } from 'react';
import { Patient, HouseholdContact, SubdistrictInfo } from '../types';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  useMap 
} from '@vis.gl/react-google-maps';
import { LeafletSpotMap } from './LeafletSpotMap';
import { 
  MapPin, Filter, Layers, Phone, Send, Info, Eye, Share2, 
  ExternalLink, Compass, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles
} from 'lucide-react';

interface SpotMapProps {
  patients: Patient[];
  contacts: HouseholdContact[];
  subdistricts: SubdistrictInfo[];
  onTriggerPatientNotify: (patient: Patient) => void;
  onSelectPatient: (patient: Patient) => void;
  onOpenShareLocationModal?: (patient?: Patient) => void;
}

// Center of Amphoe Phon Na Kaeo, Sakon Nakhon
const PHON_NA_KAEO_CENTER = { lat: 17.2225884, lng: 104.3093759 };
const GOOGLE_MAPS_LINK = 'https://www.google.com/maps/place/%E0%B8%AD%E0%B8%B3%E0%B9%80%E0%B8%A0%E0%B8%AD+%E0%B9%82%E0%B8%9E%E0%B8%99%E0%B8%99%E0%B8%B2%E0%B9%81%E0%B8%81%E0%B9%89%E0%B8%A7+%E0%B8%AA%E0%B8%81%E0%B8%A5%E0%B8%99%E0%B8%84%E0%B8%A3/@17.2129279,104.2251699,33512m/data=!3m2!1e3!4b1!4m6!3m5!1s0x313c61b61e0097eb:0x302b54113606ca0!8m2!3d17.2225884!4d104.3093759!16s%2Fm%2F02q2lpd';

// Controller to smoothly pan/zoom when subdistrict changes
const MapViewController: React.FC<{
  targetCenter: { lat: number; lng: number };
  targetZoom: number;
}> = ({ targetCenter, targetZoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(targetCenter);
    map.setZoom(targetZoom);
  }, [map, targetCenter.lat, targetCenter.lng, targetZoom]);

  return null;
};

export const SpotMap: React.FC<SpotMapProps> = ({
  patients,
  contacts,
  subdistricts,
  onTriggerPatientNotify,
  onSelectPatient,
  onOpenShareLocationModal
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Filters
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPatientForModal, setSelectedPatientForModal] = useState<Patient | null>(null);
  const [activeInfoWindowPatient, setActiveInfoWindowPatient] = useState<Patient | null>(null);
  const [activeInfoWindowContact, setActiveInfoWindowContact] = useState<HouseholdContact | null>(null);

  // Map camera state
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(PHON_NA_KAEO_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(12);

  // Sync center when subdistrict changes
  useEffect(() => {
    if (selectedSubdistrict === 'all') {
      setMapCenter(PHON_NA_KAEO_CENTER);
      setMapZoom(12);
    } else {
      const found = subdistricts.find(s => s.name === selectedSubdistrict);
      if (found && found.lat && found.lng) {
        setMapCenter({ lat: found.lat, lng: found.lng });
        setMapZoom(14);
      }
    }
  }, [selectedSubdistrict, subdistricts]);

  // Filter patients
  const filteredPatients = patients.filter(p => {
    const matchSub = selectedSubdistrict === 'all' || p.subdistrict === selectedSubdistrict;
    const matchCat =
      selectedCategory === 'all' ||
      (selectedCategory === 'active' && p.status === 'Active') ||
      (selectedCategory === 'smear_pos' && p.tbType === 'Pulmonary Smear+' && p.status === 'Active') ||
      (selectedCategory === 'cured' && (p.status === 'Cured' || p.status === 'Completed'));
    return matchSub && matchCat;
  });

  // Filter contacts
  const filteredContacts = (selectedCategory === 'all' || selectedCategory === 'contacts')
    ? contacts.filter(c => selectedSubdistrict === 'all' || c.subdistrict === selectedSubdistrict)
    : [];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 font-['Prompt',sans-serif]">
      
      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                SpotMap แผนที่พิกัดระบาดวิทยาวัณโรค อ.โพนนาแก้ว
              </h2>
              {apiKey && apiKey.trim() !== '' ? (
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  Google Maps Platform
                </span>
              ) : (
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  Interactive Map (OSM / Satellite)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              อำเภอโพนนาแก้ว จังหวัดสกลนคร &bull; รองรับภาพถ่ายดาวเทียมและพิกัดระดับหลังคาบ้าน
            </p>
          </div>
        </div>

        {/* Action & Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* External Google Maps Button */}
          <a
            href={GOOGLE_MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
            title="เปิดพิกัดอำเภอโพนนาแก้วใน Google Maps"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>เปิดใน Google Maps</span>
          </a>

          {/* Subdistrict Dropdown */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedSubdistrict}
              onChange={e => setSelectedSubdistrict(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">ทุกตำบล (5 ตำบล)</option>
              {subdistricts.map(s => (
                <option key={s.code} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">แสดงทั้งหมด ({patients.length + contacts.length})</option>
              <option value="active">เฉพาะกำลังรักษาอยู่ (Active)</option>
              <option value="smear_pos">เสมหะพบเชื้อ (Smear+)</option>
              <option value="cured">รักษาหายแล้ว (Cured)</option>
              <option value="contacts">ผู้สัมผัสเสี่ยงสูง (Contacts)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map + Legend Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Map Container */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-2 shadow-sm relative overflow-hidden flex flex-col">
          <div className="w-full h-[540px] rounded-xl overflow-hidden relative">
            {apiKey && apiKey.trim() !== '' ? (
              <APIProvider apiKey={apiKey} language="th" region="TH">
                <Map
                  id="spot-map-main"
                  defaultCenter={PHON_NA_KAEO_CENTER}
                  defaultZoom={12}
                  mapId="DEMO_MAP_ID"
                  internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                  gestureHandling="greedy"
                  fullscreenControl={true}
                  streetViewControl={true}
                  mapTypeControl={true}
                  className="w-full h-full"
                >
                  <MapViewController targetCenter={mapCenter} targetZoom={mapZoom} />

                  {/* Patient Markers */}
                  {filteredPatients.map(p => {
                    const isSmearPos = p.status === 'Active' && p.tbType === 'Pulmonary Smear+';
                    const isSmearNeg = p.status === 'Active' && p.tbType !== 'Pulmonary Smear+';
                    const isCured = p.status === 'Cured' || p.status === 'Completed';

                    let bgColor = '#10b981'; // green
                    let ringColor = 'rgba(16, 185, 129, 0.4)';
                    if (isSmearPos) {
                      bgColor = '#ef4444'; // red
                      ringColor = 'rgba(239, 68, 68, 0.4)';
                    } else if (isSmearNeg) {
                      bgColor = '#f97316'; // orange
                      ringColor = 'rgba(249, 115, 22, 0.4)';
                    }

                    const lat = p.lat && p.lat !== 0 ? p.lat : 17.2225;
                    const lng = p.lng && p.lng !== 0 ? p.lng : 104.3093;

                    return (
                      <AdvancedMarker
                        key={p.id}
                        position={{ lat, lng }}
                        onClick={() => {
                          setActiveInfoWindowPatient(p);
                          setActiveInfoWindowContact(null);
                          setSelectedPatientForModal(p);
                        }}
                        title={`${p.prefix}${p.firstName} ${p.lastName} (HN: ${p.hn})`}
                      >
                        <div className="relative group cursor-pointer">
                          {isSmearPos && (
                            <div 
                              className="absolute -inset-1.5 rounded-full animate-ping pointer-events-none"
                              style={{ backgroundColor: ringColor }}
                            />
                          )}
                          <div 
                            className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-[11px] transition-transform group-hover:scale-110"
                            style={{ backgroundColor: bgColor }}
                          >
                            TB
                          </div>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                  {/* Contact Markers */}
                  {filteredContacts.map((c, idx) => {
                    const contactLat = 17.210 + (idx * 0.003 % 0.03);
                    const contactLng = 104.300 + (idx * 0.004 % 0.03);

                    return (
                      <AdvancedMarker
                        key={c.id}
                        position={{ lat: contactLat, lng: contactLng }}
                        onClick={() => {
                          setActiveInfoWindowContact(c);
                          setActiveInfoWindowPatient(null);
                        }}
                        title={`ผู้สัมผัสร่วมบ้าน: ${c.prefix}${c.firstName} ${c.lastName}`}
                      >
                        <div className="w-6 h-6 rounded-full bg-amber-400 border-2 border-white shadow-md flex items-center justify-center text-amber-950 font-bold text-[9px] cursor-pointer hover:scale-110 transition">
                          CT
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                  {/* Patient InfoWindow */}
                  {activeInfoWindowPatient && (
                    <InfoWindow
                      position={{
                        lat: activeInfoWindowPatient.lat || 17.2225,
                        lng: activeInfoWindowPatient.lng || 104.3093
                      }}
                      onCloseClick={() => setActiveInfoWindowPatient(null)}
                    >
                      <div className="p-1 max-w-[240px] font-['Prompt',sans-serif] text-slate-800">
                        <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-100 pb-1">
                          <span className="font-bold text-xs text-slate-900">
                            {activeInfoWindowPatient.prefix}{activeInfoWindowPatient.firstName} {activeInfoWindowPatient.lastName}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {activeInfoWindowPatient.hn}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-0.5 mb-2">
                          <p>📍 {activeInfoWindowPatient.subdistrict} ({activeInfoWindowPatient.village})</p>
                          <p>💊 สูตรยา: <b className="text-slate-800">{activeInfoWindowPatient.regimen}</b></p>
                          <p>👤 อสม.: <span className="text-emerald-700 font-medium">{activeInfoWindowPatient.dotsSupervisorName}</span></p>
                          <p className="text-[10px] font-mono text-slate-400">
                            พิกัด: {activeInfoWindowPatient.lat?.toFixed(5)}, {activeInfoWindowPatient.lng?.toFixed(5)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedPatientForModal(activeInfoWindowPatient);
                              onSelectPatient(activeInfoWindowPatient);
                            }}
                            className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition text-center"
                          >
                            ดูประวัติผู้ป่วย
                          </button>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${activeInfoWindowPatient.lat},${activeInfoWindowPatient.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition flex items-center justify-center shrink-0"
                            title="นำทางด้วย Google Maps"
                          >
                            <ExternalLink className="w-3 h-3 text-blue-600" />
                          </a>
                        </div>
                      </div>
                    </InfoWindow>
                  )}

                  {/* Contact InfoWindow */}
                  {activeInfoWindowContact && (
                    <InfoWindow
                      position={{
                        lat: 17.210 + (contacts.indexOf(activeInfoWindowContact) * 0.003 % 0.03),
                        lng: 104.300 + (contacts.indexOf(activeInfoWindowContact) * 0.004 % 0.03)
                      }}
                      onCloseClick={() => setActiveInfoWindowContact(null)}
                    >
                      <div className="p-1 max-w-[220px] font-['Prompt',sans-serif] text-slate-800">
                        <p className="font-bold text-xs text-amber-800 mb-1">
                          ผู้สัมผัสเสี่ยงสูง: {activeInfoWindowContact.prefix}{activeInfoWindowContact.firstName} {activeInfoWindowContact.lastName}
                        </p>
                        <p className="text-[11px] text-slate-600 mb-1">
                          ผู้ป่วยดัชนี: <b>{activeInfoWindowContact.indexPatientName}</b><br/>
                          ตำบล: {activeInfoWindowContact.subdistrict}<br/>
                          ผลคัดกรอง: <span className="font-bold text-slate-800">{activeInfoWindowContact.outcome}</span>
                        </p>
                      </div>
                    </InfoWindow>
                  )}

                </Map>
              </APIProvider>
            ) : (
              <LeafletSpotMap
                center={mapCenter}
                zoom={mapZoom}
                patients={filteredPatients}
                contacts={filteredContacts}
                onSelectPatient={(p) => {
                  setSelectedPatientForModal(p);
                  onSelectPatient(p);
                }}
                onOpenShareLocationModal={onOpenShareLocationModal}
              />
            )}
          </div>

          {/* Map Overlay Badge Legend */}
          <div className="absolute bottom-5 left-5 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-xl text-xs space-y-1.5 max-w-[240px]">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>สัญลักษณ์หมุด SpotMap</span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                Google Maps
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 border border-white shrink-0"></span>
              <span className="text-slate-700">เสมหะพบเชื้อ (Smear+)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-white shrink-0"></span>
              <span className="text-slate-700">เสมหะไม่พบเชื้อ/นอกปอด</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-white shrink-0"></span>
              <span className="text-slate-700">ผู้สัมผัสร่วมบ้านเสี่ยงสูง</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white shrink-0"></span>
              <span className="text-slate-700">รักษาหายแล้ว (Cured)</span>
            </div>
          </div>
        </div>

        {/* Side Subdistrict Summary Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
          <div className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>สรุปตามตำบล (โพนนาแก้ว)</span>
            <span className="text-xs text-slate-400">5 ตำบล</span>
          </div>

          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
            {subdistricts.map(sub => {
              const subP = patients.filter(p => p.subdistrict === sub.name && p.status === 'Active');
              const smearPos = subP.filter(p => p.tbType === 'Pulmonary Smear+').length;

              return (
                <div 
                  key={sub.code}
                  onClick={() => setSelectedSubdistrict(sub.name)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    selectedSubdistrict === sub.name
                      ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-300'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{sub.name}</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {subP.length} เคส
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>รพ.สต.: {sub.healthCenterName.replace('โรงพยาบาลโพนนาแก้ว / ', '')}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                    <span className="bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-medium">
                      เสมหะพบเชื้อ: {smearPos}
                    </span>
                    <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                      หมู่บ้าน: {sub.villagesCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedSubdistrict !== 'all' && (
            <button
              onClick={() => setSelectedSubdistrict('all')}
              className="w-full py-2 text-center text-xs text-emerald-700 font-semibold bg-emerald-50 rounded-xl hover:bg-emerald-100 transition"
            >
              รีเซ็ตแสดงทุกตำบล
            </button>
          )}
        </div>

      </div>

      {/* Selected Patient Quick Detail Modal / Bottom Banner */}
      {selectedPatientForModal && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded text-xs font-mono">
                {selectedPatientForModal.hn}
              </span>
              <h3 className="text-base font-bold">
                {selectedPatientForModal.prefix}{selectedPatientForModal.firstName} {selectedPatientForModal.lastName} ({selectedPatientForModal.age} ปี)
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              📍 ที่อยู่: {selectedPatientForModal.houseNo} {selectedPatientForModal.village} {selectedPatientForModal.subdistrict} อ.โพนนาแก้ว
              &nbsp;|&nbsp; อสม.ผู้ดูแล: <span className="text-emerald-300 font-medium">{selectedPatientForModal.dotsSupervisorName}</span> ({selectedPatientForModal.dotsSupervisorPhone})
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedPatientForModal.lat},${selectedPatientForModal.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-medium text-xs flex items-center gap-1.5 transition"
              title="เปิดตำแหน่งบ้านใน Google Maps เพื่อนำทาง"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>นำทาง Google Maps</span>
            </a>

            {onOpenShareLocationModal && (
              <button
                onClick={() => onOpenShareLocationModal(selectedPatientForModal)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>สร้างลิงก์ส่งพิกัด</span>
              </button>
            )}

            <button
              onClick={() => onTriggerPatientNotify(selectedPatientForModal)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>เตือนกินยาผ่าน LINE</span>
            </button>

            <button
              onClick={() => onSelectPatient(selectedPatientForModal)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-medium text-xs flex items-center gap-1.5 transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>เปิดบันทึกผู้ป่วย</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
