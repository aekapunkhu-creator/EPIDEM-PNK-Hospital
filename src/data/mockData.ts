import { Patient, HouseholdContact, SubdistrictInfo, LineNotificationConfig, NotificationLog, UserAccount, HomeVisitRecord } from '../types';

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

