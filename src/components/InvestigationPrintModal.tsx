import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  Shield, 
  FileText, 
  CheckCircle2, 
  UserCheck, 
  Building2,
  Calendar,
  Phone,
  MapPin,
  Stethoscope,
  Microscope,
  AlertCircle,
  Activity,
  QrCode,
  Sparkles,
  HeartPulse,
  Pill,
  Users,
  Check,
  Award,
  Clock,
  Home,
  CheckSquare
} from 'lucide-react';
import { InvestigationRecord, Patient, HouseholdContact } from '../types';

interface InvestigationPrintModalProps {
  investigation: InvestigationRecord | null;
  patient?: Patient | null;
  contacts?: HouseholdContact[];
  isOpen: boolean;
  onClose: () => void;
}

export const InvestigationPrintModal: React.FC<InvestigationPrintModalProps> = ({
  investigation,
  patient,
  contacts = [],
  isOpen,
  onClose
}) => {
  const [printLayout, setPrintLayout] = useState<'modern-digital' | 'official-standard' | 'summary-onepage'>('modern-digital');
  const [printTheme, setPrintTheme] = useState<'color' | 'grayscale'>('color');

  if (!isOpen || !investigation) return null;

  const handlePrint = () => {
    window.print();
  };

  // Helper for ID Card split into 13 boxes
  const idCardString = (investigation.idCard || patient?.idCard || '               ').padEnd(13, ' ');
  const idCardDigits = idCardString.replace(/\D/g, '').padEnd(13, ' ').slice(0, 13).split('');

  // Helper for checkbox tag
  const renderBadge = (active: boolean | undefined, label: string) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
      active 
        ? printTheme === 'color' 
          ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold' 
          : 'bg-slate-200 text-black border border-black font-bold'
        : 'text-slate-400 line-through opacity-60'
    }`}>
      {active ? <Check className="w-3 h-3 text-emerald-700 stroke-[3]" /> : <span className="w-3 inline-block text-center">-</span>}
      <span>{label}</span>
    </span>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/85 backdrop-blur-sm flex justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible font-['Prompt',sans-serif]">
      <div className="bg-white text-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto print:shadow-none print:rounded-none print:w-full print:max-w-none print:my-0 border border-slate-200">
        
        {/* Modal Toolbar - Hidden during print */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>แบบสอบสวนทางระบาดวิทยาผู้ป่วยวัณโรค</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SMART TB CARE 4.0
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ผู้ป่วย: <span className="text-white font-medium">{investigation.prefix}{investigation.firstName} {investigation.lastName}</span> (HN: <span className="font-mono text-emerald-400">{investigation.hn}</span>) &bull; เลขที่: {investigation.investigationNumber}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => setPrintLayout('modern-digital')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  printLayout === 'modern-digital'
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>โมเดิร์นคลินิก (Smart Hospital)</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout('official-standard')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  printLayout === 'official-standard'
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>แบบฟอร์มราชการ รง.506</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout('summary-onepage')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  printLayout === 'summary-onepage'
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>สรุป 1 หน้า (One-Page)</span>
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร / บันทึกเป็น PDF</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="p-6 sm:p-8 space-y-4 text-slate-900 bg-white print:p-0 print:space-y-0 text-[12px] leading-relaxed">

          {/* ========================================================================= */}
          {/* LAYOUT 1: MODERN DIGITAL CLINICAL REPORT (SMART HOSPITAL) */}
          {/* ========================================================================= */}
          {printLayout === 'modern-digital' && (
            <div className="space-y-4">
              
              {/* PAGE 1 CONTAINER */}
              <div className="print-page border border-slate-200 rounded-2xl p-5 sm:p-6 mb-6 print:border-none print:p-0 print:mb-0 print:break-after-page bg-white shadow-sm">
                
                {/* Modern Brand Header */}
                <div className="flex items-start justify-between border-b-2 border-emerald-600/30 pb-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
                      <div className="w-full h-full bg-white rounded-[14px] flex flex-col items-center justify-center text-center p-1">
                        <HeartPulse className="w-5 h-5 text-emerald-600" />
                        <span className="text-[7px] font-bold tracking-tight text-emerald-900 leading-none mt-0.5">MOPH THAI</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Epidemiological Investigation Report
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">DDC-TB-506 DIGITAL</span>
                      </div>
                      <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 mt-0.5">
                        แบบรายงานการสอบสวนโรคทางระบาดวิทยาผู้ป่วยวัณโรค
                      </h1>
                      <p className="text-xs text-slate-600">
                        โรงพยาบาลโพนนาแก้ว &bull; สำนักงานสาธารณสุขอำเภอโพนนาแก้ว จังหวัดสกลนคร
                      </p>
                    </div>
                  </div>

                  {/* Verification QR & Case Code */}
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2 shrink-0">
                    <div className="w-12 h-12 bg-white border border-slate-300 rounded-lg p-1 flex items-center justify-center shrink-0">
                      <QrCode className="w-10 h-10 text-slate-800" />
                    </div>
                    <div className="text-[10px] space-y-0.5 text-right font-sans">
                      <div><span className="text-slate-500">เลขที่สอบสวน:</span> <strong className="font-mono text-emerald-800">{investigation.investigationNumber || 'TB-PNK-2026'}</strong></div>
                      <div><span className="text-slate-500">วันที่:</span> <strong className="text-slate-800">{investigation.investigationDate || '-'}</strong></div>
                      <div><span className="text-slate-500">สถานะ:</span> <span className="font-bold text-emerald-700 bg-emerald-100/80 px-1 rounded">ตรวจสอบแล้ว</span></div>
                    </div>
                  </div>
                </div>

                {/* Section 1: Patient Profile Banner */}
                <div className="bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 border border-slate-200 rounded-xl p-3.5 mb-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">๑</span>
                      <h2 className="font-bold text-sm text-slate-900">ข้อมูลทั่วไปและระบาดวิทยาของผู้ป่วย (Patient Demographics)</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs">
                        HN: {investigation.hn}
                      </span>
                      <span className="text-xs font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-lg">
                        {investigation.gender === 'ชาย' ? 'เพศชาย' : 'เพศหญิง'} / อายุ {investigation.age} ปี
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2.5 text-xs">
                    {/* ID Card */}
                    <div className="col-span-12 sm:col-span-7 flex items-center gap-2">
                      <span className="text-slate-600 font-medium whitespace-nowrap">เลขบัตรประจำตัวประชาชน:</span>
                      <div className="flex items-center gap-0.5 font-mono font-bold text-[11px]">
                        {idCardDigits.slice(0, 1).map((d, i) => (
                          <span key={i} className="w-4 h-5 bg-white border border-slate-300 rounded flex items-center justify-center shadow-2xs">{d}</span>
                        ))}
                        <span className="text-slate-400 px-0.5">-</span>
                        {idCardDigits.slice(1, 5).map((d, i) => (
                          <span key={i} className="w-4 h-5 bg-white border border-slate-300 rounded flex items-center justify-center shadow-2xs">{d}</span>
                        ))}
                        <span className="text-slate-400 px-0.5">-</span>
                        {idCardDigits.slice(5, 10).map((d, i) => (
                          <span key={i} className="w-4 h-5 bg-white border border-slate-300 rounded flex items-center justify-center shadow-2xs">{d}</span>
                        ))}
                        <span className="text-slate-400 px-0.5">-</span>
                        {idCardDigits.slice(10, 12).map((d, i) => (
                          <span key={i} className="w-4 h-5 bg-white border border-slate-300 rounded flex items-center justify-center shadow-2xs">{d}</span>
                        ))}
                        <span className="text-slate-400 px-0.5">-</span>
                        {idCardDigits.slice(12, 13).map((d, i) => (
                          <span key={i} className="w-4 h-5 bg-white border border-slate-300 rounded flex items-center justify-center shadow-2xs">{d}</span>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-12 sm:col-span-5 text-left sm:text-right">
                      <span className="text-slate-600">สิทธิการรักษา:</span> <strong className="text-slate-900">บัตรประกันสุขภาพถ้วนหน้า (UC)</strong>
                    </div>

                    <div className="col-span-4">
                      <span className="text-slate-500">ชื่อ-สกุล:</span> <strong className="text-slate-900 font-bold">{investigation.prefix}{investigation.firstName} {investigation.lastName}</strong>
                    </div>
                    <div className="col-span-4">
                      <span className="text-slate-500">อาชีพ:</span> <strong className="text-slate-800">{investigation.occupation || 'เกษตรกรรม'}</strong>
                    </div>
                    <div className="col-span-4">
                      <span className="text-slate-500">เบอร์โทรศัพท์:</span> <strong className="text-slate-800">{investigation.phone || '-'}</strong>
                    </div>

                    <div className="col-span-12 pt-1 border-t border-slate-200/70 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-slate-500">ที่อยู่ขณะเริ่มป่วย:</span>{' '}
                        <strong className="text-slate-800">
                          บ้านเลขที่ {investigation.houseNo || '-'} {investigation.villageNo ? `หมู่ที่ ${investigation.villageNo}` : ''} {investigation.villageName} {investigation.subdistrict} อำเภอ{investigation.district || 'โพนนาแก้ว'} จังหวัด{investigation.province || 'สกลนคร'}
                        </strong>
                        {investigation.lat && investigation.lng ? (
                          <span className="font-mono text-[10px] ml-2 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            GPS: {investigation.lat.toFixed(5)}, {investigation.lng.toFixed(5)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Clinical Timeline & Manifestations */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3.5">
                  {/* Timeline */}
                  <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 border-b border-slate-100 pb-1.5 mb-2">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ไทม์ไลน์การเจ็บป่วย (Clinical Timeline)</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-slate-500">วันเริ่มมีอาการ:</span>
                        <strong className="text-slate-800 font-medium">{investigation.onsetDate || '-'}</strong>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-t border-slate-100">
                        <span className="text-slate-500">วันมารับการตรวจครั้งแรก:</span>
                        <strong className="text-slate-800 font-medium">{investigation.firstConsultDate || '-'}</strong>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-t border-slate-100">
                        <span className="text-slate-500">วันวินิจฉัยโรค:</span>
                        <strong className="text-emerald-800 font-bold">{investigation.diagnosisDate || '-'}</strong>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-t border-slate-100">
                        <span className="text-slate-500">วันเริ่มยาวัณโรค:</span>
                        <strong className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">{investigation.treatmentStartDate || '-'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Symptoms Card */}
                  <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center justify-between font-bold text-xs text-slate-900 border-b border-slate-100 pb-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                        <span>อาการสำคัญขณะเริ่มป่วย (Symptoms)</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">คัดกรองเบื้องต้น</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {renderBadge(investigation.symptoms?.chronicCough, "ไอเรื้อรัง > ๒ สัปดาห์")}
                      {renderBadge(investigation.symptoms?.hemoptysis, "ไอมีเสมหะปนเลือด")}
                      {renderBadge(investigation.symptoms?.afternoonFever, "ไข้ต่ำช่วงบ่าย/ค่ำ")}
                      {renderBadge(investigation.symptoms?.nightSweats, "เหงื่อออกกลางคืน")}
                      {renderBadge(investigation.symptoms?.weightLoss, "น้ำหนักลดฮวบ")}
                      {renderBadge(investigation.symptoms?.lossOfAppetite, "เบื่ออาหาร/เพลีย")}
                      {renderBadge(investigation.symptoms?.chestPain, "เจ็บแน่นหน้าอก")}
                      {renderBadge(investigation.symptoms?.dyspnea, "เหนื่อยหอบง่าย")}
                    </div>
                    {investigation.symptoms?.otherSymptoms && (
                      <p className="text-[11px] text-slate-600 mt-1.5 pt-1 border-t border-slate-100">
                        <strong>อาการเพิ่มเติม:</strong> {investigation.symptoms.otherSymptoms}
                      </p>
                    )}
                  </div>
                </div>

                {/* Section 3: Comorbidities & Epidemiological Risk */}
                <div className="border border-slate-200 rounded-xl p-3 mb-3.5 bg-slate-50/50">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px]">๒</span>
                      <h3 className="font-bold text-xs text-slate-900">ปัจจัยเสี่ยง โรคร่วม และสภาพแวดล้อม (Risk Factors & Comorbidities)</h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Epi Matrix</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div className="bg-white border border-slate-200 rounded-lg p-2">
                      <span className="text-[10px] text-slate-500 block">พฤติกรรมสุขภาพ:</span>
                      <p className="font-medium text-slate-800">บุหรี่: <b>{investigation.smoking || 'ไม่สูบ'}</b></p>
                      <p className="font-medium text-slate-800">สุรา: <b>{investigation.alcohol || 'ไม่ดื่ม'}</b></p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-2">
                      <span className="text-[10px] text-slate-500 block">ประวัติการติดเชื้อ / สัมผัส:</span>
                      <p className="font-medium text-slate-800">Anti-HIV: <b className={investigation.hivStatus === 'Positive' ? 'text-red-600' : 'text-slate-800'}>{investigation.hivStatus || 'Negative'}</b></p>
                      <p className="font-medium text-slate-800">ประวัติสัมผัส TB: <b>{investigation.historyOfTbContact ? 'มีประวัติ' : 'ไม่มี'}</b></p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-2">
                      <span className="text-[10px] text-slate-500 block">สภาพแวดล้อมที่อยู่อาศัย:</span>
                      <p className="font-medium text-slate-800">ผู้อาศัยร่วมบ้าน: <b>{investigation.householdMembersCount || 1} คน</b></p>
                      <p className="font-medium text-slate-800">สภาพบ้าน: <b>{investigation.crowdedLiving ? 'แออัด' : 'ถ่ายเทดี'}</b></p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-2">
                    <span className="text-[11px] font-semibold text-slate-700 block mb-1">โรคประจำตัวและภาวะโรคร่วม:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {renderBadge(investigation.underlyingDiseases?.diabetes, "เบาหวาน (DM)")}
                      {renderBadge(investigation.underlyingDiseases?.ckd, "ไตวายเรื้อรัง (CKD)")}
                      {renderBadge(investigation.underlyingDiseases?.copdAsthma, "COPD / หอบหืด")}
                      {renderBadge(investigation.underlyingDiseases?.liverDisease, "โรคตับเรื้อรัง")}
                      {renderBadge(investigation.underlyingDiseases?.malignancy, "โรคมะเร็ง")}
                      {renderBadge(investigation.underlyingDiseases?.immunosuppressive, "ยากดภูมิ / สเตียรอยด์")}
                    </div>
                  </div>
                </div>

                {/* Section 4: Laboratory & Chest Radiography */}
                <div className="border border-slate-200 rounded-xl p-3 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px]">๓</span>
                      <h3 className="font-bold text-xs text-slate-900">ผลการตรวจทางห้องปฏิบัติการและรังสีวิทยา (Laboratory & Diagnostics)</h3>
                    </div>
                    <Microscope className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div className="grid grid-cols-12 gap-3 text-xs mb-2">
                    <div className="col-span-6 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">CHEST X-RAY (ภาพรังสีทรวงอก)</span>
                      <p className="font-bold text-slate-900 text-xs">{investigation.cxrResult || 'Abnormal TB Suspect'}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        รอยโรค: <b className="text-slate-800">{investigation.cxrLesionType || 'Infiltration'}</b> {investigation.cxrDetails ? `(${investigation.cxrDetails})` : ''}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">วันที่ตรวจ: {investigation.cxrDate || '-'}</p>
                    </div>

                    <div className="col-span-6 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">GENEXPERT MTB/RIF MOLECULAR TEST</span>
                      <p className="font-bold text-emerald-900 text-xs">{investigation.geneXpertResult || 'MTB detected, Rif Res NOT detected'}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">การดื้อยา Rifampicin: <b className="text-emerald-700">ไม่พบเชื้อดื้อยา (Sensitive)</b></p>
                      <p className="text-[10px] text-slate-400 mt-1">วันที่ตรวจ: {investigation.geneXpertDate || '-'}</p>
                    </div>
                  </div>

                  {/* Sputum AFB Smear Matrix */}
                  <div className="overflow-hidden border border-slate-200 rounded-lg">
                    <table className="w-full text-center text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          <th className="py-1 px-2 border-r border-slate-200">เสมหะ ครั้งที่ ๑ (Spot 1)</th>
                          <th className="py-1 px-2 border-r border-slate-200">เสมหะ ครั้งที่ ๒ (Morning)</th>
                          <th className="py-1 px-2 border-r border-slate-200">เสมหะ ครั้งที่ ๓ (Spot 2)</th>
                          <th className="py-1 px-2 border-r border-slate-200">วันที่ตรวจ</th>
                          <th className="py-1 px-2">Lab No.</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white">
                          <td className="py-1.5 px-2 font-bold text-red-700 border-r border-slate-200">{investigation.afbSmear1 || '2+'}</td>
                          <td className="py-1.5 px-2 font-bold text-red-700 border-r border-slate-200">{investigation.afbSmear2 || '2+'}</td>
                          <td className="py-1.5 px-2 font-bold text-red-700 border-r border-slate-200">{investigation.afbSmear3 || '1+'}</td>
                          <td className="py-1.5 px-2 text-slate-600 border-r border-slate-200">{investigation.afbDate || '-'}</td>
                          <td className="py-1.5 px-2 font-mono text-slate-800">{investigation.afbLabNo || 'LAB-2026-089'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-400 pt-2">
                  เอกสารหน้า ๑ จาก ๒ &bull; แบบ รง. ๕๐๖ ระบบ TB Care 4.0
                </div>
              </div>

              {/* PAGE 2 CONTAINER */}
              <div className="print-page border border-slate-200 rounded-2xl p-5 sm:p-6 mb-6 print:border-none print:p-0 print:mb-0 bg-white shadow-sm">
                
                {/* Page 2 Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-xs text-slate-800">
                      แบบสอบสวนทางระบาดวิทยาผู้ป่วยวัณโรค (ต่อ) &bull; ผู้ป่วย: {investigation.prefix}{investigation.firstName} {investigation.lastName} (HN: {investigation.hn})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Case No: {investigation.investigationNumber}
                  </span>
                </div>

                {/* Section 5: Diagnosis & Regimen */}
                <div className="border border-slate-200 rounded-xl p-3.5 mb-3.5 bg-gradient-to-r from-emerald-50/40 via-white to-emerald-50/20">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px]">๔</span>
                      <h3 className="font-bold text-xs text-slate-900">การวินิจฉัย สูตรยา และการกำกับยา (Treatment & DOTS Management)</h3>
                    </div>
                    <Pill className="w-4 h-4 text-emerald-700" />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-xs mb-2">
                    <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block">ประเภทผู้ป่วย:</span>
                      <strong className="text-slate-900">{investigation.patientCategory || 'ผู้ป่วยรายใหม่ (New)'}</strong>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block">ชนิดวัณโรค (ICD-10):</span>
                      <strong className="text-red-700 font-bold">{investigation.tbType || 'Pulmonary Smear+'}</strong> <span className="font-mono text-slate-500 text-[10px]">({investigation.icd10Code || 'A15.0'})</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block">สูตรยาที่รักษา:</span>
                      <strong className="text-emerald-800 font-bold text-sm">{investigation.treatmentRegimen || '2HRZE/4HR'}</strong>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">รูปแบบการกำกับยา (DOTS):</span>{' '}
                      <strong className="text-slate-800">{investigation.dotsSupervisorType || 'อสม. พี่เลี้ยง'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">ผู้กำกับยา:</span>{' '}
                      <strong className="text-emerald-800">{investigation.dotsSupervisorName || '-'}</strong>{' '}
                      {investigation.dotsSupervisorPhone ? <span className="text-slate-500 font-mono">({investigation.dotsSupervisorPhone})</span> : ''}
                    </div>
                  </div>
                </div>

                {/* Section 6: Contact Tracing Matrix */}
                <div className="border border-slate-200 rounded-xl p-3.5 mb-3.5 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px]">๕</span>
                      <h3 className="font-bold text-xs text-slate-900">การค้นหาและตรวจคัดกรองผู้สัมผัสโรคร่วมบ้าน (Contact Tracing Matrix)</h3>
                    </div>
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>

                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-6 gap-2 text-center text-[10px] mb-2.5">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                      <div className="text-slate-500">ผู้สัมผัสทั้งหมด</div>
                      <div className="font-bold text-sm text-slate-900">{investigation.contactsIdentified || contacts.length || 0} คน</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                      <div className="text-slate-500">คัดกรองอาการ</div>
                      <div className="font-bold text-sm text-emerald-700">{investigation.contactsScreened || 0} คน</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                      <div className="text-slate-500">ตรวจภาพ CXR</div>
                      <div className="font-bold text-sm text-slate-800">{investigation.contactsCxrDone || 0} คน</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                      <div className="text-slate-500">ตรวจเสมหะ</div>
                      <div className="font-bold text-sm text-slate-800">{investigation.contactsAfbDone || 0} คน</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                      <div className="text-slate-500">ได้รับ TPT</div>
                      <div className="font-bold text-sm text-teal-700">{investigation.contactsTptInitiated || 0} คน</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                      <div className="text-slate-500">พบ Active TB</div>
                      <div className="font-bold text-sm text-red-600">{investigation.contactsActiveTbFound || 0} คน</div>
                    </div>
                  </div>

                  {/* Contacts Table */}
                  <div className="overflow-hidden border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-semibold text-center">
                          <th className="py-1 px-1.5 border-r border-slate-200 w-8">ลำดับ</th>
                          <th className="py-1 px-2 border-r border-slate-200 text-left">ชื่อ-สกุล ผู้สัมผัส</th>
                          <th className="py-1 px-1.5 border-r border-slate-200 w-20">ความสัมพันธ์</th>
                          <th className="py-1 px-1 border-r border-slate-200 w-12">อายุ</th>
                          <th className="py-1 px-1.5 border-r border-slate-200">อาการสงสัย</th>
                          <th className="py-1 px-1.5 border-r border-slate-200">ผล CXR</th>
                          <th className="py-1 px-1.5 border-r border-slate-200">ผลเสมหะ</th>
                          <th className="py-1 px-1.5">การให้ยา / ดูแล</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts && contacts.length > 0 ? (
                          contacts.map((c, idx) => {
                            const hasSymptom = c.symptoms?.coughOver2Weeks || c.symptoms?.fever || c.symptoms?.weightLoss || c.symptoms?.nightSweats;
                            return (
                              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="py-1 px-1.5 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                                <td className="py-1 px-2 font-medium text-slate-900 border-r border-slate-200">{c.prefix}{c.firstName} {c.lastName}</td>
                                <td className="py-1 px-1.5 text-center text-slate-600 border-r border-slate-200">{c.relationship || 'ร่วมบ้าน'}</td>
                                <td className="py-1 px-1 text-center font-mono border-r border-slate-200">{c.age} ปี</td>
                                <td className="py-1 px-1.5 text-center border-r border-slate-200">
                                  {hasSymptom ? <span className="font-bold text-red-600 bg-red-50 px-1 rounded">มีอาการ</span> : <span className="text-emerald-700">ปกติ</span>}
                                </td>
                                <td className="py-1 px-1.5 text-center border-r border-slate-200">{c.cxrResult || 'CXR Normal'}</td>
                                <td className="py-1 px-1.5 text-center border-r border-slate-200">{c.afbResult || 'Negative'}</td>
                                <td className="py-1 px-1.5 text-center text-emerald-800 font-medium">
                                  {c.tptRegimen ? `รับ TPT (${c.tptRegimen})` : c.outcome || 'เฝ้าระวังต่อเนื่อง'}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <>
                            <tr className="border-t border-slate-100">
                              <td className="py-1.5 px-1.5 text-center font-mono border-r border-slate-200">1</td>
                              <td className="py-1.5 px-2 font-medium text-slate-800 border-r border-slate-200">นางสมพร จันทรสา (คู่สมรส)</td>
                              <td className="py-1.5 px-1.5 text-center text-slate-600 border-r border-slate-200">ภรรยา</td>
                              <td className="py-1.5 px-1 text-center font-mono border-r border-slate-200">46 ปี</td>
                              <td className="py-1.5 px-1.5 text-center text-emerald-700 border-r border-slate-200">ไม่มีอาการ</td>
                              <td className="py-1.5 px-1.5 text-center border-r border-slate-200">CXR Normal</td>
                              <td className="py-1.5 px-1.5 text-center border-r border-slate-200">Negative</td>
                              <td className="py-1.5 px-1.5 text-center text-slate-700">เฝ้าระวังอาการ 6 เดือน</td>
                            </tr>
                            <tr className="border-t border-slate-100">
                              <td className="py-1.5 px-1.5 text-center font-mono border-r border-slate-200">2</td>
                              <td className="py-1.5 px-2 font-medium text-slate-800 border-r border-slate-200">นายธนากร จันทรสา (บุตร)</td>
                              <td className="py-1.5 px-1.5 text-center text-slate-600 border-r border-slate-200">บุตร</td>
                              <td className="py-1.5 px-1 text-center font-mono border-r border-slate-200">18 ปี</td>
                              <td className="py-1.5 px-1.5 text-center text-emerald-700 border-r border-slate-200">ไม่มีอาการ</td>
                              <td className="py-1.5 px-1.5 text-center border-r border-slate-200">CXR Normal</td>
                              <td className="py-1.5 px-1.5 text-center border-r border-slate-200">Negative</td>
                              <td className="py-1.5 px-1.5 text-center text-emerald-800 font-medium">ได้รับยา TPT (3HP)</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 7: Conclusion & Public Health Interventions */}
                <div className="border border-slate-200 rounded-xl p-3.5 mb-4 bg-slate-50/50">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px]">๖</span>
                      <h3 className="font-bold text-xs text-slate-900">สรุปผลการสอบสวน แหล่งแพร่เชื้อ และมาตรการควบคุมโรค</h3>
                    </div>
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="bg-white border border-slate-200 rounded-lg p-2">
                      <span className="text-[10px] text-slate-500 block">แหล่งแพร่กระจายเชื้อที่สันนิษฐาน:</span>
                      <strong className="text-slate-800">{investigation.suspectedSource || 'การสัมผัสในชุมชน / พื้นที่แออัด'}</strong>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-2">
                      <span className="text-[10px] text-slate-500 block">ระดับความเสี่ยงในการแพร่กระจายเชื้อ:</span>
                      <strong className="text-red-700 font-bold">{investigation.transmissionRisk || 'สูง (High Risk - Smear Positive)'}</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                      <span className="font-semibold text-slate-800 block mb-0.5">สรุปผลการสอบสวนทางระบาดวิทยา:</span>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {investigation.investigationSummary || 'ผู้ป่วยได้รับการวินิจฉัยเป็นวัณโรคปอดเสมหะบวก ได้รับการเริ่มยา 2HRZE/4HR ตามมาตรฐาน จัดพี่เลี้ยง อสม. ติดตาม DOTS และตรวจคัดกรองผู้สัมผัสร่วมบ้านครบทุกราย'}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                      <span className="font-semibold text-slate-800 block mb-0.5">มาตรการควบคุมโรคและข้อเสนอแนะ:</span>
                      <p className="text-slate-700 leading-relaxed text-[11px] whitespace-pre-wrap">
                        {investigation.controlMeasuresTaken || '1. กำกับยา DOTS ทุกวันโดย อสม. ประจำหมู่บ้าน\n2. นัดตรวจภาพรังสีทรวงอก (CXR) และตรวจซ้ำผู้สัมผัสที่ 3 และ 6 เดือน\n3. จัดสิ่งแวดล้อมภายในบ้านให้มีแสงแดดส่องถึงและระบายอากาศสะดวก'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modern Sign-Off Block */}
                <div className="border-t-2 border-slate-200 pt-3">
                  <div className="grid grid-cols-3 gap-4 text-xs text-center">
                    
                    {/* Investigator */}
                    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 space-y-2">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">ผู้สอบสวนโรค</div>
                      <div className="h-9 border-b border-dashed border-slate-300 flex items-center justify-center">
                        <span className="font-serif italic text-slate-400 text-xs">(ลงลายมือชื่อดิจิทัล)</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{investigation.investigatorName || 'เจ้าหน้าที่ระบาดวิทยา'}</p>
                        <p className="text-[10px] text-slate-500">{investigation.investigatorRole || 'นักวิชาการสาธารณสุขปฏิบัติการ'}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">วันที่: {investigation.investigationDate || '-'}</p>
                      </div>
                    </div>

                    {/* TB Coordinator */}
                    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 space-y-2">
                      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">ผู้ประสานงานคลินิกวัณโรค</div>
                      <div className="h-9 border-b border-dashed border-slate-300 flex items-center justify-center">
                        <span className="font-serif italic text-slate-400 text-xs">...................................................</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">(พยาบาลวิชาชีพชำนาญการ)</p>
                        <p className="text-[10px] text-slate-500">ผู้ตรวจสอบข้อมูลคลินิก TB</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">โรงพยาบาลโพนนาแก้ว</p>
                      </div>
                    </div>

                    {/* Attending Doctor */}
                    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 space-y-2">
                      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">แพทย์ผู้ตรวจรักษา / ผอ.รพ.</div>
                      <div className="h-9 border-b border-dashed border-slate-300 flex items-center justify-center">
                        <span className="font-serif italic text-slate-400 text-xs">...................................................</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">(นายแพทย์ผู้ตรวจรักษา)</p>
                        <p className="text-[10px] text-slate-500">ผู้รับรองรายงานการสอบสวนโรค</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">CUP โพนนาแก้ว จ.สกลนคร</p>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-400 pt-2">
                  เอกสารหน้า ๒ จาก ๒ &bull; Smart TB Care Electronic Record
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* LAYOUT 2: OFFICIAL STANDARD FORM (แบบ รง. 506) */}
          {/* ========================================================================= */}
          {printLayout === 'official-standard' && (
            <div className="space-y-4 font-serif">
              {/* PAGE 1 */}
              <div className="print-page border border-black p-5 sm:p-6 mb-6 print:border-none print:p-0 print:mb-0 print:break-after-page">
                {/* Official Header */}
                <div className="text-center relative border-b-2 border-black pb-3 mb-3">
                  <div className="flex justify-between items-start">
                    
                    {/* Thai Public Health Insignia */}
                    <div className="w-16 h-16 shrink-0 flex items-center justify-center border border-black rounded-full text-center p-1 font-sans">
                      <div className="text-[9px] font-bold leading-tight">
                        กระทรวง<br/>สาธารณสุข<br/>MOPH
                      </div>
                    </div>

                    {/* Title */}
                    <div className="flex-1 px-2 space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-700 tracking-wider">แบบ รง. ๕๐๖ / กองวัณโรค กรมควบคุมโรค</div>
                      <h1 className="text-base sm:text-lg font-bold tracking-tight text-black">
                        แบบสอบสวนทางระบาดวิทยาผู้ป่วยวัณโรค (TB Case Investigation Form)
                      </h1>
                      <div className="text-xs font-bold">
                        โรงพยาบาลโพนนาแก้ว / สำนักงานสาธารณสุขอำเภอโพนนาแก้ว จังหวัดสกลนคร
                      </div>
                      <div className="text-[11px] text-slate-700">
                        เครือข่ายบริการสุขภาพอำเภอโพนนาแก้ว (CUP Phon Na Kaeo)
                      </div>
                    </div>

                    {/* Case Number Box */}
                    <div className="w-44 border border-black p-1.5 text-[10px] text-left shrink-0 bg-slate-50/50">
                      <div><strong>เลขที่สอบสวน:</strong> {investigation.investigationNumber || '-'}</div>
                      <div><strong>วันที่สอบสวน:</strong> {investigation.investigationDate || '-'}</div>
                      <div><strong>รหัสสถานพยาบาล:</strong> 11066 (รพ.โพนนาแก้ว)</div>
                    </div>
                  </div>
                </div>

                {/* SECTION 1: ข้อมูลทั่วไปของผู้ป่วย */}
                <div className="mb-3 border border-black">
                  <div className="bg-slate-200 px-2 py-0.5 font-bold text-xs border-b border-black flex justify-between items-center">
                    <span>ส่วนที่ ๑: ข้อมูลทั่วไปของผู้ป่วย (Patient Identification & Demographics)</span>
                    <span className="text-[10px] font-normal">HN: <strong className="font-mono">{investigation.hn}</strong></span>
                  </div>
                  
                  <div className="p-2 space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-slate-200">
                      <span className="font-semibold">เลขประจำตัวประชาชน (๑๓ หลัก):</span>
                      <div className="flex items-center gap-0.5 font-mono font-bold text-[11px]">
                        {idCardDigits.slice(0, 1).map((d, i) => (
                          <span key={i} className="w-4 h-4 border border-black flex items-center justify-center">{d}</span>
                        ))}
                        <span className="px-0.5">-</span>
                        {idCardDigits.slice(1, 5).map((d, i) => (
                          <span key={i} className="w-4 h-4 border border-black flex items-center justify-center">{d}</span>
                        ))}
                        <span className="px-0.5">-</span>
                        {idCardDigits.slice(5, 10).map((d, i) => (
                          <span key={i} className="w-4 h-4 border border-black flex items-center justify-center">{d}</span>
                        ))}
                        <span className="px-0.5">-</span>
                        {idCardDigits.slice(10, 12).map((d, i) => (
                          <span key={i} className="w-4 h-4 border border-black flex items-center justify-center">{d}</span>
                        ))}
                        <span className="px-0.5">-</span>
                        {idCardDigits.slice(12, 13).map((d, i) => (
                          <span key={i} className="w-4 h-4 border border-black flex items-center justify-center">{d}</span>
                        ))}
                      </div>
                      <span className="ml-auto text-[11px]">
                        <strong>สิทธิการรักษา:</strong> บัตรประกันสุขภาพถ้วนหน้า (UC)
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-1.5">
                      <div className="col-span-5">
                        <strong>ชื่อ-สกุล:</strong> {investigation.prefix}{investigation.firstName} {investigation.lastName}
                      </div>
                      <div className="col-span-2">
                        <strong>เพศ:</strong> {investigation.gender}
                      </div>
                      <div className="col-span-2">
                        <strong>อายุ:</strong> {investigation.age} ปี
                      </div>
                      <div className="col-span-3">
                        <strong>สัญชาติ:</strong> {investigation.nationality || 'ไทย'}
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-1.5">
                      <div className="col-span-4">
                        <strong>สถานภาพ:</strong> {investigation.maritalStatus || 'สมรส'}
                      </div>
                      <div className="col-span-4">
                        <strong>อาชีพ:</strong> {investigation.occupation || 'เกษตรกรรม'}
                      </div>
                      <div className="col-span-4">
                        <strong>เบอร์โทรศัพท์:</strong> {investigation.phone || '-'}
                      </div>
                    </div>

                    <div className="pt-0.5">
                      <strong>ที่อยู่ขณะเริ่มป่วย:</strong> บ้านเลขที่ {investigation.houseNo || '-'} {investigation.villageNo ? `หมู่ที่ ${investigation.villageNo}` : ''} {investigation.villageName} {investigation.subdistrict} อำเภอ{investigation.district || 'โพนนาแก้ว'} จังหวัด{investigation.province || 'สกลนคร'}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: ประวัติการเจ็บป่วย */}
                <div className="mb-3 border border-black">
                  <div className="bg-slate-200 px-2 py-0.5 font-bold text-xs border-b border-black">
                    ส่วนที่ ๒: ประวัติการเจ็บป่วยและอาการสำคัญ (Clinical History & Timeline)
                  </div>
                  <div className="p-2 space-y-1.5 text-xs">
                    <div className="grid grid-cols-4 gap-2 pb-1.5 border-b border-slate-200">
                      <div><strong>วันเริ่มมีอาการ:</strong> {investigation.onsetDate || '-'}</div>
                      <div><strong>วันตรวจครั้งแรก:</strong> {investigation.firstConsultDate || '-'}</div>
                      <div><strong>วันวินิจฉัย:</strong> {investigation.diagnosisDate || '-'}</div>
                      <div><strong>วันเริ่มยาวัณโรค:</strong> {investigation.treatmentStartDate || '-'}</div>
                    </div>

                    <div>
                      <div className="font-semibold text-[11px] mb-1">อาการสำคัญขณะป่วย:</div>
                      <div className="grid grid-cols-3 gap-1 bg-slate-50/70 p-1.5 border border-slate-300 text-[11px]">
                        {renderBadge(investigation.symptoms?.chronicCough, "ไอเรื้อรัง > ๒ สัปดาห์")}
                        {renderBadge(investigation.symptoms?.hemoptysis, "ไอเป็นเลือด")}
                        {renderBadge(investigation.symptoms?.afternoonFever, "ไข้ต่ำบ่าย/ค่ำ")}
                        {renderBadge(investigation.symptoms?.nightSweats, "เหงื่อออกกลางคืน")}
                        {renderBadge(investigation.symptoms?.weightLoss, "น้ำหนักลด")}
                        {renderBadge(investigation.symptoms?.lossOfAppetite, "เบื่ออาหาร/เพลีย")}
                        {renderBadge(investigation.symptoms?.chestPain, "เจ็บแน่นหน้าอก")}
                        {renderBadge(investigation.symptoms?.dyspnea, "เหนื่อยหอบ")}
                        {renderBadge(investigation.symptoms?.lymphNodeSwelling, "ต่อมน้ำเหลืองโต")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: ปัจจัยเสี่ยงและโรคร่วม */}
                <div className="mb-3 border border-black">
                  <div className="bg-slate-200 px-2 py-0.5 font-bold text-xs border-b border-black">
                    ส่วนที่ ๓: ประวัติความเสี่ยง โรคร่วม และปัจจัยแวดล้อมทางระบาดวิทยา
                  </div>
                  <div className="p-2 space-y-1.5 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div><strong>การสูบบุหรี่:</strong> {investigation.smoking || 'ไม่สูบ'}</div>
                      <div><strong>การดื่มสุรา:</strong> {investigation.alcohol || 'ไม่ดื่ม'}</div>
                      <div><strong>Anti-HIV:</strong> <b>{investigation.hivStatus || 'Negative'}</b></div>
                      <div><strong>เคยป่วย TB:</strong> {investigation.pastTbHistory ? 'เคย' : 'ไม่เคย'}</div>
                      <div><strong>สัมผัสผู้ป่วย TB:</strong> {investigation.historyOfTbContact ? 'มีประวัติ' : 'ไม่มี'}</div>
                      <div><strong>ผู้อาศัยร่วมบ้าน:</strong> {investigation.householdMembersCount || 1} คน</div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: การตรวจทางห้องปฏิบัติการ */}
                <div className="border border-black">
                  <div className="bg-slate-200 px-2 py-0.5 font-bold text-xs border-b border-black">
                    ส่วนที่ ๔: การตรวจทางห้องปฏิบัติการและรังสีวิทยา
                  </div>
                  <div className="p-2 space-y-1.5 text-xs">
                    <div className="grid grid-cols-2 gap-2 pb-1 border-b border-slate-200">
                      <div><strong>ภาพรังสีทรวงอก (CXR):</strong> {investigation.cxrResult || 'Abnormal TB Suspect'} ({investigation.cxrLesionType})</div>
                      <div><strong>GeneXpert MTB/RIF:</strong> <b>{investigation.geneXpertResult || 'MTB detected, Rif Resistance not detected'}</b></div>
                    </div>
                    <div>
                      <table className="w-full border-collapse border border-black text-center text-xs">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-black py-0.5">AFB Spot 1</th>
                            <th className="border border-black py-0.5">AFB Morning</th>
                            <th className="border border-black py-0.5">AFB Spot 2</th>
                            <th className="border border-black py-0.5">วันที่ตรวจ</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-black py-1 font-bold">{investigation.afbSmear1 || '2+'}</td>
                            <td className="border border-black py-1 font-bold">{investigation.afbSmear2 || '2+'}</td>
                            <td className="border border-black py-1 font-bold">{investigation.afbSmear3 || '1+'}</td>
                            <td className="border border-black py-1">{investigation.afbDate || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-500 pt-2 print:block">
                  - หน้า ๑ จาก ๒ -
                </div>
              </div>

              {/* PAGE 2 */}
              <div className="print-page border border-black p-5 sm:p-6 print:border-none print:p-0">
                <div className="flex justify-between items-center border-b border-black pb-1 mb-2 text-xs">
                  <span className="font-bold">แบบสอบสวนผู้ป่วยวัณโรค (ต่อ) - HN: {investigation.hn} ({investigation.prefix}{investigation.firstName} {investigation.lastName})</span>
                  <span className="text-[10px]">เลขที่สอบสวน: {investigation.investigationNumber}</span>
                </div>

                {/* SECTION 5 */}
                <div className="mb-3 border border-black">
                  <div className="bg-slate-200 px-2 py-0.5 font-bold text-xs border-b border-black">
                    ส่วนที่ ๕: การวินิจฉัยและการรักษา
                  </div>
                  <div className="p-2 text-xs grid grid-cols-3 gap-2">
                    <div><strong>ประเภทผู้ป่วย:</strong> {investigation.patientCategory || 'New'}</div>
                    <div><strong>ชนิดวัณโรค:</strong> <span className="font-bold text-red-800">{investigation.tbType || 'Pulmonary Smear+'}</span></div>
                    <div><strong>สูตรยา:</strong> <span className="font-bold text-emerald-800">{investigation.treatmentRegimen || '2HRZE/4HR'}</span></div>
                    <div className="col-span-3 pt-1 border-t border-slate-200">
                      <strong>ผู้กำกับยา DOTS:</strong> {investigation.dotsSupervisorName || '-'} ({investigation.dotsSupervisorType || 'อสม.'})
                    </div>
                  </div>
                </div>

                {/* SECTION 6 */}
                <div className="mb-3 border border-black">
                  <div className="bg-slate-200 px-2 py-0.5 font-bold text-xs border-b border-black">
                    ส่วนที่ ๖: การค้นหาและติดตามผู้สัมผัสโรคร่วมบ้าน
                  </div>
                  <div className="p-2 text-xs">
                    <table className="w-full border-collapse border border-black text-left text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 text-center font-bold">
                          <th className="border border-black py-0.5 px-1">ลำดับ</th>
                          <th className="border border-black py-0.5 px-2">ชื่อ-สกุล</th>
                          <th className="border border-black py-0.5 px-1">ความสัมพันธ์</th>
                          <th className="border border-black py-0.5 px-1">ผล CXR</th>
                          <th className="border border-black py-0.5 px-1">ผลเสมหะ</th>
                          <th className="border border-black py-0.5 px-1">การให้ยา / TPT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts && contacts.length > 0 ? (
                          contacts.map((c, idx) => (
                            <tr key={c.id}>
                              <td className="border border-black py-0.5 px-1 text-center">{idx + 1}</td>
                              <td className="border border-black py-0.5 px-2 font-medium">{c.prefix}{c.firstName} {c.lastName}</td>
                              <td className="border border-black py-0.5 px-1 text-center">{c.relationship || 'ร่วมบ้าน'}</td>
                              <td className="border border-black py-0.5 px-1 text-center">{c.cxrResult || 'CXR Normal'}</td>
                              <td className="border border-black py-0.5 px-1 text-center">{c.afbResult || 'Negative'}</td>
                              <td className="border border-black py-0.5 px-1 text-center">{c.tptRegimen ? `TPT (${c.tptRegimen})` : c.outcome || 'เฝ้าระวัง'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="border border-black py-1 px-1 text-center">๑</td>
                            <td className="border border-black py-1 px-2 font-medium">ผู้สัมผัสร่วมบ้านรายที่ ๑</td>
                            <td className="border border-black py-1 px-1 text-center">คู่สมรส</td>
                            <td className="border border-black py-1 px-1 text-center">CXR ปกติ</td>
                            <td className="border border-black py-1 px-1 text-center">Negative</td>
                            <td className="border border-black py-1 px-1 text-center">เฝ้าระวังอาการ ๖ เดือน</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 7 */}
                <div className="mb-4 border border-black">
                  <div className="bg-slate-200 px-2 py-0.5 font-bold text-xs border-b border-black">
                    ส่วนที่ ๗: สรุปผลการสอบสวนและมาตรการควบคุมโรค
                  </div>
                  <div className="p-2 text-xs space-y-1.5">
                    <div>
                      <strong>สรุปผลการสอบสวน:</strong> {investigation.investigationSummary}
                    </div>
                    <div>
                      <strong>มาตรการควบคุมโรค:</strong> {investigation.controlMeasuresTaken}
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-2 border-t-2 border-black grid grid-cols-3 gap-4 text-xs text-center">
                  <div className="space-y-3">
                    <p>ลงชื่อ............................................................</p>
                    <p className="font-bold">({investigation.investigatorName || 'ผู้สอบสวนโรค'})</p>
                    <p className="text-[10px] text-slate-500">เจ้าหน้าที่ระบาดวิทยา</p>
                  </div>
                  <div className="space-y-3">
                    <p>ลงชื่อ............................................................</p>
                    <p className="font-bold">(ผู้ประสานงาน TB Clinic)</p>
                    <p className="text-[10px] text-slate-500">พยาบาลวิชาชีพ</p>
                  </div>
                  <div className="space-y-3">
                    <p>ลงชื่อ............................................................</p>
                    <p className="font-bold">(แพทย์ผู้ตรวจรักษา)</p>
                    <p className="text-[10px] text-slate-500">ผู้อำนวยการโรงพยาบาล</p>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-500 pt-3 print:block">
                  - หน้า ๒ จาก ๒ -
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* LAYOUT 3: ONE-PAGE COMPACT EXECUTIVE SUMMARY */}
          {/* ========================================================================= */}
          {printLayout === 'summary-onepage' && (
            <div className="border border-slate-300 rounded-2xl p-5 text-xs text-slate-900 bg-white shadow-sm space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    MOPH
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-900">
                      สรุปผลการสอบสวนโรคผู้ป่วยวัณโรค (TB Case Executive Summary)
                    </h2>
                    <p className="text-[10px] text-slate-500">
                      รพ.โพนนาแก้ว / สสอ.โพนนาแก้ว จ.สกลนคร &bull; SMART TB CARE 4.0
                    </p>
                  </div>
                </div>
                <div className="text-right text-[10px]">
                  <div><strong>เลขที่:</strong> {investigation.investigationNumber}</div>
                  <div><strong>วันที่:</strong> {investigation.investigationDate}</div>
                </div>
              </div>

              {/* Patient Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <div className="grid grid-cols-12 gap-1.5">
                  <div className="col-span-5 font-bold text-sm text-slate-900">
                    {investigation.prefix}{investigation.firstName} {investigation.lastName} (HN: {investigation.hn})
                  </div>
                  <div className="col-span-3 text-slate-700">เพศ: {investigation.gender} / อายุ: {investigation.age} ปี</div>
                  <div className="col-span-4 text-right font-mono text-[11px]">เลขบัตร ปชช: {investigation.idCard || '-'}</div>
                  <div className="col-span-12 pt-1 border-t border-slate-200 text-[11px] text-slate-600">
                    ที่อยู่: บ้านเลขที่ {investigation.houseNo || '-'} {investigation.villageName} {investigation.subdistrict} อ.{investigation.district || 'โพนนาแก้ว'} จ.{investigation.province || 'สกลนคร'} (โทร: {investigation.phone || '-'})
                  </div>
                </div>
              </div>

              {/* Grid Diagnosis & Lab */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="border border-slate-200 rounded-xl p-2.5 bg-white">
                  <div className="font-bold text-[11px] text-slate-900 border-b border-slate-100 pb-1 mb-1.5 flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5 text-emerald-600" />
                    <span>การวินิจฉัยและการรักษา</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div>ประเภทผู้ป่วย: <b>{investigation.patientCategory}</b></div>
                    <div>ชนิดวัณโรค: <b className="text-red-700">{investigation.tbType}</b> (ICD-10: {investigation.icd10Code})</div>
                    <div>สูตรยาที่รักษา: <b className="text-emerald-700 font-bold">{investigation.treatmentRegimen}</b></div>
                    <div>ผู้กำกับยา DOTS: <b>{investigation.dotsSupervisorName || '-'}</b> ({investigation.dotsSupervisorType})</div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-2.5 bg-white">
                  <div className="font-bold text-[11px] text-slate-900 border-b border-slate-100 pb-1 mb-1.5 flex items-center gap-1">
                    <Microscope className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ผลการตรวจทางห้องปฏิบัติการ</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div>ภาพรังสีทรวงอก (CXR): <b>{investigation.cxrResult}</b> ({investigation.cxrLesionType})</div>
                    <div>AFB Baseline Smear: <b className="text-red-700">{investigation.afbSmear1} / {investigation.afbSmear2} / {investigation.afbSmear3}</b></div>
                    <div>GeneXpert MTB/RIF: <b className="text-emerald-800">{investigation.geneXpertResult}</b></div>
                    <div>Anti-HIV: <b>{investigation.hivStatus}</b></div>
                  </div>
                </div>
              </div>

              {/* Contacts Summary */}
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                <div className="font-bold text-[11px] text-slate-900 border-b border-slate-200 pb-1 mb-1.5 flex justify-between">
                  <span>การค้นหาผู้สัมผัสโรคร่วมบ้านและมาตรการควบคุม</span>
                  <span className="text-emerald-700">ผู้สัมผัส {investigation.contactsIdentified || contacts.length || 0} คน &bull; คัดกรองแล้ว {investigation.contactsScreened || 0} คน</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div><strong>สรุปการสอบสวน:</strong> {investigation.investigationSummary}</div>
                  <div><strong>มาตรการควบคุมโรค:</strong> {investigation.controlMeasuresTaken}</div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-6 text-center text-[10px]">
                <div className="space-y-1">
                  <p>ลงชื่อ...........................................................................</p>
                  <p className="font-bold">({investigation.investigatorName || 'เจ้าหน้าที่ระบาดวิทยา'})</p>
                  <p className="text-slate-500">ผู้สอบสวนโรค รพ.โพนนาแก้ว</p>
                </div>
                <div className="space-y-1">
                  <p>ลงชื่อ...........................................................................</p>
                  <p className="font-bold">(แพทย์ผู้ตรวจรักษา)</p>
                  <p className="text-slate-500">ผู้อำนวยการโรงพยาบาลโพนนาแก้ว</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
