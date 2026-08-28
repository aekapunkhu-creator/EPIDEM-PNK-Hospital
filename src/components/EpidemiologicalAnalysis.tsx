import React, { useState, useMemo } from 'react';
import { 
  InvestigationRecord, 
  Patient, 
  HouseholdContact, 
  SubdistrictInfo 
} from '../types';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  Flame, 
  HeartPulse, 
  Wine, 
  Cigarette, 
  Home, 
  FileText, 
  Microscope, 
  Layers, 
  ChevronRight, 
  Filter, 
  Download,
  AlertCircle,
  HelpCircle,
  BarChart2
} from 'lucide-react';

interface EpidemiologicalAnalysisProps {
  investigations: InvestigationRecord[];
  patients: Patient[];
  contacts: HouseholdContact[];
  subdistricts: SubdistrictInfo[];
  onNavigateToInvestigations: () => void;
  onNavigateToContacts: () => void;
}

export const EpidemiologicalAnalysis: React.FC<EpidemiologicalAnalysisProps> = ({
  investigations,
  patients,
  contacts,
  subdistricts,
  onNavigateToInvestigations,
  onNavigateToContacts
}) => {
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<string>('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');

  // Filtered investigations
  const filteredData = useMemo(() => {
    return investigations.filter(inv => {
      const matchSub = selectedSubdistrict === 'all' || inv.subdistrict === selectedSubdistrict;
      const matchSource = selectedSourceFilter === 'all' || inv.suspectedSource === selectedSourceFilter;
      const matchRisk = selectedRiskFilter === 'all' || inv.transmissionRisk.includes(selectedRiskFilter);
      return matchSub && matchSource && matchRisk;
    });
  }, [investigations, selectedSubdistrict, selectedSourceFilter, selectedRiskFilter]);

  const totalInv = filteredData.length;

  // 1. Diagnostic & Treatment Delay Metrics
  const delayAnalytics = useMemo(() => {
    if (totalInv === 0) return { avgPatientDelayWeeks: 0, avgHealthSystemDelayDays: 0, delayDistribution: { low: 0, mid: 0, high: 0 } };

    let totalDurationWeeks = 0;
    let validDurationCount = 0;
    let lowDelay = 0; // < 2 weeks
    let midDelay = 0; // 2-4 weeks
    let highDelay = 0; // > 4 weeks

    let totalSystemDelayDays = 0;
    let validSystemDelayCount = 0;

    filteredData.forEach(inv => {
      const weeks = inv.durationOfSymptomsWeeks || 0;
      if (weeks > 0) {
        totalDurationWeeks += weeks;
        validDurationCount++;
        if (weeks < 2) lowDelay++;
        else if (weeks <= 4) midDelay++;
        else highDelay++;
      }

      // System delay: firstConsultDate to treatmentStartDate
      if (inv.firstConsultDate && inv.treatmentStartDate) {
        const consult = new Date(inv.firstConsultDate).getTime();
        const start = new Date(inv.treatmentStartDate).getTime();
        if (!isNaN(consult) && !isNaN(start) && start >= consult) {
          const days = Math.round((start - consult) / (1000 * 60 * 60 * 24));
          totalSystemDelayDays += days;
          validSystemDelayCount++;
        }
      }
    });

    return {
      avgPatientDelayWeeks: validDurationCount > 0 ? (totalDurationWeeks / validDurationCount).toFixed(1) : '0',
      avgHealthSystemDelayDays: validSystemDelayCount > 0 ? (totalSystemDelayDays / validSystemDelayCount).toFixed(1) : '0',
      delayDistribution: {
        low: lowDelay,
        mid: midDelay,
        high: highDelay
      }
    };
  }, [filteredData, totalInv]);

  // 2. Risk Factors & Comorbidities
  const riskAnalytics = useMemo(() => {
    if (totalInv === 0) return { dmCount: 0, ckdCount: 0, copdCount: 0, hivPosCount: 0, smokingCount: 0, alcoholCount: 0, crowdedCount: 0, contactHistCount: 0, pastTbCount: 0, prisonCount: 0 };

    let dm = 0, ckd = 0, copd = 0, hiv = 0, smoking = 0, alcohol = 0, crowded = 0, contactHist = 0, pastTb = 0, prison = 0;

    filteredData.forEach(inv => {
      if (inv.underlyingDiseases?.diabetes) dm++;
      if (inv.underlyingDiseases?.ckd) ckd++;
      if (inv.underlyingDiseases?.copdAsthma) copd++;
      if (inv.hivStatus === 'Positive') hiv++;
      if (inv.smoking === 'สูบเป็นประจำ' || inv.smoking === 'เคยสูบ (เลิกแล้ว)') smoking++;
      if (inv.alcohol === 'ดื่มเป็นประจำ (ติดสุรา)' || inv.alcohol === 'ดื่มเป็นครั้งคราว') alcohol++;
      if (inv.crowdedLiving || inv.householdMembersCount >= 5) crowded++;
      if (inv.historyOfTbContact) contactHist++;
      if (inv.pastTbHistory) pastTb++;
      if (inv.prisonHistory) prison++;
    });

    return {
      dmCount: dm,
      ckdCount: ckd,
      copdCount: copd,
      hivPosCount: hiv,
      smokingCount: smoking,
      alcoholCount: alcohol,
      crowdedCount: crowded,
      contactHistCount: contactHist,
      pastTbCount: pastTb,
      prisonCount: prison
    };
  }, [filteredData, totalInv]);

  // 3. Symptoms Frequency Ranking
  const symptomRanking = useMemo(() => {
    if (totalInv === 0) return [];

    const counts = {
      'ไอเรื้อรัง > 2 สัปดาห์': 0,
      'ไอเป็นเลือด (Hemoptysis)': 0,
      'ไข้ต่ำๆ บ่าย/ค่ำ': 0,
      'เหงื่อออกกลางคืน': 0,
      'น้ำหนักลดผิดปกติ': 0,
      'เบื่ออาหาร': 0,
      'เจ็บแน่นหน้าอก': 0,
      'หอบเหนื่อยง่าย': 0,
      'ต่อมน้ำเหลืองโต': 0
    };

    filteredData.forEach(inv => {
      if (inv.symptoms?.chronicCough) counts['ไอเรื้อรัง > 2 สัปดาห์']++;
      if (inv.symptoms?.hemoptysis) counts['ไอเป็นเลือด (Hemoptysis)']++;
      if (inv.symptoms?.afternoonFever) counts['ไข้ต่ำๆ บ่าย/ค่ำ']++;
      if (inv.symptoms?.nightSweats) counts['เหงื่อออกกลางคืน']++;
      if (inv.symptoms?.weightLoss) counts['น้ำหนักลดผิดปกติ']++;
      if (inv.symptoms?.lossOfAppetite) counts['เบื่ออาหาร']++;
      if (inv.symptoms?.chestPain) counts['เจ็บแน่นหน้าอก']++;
      if (inv.symptoms?.dyspnea) counts['หอบเหนื่อยง่าย']++;
      if (inv.symptoms?.lymphNodeSwelling) counts['ต่อมน้ำเหลืองโต']++;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: totalInv > 0 ? Math.round((count / totalInv) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData, totalInv]);

  // 4. Bacteriological & Radiologic Profile
  const labAnalytics = useMemo(() => {
    let smearPos = 0;
    let smearNeg = 0;
    let extraPulm = 0;
    let cavity = 0;
    let infiltration = 0;
    let effusion = 0;
    let xpertDetected = 0;
    let rifResistant = 0;

    filteredData.forEach(inv => {
      if (inv.tbType === 'Pulmonary Smear+') smearPos++;
      else if (inv.tbType === 'Pulmonary Smear-') smearNeg++;
      else extraPulm++;

      if (inv.cxrLesionType === 'Cavity (มีโพรงแผล)') cavity++;
      else if (inv.cxrLesionType === 'Infiltration') infiltration++;
      else if (inv.cxrLesionType === 'Effusion') effusion++;

      if (inv.geneXpertResult?.includes('MTB detected')) xpertDetected++;
      if (inv.geneXpertResult?.includes('Rif Resistance detected')) rifResistant++;
    });

    return {
      smearPos,
      smearNeg,
      extraPulm,
      cavity,
      infiltration,
      effusion,
      xpertDetected,
      rifResistant
    };
  }, [filteredData]);

  // 5. Contact Investigation Cascade
  const contactCascade = useMemo(() => {
    const totalIdentified = filteredData.reduce((sum, i) => sum + (i.contactsIdentified || 0), 0);
    const totalScreened = filteredData.reduce((sum, i) => sum + (i.contactsScreened || 0), 0);
    const totalCxr = filteredData.reduce((sum, i) => sum + (i.contactsCxrDone || 0), 0);
    const totalAfb = filteredData.reduce((sum, i) => sum + (i.contactsAfbDone || 0), 0);
    const totalTpt = filteredData.reduce((sum, i) => sum + (i.contactsTptInitiated || 0), 0);
    const totalActiveFound = filteredData.reduce((sum, i) => sum + (i.contactsActiveTbFound || 0), 0);

    const screeningRate = totalIdentified > 0 ? Math.round((totalScreened / totalIdentified) * 100) : 0;
    const cxrRate = totalIdentified > 0 ? Math.round((totalCxr / totalIdentified) * 100) : 0;
    const tptRate = totalIdentified > 0 ? Math.round((totalTpt / totalIdentified) * 100) : 0;

    return {
      totalIdentified,
      totalScreened,
      totalCxr,
      totalAfb,
      totalTpt,
      totalActiveFound,
      screeningRate,
      cxrRate,
      tptRate
    };
  }, [filteredData]);

  // 6. Suspected Source & Transmission Risk Distribution
  const sourceRiskAnalytics = useMemo(() => {
    const sources = {
      'ในครอบครัว': 0,
      'ในที่ทำงาน/โรงเรียน': 0,
      'ในชุมชน': 0,
      'ไม่ทราบแหล่งชัดเจน': 0
    };

    const risks = {
      'สูง (High Risk)': 0,
      'ปานกลาง (Moderate Risk)': 0,
      'ต่ำ (Low Risk)': 0
    };

    filteredData.forEach(inv => {
      if (sources[inv.suspectedSource] !== undefined) {
        sources[inv.suspectedSource]++;
      } else {
        sources['ไม่ทราบแหล่งชัดเจน']++;
      }

      if (inv.transmissionRisk?.includes('สูง')) risks['สูง (High Risk)']++;
      else if (inv.transmissionRisk?.includes('ปานกลาง')) risks['ปานกลาง (Moderate Risk)']++;
      else risks['ต่ำ (Low Risk)']++;
    });

    return { sources, risks };
  }, [filteredData]);

  if (investigations.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <Microscope className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-lg font-bold text-slate-900">ยังไม่มีข้อมูลแบบสอบสวนโรคในระบบ</h3>
          <p className="text-xs text-slate-500">
            ระบบจะเริ่มวิเคราะห์ความล่าช้าในการวินิจฉัย ปัจจัยเสี่ยง แหล่งแพร่โรค และการตรวจพบผู้ป่วยสัมผัสทันทีที่มีการบันทึกแบบสอบสวนผู้ป่วย
          </p>
        </div>
        <button
          onClick={onNavigateToInvestigations}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow transition"
        >
          <FileText className="w-4 h-4" />
          <span>ไปที่ระบบบันทึกแบบสอบสวนโรค</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs uppercase tracking-wider">
              <Microscope className="w-4 h-4" />
              <span>Epidemiological Intelligence & Surveillance</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              บทวิเคราะห์ทางระบาดวิทยาและการสอบสวนโรครายบุคคล (อ.โพนนาแก้ว)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ประมวลผลจากแบบบันทึกการสอบสวนโรคมาตรฐานกองวัณโรค {investigations.length} ชุด (วิเคราะห์ตามตัวกรอง {totalInv} ชุด)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToInvestigations}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs transition"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>จัดการแบบสอบสวน ({investigations.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              กรองตามตำบลใน อ.โพนนาแก้ว
            </label>
            <select
              value={selectedSubdistrict}
              onChange={e => setSelectedSubdistrict(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">ทุกตำบล ({investigations.length} ราย)</option>
              {subdistricts.map(s => (
                <option key={s.code} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              กรองตามแหล่งแพร่เชื้อที่น่าสงสัย
            </label>
            <select
              value={selectedSourceFilter}
              onChange={e => setSelectedSourceFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">ทุกแหล่งแพร่โรค</option>
              <option value="ในครอบครัว">ในครอบครัว</option>
              <option value="ในที่ทำงาน/โรงเรียน">ในที่ทำงาน/โรงเรียน</option>
              <option value="ในชุมชน">ในชุมชน</option>
              <option value="ไม่ทราบแหล่งชัดเจน">ไม่ทราบแหล่งชัดเจน</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              กรองตามระดับความเสี่ยงแพร่กระจาย
            </label>
            <select
              value={selectedRiskFilter}
              onChange={e => setSelectedRiskFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">ทุกระดับความเสี่ยง</option>
              <option value="สูง">ความเสี่ยงสูง (High Risk)</option>
              <option value="ปานกลาง">ความเสี่ยงปานกลาง (Moderate)</option>
              <option value="ต่ำ">ความเสี่ยงต่ำ (Low Risk)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Row 1: Delay Cascade & High Transmission Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Patient Delay (Time before consult) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ระยะเวลามีอาการก่อนพบแพทย์ (Patient Delay)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-700">{delayAnalytics.avgPatientDelayWeeks}</span>
            <span className="text-xs text-slate-500">สัปดาห์ (ค่าเฉลี่ย)</span>
          </div>
          <div className="pt-2 text-xs space-y-1 border-t border-slate-100 text-slate-600">
            <div className="flex justify-between">
              <span>มีอาการ &gt; 4 สัปดาห์ (ล่าช้าสูง):</span>
              <span className="font-semibold text-rose-600">{delayAnalytics.delayDistribution.high} ราย</span>
            </div>
            <div className="flex justify-between">
              <span>มีอาการ 2-4 สัปดาห์:</span>
              <span className="font-medium text-slate-700">{delayAnalytics.delayDistribution.mid} ราย</span>
            </div>
            <div className="flex justify-between">
              <span>มาพบแพทย์เร็ว (&lt; 2 สัปดาห์):</span>
              <span className="font-medium text-emerald-700">{delayAnalytics.delayDistribution.low} ราย</span>
            </div>
          </div>
        </div>

        {/* Card 2: Health System Delay */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ระยะเวลาตรวจจนเริ่มยา (Health System Delay)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-700">{delayAnalytics.avgHealthSystemDelayDays}</span>
            <span className="text-xs text-slate-500">วัน (นับจากพบแพทย์ถึงเริ่มยา)</span>
          </div>
          <div className="pt-2 text-xs space-y-1 border-t border-slate-100 text-slate-600">
            <div className="flex justify-between">
              <span>GeneXpert MTB ตรวจพบ:</span>
              <span className="font-semibold text-slate-800">{labAnalytics.xpertDetected} ราย</span>
            </div>
            <div className="flex justify-between">
              <span>ดื้อยา Rifampicin (RR-TB):</span>
              <span className={`font-semibold ${labAnalytics.rifResistant > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {labAnalytics.rifResistant} ราย
              </span>
            </div>
            <div className="flex justify-between">
              <span>เสมหะพบเชื้อ (Smear+):</span>
              <span className="font-semibold text-emerald-700">{labAnalytics.smearPos} ราย</span>
            </div>
          </div>
        </div>

        {/* Card 3: High Transmission & Cavitary Risk */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              แหล่งแพร่เชื้อและความเสี่ยง
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-700">{sourceRiskAnalytics.risks['สูง (High Risk)']}</span>
            <span className="text-xs text-slate-500">รายประเมินเสี่ยงแพร่กระจายสูง</span>
          </div>
          <div className="pt-2 text-xs space-y-1 border-t border-slate-100 text-slate-600">
            <div className="flex justify-between">
              <span>CXR พบโพรงแผล (Cavity):</span>
              <span className="font-semibold text-rose-700">{labAnalytics.cavity} ราย</span>
            </div>
            <div className="flex justify-between">
              <span>แพร่ในครอบครัวเป็นหลัก:</span>
              <span className="font-medium text-slate-800">{sourceRiskAnalytics.sources['ในครอบครัว']} ราย</span>
            </div>
            <div className="flex justify-between">
              <span>สัมผัสในชุมชน/ที่ทำงาน:</span>
              <span className="font-medium text-slate-700">
                {sourceRiskAnalytics.sources['ในชุมชน'] + sourceRiskAnalytics.sources['ในที่ทำงาน/โรงเรียน']} ราย
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Contact Tracing Cascade (ห่วงโซ่การค้นหาผู้สัมผัสจากแบบสอบสวน) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ห่วงโซ่การค้นหาและป้องกันผู้สัมผัสร่วมบ้าน (Contact Tracing & TPT Cascade)
            </h3>
            <p className="text-xs text-slate-500">
              ผลการติดตามผู้สัมผัสสะสมจากแบบสอบสวนโรคทั้งหมดในพื้นที่ อ.โพนนาแก้ว
            </p>
          </div>
          <button
            onClick={onNavigateToContacts}
            className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>ดูทะเบียนผู้สัมผัสรายบุคคล</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cascade Step Funnel Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[11px] font-semibold text-slate-500">1. ผู้สัมผัสที่ค้นพบ</div>
            <div className="text-2xl font-bold text-slate-900">{contactCascade.totalIdentified}</div>
            <div className="text-[10px] text-slate-500">เป้าหมายคัดกรอง 100%</div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <div className="text-[11px] font-semibold text-emerald-800">2. คัดกรองอาการ</div>
            <div className="text-2xl font-bold text-emerald-700">{contactCascade.totalScreened}</div>
            <div className="text-[10px] text-emerald-600 font-medium">({contactCascade.screeningRate}%)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
            <div className="text-[11px] font-semibold text-blue-800">3. ตรวจ CXR ปอด</div>
            <div className="text-2xl font-bold text-blue-700">{contactCascade.totalCxr}</div>
            <div className="text-[10px] text-blue-600 font-medium">({contactCascade.cxrRate}%)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
            <div className="text-[11px] font-semibold text-indigo-800">4. ตรวจเสมหะ AFB</div>
            <div className="text-2xl font-bold text-indigo-700">{contactCascade.totalAfb}</div>
            <div className="text-[10px] text-indigo-600 font-medium">ในรายที่มีอาการ/CXRผิดปกติ</div>
          </div>

          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
            <div className="text-[11px] font-semibold text-teal-800">5. ได้รับยาป้องกัน TPT</div>
            <div className="text-2xl font-bold text-teal-700">{contactCascade.totalTpt}</div>
            <div className="text-[10px] text-teal-600 font-medium">({contactCascade.tptRate}% ของผู้สัมผัส)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
            <div className="text-[11px] font-semibold text-rose-800">6. ตรวจพบ Active TB</div>
            <div className="text-2xl font-bold text-rose-700">{contactCascade.totalActiveFound}</div>
            <div className="text-[10px] text-rose-600 font-medium">ผู้ป่วยรายใหม่ส่งต่อรักษา</div>
          </div>

        </div>
      </div>

      {/* Row 3: Risk Factors & Clinical Symptoms Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Comorbidities & Lifestyle Risk Factors */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-600" />
              <span>ปัจจัยเสี่ยงและโรคร่วมสำคัญ (Comorbidities & Risk Factors)</span>
            </h3>
            <p className="text-xs text-slate-500">
              ความชุกของปัจจัยเสี่ยงทางระบาดวิทยาในผู้ป่วยที่ได้รับการสอบสวน
            </p>
          </div>

          <div className="space-y-3">
            
            {/* DM */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>โรคเบาหวาน (Diabetes Mellitus)</span>
                <span className="text-emerald-700">{riskAnalytics.dmCount} ราย ({totalInv > 0 ? Math.round((riskAnalytics.dmCount / totalInv) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all"
                  style={{ width: `${totalInv > 0 ? (riskAnalytics.dmCount / totalInv) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Smoking */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>การสูบบุหรี่ (สูบประจำ / เคยสูบ)</span>
                <span className="text-amber-700">{riskAnalytics.smokingCount} ราย ({totalInv > 0 ? Math.round((riskAnalytics.smokingCount / totalInv) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all"
                  style={{ width: `${totalInv > 0 ? (riskAnalytics.smokingCount / totalInv) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Alcohol */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>การดื่มสุรา (ดื่มประจำ / ติดสุรา)</span>
                <span className="text-amber-700">{riskAnalytics.alcoholCount} ราย ({totalInv > 0 ? Math.round((riskAnalytics.alcoholCount / totalInv) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-amber-600 h-2 rounded-full transition-all"
                  style={{ width: `${totalInv > 0 ? (riskAnalytics.alcoholCount / totalInv) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Crowded Housing */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>สภาพบ้านแออัด / สมาชิกในบ้าน ≥ 5 คน</span>
                <span className="text-blue-700">{riskAnalytics.crowdedCount} ราย ({totalInv > 0 ? Math.round((riskAnalytics.crowdedCount / totalInv) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${totalInv > 0 ? (riskAnalytics.crowdedCount / totalInv) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* History of TB Contact */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>มีประวัติสัมผัสผู้ป่วยวัณโรคชัดเจน</span>
                <span className="text-indigo-700">{riskAnalytics.contactHistCount} ราย ({totalInv > 0 ? Math.round((riskAnalytics.contactHistCount / totalInv) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${totalInv > 0 ? (riskAnalytics.contactHistCount / totalInv) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* CKD & COPD */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500">โรคไตวายเรื้อรัง (CKD)</div>
                <div className="text-base font-bold text-slate-800">{riskAnalytics.ckdCount} ราย</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500">HIV Positive</div>
                <div className="text-base font-bold text-slate-800">{riskAnalytics.hivPosCount} ราย</div>
              </div>
            </div>

          </div>
        </div>

        {/* Symptoms Spectrum */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>การกระจายของอาการนำสำคัญ (Symptom Presentation)</span>
            </h3>
            <p className="text-xs text-slate-500">
              ความถี่ของอาการที่พบขณะเริ่มเจ็บป่วยก่อนมารับการตรวจรักษา
            </p>
          </div>

          <div className="space-y-2.5">
            {symptomRanking.slice(0, 6).map((sym, idx) => (
              <div key={sym.name} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-700">
                  <span className="font-medium flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {sym.name}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {sym.count} ราย ({sym.percent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${sym.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">ข้อสังเกตทางระบาดวิทยา: </span>
              ผู้ป่วยส่วนใหญ่มาด้วยอาการไอเรื้อรังและน้ำหนักลด การคัดกรองเชิงรุกด้วย Chest X-Ray ในกลุ่มเสี่ยงสูง (เบาหวาน/ผู้สูงอายุ/ผู้สัมผัสร่วมบ้าน) จะช่วยลดระยะเวลาแพร่เชื้อในชุมชนได้เร็วขึ้น
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
