export interface UserAccount {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: 'Admin' | 'Staff' | 'อสม.';
  subdistrict?: string;
  hospitalName?: string;
  phone?: string;
  createdAt: string;
}

export type TBType = 'Pulmonary Smear+' | 'Pulmonary Smear-' | 'Extra-Pulmonary';

export type TreatmentStatus = 'Active' | 'Cured' | 'Completed' | 'Interrupted' | 'Died' | 'Transferred';

export type SputumResultStatus = 'Negative' | 'Scanty' | '1+' | '2+' | '3+' | 'Pending' | 'Not Done';

export type CXRResult = 'Normal' | 'Abnormal TB Suspect' | 'Abnormal Non-TB' | 'Pending' | 'Not Done';

export type ContactOutcome = 'Under Evaluation' | 'Cleared' | 'TPT Initiated' | 'Active TB (Referred)';

export interface SputumRecord {
  monthLabel: ' Baseline (เดือน 0)' | 'เดือนที่ 2' | 'เดือนที่ 5' | 'เดือนที่ 6/8';
  monthNum: 0 | 2 | 5 | 6 | 8;
  dueDate: string;
  testDate?: string;
  result: SputumResultStatus;
  labNumber?: string;
  notes?: string;
}

export interface DOTSLog {
  date: string; // YYYY-MM-DD
  taken: boolean;
  takenTime?: string;
  sideEffects?: string[]; // e.g., 'คลื่นไส้', 'ตัวเหลืองตาเหลือง', 'ผื่นคัน', 'ปวดข้อ'
  observedBy?: string;
  notes?: string;
}

export interface Patient {
  id: string;
  hn: string;
  idCard: string;
  prefix: string;
  firstName: string;
  lastName: string;
  gender: 'ชาย' | 'หญิง';
  age: number;
  phone: string;
  subdistrict: string; // ตำบลใน อ.โพนนาแก้ว
  village: string;     // หมู่บ้าน
  houseNo: string;
  tbType: TBType;
  regimen: string;     // e.g., 2HRZE/4HR
  registrationDate: string;
  treatmentStartDate: string;
  expectedEndDate: string;
  dotsSupervisorName: string;
  dotsSupervisorRole: 'อสม. พี่เลี้ยง' | 'เจ้าหน้าที่ รพ.สต.' | 'ญาติผู้ดูแล';
  dotsSupervisorPhone: string;
  status: TreatmentStatus;
  lat: number;
  lng: number;
  sputumRecords: SputumRecord[];
  dotsLogs: DOTSLog[];
  nextAppointmentDate?: string;
  nextAppointmentReason?: string;
  lastLocationUpdatedBy?: string;
  lastLocationUpdatedAt?: string;
}

export interface HouseholdContact {
  id: string;
  indexPatientId: string;
  indexPatientName: string;
  indexPatientHN: string;
  idCard: string;
  prefix: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'ชาย' | 'หญิง';
  relationship: 'สามี/ภรรยา' | 'บุตร' | 'บิดา/มารดา' | 'พี่น้อง' | 'ผู้สัมผัสร่วมบ้าน' | 'เพื่อนบ้านใกล้ชิด';
  phone: string;
  subdistrict: string;
  village: string;
  riskFactors: string[]; // e.g. 'เด็กอายุ < 5 ปี', 'ผู้สูงอายุ > 60 ปี', 'มีโรคประจำตัว/ผู้ป่วย HIV'
  symptoms: {
    coughOver2Weeks: boolean;
    fever: boolean;
    nightSweats: boolean;
    weightLoss: boolean;
    haemoptysis: boolean; // ไอเป็นเลือด
  };
  screeningDate: string;
  cxrResult: CXRResult;
  cxrDate?: string;
  afbResult: SputumResultStatus;
  afbDate?: string;
  outcome: ContactOutcome;
  tptRegimen?: string; // e.g. '3HP', '1HP', '6H'
  tptStartDate?: string;
  nextAppointmentDate?: string;
  notes?: string;
}

export interface HealthUnitInfo {
  name: string;
  subdistrict: string;
  villagesCount: number;
  villages: string[];
}

export interface SubdistrictInfo {
  code: string;
  name: string; // ตำบลบ้านโพน, ตำบลบ้านแป้น, ตำบลนาตงวัฒนา, ตำบลเชียงเสือ, ตำบลนาแก้ว
  lat: number;
  lng: number;
  villagesCount: number;
  healthUnitsCount: number;
  population: number;
  healthCenterName: string; // รพ.สต. / หน่วยบริการ
  healthUnits: HealthUnitInfo[];
  villages: string[];
}

export interface LineNotificationConfig {
  mode: 'messaging_api' | 'notify';
  channelAccessToken: string; // LINE OA Messaging API Channel Access Token
  targetGroupId: string;      // LINE Group ID (C...) or User ID (U...)
  token: string;              // LINE Notify Token (Legacy)
  autoDailyReminders: boolean;
  reminderTime: string;       // "08:00"
  autoAppointmentReminders: boolean;
  alertOnMissedDoses: boolean;
  missedThresholdDays: number; // e.g. 2
  lineGroupName: string;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  type: 'daily_dots' | 'appointment' | 'missed_dose_alert' | 'contact_screening' | 'system';
  targetName: string;
  message: string;
  status: 'sent' | 'simulated' | 'failed';
  errorDetails?: string;
}

export type PatientCategory = 'New' | 'Relapse' | 'Treatment after failure' | 'Treatment after default' | 'Transfer in' | 'Other';
export type HIVStatus = 'Positive' | 'Negative' | 'Unknown / Not Tested';
export type GeneXpertResult = 'MTB not detected' | 'MTB detected, Rif Resistance not detected' | 'MTB detected, Rif Resistance detected' | 'MTB detected, Rif Resistance indeterminate' | 'Invalid / Error' | 'Not Done';

export interface InvestigationRecord {
  id: string;
  patientId?: string; // Linked Patient ID if already registered
  investigationNumber: string; // เช่น INV-67-001
  investigationDate: string; // YYYY-MM-DD
  investigatorName: string;
  investigatorRole: string; // เช่น นักวิชาการสาธารณสุข, พยาบาลวิชาชีพ, จพ.สาธารณสุข
  investigatorUnit: string; // เช่น รพ.สต.บ้านโพน / กลุ่มงานเวชปฏิบัติครอบครัวและชุมชน รพ.โพนนาแก้ว
  investigatorPhone: string;

  // Section 1: ข้อมูลทั่วไปผู้ป่วย
  hn: string;
  idCard: string;
  prefix: string;
  firstName: string;
  lastName: string;
  gender: 'ชาย' | 'หญิง';
  age: number;
  nationality: string; // ไทย / อื่นๆ
  maritalStatus: 'โสด' | 'สมรส' | 'หม้าย' | 'หย่าร้าง/แยกกันอยู่';
  occupation: string;
  workplaceOrSchool: string;
  phone: string;
  
  // ที่อยู่ขณะป่วย
  houseNo: string;
  villageNo: string; // หมู่ที่
  villageName: string; // บ้าน...
  subdistrict: string; // ตำบล
  district: string; // อำเภอ (default โพนนาแก้ว)
  province: string; // จังหวัด (default สกลนคร)
  lat?: number;
  lng?: number;

  // Section 2: ประวัติการเจ็บป่วยและอาการ
  onsetDate: string; // วันเริ่มมีอาการ
  firstConsultDate: string; // วันรับการรักษาครั้งแรก
  diagnosisDate: string; // วันวินิจฉัย
  treatmentStartDate: string; // วันเริ่มยา
  durationOfSymptomsWeeks: number; // ระยะเวลาที่มีอาการ (สัปดาห์)
  symptoms: {
    chronicCough: boolean; // ไอเรื้อรัง > 2 สัปดาห์
    hemoptysis: boolean; // ไอเป็นเลือด
    afternoonFever: boolean; // มีไข้ต่ำๆ ตอนบ่าย/ค่ำ
    nightSweats: boolean; // เหงื่อออกกลางคืน
    weightLoss: boolean; // น้ำหนักลด
    lossOfAppetite: boolean; // เบื่ออาหาร
    chestPain: boolean; // เจ็บแน่นหน้าอก
    dyspnea: boolean; // หอบเหนื่อย
    lymphNodeSwelling: boolean; // ต่อมน้ำเหลืองโต
    otherSymptoms?: string;
  };

  // Section 3: ประวัติความเสี่ยงและโรคร่วม (Risk Factors & Comorbidities)
  smoking: 'ไม่สูบ' | 'เคยสูบ (เลิกแล้ว)' | 'สูบเป็นประจำ';
  smokingPackYears?: string;
  alcohol: 'ไม่ดื่ม' | 'ดื่มเป็นครั้งคราว' | 'ดื่มเป็นประจำ (ติดสุรา)';
  substanceAbuse: boolean;
  substanceDetails?: string;
  underlyingDiseases: {
    diabetes: boolean; // เบาหวาน (DM)
    ckd: boolean; // ไตวายเรื้อรัง (CKD)
    copdAsthma: boolean; // ถุงลมโป่งพอง/หอบหืด
    liverDisease: boolean; // โรคตับ
    malignancy: boolean; // มะเร็ง
    immunosuppressive: boolean; // ได้รับยากดภูมิคุ้มกัน/สเตียรอยด์
    other?: string;
  };
  hivStatus: HIVStatus;
  hivTestedDate?: string;
  onArt?: boolean; // ได้รับยาต้านไวรัสหรือไม่

  // ประวัติการสัมผัสและปัจจัยสิ่งแวดล้อม
  historyOfTbContact: boolean; // มีประวัติสัมผัสผู้ป่วยวัณโรค
  tbContactSourceDetails?: string; // รายละเอียดผู้ที่เป็นแหล่งโรค เช่น พ่อ, เพื่อนร่วมงาน
  pastTbHistory: boolean; // เคยป่วยเป็นวัณโรคมาก่อนหรือไม่
  pastTbYear?: string;
  pastTbOutcome?: string;
  prisonHistory: boolean; // เคยต้องโทษในเรือนจำ
  crowdedLiving: boolean; // สภาพบ้านแออัด/ถ่ายเทไม่สะดวก
  householdMembersCount: number; // จำนวนผู้อยู่อาศัยในบ้านทั้งหมด

  // Section 4: การตรวจทางห้องปฏิบัติการและรังสีวิทยา (Lab & X-ray)
  cxrDate: string;
  cxrResult: CXRResult;
  cxrLesionType: 'Cavity (มีโพรงแผล)' | 'Infiltration' | 'Effusion' | 'Miliary' | 'Normal' | 'Other';
  cxrDetails?: string;

  afbSmear1: SputumResultStatus;
  afbSmear2: SputumResultStatus;
  afbSmear3: SputumResultStatus;
  afbDate: string;
  afbLabNo?: string;

  geneXpertDate?: string;
  geneXpertResult: GeneXpertResult;
  cultureDate?: string;
  cultureResult?: 'Negative' | 'MTB Positive' | 'NTM' | 'Contaminated' | 'Pending';
  dstResult?: string; // ผลความไวต่อยา

  // Section 5: การวินิจฉัยและการรักษา (Diagnosis & Treatment)
  patientCategory: PatientCategory;
  tbType: TBType;
  icd10Code?: string; // e.g. A15.0, A15.1, A16.0
  treatmentRegimen: string; // e.g. 2HRZE/4HR
  treatingFacility: string; // e.g. รพ.โพนนาแก้ว
  dotsSupervisorType: 'อสม.พี่เลี้ยง' | 'เจ้าหน้าที่สาธารณสุข' | 'สมาชิกครอบครัว' | 'รับประทานเอง';
  dotsSupervisorName: string;
  dotsSupervisorPhone: string;

  // Section 6: ผลการติดตามผู้สัมผัส (Contact Investigation Summary)
  contactsIdentified: number; // จำนวนผู้สัมผัสที่ค้นพบ
  contactsScreened: number; // คัดกรองอาการแล้ว
  contactsCxrDone: number; // ตรวจ CXR แล้ว
  contactsAfbDone: number; // ตรวจเสมหะแล้ว
  contactsTptInitiated: number; // ได้รับยาป้องกัน TPT แล้ว
  contactsActiveTbFound: number; // พบเป็นวัณโรค (Active TB)

  // Section 7: สรุปผลการสอบสวน แหล่งแพร่โรค และมาตรการ
  suspectedSource: 'ในครอบครัว' | 'ในที่ทำงาน/โรงเรียน' | 'ในชุมชน' | 'ไม่ทราบแหล่งชัดเจน';
  transmissionRisk: 'สูง (High Risk)' | 'ปานกลาง (Moderate Risk)' | 'ต่ำ (Low Risk)';
  investigationSummary: string; // สรุปผลการสอบสวน
  controlMeasuresTaken: string; // มาตรการควบคุมโรคที่ได้ดำเนินการ (เช่น แจกหน้ากาก แนะนำการเปิดระบายอากาศ นัดตรวจญาติ)
  recommendations: string; // ข้อเสนอแนะสำหรับพื้นที่/รพ.สต.
  
  status: 'Complete' | 'Draft' | 'Pending Follow-up';
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// ระบบเยี่ยมบ้านผู้ป่วยวัณโรค (Home Visit & Community Follow-up)
// ตามแบบฟอร์มเยี่ยมบ้านผู้ป่วยวัณโรค (TB Home Visit) รพ.โพนนาแก้ว 4 หน้า
// -------------------------------------------------------------
export type HomeVisitStatus = 'เยี่ยมสำเร็จ (ปกติ)' | 'พบปัญหา/ต้องติดตามใกล้ชิด' | 'ส่งต่อแพทย์/รพ. (Referral)' | 'ไม่อยู่บ้าน/เลื่อนนัด';
export type DOTSAdherenceRating = 'รับประทานยาทุกวัน สม่ำเสมอ 100%' | 'ลืมกินยา 1-2 วัน/สัปดาห์' | 'ลืมกินยา > 3 วัน/สัปดาห์ (เสี่ยงขาดยา)' | 'หยุดยาเอง / ปฏิเสธยา';
export type VentilationRating = 'ดีมาก (โปร่ง แดดส่อง ลมถ่ายเทดี)' | 'ปานกลาง (ถ่ายเทพอใช้)' | 'แออัด/ทึบ แสงแดดส่องไม่ถึง';

export type TBHomeVisitRoundType = 'ครั้งที่ 1' | 'ครั้งที่ 2' | 'ติดตามต่อเนื่อง';
export type TBHomeVisitPatientCategory = 'ผู้ป่วยใหม่' | 'รักษาซ้ำ' | 'วัณโรคดื้อยา' | 'อื่น ๆ';
export type TBHomeVisitDiseaseSite = 'วัณโรคปอด' | 'วัณโรคนอกปอด';
export type TBHomeVisitTreatmentPhase = 'ระยะเข้มข้น' | 'ระยะต่อเนื่อง';
export type TBHomeVisitDOTProviderType = 'ญาติ' | 'อสม.' | 'บุคลากรสาธารณสุข' | 'เจ้าหน้าที่สาธารณสุข' | 'อื่น ๆ';
export type TBHomeVisitDOTFormat = 'พบเห็นการกินยาทุกวัน (Daily DOT)' | 'พบเห็นการกินยา 3 ครั้ง/สัปดาห์' | 'Video DOT (VOT)' | 'Self-administered (SAT)' | 'อื่น ๆ';
export type TBHomeVisitAdherenceGrade = 'ดีมาก (รับประทานยาครบ ≥95%)' | 'ดี (80–94%)' | 'ปานกลาง (50–79%)' | 'ไม่ดี (<50%)';
export type TBHomeVisitOutcome = 'รับประทานยาต่อเนื่องดี' | 'มีความเสี่ยงต่อการขาดยา' | 'ขาดยา ต้องติดตามอย่างใกล้ชิด' | 'สงสัย Lost to Follow-up (LTFU)';

export interface TBHomeVisitContactPerson {
  id?: string;
  name: string;
  age: number | string;
  relationship: string;
  hasSuspiciousSymptoms: boolean; // มีอาการสงสัย TB (มี/ไม่มี)
  isScreened: boolean; // ได้รับการคัดกรอง/ส่งตรวจ (ใช่/ไม่ใช่)
}

export interface TBHomeVisit7DayDoseLog {
  day: 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์' | 'เสาร์' | 'อาทิตย์';
  takenStatus: 'ครบ' | 'ขาด';
  supervisorName?: string;
  notes?: string;
}

export interface HomeVisitRecord {
  id: string;
  patientId: string;
  patientHN: string;
  patientName: string;
  subdistrict: string;
  village: string;
  houseNo: string;
  visitRound: number; // ครั้งที่เยี่ยม (1, 2, 3...)
  visitRoundType?: TBHomeVisitRoundType; // ครั้งที่ 1 / ครั้งที่ 2 / ติดตามต่อเนื่อง
  visitDate: string; // YYYY-MM-DD
  visitTime?: string; // HH:mm
  serviceUnit?: string; // หน่วยบริการ เช่น โรงพยาบาลโพนนาแก้ว
  visitorName: string;
  coVisitorName?: string; // ผู้ร่วมเยี่ยมบ้าน
  visitorRole: 'พยาบาลวิชาชีพ' | 'จพ.สาธารณสุข' | 'นักวิชาการสาธารณสุข' | 'อสม. พี่เลี้ยง' | 'ทีม 3 หมอ' | 'แพทย์/เภสัชกร';
  visitorUnit: string;
  visitorPhone?: string;

  // 1. ข้อมูลผู้ป่วยเพิ่มเติม (จากแบบฟอร์ม)
  idCard?: string;
  age?: number;
  gender?: 'ชาย' | 'หญิง' | 'อื่น ๆ';
  phone?: string;
  primaryCaregiver?: string;
  caregiverPhone?: string;

  // 2. ข้อมูลการรักษาวัณโรค
  patientCategoryOfficial?: TBHomeVisitPatientCategory;
  patientCategoryOther?: string;
  diseaseSite?: TBHomeVisitDiseaseSite;
  extrapulmonarySite?: string; // ระบุ กรณีวัณโรคนอกปอด
  treatmentStartDate?: string; // วันที่เริ่มรักษา
  regimen?: string; // สูตรยา
  treatmentPhase?: TBHomeVisitTreatmentPhase; // ระยะเข้มข้น / ระยะต่อเนื่อง
  dotSupervisorTypeOfficial?: TBHomeVisitDOTProviderType;
  dotSupervisorOther?: string;

  // 3. การประเมินการกินยาและอาการ
  medicationPlanAdherence?: 'ครบทุกวัน' | 'ขาดยา';
  missedDaysCount?: number;
  missedReason?: string;
  evaluatedSymptoms?: {
    cough: boolean; // ไอ
    productiveCough: boolean; // ไอมีเสมหะ
    hemoptysis: boolean; // ไอเป็นเลือด
    fever: boolean; // ไข้
    nightSweats: boolean; // เหงื่อออกกลางคืน
    weightLoss: boolean; // น้ำหนักลด
    lossOfAppetite: boolean; // เบื่ออาหาร
    dyspnea: boolean; // เหนื่อยหอบ
    noAbnormalSymptoms: boolean; // ไม่มีอาการผิดปกติ
  };
  adverseDrugReactionsOfficial?: {
    nauseaVomiting: boolean; // คลื่นไส้/อาเจียน
    itchingRash: boolean; // ผื่นคัน
    jaundice: boolean; // ตัวเหลืองตาเหลือง
    peripheralNeuropathy: boolean; // ชาปลายมือปลายเท้า
    blurredVision: boolean; // ตามัว/มองเห็นผิดปกติ
    tinnitusHearingLoss: boolean; // หูอื้อ/การได้ยินลดลง
    otherAdr?: string; // อื่น ๆ
  };
  clinicalActionTaken?: string; // การดำเนินการ
  nextTestOrAppointment?: string; // ผลตรวจ/นัดตรวจครั้งถัดไป

  // 4. การประเมินบ้านและสิ่งแวดล้อม
  housingCondition?: 'โปร่ง อากาศถ่ายเทดี' | 'ค่อนข้างอับ' | 'แออัด';
  bedroomCondition?: 'แยกห้อง' | 'ร่วมกับผู้อื่น';
  bedroomSharedCount?: number;
  windowVentilation?: 'สม่ำเสมอ' | 'บางครั้ง' | 'ไม่ได้เปิด';
  maskWearingComplianceOfficial?: 'สม่ำเสมอ' | 'บางครั้ง' | 'ไม่สวม';
  sputumDisposalOfficial?: 'ถูกสุขลักษณะ' | 'ควรแนะนำเพิ่มเติม';
  environmentNotes?: string;

  // 5. การคัดกรองผู้สัมผัสร่วมบ้าน
  householdMembersTotal?: number;
  childrenUnder5Count?: number;
  elderlyCount?: number;
  chronicImmuneDeficientCount?: number;
  contactsList?: TBHomeVisitContactPerson[];

  // 6. การให้คำแนะนำ
  adviceChecklist?: {
    takeMedsRegularly: boolean; // กินยาสม่ำเสมอและมาตามนัด
    watchSideEffects: boolean; // สังเกตอาการไม่พึงประสงค์จากยา และรีบติดต่อหน่วยบริการเมื่อมีอาการรุนแรง
    coverCoughWearMask: boolean; // ไอ/จามปิดปากด้วยกระดาษหรือข้อพับแขน และสวมหน้ากากเมื่ออยู่ใกล้ผู้อื่น
    openWindows: boolean; // เปิดประตูหน้าต่างให้อากาศถ่ายเท
    sputumDisposalProperly: boolean; // แยกภาชนะรองเสมหะและกำจัดอย่างถูกสุขลักษณะ
    screenContacts: boolean; // คัดกรองผู้สัมผัสร่วมบ้าน โดยเฉพาะเด็กเล็กและผู้มีความเสี่ยง
    nutritionAndRest: boolean; // โภชนาการและการพักผ่อน
    otherAdvice?: string;
  };

  // 7. ปัญหา อุปสรรค และแผนช่วยเหลือ
  problemsFound?: string; // ปัญหาที่พบ
  assistancePlan?: string; // แผนการช่วยเหลือ/ส่งต่อ
  nextFollowUpDate?: string; // วันนัดติดตามครั้งต่อไป

  // 8. การกำกับการกินยา (DOT : Directly Observed Treatment)
  dotProviderType?: TBHomeVisitDOTProviderType;
  dotProviderDetails?: string;
  dotFormat?: TBHomeVisitDOTFormat;
  dotFormatOther?: string;
  past7DaysDoseLogs?: TBHomeVisit7DayDoseLog[];
  adherenceEvaluation?: TBHomeVisitAdherenceGrade;
  adherenceMissedReasons?: {
    forgot: boolean; // ลืมรับประทานยา
    travelingAway: boolean; // เดินทาง/ไม่อยู่บ้าน
    adverseReaction: boolean; // มีอาการไม่พึงประสงค์จากยา
    outOfMedication: boolean; // ยาหมด
    misunderstanding: boolean; // ไม่เข้าใจการรักษา
    refusal: boolean; // ปฏิเสธการรักษา
    substanceAlcohol: boolean; // ดื่มสุรา/ใช้สารเสพติด
    otherReason?: string;
  };
  correctiveActions?: {
    educateAdherenceImportance: boolean; // ให้คำแนะนำเรื่องความสำคัญของการกินยาสม่ำเสมอ
    coordinateSupervisor: boolean; // ประสาน อสม./ญาติ กำกับการกินยา
    scheduleFollowUpDays?: number | string; // นัดติดตามภายใน .... วัน
    notifyDoctorNurse: boolean; // แจ้งแพทย์/พยาบาลเจ้าของไข้
    referMultidisciplinary: boolean; // ส่งต่อทีมสหวิชาชีพ
    otherAction?: string;
  };

  // ผลการประเมินครั้งนี้ (Page 4)
  overallEvaluationOutcome?: TBHomeVisitOutcome;
  dotSupervisorSignName?: string;
  visitorSignName?: string;
  patientOrCaregiverSignName?: string;

  // วัตถุประสงค์การเยี่ยม (Existing Compatible)
  objectives: {
    dotsFollowUp: boolean; // ติดตามการกินยา DOTS
    adrScreening: boolean; // ประเมินอาการข้างเคียง
    sputumFollowUp: boolean; // ติดตามส่งตรวจเสมหะ
    contactScreening: boolean; // ติดตามตรวจผู้สัมผัส
    environmentCheck: boolean; // ประเมินสิ่งแวดล้อม
    healthEducation: boolean; // ให้ความรู้และคำแนะนำ
    psychosocialSupport: boolean; // ดูแลด้านจิตใจและสังคม
    missedAppointment: boolean; // ติดตามผู้ป่วยขาดนัด/ขาดยา
  };

  // สัญญาณชีพและอาการทางคลินิก (Vitals & Clinical Symptoms)
  vitals: {
    temperature?: number; // C
    bloodPressure?: string; // e.g., 120/80
    pulseRate?: number; // bpm
    respiratoryRate?: number; // bpm
    oxygenSat?: number; // %
    bodyWeight?: number; // kg
    weightChange?: 'เพิ่มขึ้น' | 'คงที่' | 'ลดลง';
  };

  symptoms: {
    cough: 'ไม่มี' | 'ไอเล็กน้อย (ลดลง)' | 'ไอมาก/เรื้อรัง' | 'ไอเป็นเลือด (Hemoptysis)';
    sputumCharacteristics?: 'ไม่มีเสมหะ' | 'เสมหะใส/ขาว' | 'เสมหะหนองสีเหลือง/เขียว' | 'เสมหะปนเลือด';
    fever: boolean;
    nightSweats: boolean;
    dyspnea: boolean; // เหนื่อยหอบ
    chestPain: boolean;
    fatigue: boolean;
    appetite: 'ปกติ/เจริญอาหาร' | 'เบื่ออาหารเล็กน้อย' | 'เบื่ออาหารมาก';
  };

  // การประเมินการกินยา (DOTS & Medication Adherence)
  dotsSupervisor: {
    type: 'อสม. พี่เลี้ยง' | 'เจ้าหน้าที่ รพ.สต.' | 'ญาติผู้ดูแล' | 'กินเอง' | 'V-DOT';
    name?: string;
    isSupervisingDaily: boolean;
  };
  adherence: DOTSAdherenceRating;
  pillCountStatus: 'จำนวนเม็ดยาคงเหลือถูกต้องตรงรอบ' | 'ยาเหลือเกินรอบ (กินไม่ครบ)' | 'ยาหมดก่อนรอบ' | 'ไม่ได้นับเม็ดยา';
  missedDosesLast2Weeks: number; // จำนวนวันที่ลืมกินยาใน 2 สัปดาห์ล่าสุด

  // ผลข้างเคียงจากยาต้านวัณโรค (Side Effects / ADR)
  sideEffects: {
    nauseaVomiting: boolean; // คลื่นไส้/อาเจียน
    orangeUrineAcknowledged: boolean; // ปัสสาวะสีส้ม (ทราบว่าเป็นฤทธิ์ยาปกติ)
    jointPain: boolean; // ปวดข้อ/กล้ามเนื้อ
    numbness: boolean; // ชาปลายมือปลายเท้า (Neuropathy)
    itchingRash: boolean; // ผื่นคัน
    jaundice: boolean; // ตัวเหลือง/ตาเหลือง (RED FLAG ตับอักเสบ)
    visionBlur: boolean; // ตามัว/ตาบอดสี (RED FLAG จาก Ethambutol)
    tinnitusDizziness: boolean; // หูอื้อ/เวียนศีรษะ
    feverDrugReaction: boolean; // มีไข้จากแพ้ยา
    otherSideEffects?: string;
  };

  // สุขาภิบาลและสิ่งแวดล้อมที่อยู่อาศัย (Environmental & IPC)
  environment: {
    ventilation: VentilationRating;
    bedroomType: 'แยกห้องนอนเดี่ยว' | 'นอนรวมกับสมาชิกในบ้าน' | 'นอนนอกชาน/ที่โล่งโปร่ง';
    sunlightExposure: 'แดดส่องถึงห้องพัก' | 'แดดส่องไม่ถึง/ทึบ';
    sputumDisposalMethod: 'กระโถน/ถุงทิ้งมิดชิดผสมน้ำยาฆ่าเชื้อ' | 'กระดาษทิชชู่ใส่ถุงเผาทำลาย' | 'บ้วนทิ้งลงโถส้วม' | 'บ้วนทิ้งไม่ถูกสุขลักษณะ';
    maskWearingCompliance: 'สวมหน้ากากสม่ำเสมอเมื่อมีคนอยู่ใกล้' | 'สวมเป็นครั้งคราว' | 'ไม่สวม';
  };

  // สภาพจิตใจและผู้สัมผัสร่วมบ้าน (Psychosocial & Family)
  psychosocial: {
    familySupport: 'ครอบครัวดูแลและให้กำลังใจดีมาก' | 'ครอบครัวดูแลพอใช้' | 'ขาดผู้ดูแล/อยู่ลำพัง' | 'ครอบครัวรังเกียจ/มีความวิตกกังวล';
    financialDifficulty: boolean; // มีปัญหาค่าใช้จ่าย/เดินทาง
    foodAidNeeded: boolean; // ต้องการถุงยังชีพ/โภชนาการเสริม
    stressAnxietyLevel: 'ปกติ' | 'เครียด/กังวลปานกลาง' | 'เครียดมาก/ซึมเศร้า';
  };

  // การติดตามตรวจเสมหะและนัดหมาย (Follow-up & Sputum)
  sputumFollowUpDone: boolean;
  sputumResultNotes?: string;
  nextAppointmentDate?: string;
  nextVisitDueDate?: string;

  // การวินิจฉัย/ปัญหาที่พบ แผนการดูแล และสถานะ (Summary & Care Plan)
  identifiedProblems: string[]; // e.g. ['กินยาไม่สม่ำเสมอ', 'ตาเหลืองสงสัยตับอักเสบ', 'บ้านทึบอับชื้น']
  interventionsProvided: string[]; // e.g. ['แนะนำเปิดหน้าต่างระบายอากาศ', 'สอนการบ้วนและกำจัดเสมหะ', 'ปรับแผนให้ อสม. ดูแลใกล้ชิด']
  recommendationsAndNotes: string;
  referralRequired: boolean;
  referralReason?: string;
  status: HomeVisitStatus;

  // พิกัด GPS ณ วันที่ลงพื้นที่เยี่ยมบ้านจริง
  visitLat?: number;
  visitLng?: number;

  // รูปภาพการเยี่ยมบ้าน (Base64 or image URLs)
  photos?: string[];

  createdAt: string;
  updatedAt: string;
}

// ระบบวิดีโอคอลปรึกษาแพทย์และติดตามการรักษา (Telehealth Video Call System)
export type CallStatus = 'waiting' | 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed';

export interface CallParticipant {
  peerId: string;
  name: string;
  role: 'doctor' | 'patient' | 'nurse' | 'vdot' | 'relative' | 'staff' | string;
  roleTitle?: string; // e.g. "แพทย์", "พยาบาล", "ผู้ป่วย (คนไข้)", "อสม. พี่เลี้ยง", "ญาติ/ผู้ดูแล"
  joinedAt: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isScreenSharing?: boolean;
  avatarColor?: string;
}

export interface MultiPeerSignal {
  id?: string;
  fromPeerId: string;
  toPeerId: string;
  type: 'offer' | 'answer' | 'ice-candidate' | 'leave';
  data: any;
  createdAt: number;
}

export interface CallChatMessage {
  id: string;
  sender: 'doctor' | 'patient' | 'nurse' | 'vdot' | 'relative' | 'staff' | string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface VideoCallSession {
  id: string; // roomId เช่น CALL-xxxx
  patientId: string;
  patientName: string;
  patientHN: string;
  patientPhone?: string;
  patientSubdistrict?: string;
  patientVillage?: string;
  callerId: string; // User ID ของแพทย์/เจ้าหน้าที่
  callerName: string;
  callerRole: string; // 'แพทย์' | 'พยาบาล' | 'เจ้าหน้าที่สาธารณสุข' | 'อสม.'
  hospitalName: string;
  status: CallStatus;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  reason?: string; // e.g. 'ติดตามอาการข้างเคียง (ADR)', 'ประเมินการกินยา V-DOTS', 'ปรึกษาผลตรวจเสมหะ/X-Ray'
  doctorNotes?: string;
  prescriptionsOrAdvice?: string;
  vitalSummary?: {
    cough?: string;
    fever?: boolean;
    sideEffectsSummary?: string[];
    adherence?: string;
    weight?: number;
  };
  messages?: CallChatMessage[];
  participants?: Record<string, CallParticipant>;
  activeParticipants?: CallParticipant[];
  
  // WebRTC Signaling fields
  offer?: {
    type: 'offer';
    sdp: string;
  };
  answer?: {
    type: 'answer';
    sdp: string;
  };
  callerIceCandidates?: Array<{
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
  }>;
  calleeIceCandidates?: Array<{
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
  }>;
}

