import { Patient, HouseholdContact } from '../types';

export const TARGET_SPREADSHEET_ID = '1QmwOZyxrr6BFCwGCIy58AxV2BcFgGIfe0Q_oDeteSgE';
export const TARGET_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit?gid=0#gid=0`;

export async function syncPatientsToGoogleSheet(patients: Patient[], accessToken: string): Promise<boolean> {
  if (!accessToken) {
    throw new Error('กรุณาเข้าสู่ระบบ Google เพื่อรับสิทธิ์เข้าถึง Google Sheets');
  }

  const headers = [
    'HN',
    'คำนำหน้า',
    'ชื่อ',
    'นามสกุล',
    'อายุ',
    'เพศ',
    'ตำบล',
    'หมู่บ้าน',
    'บ้านเลขที่',
    'Latitude',
    'Longitude',
    'ประเภทโรควัณโรค',
    'สูตรยารักษา',
    'สถานะการรักษา',
    'ชื่อ อสม. ผู้ดูแล',
    'เบอร์โทร อสม.',
    'วันที่อัปเดตข้อมูล'
  ];

  const nowStr = new Date().toLocaleString('th-TH');

  const rows = patients.map(p => [
    p.hn || '',
    p.prefix || '',
    p.firstName || '',
    p.lastName || '',
    p.age || '',
    p.gender || '',
    p.subdistrict || '',
    p.village || '',
    p.houseNo || '-',
    p.lat || '-',
    p.lng || '-',
    p.tbType || '',
    p.regimen || '',
    p.status || '',
    p.dotsSupervisorName || '',
    p.dotsSupervisorPhone || '',
    nowStr
  ]);

  const body = {
    range: `Sheet1!A1:Q${rows.length + 1}`,
    majorDimension: 'ROWS',
    values: [headers, ...rows]
  };

  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${TARGET_SPREADSHEET_ID}/values/Sheet1!A1:Q${rows.length + 1}?valueInputOption=USER_ENTERED`;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    console.error('Google Sheets API Error:', errJson);
    throw new Error(errJson.error?.message || 'ไม่สามารถบันทึกข้อมูลไปยัง Google Sheets ได้');
  }

  return true;
}

export async function syncContactsToGoogleSheet(contacts: HouseholdContact[], accessToken: string): Promise<boolean> {
  if (!accessToken) return false;

  const headers = [
    'ชื่อ-นามสกุล ผู้สัมผัส',
    'อายุ',
    'ความสัมพันธ์',
    'รหัสผู้ป่วย HN หลัก',
    'ชื่อผู้ป่วยหลัก',
    'ตำบล',
    'หมู่บ้าน',
    'ผลตรวจ CXR',
    'ผลตรวจเสมหะ',
    'สถานะสรุป',
    'วันที่อัปเดต'
  ];

  const nowStr = new Date().toLocaleString('th-TH');

  const rows = contacts.map(c => [
    `${c.prefix}${c.firstName} ${c.lastName}`,
    c.age || '',
    c.relationship || '',
    c.indexPatientHN || '',
    c.indexPatientName || '',
    c.subdistrict || '',
    c.village || '',
    c.cxrResult || '',
    c.afbResult || '',
    c.outcome || '',
    nowStr
  ]);

  // Append or write to Sheet2 or range
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${TARGET_SPREADSHEET_ID}/values/Sheet1!A50:K${50 + rows.length}?valueInputOption=USER_ENTERED`;

  try {
    await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: `Sheet1!A50:K${50 + rows.length}`,
        majorDimension: 'ROWS',
        values: [headers, ...rows]
      })
    });
  } catch (err) {
    console.warn('Contacts sheet write warning', err);
  }

  return true;
}
