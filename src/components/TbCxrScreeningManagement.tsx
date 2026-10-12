import React, { useState, useMemo } from 'react';
import {
  TbCxrScreeningRecord,
  TBRiskGroupKey,
  TB_RISK_GROUPS_CONFIG,
  CxrFindingStatus,
  MtbResultStatus,
  ScreeningDiagnosisStatus,
  UserAccount,
  Patient
} from '../types';
import { PHON_NA_KAEO_SUBDISTRICTS, getVillagesForSubdistrict, isSystemMockScreening } from '../data/mockData';
import {
  ShieldAlert,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Edit2,
  Trash2,
  UserPlus,
  ArrowRight,
  Activity,
  HeartPulse,
  Users,
  Shield,
  Stethoscope,
  X,
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';

interface TbCxrScreeningManagementProps {
  screenings: TbCxrScreeningRecord[];
  onAddScreening: (screening: TbCxrScreeningRecord) => void;
  onUpdateScreening: (screening: TbCxrScreeningRecord) => void;
  onDeleteScreening: (id: string) => void;
  onPromoteToPatient: (screening: TbCxrScreeningRecord) => void;
  currentUser: UserAccount | null;
  existingPatients: Patient[];
  onShowToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

export const TbCxrScreeningManagement: React.FC<TbCxrScreeningManagementProps> = ({
  screenings,
  onAddScreening,
  onUpdateScreening,
  onDeleteScreening,
  onPromoteToPatient,
  currentUser,
  existingPatients,
  onShowToast
}) => {
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskGroup, setSelectedRiskGroup] = useState<TBRiskGroupKey | 'ALL'>('ALL');
  const [cxrFilter, setCxrFilter] = useState<CxrFindingStatus | 'ALL'>('ALL');
  const [mtbFilter, setMtbFilter] = useState<string>('ALL');
  const [subdistrictFilter, setSubdistrictFilter] = useState<string>('ALL');
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);
  const [onlyMtbDetected, setOnlyMtbDetected] = useState(false);
  const [onlyPending, setOnlyPending] = useState(false);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TbCxrScreeningRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<TbCxrScreeningRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);

  // Form State
  const initialForm: Partial<TbCxrScreeningRecord> = {
    screeningDate: new Date().toISOString().split('T')[0],
    screeningCampaign: 'คัดกรองกลุ่มเสี่ยง 7 กลุ่มประจำปี 2567',
    screeningFacility: 'รพ.โพนนาแก้ว',
    riskGroup: 'contact',
    riskGroupSpecificDetail: '',
    indexPatientHN: '',
    indexPatientName: '',
    hn: '',
    idCard: '',
    prefix: 'นาย',
    firstName: '',
    lastName: '',
    age: 45,
    gender: 'ชาย',
    phone: '',
    subdistrict: 'ตำบลบ้านโพน',
    village: 'บ้านโพน หมู่ 1',
    houseNo: '',
    symptoms: {
      coughOver2Weeks: false,
      fever: false,
      nightSweats: false,
      weightLoss: false,
      hemoptysis: false
    },
    hasAnySymptom: false,
    cxrDate: new Date().toISOString().split('T')[0],
    cxrResult: 'Normal',
    cxrAbnormalPattern: 'None',
    cxrDetails: '',
    cxrAiScore: 10,
    radiologistName: 'พญ.ชญานิศ รังสีแพทย์',
    mtbTestDone: false,
    mtbTestType: 'ยังไม่ได้ตรวจ',
    mtbTestDate: '',
    mtbResult: 'Not Done',
    mtbLabNumber: '',
    specimenType: 'Sputum (เสมหะ)',
    diagnosisStatus: 'รอผลตรวจยืนยัน',
    actionPlan: 'สุขศึกษาและติดตามอาการ',
    notes: '',
    screenerName: currentUser ? currentUser.fullName : 'เจ้าหน้าที่ผู้คัดกรอง',
    screenerRole: currentUser ? currentUser.role : 'Staff',
    transferredToPatientRegistry: false
  };

  const [formData, setFormData] = useState<Partial<TbCxrScreeningRecord>>(initialForm);

  // Clean Screenings (Excluding any system mock records)
  const cleanScreenings = useMemo(() => {
    return (screenings || []).filter(item => !isSystemMockScreening(item));
  }, [screenings]);

  // Filtered Screenings
  const filteredScreenings = useMemo(() => {
    return cleanScreenings.filter(item => {
      // Risk group filter
      if (selectedRiskGroup !== 'ALL' && item.riskGroup !== selectedRiskGroup) return false;

      // CXR filter
      if (cxrFilter !== 'ALL' && item.cxrResult !== cxrFilter) return false;

      // MTB filter
      if (mtbFilter !== 'ALL') {
        if (mtbFilter === 'MTB_DETECTED' && !item.mtbResult.includes('MTB detected')) return false;
        if (mtbFilter === 'RIF_RESISTANT' && !item.mtbResult.includes('Rif Resistance detected')) return false;
        if (mtbFilter === 'NOT_DETECTED' && item.mtbResult !== 'MTB not detected') return false;
        if (mtbFilter === 'PENDING' && item.mtbResult !== 'Pending') return false;
      }

      // Subdistrict filter
      if (subdistrictFilter !== 'ALL' && item.subdistrict !== subdistrictFilter) return false;

      // Quick Chips
      if (onlyAbnormal && item.cxrResult !== 'Abnormal TB Suspect') return false;
      if (onlyMtbDetected && !item.mtbResult.includes('MTB detected')) return false;
      if (onlyPending && item.diagnosisStatus !== 'รอผลตรวจยืนยัน' && item.mtbResult !== 'Pending') return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = `${item.prefix}${item.firstName} ${item.lastName}`.toLowerCase().includes(query);
        const matchHN = item.hn.toLowerCase().includes(query);
        const matchCID = item.idCard.toLowerCase().includes(query);
        const matchPhone = item.phone.toLowerCase().includes(query);
        const matchVillage = item.village.toLowerCase().includes(query);
        const matchDetail = (item.riskGroupSpecificDetail || '').toLowerCase().includes(query);
        if (!matchName && !matchHN && !matchCID && !matchPhone && !matchVillage && !matchDetail) {
          return false;
        }
      }

      return true;
    });
  }, [cleanScreenings, selectedRiskGroup, cxrFilter, mtbFilter, subdistrictFilter, onlyAbnormal, onlyMtbDetected, onlyPending, searchQuery]);

  // KPI Statistics
  const stats = useMemo(() => {
    const total = cleanScreenings.length;
    const cxrAbnormal = cleanScreenings.filter(s => s.cxrResult === 'Abnormal TB Suspect').length;
    const mtbDetected = cleanScreenings.filter(s => s.mtbResult.includes('MTB detected') || s.mtbResult.includes('AFB Positive')).length;
    const rifResistant = cleanScreenings.filter(s => s.mtbResult.includes('Rif Resistance detected')).length;
    const activeTbDiagnosed = cleanScreenings.filter(s => s.diagnosisStatus === 'วัณโรคปอด (Active TB - เข้าเกณฑ์รักษา)').length;
    const tptInitiated = cleanScreenings.filter(s => s.actionPlan === 'เริ่มยาป้องกันวัณโรค (TPT: 3HP/1HP/6H)' || s.tptRegimen).length;
    const pendingCases = cleanScreenings.filter(s => s.diagnosisStatus === 'รอผลตรวจยืนยัน' || s.mtbResult === 'Pending' || s.cxrResult === 'Pending').length;

    // Per Risk Group stats
    const riskGroupCounts: Record<TBRiskGroupKey, { total: number; abnormal: number; mtb: number }> = {
      contact: { total: 0, abnormal: 0, mtb: 0 },
      inmate_welfare: { total: 0, abnormal: 0, mtb: 0 },
      hiv: { total: 0, abnormal: 0, mtb: 0 },
      immunocompromised: { total: 0, abnormal: 0, mtb: 0 },
      elderly_comorbid: { total: 0, abnormal: 0, mtb: 0 },
      substance_alcohol: { total: 0, abnormal: 0, mtb: 0 },
      healthcare_worker: { total: 0, abnormal: 0, mtb: 0 }
    };

    cleanScreenings.forEach(s => {
      if (riskGroupCounts[s.riskGroup]) {
        riskGroupCounts[s.riskGroup].total += 1;
        if (s.cxrResult === 'Abnormal TB Suspect') riskGroupCounts[s.riskGroup].abnormal += 1;
        if (s.mtbResult.includes('MTB detected') || s.mtbResult.includes('AFB Positive')) {
          riskGroupCounts[s.riskGroup].mtb += 1;
        }
      }
    });

    return {
      total,
      cxrAbnormal,
      mtbDetected,
      rifResistant,
      activeTbDiagnosed,
      tptInitiated,
      pendingCases,
      riskGroupCounts
    };
  }, [cleanScreenings]);

  // Helper to generate unique screening ID (starts at 101+ to avoid clash with old mock IDs)
  const generateUniqueScreeningId = (list: TbCxrScreeningRecord[]) => {
    const validList = (list || []).filter(s => !isSystemMockScreening(s));
    const numbers = validList
      .map(s => {
        const match = s.id?.match(/CXR-67-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n) && n > 0);
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNum = Math.max(maxNum + 1, 101);
    return `CXR-67-${String(nextNum).padStart(3, '0')}`;
  };

  // Open Form for Adding New Record
  const handleOpenAddForm = (preselectedGroup?: TBRiskGroupKey) => {
    const newId = generateUniqueScreeningId(cleanScreenings);
    setFormData({
      ...initialForm,
      id: newId,
      riskGroup: preselectedGroup || (selectedRiskGroup !== 'ALL' ? selectedRiskGroup : 'contact'),
      screenerName: currentUser ? currentUser.fullName : 'เจ้าหน้าที่ รพ.โพนนาแก้ว',
      screenerRole: currentUser ? currentUser.role : 'Staff'
    });
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEditForm = (record: TbCxrScreeningRecord) => {
    setEditingRecord(record);
    setFormData({ ...record });
    setIsFormOpen(true);
  };

  // Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.hn) {
      onShowToast('กรุณากรอกชื่อ-สกุล และ HN ผู้รับการคัดกรองให้ครบถ้วน', 'warning');
      return;
    }

    const symptomsObj = formData.symptoms || {
      coughOver2Weeks: false,
      fever: false,
      nightSweats: false,
      weightLoss: false,
      hemoptysis: false
    };
    const hasAny = Object.values(symptomsObj).some(val => Boolean(val));

    const targetId = editingRecord ? editingRecord.id : (formData.id || generateUniqueScreeningId(cleanScreenings));
    const finalRecord: TbCxrScreeningRecord = {
      id: targetId,
      screeningDate: formData.screeningDate || new Date().toISOString().split('T')[0],
      screeningCampaign: formData.screeningCampaign || 'คัดกรองกลุ่มเสี่ยง 7 กลุ่มประจำปี 2567',
      screeningFacility: formData.screeningFacility || 'รพ.โพนนาแก้ว',
      riskGroup: (formData.riskGroup as TBRiskGroupKey) || 'contact',
      riskGroupSpecificDetail: formData.riskGroupSpecificDetail || '',
      indexPatientHN: formData.indexPatientHN || '',
      indexPatientName: formData.indexPatientName || '',
      hn: (formData.hn || '').trim(),
      idCard: formData.idCard || '',
      prefix: formData.prefix || 'นาย',
      firstName: (formData.firstName || '').trim(),
      lastName: (formData.lastName || '').trim(),
      age: Number(formData.age) || 0,
      gender: formData.gender || 'ชาย',
      phone: formData.phone || '',
      subdistrict: formData.subdistrict || 'ตำบลบ้านโพน',
      village: formData.village || '',
      houseNo: formData.houseNo || '',
      lat: formData.lat || 17.2225884,
      lng: formData.lng || 104.3821033,
      symptoms: symptomsObj,
      hasAnySymptom: hasAny,
      cxrDate: formData.cxrDate || new Date().toISOString().split('T')[0],
      cxrResult: formData.cxrResult || 'Normal',
      cxrAbnormalPattern: formData.cxrAbnormalPattern || 'None',
      cxrDetails: formData.cxrDetails || '',
      cxrAiScore: formData.cxrAiScore !== undefined ? Number(formData.cxrAiScore) : 0,
      radiologistName: formData.radiologistName || 'พญ.ชญานิศ รังสีแพทย์',
      mtbTestDone: Boolean(formData.mtbTestDone),
      mtbTestType: formData.mtbTestType || 'ยังไม่ได้ตรวจ',
      mtbTestDate: formData.mtbTestDate || '',
      mtbResult: formData.mtbResult || 'Not Done',
      mtbLabNumber: formData.mtbLabNumber || '',
      specimenType: formData.specimenType || 'Sputum (เสมหะ)',
      diagnosisStatus: formData.diagnosisStatus || 'รอผลตรวจยืนยัน',
      actionPlan: formData.actionPlan || 'สุขศึกษาและติดตามอาการ',
      activeTbRegimen: formData.activeTbRegimen || '',
      tptRegimen: (formData.tptRegimen as any) || '',
      treatmentStartDate: formData.treatmentStartDate || '',
      transferredToPatientRegistry: Boolean(formData.transferredToPatientRegistry),
      transferredPatientId: formData.transferredPatientId || '',
      transferredAt: formData.transferredAt || '',
      notes: formData.notes || '',
      screenerName: formData.screenerName || (currentUser ? currentUser.fullName : 'เจ้าหน้าที่ผู้คัดกรอง'),
      screenerRole: formData.screenerRole || (currentUser ? currentUser.role : 'Staff'),
      createdAt: editingRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingRecord) {
      onUpdateScreening(finalRecord);
      onShowToast(`อัปเดตข้อมูลคัดกรอง ${finalRecord.prefix}${finalRecord.firstName} ${finalRecord.lastName} สำเร็จ`, 'success');
    } else {
      onAddScreening(finalRecord);
      onShowToast(`บันทึกข้อมูลคัดกรองกลุ่มเสี่ยง ${finalRecord.prefix}${finalRecord.firstName} ${finalRecord.lastName} เรียบร้อย`, 'success');
    }

    // Reset filters that would hide this newly saved/updated record
    if (selectedRiskGroup !== 'ALL' && selectedRiskGroup !== finalRecord.riskGroup) {
      setSelectedRiskGroup('ALL');
    }
    if (cxrFilter !== 'ALL' && cxrFilter !== finalRecord.cxrResult) {
      setCxrFilter('ALL');
    }
    if (mtbFilter !== 'ALL') {
      setMtbFilter('ALL');
    }
    if (onlyAbnormal && finalRecord.cxrResult !== 'Abnormal TB Suspect') {
      setOnlyAbnormal(false);
    }
    if (onlyMtbDetected && !finalRecord.mtbResult.includes('MTB detected')) {
      setOnlyMtbDetected(false);
    }
    if (onlyPending && finalRecord.diagnosisStatus !== 'รอผลตรวจยืนยัน' && finalRecord.mtbResult !== 'Pending') {
      setOnlyPending(false);
    }
    if (subdistrictFilter !== 'ALL' && subdistrictFilter !== finalRecord.subdistrict) {
      setSubdistrictFilter('ALL');
    }
    setSearchQuery('');

    // Highlight row
    setHighlightedRecordId(finalRecord.id);
    setTimeout(() => {
      setHighlightedRecordId(null);
    }, 4500);

    setIsFormOpen(false);
  };

  // Quick Action: Transfer to Active TB Patient Registry
  const handlePromoteClick = (record: TbCxrScreeningRecord) => {
    if (record.transferredToPatientRegistry) {
      onShowToast('ผู้ป่วยรายนี้ถูกส่งเข้าทะเบียนผู้ป่วย TB-Care แล้ว', 'warning');
      return;
    }

    onPromoteToPatient(record);
    const updated = {
      ...record,
      transferredToPatientRegistry: true,
      transferredAt: new Date().toISOString()
    };
    onUpdateScreening(updated);
    onShowToast(`โอนข้อมูล ${record.prefix}${record.firstName} เข้าทะเบียนผู้ป่วยวัณโรคสำเร็จ!`, 'success');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (screenings.length === 0) {
      onShowToast('ไม่มีข้อมูลสำหรับส่งออก', 'warning');
      return;
    }

    const headers = [
      'รหัสคัดกรอง',
      'วันที่คัดกรอง',
      'กลุ่มเสี่ยง 7 กลุ่ม',
      'รายละเอียดกลุ่มเสี่ยง',
      'HN',
      'เลขบัตรประชาชน',
      'คำนำหน้า',
      'ชื่อ',
      'นามสกุล',
      'อายุ',
      'เพศ',
      'เบอร์โทร',
      'ตำบล',
      'หมู่บ้าน',
      'บ้านเลขที่',
      'อาการไอเกิน 2 สัปดาห์',
      'มีไข้',
      'เหงื่อออกกลางคืน',
      'น้ำหนักลด',
      'ไอเป็นเลือด',
      'ผล CXR',
      'รูปแบบความผิดปกติ CXR',
      'คะแนน CAD4TB',
      'การตรวจเสมหะ/โมเลกุล',
      'ผลการตรวจ MTB',
      'เลขที่สิ่งส่งตรวจ',
      'การวินิจฉัย',
      'แผนการรักษา',
      'สูตรยา',
      'สถานะการส่งเข้าทะเบียนผู้ป่วย'
    ];

    const rows = filteredScreenings.map(s => [
      `"${s.id}"`,
      `"${s.screeningDate}"`,
      `"${TB_RISK_GROUPS_CONFIG[s.riskGroup]?.shortName || s.riskGroup}"`,
      `"${s.riskGroupSpecificDetail || ''}"`,
      `"${s.hn}"`,
      `"${s.idCard}"`,
      `"${s.prefix}"`,
      `"${s.firstName}"`,
      `"${s.lastName}"`,
      s.age,
      `"${s.gender}"`,
      `"${s.phone}"`,
      `"${s.subdistrict}"`,
      `"${s.village}"`,
      `"${s.houseNo}"`,
      s.symptoms.coughOver2Weeks ? 'ใช่' : 'ไม่ใช่',
      s.symptoms.fever ? 'ใช่' : 'ไม่ใช่',
      s.symptoms.nightSweats ? 'ใช่' : 'ไม่ใช่',
      s.symptoms.weightLoss ? 'ใช่' : 'ไม่ใช่',
      s.symptoms.hemoptysis ? 'ใช่' : 'ไม่ใช่',
      `"${s.cxrResult}"`,
      `"${s.cxrAbnormalPattern || ''}"`,
      s.cxrAiScore || '',
      `"${s.mtbTestType}"`,
      `"${s.mtbResult}"`,
      `"${s.mtbLabNumber || ''}"`,
      `"${s.diagnosisStatus}"`,
      `"${s.actionPlan}"`,
      `"${s.activeTbRegimen || s.tptRegimen || ''}"`,
      s.transferredToPatientRegistry ? 'ขึ้นทะเบียนแล้ว' : 'ยังไม่ขึ้นทะเบียน'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TBCXR_Screening_PhonNaKaeo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('ส่งออกไฟล์ข้อมูลคัดกรอง TBCXR Abnormal MTB สำเร็จ', 'success');
  };

  const riskGroupList = Object.values(TB_RISK_GROUPS_CONFIG);

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
      
      {/* Page Title & Main Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>NTP 2026 Active Case Finding Protocol</span>
              </span>
              <span className="bg-rose-500/20 text-rose-300 text-xs font-bold px-3 py-1 rounded-full border border-rose-400/30 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>7 กลุ่มเสี่ยงสูงเป้าหมายแห่งชาติ</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>คัดกรอง TBCXR Abnormal MTB</span>
              <span className="text-sm font-semibold px-3 py-0.5 rounded-lg bg-emerald-800/60 text-emerald-200 border border-emerald-600/40">
                อ.โพนนาแก้ว จ.สกลนคร
              </span>
            </h1>
            <p className="text-slate-300 text-sm max-w-4xl leading-relaxed">
              ระบบคัดกรองวัณโรคเชิงรุกด้วยภาพรังสีทรวงอก (Chest X-ray) และการตรวจทางโมเลกุลชีววิทยา (GeneXpert MTB/RIF)
              ใน 7 กลุ่มเป้าหมายสำคัญ เพื่อค้นหาผู้ป่วยวัณโรคแต่เนิ่น ๆ ตัดวงจรการแพร่กระจายเชื้อ และเข้าถึงยาป้องกันวัณโรค (TPT)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs flex items-center gap-2 border border-slate-700 shadow-sm transition"
              title="ดาวน์โหลดไฟล์ Excel / CSV สำหรับรายงานกระทรวงสาธารณสุข"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>ส่งออก Excel/CSV</span>
            </button>
            <button
              onClick={() => handleOpenAddForm()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกคัดกรองรายใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (Full HD Responsive 7 Columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7 gap-4">
        
        {/* Total Screened */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-semibold">คัดกรองสะสม</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">ครอบคลุม 5 ตำบล</p>
          </div>
        </div>

        {/* CXR Abnormal */}
        <div 
          onClick={() => { setOnlyAbnormal(!onlyAbnormal); setCxrFilter('ALL'); }}
          className={`rounded-2xl p-4 border shadow-sm flex flex-col justify-between cursor-pointer transition ${
            onlyAbnormal ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-400' : 'bg-white border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-semibold">CXR ผิดปกติสงสัย TB</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-600">{stats.cxrAbnormal}</div>
            <p className="text-[11px] text-amber-700/80 mt-0.5 font-medium">
              {stats.total > 0 ? `${((stats.cxrAbnormal / stats.total) * 100).toFixed(1)}% ของผู้คัดกรอง` : '0%'}
            </p>
          </div>
        </div>

        {/* MTB Detected */}
        <div 
          onClick={() => setOnlyMtbDetected(!onlyMtbDetected)}
          className={`rounded-2xl p-4 border shadow-sm flex flex-col justify-between cursor-pointer transition ${
            onlyMtbDetected ? 'bg-rose-100/70 border-rose-400 ring-2 ring-rose-400' : 'bg-white border-slate-200/80 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-semibold">ตรวจพบเชื้อ MTB</span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-600">{stats.mtbDetected}</div>
            <p className="text-[11px] text-rose-700/80 mt-0.5 font-medium">GeneXpert / AFB Smear +</p>
          </div>
        </div>

        {/* Rifampicin Resistant */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-semibold">ดื้อยา Rifampicin (RR)</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-purple-600">{stats.rifResistant}</div>
            <p className="text-[11px] text-purple-700/80 mt-0.5 font-medium">
              {stats.rifResistant > 0 ? 'ส่งต่อ MDR-TB รพ.ศูนย์' : 'ยังไม่พบสายพันธุ์ดื้อยา'}
            </p>
          </div>
        </div>

        {/* Active TB Diagnosed */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-semibold">วินิจฉัย Active TB</span>
            <span className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Stethoscope className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-teal-600">{stats.activeTbDiagnosed}</div>
            <p className="text-[11px] text-teal-700/80 mt-0.5 font-medium">เริ่มยารักษา 2HRZE/4HR</p>
          </div>
        </div>

        {/* TPT Prescribed */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-semibold">ได้รับยาป้องกัน (TPT)</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <HeartPulse className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-blue-600">{stats.tptInitiated}</div>
            <p className="text-[11px] text-blue-700/80 mt-0.5 font-medium">สูตร 3HP / 1HP / 6H</p>
          </div>
        </div>

        {/* Pending Cases */}
        <div 
          onClick={() => setOnlyPending(!onlyPending)}
          className={`rounded-2xl p-4 border shadow-sm flex flex-col justify-between cursor-pointer transition ${
            onlyPending ? 'bg-slate-200 border-slate-400 ring-2 ring-slate-400' : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-semibold">รอผลตรวจยืนยัน</span>
            <span className="p-2 bg-slate-100 text-slate-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-700">{stats.pendingCases}</div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">รอผล CXR หรือ แล็บ</p>
          </div>
        </div>

      </div>

      {/* 7 High-Risk Groups Interactive Grid / Cards */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>สถานะการคัดกรอง 7 กลุ่มเสี่ยงสูง (Target Risk Groups)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              คลิกที่บัตรกลุ่มเสี่ยงเพื่อกรองข้อมูลรายบุคคลเฉพาะกลุ่มนั้น
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedRiskGroup('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedRiskGroup === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              แสดงทุกกลุ่มเสี่ยง ({screenings.length})
            </button>
          </div>
        </div>

        {/* 7 Groups Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7 gap-3">
          {riskGroupList.map((g, idx) => {
            const isSelected = selectedRiskGroup === g.key;
            const groupStat = stats.riskGroupCounts[g.key] || { total: 0, abnormal: 0, mtb: 0 };

            return (
              <div
                key={g.key}
                onClick={() => setSelectedRiskGroup(isSelected ? 'ALL' : g.key)}
                className={`rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500'
                    : 'border-slate-200 hover:border-emerald-300 hover:shadow-sm bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                      {g.code} (กลุ่มที่ {idx + 1})
                    </span>
                    {groupStat.mtb > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white">
                        MTB+ {groupStat.mtb}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                    {g.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {g.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500">คัดกรอง: </span>
                    <span className="font-bold text-slate-900">{groupStat.total} ราย</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-amber-600 font-medium">CXR ผิดปกติ: </span>
                    <span className="font-bold text-amber-700">{groupStat.abnormal}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, สกุล, HN, เลขบัตร ปชช. 13 หลัก, เบอร์โทร, หมู่บ้าน..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
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

          {/* Filters Selects */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Risk Group Select */}
            <select
              value={selectedRiskGroup}
              onChange={e => setSelectedRiskGroup(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">กลุ่มเสี่ยง: ทั้งหมด 7 กลุ่ม</option>
              {riskGroupList.map(g => (
                <option key={g.key} value={g.key}>
                  {g.code}: {g.shortName}
                </option>
              ))}
            </select>

            {/* CXR Finding Select */}
            <select
              value={cxrFilter}
              onChange={e => setCxrFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">ผล CXR: ทั้งหมด</option>
              <option value="Abnormal TB Suspect">⚠️ ผิดปกติสงสัย TB (Abnormal)</option>
              <option value="Normal">✓ ผลปกติ (Normal)</option>
              <option value="Abnormal Non-TB">ผิดปกติโรคอื่น (Non-TB)</option>
              <option value="Pending">รอผลอ่าน CXR</option>
            </select>

            {/* MTB Result Select */}
            <select
              value={mtbFilter}
              onChange={e => setMtbFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">ผล MTB/แล็บ: ทั้งหมด</option>
              <option value="MTB_DETECTED">🔴 พบเชื้อ MTB (MTB detected)</option>
              <option value="RIF_RESISTANT">🟣 ดื้อยา Rifampicin (RR-TB)</option>
              <option value="NOT_DETECTED">🟢 ไม่พบเชื้อ (MTB not detected)</option>
              <option value="PENDING">⏳ อยู่ระหว่างรอผลแล็บ</option>
            </select>

            {/* Subdistrict Select */}
            <select
              value={subdistrictFilter}
              onChange={e => setSubdistrictFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">ตำบล: ทั้งหมด 5 ตำบล</option>
              {PHON_NA_KAEO_SUBDISTRICTS.map(s => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium">ทางลัดตัวกรอง:</span>
          
          <button
            onClick={() => setOnlyAbnormal(!onlyAbnormal)}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              onlyAbnormal
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            เฉพาะ CXR ผิดปกติ ({stats.cxrAbnormal})
          </button>

          <button
            onClick={() => setOnlyMtbDetected(!onlyMtbDetected)}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              onlyMtbDetected
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            เฉพาะพบเชื้อ MTB+ ({stats.mtbDetected})
          </button>

          <button
            onClick={() => setOnlyPending(!onlyPending)}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              onlyPending
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            เฉพาะเคสรอผล ({stats.pendingCases})
          </button>

          {(selectedRiskGroup !== 'ALL' || cxrFilter !== 'ALL' || mtbFilter !== 'ALL' || subdistrictFilter !== 'ALL' || onlyAbnormal || onlyMtbDetected || onlyPending || searchQuery) && (
            <button
              onClick={() => {
                setSelectedRiskGroup('ALL');
                setCxrFilter('ALL');
                setMtbFilter('ALL');
                setSubdistrictFilter('ALL');
                setOnlyAbnormal(false);
                setOnlyMtbDetected(false);
                setOnlyPending(false);
                setSearchQuery('');
              }}
              className="text-emerald-700 hover:underline font-semibold ml-auto"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Screenings Table (Full HD Responsive) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">
              รายการคัดกรอง TBCXR & ผลตรวจ MTB
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              แสดง {filteredScreenings.length} จาก {cleanScreenings.length} รายการ
            </span>
          </div>

          <button
            onClick={() => handleOpenAddForm()}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มผู้รับการคัดกรอง</span>
          </button>
        </div>

        {cleanScreenings.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-800">
                ยังไม่มีข้อมูลการคัดกรอง TBCXR ในระบบ
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                ข้อมูลตัวอย่างระบบถูกนำออกเรียบร้อยแล้ว ระบบพร้อมสำหรับการบันทึกผลการคัดกรองวัณโรคเชิงรุก (CXR & GeneXpert MTB) 7 กลุ่มเสี่ยง อ.โพนนาแก้ว
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => handleOpenAddForm()}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-900/20 transition active:scale-95 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ บันทึกคัดกรองรายใหม่</span>
              </button>
            </div>
          </div>
        ) : filteredScreenings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">ไม่พบข้อมูลตามเงื่อนไขตัวกรอง</p>
            <p className="text-xs text-slate-400">ระบบมีข้อมูลทั้งหมด {cleanScreenings.length} รายการ ลองปรับเปลี่ยนตัวกรอง หรือคลิก "+ บันทึกคัดกรองรายใหม่"</p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedRiskGroup('ALL');
                  setCxrFilter('ALL');
                  setMtbFilter('ALL');
                  setSubdistrictFilter('ALL');
                  setOnlyAbnormal(false);
                  setOnlyMtbDetected(false);
                  setOnlyPending(false);
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                ล้างตัวกรองทั้งหมด (แสดงครบ {cleanScreenings.length} รายการ)
              </button>
              <button
                onClick={() => handleOpenAddForm()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
              >
                + บันทึกคัดกรองรายใหม่
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">วันที่ & รหัสคัดกรอง</th>
                  <th className="py-3 px-4">ผู้รับการคัดกรอง (HN / CID)</th>
                  <th className="py-3 px-4">กลุ่มเสี่ยง 7 กลุ่ม</th>
                  <th className="py-3 px-4">ผล Chest X-Ray (TBCXR)</th>
                  <th className="py-3 px-4">ผลตรวจทางโมเลกุล MTB</th>
                  <th className="py-3 px-4">การวินิจฉัย & แผนการรักษา</th>
                  <th className="py-3 px-4 text-center">ทะเบียนผู้ป่วย</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredScreenings.map(record => {
                  const riskMeta = TB_RISK_GROUPS_CONFIG[record.riskGroup] || TB_RISK_GROUPS_CONFIG.contact;
                  const isAbnormalCxr = record.cxrResult === 'Abnormal TB Suspect';
                  const isMtbDetected = record.mtbResult.includes('MTB detected');
                  const isRifResistant = record.mtbResult.includes('Rif Resistance detected');
                  const isHighlighted = highlightedRecordId === record.id;

                  return (
                    <tr 
                      key={record.id} 
                      className={`transition-all duration-300 ${
                        isHighlighted
                          ? 'bg-emerald-100/90 ring-2 ring-emerald-500'
                          : isAbnormalCxr ? 'bg-amber-50/20 hover:bg-amber-50/40' : isMtbDetected ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Date & ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{record.screeningDate}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{record.id}</div>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                          {record.screeningCampaign}
                        </span>
                      </td>

                      {/* Personal Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {record.prefix}{record.firstName} {record.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>อายุ {record.age} ปี ({record.gender})</span>
                          <span>•</span>
                          <span className="font-mono text-slate-700">HN: {record.hn}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {record.village}, {record.subdistrict}
                        </div>
                        {record.hasAnySymptom && (
                          <div className="mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                              มีอาการสงสัย TB
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Risk Group */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${riskMeta.badgeBg} ${riskMeta.badgeText}`}>
                          <span>{riskMeta.code}:</span>
                          <span>{riskMeta.shortName}</span>
                        </span>
                        {record.riskGroupSpecificDetail && (
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                            {record.riskGroupSpecificDetail}
                          </p>
                        )}
                        {record.indexPatientHN && (
                          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                            สัมผัสเคส: {record.indexPatientName || record.indexPatientHN}
                          </p>
                        )}
                      </td>

                      {/* CXR Finding */}
                      <td className="py-3.5 px-4">
                        {record.cxrResult === 'Abnormal TB Suspect' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>ผิดปกติสงสัย TB</span>
                            </span>
                            {record.cxrAbnormalPattern && record.cxrAbnormalPattern !== 'None' && (
                              <div className="text-[11px] font-semibold text-amber-900 mt-1">
                                {record.cxrAbnormalPattern}
                              </div>
                            )}
                            {record.cxrAiScore !== undefined && (
                              <div className="text-[10px] text-slate-500">
                                AI CAD4TB: <span className="font-bold text-amber-700">{record.cxrAiScore}/100</span>
                              </div>
                            )}
                          </div>
                        ) : record.cxrResult === 'Normal' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>ปกติ (Normal)</span>
                          </span>
                        ) : record.cxrResult === 'Pending' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>รอผลอ่าน</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            {record.cxrResult}
                          </span>
                        )}
                      </td>

                      {/* Molecular / MTB Result */}
                      <td className="py-3.5 px-4">
                        {isRifResistant ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                              <AlertCircle className="w-3 h-3 text-purple-600" />
                              <span>MTB+ ดื้อยา Rifampicin</span>
                            </span>
                            <div className="text-[10px] text-purple-700 font-semibold mt-0.5">
                              {record.mtbTestType}
                            </div>
                          </div>
                        ) : isMtbDetected ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              <span>พบเชื้อ MTB (ไวต่อยา)</span>
                            </span>
                            <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
                              {record.mtbTestType}
                            </div>
                          </div>
                        ) : record.mtbResult === 'MTB not detected' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>ไม่พบเชื้อ (MTB-)</span>
                            </span>
                          </div>
                        ) : record.mtbResult === 'Pending' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>รอผลแล็บ</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">ยังไม่ได้ส่งตรวจ</span>
                        )}
                        {record.mtbLabNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Lab: {record.mtbLabNumber}
                          </div>
                        )}
                      </td>

                      {/* Diagnosis & Action Plan */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-bold text-slate-900 text-[11px]">
                          {record.diagnosisStatus}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                          {record.actionPlan}
                        </div>
                        {record.activeTbRegimen && (
                          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-mono font-semibold">
                            สูตร: {record.activeTbRegimen}
                          </span>
                        )}
                        {record.tptRegimen && (
                          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono font-semibold">
                            TPT: {record.tptRegimen}
                          </span>
                        )}
                      </td>

                      {/* Patient Registry Promotion Link */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {record.transferredToPatientRegistry ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>ขึ้นทะเบียนแล้ว</span>
                          </span>
                        ) : record.diagnosisStatus === 'วัณโรคปอด (Active TB - เข้าเกณฑ์รักษา)' || isMtbDetected ? (
                          <button
                            onClick={() => handlePromoteClick(record)}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition active:scale-95 mx-auto"
                            title="โอนข้อมูลเข้าสู่ทะเบียนผู้ป่วยวัณโรคเพื่อบันทึก DOTS และแจกยา"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>โอนเข้าทะเบียน</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingRecord(record)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition"
                            title="ดูรายละเอียดฉบับสมบูรณ์"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditForm(record)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(record.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="ลบรายการ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900">ยืนยันการลบข้อมูลคัดกรอง?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              คุณต้องการลบข้อมูลผลการคัดกรองรหัส <strong>{deleteConfirmId}</strong> ใช่หรือไม่? 
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteScreening(deleteConfirmId);
                  setDeleteConfirmId(null);
                  onShowToast('ลบรายการคัดกรองเรียบร้อยแล้ว', 'success');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition"
              >
                ลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Clinical View Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {viewingRecord.id}
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  แบบบันทึกผลการคัดกรอง TBCXR & MTB รายบุคคล
                </h2>
                <p className="text-xs text-slate-500">
                  หน่วยบริการ: {viewingRecord.screeningFacility} • วันที่ตรวจ: {viewingRecord.screeningDate}
                </p>
              </div>
              <button
                onClick={() => setViewingRecord(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile & Risk Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">ข้อมูลผู้รับการคัดกรอง</span>
                <div className="font-bold text-base text-slate-900">
                  {viewingRecord.prefix}{viewingRecord.firstName} {viewingRecord.lastName}
                </div>
                <div className="text-slate-600">HN: {viewingRecord.hn} | เลขบัตร: {viewingRecord.idCard}</div>
                <div className="text-slate-600">อายุ {viewingRecord.age} ปี • เพศ {viewingRecord.gender} • โทร {viewingRecord.phone}</div>
                <div className="text-slate-600">ที่อยู่: {viewingRecord.houseNo} {viewingRecord.village} {viewingRecord.subdistrict} อ.โพนนาแก้ว</div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">กลุ่มเสี่ยงสำคัญ (1 ใน 7 กลุ่ม)</span>
                <div className="font-bold text-slate-900">
                  {TB_RISK_GROUPS_CONFIG[viewingRecord.riskGroup]?.name || viewingRecord.riskGroup}
                </div>
                {viewingRecord.riskGroupSpecificDetail && (
                  <p className="text-slate-700 bg-white p-2 rounded-xl border border-slate-200 mt-1">
                    {viewingRecord.riskGroupSpecificDetail}
                  </p>
                )}
                {viewingRecord.indexPatientHN && (
                  <p className="text-emerald-700 font-semibold">
                    ผู้ป่วยต้นทาง: {viewingRecord.indexPatientName} (HN: {viewingRecord.indexPatientHN})
                  </p>
                )}
              </div>
            </div>

            {/* Symptoms & CXR Result */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* 4 Symptoms */}
              <div className="border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>การคัดกรอง 4 อาการสงสัย</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className={`p-2 rounded-lg font-medium ${viewingRecord.symptoms.coughOver2Weeks ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    {viewingRecord.symptoms.coughOver2Weeks ? '✓' : '✗'} ไอเรื้อรัง &gt; 2 สัปดาห์
                  </div>
                  <div className={`p-2 rounded-lg font-medium ${viewingRecord.symptoms.fever ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    {viewingRecord.symptoms.fever ? '✓' : '✗'} มีไข้
                  </div>
                  <div className={`p-2 rounded-lg font-medium ${viewingRecord.symptoms.nightSweats ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    {viewingRecord.symptoms.nightSweats ? '✓' : '✗'} เหงื่อออกกลางคืน
                  </div>
                  <div className={`p-2 rounded-lg font-medium ${viewingRecord.symptoms.weightLoss ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    {viewingRecord.symptoms.weightLoss ? '✓' : '✗'} น้ำหนักลดผิดปกติ
                  </div>
                </div>
                {viewingRecord.symptoms.hemoptysis && (
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-900 font-bold text-[11px]">
                    ⚠️ มีอาการไอเป็นเลือด (Hemoptysis)
                  </div>
                )}
              </div>

              {/* CXR Reading */}
              <div className="border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>ผลการตรวจ Chest X-ray (TBCXR)</span>
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ผลการอ่าน:</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    viewingRecord.cxrResult === 'Abnormal TB Suspect' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {viewingRecord.cxrResult}
                  </span>
                </div>
                {viewingRecord.cxrAbnormalPattern && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">ลักษณะความผิดปกติ:</span>
                    <span className="font-bold text-slate-800">{viewingRecord.cxrAbnormalPattern}</span>
                  </div>
                )}
                {viewingRecord.cxrAiScore !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">คะแนน AI / CAD4TB Score:</span>
                    <span className="font-bold text-slate-900">{viewingRecord.cxrAiScore} / 100</span>
                  </div>
                )}
                {viewingRecord.cxrDetails && (
                  <p className="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-700">
                    {viewingRecord.cxrDetails}
                  </p>
                )}
                <div className="text-[10px] text-slate-400">
                  ผู้อ่านผล: {viewingRecord.radiologistName || 'รังสีแพทย์ รพ.โพนนาแก้ว'}
                </div>
              </div>

            </div>

            {/* Molecular MTB & Action Plan */}
            <div className="border border-slate-200 rounded-2xl p-4 text-xs space-y-3 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>การตรวจทางชีวโมเลกุล (MTB / GeneXpert / Sputum) & การวินิจฉัย</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">วิธีตรวจ:</span>
                  <span className="font-bold text-slate-900">{viewingRecord.mtbTestType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">ผลตรวจ:</span>
                  <span className={`font-bold ${
                    viewingRecord.mtbResult.includes('MTB detected') ? 'text-rose-600' : 'text-emerald-700'
                  }`}>
                    {viewingRecord.mtbResult}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">สิ่งส่งตรวจ/Lab No:</span>
                  <span className="font-mono text-slate-800">{viewingRecord.specimenType} {viewingRecord.mtbLabNumber || ''}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">การวินิจฉัยขั้นสุดท้าย:</span>
                  <span className="font-extrabold text-sm text-slate-900">{viewingRecord.diagnosisStatus}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">แผนการดูแลรักษา:</span>
                  <span className="font-bold text-slate-900">{viewingRecord.actionPlan}</span>
                </div>
              </div>

              {viewingRecord.notes && (
                <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                  {viewingRecord.notes}
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="text-[11px] text-slate-500">
                ผู้บันทึก: {viewingRecord.screenerName} ({viewingRecord.screenerRole})
              </div>
              <div className="flex items-center gap-2">
                {!viewingRecord.transferredToPatientRegistry && (
                  <button
                    onClick={() => {
                      handlePromoteClick(viewingRecord);
                      setViewingRecord(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>โอนเข้าทะเบียนผู้ป่วย TB</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    handleOpenEditForm(viewingRecord);
                    setViewingRecord(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  แก้ไขข้อมูล
                </button>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Screening Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {editingRecord ? 'แก้ไขข้อมูลคัดกรอง TBCXR & MTB' : 'บันทึกคัดกรองกลุ่มเสี่ยงรายใหม่ (New Screening)'}
                </h2>
                <p className="text-xs text-slate-500">
                  บันทึกข้อมูลคัดกรองตามแนวทางควบคุมวัณโรคแห่งชาติ อ.โพนนาแก้ว
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6 text-xs">
              
              {/* Section 1: Campaign & 7 Risk Groups Selection */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-emerald-900">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  <span>1. เลือกกลุ่มเป้าหมายสำคัญ (7 กลุ่มเสี่ยงสูง) & แคมเปญคัดกรอง</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      กลุ่มเป้าหมาย 7 กลุ่ม <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.riskGroup}
                      onChange={e => setFormData({ ...formData, riskGroup: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 text-xs"
                      required
                    >
                      {riskGroupList.map(g => (
                        <option key={g.key} value={g.key}>
                          {g.code}: {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      แคมเปญ / โครงการคัดกรอง
                    </label>
                    <input
                      type="text"
                      value={formData.screeningCampaign || ''}
                      onChange={e => setFormData({ ...formData, screeningCampaign: e.target.value })}
                      placeholder="เช่น รถเอกซเรย์ระบบดิจิทัลพระราชทาน, คัดกรองคลินิก NCD"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      รายละเอียดกลุ่มเสี่ยงเพิ่มเติม (เช่น ผล HbA1c, โรคประจำตัว, ประวัติการสัมผัส)
                    </label>
                    <input
                      type="text"
                      value={formData.riskGroupSpecificDetail || ''}
                      onChange={e => setFormData({ ...formData, riskGroupSpecificDetail: e.target.value })}
                      placeholder="เช่น DM HbA1c 8.9%, CKD Stage 3, ผู้สัมผัสร่วมบ้านผู้ป่วยเสมหะบวก"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {formData.riskGroup === 'contact' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">HN ผู้ป่วยต้นทาง</label>
                        <input
                          type="text"
                          value={formData.indexPatientHN || ''}
                          onChange={e => setFormData({ ...formData, indexPatientHN: e.target.value })}
                          placeholder="เช่น 67-0482"
                          className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">ชื่อผู้ป่วยต้นทาง</label>
                        <input
                          type="text"
                          value={formData.indexPatientName || ''}
                          onChange={e => setFormData({ ...formData, indexPatientName: e.target.value })}
                          placeholder="ชื่อ-สกุล"
                          className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Demographic Information */}
              <div className="border border-slate-200 p-4 rounded-2xl space-y-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>2. ข้อมูลส่วนบุคคล & ที่อยู่ (อ.โพนนาแก้ว)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      HN <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.hn || ''}
                      onChange={e => setFormData({ ...formData, hn: e.target.value })}
                      placeholder="เช่น 67-1234"
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">เลขบัตร ปชช. 13 หลัก</label>
                    <input
                      type="text"
                      value={formData.idCard || ''}
                      onChange={e => setFormData({ ...formData, idCard: e.target.value })}
                      placeholder="x-xxxx-xxxxx-xx-x"
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">คำนำหน้า</label>
                    <select
                      value={formData.prefix || 'นาย'}
                      onChange={e => setFormData({ ...formData, prefix: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                    >
                      <option value="นาย">นาย</option>
                      <option value="นาง">นาง</option>
                      <option value="นางสาว">นางสาว</option>
                      <option value="ด.ช.">ด.ช.</option>
                      <option value="ด.หญิง">ด.หญิง</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="08x-xxx-xxxx"
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      ชื่อ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName || ''}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      นามสกุล <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName || ''}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">อายุ (ปี)</label>
                      <input
                        type="number"
                        value={formData.age || 0}
                        onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                        className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">เพศ</label>
                      <select
                        value={formData.gender || 'ชาย'}
                        onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                        className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                      >
                        <option value="ชาย">ชาย</option>
                        <option value="หญิง">หญิง</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ตำบล</label>
                    <select
                      value={formData.subdistrict || 'ตำบลบ้านโพน'}
                      onChange={e => {
                        const newSub = e.target.value;
                        const vList = getVillagesForSubdistrict(newSub);
                        setFormData({
                          ...formData,
                          subdistrict: newSub,
                          village: vList[0] || ''
                        });
                      }}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                    >
                      {PHON_NA_KAEO_SUBDISTRICTS.map(s => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">หมู่บ้าน</label>
                    <select
                      value={formData.village || ''}
                      onChange={e => setFormData({ ...formData, village: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                    >
                      {getVillagesForSubdistrict(formData.subdistrict || 'ตำบลบ้านโพน').map(v => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">บ้านเลขที่</label>
                    <input
                      type="text"
                      value={formData.houseNo || ''}
                      onChange={e => setFormData({ ...formData, houseNo: e.target.value })}
                      placeholder="เช่น 12/1"
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: 4 Symptoms Questionnaire */}
              <div className="border border-slate-200 p-4 rounded-2xl space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Activity className="w-4 h-4 text-amber-600" />
                  <span>3. ประเมินอาการสงสัยวัณโรค (4 Symptoms Screening)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-xl hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.symptoms?.coughOver2Weeks)}
                      onChange={e => setFormData({
                        ...formData,
                        symptoms: { ...(formData.symptoms as any), coughOver2Weeks: e.target.checked }
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-[11px] font-semibold text-slate-800">ไอเรื้อรัง &gt; 2 สัปดาห์</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-xl hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.symptoms?.fever)}
                      onChange={e => setFormData({
                        ...formData,
                        symptoms: { ...(formData.symptoms as any), fever: e.target.checked }
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-[11px] font-semibold text-slate-800">มีไข้ช่วงบ่าย/ค่ำ</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-xl hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.symptoms?.nightSweats)}
                      onChange={e => setFormData({
                        ...formData,
                        symptoms: { ...(formData.symptoms as any), nightSweats: e.target.checked }
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-[11px] font-semibold text-slate-800">เหงื่อออกตอนกลางคืน</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-xl hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.symptoms?.weightLoss)}
                      onChange={e => setFormData({
                        ...formData,
                        symptoms: { ...(formData.symptoms as any), weightLoss: e.target.checked }
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-[11px] font-semibold text-slate-800">น้ำหนักลดผิดปกติ</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-xl hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.symptoms?.hemoptysis)}
                      onChange={e => setFormData({
                        ...formData,
                        symptoms: { ...(formData.symptoms as any), hemoptysis: e.target.checked }
                      })}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span className="text-[11px] font-bold text-rose-700">ไอเป็นเลือด</span>
                  </label>
                </div>
              </div>

              {/* Section 4: CXR Findings */}
              <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-amber-50/20">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>4. ผลการตรวจภาพรังสีทรวงอก (Chest X-ray / TBCXR)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">วันที่ตรวจ CXR</label>
                    <input
                      type="date"
                      value={formData.cxrDate || ''}
                      onChange={e => setFormData({ ...formData, cxrDate: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      ผลการอ่าน CXR <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.cxrResult || 'Normal'}
                      onChange={e => setFormData({ ...formData, cxrResult: e.target.value as any })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs font-bold"
                    >
                      <option value="Normal">✓ ปกติ (Normal)</option>
                      <option value="Abnormal TB Suspect">⚠️ ผิดปกติสงสัยวัณโรค (Abnormal TB Suspect)</option>
                      <option value="Abnormal Non-TB">ผิดปกติโรคอื่น (Abnormal Non-TB)</option>
                      <option value="Pending">รอผลอ่าน</option>
                      <option value="Not Done">ยังไม่ได้ตรวจ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ลักษณะความผิดปกติ (Pattern)</label>
                    <select
                      value={formData.cxrAbnormalPattern || 'None'}
                      onChange={e => setFormData({ ...formData, cxrAbnormalPattern: e.target.value as any })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                    >
                      <option value="None">ไม่พบ / ปกติ</option>
                      <option value="Infiltration / Patchy">Infiltration / Patchy Infiltrate</option>
                      <option value="Cavity">Cavity (มีโพรงแผล)</option>
                      <option value="Nodule / Mass">Nodule / Mass</option>
                      <option value="Pleural Effusion">Pleural Effusion (น้ำในเยื่อหุ้มปอด)</option>
                      <option value="Fibrocalcific (Old TB)">Fibrocalcific / Old Inactive TB</option>
                      <option value="Miliary">Miliary Pattern</option>
                      <option value="Cardiomegaly / Other">Cardiomegaly / Other Non-TB</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">AI / CAD4TB Score (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.cxrAiScore !== undefined ? formData.cxrAiScore : ''}
                      onChange={e => setFormData({ ...formData, cxrAiScore: Number(e.target.value) })}
                      placeholder="เช่น 78"
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">บันทึกรายละเอียดภาพรังสี & ชื่อแพทย์ผู้แปลผล</label>
                  <input
                    type="text"
                    value={formData.cxrDetails || ''}
                    onChange={e => setFormData({ ...formData, cxrDetails: e.target.value })}
                    placeholder="เช่น Reticulonodular infiltration at RUL, apical pleural thickening"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Section 5: Molecular MTB / GeneXpert */}
              <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-rose-50/20">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-rose-900">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>5. การตรวจเสมหะและชีวโมเลกุล (MTB / GeneXpert / AFB)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">วิธีการตรวจ</label>
                    <select
                      value={formData.mtbTestType || 'ยังไม่ได้ตรวจ'}
                      onChange={e => setFormData({ ...formData, mtbTestType: e.target.value as any })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                    >
                      <option value="ยังไม่ได้ตรวจ">ยังไม่ได้ตรวจ</option>
                      <option value="GeneXpert MTB/RIF">GeneXpert MTB/RIF</option>
                      <option value="GeneXpert Ultra">GeneXpert Ultra</option>
                      <option value="AFB Smear">AFB Sputum Smear</option>
                      <option value="TB-LAMP">TB-LAMP</option>
                      <option value="TB Culture">TB Culture</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      ผลการตรวจ MTB
                    </label>
                    <select
                      value={formData.mtbResult || 'Not Done'}
                      onChange={e => setFormData({ ...formData, mtbResult: e.target.value as any })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs font-bold"
                    >
                      <option value="Not Done">ยังไม่ได้ตรวจ (Not Done)</option>
                      <option value="MTB not detected">🟢 ไม่พบเชื้อ (MTB not detected)</option>
                      <option value="MTB detected, Rif Resistance not detected">🔴 พบเชื้อ MTB (ไวต่อยา Rifampicin)</option>
                      <option value="MTB detected, Rif Resistance detected">🟣 พบเชื้อ MTB (ดื้อยา Rifampicin - RR-TB)</option>
                      <option value="MTB detected, Rif Resistance indeterminate">พบเชื้อ MTB (ผลดื้อยาไม่ชัดเจน)</option>
                      <option value="AFB Positive (1+ - 3+)">AFB บวก (1+ ถึง 3+)</option>
                      <option value="AFB Negative">AFB ลบ (Negative)</option>
                      <option value="Pending">รอผลแล็บ (Pending)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">สิ่งส่งตรวจ (Specimen)</label>
                    <select
                      value={formData.specimenType || 'Sputum (เสมหะ)'}
                      onChange={e => setFormData({ ...formData, specimenType: e.target.value as any })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                    >
                      <option value="Sputum (เสมหะ)">Sputum (เสมหะ)</option>
                      <option value="Gastric Lavage">Gastric Lavage</option>
                      <option value="Pleural Fluid">Pleural Fluid</option>
                      <option value="Other">อื่นๆ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">เลขที่แล็บ (Lab No.)</label>
                    <input
                      type="text"
                      value={formData.mtbLabNumber || ''}
                      onChange={e => setFormData({ ...formData, mtbLabNumber: e.target.value })}
                      placeholder="เช่น XPT-67/0312"
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Diagnosis & Action Plan */}
              <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-teal-50/20">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-teal-900">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <span>6. การวินิจฉัย & แผนการรักษา (Diagnosis & Treatment)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      การวินิจฉัย
                    </label>
                    <select
                      value={formData.diagnosisStatus || 'รอผลตรวจยืนยัน'}
                      onChange={e => setFormData({ ...formData, diagnosisStatus: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                    >
                      <option value="รอผลตรวจยืนยัน">รอผลตรวจยืนยัน</option>
                      <option value="วัณโรคปอด (Active TB - เข้าเกณฑ์รักษา)">วัณโรคปอด (Active TB - เข้าเกณฑ์รักษา)</option>
                      <option value="วัณโรคระยะแฝง (LTBI - พิจารณา TPT)">วัณโรคระยะแฝง (LTBI - พิจารณา TPT)</option>
                      <option value="ไม่พบวัณโรค (Normal / Non-TB)">ไม่พบวัณโรค (Normal / Non-TB)</option>
                      <option value="ส่งต่อตรวจวินิจฉัยเพิ่มเติม รพ.สกลนคร">ส่งต่อตรวจวินิจฉัยเพิ่มเติม รพ.สกลนคร</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      แผนการดูแลรักษา
                    </label>
                    <select
                      value={formData.actionPlan || 'สุขศึกษาและติดตามอาการ'}
                      onChange={e => setFormData({ ...formData, actionPlan: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                    >
                      <option value="เริ่มยารักษาวัณโรค (Active TB Treatment)">เริ่มยารักษาวัณโรค (Active TB Treatment)</option>
                      <option value="เริ่มยาป้องกันวัณโรค (TPT: 3HP/1HP/6H)">เริ่มยาป้องกันวัณโรค (TPT: 3HP/1HP/6H)</option>
                      <option value="นัดทำ CXR ซ้ำใน 3-6 เดือน">นัดทำ CXR ซ้ำใน 3-6 เดือน</option>
                      <option value="ส่งต่ออายุรแพทย์/แพทย์เฉพาะทาง">ส่งต่ออายุรแพทย์/แพทย์เฉพาะทาง</option>
                      <option value="สุขศึกษาและติดตามอาการ">สุขศึกษาและติดตามอาการ</option>
                      <option value="รอผลชันสูตร/เพาะเชื้อ">รอผลชันสูตร/เพาะเชื้อ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      สูตรยารักษา / ยาป้องกัน (Regimen)
                    </label>
                    <input
                      type="text"
                      value={formData.activeTbRegimen || formData.tptRegimen || ''}
                      onChange={e => setFormData({ ...formData, activeTbRegimen: e.target.value })}
                      placeholder="เช่น 2HRZE/4HR หรือ 3HP"
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      หมายเหตุเพิ่มเติม
                    </label>
                    <input
                      type="text"
                      value={formData.notes || ''}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="เช่น นัดติดตามผลสัปดาห์หน้า, แจ้ง อสม. ดูแลการกินยา"
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95"
                >
                  {editingRecord ? 'บันทึกการเปลี่ยนแปลง' : 'บันทึกข้อมูลคัดกรอง'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
