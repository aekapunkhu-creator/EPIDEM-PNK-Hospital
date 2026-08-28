import React, { useRef, useState, useEffect } from 'react';
import { Patient, HouseholdContact } from '../types';
import { X, FileSpreadsheet, Download, Database, Upload, RefreshCw, CheckCircle, ExternalLink, CloudUpload, ShieldCheck, LogOut, Loader2, ArrowRight } from 'lucide-react';
import { TARGET_SPREADSHEET_ID, TARGET_SPREADSHEET_URL, syncPatientsToGoogleSheet, syncContactsToGoogleSheet } from '../services/googleSheets';
import { googleSignIn, googleLogout, initAuthListener, getAccessToken } from '../services/googleAuth';
import { User } from 'firebase/auth';
import { downloadPatientExcelTemplate, downloadContactExcelTemplate } from '../utils/excelUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  contacts: HouseholdContact[];
  onResetToDemoData?: () => void;
  onImportJsonData?: (data: { patients?: Patient[]; contacts?: HouseholdContact[] }) => void;
  onOpenExcelImportModal?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  patients,
  contacts,
  onResetToDemoData,
  onImportJsonData,
  onOpenExcelImportModal
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google OAuth Auth State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('tb_phon_last_gsheets_sync');
  });
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = initAuthListener(
        (user, token) => {
          setGoogleUser(user);
          setAccessToken(token);
        },
        () => {
          setGoogleUser(null);
          setAccessToken(null);
        }
      );
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setSyncMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        setSyncMessage({ type: 'success', text: `เชื่อมต่อบัญชี Google (${result.user.email}) สำเร็จ` });
      }
    } catch (err: any) {
      console.error(err);
      setSyncMessage({ type: 'error', text: err.message || 'ไม่สามารถเข้าสู่ระบบ Google ได้' });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleLogout();
    setGoogleUser(null);
    setAccessToken(null);
    setSyncMessage({ type: 'success', text: 'ออกจากระบบ Google เรียบร้อยแล้ว' });
  };

  const handleSyncToGoogleSheet = async () => {
    const token = accessToken || getAccessToken();
    if (!token) {
      alert('กรุณากดเข้าสู่ระบบ Sign in with Google ก่อนเริ่มส่งออกข้อมูล');
      return;
    }

    const confirmed = window.confirm(
      `คุณต้องการสำรองข้อมูลผู้ป่วยจำนวน ${patients.length} รายการ และผู้สัมผัส ${contacts.length} รายการ ไปยัง Google Sheet ID: ${TARGET_SPREADSHEET_ID} ใช่หรือไม่?`
    );
    if (!confirmed) return;

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      await syncPatientsToGoogleSheet(patients, token);
      await syncContactsToGoogleSheet(contacts, token);

      const nowStr = new Date().toLocaleString('th-TH');
      setLastSyncTime(nowStr);
      localStorage.setItem('tb_phon_last_gsheets_sync', nowStr);
      setSyncMessage({
        type: 'success',
        text: `สำรองข้อมูลไปยัง Google Sheets สำเร็จเมื่อ ${nowStr}`
      });
    } catch (err: any) {
      console.error('Google Sheets Sync Failed', err);
      setSyncMessage({
        type: 'error',
        text: err.message || 'เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง Google Sheets'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportPatientsCSV = () => {
    const headers = ['HN', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'อายุ', 'เพศ', 'ตำบล', 'หมู่บ้าน', 'บ้านเลขที่', 'Latitude', 'Longitude', 'ประเภทโรค', 'สูตรยา', 'สถานะ', 'อสม.ผู้ดูแล', 'เบอร์โทร อสม.'];
    const rows = patients.map(p => [
      p.hn, p.prefix, p.firstName, p.lastName, p.age, p.gender, p.subdistrict, p.village, p.houseNo || '-', p.lat || '-', p.lng || '-', p.tbType, p.regimen, p.status, p.dotsSupervisorName, p.dotsSupervisorPhone
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ทะเบียนผู้ป่วยวัณโรค_พร้อมพิกัด_อ_โพนนาแก้ว_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportContactsCSV = () => {
    const headers = ['IDผู้สัมผัส', 'ผู้ป่วยดัชนี', 'ชื่อผู้สัมผัส', 'นามสกุล', 'อายุ', 'ความสัมพันธ์', 'ตำบล', 'หมู่บ้าน', 'ผลคัดกรอง', 'สูตรยาTPT'];
    const rows = contacts.map(c => [
      c.id, c.indexPatientName, c.firstName, c.lastName, c.age, c.relationship, c.subdistrict, c.village, c.outcome, c.tptRegimen || '-'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ทะเบียนคัดกรองผู้สัมผัสวัณโรค_อ_โพนนาแก้ว_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportFullJsonBackup = () => {
    const backupData = {
      system: 'TB-CARE Phon Na Kaeo',
      exportedAt: new Date().toISOString(),
      patients,
      contacts
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TB_CARE_PHON_NA_KAEO_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (onImportJsonData) {
          onImportJsonData(parsed);
        }
      } catch (err) {
        alert('ไฟล์ JSON ไม่ถูกต้อง โปรดตรวจสอบรูปแบบไฟล์สำรองข้อมูล');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              สำรองข้อมูล บันทึกรายงาน และนำเข้าข้อมูล
            </h3>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        {/* Real-Time Local Storage Persistence Status */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span><strong>บันทึกข้อมูลจริงอัตโนมัติ (Auto-Saved Realtime):</strong> ข้อมูลผู้ป่วย พิกัดบ้าน GPS บันทึกคัดกรอง และประวัติการทานยา ถูกจัดเก็บไว้ใน Browser Storage อย่างถาวร</span>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-700">1. รายงานรูปแบบ Excel / CSV</div>
          <button
            onClick={handleExportPatientsCSV}
            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition flex items-center justify-between group"
          >
            <div className="text-left text-xs">
              <div className="font-bold text-slate-800 group-hover:text-emerald-800">
                ทะเบียนผู้ป่วยวัณโรค + พิกัด GPS (CSV UTF-8)
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                รวม {patients.length} รายการ (HN, ละติจูด, ลองจิจูด, อสม.ผู้ดูแล)
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
          </button>

          <button
            onClick={handleExportContactsCSV}
            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition flex items-center justify-between group"
          >
            <div className="text-left text-xs">
              <div className="font-bold text-slate-800 group-hover:text-emerald-800">
                ทะเบียนคัดกรองผู้สัมผัสร่วมบ้าน (Contact Tracing CSV)
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                รวม {contacts.length} รายการ
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
          </button>

          {/* Section 2: Excel Import & Template Download */}
          <div className="pt-2 border-t space-y-2">
            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>2. นำเข้าข้อมูลผ่าน Excel & เทมเพลต</span>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                .XLSX / .XLS / .CSV
              </span>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
              {onOpenExcelImportModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenExcelImportModal();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>เปิดหน้าต่างนำเข้าข้อมูลจากไฟล์ Excel...</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={downloadPatientExcelTemplate}
                  className="p-2 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100/60 text-slate-800 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>เทมเพลตผู้ป่วย (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={downloadContactExcelTemplate}
                  className="p-2 rounded-lg bg-white border border-teal-300 hover:bg-teal-100/60 text-slate-800 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-teal-600" />
                  <span>เทมเพลตผู้สัมผัส (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-700 pt-2 border-t flex items-center justify-between">
            <span>3. สำรองข้อมูลไปยัง Google Sheets (ออนไลน์)</span>
            <a
              href={TARGET_SPREADSHEET_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 underline"
            >
              <span>เปิดไฟล์ Google Sheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-200 rounded-xl space-y-3">
            <div className="text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Google Sheet ปลายทาง:</span>
              </div>
              <p className="font-mono text-[11px] bg-white px-2.5 py-1 rounded border border-emerald-200 text-slate-700 truncate">
                ID: {TARGET_SPREADSHEET_ID}
              </p>
            </div>

            {/* Google Authentication State */}
            {!googleUser ? (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-600">
                  กรุณาเข้าสู่ระบบ Google เพื่ออนุมัติสิทธิ์การบันทึกข้อมูลเข้าสู่ Google Sheet:
                </p>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSigningIn}
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  {isSigningIn ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  )}
                  <span>Sign in with Google</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-emerald-200 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-medium truncate">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{googleUser.email}</span>
                  </div>
                  <button
                    onClick={handleGoogleLogout}
                    className="text-[11px] text-slate-500 hover:text-red-600 font-semibold flex items-center gap-1 shrink-0 ml-2"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>ออก</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSyncToGoogleSheet}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>กำลังส่งออกข้อมูลไปยัง Google Sheets...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4 text-emerald-200" />
                      <span>กดสำรองข้อมูลไปยัง Google Sheets ตอนนี้</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {lastSyncTime && (
              <p className="text-[11px] text-emerald-800 font-medium text-center">
                สำรองข้อมูลล่าสุด: {lastSyncTime}
              </p>
            )}

            {syncMessage && (
              <div
                className={`p-2 rounded-lg text-xs font-semibold text-center ${
                  syncMessage.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {syncMessage.text}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportFullJsonBackup}
              className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-900 font-bold text-xs flex flex-col items-center justify-center gap-1 transition"
            >
              <Database className="w-5 h-5 text-blue-600" />
              <span>ดาวน์โหลดไฟล์สำรองฐานข้อมูล (.json)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-900 font-bold text-xs flex flex-col items-center justify-center gap-1 transition"
            >
              <Upload className="w-5 h-5 text-indigo-600" />
              <span>นำเข้าไฟล์ฐานข้อมูล (.json)</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          {onResetToDemoData && (
            <div className="pt-2 border-t">
              <button
                onClick={onResetToDemoData}
                className="w-full p-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4 text-red-600" />
                <span>รีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นตัวอย่าง</span>
              </button>
            </div>
          )}
        </div>

        <div className="pt-3 border-t text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-medium text-xs hover:bg-slate-300"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

