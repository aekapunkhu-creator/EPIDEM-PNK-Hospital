import { Patient, HouseholdContact, SubdistrictInfo, LineNotificationConfig, NotificationLog, UserAccount, HomeVisitRecord, TbCxrScreeningRecord } from '../types';

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'USR-001',
    username: 'admin',
    password: 'password123',
    fullName: 'แอดมินกลุ่มงานควบคุมโรค รพ.โพนนาแก้ว',
    role: 'Admin',
    hospitalName: 'โรงพยาบาลโพนนาแก้ว',
    phone: '042-123-456',
    createdAt: '2026-01-01'
  },
  {
    id: 'USR-002',
    username: 'staff_nakaeo',
    password: '123456',
    fullName: 'พยาบาลวิชาชีพ รพ.สต.นาแก้ว',
    role: 'Staff',
    subdistrict: 'ตำบลนาแก้ว',
    hospitalName: 'รพ.สต.นาแก้ว',
    phone: '081-999-8888',
    createdAt: '2026-02-15'
  },
  {
    id: 'USR-003',
    username: 'osm_somporn',
    password: '1234',
    fullName: 'นางสมพร สุขสันต์ (อสม. พี่เลี้ยง)',
    role: 'อสม.',
    subdistrict: 'ตำบลนาแก้ว',
    phone: '089-987-6543',
    createdAt: '2026-03-01'
  }
];

export const PHON_NA_KAEO_HEALTH_UNITS = [
  'PCU โรงพยาบาลโพนนาแก้ว',
  'รพ.สต.บ้านนาแก้วน้อย',
  'รพ.สต.บ้านใหม่หนองผือ',
  'รพ.สต.บ้านใหม่ไชยา',
  'รพ.สต.บ้านโพนบก',
  'รพ.สต.บ้านน้ำผุ',
  'รพ.สต.โพนแคน้อย',
  'รพ.สต.บ้านโนนสามัคคี'
];

export const PHON_NA_KAEO_SUBDISTRICTS: SubdistrictInfo[] = [
  {
    code: '471401',
    name: 'ตำบลบ้านโพน',
    lat: 17.085,
    lng: 104.295,
    villagesCount: 9,
    healthUnitsCount: 1,
    population: 7820,
    healthCenterName: 'รพ.สต.บ้านใหม่ไชยา',
    healthUnits: [
      {
        name: 'รพ.สต.บ้านใหม่ไชยา',
        subdistrict: 'ตำบลบ้านโพน',
        villagesCount: 9,
        villages: [
          'หมู่ที่ 1 บ้านอ้อมแก้วใหญ่',
          'หมู่ที่ 2 บ้านโพนน้อย',
          'หมู่ที่ 3 บ้านปู่พิม',
          'หมู่ที่ 4 บ้านโพนใหญ่',
          'หมู่ที่ 5 บ้านวังปลาเซียม',
          'หมู่ที่ 6 บ้านนาจาน',
          'หมู่ที่ 7 บ้านอ้อมแก้วน้อย',
          'หมู่ที่ 8 บ้านใหม่ไชยา',
          'หมู่ที่ 9 บ้านนาจานใหม่'
        ]
      }
    ],
    villages: [
      'หมู่ที่ 1 บ้านอ้อมแก้วใหญ่',
      'หมู่ที่ 2 บ้านโพนน้อย',
      'หมู่ที่ 3 บ้านปู่พิม',
      'หมู่ที่ 4 บ้านโพนใหญ่',
      'หมู่ที่ 5 บ้านวังปลาเซียม',
      'หมู่ที่ 6 บ้านนาจาน',
      'หมู่ที่ 7 บ้านอ้อมแก้วน้อย',
      'หมู่ที่ 8 บ้านใหม่ไชยา',
      'หมู่ที่ 9 บ้านนาจานใหม่'
    ]
  },
  {
    code: '471402',
    name: 'ตำบลบ้านแป้น',
    lat: 17.040,
    lng: 104.320,
    villagesCount: 10,
    healthUnitsCount: 2,
    population: 8450,
    healthCenterName: 'รพ.สต.บ้านโพนบก, รพ.สต.บ้านน้ำผุ',
    healthUnits: [
      {
        name: 'รพ.สต.บ้านโพนบก',
        subdistrict: 'ตำบลบ้านแป้น',
        villagesCount: 6,
        villages: [
          'หมู่ที่ 2 บ้านโพนงามโคก',
          'หมู่ที่ 3 บ้านโพนงามท่า',
          'หมู่ที่ 5 บ้านแป้น',
          'หมู่ที่ 6 บ้านโพนบก',
          'หมู่ที่ 9 บ้านโพนงามโคกใหม่',
          'หมู่ที่ 10 บ้านแป้น'
        ]
      },
      {
        name: 'รพ.สต.บ้านน้ำผุ',
        subdistrict: 'ตำบลบ้านแป้น',
        villagesCount: 4,
        villages: [
          'หมู่ที่ 1 บ้านท่าศาลา',
          'หมู่ที่ 4 บ้านน้ำผุ',
          'หมู่ที่ 7 บ้านจอมแจ้ง',
          'หมู่ที่ 8 บ้านบึงประชาราษฎร์'
        ]
      }
    ],
    villages: [
      'หมู่ที่ 1 บ้านท่าศาลา',
      'หมู่ที่ 2 บ้านโพนงามโคก',
      'หมู่ที่ 3 บ้านโพนงามท่า',
      'หมู่ที่ 4 บ้านน้ำผุ',
      'หมู่ที่ 5 บ้านแป้น',
      'หมู่ที่ 6 บ้านโพนบก',
      'หมู่ที่ 7 บ้านจอมแจ้ง',
      'หมู่ที่ 8 บ้านบึงประชาราษฎร์',
      'หมู่ที่ 9 บ้านโพนงามโคกใหม่',
      'หมู่ที่ 10 บ้านแป้น'
    ]
  },
  {
    code: '471403',
    name: 'ตำบลนาตงวัฒนา',
    lat: 17.090,
    lng: 104.260,
    villagesCount: 12,
    healthUnitsCount: 1,
    population: 9120,
    healthCenterName: 'รพ.สต.โพนแคน้อย',
    healthUnits: [
      {
        name: 'รพ.สต.โพนแคน้อย',
        subdistrict: 'ตำบลนาตงวัฒนา',
        villagesCount: 12,
        villages: [
          'หมู่ที่ 1 บ้านนาตงใหญ่',
          'หมู่ที่ 2 บ้านโพนแคใหญ่',
          'หมู่ที่ 3 บ้านคอนคู่',
          'หมู่ที่ 4 บ้านปุ่งน้อย',
          'หมู่ที่ 5 บ้านปุ่งใหญ่',
          'หมู่ที่ 6 บ้านนาตงน้อย',
          'หมู่ที่ 7 บ้านป่าพาง',
          'หมู่ที่ 8 บ้านบึงศาลา',
          'หมู่ที่ 9 บ้านโพนแคน้อย',
          'หมู่ที่ 10 บ้านปุ่งวัฒนา',
          'หมู่ที่ 11 บ้านโพนแคกลาง',
          'หมู่ที่ 12 บ้านโพนนาแก้ว'
        ]
      }
    ],
    villages: [
      'หมู่ที่ 1 บ้านนาตงใหญ่',
      'หมู่ที่ 2 บ้านโพนแคใหญ่',
      'หมู่ที่ 3 บ้านคอนคู่',
      'หมู่ที่ 4 บ้านปุ่งน้อย',
      'หมู่ที่ 5 บ้านปุ่งใหญ่',
      'หมู่ที่ 6 บ้านนาตงน้อย',
      'หมู่ที่ 7 บ้านป่าพาง',
      'หมู่ที่ 8 บ้านบึงศาลา',
      'หมู่ที่ 9 บ้านโพนแคน้อย',
      'หมู่ที่ 10 บ้านปุ่งวัฒนา',
      'หมู่ที่ 11 บ้านโพนแคกลาง',
      'หมู่ที่ 12 บ้านโพนนาแก้ว'
    ]
  },
  {
    code: '471404',
    name: 'ตำบลเชียงเสือ',
    lat: 17.025,
    lng: 104.270,
    villagesCount: 8,
    healthUnitsCount: 1,
    population: 6980,
    healthCenterName: 'รพ.สต.บ้านโนนสามัคคี',
    healthUnits: [
      {
        name: 'รพ.สต.บ้านโนนสามัคคี',
        subdistrict: 'ตำบลเชียงเสือ',
        villagesCount: 8,
        villages: [
          'หมู่ที่ 1 บ้านเชียงเสือใหญ่',
          'หมู่ที่ 2 บ้านเชียงเสือน้อย',
          'หมู่ที่ 3 บ้านโนนกุง',
          'หมู่ที่ 4 บ้านท่าสาวคอย',
          'หมู่ที่ 5 บ้านอุดมวัฒนา',
          'หมู่ที่ 6 บ้านโนนสามัคคี',
          'หมู่ที่ 7 บ้านโนนประดู่',
          'หมู่ที่ 8 บ้านโนนกุงพัฒนา'
        ]
      }
    ],
    villages: [
      'หมู่ที่ 1 บ้านเชียงเสือใหญ่',
      'หมู่ที่ 2 บ้านเชียงเสือน้อย',
      'หมู่ที่ 3 บ้านโนนกุง',
      'หมู่ที่ 4 บ้านท่าสาวคอย',
      'หมู่ที่ 5 บ้านอุดมวัฒนา',
      'หมู่ที่ 6 บ้านโนนสามัคคี',
      'หมู่ที่ 7 บ้านโนนประดู่',
      'หมู่ที่ 8 บ้านโนนกุงพัฒนา'
    ]
  },
  {
    code: '471405',
    name: 'ตำบลนาแก้ว',
    lat: 17.060,
    lng: 104.280,
    villagesCount: 14,
    healthUnitsCount: 3,
    population: 11450,
    healthCenterName: 'PCU รพ.โพนนาแก้ว, รพ.สต.บ้านนาแก้วน้อย, รพ.สต.บ้านใหม่หนองผือ',
    healthUnits: [
      {
        name: 'PCU โรงพยาบาลโพนนาแก้ว',
        subdistrict: 'ตำบลนาแก้ว',
        villagesCount: 4,
        villages: [
          'หมู่ที่ 2 บ้านนาเดื่อ',
          'หมู่ที่ 3 บ้านกลาง',
          'หมู่ที่ 10 บ้านกลางใหม่',
          'หมู่ที่ 11 บ้านนาเดื่อน้อย'
        ]
      },
      {
        name: 'รพ.สต.บ้านนาแก้วน้อย',
        subdistrict: 'ตำบลนาแก้ว',
        villagesCount: 4,
        villages: [
          'หมู่ที่ 1 บ้านนาแก้ว',
          'หมู่ที่ 9 บ้านนาแก้วน้อย',
          'หมู่ที่ 13 บ้านนาแก้วเหนือ',
          'หมู่ที่ 14 บ้านนาแก้วสามัคคี'
        ]
      },
      {
        name: 'รพ.สต.บ้านใหม่หนองผือ',
        subdistrict: 'ตำบลนาแก้ว',
        villagesCount: 6,
        villages: [
          'หมู่ที่ 4 บ้านหนองผือ',
          'หมู่ที่ 5 บ้านหนองกระบอก',
          'หมู่ที่ 6 บ้านโคกแก้ว',
          'หมู่ที่ 7 บ้านเทพนิมิต',
          'หมู่ที่ 8 บ้านใหม่หนองผือ',
          'หมู่ที่ 12 บ้านหนองกระบอกใหม่'
        ]
      }
    ],
    villages: [
      'หมู่ที่ 1 บ้านนาแก้ว',
      'หมู่ที่ 2 บ้านนาเดื่อ',
      'หมู่ที่ 3 บ้านกลาง',
      'หมู่ที่ 4 บ้านหนองผือ',
      'หมู่ที่ 5 บ้านหนองกระบอก',
      'หมู่ที่ 6 บ้านโคกแก้ว',
      'หมู่ที่ 7 บ้านเทพนิมิต',
      'หมู่ที่ 8 บ้านใหม่หนองผือ',
      'หมู่ที่ 9 บ้านนาแก้วน้อย',
      'หมู่ที่ 10 บ้านกลางใหม่',
      'หมู่ที่ 11 บ้านนาเดื่อน้อย',
      'หมู่ที่ 12 บ้านหนองกระบอกใหม่',
      'หมู่ที่ 13 บ้านนาแก้วเหนือ',
      'หมู่ที่ 14 บ้านนาแก้วสามัคคี'
    ]
  }
];

// Helper to generate past dates
const getDateDaysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

const getDateDaysAhead = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const INITIAL_PATIENTS: Patient[] = [];

export const INITIAL_CONTACTS: HouseholdContact[] = [];

export const INITIAL_HOME_VISITS: HomeVisitRecord[] = [];

export const getVillagesForSubdistrict = (subdistrictName: string): string[] => {
  const found = PHON_NA_KAEO_SUBDISTRICTS.find(s => s.name === subdistrictName);
  return found ? found.villages : [];
};

export const getHealthUnitsForSubdistrict = (subdistrictName: string): string[] => {
  const found = PHON_NA_KAEO_SUBDISTRICTS.find(s => s.name === subdistrictName);
  if (!found) return PHON_NA_KAEO_HEALTH_UNITS;
  return found.healthUnits.map(h => h.name);
};

export const INITIAL_LINE_CONFIG: LineNotificationConfig = {
  mode: 'messaging_api',
  channelAccessToken: 'SAMPLE_LINE_OA_CHANNEL_ACCESS_TOKEN_PHONNAKAEO_TB',
  targetGroupId: 'C1234567890abcdef1234567890abcde',
  token: 'SAMPLE_LINE_NOTIFY_TOKEN_PHONNAKAEO_TB',
  autoDailyReminders: true,
  reminderTime: '08:00',
  autoAppointmentReminders: true,
  alertOnMissedDoses: true,
  missedThresholdDays: 2,
  lineGroupName: 'กลุ่มงานควบคุมวัณโรค อ.โพนนาแก้ว (สสอ./รพ./รพ.สต./อสม.)'
};

export const INITIAL_LOGS: NotificationLog[] = [];

export const INITIAL_TBCXR_SCREENINGS: TbCxrScreeningRecord[] = [
  {
    id: 'CXR-67-001',
    screeningDate: '2026-03-12',
    screeningCampaign: 'รถเอกซเรย์ระบบดิจิทัลพระราชทาน',
    screeningFacility: 'รพ.โพนนาแก้ว',
    riskGroup: 'contact',
    riskGroupSpecificDetail: 'ผู้สัมผัสร่วมบ้านผู้ป่วยวัณโรคปอดเสมหะบวก (HN: 67-0482)',
    indexPatientHN: '67-0482',
    indexPatientName: 'นายสมชาย บุญมี',
    hn: '67-1042',
    idCard: '3-4714-00123-45-1',
    prefix: 'นาง',
    firstName: 'สายสมร',
    lastName: 'บุญมี',
    age: 48,
    gender: 'หญิง',
    phone: '081-234-5678',
    subdistrict: 'ตำบลบ้านโพน',
    village: 'บ้านใหม่ไชยา หมู่ 4',
    houseNo: '45/1',
    symptoms: {
      coughOver2Weeks: true,
      fever: true,
      nightSweats: false,
      weightLoss: true,
      hemoptysis: false
    },
    hasAnySymptom: true,
    cxrDate: '2026-03-12',
    cxrResult: 'Abnormal TB Suspect',
    cxrAbnormalPattern: 'Infiltration / Patchy',
    cxrDetails: 'พบ Reticulonodular infiltration ที่ Right Upper Lobe (RUL) สงสัย Active pulmonary TB',
    cxrAiScore: 84,
    radiologistName: 'พญ.ชญานิศ (รังสีแพทย์ รพ.ศูนย์สกลนคร)',
    mtbTestDone: true,
    mtbTestType: 'GeneXpert Ultra',
    mtbTestDate: '2026-03-14',
    mtbResult: 'MTB detected, Rif Resistance not detected',
    mtbLabNumber: 'XPT-67/0312',
    specimenType: 'Sputum (เสมหะ)',
    diagnosisStatus: 'วัณโรคปอด (Active TB - เข้าเกณฑ์รักษา)',
    actionPlan: 'เริ่มยารักษาวัณโรค (Active TB Treatment)',
    activeTbRegimen: '2HRZE/4HR',
    treatmentStartDate: '2026-03-15',
    transferredToPatientRegistry: true,
    transferredPatientId: 'TB-6701',
    notes: 'พบเชื้อ MTB ไวต่อยา Rifampicin ส่งต่อขึ้นทะเบียนรับยาที่คลินิกวัณโรค รพ.โพนนาแก้ว เรียบร้อยแล้ว',
    screenerName: 'พว.รุ่งทิพย์ สถิตย์พงษ์',
    screenerRole: 'พยาบาลวิชาชีพชำนาญการ',
    createdAt: '2026-03-12T09:30:00Z',
    updatedAt: '2026-03-15T11:00:00Z'
  },
  {
    id: 'CXR-67-002',
    screeningDate: '2026-03-15',
    screeningCampaign: 'คัดกรองเชิงรุกกลุ่มเปราะบาง',
    screeningFacility: 'สถานคุ้มครองคนพิการ/รพ.สต.บ้านนาแก้วน้อย',
    riskGroup: 'inmate_welfare',
    riskGroupSpecificDetail: 'ผู้อาศัยในสถานคุ้มครองและพัฒนาคนพิการ หอพักรวม',
    hn: '67-1088',
    idCard: '1-4714-00234-56-2',
    prefix: 'นาย',
    firstName: 'เกรียงไกร',
    lastName: 'ยอดมงคล',
    age: 39,
    gender: 'ชาย',
    phone: '089-876-5432',
    subdistrict: 'ตำบลนาแก้ว',
    village: 'บ้านนาแก้ว หมู่ 2',
    houseNo: '88/2',
    symptoms: {
      coughOver2Weeks: true,
      fever: false,
      nightSweats: true,
      weightLoss: true,
      hemoptysis: false
    },
    hasAnySymptom: true,
    cxrDate: '2026-03-15',
    cxrResult: 'Abnormal TB Suspect',
    cxrAbnormalPattern: 'Cavity',
    cxrDetails: 'พบ Thin-walled cavity ขนาด 2.1 ซม. พร้อม infiltration ที่ Left Apical zone',
    cxrAiScore: 92,
    radiologistName: 'นพ.เกียรติศักดิ์ รังสีแพทย์',
    mtbTestDone: true,
    mtbTestType: 'GeneXpert MTB/RIF',
    mtbTestDate: '2026-03-17',
    mtbResult: 'MTB detected, Rif Resistance detected',
    mtbLabNumber: 'XPT-67/0345',
    specimenType: 'Sputum (เสมหะ)',
    diagnosisStatus: 'วัณโรคปอด (Active TB - เข้าเกณฑ์รักษา)',
    actionPlan: 'ส่งต่ออายุรแพทย์/แพทย์เฉพาะทาง',
    activeTbRegimen: 'สูตรวัณโรคดื้อยา BPaLM (รพ.ศูนย์)',
    treatmentStartDate: '2026-03-18',
    transferredToPatientRegistry: false,
    notes: 'ด่วน! ผล GeneXpert พบเชื้อ MTB ดื้อยา Rifampicin (RR-TB) ส่งต่อทีม MDR-TB รพ.สกลนคร ทันที แยกห้องเดี่ยว',
    screenerName: 'นายประสิทธิ์ มั่นคง',
    screenerRole: 'นักวิชาการสาธารณสุข',
    createdAt: '2026-03-15T10:15:00Z',
    updatedAt: '2026-03-18T08:45:00Z'
  },
  {
    id: 'CXR-67-003',
    screeningDate: '2026-03-18',
    screeningCampaign: 'คัดกรองประจำปีคลินิกยาต้านไวรัส (ARV Clinic)',
    screeningFacility: 'คลินิกให้คำปรึกษา รพ.โพนนาแก้ว',
    riskGroup: 'hiv',
    riskGroupSpecificDetail: 'ผู้ติดเชื้อเอชไอวี (HIV) ได้รับยา ARV, CD4 280 cells/uL',
    hn: '67-0912',
    idCard: '2-4714-00345-67-3',
    prefix: 'นางสาว',
    firstName: 'มยุรี',
    lastName: 'จันทรโคตร',
    age: 34,
    gender: 'หญิง',
    phone: '087-654-3210',
    subdistrict: 'ตำบลบ้านแป้น',
    village: 'บ้านแป้น หมู่ 1',
    houseNo: '12',
    symptoms: {
      coughOver2Weeks: false,
      fever: false,
      nightSweats: false,
      weightLoss: false,
      hemoptysis: false
    },
    hasAnySymptom: false,
    cxrDate: '2026-03-18',
    cxrResult: 'Normal',
    cxrAbnormalPattern: 'None',
    cxrDetails: 'CXR ปกติ ไม่พบ Infiltration หรือ Cavity',
    cxrAiScore: 12,
    radiologistName: 'พญ.ชญานิศ',
    mtbTestDone: false,
    mtbTestType: 'ยังไม่ได้ตรวจ',
    mtbResult: 'Not Done',
    diagnosisStatus: 'วัณโรคระยะแฝง (LTBI - พิจารณา TPT)',
    actionPlan: 'เริ่มยาป้องกันวัณโรค (TPT: 3HP/1HP/6H)',
    tptRegimen: '3HP',
    treatmentStartDate: '2026-03-20',
    transferredToPatientRegistry: false,
    notes: 'CXR ปกติ ไม่มีอาการสงสัยวัณโรค เข้าเกณฑ์รับยาป้องกันการติดเชื้อวัณโรคสูตร 3HP (Rifapentine + Isoniazid สัปดาห์ละครั้ง นาน 12 สัปดาห์)',
    screenerName: 'พว.สุดารัตน์ พูลศรี',
    screenerRole: 'พยาบาลวิชาชีพ คลินิก ARV',
    createdAt: '2026-03-18T14:00:00Z',
    updatedAt: '2026-03-20T10:00:00Z'
  },
  {
    id: 'CXR-67-004',
    screeningDate: '2026-03-22',
    screeningCampaign: 'คัดกรองคลินิก NCD เชิงรุก',
    screeningFacility: 'รพ.สต.บ้านใหม่ไชยา',
    riskGroup: 'immunocompromised',
    riskGroupSpecificDetail: 'ผู้ป่วยเบาหวานคุมไม่ได้ HbA1C 9.4% ร่วมกับโรคไตเรื้อรัง (CKD Stage 3a)',
    hn: '67-1150',
    idCard: '3-4714-00456-78-4',
    prefix: 'นาย',
    firstName: 'บุญมี',
    lastName: 'คำสิงห์',
    age: 58,
    gender: 'ชาย',
    phone: '085-111-2233',
    subdistrict: 'ตำบลบ้านโพน',
    village: 'บ้านโพนบก หมู่ 3',
    houseNo: '67',
    symptoms: {
      coughOver2Weeks: true,
      fever: true,
      nightSweats: true,
      weightLoss: true,
      hemoptysis: false
    },
    hasAnySymptom: true,
    cxrDate: '2026-03-22',
    cxrResult: 'Abnormal TB Suspect',
    cxrAbnormalPattern: 'Infiltration / Patchy',
    cxrDetails: 'พบ Patchy infiltrates ที่ Bilateral mid-to-lower lung field สงสัย TB ในผู้ป่วยเบาหวาน',
    cxrAiScore: 78,
    radiologistName: 'นพ.เกียรติศักดิ์ รังสีแพทย์',
    mtbTestDone: true,
    mtbTestType: 'GeneXpert Ultra',
    mtbTestDate: '2026-03-23',
    mtbResult: 'MTB detected, Rif Resistance not detected',
    mtbLabNumber: 'XPT-67/0398',
    specimenType: 'Sputum (เสมหะ)',
    diagnosisStatus: 'วัณโรคปอด (Active TB - เข้าเกณฑ์รักษา)',
    actionPlan: 'เริ่มยารักษาวัณโรค (Active TB Treatment)',
    activeTbRegimen: '2HRZE/4HR (ปรับตาม CrCl)',
    treatmentStartDate: '2026-03-24',
    transferredToPatientRegistry: true,
    notes: 'พบเชื้อ MTB ไวต่อ Rifampicin เริ่มยา 2HRZE ร่วมกับปรับยาเบาหวานและติดตามฟังก์ชันไต',
    screenerName: 'นางมณีรัตน์ วงศ์คำ',
    screenerRole: 'พยาบาลวิชาชีพ รพ.สต.',
    createdAt: '2026-03-22T11:20:00Z',
    updatedAt: '2026-03-24T16:00:00Z'
  },
  {
    id: 'CXR-67-005',
    screeningDate: '2026-03-25',
    screeningCampaign: 'คัดกรองผู้สูงอายุกลุ่มเสี่ยงประจำปี',
    screeningFacility: 'รพ.สต.บ้านน้ำผุ',
    riskGroup: 'elderly_comorbid',
    riskGroupSpecificDetail: 'ผู้สูงอายุ 73 ปี มีโรคร่วม COPD และเบาหวานชนิดที่ 2',
    hn: '67-1221',
    idCard: '5-4714-00567-89-5',
    prefix: 'นาย',
    firstName: 'สมหมาย',
    lastName: 'ศรีสุวรรณ',
    age: 73,
    gender: 'ชาย',
    phone: '083-456-7890',
    subdistrict: 'ตำบลเชียงเสือ',
    village: 'บ้านเชียงเสือ หมู่ 5',
    houseNo: '102',
    symptoms: {
      coughOver2Weeks: true,
      fever: false,
      nightSweats: false,
      weightLoss: true,
      hemoptysis: true
    },
    hasAnySymptom: true,
    cxrDate: '2026-03-25',
    cxrResult: 'Abnormal TB Suspect',
    cxrAbnormalPattern: 'Nodule / Mass',
    cxrDetails: 'พบ Nodular opacity with surrounding infiltrates ที่ Right Upper Lobe ไอเป็นเลือดปน',
    cxrAiScore: 88,
    radiologistName: 'พญ.ชญานิศ รังสีแพทย์',
    mtbTestDone: true,
    mtbTestType: 'GeneXpert MTB/RIF',
    mtbTestDate: '2026-03-26',
    mtbResult: 'Pending',
    mtbLabNumber: 'XPT-67/0410',
    specimenType: 'Sputum (เสมหะ)',
    diagnosisStatus: 'รอผลตรวจยืนยัน',
    actionPlan: 'รอผลชันสูตร/เพาะเชื้อ',
    transferredToPatientRegistry: false,
    notes: 'ส่งเสมหะตรวจ GeneXpert และ AFB รพ.โพนนาแก้ว อยู่ระหว่างรอผลแล็บภายใน 24 ชม.',
    screenerName: 'นายวิเชียร สมใจ',
    screenerRole: 'นักวิชาการสาธารณสุข',
    createdAt: '2026-03-25T13:40:00Z',
    updatedAt: '2026-03-26T09:00:00Z'
  },
  {
    id: 'CXR-67-006',
    screeningDate: '2026-03-28',
    screeningCampaign: 'คัดกรองผู้ใช้สารเสพติดและผู้ติดสุราเรื้อรัง',
    screeningFacility: 'ศูนย์คัดกรองชุมชน รพ.สต.โพนแคน้อย',
    riskGroup: 'substance_alcohol',
    riskGroupSpecificDetail: 'ผู้ติดสุราเรื้อรัง ดื่มสุราขาวทุกวัน มีภาวะทุพโภชนาการ BMI 16.2',
    hn: '67-1304',
    idCard: '3-4714-00678-90-6',
    prefix: 'นาย',
    firstName: 'ทวีศักดิ์',
    lastName: 'จันทรัตน์',
    age: 51,
    gender: 'ชาย',
    phone: '084-555-6677',
    subdistrict: 'ตำบลนาตงวัฒนา',
    village: 'บ้านนาตง หมู่ 6',
    houseNo: '55/3',
    symptoms: {
      coughOver2Weeks: true,
      fever: true,
      nightSweats: true,
      weightLoss: true,
      hemoptysis: false
    },
    hasAnySymptom: true,
    cxrDate: '2026-03-28',
    cxrResult: 'Abnormal TB Suspect',
    cxrAbnormalPattern: 'Pleural Effusion',
    cxrDetails: 'พบ Right Pleural Effusion ร่วมกับ Infiltration บริเวณ RML และ RLL',
    cxrAiScore: 82,
    radiologistName: 'นพ.เกียรติศักดิ์ รังสีแพทย์',
    mtbTestDone: true,
    mtbTestType: 'GeneXpert MTB/RIF',
    mtbTestDate: '2026-03-29',
    mtbResult: 'MTB detected, Rif Resistance not detected',
    mtbLabNumber: 'XPT-67/0445',
    specimenType: 'Sputum (เสมหะ)',
    diagnosisStatus: 'วัณโรคปอด (Active TB - เข้าเกณฑ์รักษา)',
    actionPlan: 'เริ่มยารักษาวัณโรค (Active TB Treatment)',
    activeTbRegimen: '2HRZE/4HR',
    treatmentStartDate: '2026-03-30',
    transferredToPatientRegistry: false,
    notes: 'ตรวจพบเชื้อ MTB ไวต่อยา Rifampicin จัดพี่เลี้ยง อสม. ติดตามกำกับการกินยาทุกวัน (DOTS เคร่งครัด)',
    screenerName: 'นางกาญจนา แก้วมณี',
    screenerRole: 'พยาบาลวิชาชีพ',
    createdAt: '2026-03-28T10:00:00Z',
    updatedAt: '2026-03-30T11:30:00Z'
  },
  {
    id: 'CXR-67-007',
    screeningDate: '2026-04-02',
    screeningCampaign: 'ตรวจสุขภาพประจำปีบุคลากรสาธารณสุข',
    screeningFacility: 'กลุ่มงานอาชีวเวชกรรม รพ.โพนนาแก้ว',
    riskGroup: 'healthcare_worker',
    riskGroupSpecificDetail: 'พยาบาลวิชาชีพ แผนกอุบัติเหตุ-ฉุกเฉิน (ER) และคลินิก ARI/TB',
    hn: '67-0024',
    idCard: '3-4714-00789-01-7',
    prefix: 'นางสาว',
    firstName: 'อารียา',
    lastName: 'จิตรจำนงค์',
    age: 29,
    gender: 'หญิง',
    phone: '086-777-8899',
    subdistrict: 'ตำบลบ้านโพน',
    village: 'บ้านโพน หมู่ 1',
    houseNo: '9/1',
    symptoms: {
      coughOver2Weeks: false,
      fever: false,
      nightSweats: false,
      weightLoss: false,
      hemoptysis: false
    },
    hasAnySymptom: false,
    cxrDate: '2026-04-02',
    cxrResult: 'Normal',
    cxrAbnormalPattern: 'None',
    cxrDetails: 'CXR ปกติ หัวใจและปอดไม่มีความผิดปกติ',
    cxrAiScore: 8,
    radiologistName: 'พญ.ชญานิศ รังสีแพทย์',
    mtbTestDone: false,
    mtbTestType: 'ยังไม่ได้ตรวจ',
    mtbResult: 'Not Done',
    diagnosisStatus: 'ไม่พบวัณโรค (Normal / Non-TB)',
    actionPlan: 'สุขศึกษาและติดตามอาการ',
    transferredToPatientRegistry: false,
    notes: 'ผลการตรวจเอกซเรย์ปอดปกติ สุขภาพแข็งแรง แนะนำสวมใส่หน้ากาก N95 ตลอดการปฏิบัติงานดูแลผู้ป่วยกลุ่มทางเดินหายใจ',
    screenerName: 'นพ.วีรพงษ์ สว่างวงศ์',
    screenerRole: 'แพทย์อาชีวเวชศาสตร์',
    createdAt: '2026-04-02T08:30:00Z',
    updatedAt: '2026-04-02T15:00:00Z'
  }
];


