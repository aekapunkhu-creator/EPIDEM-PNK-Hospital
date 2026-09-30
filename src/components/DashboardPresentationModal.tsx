import React, { useState, useEffect, useRef } from 'react';
import { 
  Patient, 
  HouseholdContact, 
  SubdistrictInfo, 
  InvestigationRecord 
} from '../types';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  BarChart3, 
  MapPin, 
  Microscope, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  HeartPulse, 
  Activity, 
  ShieldAlert, 
  Building2, 
  Pill, 
  UserCheck, 
  Clock, 
  Tv, 
  Monitor, 
  Layers
} from 'lucide-react';

interface DashboardPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  contacts: HouseholdContact[];
  investigations: InvestigationRecord[];
  subdistricts: SubdistrictInfo[];
}

export const DashboardPresentationModal: React.FC<DashboardPresentationModalProps> = ({
  isOpen,
  onClose,
  patients,
  contacts,
  investigations,
  subdistricts
}) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isTrueFullscreen, setIsTrueFullscreen] = useState<boolean>(false);
  const [fitMode, setFitMode] = useState<'widescreen169' | 'fillViewport'>('widescreen169');
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Key epidemiological indicators
  const totalPatients = patients.length;
  const activePatients = patients.filter(p => p.status === 'Active');
  const curedPatients = patients.filter(p => p.status === 'Cured' || p.status === 'Completed');
  const interruptedPatients = patients.filter(p => p.status === 'Interrupted' || p.status === 'Died');
  const cureRate = totalPatients > 0 ? Math.round((curedPatients.length / totalPatients) * 100) : 0;
  
  const smearPosCount = patients.filter(p => p.tbType === 'Pulmonary Smear+').length;
  const smearNegCount = patients.filter(p => p.tbType === 'Pulmonary Smear-').length;
  const extraTbCount = patients.filter(p => p.tbType === 'Extra-pulmonary').length;

  // Contacts
  const totalContacts = contacts.length;
  const evaluatedContacts = contacts.filter(c => c.outcome !== 'Under Evaluation').length;
  const contactScreeningRate = totalContacts > 0 ? Math.round((evaluatedContacts / totalContacts) * 100) : 0;
  const tptContacts = contacts.filter(c => c.outcome === 'TPT Initiated').length;
  const tptRate = totalContacts > 0 ? Math.round((tptContacts / totalContacts) * 100) : 0;
  const activeTbFoundFromContacts = contacts.filter(c => c.outcome === 'Active TB Found').length;

  // Investigations
  const totalInv = investigations.length;
  const completedInv = investigations.filter(i => i.status === 'Complete').length;
  const highRiskInv = investigations.filter(i => i.transmissionRisk?.includes('สูง')).length;
  const dmCount = investigations.filter(i => i.underlyingDiseases?.diabetes).length;
  const ckdCount = investigations.filter(i => i.underlyingDiseases?.ckd).length;
  const smokingCount = investigations.filter(i => i.smoking === 'สูบเป็นประจำ').length;
  const hemoptysisCount = investigations.filter(i => i.symptoms?.hemoptysis).length;
  const coughCount = investigations.filter(i => i.symptoms?.chronicCough).length;

  // Subdistrict stats
  const subdistrictCounts = subdistricts.map(sd => {
    const pts = patients.filter(p => p.subdistrict === sd.name);
    const activePts = pts.filter(p => p.status === 'Active');
    const smearPos = pts.filter(p => p.tbType === 'Pulmonary Smear+');
    return {
      name: sd.name,
      total: pts.length,
      active: activePts.length,
      smearPos: smearPos.length,
      villagesCount: sd.villages.length
    };
  });

  const slides = [
    { id: 'kpi', title: 'สรุปสถานการณ์และตัวชี้วัดสำคัญ (Executive KPIs & DOTS)', icon: BarChart3 },
    { id: 'geo', title: 'การกระจายตัวทางภูมิศาสตร์รายตำบล (Geographic Distribution)', icon: MapPin },
    { id: 'epi', title: 'บทวิเคราะห์ทางระบาดวิทยาและปัจจัยเสี่ยง (Epidemiology & Risk Factors)', icon: Microscope },
    { id: 'contacts', title: 'การค้นหาผู้สัมผัสและสายการระบาด (Contact Tracing & Prevention)', icon: Users }
  ];

  // Fullscreen API toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsTrueFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsTrueFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsTrueFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard navigation (Arrow keys, ESC, F)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide(prev => (prev + 1) % slides.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
      } else if (e.key === 'Escape') {
        if (!document.fullscreenElement) {
          onClose();
        }
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, slides.length, onClose]);

  // Auto-play slideshow timer
  useEffect(() => {
    if (!isOpen || !isAutoPlay) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isOpen, isAutoPlay, slides.length]);

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between font-['Prompt',sans-serif] overflow-hidden select-none"
    >
      {/* Top Presentation Bar */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-6 py-3 flex items-center justify-between gap-4 shrink-0 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-900/30">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                ศูนย์ข้อมูลและวิเคราะห์สถานการณ์วัณโรค อ.โพนนาแก้ว จ.สกลนคร
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                16:9 Widescreen Presentation Fit
              </span>
            </div>
            <p className="text-xs text-slate-400">
              โหมดนำเสนอผลการดำเนินงานสำหรับห้องประชุมและจอภาพขนาดใหญ่ &bull; สไลด์ {currentSlide + 1} จาก {slides.length}: <strong className="text-emerald-300">{slides[currentSlide].title}</strong>
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2">
          {/* Slide selector pills */}
          <div className="hidden lg:flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
            {slides.map((s, idx) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlide(idx)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    currentSlide === idx 
                      ? 'bg-emerald-600 text-white font-bold shadow' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{idx + 1}. {s.id.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Auto-play toggle */}
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              isAutoPlay 
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="เล่นสไลด์อัตโนมัติทุก 8 วินาที"
          >
            {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAutoPlay ? 'หยุดเลื่อน' : 'เลื่อนอัตโนมัติ'}</span>
          </button>

          {/* Fit Mode Toggle */}
          <button
            onClick={() => setFitMode(fitMode === 'widescreen169' ? 'fillViewport' : 'widescreen169')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
            title="สลับสัดส่วน 16:9 พอดีจอ หรือ ขยายเต็มหน้าจอ"
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{fitMode === 'widescreen169' ? '16:9 พอดีจอ' : 'ขยายเต็มพื้นที่'}</span>
          </button>

          {/* Native Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition"
            title={isTrueFullscreen ? 'ออกจากโหมดเต็มหน้าจอ (ESC)' : 'แสดงเต็มหน้าจอเบราว์เซอร์ (F)'}
          >
            {isTrueFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit Button */}
          <button
            onClick={onClose}
            className="p-2 bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-800/40 rounded-xl transition"
            title="ปิดโหมดนำเสนอ (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Presentation Stage (Centered 16:9 or Full Viewport) */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-3 sm:p-6 bg-radial from-slate-900 to-slate-950">
        <div className={`w-full transition-all duration-300 ${
          fitMode === 'widescreen169' 
            ? 'max-w-[1720px] aspect-[16/9] max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto' 
            : 'h-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto'
        }`}>
          
          {/* SLIDE 1: EXECUTIVE KPIS */}
          {currentSlide === 0 && (
            <div className="space-y-6 animate-fadeIn h-full flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      ตัวชี้วัดสำคัญและการดำเนินงานควบคุมวัณโรค อ.โพนนาแก้ว
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400">
                      ผลการรักษา DOTS, ผู้ป่วยสะสม และอัตราความสำเร็จตามเป้าหมายยุทธศาสตร์ยุติวัณโรค (End TB Strategy)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                    ข้อมูลล่าสุด: {new Date().toLocaleDateString('th-TH')}
                  </span>
                </div>
              </div>

              {/* 4 Big KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 items-stretch">
                {/* Cure Rate */}
                <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-emerald-300 tracking-wider">
                      อัตราการรักษาสำเร็จ (Cure Rate)
                    </span>
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="my-4">
                    <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {cureRate}%
                    </div>
                    <p className="text-xs text-emerald-300/80 mt-1">
                      เป้าหมายกระทรวงสาธารณสุข &ge; 85%
                    </p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${cureRate >= 85 ? 'bg-emerald-400' : 'bg-amber-400'}`} 
                      style={{ width: `${Math.min(cureRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Active Patients & Smear+ */}
                <div className="bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-500/40 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-amber-300 tracking-wider">
                      ผู้ป่วยกำลังรักษา & เสมหะบวก
                    </span>
                    <Activity className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="my-4">
                    <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {activePatients.length} <span className="text-xl font-normal text-slate-400">/ {totalPatients} ราย</span>
                    </div>
                    <p className="text-xs text-amber-300 mt-1">
                      เสมหะบวก (Smear+ แพร่เชื้อสูง): <strong>{smearPosCount} ราย</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    <span>ติดตามการกินยาทุกวัน 100%</span>
                  </div>
                </div>

                {/* Contact Screening */}
                <div className="bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/40 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-cyan-300 tracking-wider">
                      คัดกรองผู้สัมผัสร่วมบ้าน (Contacts)
                    </span>
                    <UserCheck className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="my-4">
                    <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {contactScreeningRate}%
                    </div>
                    <p className="text-xs text-cyan-300/80 mt-1">
                      คัดกรองแล้ว {evaluatedContacts} จาก {totalContacts} คน
                    </p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                    <div 
                      className="bg-cyan-400 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(contactScreeningRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* TPT Preventive Therapy */}
                <div className="bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-500/40 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-purple-300 tracking-wider">
                      การให้ยาป้องกันวัณโรค (TPT)
                    </span>
                    <Pill className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="my-4">
                    <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {tptContacts} <span className="text-xl font-normal text-slate-400">คน</span>
                    </div>
                    <p className="text-xs text-purple-300 mt-1">
                      อัตราครอบคลุม TPT ในกลุ่มสัมผัส: <strong>{tptRate}%</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-purple-200">
                    <span>พบผู้ป่วยวัณโรคใหม่จากคัดกรอง:</span>
                    <strong className="text-white bg-purple-900/80 px-2 py-0.5 rounded font-mono">{activeTbFoundFromContacts} ราย</strong>
                  </div>
                </div>
              </div>

              {/* Bottom Summary Bar */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>ผลการดำเนินงานหลัก:</span>
                  </span>
                  <span className="text-slate-300">
                    รักษาหาย/ครบกำหนด {curedPatients.length} ราย &bull; ขาดการรักษา/เสียชีวิต {interruptedPatients.length} ราย &bull; สอบสวนโรคแล้ว {completedInv}/{totalInv} เคส
                  </span>
                </div>
                <div className="text-slate-400 text-xs">
                  ระบบติดตามผู้ป่วยวัณโรค รพ.โพนนาแก้ว สสอ.โพนนาแก้ว จ.สกลนคร
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: GEOGRAPHIC & VILLAGES */}
          {currentSlide === 1 && (
            <div className="space-y-6 animate-fadeIn h-full flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      การกระจายตัวของผู้ป่วยวัณโรครายตำบลและหมู่บ้าน (Spot Map & Geographic Data)
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400">
                      พื้นที่รับผิดชอบ 5 ตำบล 53 หมู่บ้าน อ.โพนนาแก้ว จ.สกลนคร
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-full">
                  5 ตำบล &bull; 53 หมู่บ้าน
                </span>
              </div>

              {/* Subdistrict Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 flex-1 items-stretch">
                {subdistrictCounts.map((sd, i) => (
                  <div 
                    key={sd.name} 
                    className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-cyan-500/50 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3">
                        <span className="font-bold text-sm text-white">{sd.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded">
                          {sd.villagesCount} ม.
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">ผู้ป่วยทั้งหมด:</span>
                          <strong className="text-base font-bold text-white">{sd.total} ราย</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">กำลังรับยา:</span>
                          <strong className="text-amber-400 font-bold">{sd.active} ราย</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">เสมหะบวก (Smear+):</span>
                          <strong className="text-red-400 font-bold">{sd.smearPos} ราย</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-700/60 mt-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">ความหนาแน่น:</span>
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          sd.active >= 3 ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {sd.active >= 3 ? 'เฝ้าระวังสูง' : 'ควบคุมได้ดี'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Geographic Action Note */}
              <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-200">
                    การลงพื้นที่สอบสวนโรคและการเยี่ยมบ้านร่วมกับ อสม. พี่เลี้ยง ดำเนินการครอบคลุมทุกหลังคาเรือนเป้าหมาย
                  </span>
                </div>
                <div className="font-bold text-white font-mono">
                  พิกัดดาวเทียม GPS บันทึกครบถ้วน 100%
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: EPIDEMIOLOGICAL ANALYSIS */}
          {currentSlide === 2 && (
            <div className="space-y-6 animate-fadeIn h-full flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                    <Microscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      การวิเคราะห์ทางระบาดวิทยา ปัจจัยเสี่ยง และอาการนำสำคัญ
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400">
                      จากฐานข้อมูลแบบสอบสวนโรครายบุคคล (TB Case Investigation Forms)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-full">
                  วิเคราะห์จาก {totalInv} แบบสอบสวน
                </span>
              </div>

              {/* 3-Column Epidemiological Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-stretch">
                {/* Column 1: Symptoms */}
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-700 pb-2">
                    <HeartPulse className="w-4 h-4 text-emerald-400" />
                    <span>อาการนำสำคัญ (Key Symptoms)</span>
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">ไอเรื้อรังเกิน 2 สัปดาห์:</span>
                        <strong className="text-white">{coughCount} ราย ({totalInv > 0 ? Math.round((coughCount/totalInv)*100) : 0}%)</strong>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${totalInv > 0 ? (coughCount/totalInv)*100 : 0}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">ไอเป็นเลือด (Hemoptysis):</span>
                        <strong className="text-red-400">{hemoptysisCount} ราย ({totalInv > 0 ? Math.round((hemoptysisCount/totalInv)*100) : 0}%)</strong>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${totalInv > 0 ? (hemoptysisCount/totalInv)*100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Comorbidities */}
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-700 pb-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>โรคร่วมและปัจจัยเสี่ยง (Comorbidities)</span>
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-2 rounded-xl bg-slate-700/50">
                      <span className="text-slate-300">เบาหวาน (Diabetes Mellitus):</span>
                      <span className="text-sm font-bold text-amber-300">{dmCount} ราย</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-xl bg-slate-700/50">
                      <span className="text-slate-300">ไตวายเรื้อรัง (CKD):</span>
                      <span className="text-sm font-bold text-amber-300">{ckdCount} ราย</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-xl bg-slate-700/50">
                      <span className="text-slate-300">ประวัติสูบบุหรี่ประจำ:</span>
                      <span className="text-sm font-bold text-white">{smokingCount} ราย</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Transmission Risk */}
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-700 pb-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>ความเสี่ยงการแพร่กระจายเชื้อ</span>
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-200">
                      <div className="font-bold text-red-300 mb-1">กลุ่มเสี่ยงสูง (High Risk): {highRiskInv} เคส</div>
                      <p className="text-[11px] leading-relaxed text-red-300/80">
                        ผู้ป่วยเสมหะบวกและมีผู้สัมผัสร่วมบ้านหนาแน่น ต้องกำกับยา DOTS เข้มข้นทุกวัน
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-200">
                      <div className="font-bold text-emerald-300 mb-1">ความครอบคลุมการสอบสวน: {completedInv}/{totalInv}</div>
                      <p className="text-[11px] leading-relaxed text-emerald-300/80">
                        สอบสวนโรคครบตามเกณฑ์มาตรฐานกรมควบคุมโรค
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Note */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 text-center text-xs text-slate-400">
                ข้อมูลบูรณาการระหว่างระบบคัดกรองเบาหวาน-ความดัน และการคัดกรองภาพรังสีทรวงอก CXR รถเอกซเรย์พระราชทาน
              </div>
            </div>
          )}

          {/* SLIDE 4: CONTACT TRACING & STRATEGY */}
          {currentSlide === 3 && (
            <div className="space-y-6 animate-fadeIn h-full flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      การค้นหาผู้สัมผัสโรคร่วมบ้าน มาตรการควบคุมโรค และแผนงานถัดไป
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400">
                      ยุติการแพร่กระจายเชื้อในระดับครัวเรือนและชุมชน อ.โพนนาแก้ว
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-500/40 px-3 py-1 rounded-full">
                  มาตรการควบคุมโรค 2569
                </span>
              </div>

              {/* 4 Strategy Pillar Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 items-stretch">
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">1</div>
                    <h4 className="font-bold text-sm text-white">กำกับการกินยา DOTS</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      ติดตั้ง อสม. พี่เลี้ยง และวิดีโอคอล Telehealth ติดตามการกินยาทุกวัน ป้องกันการดื้อยาและลดการขาดยาเป็นศูนย์
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800">
                    ครอบคลุม 100%
                  </span>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">2</div>
                    <h4 className="font-bold text-sm text-white">คัดกรอง CXR ผู้สัมผัส</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      ส่งตรวจภาพรังสีทรวงอก (Chest X-Ray) ผู้สัมผัสร่วมบ้านทุกรายทันทีที่พบผู้ป่วย เพื่อค้นหาผู้ป่วยแฝงในระยะเริ่มต้น
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800">
                    ตรวจแล้ว {contactScreeningRate}%
                  </span>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">3</div>
                    <h4 className="font-bold text-sm text-white">ยาป้องกัน TPT</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      จ่ายยาป้องกันวัณโรค (TPT) ในผู้สัมผัสกลุ่มเสี่ยงสูง เด็ก และผู้มีโรคร่วม เพื่อตัดวงจรการเกิดโรคในอนาคต
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-purple-400 bg-purple-950/60 px-2 py-1 rounded border border-purple-800">
                    เริ่มยาแล้ว {tptContacts} ราย
                  </span>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">4</div>
                    <h4 className="font-bold text-sm text-white">แจ้งเตือนผ่าน LINE</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      ระบบแจ้งเตือนอัตโนมัติถึงเจ้าหน้าที่และ อสม. เมื่อตรวจพบผู้ป่วยขาดรับยา หรือครบกำหนดตรวจเสมหะซ้ำ
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-1 rounded border border-amber-800">
                    ออนไลน์ 24 ชั่วโมง
                  </span>
                </div>
              </div>

              {/* Bottom Quote */}
              <div className="bg-gradient-to-r from-emerald-950/60 via-slate-800 to-teal-950/60 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-200">
                  <strong>มุ่งสู่เป้าหมาย:</strong> อัตราการรักษาสำเร็จ &ge; 85% &bull; อัตราขาดยา &le; 3% &bull; คัดกรองผู้สัมผัส &ge; 90%
                </span>
                <span className="text-emerald-400 font-bold">
                  คณะกรรมการประสานงานสาธารณสุขระดับอำเภอ (คปสอ. โพนนาแก้ว)
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom Navigation Toolbar */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-6 py-3 flex items-center justify-between shrink-0 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}
            className="inline-flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>สไลด์ก่อนหน้า</span>
          </button>

          <button
            onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
            className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <span>สไลด์ถัดไป</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Indicators Dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-8 bg-emerald-400' : 'w-2.5 bg-slate-700 hover:bg-slate-500'
              }`}
              title={`ไปที่สไลด์ ${idx + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="hidden sm:inline">ใช้ปุ่มลูกศร &larr; &rarr; หรือ Spacebar เพื่อเปลี่ยนสไลด์ &bull; กด ESC เพื่อออก</span>
        </div>
      </div>
    </div>
  );
};
