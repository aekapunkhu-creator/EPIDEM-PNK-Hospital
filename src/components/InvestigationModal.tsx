import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  UserCheck, 
  ClipboardList, 
  HeartPulse, 
  ShieldAlert, 
  Microscope, 
  Pill, 
  Users, 
  FileCheck2,
  Search,
  Sparkles,
  MapPin,
  Printer
} from 'lucide-react';
import { 
  InvestigationRecord, 
  Patient, 
  UserAccount, 
  TBType, 
  PatientCategory, 
  HIVStatus, 
  GeneXpertResult, 
  SputumResultStatus, 
  CXRResult 
} from '../types';
import { PHON_NA_KAEO_SUBDISTRICTS } from '../data/mockData';

interface InvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: InvestigationRecord) => void;
  initialData?: InvestigationRecord | null;
  patients: Patient[];
  currentUser?: UserAccount | null;
  onOpenPrint?: (record: InvestigationRecord) => void;
}

export const InvestigationModal: React.FC<InvestigationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  patients,
  currentUser,
  onOpenPrint
}) => {
  const [activeSection, setActiveSection] = useState<number>(1);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<InvestigationRecord>(() => {
    if (initialData) return initialData;
    const now = new Date().toISOString().split('T')[0];
    return {
      id: 'INV-' + Date.now(),
      investigationNumber: `INV-${new Date().getFullYear() + 543}-${String(Math.floor(Math.random() * 900) + 100)}`,
      investigationDate: now,
      investigatorName: currentUser?.fullName || '',
      investigatorRole: currentUser?.role === 'Admin' ? 'นักวิชาการสาธารณสุขชำนาญการ' : 'พยาบาลวิชาชีพ/เจ้าหน้าที่ระบาดวิทยา',
      investigatorUnit: currentUser?.hospitalName || 'โรงพยาบาลโพนนาแก้ว',
      investigatorPhone: currentUser?.phone || '042-123-456',

      // Section 1
      hn: '',
      idCard: '',
      prefix: 'นาย',
      firstName: '',
      lastName: '',
      gender: 'ชาย',
      age: 45,
      nationality: 'ไทย',
      maritalStatus: 'สมรส',
      occupation: 'เกษตรกรรม',
      workplaceOrSchool: 'อ.โพนนาแก้ว',
      phone: '',
      houseNo: '',
      villageNo: '1',
      villageName: 'บ้านโพน',
      subdistrict: currentUser?.subdistrict || 'ตำบลบ้านโพน',
      district: 'โพนนาแก้ว',
      province: 'สกลนคร',

      // Section 2
      onsetDate: now,
      firstConsultDate: now,
      diagnosisDate: now,
      treatmentStartDate: now,
      durationOfSymptomsWeeks: 3,
      symptoms: {
        chronicCough: true,
        hemoptysis: false,
        afternoonFever: true,
        nightSweats: true,
        weightLoss: true,
        lossOfAppetite: true,
        chestPain: false,
        dyspnea: false,
        lymphNodeSwelling: false,
        otherSymptoms: ''
      },

      // Section 3
      smoking: 'สูบเป็นประจำ',
      smokingPackYears: '10 ซอง-ปี',
      alcohol: 'ดื่มเป็นครั้งคราว',
      substanceAbuse: false,
      substanceDetails: '',
      underlyingDiseases: {
        diabetes: false,
        ckd: false,
        copdAsthma: false,
        liverDisease: false,
        malignancy: false,
        immunosuppressive: false,
        other: ''
      },
      hivStatus: 'Negative',
      hivTestedDate: now,
      onArt: false,
      historyOfTbContact: false,
      tbContactSourceDetails: '',
      pastTbHistory: false,
      pastTbYear: '',
      pastTbOutcome: '',
      prisonHistory: false,
      crowdedLiving: false,
      householdMembersCount: 4,

      // Section 4
      cxrDate: now,
      cxrResult: 'Abnormal TB Suspect',
      cxrLesionType: 'Infiltration',
      cxrDetails: 'พบ Infiltration at Upper lobe ทั้งสองข้าง',
      afbSmear1: '2+',
      afbSmear2: '2+',
      afbSmear3: '1+',
      afbDate: now,
      afbLabNo: 'LAB-' + Math.floor(Math.random() * 8999 + 1000),
      geneXpertDate: now,
      geneXpertResult: 'MTB detected, Rif Resistance not detected',
      cultureDate: '',
      cultureResult: 'Pending',

      // Section 5
      patientCategory: 'New',
      tbType: 'Pulmonary Smear+',
      icd10Code: 'A15.0',
      treatmentRegimen: '2HRZE/4HR',
      treatingFacility: 'โรงพยาบาลโพนนาแก้ว',
      dotsSupervisorType: 'อสม.พี่เลี้ยง',
      dotsSupervisorName: '',
      dotsSupervisorPhone: '',

      // Section 6
      contactsIdentified: 4,
      contactsScreened: 4,
      contactsCxrDone: 4,
      contactsAfbDone: 2,
      contactsTptInitiated: 0,
      contactsActiveTbFound: 0,

      // Section 7
      suspectedSource: 'ในชุมชน',
      transmissionRisk: 'สูง (High Risk)',
      investigationSummary: 'ผู้ป่วยมีอาการไอเรื้อรังและน้ำหนักลด ผลตรวจเสมหะพบเชื้อ AFB 2+ ยืนยันเป็นวัณโรคปอดเสมหะบวก (New Smear Positive) ได้เริ่มต้นการรักษาด้วยสูตร 2HRZE/4HR เรียบร้อยแล้ว',
      controlMeasuresTaken: '1. จัดทีม อสม. พี่เลี้ยง กำกับการกินยาทุกวันแบบ DOTS\n2. นัดตรวจภาพรังสีทรวงอก (CXR) และคัดกรองอาการผู้สัมผัสร่วมบ้านครบทุกราย\n3. ให้สุขศึกษาเรื่องการสวมหน้ากากอนามัย การไอจามถูกวิธี และการเปิดหน้าต่างระบายอากาศภายในบ้าน',
      recommendations: 'ติดตามผลตรวจเสมหะสิ้นเดือนที่ 2 และติดตามผู้สัมผัสกลุ่มเสี่ยงสูงเพื่อรับการประเมิน TPT',

      status: 'Complete',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  // Sync initialData when changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.patientId) {
        setSelectedPatientId(initialData.patientId);
      }
    }
  }, [initialData]);

  if (!isOpen) return null;

  // Auto-fill from selected patient
  const handleSelectPatientToFill = (patientId: string) => {
    setSelectedPatientId(patientId);
    const p = patients.find(item => item.id === patientId);
    if (!p) return;

    setFormData(prev => ({
      ...prev,
      patientId: p.id,
      hn: p.hn,
      idCard: p.idCard || prev.idCard,
      prefix: p.prefix,
      firstName: p.firstName,
      lastName: p.lastName,
      gender: p.gender,
      age: p.age,
      phone: p.phone,
      houseNo: p.houseNo,
      villageName: p.village,
      subdistrict: p.subdistrict,
      tbType: p.tbType,
      treatmentRegimen: p.regimen || '2HRZE/4HR',
      treatmentStartDate: p.treatmentStartDate || prev.treatmentStartDate,
      dotsSupervisorName: p.dotsSupervisorName || '',
      dotsSupervisorPhone: p.dotsSupervisorPhone || '',
      lat: p.lat,
      lng: p.lng,
      afbSmear1: p.sputumRecords?.[0]?.result || prev.afbSmear1,
      afbSmear2: p.sputumRecords?.[0]?.result || prev.afbSmear2,
      afbDate: p.sputumRecords?.[0]?.testDate || prev.afbDate
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hn || !formData.firstName || !formData.lastName) {
      alert('กรุณากรอก HN และชื่อ-สกุลผู้ป่วยให้ครบถ้วน');
      return;
    }

    const updated: InvestigationRecord = {
      ...formData,
      updatedAt: new Date().toISOString()
    };
    onSave(updated);
    onClose();
  };

  const sections = [
    { num: 1, label: '1. ข้อมูลผู้ป่วย', icon: UserCheck },
    { num: 2, label: '2. อาการ/เจ็บป่วย', icon: HeartPulse },
    { num: 3, label: '3. ความเสี่ยง/โรคร่วม', icon: ShieldAlert },
    { num: 4, label: '4. แล็บ/X-Ray', icon: Microscope },
    { num: 5, label: '5. วินิจฉัย/การรักษา', icon: Pill },
    { num: 6, label: '6. ผู้สัมผัสโรคร่วมบ้าน', icon: Users },
    { num: 7, label: '7. สรุป/มาตรการ', icon: FileCheck2 },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>{initialData ? 'แก้ไขแบบบันทึกการสอบสวนโรค' : 'บันทึกแบบสอบสวนโรควัณโรครายบุคคล'}</span>
                <span className="text-xs px-2 py-0.5 bg-emerald-700/60 rounded-full font-normal text-emerald-200">
                  NTP Form
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                แบบสอบสวนผู้ป่วยวัณโรคตามมาตรฐานกองวัณโรค กรมควบคุมโรค กระทรวงสาธารณสุข
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenPrint && (
              <button
                type="button"
                onClick={() => onOpenPrint(formData)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition"
                title="พิมพ์แบบสอบสวนโรคราชการ"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์แบบฟอร์ม</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Quick Auto-fill from Registered Patients */}
        {!initialData && (
          <div className="bg-emerald-50 px-6 py-2.5 border-b border-emerald-200/60 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-950">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-bounce" />
              <span>ดึงข้อมูลอัตโนมัติจากทะเบียนผู้ป่วย DOTS:</span>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <select
                value={selectedPatientId}
                onChange={(e) => handleSelectPatientToFill(e.target.value)}
                className="w-full text-xs bg-white border border-emerald-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 text-slate-800"
              >
                <option value="">-- เลือกผู้ป่วยเพื่อเติมข้อมูลอัตโนมัติ --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    HN: {p.hn} - {p.prefix}{p.firstName} {p.lastName} ({p.subdistrict} - {p.tbType})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex overflow-x-auto gap-1.5 no-scrollbar">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setActiveSection(s.num)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  activeSection === s.num
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* SECTION 1: ข้อมูลทั่วไป */}
          {activeSection === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>ส่วนที่ 1: ข้อมูลทั่วไปของผู้ป่วยและผู้สอบสวนโรค</span>
                </h4>
                <span className="text-xs text-slate-500">HN / ข้อมูลประชากร / ที่อยู่ขณะป่วย</span>
              </div>

              {/* Investigator Meta */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    <span>ข้อมูลผู้ดำเนินการสอบสวนโรค (Investigator Profile)</span>
                  </h5>
                  <span className="text-[11px] text-emerald-700 font-medium">สามารถแก้ไขข้อมูลและตำแหน่งได้ทุกจุด</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">เลขที่แบบสอบสวน</label>
                    <input
                      type="text"
                      value={formData.investigationNumber}
                      onChange={e => setFormData({...formData, investigationNumber: e.target.value})}
                      placeholder="เช่น INV-2569-001"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">วันที่ดำเนินการสอบสวน</label>
                    <input
                      type="date"
                      value={formData.investigationDate}
                      onChange={e => setFormData({...formData, investigationDate: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ชื่อ-สกุล ผู้สอบสวนโรค <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.investigatorName}
                      onChange={e => setFormData({...formData, investigatorName: e.target.value})}
                      placeholder="เช่น นายแพทย์สมชาย หรือ นางสาวสมหญิง"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ตำแหน่งผู้สอบสวนโรค <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.investigatorRole}
                      onChange={e => setFormData({...formData, investigatorRole: e.target.value})}
                      placeholder="เช่น นักวิชาการสาธารณสุขชำนาญการ"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    />
                    {/* Quick position chips */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        'นักวิชาการสาธารณสุขชำนาญการ',
                        'นักวิชาการสาธารณสุขปฏิบัติการ',
                        'พยาบาลวิชาชีพชำนาญการ',
                        'นายแพทย์ปฏิบัติการ',
                        'เจ้าพนักงานสาธารณสุข',
                        'อสม. พี่เลี้ยง'
                      ].map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setFormData({...formData, investigatorRole: role})}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                            formData.investigatorRole === role
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">หน่วยงาน / สถานพยาบาล</label>
                    <input
                      type="text"
                      value={formData.investigatorUnit}
                      onChange={e => setFormData({...formData, investigatorUnit: e.target.value})}
                      placeholder="เช่น โรงพยาบาลโพนนาแก้ว"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        'โรงพยาบาลโพนนาแก้ว',
                        'สสอ.โพนนาแก้ว',
                        'รพ.สต.บ้านใหม่ไชยา',
                        'รพ.สต.บ้านโพนบก',
                        'รพ.สต.บ้านน้ำผุ',
                        'รพ.สต.โพนแคน้อย',
                        'รพ.สต.บ้านโนนสามัคคี',
                        'รพ.สต.บ้านนาแก้วน้อย',
                        'รพ.สต.บ้านใหม่หนองผือ'
                      ].slice(0, 4).map(unit => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => setFormData({...formData, investigatorUnit: unit})}
                          className={`text-[10px] px-1.5 py-0.5 rounded-md border transition ${
                            formData.investigatorUnit === unit
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                          }`}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรศัพท์ติดต่อผู้สอบสวน</label>
                    <input
                      type="text"
                      value={formData.investigatorPhone}
                      onChange={e => setFormData({...formData, investigatorPhone: e.target.value})}
                      placeholder="เช่น 042-123-456 หรือ 081-xxx-xxxx"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Patient Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">HN <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.hn}
                    onChange={e => setFormData({...formData, hn: e.target.value})}
                    placeholder="เช่น 6701234"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">เลขบัตรประชาชน (13 หลัก)</label>
                  <input
                    type="text"
                    value={formData.idCard}
                    maxLength={13}
                    onChange={e => setFormData({...formData, idCard: e.target.value})}
                    placeholder="เลข 13 หลัก"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">คำนำหน้า</label>
                  <select
                    value={formData.prefix}
                    onChange={e => setFormData({...formData, prefix: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="ด.ช.">ด.ช.</option>
                    <option value="ด.หญิง">ด.หญิง</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">เพศ</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value as any})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ชื่อ <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">นามสกุล <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">อายุ (ปี)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={formData.age}
                    onChange={e => setFormData({...formData, age: parseInt(e.target.value) || 0})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="08x-xxx-xxxx"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">สัญชาติ</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={e => setFormData({...formData, nationality: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">สถานภาพสมรส</label>
                  <select
                    value={formData.maritalStatus}
                    onChange={e => setFormData({...formData, maritalStatus: e.target.value as any})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="โสด">โสด</option>
                    <option value="สมรส">สมรส</option>
                    <option value="หม้าย">หม้าย</option>
                    <option value="หย่าร้าง/แยกกันอยู่">หย่าร้าง/แยกกันอยู่</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">อาชีพ</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={e => setFormData({...formData, occupation: e.target.value})}
                    placeholder="เช่น ทำนา, รับจ้าง, ค้าขาย"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">สถานที่ทำงาน/โรงเรียน</label>
                  <input
                    type="text"
                    value={formData.workplaceOrSchool}
                    onChange={e => setFormData({...formData, workplaceOrSchool: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Address While Ill & GPS */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>ที่อยู่ขณะป่วยและพิกัดแผนที่ (อ.โพนนาแก้ว จ.สกลนคร)</span>
                  </h5>

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          pos => {
                            setFormData({
                              ...formData,
                              lat: parseFloat(pos.coords.latitude.toFixed(6)),
                              lng: parseFloat(pos.coords.longitude.toFixed(6))
                            });
                          },
                          err => {
                            alert('ไม่สามารถดึงพิกัด GPS ได้ กรุณาเปิดการอนุญาตตำแหน่งบนอุปกรณ์');
                          }
                        );
                      } else {
                        alert('อุปกรณ์ของคุณไม่รองรับการดึงพิกัด Geolocation');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition self-start sm:self-auto"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>ดึงพิกัด GPS อัตโนมัติจากอุปกรณ์</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">ตำบล <span className="text-red-500">*</span></label>
                    <select
                      value={formData.subdistrict}
                      onChange={e => {
                        const newSub = e.target.value;
                        const subInfo = PHON_NA_KAEO_SUBDISTRICTS.find(s => s.name === newSub);
                        setFormData({
                          ...formData, 
                          subdistrict: newSub,
                          lat: subInfo?.lat || formData.lat,
                          lng: subInfo?.lng || formData.lng
                        });
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                    >
                      {PHON_NA_KAEO_SUBDISTRICTS.map(sd => (
                        <option key={sd.code} value={sd.name}>{sd.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">เลือกหมู่บ้านในตำบล</label>
                    <select
                      onChange={e => {
                        const val = e.target.value;
                        if (!val) return;
                        const match = val.match(/หมู่ที่\s*(\d+)\s*(.+)/);
                        if (match) {
                          setFormData({
                            ...formData,
                            villageNo: match[1],
                            villageName: match[2].trim()
                          });
                        } else {
                          setFormData({
                            ...formData,
                            villageName: val
                          });
                        }
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    >
                      <option value="">-- เลือกหมู่บ้านด่วน --</option>
                      {PHON_NA_KAEO_SUBDISTRICTS.find(s => s.name === formData.subdistrict)?.villages.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">หมู่ที่</label>
                    <input
                      type="text"
                      value={formData.villageNo}
                      onChange={e => setFormData({...formData, villageNo: e.target.value})}
                      placeholder="เช่น 1"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">ชื่อหมู่บ้าน</label>
                    <input
                      type="text"
                      value={formData.villageName}
                      onChange={e => setFormData({...formData, villageName: e.target.value})}
                      placeholder="เช่น บ้านอ้อมแก้วใหญ่"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">บ้านเลขที่</label>
                    <input
                      type="text"
                      value={formData.houseNo}
                      onChange={e => setFormData({...formData, houseNo: e.target.value})}
                      placeholder="เช่น 12/1"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">ละติจูด (Latitude)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lat || ''}
                      onChange={e => setFormData({...formData, lat: parseFloat(e.target.value) || undefined})}
                      placeholder="เช่น 17.085123"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">ลองจิจูด (Longitude)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lng || ''}
                      onChange={e => setFormData({...formData, lng: parseFloat(e.target.value) || undefined})}
                      placeholder="เช่น 104.295456"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: อาการและประวัติการเจ็บป่วย */}
          {activeSection === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-emerald-600" />
                  <span>ส่วนที่ 2: ประวัติการเจ็บป่วยและอาการสำคัญ</span>
                </h4>
                <span className="text-xs text-slate-500">Timeline & อาการแสดง</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">วันที่เริ่มมีอาการ</label>
                  <input
                    type="date"
                    value={formData.onsetDate}
                    onChange={e => setFormData({...formData, onsetDate: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">วันเข้ารับการรักษาครั้งแรก</label>
                  <input
                    type="date"
                    value={formData.firstConsultDate}
                    onChange={e => setFormData({...formData, firstConsultDate: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">วันที่ได้รับการวินิจฉัย</label>
                  <input
                    type="date"
                    value={formData.diagnosisDate}
                    onChange={e => setFormData({...formData, diagnosisDate: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">วันที่เริ่มต้นรับประทานยา</label>
                  <input
                    type="date"
                    value={formData.treatmentStartDate}
                    onChange={e => setFormData({...formData, treatmentStartDate: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-emerald-800"
                  />
                </div>
              </div>

              {/* Symptoms checklist */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h5 className="font-bold text-xs text-slate-800">อาการสำคัญขณะป่วย (เลือกอาการที่พบ):</h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.symptoms.chronicCough}
                      onChange={e => setFormData({
                        ...formData,
                        symptoms: {...formData.symptoms, chronicCough: e.target.checked}
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-800">ไอเรื้อรังเกิน 2 สัปดาห์</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.symptoms.hemoptysis}
                      onChange={e => setFormData({
                        ...formData,
                        symptoms: {...formData.symptoms, hemoptysis: e.target.checked}
                      })}
                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    <span className="font-bold text-red-700">ไอเป็นเลือด (Hemoptysis)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.symptoms.afternoonFever}
                      onChange={e => setFormData({
                        ...formData,
                        symptoms: {...formData.symptoms, afternoonFever: e.target.checked}
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-800">มีไข้ต่ำๆ ตอนบ่าย/ค่ำ</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.symptoms.nightSweats}
                      onChange={e => setFormData({
                        ...formData,
                        symptoms: {...formData.symptoms, nightSweats: e.target.checked}
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-800">เหงื่อออกตอนกลางคืน</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.symptoms.weightLoss}
                      onChange={e => setFormData({
                        ...formData,
                        symptoms: {...formData.symptoms, weightLoss: e.target.checked}
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-800">น้ำหนักลดผิดปกติ</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.symptoms.lossOfAppetite}
                      onChange={e => setFormData({
                        ...formData,
                        symptoms: {...formData.symptoms, lossOfAppetite: e.target.checked}
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-800">เบื่ออาหาร / อ่อนเพลีย</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.symptoms.chestPain}
                      onChange={e => setFormData({
                        ...formData,
                        symptoms: {...formData.symptoms, chestPain: e.target.checked}
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-800">เจ็บแน่นหน้าอก</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.symptoms.dyspnea}
                      onChange={e => setFormData({
                        ...formData,
                        symptoms: {...formData.symptoms, dyspnea: e.target.checked}
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-800">หอบเหนื่อย</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.symptoms.lymphNodeSwelling}
                      onChange={e => setFormData({
                        ...formData,
                        symptoms: {...formData.symptoms, lymphNodeSwelling: e.target.checked}
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-medium text-slate-800">ต่อมน้ำเหลืองโต</span>
                  </label>
                </div>

                <div className="pt-2">
                  <label className="block text-slate-600 font-medium mb-1 text-xs">อาการอื่นๆ เพิ่มเติม</label>
                  <input
                    type="text"
                    value={formData.symptoms.otherSymptoms || ''}
                    onChange={e => setFormData({
                      ...formData,
                      symptoms: {...formData.symptoms, otherSymptoms: e.target.value}
                    })}
                    placeholder="เช่น มีเสมหะสีเหลืองเขียวปนเปื้อน..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: ความเสี่ยงและโรคร่วม */}
          {activeSection === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" />
                  <span>ส่วนที่ 3: ประวัติความเสี่ยง โรคร่วม และปัจจัยสิ่งแวดล้อม</span>
                </h4>
                <span className="text-xs text-slate-500">HIV / สุรา บุหรี่ / ประวัติสัมผัส</span>
              </div>

              {/* Behaviors & HIV */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">การสูบบุหรี่</label>
                  <select
                    value={formData.smoking}
                    onChange={e => setFormData({...formData, smoking: e.target.value as any})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="ไม่สูบ">ไม่สูบ</option>
                    <option value="เคยสูบ (เลิกแล้ว)">เคยสูบ (เลิกแล้ว)</option>
                    <option value="สูบเป็นประจำ">สูบเป็นประจำ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">การดื่มสุรา</label>
                  <select
                    value={formData.alcohol}
                    onChange={e => setFormData({...formData, alcohol: e.target.value as any})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="ไม่ดื่ม">ไม่ดื่ม</option>
                    <option value="ดื่มเป็นครั้งคราว">ดื่มเป็นครั้งคราว</option>
                    <option value="ดื่มเป็นประจำ (ติดสุรา)">ดื่มเป็นประจำ (ติดสุรา)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ผลตรวจ Anti-HIV</label>
                  <select
                    value={formData.hivStatus}
                    onChange={e => setFormData({...formData, hivStatus: e.target.value as HIVStatus})}
                    className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                      formData.hivStatus === 'Positive' ? 'bg-red-50 border-red-300 text-red-700' : 'border-slate-300'
                    }`}
                  >
                    <option value="Negative">Negative (ผลลบ)</option>
                    <option value="Positive">Positive (ผลบวก - ติดเชื้อ)</option>
                    <option value="Unknown / Not Tested">ยังไม่ได้ตรวจ / ไม่ทราบผล</option>
                  </select>
                </div>
              </div>

              {/* Comorbidities */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h5 className="font-bold text-xs text-slate-800">โรคประจำตัว / ภาวะภูมิคุ้มกันบกพร่อง:</h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.underlyingDiseases.diabetes}
                      onChange={e => setFormData({
                        ...formData,
                        underlyingDiseases: {...formData.underlyingDiseases, diabetes: e.target.checked}
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-medium">เบาหวาน (Diabetes Mellitus)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.underlyingDiseases.ckd}
                      onChange={e => setFormData({
                        ...formData,
                        underlyingDiseases: {...formData.underlyingDiseases, ckd: e.target.checked}
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-medium">ไตวายเรื้อรัง (CKD)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.underlyingDiseases.copdAsthma}
                      onChange={e => setFormData({
                        ...formData,
                        underlyingDiseases: {...formData.underlyingDiseases, copdAsthma: e.target.checked}
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-medium">ถุงลมโป่งพอง/หอบหืด (COPD)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.underlyingDiseases.liverDisease}
                      onChange={e => setFormData({
                        ...formData,
                        underlyingDiseases: {...formData.underlyingDiseases, liverDisease: e.target.checked}
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-medium">โรคตับเรื้อรัง / ตับแข็ง</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.underlyingDiseases.immunosuppressive}
                      onChange={e => setFormData({
                        ...formData,
                        underlyingDiseases: {...formData.underlyingDiseases, immunosuppressive: e.target.checked}
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-medium">ได้รับยากดภูมิคุ้มกัน/สเตียรอยด์</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.underlyingDiseases.malignancy}
                      onChange={e => setFormData({
                        ...formData,
                        underlyingDiseases: {...formData.underlyingDiseases, malignancy: e.target.checked}
                      })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-medium">โรคมะเร็ง</span>
                  </label>
                </div>
              </div>

              {/* Exposure History */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 font-semibold text-slate-800 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.historyOfTbContact}
                      onChange={e => setFormData({...formData, historyOfTbContact: e.target.checked})}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>มีประวัติสัมผัสผู้ป่วยวัณโรค</span>
                  </label>
                  {formData.historyOfTbContact && (
                    <input
                      type="text"
                      placeholder="ระบุ เช่น สัมผัสบิดา/เพื่อนร่วมงาน"
                      value={formData.tbContactSourceDetails || ''}
                      onChange={e => setFormData({...formData, tbContactSourceDetails: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 font-semibold text-slate-800 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.pastTbHistory}
                      onChange={e => setFormData({...formData, pastTbHistory: e.target.checked})}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>เคยป่วยเป็นวัณโรคมาก่อน</span>
                  </label>
                  {formData.pastTbHistory && (
                    <input
                      type="text"
                      placeholder="ระบุปี พ.ศ. ที่เคยรักษา"
                      value={formData.pastTbYear || ''}
                      onChange={e => setFormData({...formData, pastTbYear: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">จำนวนคนอาศัยร่วมบ้าน (คน)</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.householdMembersCount}
                      onChange={e => setFormData({...formData, householdMembersCount: parseInt(e.target.value) || 1})}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: แล็บและ CXR */}
          {activeSection === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-emerald-600" />
                  <span>ส่วนที่ 4: การตรวจทางห้องปฏิบัติการและรังสีวิทยา</span>
                </h4>
                <span className="text-xs text-slate-500">CXR / AFB Smear / GeneXpert</span>
              </div>

              {/* Chest X-Ray */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h5 className="font-bold text-xs text-slate-800">ผลการตรวจภาพรังสีทรวงอก (Chest X-Ray):</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">ผลอ่าน CXR</label>
                    <select
                      value={formData.cxrResult}
                      onChange={e => setFormData({...formData, cxrResult: e.target.value as CXRResult})}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold"
                    >
                      <option value="Abnormal TB Suspect">Abnormal TB Suspect (สงสัยวัณโรค)</option>
                      <option value="Abnormal Non-TB">Abnormal Non-TB (ผิดปกติอื่นๆ)</option>
                      <option value="Normal">Normal (ปกติ)</option>
                      <option value="Pending">Pending (รอผล)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">ลักษณะรอยโรคในปอด</label>
                    <select
                      value={formData.cxrLesionType}
                      onChange={e => setFormData({...formData, cxrLesionType: e.target.value as any})}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold"
                    >
                      <option value="Cavity (มีโพรงแผล)">Cavity (มีโพรงแผล)</option>
                      <option value="Infiltration">Infiltration (มีฝ้าขาว)</option>
                      <option value="Effusion">Pleural Effusion (น้ำในเยื่อหุ้มปอด)</option>
                      <option value="Miliary">Miliary Pattern</option>
                      <option value="Normal">Normal</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">วันที่ตรวจ CXR</label>
                    <input
                      type="date"
                      value={formData.cxrDate}
                      onChange={e => setFormData({...formData, cxrDate: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Sputum AFB */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h5 className="font-bold text-xs text-slate-800">ผลการตรวจเสมหะหาเชื้อ AFB (Baseline Smear):</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">เสมหะ ครั้งที่ 1 (Spot 1)</label>
                    <select
                      value={formData.afbSmear1}
                      onChange={e => setFormData({...formData, afbSmear1: e.target.value as SputumResultStatus})}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold"
                    >
                      <option value="Negative">Negative</option>
                      <option value="Scanty">Scanty (1-9 AFB/100 HPF)</option>
                      <option value="1+">1+ (10-99 AFB/100 HPF)</option>
                      <option value="2+">2+ (1-10 AFB/HPF)</option>
                      <option value="3+">3+ (&gt;10 AFB/HPF)</option>
                      <option value="Pending">Pending</option>
                      <option value="Not Done">Not Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">เสมหะ ครั้งที่ 2 (Morning)</label>
                    <select
                      value={formData.afbSmear2}
                      onChange={e => setFormData({...formData, afbSmear2: e.target.value as SputumResultStatus})}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold"
                    >
                      <option value="Negative">Negative</option>
                      <option value="Scanty">Scanty</option>
                      <option value="1+">1+</option>
                      <option value="2+">2+</option>
                      <option value="3+">3+</option>
                      <option value="Pending">Pending</option>
                      <option value="Not Done">Not Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">เสมหะ ครั้งที่ 3 (Spot 2)</label>
                    <select
                      value={formData.afbSmear3}
                      onChange={e => setFormData({...formData, afbSmear3: e.target.value as SputumResultStatus})}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold"
                    >
                      <option value="Negative">Negative</option>
                      <option value="Scanty">Scanty</option>
                      <option value="1+">1+</option>
                      <option value="2+">2+</option>
                      <option value="3+">3+</option>
                      <option value="Pending">Pending</option>
                      <option value="Not Done">Not Done</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* GeneXpert */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h5 className="font-bold text-xs text-slate-800">ผลการตรวจสารพันธุกรรม (GeneXpert MTB/RIF):</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">ผล GeneXpert</label>
                    <select
                      value={formData.geneXpertResult}
                      onChange={e => setFormData({...formData, geneXpertResult: e.target.value as GeneXpertResult})}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800"
                    >
                      <option value="MTB detected, Rif Resistance not detected">MTB detected, Rif Resistance not detected (พบเชื้อ ไม่ดื้อยา R)</option>
                      <option value="MTB not detected">MTB not detected (ไม่พบเชื้อ)</option>
                      <option value="MTB detected, Rif Resistance detected">MTB detected, Rif Resistance detected (พบเชื้อ ดื้อยา R!)</option>
                      <option value="MTB detected, Rif Resistance indeterminate">MTB detected, Rif Resistance indeterminate</option>
                      <option value="Not Done">Not Done (ไม่ได้ส่งตรวจ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">วันที่ส่งตรวจ GeneXpert</label>
                    <input
                      type="date"
                      value={formData.geneXpertDate || ''}
                      onChange={e => setFormData({...formData, geneXpertDate: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: การวินิจฉัยและการรักษา */}
          {activeSection === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <span>ส่วนที่ 5: การวินิจฉัยและการรักษา (Diagnosis & Treatment)</span>
                </h4>
                <span className="text-xs text-slate-500">Category / สูตรยา / พี่เลี้ยง DOTS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ประเภทผู้ป่วย (Category)</label>
                  <select
                    value={formData.patientCategory}
                    onChange={e => setFormData({...formData, patientCategory: e.target.value as PatientCategory})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold"
                  >
                    <option value="New">ผู้ป่วยใหม่ (New)</option>
                    <option value="Relapse">กลับเป็นซ้ำ (Relapse)</option>
                    <option value="Treatment after failure">รักษาซ้ำหลังล้มเหลว (Failure)</option>
                    <option value="Treatment after default">รักษาซ้ำหลังขาดยา (Default)</option>
                    <option value="Transfer in">รับโอนมา (Transfer in)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ชนิดวัณโรค (TB Type)</label>
                  <select
                    value={formData.tbType}
                    onChange={e => setFormData({...formData, tbType: e.target.value as TBType})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Pulmonary Smear+">วัณโรคปอด เสมหะพบเชื้อ (Smear+)</option>
                    <option value="Pulmonary Smear-">วัณโรคปอด เสมหะไม่พบเชื้อ (Smear-)</option>
                    <option value="Extra-Pulmonary">วัณโรคต่อมน้ำเหลือง/นอกปอด (Extra-pulmonary)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">สูตรยาที่ได้รับ (Regimen)</label>
                  <input
                    type="text"
                    value={formData.treatmentRegimen}
                    onChange={e => setFormData({...formData, treatmentRegimen: e.target.value})}
                    placeholder="เช่น 2HRZE/4HR"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">สถานพยาบาลที่ให้การรักษา</label>
                  <input
                    type="text"
                    value={formData.treatingFacility}
                    onChange={e => setFormData({...formData, treatingFacility: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">รูปแบบการกำกับยา DOTS</label>
                  <select
                    value={formData.dotsSupervisorType}
                    onChange={e => setFormData({...formData, dotsSupervisorType: e.target.value as any})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="อสม.พี่เลี้ยง">อสม. พี่เลี้ยงกำกับการกินยา</option>
                    <option value="เจ้าหน้าที่สาธารณสุข">เจ้าหน้าที่สาธารณสุข / รพ.สต.</option>
                    <option value="สมาชิกครอบครัว">สมาชิกครอบครัว/ญาติ</option>
                    <option value="รับประทานเอง">ผู้ป่วยรับประทานเอง (Self-administered)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ชื่อ-เบอร์โทร ผู้กำกับยา (DOTS)</label>
                  <input
                    type="text"
                    value={formData.dotsSupervisorName}
                    onChange={e => setFormData({...formData, dotsSupervisorName: e.target.value})}
                    placeholder="ชื่อ อสม. หรือญาติพี่เลี้ยง"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: ผู้สัมผัสโรคร่วมบ้าน */}
          {activeSection === 6 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>ส่วนที่ 6: การค้นหาและติดตามผู้สัมผัสโรคร่วมบ้าน (Contact Tracing)</span>
                </h4>
                <span className="text-xs text-slate-500">จำนวนการคัดกรอง & ผลลัพธ์</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-slate-700 font-semibold mb-1">จำนวนผู้สัมผัสที่ค้นพบ (คน)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.contactsIdentified}
                    onChange={e => setFormData({...formData, contactsIdentified: parseInt(e.target.value) || 0})}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-slate-700 font-semibold mb-1">คัดกรองอาการแล้ว (คน)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.contactsScreened}
                    onChange={e => setFormData({...formData, contactsScreened: parseInt(e.target.value) || 0})}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-emerald-700"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-slate-700 font-semibold mb-1">ตรวจ CXR แล้ว (คน)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.contactsCxrDone}
                    onChange={e => setFormData({...formData, contactsCxrDone: parseInt(e.target.value) || 0})}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-slate-700 font-semibold mb-1">ตรวจเสมหะแล้ว (คน)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.contactsAfbDone}
                    onChange={e => setFormData({...formData, contactsAfbDone: parseInt(e.target.value) || 0})}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-slate-700 font-semibold mb-1">ได้รับยาป้องกัน TPT แล้ว (คน)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.contactsTptInitiated}
                    onChange={e => setFormData({...formData, contactsTptInitiated: parseInt(e.target.value) || 0})}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-teal-700"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-slate-700 font-semibold mb-1">พบเป็นวัณโรค Active TB (คน)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.contactsActiveTbFound}
                    onChange={e => setFormData({...formData, contactsActiveTbFound: parseInt(e.target.value) || 0})}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-red-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: สรุปและมาตรการควบคุมโรค */}
          {activeSection === 7 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>ส่วนที่ 7: สรุปผลการสอบสวน แหล่งแพร่โรค และมาตรการควบคุม</span>
                </h4>
                <span className="text-xs text-slate-500">Summary & Recommendation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">แหล่งแพร่เชื้อที่น่าสงสัย</label>
                  <select
                    value={formData.suspectedSource}
                    onChange={e => setFormData({...formData, suspectedSource: e.target.value as any})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold"
                  >
                    <option value="ในครอบครัว">ในครอบครัว (Household)</option>
                    <option value="ในชุมชน">ในชุมชน (Community)</option>
                    <option value="ในที่ทำงาน/โรงเรียน">ในที่ทำงาน / โรงเรียน</option>
                    <option value="ไม่ทราบแหล่งชัดเจน">ไม่ทราบแหล่งชัดเจน</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ระดับความเสี่ยงในการแพร่กระจาย</label>
                  <select
                    value={formData.transmissionRisk}
                    onChange={e => setFormData({...formData, transmissionRisk: e.target.value as any})}
                    className={`w-full border rounded-lg px-3 py-2 text-xs font-bold ${
                      formData.transmissionRisk.includes('สูง') ? 'bg-red-50 text-red-700 border-red-300' : 'border-slate-300'
                    }`}
                  >
                    <option value="สูง (High Risk)">สูง (High Risk - เสมหะบวก/มี Cavity)</option>
                    <option value="ปานกลาง (Moderate Risk)">ปานกลาง (Moderate Risk)</option>
                    <option value="ต่ำ (Low Risk)">ต่ำ (Low Risk - เสมหะลบ)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">สรุปผลการสอบสวนโรค</label>
                  <textarea
                    rows={3}
                    value={formData.investigationSummary}
                    onChange={e => setFormData({...formData, investigationSummary: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    placeholder="สรุปผลการประเมินทางระบาดวิทยา..."
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">มาตรการควบคุมโรคที่ได้ดำเนินการในพื้นที่</label>
                  <textarea
                    rows={3}
                    value={formData.controlMeasuresTaken}
                    onChange={e => setFormData({...formData, controlMeasuresTaken: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    placeholder="เช่น 1. ให้สุขศึกษา 2. คัดกรองผู้สัมผัส 3. ติดตั้งพี่เลี้ยง DOTS..."
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">สถานะแบบสอบสวน</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full sm:w-60 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="Complete">สอบสวนเสร็จสมบูรณ์ (Complete)</option>
                    <option value="Draft">ฉบับร่าง (Draft)</option>
                    <option value="Pending Follow-up">รอติดตามผลเพิ่มเติม (Pending)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {activeSection > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveSection(prev => prev - 1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  &larr; ส่วนก่อนหน้า
                </button>
              )}
              {activeSection < 7 && (
                <button
                  type="button"
                  onClick={() => setActiveSection(prev => prev + 1)}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-300 transition"
                >
                  ถัดไป (ส่วนที่ {activeSection + 1}) &rarr;
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium rounded-xl hover:bg-slate-100 transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกแบบสอบสวนโรค</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
