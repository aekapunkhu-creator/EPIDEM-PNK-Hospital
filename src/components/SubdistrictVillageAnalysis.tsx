import React, { useState, useMemo } from 'react';
import { 
  Patient, 
  HouseholdContact, 
  InvestigationRecord, 
  SubdistrictInfo 
} from '../types';
import { PHON_NA_KAEO_SUBDISTRICTS } from '../data/mockData';
import { getTreatmentStatusShortLabel, getTreatmentStatusBadgeClass } from '../utils/statusUtils';
import { 
  Building2, 
  Home, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Users, 
  Activity, 
  Search, 
  Filter, 
  ChevronRight, 
  ArrowUpRight, 
  Copy, 
  Check, 
  MapPin, 
  Microscope, 
  HeartPulse, 
  Pill, 
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';

interface SubdistrictVillageAnalysisProps {
  patients: Patient[];
  contacts: HouseholdContact[];
  investigations: InvestigationRecord[];
  subdistricts?: SubdistrictInfo[];
  onSelectPatient?: (patient: Patient) => void;
  onNavigateToSpotMap?: () => void;
  onNavigateToInvestigations?: () => void;
}

interface VillageStat {
  villageFullName: string; // e.g. "หมู่ที่ 1 บ้านอ้อมแก้วใหญ่"
  villageName: string;     // e.g. "บ้านอ้อมแก้วใหญ่"
  villageNo: string;       // e.g. "1"
  subdistrict: string;     // e.g. "ตำบลบ้านโพน"
  healthCenterName: string;
  totalPatients: number;
  activePatients: number;
  curedPatients: number;
  smearPosCount: number;
  cavityCount: number;
  totalContacts: number;
  screenedContacts: number;
  tptContacts: number;
  activeFromContactCount: number;
  investigationsCount: number;
  avgPatientDelayWeeks: number;
  riskLevel: 'high' | 'moderate' | 'low';
  riskReasons: string[];
  patientList: Patient[];
  investigationList: InvestigationRecord[];
}

export const SubdistrictVillageAnalysis: React.FC<SubdistrictVillageAnalysisProps> = ({
  patients,
  contacts,
  investigations,
  subdistricts = PHON_NA_KAEO_SUBDISTRICTS,
  onSelectPatient,
  onNavigateToSpotMap,
  onNavigateToInvestigations
}) => {
  const [selectedSubdistrictFilter, setSelectedSubdistrictFilter] = useState<string>('all');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | 'high' | 'moderate' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedVillage, setExpandedVillage] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // 1. Calculate All Village Statistics
  const villageStats = useMemo<VillageStat[]>(() => {
    const list: VillageStat[] = [];

    // Collect all defined villages from master subdistrict configuration
    subdistricts.forEach(sub => {
      sub.villages.forEach(vFullName => {
        // Parse village number and name (e.g., "หมู่ที่ 1 บ้านอ้อมแก้วใหญ่")
        const match = vFullName.match(/หมู่ที่\s*(\d+)\s*(.+)/);
        const vNo = match ? match[1] : '';
        const vName = match ? match[2].trim() : vFullName.trim();

        // Find associated patients
        const matchingPatients = patients.filter(p => {
          const matchSub = p.subdistrict === sub.name;
          const matchVNo = p.village?.includes(`หมู่ ${vNo}`) || p.village?.includes(`ม.${vNo}`) || p.village?.includes(vName);
          return matchSub && matchVNo;
        });

        // Find associated investigations
        const matchingInvestigations = investigations.filter(inv => {
          const matchSub = inv.subdistrict === sub.name;
          const matchVNo = inv.villageNo === vNo || inv.villageName?.includes(vName) || vFullName.includes(inv.villageName || '');
          return matchSub && matchVNo;
        });

        // Find associated contacts
        const matchingContacts = contacts.filter(c => {
          return matchingPatients.some(p => p.id === c.patientId);
        });

        const activePatients = matchingPatients.filter(p => p.status === 'Active').length;
        const curedPatients = matchingPatients.filter(p => p.status === 'Cured' || p.status === 'Completed').length;
        const smearPosCount = matchingPatients.filter(p => p.tbType === 'Pulmonary Smear+').length;
        const cavityCount = matchingInvestigations.filter(i => i.cxrLesionType === 'Cavity (มีโพรงแผล)').length;
        const totalContacts = matchingContacts.length;
        const screenedContacts = matchingContacts.filter(c => c.screeningDate && c.screeningDate !== '-').length;
        const tptContacts = matchingContacts.filter(c => c.outcome === 'TPT Initiated' || c.outcome === 'TPT Completed').length;
        const activeFromContactCount = matchingInvestigations.reduce((sum, i) => sum + (i.contactsActiveTbFound || 0), 0);

        let totalDelay = 0;
        let validDelayCount = 0;
        matchingInvestigations.forEach(inv => {
          if (inv.durationOfSymptomsWeeks) {
            totalDelay += inv.durationOfSymptomsWeeks;
            validDelayCount++;
          }
        });
        const avgPatientDelayWeeks = validDelayCount > 0 ? parseFloat((totalDelay / validDelayCount).toFixed(1)) : 0;

        // Risk Level Evaluation
        const riskReasons: string[] = [];
        let riskLevel: 'high' | 'moderate' | 'low' = 'low';

        if (activePatients > 0 && smearPosCount > 0) {
          riskLevel = 'high';
          riskReasons.push(`พบผู้ป่วยเสมหะบวก (Smear+) กำลังรักษา ${smearPosCount} ราย`);
        }
        if (activeFromContactCount > 0) {
          riskLevel = 'high';
          riskReasons.push(`ตรวจพบผู้ป่วยติดเชื้อรายใหม่จากผู้สัมผัส ${activeFromContactCount} ราย`);
        }
        if (activePatients >= 2) {
          riskLevel = 'high';
          riskReasons.push(`มีผู้ป่วยกำลังรักษาหนาแน่น $\ge$ 2 ราย`);
        }
        if (cavityCount > 0) {
          if (riskLevel !== 'high') riskLevel = 'high';
          riskReasons.push(`พบผู้ป่วยมีโพรงแผลในปอด (Cavitary TB) ${cavityCount} ราย`);
        }

        if (riskLevel !== 'high' && activePatients > 0) {
          riskLevel = 'moderate';
          riskReasons.push(`มีผู้ป่วยระหว่างรักษา (Active DOTS) ${activePatients} ราย`);
        }

        if (riskReasons.length === 0) {
          if (matchingPatients.length > 0) {
            riskReasons.push(`ผู้ป่วยรักษาหายครบกำหนดแล้ว (${curedPatients} ราย) - เฝ้าระวังปกติ`);
          } else {
            riskReasons.push('ไม่พบผู้ป่วยในรอบปี - เฝ้าระวังปกติ');
          }
        }

        list.push({
          villageFullName: vFullName,
          villageName: vName,
          villageNo: vNo,
          subdistrict: sub.name,
          healthCenterName: sub.healthCenterName,
          totalPatients: matchingPatients.length,
          activePatients,
          curedPatients,
          smearPosCount,
          cavityCount,
          totalContacts,
          screenedContacts,
          tptContacts,
          activeFromContactCount,
          investigationsCount: matchingInvestigations.length,
          avgPatientDelayWeeks,
          riskLevel,
          riskReasons,
          patientList: matchingPatients,
          investigationList: matchingInvestigations
        });
      });
    });

    return list;
  }, [patients, contacts, investigations, subdistricts]);

  // 2. Subdistrict Summary Matrix
  const subdistrictSummary = useMemo(() => {
    return subdistricts.map(sub => {
      const subVillages = villageStats.filter(v => v.subdistrict === sub.name);
      const subPatients = patients.filter(p => p.subdistrict === sub.name);
      const activeCount = subPatients.filter(p => p.status === 'Active').length;
      const smearPosCount = subPatients.filter(p => p.tbType === 'Pulmonary Smear+').length;
      const curedCount = subPatients.filter(p => p.status === 'Cured' || p.status === 'Completed').length;
      const subContacts = contacts.filter(c => c.subdistrict === sub.name);
      const tptCount = subContacts.filter(c => c.outcome === 'TPT Initiated' || c.outcome === 'TPT Completed').length;
      const subInvCount = investigations.filter(i => i.subdistrict === sub.name).length;
      const highRiskVillages = subVillages.filter(v => v.riskLevel === 'high').length;
      const moderateRiskVillages = subVillages.filter(v => v.riskLevel === 'moderate').length;

      return {
        ...sub,
        totalPatients: subPatients.length,
        activeCount,
        smearPosCount,
        curedCount,
        totalContacts: subContacts.length,
        tptCount,
        subInvCount,
        highRiskVillages,
        moderateRiskVillages,
        cureRate: subPatients.length > 0 ? Math.round((curedCount / subPatients.length) * 100) : 0
      };
    });
  }, [subdistricts, villageStats, patients, contacts, investigations]);

  // 3. Filtered Villages
  const filteredVillages = useMemo(() => {
    return villageStats.filter(v => {
      const matchSub = selectedSubdistrictFilter === 'all' || v.subdistrict === selectedSubdistrictFilter;
      const matchRisk = selectedRiskFilter === 'all' || v.riskLevel === selectedRiskFilter;
      const matchQuery = !searchQuery || 
        v.villageFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.villageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.subdistrict.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.healthCenterName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSub && matchRisk && matchQuery;
    });
  }, [villageStats, selectedSubdistrictFilter, selectedRiskFilter, searchQuery]);

  // Totals for top statistics
  const totalHighRiskVillages = villageStats.filter(v => v.riskLevel === 'high').length;
  const totalModerateRiskVillages = villageStats.filter(v => v.riskLevel === 'moderate').length;
  const totalLowRiskVillages = villageStats.filter(v => v.riskLevel === 'low').length;

  // Copy Summary Report to Clipboard
  const handleCopyReport = () => {
    let report = `📊 สรุปรายงานสถานการณ์วัณโรครายตำบลและหมู่บ้าน อ.โพนนาแก้ว จ.สกลนคร\n`;
    report += `ประจำวันที่: ${new Date().toLocaleDateString('th-TH')}\n\n`;
    report += `🔴 หมู่บ้านเสี่ยงสูง (High Risk): ${totalHighRiskVillages} หมู่บ้าน\n`;
    report += `🟡 หมู่บ้านเฝ้าระวัง (Moderate Risk): ${totalModerateRiskVillages} หมู่บ้าน\n`;
    report += `🟢 หมู่บ้านเฝ้าระวังปกติ/ปลอดภัย: ${totalLowRiskVillages} หมู่บ้าน\n\n`;

    report += `📌 สรุปแยกรายตำบล:\n`;
    subdistrictSummary.forEach(s => {
      report += `- ${s.name} (${s.healthCenterName}): ผู้ป่วย Active ${s.activeCount} ราย (เสมหะ+ ${s.smearPosCount} ราย), หมู่บ้านเสี่ยงสูง ${s.highRiskVillages} แห่ง, สอบสวนโรค ${s.subInvCount} ชุด\n`;
    });

    if (totalHighRiskVillages > 0) {
      report += `\n🚨 รายชื่อหมู่บ้านเสี่ยงสูงที่ต้องเฝ้าระวังเข้มข้น:\n`;
      villageStats.filter(v => v.riskLevel === 'high').forEach(v => {
        report += `• ${v.villageFullName} (${v.subdistrict}): Active ${v.activePatients} ราย, Smear+ ${v.smearPosCount} ราย [${v.riskReasons.join(', ')}]\n`;
      });
    }

    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-emerald-900/30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>ระบบวิเคราะห์ข้อมูลเชิงลึกรายตำบลและหมู่บ้าน (Subdistrict & Village Epidemiological Matrix)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            สถานการณ์วัณโรค 5 ตำบล 53 หมู่บ้าน อ.โพนนาแก้ว
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            จำแนกระดับความเสี่ยงหมู่บ้าน (Traffic Light Risk Engine), การแพร่ระบาดของเสมหะพบเชื้อ (Smear+), ผู้สัมผัส และการสอบสวนโรคระดับพื้นที่
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyReport}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700 shadow-sm transition"
          >
            {copiedReport ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-bold">คัดลอกรายงานแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-emerald-400" />
                <span>คัดลอกสรุปรายงานส่งไลน์</span>
              </>
            )}
          </button>

          {onNavigateToSpotMap && (
            <button
              onClick={onNavigateToSpotMap}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition"
            >
              <MapPin className="w-4 h-4" />
              <span>ดูพิกัดบน SpotMap</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            พื้นที่รับผิดชอบทั้งหมด
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">5 ตำบล</div>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
            ครอบคลุม 53 หมู่บ้าน 8 รพ.สต.
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200 bg-rose-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
              หมู่บ้านเสี่ยงสูง (Red)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{totalHighRiskVillages} <span className="text-xs font-normal text-slate-500">หมู่บ้าน</span></div>
          <span className="text-[10px] text-rose-600 font-medium mt-0.5 block">
            มีเสมหะบวก / คลัสเตอร์ติดต่อ
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/20 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
            หมู่บ้านเฝ้าระวัง (Yellow)
          </span>
          <div className="text-2xl font-bold text-amber-700 mt-1">{totalModerateRiskVillages} <span className="text-xs font-normal text-slate-500">หมู่บ้าน</span></div>
          <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">
            มีผู้ป่วย Active 1 ราย
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
            หมู่บ้านเฝ้าระวังปกติ (Green)
          </span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{totalLowRiskVillages} <span className="text-xs font-normal text-slate-500">หมู่บ้าน</span></div>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
            ปลอดผู้ป่วย / รักษาหายแล้ว
          </span>
        </div>
      </div>

      {/* SECTION 1: 5 Subdistricts Comparison Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>ตารางเปรียบเทียบสถานการณ์ 5 ตำบล (Subdistrict Comparison Matrix)</span>
            </h3>
            <p className="text-xs text-slate-500">
              วิเคราะห์ความหนาแน่นของผู้ป่วย, ผู้สัมผัส, อัตราการรักษาสำเร็จ และ รพ.สต. ที่รับผิดชอบ
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-y border-slate-200">
              <tr>
                <th className="py-3 px-3">ตำบล</th>
                <th className="py-3 px-3">รพ.สต. / สถานพยาบาล</th>
                <th className="py-3 px-3 text-center">ประชากร</th>
                <th className="py-3 px-3 text-center">หมู่บ้าน</th>
                <th className="py-3 px-3 text-center">ผู้ป่วย Active</th>
                <th className="py-3 px-3 text-center">เสมหะพบเชื้อ</th>
                <th className="py-3 px-3 text-center">ผู้สัมผัส (TPT)</th>
                <th className="py-3 px-3 text-center">แบบสอบสวน</th>
                <th className="py-3 px-3 text-center">หมู่บ้านเสี่ยงสูง</th>
                <th className="py-3 px-3 text-center">สถานะควบคุมโรค</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subdistrictSummary.map(sub => (
                <tr 
                  key={sub.code}
                  className={`hover:bg-slate-50/90 transition cursor-pointer ${
                    selectedSubdistrictFilter === sub.name ? 'bg-emerald-50/50 font-medium' : ''
                  }`}
                  onClick={() => setSelectedSubdistrictFilter(selectedSubdistrictFilter === sub.name ? 'all' : sub.name)}
                >
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{sub.name}</span>
                      {selectedSubdistrictFilter === sub.name && (
                        <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px]">เลือกอยู่</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate" title={sub.healthCenterName}>
                    {sub.healthCenterName}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-600">
                    {sub.population ? sub.population.toLocaleString('th-TH') : '-'}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-700">
                    {sub.villagesCount} หมู่
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-emerald-700">
                    {sub.activeCount > 0 ? `${sub.activeCount} ราย` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-amber-600">
                    {sub.smearPosCount > 0 ? `${sub.smearPosCount} ราย` : '0'}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-700">
                    {sub.totalContacts} ({sub.tptCount})
                  </td>
                  <td className="py-3 px-3 text-center font-medium text-emerald-800">
                    {sub.subInvCount} ชุด
                  </td>
                  <td className="py-3 px-3 text-center">
                    {sub.highRiskVillages > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                        {sub.highRiskVillages} หมู่บ้าน
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      sub.highRiskVillages > 0 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                        : sub.activeCount > 0 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {sub.highRiskVillages > 0 ? '🔴 เฝ้าระวังเข้มข้น' : sub.activeCount > 0 ? '🟡 ควบคุมรักษา' : '🟢 ปกติ'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Village Drilldown Explorer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-600" />
              <span>ทำเนียบรายหมู่บ้าน อ.โพนนาแก้ว (Village Drilldown & Risk Directory)</span>
            </h3>
            <p className="text-xs text-slate-500">
              แสดงข้อมูลจำแนกรายหมู่บ้านทั้งหมด 53 หมู่บ้าน พร้อมสถานะความเสี่ยงและการลงทะเบียนผู้ป่วย
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อหมู่บ้าน/ตำบล..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none w-44 sm:w-56"
              />
            </div>

            <select
              value={selectedSubdistrictFilter}
              onChange={e => setSelectedSubdistrictFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">ทุกตำบล (5 ตำบล)</option>
              {subdistricts.map(s => (
                <option key={s.code} value={s.name}>{s.name}</option>
              ))}
            </select>

            <select
              value={selectedRiskFilter}
              onChange={e => setSelectedRiskFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">ทุกระดับความเสี่ยง</option>
              <option value="high">🔴 เสี่ยงสูง (High)</option>
              <option value="moderate">🟡 เฝ้าระวัง (Moderate)</option>
              <option value="low">🟢 ปลอดภัย/ปกติ (Low)</option>
            </select>
          </div>
        </div>

        {/* Village Grid / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVillages.map(v => {
            const isExpanded = expandedVillage === v.villageFullName;
            return (
              <div 
                key={`${v.subdistrict}-${v.villageFullName}`}
                className={`rounded-2xl border transition p-4 space-y-3 flex flex-col justify-between ${
                  v.riskLevel === 'high' 
                    ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-200' 
                    : v.riskLevel === 'moderate'
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        {v.subdistrict}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 mt-0.5">
                        <span>{v.villageFullName}</span>
                      </h4>
                      <span className="text-[10px] text-slate-500 block">{v.healthCenterName}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      v.riskLevel === 'high' 
                        ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                        : v.riskLevel === 'moderate'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {v.riskLevel === 'high' ? '🔴 เสี่ยงสูง' : v.riskLevel === 'moderate' ? '🟡 เฝ้าระวัง' : '🟢 ปกติ'}
                    </span>
                  </div>

                  {/* Indicators Strip */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/80 text-center">
                    <div className="bg-white/80 p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium">ผู้ป่วย Active</div>
                      <div className={`text-base font-bold ${v.activePatients > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {v.activePatients}
                      </div>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium">เสมหะพบเชื้อ</div>
                      <div className={`text-base font-bold ${v.smearPosCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {v.smearPosCount}
                      </div>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium">ผู้สัมผัส (TPT)</div>
                      <div className={`text-base font-bold ${v.totalContacts > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
                        {v.totalContacts} <span className="text-[10px] text-teal-700">({v.tptContacts})</span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Assessment Badges */}
                  <div className="mt-3 space-y-1">
                    {v.riskReasons.map((reason, idx) => (
                      <div key={idx} className="text-[11px] flex items-center gap-1.5 text-slate-700">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          v.riskLevel === 'high' ? 'bg-rose-500' : v.riskLevel === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions & Expand Patients */}
                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    สอบสวนโรค: <strong>{v.investigationsCount}</strong> ฉบับ
                  </span>

                  {v.patientList.length > 0 ? (
                    <button
                      onClick={() => setExpandedVillage(isExpanded ? null : v.villageFullName)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'ซ่อนรายชื่อ' : `ดูผู้ป่วย (${v.patientList.length})`}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400">ไม่มีผู้ป่วยในพื้นที่</span>
                  )}
                </div>

                {/* Expanded Patient List */}
                {isExpanded && v.patientList.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5 animate-fadeIn">
                    <div className="text-[10px] font-bold text-slate-600 uppercase">รายชื่อผู้ป่วยในหมู่บ้าน:</div>
                    {v.patientList.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => onSelectPatient && onSelectPatient(p)}
                        className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs hover:border-emerald-500 cursor-pointer transition shadow-2xl"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{p.prefix}{p.firstName} {p.lastName}</span>
                          <span className="text-[10px] text-slate-500 ml-1.5">HN: {p.hn}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.status === 'Active' ? 'กำลังรักษา' : p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredVillages.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            ไม่พบหมู่บ้านที่ตรงตามเงื่อนไขการค้นหา
          </div>
        )}
      </div>

      {/* Recommendations & Action Plans for Villages */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-4 border border-slate-800">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase">
          <Sparkles className="w-5 h-5" />
          <span>มาตรการควบคุมโรคเฉพาะรายหมู่บ้าน (Targeted Village Interventions)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-1.5">
            <div className="font-bold text-rose-400 flex items-center gap-1.5 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>หมู่บ้านสีแดง (Red Zone)</span>
            </div>
            <p className="leading-relaxed">
              1. ดำเนินการคัดกรอง CXR รถเอกซเรย์พระราชทาน/Mobile CXR ในกลุ่มเสี่ยงสูง (เบาหวาน, ผู้สูงอายุ &gt; 65 ปี, ผู้สัมผัสร่วมบ้าน) ทันที
              <br />
              2. กำกับ อสม. พี่เลี้ยง ส่งมอบยาและเฝ้าดูการกลืนยาทุกมื้อ 100%
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-1.5">
            <div className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>หมู่บ้านสีเหลือง (Yellow Zone)</span>
            </div>
            <p className="leading-relaxed">
              1. ติดตามคัดกรองผู้สัมผัสร่วมบ้านให้ครบทุกราย และส่งต่อรับยา TPT เพื่อตัดวงจรการแพร่เชื้อ
              <br />
              2. ตรวจสอบประวัติการนัดตรวจเสมหะและ CXR ซ้ำตามกำหนดเดือนที่ 2, 5, 6
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-1.5">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>หมู่บ้านสีเขียว (Green Zone)</span>
            </div>
            <p className="leading-relaxed">
              1. คงมาตรการเฝ้าระวังผู้มีอาการไอเรื้อรังเกิน 2 สัปดาห์ โดย อสม. ในพื้นที่
              <br />
              2. จัดกิจกรรมรณรงค์วันวัณโรคสากล และส่งเสริมความรู้สุขอนามัยในชุมชน
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
