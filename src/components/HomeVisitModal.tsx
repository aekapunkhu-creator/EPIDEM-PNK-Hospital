import React, { useState, useEffect } from 'react';
import { 
  HomeVisitRecord, Patient, HouseholdContact, HomeVisitStatus, DOTSAdherenceRating, 
  VentilationRating, UserAccount, TBHomeVisitRoundType, TBHomeVisitPatientCategory,
  TBHomeVisitDiseaseSite, TBHomeVisitTreatmentPhase, TBHomeVisitDOTProviderType,
  TBHomeVisitDOTFormat, TBHomeVisitAdherenceGrade, TBHomeVisitOutcome,
  TBHomeVisitContactPerson, TBHomeVisit7DayDoseLog
} from '../types';
import { 
  Home, X, Save, Calendar, User, Phone, MapPin, Activity, 
  Pill, AlertTriangle, ShieldCheck, Heart, Stethoscope, 
  CheckCircle2, Compass, Map, Sparkles, FileText, Check, Plus, Trash2
} from 'lucide-react';
import { PHON_NA_KAEO_SUBDISTRICTS, getVillagesForSubdistrict } from '../data/mockData';
import { LocationPickerModal } from './LocationPickerModal';
import { openGoogleMapsNavigation } from '../utils/navigation';

interface HomeVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: HomeVisitRecord) => void;
  existingRecord?: HomeVisitRecord | null;
  patients: Patient[];
  contacts?: HouseholdContact[];
  currentUser?: UserAccount | null;
  initialPatientId?: string;
}

export const HomeVisitModal: React.FC<HomeVisitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingRecord,
  patients = [],
  contacts = [],
  currentUser,
  initialPatientId
}) => {
  const [activeTab, setActiveTab] = useState<'p1' | 'p2' | 'p3' | 'p4' | 'gps'>('p1');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || '');
  const [isMapPickerOpen, setIsMapPickerOpen] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<HomeVisitRecord>({
    id: `HV-${Date.now()}`,
    patientId: '',
    patientHN: '',
    patientName: '',
    subdistrict: 'ตำบลบ้านโพน',
    village: 'หมู่ที่ 1 บ้านอ้อมแก้วใหญ่',
    houseNo: '',
    visitRound: 1,
    visitRoundType: 'ครั้งที่ 1',
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: new Date().toTimeString().slice(0, 5),
    serviceUnit: currentUser?.hospitalName || 'โรงพยาบาลโพนนาแก้ว',
    visitorName: currentUser?.fullName || 'พยาบาลวิชาชีพ รพ.สต.',
    coVisitorName: '',
    visitorRole: (currentUser?.role === 'อสม.' ? 'อสม. พี่เลี้ยง' : 'พยาบาลวิชาชีพ'),
    visitorUnit: currentUser?.hospitalName || 'กลุ่มงานบริการด้านปฐมภูมิและองค์รวม โรงพยาบาลโพนนาแก้ว',
    visitorPhone: currentUser?.phone || '',

    // 1. ข้อมูลผู้ป่วย
    idCard: '',
    age: 45,
    gender: 'ชาย',
    phone: '',
    primaryCaregiver: '',
    caregiverPhone: '',

    // 2. ข้อมูลการรักษาวัณโรค
    patientCategoryOfficial: 'ผู้ป่วยใหม่',
    patientCategoryOther: '',
    diseaseSite: 'วัณโรคปอด',
    extrapulmonarySite: '',
    treatmentStartDate: new Date().toISOString().split('T')[0],
    regimen: '2HRZE/4HR',
    treatmentPhase: 'ระยะเข้มข้น',
    dotSupervisorTypeOfficial: 'อสม.',
    dotSupervisorOther: '',

    // 3. การประเมินการกินยาและอาการ
    medicationPlanAdherence: 'ครบทุกวัน',
    missedDaysCount: 0,
    missedReason: '',
    evaluatedSymptoms: {
      cough: false,
      productiveCough: false,
      hemoptysis: false,
      fever: false,
      nightSweats: false,
      weightLoss: false,
      lossOfAppetite: false,
      dyspnea: false,
      noAbnormalSymptoms: true,
    },
    adverseDrugReactionsOfficial: {
      nauseaVomiting: false,
      itchingRash: false,
      jaundice: false,
      peripheralNeuropathy: false,
      blurredVision: false,
      tinnitusHearingLoss: false,
      otherAdr: '',
    },
    clinicalActionTaken: 'ให้คำแนะนำการรับประทานยาและสังเกตอาการอย่างใกล้ชิด',
    nextTestOrAppointment: 'นัดตรวจเสมหะและรับยาต่อเนื่องครั้งถัดไป',

    // 4. การประเมินบ้านและสิ่งแวดล้อม
    housingCondition: 'โปร่ง อากาศถ่ายเทดี',
    bedroomCondition: 'แยกห้อง',
    bedroomSharedCount: 1,
    windowVentilation: 'สม่ำเสมอ',
    maskWearingComplianceOfficial: 'สม่ำเสมอ',
    sputumDisposalOfficial: 'ถูกสุขลักษณะ',
    environmentNotes: 'ห้องนอนมีหน้าต่างเปิดรับแสงแดดและลมถ่ายเทสะดวก',

    // 5. การคัดกรองผู้สัมผัสร่วมบ้าน
    householdMembersTotal: 3,
    childrenUnder5Count: 0,
    elderlyCount: 0,
    chronicImmuneDeficientCount: 0,
    contactsList: [
      { name: '', age: '', relationship: 'คู่สมรส', hasSuspiciousSymptoms: false, isScreened: true },
      { name: '', age: '', relationship: 'บุตร', hasSuspiciousSymptoms: false, isScreened: true },
    ],

    // 6. การให้คำแนะนำ
    adviceChecklist: {
      takeMedsRegularly: true,
      watchSideEffects: true,
      coverCoughWearMask: true,
      openWindows: true,
      sputumDisposalProperly: true,
      screenContacts: true,
      nutritionAndRest: true,
      otherAdvice: '',
    },

    // 7. ปัญหา อุปสรรค และแผนช่วยเหลือ
    problemsFound: 'ไม่พบปัญหาอุปสรรค ผู้ป่วยรับประทานยาตรงเวลา',
    assistancePlan: 'อสม. พี่เลี้ยงตรวจเยี่ยมกำกับการกินยาทุกวัน',
    nextFollowUpDate: '',

    // 8. การกำกับการกินยา (DOT)
    dotProviderType: 'อสม.',
    dotProviderDetails: '',
    dotFormat: 'พบเห็นการกินยาทุกวัน (Daily DOT)',
    dotFormatOther: '',
    past7DaysDoseLogs: [
      { day: 'จันทร์', takenStatus: 'ครบ', supervisorName: 'อสม. พี่เลี้ยง', notes: '' },
      { day: 'อังคาร', takenStatus: 'ครบ', supervisorName: 'อสม. พี่เลี้ยง', notes: '' },
      { day: 'พุธ', takenStatus: 'ครบ', supervisorName: 'อสม. พี่เลี้ยง', notes: '' },
      { day: 'พฤหัสบดี', takenStatus: 'ครบ', supervisorName: 'อสม. พี่เลี้ยง', notes: '' },
      { day: 'ศุกร์', takenStatus: 'ครบ', supervisorName: 'อสม. พี่เลี้ยง', notes: '' },
      { day: 'เสาร์', takenStatus: 'ครบ', supervisorName: 'อสม. พี่เลี้ยง', notes: '' },
      { day: 'อาทิตย์', takenStatus: 'ครบ', supervisorName: 'อสม. พี่เลี้ยง', notes: '' },
    ],
    adherenceEvaluation: 'ดีมาก (รับประทานยาครบ ≥95%)',
    adherenceMissedReasons: {
      forgot: false,
      travelingAway: false,
      adverseReaction: false,
      outOfMedication: false,
      misunderstanding: false,
      refusal: false,
      substanceAlcohol: false,
      otherReason: '',
    },
    correctiveActions: {
      educateAdherenceImportance: true,
      coordinateSupervisor: true,
      scheduleFollowUpDays: 7,
      notifyDoctorNurse: false,
      referMultidisciplinary: false,
      otherAction: '',
    },

    // ผลการประเมินครั้งนี้ & ลายมือชื่อ
    overallEvaluationOutcome: 'รับประทานยาต่อเนื่องดี',
    dotSupervisorSignName: '',
    visitorSignName: currentUser?.fullName || '',
    patientOrCaregiverSignName: '',

    // Existing Schema Compatibility
    objectives: {
      dotsFollowUp: true,
      adrScreening: true,
      sputumFollowUp: true,
      contactScreening: false,
      environmentCheck: true,
      healthEducation: true,
      psychosocialSupport: true,
      missedAppointment: false,
    },
    vitals: {
      temperature: 36.6,
      bloodPressure: '120/80',
      pulseRate: 78,
      respiratoryRate: 18,
      oxygenSat: 98,
      bodyWeight: 55,
      weightChange: 'คงที่',
    },
    symptoms: {
      cough: 'ไม่มี',
      sputumCharacteristics: 'ไม่มีเสมหะ',
      fever: false,
      nightSweats: false,
      dyspnea: false,
      chestPain: false,
      fatigue: false,
      appetite: 'ปกติ/เจริญอาหาร',
    },
    dotsSupervisor: {
      type: 'อสม. พี่เลี้ยง',
      name: '',
      isSupervisingDaily: true,
    },
    adherence: 'รับประทานยาทุกวัน สม่ำเสมอ 100%',
    pillCountStatus: 'จำนวนเม็ดยาคงเหลือถูกต้องตรงรอบ',
    missedDosesLast2Weeks: 0,
    sideEffects: {
      nauseaVomiting: false,
      orangeUrineAcknowledged: true,
      jointPain: false,
      numbness: false,
      itchingRash: false,
      jaundice: false,
      visionBlur: false,
      tinnitusDizziness: false,
      feverDrugReaction: false,
      otherSideEffects: '',
    },
    environment: {
      ventilation: 'ดีมาก (โปร่ง แดดส่อง ลมถ่ายเทดี)',
      bedroomType: 'แยกห้องนอนเดี่ยว',
      sunlightExposure: 'แดดส่องถึงห้องพัก',
      sputumDisposalMethod: 'กระโถน/ถุงทิ้งมิดชิดผสมน้ำยาฆ่าเชื้อ',
      maskWearingCompliance: 'สวมหน้ากากสม่ำเสมอเมื่อมีคนอยู่ใกล้',
    },
    psychosocial: {
      familySupport: 'ครอบครัวดูแลและให้กำลังใจดีมาก',
      financialDifficulty: false,
      foodAidNeeded: false,
      stressAnxietyLevel: 'ปกติ',
    },
    sputumFollowUpDone: false,
    sputumResultNotes: '',
    nextAppointmentDate: '',
    nextVisitDueDate: '',
    identifiedProblems: [],
    interventionsProvided: [
      'ให้คำแนะนำการรับประทานยาต่อเนื่องตรงเวลาทุกวัน',
      'สอนการเปิดหน้าต่างระบายอากาศและรับแสงแดดฆ่าเชื้อ'
    ],
    recommendationsAndNotes: 'ผู้ป่วยให้ความร่วมมือดีมาก ไม่มีอาการข้างเคียงรุนแรง',
    referralRequired: false,
    referralReason: '',
    status: 'เยี่ยมสำเร็จ (ปกติ)',
    visitLat: 17.085,
    visitLng: 104.295,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Load Existing or Selected Patient
  useEffect(() => {
    if (existingRecord) {
      setFormData({ ...existingRecord });
      setSelectedPatientId(existingRecord.patientId);
    } else if (initialPatientId) {
      const p = patients.find(pt => pt.id === initialPatientId);
      if (p) {
        fillPatientData(p);
      }
    } else if (patients.length > 0 && !selectedPatientId) {
      const p = patients[0];
      fillPatientData(p);
    }
  }, [existingRecord, initialPatientId, isOpen]);

  const fillPatientData = (p: Patient) => {
    setSelectedPatientId(p.id);
    
    // Auto-calculate contacts list from patient's registered contacts
    const patientContacts = contacts.filter(c => c.indexPatientId === p.id || c.indexPatientHN === p.hn);
    const mappedContacts: TBHomeVisitContactPerson[] = patientContacts.length > 0
      ? patientContacts.map(c => ({
          name: `${c.prefix || ''}${c.firstName} ${c.lastName}`,
          age: c.age || '',
          relationship: c.relationship || 'ผู้สัมผัสร่วมบ้าน',
          hasSuspiciousSymptoms: Boolean(c.symptoms?.coughOver2Weeks || c.symptoms?.fever || c.symptoms?.haemoptysis),
          isScreened: c.cxrResult !== 'Pending' && c.cxrResult !== 'Not Done'
        }))
      : [
          { name: '', age: '', relationship: 'คู่สมรส/ผู้ดูแล', hasSuspiciousSymptoms: false, isScreened: true }
        ];

    setFormData(prev => ({
      ...prev,
      patientId: p.id,
      patientHN: p.hn,
      patientName: `${p.prefix}${p.firstName} ${p.lastName}`,
      idCard: p.idCard || prev.idCard,
      age: p.age || prev.age,
      gender: (p.gender === 'หญิง' ? 'หญิง' : 'ชาย'),
      phone: p.phone || prev.phone,
      subdistrict: p.subdistrict || prev.subdistrict,
      village: p.village || prev.village,
      houseNo: p.houseNo || prev.houseNo,
      primaryCaregiver: p.dotsSupervisorName || prev.primaryCaregiver,
      caregiverPhone: p.dotsSupervisorPhone || prev.caregiverPhone,
      diseaseSite: (p.tbType?.includes('Extra-Pulmonary') ? 'วัณโรคนอกปอด' : 'วัณโรคปอด'),
      extrapulmonarySite: (p.tbType?.includes('Extra-Pulmonary') ? p.tbType : ''),
      regimen: p.regimen || '2HRZE/4HR',
      treatmentStartDate: p.treatmentStartDate || prev.treatmentStartDate,
      dotSupervisorTypeOfficial: (p.dotsSupervisorRole?.includes('อสม') ? 'อสม.' : (p.dotsSupervisorRole?.includes('จนท') ? 'บุคลากรสาธารณสุข' : 'ญาติ')),
      dotSupervisorSignName: p.dotsSupervisorName || '',
      patientOrCaregiverSignName: `${p.prefix}${p.firstName} ${p.lastName}`,
      householdMembersTotal: patientContacts.length > 0 ? patientContacts.length + 1 : 3,
      contactsList: mappedContacts,
      dotsSupervisor: {
        type: p.dotsSupervisorRole === 'อสม. พี่เลี้ยง' ? 'อสม. พี่เลี้ยง' : (p.dotsSupervisorRole === 'เจ้าหน้าที่ รพ.สต.' ? 'เจ้าหน้าที่ รพ.สต.' : 'ญาติผู้ดูแล'),
        name: p.dotsSupervisorName || '',
        isSupervisingDaily: true,
      },
      nextAppointmentDate: p.nextAppointmentDate || prev.nextAppointmentDate,
      visitLat: p.lat || prev.visitLat,
      visitLng: p.lng || prev.visitLng,
    }));
  };

  const handlePatientSelectChange = (pId: string) => {
    setSelectedPatientId(pId);
    const p = patients.find(pt => pt.id === pId);
    if (p) {
      fillPatientData(p);
    }
  };

  const handleCurrentGPS = () => {
    if (!navigator.geolocation) {
      setGpsNotice('เบราว์เซอร์ไม่รองรับการระบุพิกัด GPS');
      return;
    }
    setGpsLoading(true);
    setGpsNotice(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = Number(pos.coords.latitude.toFixed(6));
        const uLng = Number(pos.coords.longitude.toFixed(6));
        setFormData(prev => ({
          ...prev,
          visitLat: uLat,
          visitLng: uLng
        }));
        setGpsLoading(false);
        setGpsNotice(`📍 ตรวจจับพิกัด GPS จุดเยี่ยมบ้านสำเร็จ: Lat ${uLat}, Lng ${uLng}`);
        setTimeout(() => setGpsNotice(null), 4000);
      },
      (err) => {
        setGpsLoading(false);
        setGpsNotice(`ไม่สามารถตรวจจับพิกัด GPS ได้ (${err.message})`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Contacts Helpers
  const addContactRow = () => {
    setFormData(prev => ({
      ...prev,
      contactsList: [
        ...(prev.contactsList || []),
        { name: '', age: '', relationship: '', hasSuspiciousSymptoms: false, isScreened: false }
      ]
    }));
  };

  const removeContactRow = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      contactsList: (prev.contactsList || []).filter((_, i) => i !== idx)
    }));
  };

  const updateContactRow = (idx: number, field: keyof TBHomeVisitContactPerson, value: any) => {
    setFormData(prev => {
      const list = [...(prev.contactsList || [])];
      list[idx] = { ...list[idx], [field]: value };
      return { ...prev, contactsList: list };
    });
  };

  // 7-day DOT log helper
  const update7DayLog = (idx: number, field: keyof TBHomeVisit7DayDoseLog, value: any) => {
    setFormData(prev => {
      const logs = [...(prev.past7DaysDoseLogs || [])];
      logs[idx] = { ...logs[idx], [field]: value };
      
      // Calculate missed count
      const missedCount = logs.filter(l => l.takenStatus === 'ขาด').length;
      let adhGrade: TBHomeVisitAdherenceGrade = 'ดีมาก (รับประทานยาครบ ≥95%)';
      let adhRating: DOTSAdherenceRating = 'รับประทานยาทุกวัน สม่ำเสมอ 100%';
      let planAdh: 'ครบทุกวัน' | 'ขาดยา' = 'ครบทุกวัน';
      let evalOutcome: TBHomeVisitOutcome = 'รับประทานยาต่อเนื่องดี';
      let status: HomeVisitStatus = 'เยี่ยมสำเร็จ (ปกติ)';

      if (missedCount === 0) {
        adhGrade = 'ดีมาก (รับประทานยาครบ ≥95%)';
        adhRating = 'รับประทานยาทุกวัน สม่ำเสมอ 100%';
        planAdh = 'ครบทุกวัน';
        evalOutcome = 'รับประทานยาต่อเนื่องดี';
        status = 'เยี่ยมสำเร็จ (ปกติ)';
      } else if (missedCount <= 1) {
        adhGrade = 'ดี (80–94%)';
        adhRating = 'ลืมกินยา 1-2 วัน/สัปดาห์';
        planAdh = 'ขาดยา';
        evalOutcome = 'มีความเสี่ยงต่อการขาดยา';
        status = 'พบปัญหา/ต้องติดตามใกล้ชิด';
      } else if (missedCount <= 3) {
        adhGrade = 'ปานกลาง (50–79%)';
        adhRating = 'ลืมกินยา > 3 วัน/สัปดาห์ (เสี่ยงขาดยา)';
        planAdh = 'ขาดยา';
        evalOutcome = 'ขาดยา ต้องติดตามอย่างใกล้ชิด';
        status = 'พบปัญหา/ต้องติดตามใกล้ชิด';
      } else {
        adhGrade = 'ไม่ดี (<50%)';
        adhRating = 'หยุดยาเอง / ปฏิเสธยา';
        planAdh = 'ขาดยา';
        evalOutcome = 'สงสัย Lost to Follow-up (LTFU)';
        status = 'ส่งต่อแพทย์/รพ. (Referral)';
      }

      return {
        ...prev,
        past7DaysDoseLogs: logs,
        missedDaysCount: missedCount,
        missedDosesLast2Weeks: missedCount,
        adherenceEvaluation: adhGrade,
        adherence: adhRating,
        medicationPlanAdherence: planAdh,
        overallEvaluationOutcome: evalOutcome,
        status: status
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName.trim()) {
      alert('กรุณาระบุชื่อผู้ป่วย หรือเลือกผู้ป่วยจากทะเบียน');
      return;
    }
    const finalData: HomeVisitRecord = {
      ...formData,
      updatedAt: new Date().toISOString(),
    };
    onSave(finalData);
    onClose();
  };

  if (!isOpen) return null;

  const currentVillages = getVillagesForSubdistrict(formData.subdistrict);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-scale-up">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  {existingRecord ? 'แก้ไขแบบฟอร์มเยี่ยมบ้านผู้ป่วยวัณโรค' : 'บันทึกแบบฟอร์มเยี่ยมบ้านผู้ป่วยวัณโรค (TB Home Visit Form)'}
                </h3>
                <span className="bg-emerald-500/30 text-emerald-200 text-[11px] px-2 py-0.5 rounded-full font-mono border border-emerald-400/30">
                  รพ.โพนนาแก้ว 4 หน้า
                </span>
              </div>
              <p className="text-xs text-emerald-200/90">
                กลุ่มงานบริการด้านปฐมภูมิและองค์รวม โรงพยาบาลโพนนาแก้ว
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Matching 4-page PDF layout) */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('p1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'p1' ? 'bg-emerald-700 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>หน้า 1: ข้อมูลผู้ป่วย & อาการ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('p2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'p2' ? 'bg-emerald-700 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>หน้า 2: สิ่งแวดล้อม & ผู้สัมผัส</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('p3')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'p3' ? 'bg-emerald-700 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>หน้า 3: การกำกับยา DOTS 7 วัน</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('p4')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'p4' ? 'bg-emerald-700 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>หน้า 4: ผลการประเมิน & ลายมือชื่อ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gps')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ml-auto ${
              activeTab === 'gps' ? 'bg-sky-700 text-white shadow-sm' : 'bg-white text-sky-800 hover:bg-sky-50 border border-sky-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>พิกัด GPS & นำทาง</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-800 text-xs flex-1">
          
          {/* Quick Patient Selector Banner */}
          {patients.length > 0 && (
            <div className="bg-emerald-50/90 border border-emerald-200 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-950 text-xs block">เลือกผู้ป่วยจากทะเบียนในระบบ:</span>
                  <span className="text-[11px] text-emerald-800">ระบบจะดึง HN, เลขบัตร, ที่อยู่, สูตรยา, ผู้สัมผัส และผู้กำกับยา DOTS ให้อัตโนมัติ</span>
                </div>
              </div>
              <select
                value={selectedPatientId}
                onChange={(e) => handlePatientSelectChange(e.target.value)}
                className="w-full sm:w-auto min-w-[280px] p-2 rounded-lg border border-emerald-300 bg-white font-semibold text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-sm"
              >
                <option value="">-- กรุณาเลือกผู้ป่วย --</option>
                {(patients || []).map(p => (
                  <option key={p.id} value={p.id}>
                    HN: {p.hn} - {p.prefix}{p.firstName} {p.lastName} ({p.subdistrict} {p.village}) [{p.status}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: หน้า 1 (ข้อมูลผู้ป่วย, ข้อมูลการรักษา, การประเมินยาและอาการ) */}
          {/* ============================================================== */}
          {activeTab === 'p1' && (
            <div className="space-y-6">
              
              {/* Header Info Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>ข้อมูลหน่วยบริการและการเยี่ยม</span>
                  <span className="text-[11px] font-mono text-slate-500">รหัสการเยี่ยม: {formData.id}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">หน่วยบริการ</label>
                    <input
                      type="text"
                      value={formData.serviceUnit || 'โรงพยาบาลโพนนาแก้ว'}
                      onChange={e => setFormData({ ...formData, serviceUnit: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">วันที่เยี่ยมบ้าน *</label>
                    <input
                      type="date"
                      required
                      value={formData.visitDate}
                      onChange={e => setFormData({ ...formData, visitDate: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">เวลาเยี่ยมบ้าน</label>
                    <input
                      type="time"
                      value={formData.visitTime || ''}
                      onChange={e => setFormData({ ...formData, visitTime: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ครั้งที่เยี่ยม</label>
                    <select
                      value={formData.visitRoundType || 'ครั้งที่ 1'}
                      onChange={e => {
                        const val = e.target.value as TBHomeVisitRoundType;
                        setFormData({ 
                          ...formData, 
                          visitRoundType: val,
                          visitRound: val === 'ครั้งที่ 1' ? 1 : (val === 'ครั้งที่ 2' ? 2 : 3)
                        });
                      }}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-emerald-800"
                    >
                      <option value="ครั้งที่ 1">ครั้งที่ 1</option>
                      <option value="ครั้งที่ 2">ครั้งที่ 2</option>
                      <option value="ติดตามต่อเนื่อง">ติดตามต่อเนื่อง</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ผู้เยี่ยมบ้าน (ชื่อ-สกุล) *</label>
                    <input
                      type="text"
                      required
                      value={formData.visitorName}
                      onChange={e => setFormData({ ...formData, visitorName: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ผู้ร่วมเยี่ยมบ้าน</label>
                    <input
                      type="text"
                      value={formData.coVisitorName || ''}
                      onChange={e => setFormData({ ...formData, coVisitorName: e.target.value })}
                      placeholder="เช่น อสม.ประจำหมู่บ้าน / จนท.รพ.สต."
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 1. ข้อมูลผู้ป่วย */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>1. ข้อมูลผู้ป่วย</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">เลข HN *</label>
                    <input
                      type="text"
                      required
                      value={formData.patientHN}
                      onChange={e => setFormData({ ...formData, patientHN: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">เลขบัตรประชาชน</label>
                    <input
                      type="text"
                      value={formData.idCard || ''}
                      onChange={e => setFormData({ ...formData, idCard: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">ชื่อ–สกุล *</label>
                    <input
                      type="text"
                      required
                      value={formData.patientName}
                      onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">อายุ (ปี)</label>
                    <input
                      type="number"
                      value={formData.age || ''}
                      onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">เพศ</label>
                    <select
                      value={formData.gender || 'ชาย'}
                      onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="ชาย">ชาย</option>
                      <option value="หญิง">หญิง</option>
                      <option value="อื่น ๆ">อื่น ๆ</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">เบอร์โทรศัพท์ผู้ป่วย</label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ตำบล</label>
                    <select
                      value={formData.subdistrict}
                      onChange={e => setFormData({ 
                        ...formData, 
                        subdistrict: e.target.value,
                        village: getVillagesForSubdistrict(e.target.value)[0] || ''
                      })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    >
                      {PHON_NA_KAEO_SUBDISTRICTS.map(s => (
                        <option key={s.code} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">หมู่บ้าน</label>
                    <select
                      value={formData.village}
                      onChange={e => setFormData({ ...formData, village: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    >
                      {currentVillages.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">บ้านเลขที่</label>
                    <input
                      type="text"
                      value={formData.houseNo}
                      onChange={e => setFormData({ ...formData, houseNo: e.target.value })}
                      placeholder="เช่น 45/2"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ผู้ดูแลหลัก / ความสัมพันธ์</label>
                    <input
                      type="text"
                      value={formData.primaryCaregiver || ''}
                      onChange={e => setFormData({ ...formData, primaryCaregiver: e.target.value })}
                      placeholder="เช่น นางสมศรี (ภรรยา)"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">เบอร์โทรศัพท์ผู้ดูแลหลัก</label>
                    <input
                      type="text"
                      value={formData.caregiverPhone || ''}
                      onChange={e => setFormData({ ...formData, caregiverPhone: e.target.value })}
                      placeholder="เช่น 081-234-5678"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 2. ข้อมูลการรักษาวัณโรค */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <span>2. ข้อมูลการรักษาวัณโรค</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ประเภทผู้ป่วย</label>
                    <select
                      value={formData.patientCategoryOfficial || 'ผู้ป่วยใหม่'}
                      onChange={e => setFormData({ ...formData, patientCategoryOfficial: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="ผู้ป่วยใหม่">ผู้ป่วยใหม่</option>
                      <option value="รักษาซ้ำ">รักษาซ้ำ</option>
                      <option value="วัณโรคดื้อยา">วัณโรคดื้อยา</option>
                      <option value="อื่น ๆ">อื่น ๆ</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ตำแหน่งโรค</label>
                    <select
                      value={formData.diseaseSite || 'วัณโรคปอด'}
                      onChange={e => setFormData({ ...formData, diseaseSite: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium"
                    >
                      <option value="วัณโรคปอด">วัณโรคปอด</option>
                      <option value="วัณโรคนอกปอด">วัณโรคนอกปอด</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">กรณีวัณโรคนอกปอด (ระบุตำแหน่ง)</label>
                    <input
                      type="text"
                      value={formData.extrapulmonarySite || ''}
                      onChange={e => setFormData({ ...formData, extrapulmonarySite: e.target.value })}
                      placeholder="เช่น ต่อมน้ำเหลือง, เยื่อหุ้มปอด"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">วันที่เริ่มรักษา</label>
                    <input
                      type="date"
                      value={formData.treatmentStartDate || ''}
                      onChange={e => setFormData({ ...formData, treatmentStartDate: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">สูตรยาต้านวัณโรค</label>
                    <input
                      type="text"
                      value={formData.regimen || '2HRZE/4HR'}
                      onChange={e => setFormData({ ...formData, regimen: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ระยะการรักษา</label>
                    <select
                      value={formData.treatmentPhase || 'ระยะเข้มข้น'}
                      onChange={e => setFormData({ ...formData, treatmentPhase: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold"
                    >
                      <option value="ระยะเข้มข้น">ระยะเข้มข้น (Intensive Phase)</option>
                      <option value="ระยะต่อเนื่อง">ระยะต่อเนื่อง (Continuation Phase)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ผู้กำกับการกินยา (DOT)</label>
                    <select
                      value={formData.dotSupervisorTypeOfficial || 'อสม.'}
                      onChange={e => setFormData({ ...formData, dotSupervisorTypeOfficial: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="อสม.">อสม.</option>
                      <option value="ญาติ">ญาติ</option>
                      <option value="บุคลากรสาธารณสุข">บุคลากรสาธารณสุข / เจ้าหน้าที่</option>
                      <option value="อื่น ๆ">อื่น ๆ</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ชื่อผู้กำกับการกินยา</label>
                    <input
                      type="text"
                      value={formData.dotSupervisorSignName || formData.dotsSupervisor?.name || ''}
                      onChange={e => setFormData({ 
                        ...formData, 
                        dotSupervisorSignName: e.target.value,
                        dotsSupervisor: { ...formData.dotsSupervisor, name: e.target.value }
                      })}
                      placeholder="ระบุชื่อ-สกุล อสม./ญาติ"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. การประเมินการกินยาและอาการ */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>3. การประเมินการกินยาและอาการ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">การกินยาตามแผน</label>
                    <select
                      value={formData.medicationPlanAdherence || 'ครบทุกวัน'}
                      onChange={e => setFormData({ ...formData, medicationPlanAdherence: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-emerald-800"
                    >
                      <option value="ครบทุกวัน">ครบทุกวัน</option>
                      <option value="ขาดยา">ขาดยา</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">จำนวนวันที่ขาดยา (วัน)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.missedDaysCount || 0}
                      onChange={e => setFormData({ ...formData, missedDaysCount: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">สาเหตุการขาดยา (ถ้ามี)</label>
                    <input
                      type="text"
                      value={formData.missedReason || ''}
                      onChange={e => setFormData({ ...formData, missedReason: e.target.value })}
                      placeholder="เช่น เดินทางไปต่างอำเภอ, ลืม"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {/* อาการปัจจุบัน Checklist */}
                <div className="pt-2">
                  <label className="font-semibold text-slate-900 block mb-1.5">อาการปัจจุบัน (เลือกที่พบ):</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-lg border border-slate-200">
                    {[
                      { key: 'cough', label: 'ไอ' },
                      { key: 'productiveCough', label: 'ไอมีเสมหะ' },
                      { key: 'hemoptysis', label: 'ไอเป็นเลือด' },
                      { key: 'fever', label: 'ไข้' },
                      { key: 'nightSweats', label: 'เหงื่อออกกลางคืน' },
                      { key: 'weightLoss', label: 'น้ำหนักลด' },
                      { key: 'lossOfAppetite', label: 'เบื่ออาหาร' },
                      { key: 'dyspnea', label: 'เหนื่อยหอบ' },
                      { key: 'noAbnormalSymptoms', label: 'ไม่มีอาการผิดปกติ' },
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={Boolean((formData.evaluatedSymptoms as any)?.[item.key])}
                          onChange={e => {
                            const isChecked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              evaluatedSymptoms: {
                                ...(prev.evaluatedSymptoms as any),
                                [item.key]: isChecked,
                                ...(item.key === 'noAbnormalSymptoms' && isChecked ? {
                                  cough: false, productiveCough: false, hemoptysis: false,
                                  fever: false, nightSweats: false, weightLoss: false,
                                  lossOfAppetite: false, dyspnea: false
                                } : (item.key !== 'noAbnormalSymptoms' && isChecked ? {
                                  noAbnormalSymptoms: false
                                } : {}))
                              }
                            }));
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-medium">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* อาการไม่พึงประสงค์จากยา Checklist */}
                <div className="pt-2">
                  <label className="font-semibold text-slate-900 block mb-1.5">อาการไม่พึงประสงค์จากยาต้านวัณโรค (ADR):</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white p-3 rounded-lg border border-slate-200">
                    {[
                      { key: 'nauseaVomiting', label: 'คลื่นไส้/อาเจียน' },
                      { key: 'itchingRash', label: 'ผื่นคันตามผิวหนัง' },
                      { key: 'jaundice', label: 'ตัวเหลืองตาเหลือง (🚨 Red Flag)' },
                      { key: 'peripheralNeuropathy', label: 'ชาปลายมือปลายเท้า' },
                      { key: 'blurredVision', label: 'ตามัว/มองเห็นผิดปกติ (🚨 Red Flag)' },
                      { key: 'tinnitusHearingLoss', label: 'หูอื้อ/การได้ยินลดลง' },
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={Boolean((formData.adverseDrugReactionsOfficial as any)?.[item.key])}
                          onChange={e => {
                            setFormData(prev => ({
                              ...prev,
                              adverseDrugReactionsOfficial: {
                                ...(prev.adverseDrugReactionsOfficial as any),
                                [item.key]: e.target.checked
                              },
                              sideEffects: {
                                ...prev.sideEffects,
                                [item.key === 'peripheralNeuropathy' ? 'numbness' : (item.key === 'blurredVision' ? 'visionBlur' : (item.key === 'tinnitusHearingLoss' ? 'tinnitusDizziness' : item.key))]: e.target.checked
                              }
                            }));
                          }}
                          className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                        />
                        <span className={`font-medium ${item.key === 'jaundice' || item.key === 'blurredVision' ? 'text-red-700 font-bold' : ''}`}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">น้ำหนัก (กก.)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vitals?.bodyWeight || 55}
                      onChange={e => setFormData({ 
                        ...formData, 
                        vitals: { ...formData.vitals, bodyWeight: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">อุณหภูมิ (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vitals?.temperature || 36.6}
                      onChange={e => setFormData({ 
                        ...formData, 
                        vitals: { ...formData.vitals, temperature: parseFloat(e.target.value) || 36.6 }
                      })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ผลตรวจ / นัดตรวจครั้งถัดไป</label>
                    <input
                      type="text"
                      value={formData.nextTestOrAppointment || formData.nextAppointmentDate || ''}
                      onChange={e => setFormData({ ...formData, nextTestOrAppointment: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: หน้า 2 (สิ่งแวดล้อม, ผู้สัมผัสร่วมบ้าน, คำแนะนำ, ปัญหา) */}
          {/* ============================================================== */}
          {activeTab === 'p2' && (
            <div className="space-y-6">
              
              {/* 4. การประเมินบ้านและสิ่งแวดล้อม */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Home className="w-4 h-4 text-emerald-600" />
                  <span>4. การประเมินบ้านและสิ่งแวดล้อม</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ลักษณะที่อยู่อาศัย</label>
                    <select
                      value={formData.housingCondition || 'โปร่ง อากาศถ่ายเทดี'}
                      onChange={e => setFormData({ ...formData, housingCondition: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium"
                    >
                      <option value="โปร่ง อากาศถ่ายเทดี">โปร่ง อากาศถ่ายเทดี</option>
                      <option value="ค่อนข้างอับ">ค่อนข้างอับ</option>
                      <option value="แออัด">แออัด</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ห้องนอนผู้ป่วย</label>
                    <select
                      value={formData.bedroomCondition || 'แยกห้อง'}
                      onChange={e => setFormData({ ...formData, bedroomCondition: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium"
                    >
                      <option value="แยกห้อง">แยกห้อง</option>
                      <option value="ร่วมกับผู้อื่น">ร่วมกับผู้อื่น</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ถ้านอนร่วมกับผู้อื่น (จำนวนคน)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.bedroomSharedCount || 1}
                      onChange={e => setFormData({ ...formData, bedroomSharedCount: parseInt(e.target.value) || 1 })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">การเปิดหน้าต่าง / ระบายอากาศ</label>
                    <select
                      value={formData.windowVentilation || 'สม่ำเสมอ'}
                      onChange={e => setFormData({ ...formData, windowVentilation: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium"
                    >
                      <option value="สม่ำเสมอ">สม่ำเสมอ</option>
                      <option value="บางครั้ง">บางครั้ง</option>
                      <option value="ไม่ได้เปิด">ไม่ได้เปิด</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">การสวมหน้ากากเมื่ออยู่ร่วมกับผู้อื่น</label>
                    <select
                      value={formData.maskWearingComplianceOfficial || 'สม่ำเสมอ'}
                      onChange={e => setFormData({ ...formData, maskWearingComplianceOfficial: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium"
                    >
                      <option value="สม่ำเสมอ">สม่ำเสมอ</option>
                      <option value="บางครั้ง">บางครั้ง</option>
                      <option value="ไม่สวม">ไม่สวม</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">การกำจัดเสมหะ</label>
                    <select
                      value={formData.sputumDisposalOfficial || 'ถูกสุขลักษณะ'}
                      onChange={e => setFormData({ ...formData, sputumDisposalOfficial: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium"
                    >
                      <option value="ถูกสุขลักษณะ">ถูกสุขลักษณะ</option>
                      <option value="ควรแนะนำเพิ่มเติม">ควรแนะนำเพิ่มเติม</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ข้อสังเกตอื่น ๆ ด้านสิ่งแวดล้อม</label>
                  <input
                    type="text"
                    value={formData.environmentNotes || ''}
                    onChange={e => setFormData({ ...formData, environmentNotes: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* 5. การคัดกรองผู้สัมผัสร่วมบ้าน */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>5. การคัดกรองผู้สัมผัสร่วมบ้าน</span>
                  </div>
                  <button
                    type="button"
                    onClick={addContactRow}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มผู้สัมผัส</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">จำนวนผู้อาศัยร่วมบ้าน (คน)</label>
                    <input
                      type="number"
                      value={formData.householdMembersTotal || 3}
                      onChange={e => setFormData({ ...formData, householdMembersTotal: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">เด็กอายุต่ำกว่า 5 ปี (คน)</label>
                    <input
                      type="number"
                      value={formData.childrenUnder5Count || 0}
                      onChange={e => setFormData({ ...formData, childrenUnder5Count: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ผู้สูงอายุ (คน)</label>
                    <input
                      type="number"
                      value={formData.elderlyCount || 0}
                      onChange={e => setFormData({ ...formData, elderlyCount: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ผู้มีโรคประจำตัว/ภูมิคุ้มกันต่ำ (คน)</label>
                    <input
                      type="number"
                      value={formData.chronicImmuneDeficientCount || 0}
                      onChange={e => setFormData({ ...formData, chronicImmuneDeficientCount: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {/* Contacts List Table in Form */}
                <div className="overflow-x-auto">
                  <table className="w-full border border-slate-200 rounded-lg text-xs bg-white">
                    <thead className="bg-slate-100 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 text-left">ชื่อ-สกุล ผู้สัมผัส</th>
                        <th className="p-2 w-20">อายุ</th>
                        <th className="p-2 w-32">ความสัมพันธ์</th>
                        <th className="p-2 w-36 text-center">มีอาการสงสัย TB</th>
                        <th className="p-2 w-36 text-center">คัดกรอง/ส่งตรวจแล้ว</th>
                        <th className="p-2 w-12 text-center">ลบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(formData.contactsList || []).map((c, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={c.name}
                              onChange={e => updateContactRow(idx, 'name', e.target.value)}
                              placeholder="ชื่อและนามสกุล"
                              className="w-full p-1.5 rounded border border-slate-200"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={c.age}
                              onChange={e => updateContactRow(idx, 'age', e.target.value)}
                              placeholder="อายุ"
                              className="w-full p-1.5 rounded border border-slate-200 text-center"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={c.relationship}
                              onChange={e => updateContactRow(idx, 'relationship', e.target.value)}
                              placeholder="เช่น ภรรยา, บุตร"
                              className="w-full p-1.5 rounded border border-slate-200"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="checkbox"
                              checked={c.hasSuspiciousSymptoms}
                              onChange={e => updateContactRow(idx, 'hasSuspiciousSymptoms', e.target.checked)}
                              className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="checkbox"
                              checked={c.isScreened}
                              onChange={e => updateContactRow(idx, 'isScreened', e.target.checked)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeContactRow(idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6. การให้คำแนะนำ */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-emerald-600" />
                  <span>6. การให้คำแนะนำสุขศึกษา</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-slate-200">
                  {[
                    { key: 'takeMedsRegularly', label: 'กินยาสม่ำเสมอและมาตามนัด' },
                    { key: 'watchSideEffects', label: 'สังเกตอาการไม่พึงประสงค์จากยา และรีบติดต่อหน่วยบริการเมื่อมีอาการรุนแรง' },
                    { key: 'coverCoughWearMask', label: 'ไอ/จามปิดปากด้วยกระดาษหรือข้อพับแขน และสวมหน้ากากเมื่ออยู่ใกล้ผู้อื่น' },
                    { key: 'openWindows', label: 'เปิดประตูหน้าต่างให้อากาศถ่ายเท' },
                    { key: 'sputumDisposalProperly', label: 'แยกภาชนะรองเสมหะและกำจัดอย่างถูกสุขลักษณะ' },
                    { key: 'screenContacts', label: 'คัดกรองผู้สัมผัสร่วมบ้าน โดยเฉพาะเด็กเล็กและผู้มีความเสี่ยง' },
                    { key: 'nutritionAndRest', label: 'โภชนาการและการพักผ่อน' },
                  ].map(item => (
                    <label key={item.key} className="flex items-start gap-2 cursor-pointer text-xs p-1">
                      <input
                        type="checkbox"
                        checked={Boolean((formData.adviceChecklist as any)?.[item.key])}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            adviceChecklist: {
                              ...(prev.adviceChecklist as any),
                              [item.key]: e.target.checked
                            }
                          }));
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                      />
                      <span className="font-medium text-slate-800">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 7. ปัญหา อุปสรรค และแผนช่วยเหลือ */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-emerald-600" />
                  <span>7. ปัญหา อุปสรรค และแผนช่วยเหลือ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ปัญหาที่พบ</label>
                    <textarea
                      rows={2}
                      value={formData.problemsFound || ''}
                      onChange={e => setFormData({ ...formData, problemsFound: e.target.value })}
                      placeholder="ระบุปัญหาหรืออุปสรรคที่พบ..."
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">แผนการช่วยเหลือ / ส่งต่อ</label>
                    <textarea
                      rows={2}
                      value={formData.assistancePlan || ''}
                      onChange={e => setFormData({ ...formData, assistancePlan: e.target.value })}
                      placeholder="ระบุแผนการดูแล ช่วยเหลือ หรือการประสานงาน..."
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">วันนัดติดตามครั้งต่อไป</label>
                  <input
                    type="date"
                    value={formData.nextFollowUpDate || formData.nextVisitDueDate || ''}
                    onChange={e => setFormData({ 
                      ...formData, 
                      nextFollowUpDate: e.target.value,
                      nextVisitDueDate: e.target.value 
                    })}
                    className="w-full sm:w-64 p-2 rounded-lg border border-slate-200 bg-white font-bold"
                  />
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: หน้า 3 (การกำกับยา DOTS 7 วัน, Adherence, การแก้ไข) */}
          {/* ============================================================== */}
          {activeTab === 'p3' && (
            <div className="space-y-6">
              
              {/* 8. การกำกับการกินยา (DOT) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <span>8. การกำกับการกินยา (DOT : Directly Observed Treatment)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ผู้กำกับการกินยา (DOT Provider)</label>
                    <select
                      value={formData.dotProviderType || 'อสม.'}
                      onChange={e => setFormData({ ...formData, dotProviderType: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium"
                    >
                      <option value="อสม.">อสม.</option>
                      <option value="ญาติ">ญาติ</option>
                      <option value="เจ้าหน้าที่สาธารณสุข">เจ้าหน้าที่สาธารณสุข</option>
                      <option value="อื่น ๆ">อื่น ๆ</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">รูปแบบการกำกับการกินยา</label>
                    <select
                      value={formData.dotFormat || 'พบเห็นการกินยาทุกวัน (Daily DOT)'}
                      onChange={e => setFormData({ ...formData, dotFormat: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium"
                    >
                      <option value="พบเห็นการกินยาทุกวัน (Daily DOT)">พบเห็นการกินยาทุกวัน (Daily DOT)</option>
                      <option value="พบเห็นการกินยา 3 ครั้ง/สัปดาห์">พบเห็นการกินยา 3 ครั้ง/สัปดาห์</option>
                      <option value="Video DOT (VOT)">Video DOT (VOT)</option>
                      <option value="Self-administered (SAT)">Self-administered (SAT)</option>
                      <option value="อื่น ๆ">อื่น ๆ</option>
                    </select>
                  </div>
                </div>

                {/* 7-Day Medication Intake Table */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-900 block">การรับประทานยาในช่วง 7 วันที่ผ่านมา (บันทึกรายวัน):</label>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      ขาดยา: {formData.missedDaysCount || 0} วัน / 7 วัน
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border border-slate-200 rounded-lg text-xs bg-white">
                      <thead className="bg-slate-100 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2 w-28 text-left pl-3">วัน</th>
                          <th className="p-2 w-44 text-center">สถานะการกินยา</th>
                          <th className="p-2 text-left">ผู้กำกับการกินยา</th>
                          <th className="p-2 text-left">หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(formData.past7DaysDoseLogs || []).map((log, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-bold text-slate-800 pl-3">
                              {log.day}
                            </td>
                            <td className="p-2 text-center">
                              <div className="inline-flex items-center gap-3">
                                <label className="inline-flex items-center gap-1 cursor-pointer font-bold text-emerald-700">
                                  <input
                                    type="radio"
                                    name={`dose-${idx}`}
                                    checked={log.takenStatus === 'ครบ'}
                                    onChange={() => update7DayLog(idx, 'takenStatus', 'ครบ')}
                                    className="text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span>ครบ</span>
                                </label>
                                <label className="inline-flex items-center gap-1 cursor-pointer font-bold text-red-700">
                                  <input
                                    type="radio"
                                    name={`dose-${idx}`}
                                    checked={log.takenStatus === 'ขาด'}
                                    onChange={() => update7DayLog(idx, 'takenStatus', 'ขาด')}
                                    className="text-red-600 focus:ring-red-500"
                                  />
                                  <span>ขาด</span>
                                </label>
                              </div>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={log.supervisorName || ''}
                                onChange={e => update7DayLog(idx, 'supervisorName', e.target.value)}
                                placeholder="ชื่อผู้กำกับยา"
                                className="w-full p-1 rounded border border-slate-200 text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={log.notes || ''}
                                onChange={e => update7DayLog(idx, 'notes', e.target.value)}
                                placeholder="เช่น ตรงเวลา, ลืม 1 มื้อ"
                                className="w-full p-1 rounded border border-slate-200 text-xs"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Adherence Evaluation Grade */}
                <div className="pt-2">
                  <label className="font-semibold text-slate-900 block mb-1">ประเมินความร่วมมือในการรักษา (Adherence Grade):</label>
                  <select
                    value={formData.adherenceEvaluation || 'ดีมาก (รับประทานยาครบ ≥95%)'}
                    onChange={e => setFormData({ ...formData, adherenceEvaluation: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white font-bold text-emerald-800 text-xs"
                  >
                    <option value="ดีมาก (รับประทานยาครบ ≥95%)">ดีมาก (รับประทานยาครบ ≥95%)</option>
                    <option value="ดี (80–94%)">ดี (80–94%)</option>
                    <option value="ปานกลาง (50–79%)">ปานกลาง (50–79%)</option>
                    <option value="ไม่ดี (<50%)">ไม่ดี (&lt;50%)</option>
                  </select>
                </div>

                {/* สาเหตุที่ขาดยา */}
                <div className="pt-2">
                  <label className="font-semibold text-slate-900 block mb-1.5">สาเหตุที่ขาดยา (เลือกทั้งหมดที่พบ):</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-lg border border-slate-200">
                    {[
                      { key: 'forgot', label: 'ลืมรับประทานยา' },
                      { key: 'travelingAway', label: 'เดินทาง/ไม่อยู่บ้าน' },
                      { key: 'adverseReaction', label: 'มีอาการไม่พึงประสงค์' },
                      { key: 'outOfMedication', label: 'ยาหมด' },
                      { key: 'misunderstanding', label: 'ไม่เข้าใจการรักษา' },
                      { key: 'refusal', label: 'ปฏิเสธการรักษา' },
                      { key: 'substanceAlcohol', label: 'ดื่มสุรา/ใช้สารเสพติด' },
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={Boolean((formData.adherenceMissedReasons as any)?.[item.key])}
                          onChange={e => {
                            setFormData(prev => ({
                              ...prev,
                              adherenceMissedReasons: {
                                ...(prev.adherenceMissedReasons as any),
                                [item.key]: e.target.checked
                              }
                            }));
                          }}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-medium">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* การดำเนินการแก้ไข */}
                <div className="pt-2">
                  <label className="font-semibold text-slate-900 block mb-1.5">การดำเนินการแก้ไข:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-slate-200">
                    {[
                      { key: 'educateAdherenceImportance', label: 'ให้คำแนะนำเรื่องความสำคัญของการกินยาสม่ำเสมอ' },
                      { key: 'coordinateSupervisor', label: 'ประสาน อสม./ญาติ กำกับการกินยา' },
                      { key: 'notifyDoctorNurse', label: 'แจ้งแพทย์/พยาบาลเจ้าของไข้' },
                      { key: 'referMultidisciplinary', label: 'ส่งต่อทีมสหวิชาชีพ' },
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={Boolean((formData.correctiveActions as any)?.[item.key])}
                          onChange={e => {
                            setFormData(prev => ({
                              ...prev,
                              correctiveActions: {
                                ...(prev.correctiveActions as any),
                                [item.key]: e.target.checked
                              }
                            }));
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-medium">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: หน้า 4 (ผลการประเมินครั้งนี้ & ลายมือชื่อ) */}
          {/* ============================================================== */}
          {activeTab === 'p4' && (
            <div className="space-y-6">
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ผลการประเมินการเยี่ยมบ้านครั้งนี้</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { value: 'รับประทานยาต่อเนื่องดี', label: 'รับประทานยาต่อเนื่องดี', desc: 'กินยาสม่ำเสมอ ไม่มีปัญหาข้างเคียงรุนแรง' },
                    { value: 'มีความเสี่ยงต่อการขาดยา', label: 'มีความเสี่ยงต่อการขาดยา', desc: 'ลืมกินยา 1-2 วัน หรือมีอุปสรรคการเดินทาง' },
                    { value: 'ขาดยา ต้องติดตามอย่างใกล้ชิด', label: 'ขาดยา ต้องติดตามอย่างใกล้ชิด', desc: 'ขาดยาต่อเนื่องหลายวัน ต้องประสานทีมเยี่ยมซ้ำ' },
                    { value: 'สงสัย Lost to Follow-up (LTFU)', label: 'สงสัย Lost to Follow-up (LTFU)', desc: 'ติดต่อไม่ได้ / ย้ายที่อยู่ / ปฏิเสธการรักษา' },
                  ].map(opt => (
                    <label 
                      key={opt.value} 
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                        formData.overallEvaluationOutcome === opt.value
                          ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="outcome"
                        value={opt.value}
                        checked={formData.overallEvaluationOutcome === opt.value}
                        onChange={() => setFormData({ 
                          ...formData, 
                          overallEvaluationOutcome: opt.value as any,
                          status: opt.value === 'รับประทานยาต่อเนื่องดี' ? 'เยี่ยมสำเร็จ (ปกติ)' : (opt.value === 'สงสัย Lost to Follow-up (LTFU)' ? 'ส่งต่อแพทย์/รพ. (Referral)' : 'พบปัญหา/ต้องติดตามใกล้ชิด')
                        })}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{opt.label}</span>
                        <span className="text-[11px] text-slate-500">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">บันทึกข้อเสนอแนะเพิ่มเติม</label>
                  <textarea
                    rows={3}
                    value={formData.recommendationsAndNotes || ''}
                    onChange={e => setFormData({ ...formData, recommendationsAndNotes: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Signatures Form Inputs */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>ข้อมูลลายมือชื่อ (Signatures)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ชื่อผู้กำกับการกินยา</label>
                    <input
                      type="text"
                      value={formData.dotSupervisorSignName || ''}
                      onChange={e => setFormData({ ...formData, dotSupervisorSignName: e.target.value })}
                      placeholder="ชื่อ-สกุล ผู้กำกับยา"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ชื่อผู้เยี่ยมบ้าน *</label>
                    <input
                      type="text"
                      required
                      value={formData.visitorSignName || formData.visitorName || ''}
                      onChange={e => setFormData({ ...formData, visitorSignName: e.target.value })}
                      placeholder="ชื่อ-สกุล ผู้ประเมินเยี่ยมบ้าน"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ชื่อผู้ป่วย / ผู้ดูแล</label>
                    <input
                      type="text"
                      value={formData.patientOrCaregiverSignName || formData.patientName || ''}
                      onChange={e => setFormData({ ...formData, patientOrCaregiverSignName: e.target.value })}
                      placeholder="ชื่อ-สกุล ผู้ป่วยหรือญาติ"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: พิกัด GPS & นำทาง */}
          {/* ============================================================== */}
          {activeTab === 'gps' && (
            <div className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-sky-200 pb-2">
                  <div className="flex items-center gap-2 font-bold text-sky-950 text-sm">
                    <Compass className="w-4 h-4 text-sky-700" />
                    <span>พิกัด GPS ณ วันที่ลงพื้นที่เยี่ยมบ้านจริง</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleCurrentGPS}
                    disabled={gpsLoading}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                    <span>{gpsLoading ? 'กำลังระบุพิกัด...' : 'ตรวจจับ GPS ปัจจุบัน'}</span>
                  </button>
                </div>

                {gpsNotice && (
                  <div className="p-2 rounded bg-sky-100 text-sky-900 text-xs font-semibold">
                    {gpsNotice}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ละติจูด (Latitude)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.visitLat || 17.085}
                      onChange={e => setFormData({ ...formData, visitLat: parseFloat(e.target.value) || 17.085 })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ลองจิจูด (Longitude)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.visitLng || 104.295}
                      onChange={e => setFormData({ ...formData, visitLng: parseFloat(e.target.value) || 104.295 })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Map className="w-4 h-4" />
                    <span>ปักหมุดบนแผนที่</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openGoogleMapsNavigation({
                      lat: formData.visitLat,
                      lng: formData.visitLng,
                      address: `${formData.houseNo ? `บ้านเลขที่ ${formData.houseNo} ` : ''}${formData.village} ${formData.subdistrict}`,
                      name: formData.patientName
                    })}
                    className="px-3 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Compass className="w-4 h-4" />
                    <span>ทดสอบเปิดนำทาง Google Maps</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              ยกเลิก
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-700/20 transition"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกแบบฟอร์มการเยี่ยมบ้าน</span>
              </button>
            </div>
          </div>

        </form>

        {/* Location Picker Modal */}
        {isMapPickerOpen && (
          <LocationPickerModal
            isOpen={isMapPickerOpen}
            onClose={() => setIsMapPickerOpen(false)}
            initialLat={formData.visitLat || 17.085}
            initialLng={formData.visitLng || 104.295}
            onSelectLocation={(lat, lng) => {
              setFormData(prev => ({
                ...prev,
                visitLat: lat,
                visitLng: lng
              }));
              setIsMapPickerOpen(false);
            }}
          />
        )}

      </div>
    </div>
  );
};
