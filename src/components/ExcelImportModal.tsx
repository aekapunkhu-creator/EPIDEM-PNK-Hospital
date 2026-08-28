import React, { useRef, useState } from 'react';
import { Patient, HouseholdContact } from '../types';
import { 
  FileSpreadsheet, Download, Upload, CheckCircle2, AlertCircle, 
  X, FileText, ArrowRight, Loader2, Users, UserCheck
} from 'lucide-react';
import { 
  downloadPatientExcelTemplate, 
  downloadContactExcelTemplate, 
  parseExcelFile, 
  ParseExcelResult 
} from '../utils/excelUtils';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (data: { patients: Patient[]; contacts: HouseholdContact[] }) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParseExcelResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsParsing(true);
    setErrorMsg(null);
    setParsedResult(null);

    try {
      const result = await parseExcelFile(file);
      setParsedResult(result);
      if (result.patients.length === 0 && result.contacts.length === 0) {
        setErrorMsg('ไม่พบข้อมูลผู้ป่วยหรือผู้สัมผัสที่ถูกต้องในไฟล์ Excel โปรดตรวจสอบหัวตารางตามไฟล์เทมเพลต');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์ Excel โปรดตรวจสอบรูปแบบไฟล์');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedResult) return;

    if (parsedResult.patients.length === 0 && parsedResult.contacts.length === 0) {
      alert('ไม่มีข้อมูลรายการที่จะนำเข้า');
      return;
    }

    onImportData({
      patients: parsedResult.patients,
      contacts: parsedResult.contacts
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 p-6 space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                นำเข้าข้อมูลผ่านไฟล์ Excel และดาวน์โหลดไฟล์เทมเพลต (Excel Import & Template)
              </h3>
              <p className="text-xs text-slate-500">
                รองรับไฟล์นามสกุล .xlsx, .xls, .csv สำหรับทะเบียนผู้ป่วยวัณโรคและคัดกรองผู้สัมผัส
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Template Download Buttons */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>1. ดาวน์โหลดไฟล์เทมเพลตมาตรฐาน (Excel Template)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* TB Patients Template Button */}
            <button
              onClick={downloadPatientExcelTemplate}
              className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 transition text-left flex items-start gap-3 group"
            >
              <FileSpreadsheet className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span>เทมเพลตผู้ป่วยวัณโรค (.xlsx)</span>
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-600">
                  โครงสร้างหัวตาราง: HN, บัตรประชาชน, ชื่อ-สกุล, ที่อยู่, พิกัด GPS, สูตรยา, ผู้ดูแล
                </p>
              </div>
            </button>

            {/* Contact Tracing Template Button */}
            <button
              onClick={downloadContactExcelTemplate}
              className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/80 transition text-left flex items-start gap-3 group"
            >
              <FileSpreadsheet className="w-6 h-6 text-teal-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span>เทมเพลตผู้สัมผัสร่วมบ้าน (.xlsx)</span>
                  <Download className="w-3.5 h-3.5 text-teal-600" />
                </div>
                <p className="text-[11px] text-slate-600">
                  โครงสร้างหัวตาราง: HNดัชนี, ผู้สัมผัส, ความสัมพันธ์, ผลตรวจ CXR/AFB, สูตรยา TPT
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Section 2: Upload Excel File Box */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>2. นำเข้าไฟล์ Excel หรือ CSV (Upload Excel File)</span>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-slate-50/80 hover:bg-emerald-50/40 p-6 rounded-2xl text-center cursor-pointer transition space-y-2"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>

            <div>
              <p className="font-bold text-slate-800 text-xs">
                {selectedFileName ? `ไฟล์ที่เลือก: ${selectedFileName}` : 'คลิกที่นี่ หรือ ลากไฟล์ Excel มาวาง เพื่อนำเข้าข้อมูล'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                รองรับไฟล์ .xlsx, .xls, .csv ขนาดไม่เกิน 20MB
              </p>
            </div>

            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>เลือกไฟล์จากเครื่อง...</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
          </div>
        </div>

        {/* Loading State */}
        {isParsing && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center gap-3 text-emerald-800 text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span>กำลังอ่านและวิเคราะห์ข้อมูลจากไฟล์ Excel...</span>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-800 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 3: Preview Parsed Result */}
        {parsedResult && !isParsing && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ตัวอย่างข้อมูลที่ตรวจพบในไฟล์ Excel (Preview Import Data)</span>
              </h4>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                  ผู้ป่วย: {parsedResult.patients.length} ราย
                </span>
                <span className="bg-teal-100 text-teal-800 font-bold px-2.5 py-0.5 rounded-full">
                  ผู้สัมผัส: {parsedResult.contacts.length} ราย
                </span>
              </div>
            </div>

            {/* Preview Patients Table */}
            {parsedResult.patients.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>รายการผู้ป่วยวัณโรค ({parsedResult.patients.length} ราย):</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b sticky top-0">
                      <tr>
                        <th className="p-2">HN</th>
                        <th className="p-2">ชื่อ-นามสกุล</th>
                        <th className="p-2">ตำบล/หมู่บ้าน</th>
                        <th className="p-2">ประเภทโรค</th>
                        <th className="p-2">สูตรยา</th>
                        <th className="p-2">ผู้ดูแล DOTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedResult.patients.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-emerald-800">{p.hn}</td>
                          <td className="p-2 font-medium">{p.prefix}{p.firstName} {p.lastName}</td>
                          <td className="p-2 text-slate-600">{p.subdistrict} ({p.village})</td>
                          <td className="p-2"><span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded font-semibold">{p.tbType}</span></td>
                          <td className="p-2 font-mono">{p.regimen}</td>
                          <td className="p-2 text-slate-600">{p.dotsSupervisorName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Preview Contacts Table */}
            {parsedResult.contacts.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>รายการผู้สัมผัสร่วมบ้าน ({parsedResult.contacts.length} ราย):</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b sticky top-0">
                      <tr>
                        <th className="p-2">HN ดัชนี</th>
                        <th className="p-2">ชื่อผู้สัมผัส</th>
                        <th className="p-2">ความสัมพันธ์</th>
                        <th className="p-2">ผลตรวจ CXR</th>
                        <th className="p-2">ผลการคัดกรอง</th>
                        <th className="p-2">สูตรยา TPT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedResult.contacts.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-teal-800">{c.indexPatientHN}</td>
                          <td className="p-2 font-medium">{c.prefix}{c.firstName} {c.lastName}</td>
                          <td className="p-2 text-slate-600">{c.relationship}</td>
                          <td className="p-2">{c.cxrResult}</td>
                          <td className="p-2 font-semibold text-emerald-800">{c.outcome}</td>
                          <td className="p-2 font-mono">{c.tptRegimen || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200 transition"
          >
            ยกเลิก
          </button>

          {parsedResult && (parsedResult.patients.length > 0 || parsedResult.contacts.length > 0) && (
            <button
              onClick={handleConfirmImport}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
            >
              <span>ยืนยันนำเข้าข้อมูลลงสู่ระบบ ({parsedResult.patients.length + parsedResult.contacts.length} รายการ)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
