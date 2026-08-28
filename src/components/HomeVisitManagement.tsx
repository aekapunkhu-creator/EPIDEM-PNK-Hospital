import React, { useState, useMemo, useEffect, useRef } from 'react';
import { HomeVisitRecord, Patient, HouseholdContact, SubdistrictInfo, UserAccount, HomeVisitStatus } from '../types';
import { 
  Home, Plus, Search, Filter, Calendar, MapPin, Activity, 
  Pill, AlertTriangle, ShieldCheck, Heart, Stethoscope, 
  Printer, Edit2, Trash2, CheckCircle2, User, Eye, Compass, 
  Clock, Download, ChevronRight, Sparkles, Send, FileSpreadsheet, Map as MapIcon, Layers,
  Navigation, ExternalLink, Route
} from 'lucide-react';
import L from 'leaflet';
import { PHON_NA_KAEO_SUBDISTRICTS } from '../data/mockData';
import { HomeVisitModal } from './HomeVisitModal';
import { HomeVisitPrintModal } from './HomeVisitPrintModal';
import { HomeVisitRoutePlanner } from './HomeVisitRoutePlanner';
import { openGoogleMapsNavigation, getGoogleMapsDirectionsUrl } from '../utils/navigation';

interface HomeVisitManagementProps {
  homeVisits?: HomeVisitRecord[];
  patients?: Patient[];
  contacts?: HouseholdContact[];
  subdistricts?: SubdistrictInfo[];
  currentUser?: UserAccount | null;
  onSaveHomeVisit: (record: HomeVisitRecord) => void;
  onDeleteHomeVisit: (id: string) => void;
  onTriggerQuickNotify?: (message: string) => void;
  onNavigateToPatients?: () => void;
}

export const HomeVisitManagement: React.FC<HomeVisitManagementProps> = ({
  homeVisits = [],
  patients = [],
  contacts = [],
  subdistricts = PHON_NA_KAEO_SUBDISTRICTS,
  currentUser,
  onSaveHomeVisit,
  onDeleteHomeVisit,
  onTriggerQuickNotify,
  onNavigateToPatients
}) => {
  // Navigation & Sub-views
  const [subView, setSubView] = useState<'records' | 'schedule' | 'route-planner' | 'analytics' | 'map'>('records');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<string>('ทั้งหมด');
  const [selectedStatus, setSelectedStatus] = useState<string>('ทั้งหมด');
  const [filterAdrOnly, setFilterAdrOnly] = useState<boolean>(false);
  const [filterLowAdherence, setFilterLowAdherence] = useState<boolean>(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<HomeVisitRecord | null>(null);
  const [initialPatientIdForNew, setInitialPatientIdForNew] = useState<string | undefined>(undefined);
  const [printingRecord, setPrintingRecord] = useState<HomeVisitRecord | null>(null);

  // Map Refs for Home Visit Leaflet Map
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Filtered Home Visit Records
  const filteredRecords = useMemo(() => {
    return homeVisits.filter(r => {
      // Search
      const matchesSearch = 
        !searchQuery ||
        r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.patientHN.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.recommendationsAndNotes && r.recommendationsAndNotes.toLowerCase().includes(searchQuery.toLowerCase()));

      // Subdistrict
      const matchesSubdistrict = 
        selectedSubdistrict === 'ทั้งหมด' || 
        r.subdistrict === selectedSubdistrict;

      // Status
      const matchesStatus = 
        selectedStatus === 'ทั้งหมด' || 
        r.status === selectedStatus;

      // ADR filter (Red flags or side effects)
      const hasAdr = 
        r.sideEffects.jaundice || 
        r.sideEffects.visionBlur || 
        r.sideEffects.nauseaVomiting || 
        r.sideEffects.jointPain || 
        r.sideEffects.itchingRash || 
        r.sideEffects.numbness ||
        r.referralRequired;

      if (filterAdrOnly && !hasAdr) return false;

      // Low adherence filter
      const isLowAdherence = 
        r.adherence.includes('ลืมกินยา') || 
        r.adherence.includes('หยุดยา') || 
        r.missedDosesLast2Weeks > 0;

      if (filterLowAdherence && !isLowAdherence) return false;

      return matchesSearch && matchesSubdistrict && matchesStatus;
    }).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  }, [homeVisits, searchQuery, selectedSubdistrict, selectedStatus, filterAdrOnly, filterLowAdherence]);

  // Key KPI Metrics
  const totalVisits = homeVisits.length;
  const normalVisits = homeVisits.filter(r => r.status === 'เยี่ยมสำเร็จ (ปกติ)').length;
  const issueVisits = homeVisits.filter(r => r.status === 'พบปัญหา/ต้องติดตามใกล้ชิด').length;
  const referralVisits = homeVisits.filter(r => r.status === 'ส่งต่อแพทย์/รพ. (Referral)' || r.referralRequired).length;
  
  // Adherence Calculation
  const perfectAdherenceVisits = homeVisits.filter(r => r.adherence === 'รับประทานยาทุกวัน สม่ำเสมอ 100%').length;
  const overallAdherenceRate = totalVisits > 0 ? Math.round((perfectAdherenceVisits / totalVisits) * 100) : 100;

  // ADR Red Flags Count
  const severeAdrCount = homeVisits.filter(r => r.sideEffects.jaundice || r.sideEffects.visionBlur).length;

  // Patients Due for Follow-up or Defaulter Tracing
  const activePatients = patients.filter(p => p.status === 'Active');
  
  // Patients needing visit
  const patientsNeedingVisit = useMemo(() => {
    return activePatients.map(p => {
      const pVisits = homeVisits.filter(v => v.patientId === p.id || v.patientHN === p.hn);
      const lastVisit = pVisits.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];
      const recentMissed = p.dotsLogs.slice(-7).filter(l => !l.taken).length;
      
      let priority: 'ด่วนมาก (High)' | 'ตามรอบปกติ (Routine)' | 'ครบถ้วนแล้ว' = 'ตามรอบปกติ (Routine)';
      let reason = 'ติดตามการกินยาตามรอบการรักษา';

      if (recentMissed >= 2) {
        priority = 'ด่วนมาก (High)';
        reason = `ลืมกินยา ${recentMissed} วันในรอบสัปดาห์ (เสี่ยงขาดยา)`;
      } else if (!lastVisit) {
        priority = 'ด่วนมาก (High)';
        reason = 'ยังไม่เคยได้รับการเยี่ยมบ้านหลังเริ่มรักษา';
      } else if (lastVisit.referralRequired || lastVisit.status === 'พบปัญหา/ต้องติดตามใกล้ชิด') {
        priority = 'ด่วนมาก (High)';
        reason = 'รอบล่าสุดพบปัญหา/อาการข้างเคียง ต้องติดตามซ้ำ';
      }

      return {
        patient: p,
        visitCount: pVisits.length,
        lastVisit,
        priority,
        reason,
        missedDoses: recentMissed
      };
    }).sort((a, b) => (a.priority === 'ด่วนมาก (High)' ? -1 : 1));
  }, [activePatients, homeVisits]);

  // Leaflet Map Initialization for Home Visit Map Tab
  useEffect(() => {
    if (subView !== 'map') return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [17.085, 104.295],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    // Render Markers
    if (markersLayerRef.current && mapInstanceRef.current) {
      markersLayerRef.current.clearLayers();

      const bounds: L.LatLngExpression[] = [];

      filteredRecords.forEach(r => {
        if (!r.visitLat || !r.visitLng) return;

        const isReferral = r.referralRequired || r.status === 'ส่งต่อแพทย์/รพ. (Referral)';
        const isWarning = r.status === 'พบปัญหา/ต้องติดตามใกล้ชิด';
        
        let markerColor = '#10b981'; // Emerald
        let statusBadge = 'ปกติ';
        if (isReferral) {
          markerColor = '#ef4444'; // Red
          statusBadge = 'ส่งต่อ รพ.';
        } else if (isWarning) {
          markerColor = '#f59e0b'; // Amber
          statusBadge = 'เฝ้าระวัง';
        }

        const customIcon = L.divIcon({
          className: 'custom-home-visit-marker',
          html: `
            <div style="
              background-color: ${markerColor};
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 4px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 11px;
            ">
              🏠
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });

        const marker = L.marker([r.visitLat, r.visitLng], { icon: customIcon });

        const gmapsUrl = getGoogleMapsDirectionsUrl({
          lat: r.visitLat,
          lng: r.visitLng,
          address: `${r.houseNo ? `บ้านเลขที่ ${r.houseNo} ` : ''}${r.village} ${r.subdistrict}`,
          name: r.patientName
        });

        const popupContent = `
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 220px;">
            <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px; color: #0f172a;">
              ${r.patientName} (HN: ${r.patientHN})
            </div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
              ${r.village}, ${r.subdistrict}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>ครั้งที่เยี่ยม:</strong> ครั้งที่ ${r.visitRound} (${r.visitDate})
            </div>
            <div style="margin-bottom: 4px;">
              <strong>ผู้เยี่ยม:</strong> ${r.visitorName}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>การกินยา DOTS:</strong> ${r.adherence}
            </div>
            <div style="margin-bottom: 6px;">
              <strong>สถานะ:</strong> <span style="font-weight: bold; color: ${markerColor};">${r.status}</span>
            </div>
            ${r.recommendationsAndNotes ? `<div style="font-style: italic; color: #475569; font-size: 11px; margin-bottom: 8px; border-top: 1px dashed #cbd5e1; padding-top: 4px;">${r.recommendationsAndNotes}</div>` : ''}
            <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 6px;">
              <a href="${gmapsUrl}" target="_blank" rel="noreferrer" style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                background-color: #0284c7;
                color: white;
                padding: 6px 12px;
                border-radius: 8px;
                font-weight: bold;
                font-size: 11px;
                text-decoration: none;
                box-shadow: 0 1px 3px rgba(0,0,0,0.15);
              ">
                🧭 เปิดนำทาง Google Maps
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersLayerRef.current?.addLayer(marker);
        bounds.push([r.visitLat, r.visitLng]);
      });

      if (bounds.length > 0) {
        mapInstanceRef.current.fitBounds(bounds as any, { padding: [40, 40] });
      }
    }
  }, [subView, filteredRecords]);

  // Export CSV Helper
  const handleExportCSV = () => {
    if (homeVisits.length === 0) {
      alert('ยังไม่มีข้อมูลการเยี่ยมบ้านเพื่อส่งออก');
      return;
    }
    const headers = [
      'รหัสการเยี่ยม', 'วันที่เยี่ยม', 'ครั้งที่', 'เลข HN', 'ชื่อ-สกุล ผู้ป่วย',
      'ตำบล', 'หมู่บ้าน', 'ผู้เยี่ยมบ้าน', 'ตำแหน่ง', 'หน่วยบริการ',
      'ความสม่ำเสมอในการกินยา', 'นับเม็ดยา', 'อาการไอ', 'เสมหะ', 'ความดันโลหิต', 'น้ำหนัก(kg)',
      'ตัวเหลืองตาเหลือง', 'ตามัว', 'การระบายอากาศ', 'สถานะการเยี่ยม', 'การส่งต่อแพทย์', 'คำแนะนำ'
    ];

    const rows = homeVisits.map(r => [
      `"${r.id}"`,
      `"${r.visitDate}"`,
      r.visitRound,
      `"${r.patientHN}"`,
      `"${r.patientName}"`,
      `"${r.subdistrict}"`,
      `"${r.village}"`,
      `"${r.visitorName}"`,
      `"${r.visitorRole}"`,
      `"${r.visitorUnit}"`,
      `"${r.adherence}"`,
      `"${r.pillCountStatus}"`,
      `"${r.symptoms.cough}"`,
      `"${r.symptoms.sputumCharacteristics || '-'}"`,
      `"${r.vitals.bloodPressure || '-'}"`,
      r.vitals.bodyWeight || '',
      r.sideEffects.jaundice ? 'มี' : 'ไม่มี',
      r.sideEffects.visionBlur ? 'มี' : 'ไม่มี',
      `"${r.environment.ventilation}"`,
      `"${r.status}"`,
      r.referralRequired ? `ส่งต่อ: ${r.referralReason}` : 'ไม่ต้องส่งต่อ',
      `"${(r.recommendationsAndNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TB_Home_Visits_PhonNaKaeo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewVisit = (pId?: string) => {
    setEditingRecord(null);
    setInitialPatientIdForNew(pId);
    setIsModalOpen(true);
  };

  const handleOpenEditVisit = (record: HomeVisitRecord) => {
    setEditingRecord(record);
    setInitialPatientIdForNew(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบันทึกการเยี่ยมบ้านของ "${name}"?`)) {
      onDeleteHomeVisit(id);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-emerald-700/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold tracking-wide uppercase">
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            <span>ระบบเยี่ยมบ้านและติดตามผู้ป่วยวัณโรคในชุมชน (TB Home-Care Follow-up)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            ระบบเยี่ยมบ้านผู้ป่วยวัณโรค อ.โพนนาแก้ว
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
            บูรณาการการลงพื้นที่ติดตามการกินยา DOTS, ตรวจสอบอาการข้างเคียง (ADR), สุขาภิบาลสิ่งแวดล้อม และประสานงานทีม 3 หมอ รพ.สต.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto">
          <button
            onClick={() => handleOpenNewVisit()}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ บันทึกการเยี่ยมบ้านใหม่</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 shadow-sm transition"
            title="ส่งออกรายงาน CSV"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">จำนวนครั้งที่เยี่ยมทั้งหมด</span>
            <Home className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {totalVisits} <span className="text-xs font-normal text-slate-500 font-sans">ครั้ง</span>
          </div>
          <p className="text-[11px] text-slate-600">
            ครอบคลุม 5 ตำบล อ.โพนนาแก้ว
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">เยี่ยมสำเร็จ (ปกติ)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {normalVisits} <span className="text-xs font-normal text-slate-500 font-sans">ครั้ง</span>
          </div>
          <p className="text-[11px] text-emerald-800">
            กินยาสม่ำเสมอ ไร้อาการข้างเคียงรุนแรง
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">พบปัญหา / เฝ้าระวัง</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {issueVisits} <span className="text-xs font-normal text-slate-500 font-sans">ราย</span>
          </div>
          <p className="text-[11px] text-amber-800">
            ลืมกินยา / สภาพแวดล้อมแออัด
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">ส่งต่อพบแพทย์ด่วน (Referral)</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono">
            {referralVisits} <span className="text-xs font-normal text-slate-500 font-sans">ราย</span>
          </div>
          <p className="text-[11px] text-red-800">
            ตาเหลือง / ตามัว / แพ้ยารุนแรง
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">ความสม่ำเสมอในการกินยา</span>
            <Pill className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700 font-mono">
            {overallAdherenceRate}%
          </div>
          <p className="text-[11px] text-purple-800">
            DOTS Adherence สม่ำเสมอ 100%
          </p>
        </div>

      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm flex flex-wrap items-center justify-between gap-2">
        
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setSubView('records')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              subView === 'records'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>รายการบันทึกการเยี่ยมบ้าน ({filteredRecords.length})</span>
          </button>

          <button
            onClick={() => setSubView('schedule')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              subView === 'schedule'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>แผนติดตาม & ผู้ป่วยที่ต้องเยี่ยม ({patientsNeedingVisit.length})</span>
          </button>

          <button
            onClick={() => setSubView('route-planner')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              subView === 'route-planner'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4 text-sky-400" />
            <span>🧭 วางแผน & นำทาง Google Maps</span>
          </button>

          <button
            onClick={() => setSubView('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              subView === 'analytics'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>สรุปผลข้างเคียง ADR & สุขาภิบาล</span>
          </button>

          <button
            onClick={() => setSubView('map')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              subView === 'map'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>แผนที่จุดเยี่ยมบ้าน (Map)</span>
          </button>
        </div>

        {subView === 'records' && (
          <div className="flex items-center gap-1 pr-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${viewMode === 'cards' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}
              title="มุมมองการ์ด (Card View)"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${viewMode === 'table' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}
              title="มุมมองตาราง (Table View)"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Areas */}
      {subView === 'records' && (
        <div className="space-y-4">
          
          {/* Search & Filter FilterBar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อผู้ป่วย, HN, ชื่อผู้เยี่ยมบ้าน, หมู่บ้าน, อาการ..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedSubdistrict}
                onChange={e => setSelectedSubdistrict(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ทั้งหมด">ทุกตำบล (5 ตำบล)</option>
                {PHON_NA_KAEO_SUBDISTRICTS.map(s => (
                  <option key={s.code} value={s.name}>{s.name}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ทั้งหมด">ทุกสถานะผลการเยี่ยม</option>
                <option value="เยี่ยมสำเร็จ (ปกติ)">เยี่ยมสำเร็จ (ปกติ)</option>
                <option value="พบปัญหา/ต้องติดตามใกล้ชิด">พบปัญหา/ต้องติดตามใกล้ชิด</option>
                <option value="ส่งต่อแพทย์/รพ. (Referral)">ส่งต่อแพทย์/รพ. (Referral)</option>
                <option value="ไม่อยู่บ้าน/เลื่อนนัด">ไม่อยู่บ้าน/เลื่อนนัด</option>
              </select>

              <button
                type="button"
                onClick={() => setFilterAdrOnly(!filterAdrOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  filterAdrOnly
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>เฉพาะมีผลข้างเคียง/ADR</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterLowAdherence(!filterLowAdherence)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  filterLowAdherence
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>เสี่ยงขาดยา/ลืมกินยา</span>
              </button>
            </div>
          </div>

          {/* Records List View */}
          {filteredRecords.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">ไม่พบรายการบันทึกการเยี่ยมบ้าน</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                ยังไม่มีข้อมูลการเยี่ยมบ้านที่ตรงกับเงื่อนไขการค้นหา คุณสามารถกดปุ่ม "บันทึกการเยี่ยมบ้านใหม่" เพื่อเริ่มต้นบันทึกข้อมูล
              </p>
              <button
                onClick={() => handleOpenNewVisit()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>บันทึกการเยี่ยมบ้านแรก</span>
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecords.map(record => {
                const isReferral = record.referralRequired || record.status === 'ส่งต่อแพทย์/รพ. (Referral)';
                const isWarning = record.status === 'พบปัญหา/ต้องติดตามใกล้ชิด';
                const hasSevereAdr = record.sideEffects.jaundice || record.sideEffects.visionBlur;

                return (
                  <div
                    key={record.id}
                    className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between space-y-4 ${
                      isReferral
                        ? 'border-red-300 ring-1 ring-red-200'
                        : isWarning
                        ? 'border-amber-300'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {record.patientName}
                            </span>
                            <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                              HN: {record.patientHN}
                            </span>
                            <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                              ครั้งที่ {record.visitRound}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{record.houseNo ? `บ้านเลขที่ ${record.houseNo} ` : ''}{record.village}, {record.subdistrict}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isReferral ? (
                            <span className="bg-red-100 text-red-800 border border-red-200 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>ส่งต่อ รพ.</span>
                            </span>
                          ) : isWarning ? (
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>ต้องเฝ้าระวัง</span>
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>เยี่ยมสำเร็จ (ปกติ)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Clinical & DOTS Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-xs">
                        <div>
                          <span className="text-[11px] text-slate-500 block">วันที่เยี่ยม</span>
                          <span className="font-semibold text-slate-800">{record.visitDate}</span>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-500 block">ผู้เยี่ยมบ้าน</span>
                          <span className="font-semibold text-slate-800 truncate block" title={record.visitorName}>
                            {record.visitorName}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-500 block">สัญญาณชีพ / SpO2</span>
                          <span className="font-mono font-semibold text-slate-800">
                            {record.vitals.bloodPressure || '-'} | SpO2 {record.vitals.oxygenSat || 98}%
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-500 block">อาการไอ</span>
                          <span className="font-medium text-slate-800">{record.symptoms.cough}</span>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-500 block">ผู้กำกับยา DOTS</span>
                          <span className="font-medium text-slate-800 truncate block">
                            {record.dotsSupervisor.type} {record.dotsSupervisor.name ? `(${record.dotsSupervisor.name})` : ''}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-500 block">การระบายอากาศ</span>
                          <span className="font-medium text-slate-800 truncate block">
                            {record.environment.ventilation.split(' ')[0]}
                          </span>
                        </div>
                      </div>

                      {/* Adherence & Warnings */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">ความร่วมมือในการกินยา:</span>
                          <span className={`font-bold ${record.adherence.includes('100%') ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {record.adherence}
                          </span>
                        </div>

                        {/* Red Flag Warning Box if Any */}
                        {(hasSevereAdr || record.referralRequired) && (
                          <div className="bg-red-50 border border-red-200 text-red-950 p-2 rounded-lg text-xs font-semibold flex items-start gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <div>
                              <span>ข้อบ่งชี้ส่งต่อ: </span>
                              <span>{record.referralReason || (record.sideEffects.jaundice ? 'พบตัวเหลืองตาเหลือง' : 'พบอาการตามัว')}</span>
                            </div>
                          </div>
                        )}

                        {/* Notes snippet */}
                        {record.recommendationsAndNotes && (
                          <p className="text-xs text-slate-600 bg-slate-50/80 p-2 rounded-lg italic">
                            "{record.recommendationsAndNotes}"
                          </p>
                        )}
                      </div>

                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>นัดครั้งถัดไป: {record.nextAppointmentDate || record.nextVisitDueDate || '-'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openGoogleMapsNavigation({
                            lat: record.visitLat,
                            lng: record.visitLng,
                            address: `${record.houseNo ? `บ้านเลขที่ ${record.houseNo} ` : ''}${record.village} ${record.subdistrict}`,
                            name: record.patientName
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold flex items-center gap-1 transition"
                          title="เปิดนำทาง Google Maps ไปยังบ้านผู้ป่วย"
                        >
                          <Compass className="w-3.5 h-3.5 text-sky-600" />
                          <span>นำทาง</span>
                        </button>

                        <button
                          onClick={() => setPrintingRecord(record)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                          title="พิมพ์รายงานเยี่ยมบ้าน"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>พิมพ์</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditVisit(record)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 transition"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>แก้ไข</span>
                        </button>

                        <button
                          onClick={() => handleDelete(record.id, record.patientName)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition"
                          title="ลบข้อมูล"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-3">วันที่ / ครั้งที่</th>
                      <th className="p-3">HN / ชื่อผู้ป่วย</th>
                      <th className="p-3">ตำบล / หมู่บ้าน</th>
                      <th className="p-3">ผู้เยี่ยมบ้าน</th>
                      <th className="p-3">สัญญาณชีพ / น้ำหนัก</th>
                      <th className="p-3">การกินยา DOTS</th>
                      <th className="p-3">สถานะผลการเยี่ยม</th>
                      <th className="p-3 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map(record => (
                      <tr key={record.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-medium whitespace-nowrap">
                          <div>{record.visitDate}</div>
                          <span className="text-[11px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            ครั้งที่ {record.visitRound}
                          </span>
                        </td>

                        <td className="p-3 font-semibold text-slate-900">
                          <div>{record.patientName}</div>
                          <div className="text-[11px] font-mono text-slate-500">HN: {record.patientHN}</div>
                        </td>

                        <td className="p-3 text-slate-700">
                          <div>{record.subdistrict}</div>
                          <div className="text-[11px] text-slate-500">{record.village}</div>
                        </td>

                        <td className="p-3 text-slate-700">
                          <div>{record.visitorName}</div>
                          <div className="text-[11px] text-slate-500">{record.visitorRole}</div>
                        </td>

                        <td className="p-3 text-slate-700 font-mono">
                          <div>BP: {record.vitals.bloodPressure || '-'}</div>
                          <div className="text-[11px]">BW: {record.vitals.bodyWeight || '-'} kg</div>
                        </td>

                        <td className="p-3">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            record.adherence.includes('100%') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {record.adherence.split(' ')[0]}
                          </span>
                        </td>

                        <td className="p-3">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            record.status === 'ส่งต่อแพทย์/รพ. (Referral)'
                              ? 'bg-red-100 text-red-800'
                              : record.status === 'พบปัญหา/ต้องติดตามใกล้ชิด'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openGoogleMapsNavigation({
                                lat: record.visitLat,
                                lng: record.visitLng,
                                address: `${record.houseNo ? `บ้านเลขที่ ${record.houseNo} ` : ''}${record.village} ${record.subdistrict}`,
                                name: record.patientName
                              })}
                              className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800"
                              title="เปิดนำทาง Google Maps"
                            >
                              <Compass className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setPrintingRecord(record)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                              title="พิมพ์แบบประเมิน"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditVisit(record)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
                              title="แก้ไข"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id, record.patientName)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700"
                              title="ลบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Schedule & Defaulter Watchlist Sub-view */}
      {subView === 'schedule' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  แผนการติดตามเยี่ยมบ้านและผู้ป่วยกลุ่มเฝ้าระวังพิเศษ (Follow-up & Defaulter Watchlist)
                </h3>
                <p className="text-xs text-slate-600">
                  รายชื่อผู้ป่วยที่กำลังอยู่ระหว่างการรักษา (Active TB) พร้อมประวัติการเยี่ยมบ้านและการแจ้งเตือนเมื่อลืมกินยา
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patientsNeedingVisit.map(({ patient, visitCount, lastVisit, priority, reason, missedDoses }) => (
              <div
                key={patient.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between ${
                  priority === 'ด่วนมาก (High)' ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {patient.prefix}{patient.firstName} {patient.lastName}
                        </span>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">
                          HN: {patient.hn}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {patient.village}, {patient.subdistrict} | ผู้กำกับยา: {patient.dotsSupervisorName || 'อสม. พี่เลี้ยง'}
                      </div>
                    </div>

                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      priority === 'ด่วนมาก (High)'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {priority}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">เหตุผลความจำเป็น:</span>
                      <span className="font-semibold text-slate-800">{reason}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">ประวัติการเยี่ยมบ้าน:</span>
                      <span className="font-bold text-emerald-800">
                        {visitCount > 0 ? `เคยเยี่ยมแล้ว ${visitCount} ครั้ง (ล่าสุด ${lastVisit?.visitDate})` : 'ยังไม่เคยได้รับการเยี่ยม'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">วันนัดพบแพทย์ รพ. ครั้งถัดไป:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {patient.nextAppointmentDate || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    สูตรยา: {patient.regimen} ({patient.tbType})
                  </span>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openGoogleMapsNavigation({
                        lat: patient.lat || lastVisit?.visitLat,
                        lng: patient.lng || lastVisit?.visitLng,
                        address: `${patient.houseNo ? `บ้านเลขที่ ${patient.houseNo} ` : ''}${patient.village} ${patient.subdistrict}`,
                        name: `${patient.prefix}${patient.firstName} ${patient.lastName}`
                      })}
                      className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold text-xs flex items-center gap-1.5 transition"
                      title="เปิดนำทาง Google Maps ไปยังบ้านผู้ป่วย"
                    >
                      <Compass className="w-3.5 h-3.5 text-sky-600" />
                      <span>นำทาง</span>
                    </button>

                    <button
                      onClick={() => handleOpenNewVisit(patient.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>บันทึกเยี่ยมบ้าน</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Route Planner & Google Maps Trip Navigator Sub-view */}
      {subView === 'route-planner' && (
        <HomeVisitRoutePlanner
          homeVisits={homeVisits}
          patients={patients}
          subdistricts={subdistricts}
          onOpenNewVisitForPatient={(patientId) => handleOpenNewVisit(patientId)}
          onSendLineNotify={onTriggerQuickNotify}
        />
      )}

      {/* Analytics & ADR Sub-view */}
      {subView === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* ADR Matrix Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>รายงานผลข้างเคียงจากยาต้านวัณโรค (ADR Summary)</span>
                </div>
                <span className="text-xs bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">
                  Red Flags: {severeAdrCount} ราย
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { label: 'ตัวเหลือง / ตาเหลือง (สงสัยตับอักเสบจากยา - Red Flag)', count: homeVisits.filter(r => r.sideEffects.jaundice).length, color: 'bg-red-500', isRed: true },
                  { label: 'ตามัว / ตาบอดสี (Ethambutol Toxicity - Red Flag)', count: homeVisits.filter(r => r.sideEffects.visionBlur).length, color: 'bg-red-500', isRed: true },
                  { label: 'คลื่นไส้ / อาเจียน (Nausea & Vomiting)', count: homeVisits.filter(r => r.sideEffects.nauseaVomiting).length, color: 'bg-amber-500' },
                  { label: 'ปวดข้อ / ปวดกล้ามเนื้อ (Joint Pain from PZA)', count: homeVisits.filter(r => r.sideEffects.jointPain).length, color: 'bg-purple-500' },
                  { label: 'ชาปลายมือปลายเท้า (Peripheral Neuropathy from INH)', count: homeVisits.filter(r => r.sideEffects.numbness).length, color: 'bg-blue-500' },
                  { label: 'ผื่นคันตามผิวหนัง (Skin Itching/Rash)', count: homeVisits.filter(r => r.sideEffects.itchingRash).length, color: 'bg-teal-500' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={item.isRed ? 'font-bold text-red-900' : 'text-slate-700'}>{item.label}</span>
                      <span className="font-bold font-mono text-slate-900">{item.count} ครั้ง</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${item.color}`}
                        style={{ width: totalVisits > 0 ? `${(item.count / totalVisits) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Environmental & Infection Control Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>สุขาภิบาลสิ่งแวดล้อมและการควบคุมการแพร่เชื้อ (IPC Analytics)</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block mb-1">การระบายอากาศในบ้าน:</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                      <div className="font-bold text-base">{homeVisits.filter(r => r.environment.ventilation.includes('ดีมาก')).length}</div>
                      <div>โปร่ง ลมถ่ายเทดี</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                      <div className="font-bold text-base">{homeVisits.filter(r => r.environment.ventilation.includes('ปานกลาง')).length}</div>
                      <div>ถ่ายเทพอใช้</div>
                    </div>
                    <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-900">
                      <div className="font-bold text-base">{homeVisits.filter(r => r.environment.ventilation.includes('แออัด')).length}</div>
                      <div>แออัด/ทึบ</div>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-800 block mb-1">ลักษณะห้องนอน:</span>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                    <div className="flex justify-between">
                      <span>แยกห้องนอนเดี่ยว:</span>
                      <span className="font-bold text-emerald-700">{homeVisits.filter(r => r.environment.bedroomType === 'แยกห้องนอนเดี่ยว').length} ราย</span>
                    </div>
                    <div className="flex justify-between">
                      <span>นอนรวมกับสมาชิกในบ้าน (เสี่ยงแพร่เชื้อ):</span>
                      <span className="font-bold text-red-700">{homeVisits.filter(r => r.environment.bedroomType === 'นอนรวมกับสมาชิกในบ้าน').length} ราย</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-800 block mb-1">การกำจัดเสมหะที่ถูกสุขลักษณะ:</span>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                    <div className="flex justify-between">
                      <span>กระโถน/ถุงทิ้งมิดชิดผสมน้ำยาฆ่าเชื้อ:</span>
                      <span className="font-bold text-emerald-700">{homeVisits.filter(r => r.environment.sputumDisposalMethod.includes('น้ำยา')).length} ราย</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Geolocation Map Sub-view */}
      {subView === 'map' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                แผนที่พิกัดการลงพื้นที่เยี่ยมบ้านจริง อ.โพนนาแก้ว
              </h3>
              <p className="text-xs text-slate-500">
                หมุดสีเขียว = ปกติ | หมุดสีส้ม = เฝ้าระวัง/ลืมกินยา | หมุดสีแดง = ส่งต่อพบแพทย์ รพ.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> ปกติ
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> เฝ้าระวัง
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> ส่งต่อ
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-[560px] relative">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
          </div>
        </div>
      )}

      {/* Home Visit Modal (Create / Edit) */}
      {isModalOpen && (
        <HomeVisitModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRecord(null);
            setInitialPatientIdForNew(undefined);
          }}
          onSave={onSaveHomeVisit}
          existingRecord={editingRecord}
          patients={patients}
          contacts={contacts}
          currentUser={currentUser}
          initialPatientId={initialPatientIdForNew}
        />
      )}

      {/* Home Visit Print Modal */}
      {printingRecord && (
        <HomeVisitPrintModal
          isOpen={!!printingRecord}
          onClose={() => setPrintingRecord(null)}
          record={printingRecord}
          patient={patients.find(p => p.id === printingRecord.patientId || p.hn === printingRecord.patientHN)}
          contacts={contacts}
        />
      )}

    </div>
  );
};
