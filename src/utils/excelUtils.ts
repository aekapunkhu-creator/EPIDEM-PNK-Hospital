import * as XLSX from 'xlsx';
import { Patient, HouseholdContact, TBType, TreatmentStatus, CXRResult, SputumResultStatus, ContactOutcome } from '../types';
import { normalizeTreatmentStatus } from './statusUtils';

/**
 * 1. สร้างและดาวน์โหลดไฟล์เทมเพลต Excel สำหรับผู้ป่วยวัณโรค (TB Patients Template)
 */
export function downloadPatientExcelTemplate() {
  const headers = [
    'HN',
    'เลขบัตรประชาชน',
    'คำนำหน้า',
    'ชื่อ',
    'นามสกุล',
    'เพศ',
    'อายุ',
    'เบอร์โทรศัพท์',
    'ตำบล',
    'หมู่บ้าน',
    'บ้านเลขที่',
    'Latitude',
    'Longitude',
    'ประเภทโรค',
    'สูตรยารักษา',
    'สถานะการรักษา',
    'ผู้ดูแลDOTS',
    'ตำแหน่งผู้ดูแล',
    'เบอร์ผู้ดูแล'
  ];

  const sampleRows = [
    [
      'HN-670101',
      '1471400123456',
      'นาย',
      'สมชาย',
      'โพนนาแก้ว',
      'ชาย',
      54,
      '081-234-5678',
      'ตำบลนาแก้ว',
      'หมู่ 1 บ้านนาแก้ว',
      '12/1',
      17.06520,
      104.28850,
      'Pulmonary Smear+',
      '2HRZE/4HR',
      'อยู่ระหว่างรักษา (Active)',
      'นางสมพร (อสม.)',
      'อสม. พี่เลี้ยง',
      '089-111-2222'
    ],
    [
      'HN-670102',
      '1471400654321',
      'นาง',
      'บุญมี',
      'ศรีสว่าง',
      'หญิง',
      62,
      '082-987-6543',
      'ตำบลบ้านโพน',
      'หมู่ 2 บ้านโพน',
      '45',
      17.07890,
      104.29540,
      'Pulmonary Smear-',
      '2HRZE/4HR',
      'รักษาครบกำหนด (Completed)',
      'พยาบาล รพ.สต.',
      'เจ้าหน้าที่ รพ.สต.',
      '089-333-4444'
    ]
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, // HN
    { wch: 18 }, // ID Card
    { wch: 10 }, // Prefix
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 8 },  // Gender
    { wch: 8 },  // Age
    { wch: 15 }, // Phone
    { wch: 16 }, // Subdistrict
    { wch: 20 }, // Village
    { wch: 12 }, // HouseNo
    { wch: 12 }, // Lat
    { wch: 12 }, // Lng
    { wch: 20 }, // TBType
    { wch: 14 }, // Regimen
    { wch: 24 }, // Status
    { wch: 20 }, // Supervisor
    { wch: 18 }, // SupervisorRole
    { wch: 15 }  // SupervisorPhone
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ทะเบียนผู้ป่วยวัณโรค');

  // Generate blob and download
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `เทมเพลต_นำเข้าทะเบียนผู้ป่วยวัณโรค_อ_โพนนาแก้ว.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 2. สร้างและดาวน์โหลดไฟล์เทมเพลต Excel สำหรับคัดกรองผู้สัมผัสร่วมบ้าน (Contact Tracing Template)
 */
export function downloadContactExcelTemplate() {
  const headers = [
    'HNผู้ป่วยดัชนี',
    'ชื่อผู้ป่วยดัชนี',
    'คำนำหน้า',
    'ชื่อผู้สัมผัส',
    'นามสกุล',
    'เพศ',
    'อายุ',
    'ความสัมพันธ์',
    'เบอร์โทรศัพท์',
    'ตำบล',
    'หมู่บ้าน',
    'ผลตรวจCXR',
    'ผลตรวจเสมหะAFB',
    'ผลการคัดกรอง',
    'สูตรยาTPT'
  ];

  const sampleRows = [
    [
      'HN-670101',
      'นายสมชาย โพนนาแก้ว',
      'นาง',
      'สมศรี',
      'โพนนาแก้ว',
      'หญิง',
      50,
      'สามี/ภรรยา',
      '081-222-3333',
      'ตำบลนาแก้ว',
      'หมู่ 1 บ้านนาแก้ว',
      'Normal',
      'Negative',
      'Cleared',
      '3HP'
    ],
    [
      'HN-670101',
      'นายสมชาย โพนนาแก้ว',
      'ด.ช.',
      'อนุวัตร',
      'โพนนาแก้ว',
      'ชาย',
      4,
      'บุตร',
      '081-234-5678',
      'ตำบลนาแก้ว',
      'หมู่ 1 บ้านนาแก้ว',
      'Normal',
      'Negative',
      'TPT Initiated',
      '3HP'
    ]
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 16 }, // Index HN
    { wch: 22 }, // Index Patient Name
    { wch: 10 }, // Prefix
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 8 },  // Gender
    { wch: 8 },  // Age
    { wch: 16 }, // Relationship
    { wch: 15 }, // Phone
    { wch: 16 }, // Subdistrict
    { wch: 20 }, // Village
    { wch: 14 }, // CXR Result
    { wch: 16 }, // AFB Result
    { wch: 18 }, // Screening Outcome
    { wch: 12 }  // TPT Regimen
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ทะเบียนผู้สัมผัส');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `เทมเพลต_นำเข้าทะเบียนผู้สัมผัสวัณโรค_อ_โพนนาแก้ว.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper to match object key flexibly
 */
function getValue(row: Record<string, any>, possibleKeys: string[]): any {
  const rowKeys = Object.keys(row);
  for (const pKey of possibleKeys) {
    const matched = rowKeys.find(k => k.trim().toLowerCase().replace(/\s+/g, '') === pKey.trim().toLowerCase().replace(/\s+/g, ''));
    if (matched && row[matched] !== undefined && row[matched] !== null && row[matched] !== '') {
      return row[matched];
    }
  }
  return undefined;
}

export interface ParseExcelResult {
  patients: Patient[];
  contacts: HouseholdContact[];
  errors: string[];
}

/**
 * 3. อ่านและแปลงข้อมูลไฟล์ Excel (.xlsx, .xls, .csv)
 */
export async function parseExcelFile(file: File): Promise<ParseExcelResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const patients: Patient[] = [];
        const contacts: HouseholdContact[] = [];
        const errors: string[] = [];

        const todayStr = new Date().toISOString().split('T')[0];

        // Process each sheet in workbook
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (rawRows.length === 0) return;

          rawRows.forEach((row, idx) => {
            // Check if row is Patient or Contact
            const hn = getValue(row, ['hn', 'เลขhn', 'หมายเลขhn', 'hnผู้ป่วย', 'hnผู้ป่วยดัชนี']);
            const firstName = getValue(row, ['ชื่อ', 'ชื่อผู้ป่วย', 'ชื่อผู้สัมผัส', 'firstname']);
            const lastName = getValue(row, ['นามสกุล', 'lastname']);
            const relationship = getValue(row, ['ความสัมพันธ์', 'relationship']);

            if (!firstName || !lastName) {
              return; // Skip empty rows
            }

            // If it has 'ความสัมพันธ์' or sheetName has 'สัมผัส' / 'Contact', treat as Household Contact
            if (relationship || sheetName.includes('สัมผัส') || sheetName.toLowerCase().includes('contact')) {
              const contactId = `CNT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
              const indexHn = hn || 'HN-UNK';
              const indexName = getValue(row, ['ชื่อผู้ป่วยดัชนี', 'ผู้ป่วยดัชนี', 'indexpatientname']) || 'ผู้ป่วยวัณโรค';

              const contact: HouseholdContact = {
                id: contactId,
                indexPatientId: `TB-${indexHn}`,
                indexPatientName: indexName,
                indexPatientHN: String(indexHn),
                idCard: String(getValue(row, ['เลขบัตรประชาชน', 'เลขประจำตัวประชาชน', 'idcard']) || '1471400000000'),
                prefix: String(getValue(row, ['คำนำหน้า', 'prefix']) || 'นาย'),
                firstName: String(firstName).trim(),
                lastName: String(lastName).trim(),
                age: Number(getValue(row, ['อายุ', 'age'])) || 30,
                gender: String(getValue(row, ['เพศ', 'gender'])).includes('หญิง') ? 'หญิง' : 'ชาย',
                relationship: String(relationship || 'ผู้สัมผัสร่วมบ้าน') as any,
                phone: String(getValue(row, ['เบอร์โทร', 'เบอร์โทรศัพท์', 'phone']) || '-'),
                subdistrict: String(getValue(row, ['ตำบล', 'subdistrict']) || 'ตำบลนาแก้ว'),
                village: String(getValue(row, ['หมู่บ้าน', 'village']) || 'หมู่ 1'),
                riskFactors: ['ผู้สัมผัสร่วมบ้านใกล้ชิด'],
                symptoms: {
                  coughOver2Weeks: false,
                  fever: false,
                  nightSweats: false,
                  weightLoss: false,
                  haemoptysis: false
                },
                screeningDate: todayStr,
                cxrResult: (getValue(row, ['ผลตรวจcxr', 'cxr', 'cxrresult']) || 'Normal') as CXRResult,
                afbResult: (getValue(row, ['ผลตรวจเสมหะafb', 'afb', 'afbresult']) || 'Negative') as SputumResultStatus,
                outcome: (getValue(row, ['ผลการคัดกรอง', 'outcome']) || 'Cleared') as ContactOutcome,
                tptRegimen: String(getValue(row, ['สูตรยาtpt', 'tptregimen', 'tpt']) || '3HP')
              };

              contacts.push(contact);
            } else {
              // Patient Record
              const patientHN = String(hn || `HN-${Math.floor(100000 + Math.random() * 900000)}`);
              const tbTypeVal = getValue(row, ['ประเภทโรค', 'ประเภทโรควัณโรค', 'tbtype']);
              let tbType: TBType = 'Pulmonary Smear+';
              if (tbTypeVal) {
                const str = String(tbTypeVal).toLowerCase();
                if (str.includes('smear-') || str.includes('ไม่พบเชื้อ')) tbType = 'Pulmonary Smear-';
                else if (str.includes('extra') || str.includes('นอกปอด')) tbType = 'Extra-Pulmonary';
              }

              const latVal = Number(getValue(row, ['latitude', 'lat', 'ละติจูด', 'พิกัดlat']));
              const lngVal = Number(getValue(row, ['longitude', 'lng', 'ลองจิจูด', 'พิกัดlng']));

              const patient: Patient = {
                id: `TB-${patientHN.replace(/[^a-zA-Z0-9]/g, '')}`,
                hn: patientHN,
                idCard: String(getValue(row, ['เลขบัตรประชาชน', 'เลขประจำตัวประชาชน', 'idcard']) || '1471400000000'),
                prefix: String(getValue(row, ['คำนำหน้า', 'prefix']) || 'นาย'),
                firstName: String(firstName).trim(),
                lastName: String(lastName).trim(),
                gender: String(getValue(row, ['เพศ', 'gender'])).includes('หญิง') ? 'หญิง' : 'ชาย',
                age: Number(getValue(row, ['อายุ', 'age'])) || 40,
                phone: String(getValue(row, ['เบอร์โทร', 'เบอร์โทรศัพท์', 'phone']) || '-'),
                subdistrict: String(getValue(row, ['ตำบล', 'subdistrict']) || 'ตำบลนาแก้ว'),
                village: String(getValue(row, ['หมู่บ้าน', 'village']) || 'หมู่ 1'),
                houseNo: String(getValue(row, ['บ้านเลขที่', 'houseno']) || ''),
                tbType,
                regimen: String(getValue(row, ['สูตรยา', 'สูตรยารักษา', 'regimen']) || '2HRZE/4HR'),
                registrationDate: todayStr,
                treatmentStartDate: todayStr,
                expectedEndDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
                dotsSupervisorName: String(getValue(row, ['ผู้ดูแลdots', 'ผู้ดูแล', 'อสม', 'supervisor']) || 'เจ้าหน้าที่ รพ.สต.'),
                dotsSupervisorRole: String(getValue(row, ['ตำแหน่งผู้ดูแล', 'supervisorrole']) || 'อสม. พี่เลี้ยง') as any,
                dotsSupervisorPhone: String(getValue(row, ['เบอร์ผู้ดูแล', 'supervisorphone']) || '-'),
                status: normalizeTreatmentStatus(getValue(row, ['สถานะการรักษา', 'สถานะ', 'status', 'ผลการรักษา', 'treatmentstatus'])),
                lat: latVal || 17.06520,
                lng: lngVal || 104.28850,
                sputumRecords: [
                  { monthLabel: ' Baseline (เดือน 0)', monthNum: 0, dueDate: todayStr, testDate: todayStr, result: '1+' },
                  { monthLabel: 'เดือนที่ 2', monthNum: 2, dueDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0], result: 'Pending' },
                  { monthLabel: 'เดือนที่ 5', monthNum: 5, dueDate: new Date(Date.now() + 150 * 86400000).toISOString().split('T')[0], result: 'Pending' },
                  { monthLabel: 'เดือนที่ 6/8', monthNum: 6, dueDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0], result: 'Pending' }
                ],
                dotsLogs: Array.from({ length: 7 }).map((_, i) => ({
                  date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
                  taken: true,
                  takenTime: '08:00'
                }))
              };

              patients.push(patient);
            }
          });
        });

        resolve({ patients, contacts, errors });
      } catch (err: any) {
        reject(new Error(err.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์ Excel'));
      }
    };

    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'));
    reader.readAsArrayBuffer(file);
  });
}
