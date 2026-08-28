import React from 'react';
import { HomeVisitRecord, Patient, HouseholdContact } from '../types';
import { Printer, X, Compass, FileText, CheckSquare, Square } from 'lucide-react';
import { openGoogleMapsNavigation, getGoogleMapsDirectionsUrl } from '../utils/navigation';

interface HomeVisitPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: HomeVisitRecord;
  patient?: Patient | null;
  contacts?: HouseholdContact[];
}

export const HomeVisitPrintModal: React.FC<HomeVisitPrintModalProps> = ({
  isOpen,
  onClose,
  record,
  patient,
  contacts = []
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const gmapsUrl = getGoogleMapsDirectionsUrl({
    lat: record.visitLat,
    lng: record.visitLng,
    address: `${record.houseNo ? `บ้านเลขที่ ${record.houseNo} ` : ''}${record.village} ${record.subdistrict}`,
    name: record.patientName
  });

  // Helpers for checkbox rendering
  const renderCheck = (checked?: boolean) => (
    <span className="inline-flex items-center mr-1 font-mono text-base font-bold leading-none select-none">
      {checked ? '☑' : '☐'}
    </span>
  );

  const dotsLogs = record.past7DaysDoseLogs && record.past7DaysDoseLogs.length > 0 
    ? record.past7DaysDoseLogs 
    : [
        { day: 'จันทร์', takenStatus: 'ครบ', supervisorName: record.dotsSupervisor?.name || record.dotsSupervisorSignName || '', notes: '' },
        { day: 'อังคาร', takenStatus: 'ครบ', supervisorName: record.dotsSupervisor?.name || record.dotsSupervisorSignName || '', notes: '' },
        { day: 'พุธ', takenStatus: 'ครบ', supervisorName: record.dotsSupervisor?.name || record.dotsSupervisorSignName || '', notes: '' },
        { day: 'พฤหัสบดี', takenStatus: 'ครบ', supervisorName: record.dotsSupervisor?.name || record.dotsSupervisorSignName || '', notes: '' },
        { day: 'ศุกร์', takenStatus: 'ครบ', supervisorName: record.dotsSupervisor?.name || record.dotsSupervisorSignName || '', notes: '' },
        { day: 'เสาร์', takenStatus: 'ครบ', supervisorName: record.dotsSupervisor?.name || record.dotsSupervisorSignName || '', notes: '' },
        { day: 'อาทิตย์', takenStatus: 'ครบ', supervisorName: record.dotsSupervisor?.name || record.dotsSupervisorSignName || '', notes: '' },
      ];

  const patientContacts = contacts.filter(c => 
    c.indexPatientId === record.patientId || c.indexPatientHN === record.patientHN
  );

  const contactList = record.contactsList && record.contactsList.length > 0 
    ? record.contactsList 
    : (patientContacts.length > 0
        ? patientContacts.map(c => ({
            name: `${c.prefix || ''}${c.firstName} ${c.lastName}`,
            age: c.age || '-',
            relationship: c.relationship || 'ผู้สัมผัสร่วมบ้าน',
            hasSuspiciousSymptoms: Boolean(c.symptoms?.coughOver2Weeks || c.symptoms?.fever || c.symptoms?.haemoptysis),
            isScreened: c.cxrResult !== 'Pending' && c.cxrResult !== 'Not Done'
          }))
        : [
            { name: '', age: '', relationship: '', hasSuspiciousSymptoms: false, isScreened: false },
            { name: '', age: '', relationship: '', hasSuspiciousSymptoms: false, isScreened: false },
            { name: '', age: '', relationship: '', hasSuspiciousSymptoms: false, isScreened: false }
          ]
      );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between shrink-0 print:hidden shadow-md">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">
              พิมพ์แบบฟอร์มเยี่ยมบ้านผู้ป่วยวัณโรค (TB Home Visit) - รพ.โพนนาแก้ว (4 หน้า)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openGoogleMapsNavigation({
                lat: record.visitLat,
                lng: record.visitLng,
                address: `${record.houseNo ? `บ้านเลขที่ ${record.houseNo} ` : ''}${record.village} ${record.subdistrict}`,
                name: record.patientName
              })}
              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
              title="เปิดนำทางด้วย Google Maps"
            >
              <Compass className="w-4 h-4" />
              <span>นำทาง Google Maps</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร 4 หน้า / บันทึก PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="overflow-y-auto p-4 sm:p-8 text-slate-900 text-[13px] leading-relaxed bg-white print:p-0 print:text-black font-sans">
          
          {/* ============================================================== */}
          {/* PAGE 1: ข้อมูลผู้ป่วย, การรักษา, การประเมินยาและอาการ */}
          {/* ============================================================== */}
          <div className="min-h-[1050px] p-6 sm:p-10 border border-slate-300 rounded-lg mb-8 bg-white print:border-none print:p-0 print:m-0 print:min-h-screen print:break-after-page flex flex-col justify-between">
            <div>
              {/* Header Title */}
              <div className="text-center mb-5 pb-3 border-b border-slate-400">
                <div className="text-sm font-semibold text-slate-700">
                  กลุ่มงานบริการด้านปฐมภูมิและองค์รวม โรงพยาบาลโพนนาแก้ว
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-wide mt-0.5">
                  แบบฟอร์มเยี่ยมบ้านผู้ป่วยวัณโรค (TB Home Visit)
                </h1>
              </div>

              {/* Service Unit & Visit Details */}
              <div className="space-y-1.5 mb-4 text-[13px]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <strong>หน่วยบริการ:</strong> <span className="underline decoration-dotted ml-1">{record.serviceUnit || record.visitorUnit || 'โรงพยาบาลโพนนาแก้ว'}</span>
                  </div>
                  <div>
                    <strong>วันที่เยี่ยมบ้าน:</strong> <span className="underline decoration-dotted mx-1 font-semibold">{record.visitDate || '-'}</span>
                    <strong>เวลา:</strong> <span className="underline decoration-dotted ml-1">{record.visitTime ? `${record.visitTime} น.` : '......... น.'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-1">
                  <strong>ครั้งที่เยี่ยม:</strong>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    {renderCheck(record.visitRoundType === 'ครั้งที่ 1' || record.visitRound === 1)} ครั้งที่ 1
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    {renderCheck(record.visitRoundType === 'ครั้งที่ 2' || record.visitRound === 2)} ครั้งที่ 2
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    {renderCheck(record.visitRoundType === 'ติดตามต่อเนื่อง' || (record.visitRound && record.visitRound > 2))} ติดตามต่อเนื่อง
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <strong>ผู้เยี่ยมบ้าน:</strong> <span className="underline decoration-dotted ml-1 font-medium">{record.visitorName} ({record.visitorRole})</span>
                  </div>
                  <div>
                    <strong>ผู้ร่วมเยี่ยมบ้าน:</strong> <span className="underline decoration-dotted ml-1 font-medium">{record.coVisitorName || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 1. ข้อมูลผู้ป่วย */}
              <div className="mt-4 mb-4">
                <div className="font-bold text-slate-900 bg-slate-100 print:bg-slate-100 px-2 py-1 rounded text-[13.5px] border-l-4 border-slate-800">
                  1. ข้อมูลผู้ป่วย
                </div>
                <div className="px-2 pt-2 space-y-2 text-[13px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><strong>ชื่อ–สกุล:</strong> <span className="underline decoration-dotted ml-1 font-semibold">{record.patientName}</span></div>
                    <div><strong>HN:</strong> <span className="underline decoration-dotted ml-1 font-mono font-bold">{record.patientHN}</span> &nbsp;&nbsp; <strong>เลขบัตรประชาชน:</strong> <span className="underline decoration-dotted ml-1 font-mono">{record.idCard || patient?.idCard || '-'}</span></div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div><strong>อายุ:</strong> <span className="underline decoration-dotted mx-1">{record.age || patient?.age || '-'}</span> ปี</div>
                    <div className="flex items-center gap-3">
                      <strong>เพศ:</strong>
                      <label className="inline-flex items-center gap-1">{renderCheck((record.gender || patient?.gender) === 'ชาย')} ชาย</label>
                      <label className="inline-flex items-center gap-1">{renderCheck((record.gender || patient?.gender) === 'หญิง')} หญิง</label>
                      <label className="inline-flex items-center gap-1">{renderCheck((record.gender || patient?.gender) === 'อื่น ๆ')} อื่น ๆ</label>
                    </div>
                  </div>

                  <div>
                    <strong>ที่อยู่:</strong> <span className="underline decoration-dotted ml-1">{record.houseNo ? `บ้านเลขที่ ${record.houseNo} ` : ''}{record.village} {record.subdistrict} อ.โพนนาแก้ว จ.สกลนคร</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><strong>โทรศัพท์:</strong> <span className="underline decoration-dotted ml-1 font-mono">{record.phone || patient?.phone || '-'}</span></div>
                    <div><strong>ผู้ดูแลหลัก/ความสัมพันธ์:</strong> <span className="underline decoration-dotted ml-1">{record.primaryCaregiver || record.dotsSupervisor?.name || patient?.dotsSupervisorName || '-'}</span> (โทร: <span className="underline decoration-dotted">{record.caregiverPhone || record.dotsSupervisorPhone || patient?.dotsSupervisorPhone || '-'}</span>)</div>
                  </div>
                </div>
              </div>

              {/* 2. ข้อมูลการรักษาวัณโรค */}
              <div className="mt-4 mb-4">
                <div className="font-bold text-slate-900 bg-slate-100 print:bg-slate-100 px-2 py-1 rounded text-[13.5px] border-l-4 border-slate-800">
                  2. ข้อมูลการรักษาวัณโรค
                </div>
                <div className="px-2 pt-2 space-y-2 text-[13px]">
                  <div className="flex flex-wrap items-center gap-3">
                    <strong>ประเภทผู้ป่วย:</strong>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.patientCategoryOfficial === 'ผู้ป่วยใหม่' || !record.patientCategoryOfficial)} ผู้ป่วยใหม่</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.patientCategoryOfficial === 'รักษาซ้ำ')} รักษาซ้ำ</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.patientCategoryOfficial === 'วัณโรคดื้อยา')} วัณโรคดื้อยา</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.patientCategoryOfficial === 'อื่น ๆ')} อื่น ๆ <span className="underline decoration-dotted ml-1">{record.patientCategoryOther || '................'}</span></label>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <strong>ตำแหน่งโรค:</strong>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.diseaseSite === 'วัณโรคปอด' || !record.diseaseSite || (patient?.tbType && patient.tbType.includes('Pulmonary')))} วัณโรคปอด</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.diseaseSite === 'วัณโรคนอกปอด' || (patient?.tbType && patient.tbType.includes('Extrapulmonary')))} วัณโรคนอกปอด ระบุ <span className="underline decoration-dotted ml-1">{record.extrapulmonarySite || (patient?.tbType?.includes('Extrapulmonary') ? patient.tbType : '........................')}</span></label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><strong>วันที่เริ่มรักษา:</strong> <span className="underline decoration-dotted ml-1">{record.treatmentStartDate || patient?.treatmentStartDate || '-'}</span></div>
                    <div><strong>สูตรยา:</strong> <span className="underline decoration-dotted ml-1 font-mono font-bold text-emerald-800">{record.regimen || patient?.regimen || '2HRZE/4HR'}</span></div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <strong>ระยะการรักษา:</strong>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.treatmentPhase === 'ระยะเข้มข้น' || !record.treatmentPhase)} ระยะเข้มข้น</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.treatmentPhase === 'ระยะต่อเนื่อง')} ระยะต่อเนื่อง</label>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <strong>ผู้กำกับการกินยา (DOT):</strong>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.dotSupervisorTypeOfficial === 'ญาติ' || record.dotsSupervisor?.type === 'ญาติผู้ดูแล')} ญาติ</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.dotSupervisorTypeOfficial === 'อสม.' || record.dotsSupervisor?.type === 'อสม. พี่เลี้ยง' || !record.dotSupervisorTypeOfficial)} อสม.</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.dotSupervisorTypeOfficial === 'บุคลากรสาธารณสุข' || record.dotSupervisorTypeOfficial === 'เจ้าหน้าที่สาธารณสุข' || record.dotsSupervisor?.type === 'เจ้าหน้าที่ รพ.สต.')} บุคลากรสาธารณสุข</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.dotSupervisorTypeOfficial === 'อื่น ๆ')} อื่น ๆ <span className="underline decoration-dotted ml-1">{record.dotSupervisorOther || '............'}</span></label>
                  </div>
                </div>
              </div>

              {/* 3. การประเมินการกินยาและอาการ */}
              <div className="mt-4 mb-4">
                <div className="font-bold text-slate-900 bg-slate-100 print:bg-slate-100 px-2 py-1 rounded text-[13.5px] border-l-4 border-slate-800">
                  3. การประเมินการกินยาและอาการ
                </div>
                <div className="px-2 pt-2 space-y-2 text-[13px]">
                  <div className="flex flex-wrap items-center gap-4">
                    <strong>การกินยาตามแผน:</strong>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.medicationPlanAdherence === 'ครบทุกวัน' || record.missedDosesLast2Weeks === 0 || !record.medicationPlanAdherence)} ครบทุกวัน</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.medicationPlanAdherence === 'ขาดยา' || (record.missedDosesLast2Weeks && record.missedDosesLast2Weeks > 0))} ขาดยา จำนวน <span className="underline decoration-dotted font-bold mx-1">{record.missedDaysCount || record.missedDosesLast2Weeks || '.....'}</span> วัน</label>
                  </div>

                  <div>
                    <strong>สาเหตุการขาดยา:</strong> <span className="underline decoration-dotted ml-1">{record.missedReason || '-'}</span>
                  </div>

                  <div className="pt-1">
                    <strong className="block mb-1">อาการปัจจุบัน:</strong>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pl-2 text-[12.5px]">
                      <label className="inline-flex items-center gap-1">{renderCheck(record.evaluatedSymptoms?.cough || record.symptoms?.cough?.includes('ไอ'))} ไอ</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.evaluatedSymptoms?.productiveCough || (record.symptoms?.sputumCharacteristics && !record.symptoms.sputumCharacteristics.includes('ไม่มี')))} ไอมีเสมหะ</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.evaluatedSymptoms?.hemoptysis || record.symptoms?.cough?.includes('เลือด'))} ไอเป็นเลือด</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.evaluatedSymptoms?.fever || record.symptoms?.fever)} ไข้</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.evaluatedSymptoms?.nightSweats || record.symptoms?.nightSweats)} เหงื่อออกกลางคืน</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.evaluatedSymptoms?.weightLoss || record.vitals?.weightChange === 'ลดลง')} น้ำหนักลด</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.evaluatedSymptoms?.lossOfAppetite || record.symptoms?.appetite?.includes('เบื่อ'))} เบื่ออาหาร</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.evaluatedSymptoms?.dyspnea || record.symptoms?.dyspnea)} เหนื่อยหอบ</label>
                      <label className="inline-flex items-center gap-1 col-span-2">{renderCheck(record.evaluatedSymptoms?.noAbnormalSymptoms || (!record.symptoms?.fever && !record.symptoms?.nightSweats && record.symptoms?.cough === 'ไม่มี'))} ไม่มีอาการผิดปกติ</label>
                    </div>
                  </div>

                  <div className="pt-1">
                    <strong className="block mb-1">อาการไม่พึงประสงค์จากยา:</strong>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pl-2 text-[12.5px]">
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adverseDrugReactionsOfficial?.nauseaVomiting || record.sideEffects?.nauseaVomiting)} คลื่นไส้/อาเจียน</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adverseDrugReactionsOfficial?.itchingRash || record.sideEffects?.itchingRash)} ผื่นคัน</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adverseDrugReactionsOfficial?.jaundice || record.sideEffects?.jaundice)} ตัวเหลืองตาเหลือง</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adverseDrugReactionsOfficial?.peripheralNeuropathy || record.sideEffects?.numbness)} ชาปลายมือปลายเท้า</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adverseDrugReactionsOfficial?.blurredVision || record.sideEffects?.visionBlur)} ตามัว/มองเห็นผิดปกติ</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adverseDrugReactionsOfficial?.tinnitusHearingLoss || record.sideEffects?.tinnitusDizziness)} หูอื้อ/การได้ยินลดลง</label>
                      <label className="inline-flex items-center gap-1 col-span-3">{renderCheck(Boolean(record.adverseDrugReactionsOfficial?.otherAdr || record.sideEffects?.otherSideEffects))} อื่น ๆ <span className="underline decoration-dotted ml-1">{record.adverseDrugReactionsOfficial?.otherAdr || record.sideEffects?.otherSideEffects || '................................................'}</span></label>
                    </div>
                  </div>

                  <div className="pt-1">
                    <strong>การดำเนินการ:</strong> <span className="underline decoration-dotted ml-1">{record.clinicalActionTaken || record.recommendationsAndNotes || 'ให้คำแนะนำการรับประทานยาและติดตามอาการอย่างใกล้ชิด'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200 mt-2">
                    <div><strong>น้ำหนัก:</strong> <span className="underline decoration-dotted font-bold mx-1">{record.vitals?.bodyWeight || '-'}</span> กก.</div>
                    <div><strong>อุณหภูมิ:</strong> <span className="underline decoration-dotted font-bold mx-1">{record.vitals?.temperature || '-'}</span> °C</div>
                    <div><strong>ผลตรวจ/นัดตรวจครั้งถัดไป:</strong> <span className="underline decoration-dotted ml-1 font-semibold">{record.nextTestOrAppointment || record.nextAppointmentDate || '-'}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 1 Footer */}
            <div className="text-center text-[11px] text-slate-500 pt-4 border-t border-slate-300 mt-4">
              กลุ่มงานบริการด้านปฐมภูมิและองค์รวม โรงพยาบาลโพนนาแก้ว (หน้า 1/4)
            </div>
          </div>

          {/* ============================================================== */}
          {/* PAGE 2: การประเมินบ้าน, ผู้สัมผัส, คำแนะนำ, ปัญหาและแผน */}
          {/* ============================================================== */}
          <div className="min-h-[1050px] p-6 sm:p-10 border border-slate-300 rounded-lg mb-8 bg-white print:border-none print:p-0 print:m-0 print:min-h-screen print:break-after-page flex flex-col justify-between">
            <div>
              {/* Header Title */}
              <div className="text-center mb-4 pb-2 border-b border-slate-400">
                <div className="text-sm font-semibold text-slate-700">
                  กลุ่มงานบริการด้านปฐมภูมิและองค์รวม โรงพยาบาลโพนนาแก้ว
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  แบบฟอร์มเยี่ยมบ้านผู้ป่วยวัณโรค (TB Home Visit) - HN: {record.patientHN} ผู้ป่วย: {record.patientName}
                </div>
              </div>

              {/* 4. การประเมินบ้านและสิ่งแวดล้อม */}
              <div className="mb-4">
                <div className="font-bold text-slate-900 bg-slate-100 print:bg-slate-100 px-2 py-1 rounded text-[13.5px] border-l-4 border-slate-800">
                  4. การประเมินบ้านและสิ่งแวดล้อม
                </div>
                <div className="px-2 pt-2 space-y-2 text-[13px]">
                  <div className="flex flex-wrap items-center gap-4">
                    <strong>ลักษณะที่อยู่อาศัย:</strong>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.housingCondition === 'โปร่ง อากาศถ่ายเทดี' || record.environment?.ventilation?.includes('โปร่ง') || !record.housingCondition)} โปร่ง อากาศถ่ายเทดี</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.housingCondition === 'ค่อนข้างอับ' || record.environment?.ventilation?.includes('พอใช้'))} ค่อนข้างอับ</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.housingCondition === 'แออัด' || record.environment?.ventilation?.includes('แออัด'))} แออัด</label>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <strong>ห้องนอนผู้ป่วย:</strong>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.bedroomCondition === 'แยกห้อง' || record.environment?.bedroomType === 'แยกห้องนอนเดี่ยว' || !record.bedroomCondition)} แยกห้อง</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.bedroomCondition === 'ร่วมกับผู้อื่น' || record.environment?.bedroomType === 'นอนรวมกับสมาชิกในบ้าน')} ร่วมกับผู้อื่น จำนวน <span className="underline decoration-dotted mx-1 font-semibold">{record.bedroomSharedCount || (record.environment?.bedroomType === 'นอนรวมกับสมาชิกในบ้าน' ? 2 : '.....')}</span> คน</label>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <strong>การเปิดหน้าต่าง/ระบายอากาศ:</strong>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.windowVentilation === 'สม่ำเสมอ' || record.environment?.sunlightExposure === 'แดดส่องถึงห้องพัก' || !record.windowVentilation)} สม่ำเสมอ</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.windowVentilation === 'บางครั้ง')} บางครั้ง</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.windowVentilation === 'ไม่ได้เปิด' || record.environment?.sunlightExposure === 'แดดส่องไม่ถึง/ทึบ')} ไม่ได้เปิด</label>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <strong>การสวมหน้ากากเมื่ออยู่ร่วมกับผู้อื่น:</strong>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.maskWearingComplianceOfficial === 'สม่ำเสมอ' || record.environment?.maskWearingCompliance?.includes('สม่ำเสมอ') || !record.maskWearingComplianceOfficial)} สม่ำเสมอ</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.maskWearingComplianceOfficial === 'บางครั้ง' || record.environment?.maskWearingCompliance?.includes('ครั้งคราว'))} บางครั้ง</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.maskWearingComplianceOfficial === 'ไม่สวม' || record.environment?.maskWearingCompliance?.includes('ไม่สวม'))} ไม่สวม</label>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <strong>การกำจัดเสมหะ:</strong>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.sputumDisposalOfficial === 'ถูกสุขลักษณะ' || !record.environment?.sputumDisposalMethod?.includes('ไม่ถูกสุขลักษณะ') || !record.sputumDisposalOfficial)} ถูกสุขลักษณะ</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.sputumDisposalOfficial === 'ควรแนะนำเพิ่มเติม' || record.environment?.sputumDisposalMethod?.includes('ไม่ถูกสุขลักษณะ'))} ควรแนะนำเพิ่มเติม</label>
                  </div>

                  <div>
                    <strong>ข้อสังเกตอื่น ๆ:</strong> <span className="underline decoration-dotted ml-1">{record.environmentNotes || 'ผู้ป่วยพักผ่อนในบริเวณที่มีแสงแดดส่องถึง ลมพัดผ่านสะดวก'}</span>
                  </div>
                </div>
              </div>

              {/* 5. การคัดกรองผู้สัมผัสร่วมบ้าน */}
              <div className="mt-4 mb-4">
                <div className="font-bold text-slate-900 bg-slate-100 print:bg-slate-100 px-2 py-1 rounded text-[13.5px] border-l-4 border-slate-800">
                  5. การคัดกรองผู้สัมผัสร่วมบ้าน
                </div>
                <div className="px-2 pt-2 space-y-2 text-[13px]">
                  <div className="flex flex-wrap items-center gap-4">
                    <div><strong>จำนวนผู้อาศัยร่วมบ้าน:</strong> <span className="underline decoration-dotted font-bold mx-1">{record.householdMembersTotal || (patient?.householdMembersCount || 3)}</span> คน</div>
                    <div><strong>เด็กอายุต่ำกว่า 5 ปี:</strong> <span className="underline decoration-dotted font-bold mx-1">{record.childrenUnder5Count || 0}</span> คน</div>
                    <div><strong>ผู้สูงอายุ:</strong> <span className="underline decoration-dotted font-bold mx-1">{record.elderlyCount || (patient?.age && patient.age >= 60 ? 1 : 0)}</span> คน</div>
                    <div><strong>ผู้มีโรคประจำตัว/ภูมิคุ้มกันต่ำ:</strong> <span className="underline decoration-dotted font-bold mx-1">{record.chronicImmuneDeficientCount || 0}</span> คน</div>
                  </div>

                  {/* Contacts Table */}
                  <table className="w-full border border-slate-400 text-center text-xs mt-2 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 print:bg-slate-100 font-bold border-b border-slate-400">
                        <th className="border-r border-slate-400 p-1.5 text-left pl-3">ชื่อ–สกุลผู้สัมผัส</th>
                        <th className="border-r border-slate-400 p-1.5 w-16">อายุ</th>
                        <th className="border-r border-slate-400 p-1.5 w-28">ความสัมพันธ์</th>
                        <th className="border-r border-slate-400 p-1.5 w-36">มีอาการสงสัย TB</th>
                        <th className="p-1.5 w-44">ได้รับการคัดกรอง/ส่งตรวจ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contactList.map((c, idx) => (
                        <tr key={idx} className="border-b border-slate-300">
                          <td className="border-r border-slate-400 p-1.5 text-left pl-3 font-medium">
                            {c.name || '...................................................'}
                          </td>
                          <td className="border-r border-slate-400 p-1.5">
                            {c.age ? `${c.age} ปี` : '.......'}
                          </td>
                          <td className="border-r border-slate-400 p-1.5">
                            {c.relationship || '................'}
                          </td>
                          <td className="border-r border-slate-400 p-1.5">
                            <span className="inline-flex items-center gap-2">
                              <span>{renderCheck(c.hasSuspiciousSymptoms)} มี</span>
                              <span>{renderCheck(!c.hasSuspiciousSymptoms && Boolean(c.name))} ไม่มี</span>
                            </span>
                          </td>
                          <td className="p-1.5">
                            <span className="inline-flex items-center gap-2">
                              <span>{renderCheck(c.isScreened)} ใช่</span>
                              <span>{renderCheck(!c.isScreened && Boolean(c.name))} ไม่ใช่</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6. การให้คำแนะนำ */}
              <div className="mt-4 mb-4">
                <div className="font-bold text-slate-900 bg-slate-100 print:bg-slate-100 px-2 py-1 rounded text-[13.5px] border-l-4 border-slate-800">
                  6. การให้คำแนะนำ
                </div>
                <div className="px-2 pt-2 space-y-1.5 text-[12.5px]">
                  <label className="flex items-start gap-1">
                    {renderCheck(record.adviceChecklist?.takeMedsRegularly ?? true)}
                    <span>กินยาสม่ำเสมอและมาตามนัด</span>
                  </label>
                  <label className="flex items-start gap-1">
                    {renderCheck(record.adviceChecklist?.watchSideEffects ?? true)}
                    <span>สังเกตอาการไม่พึงประสงค์จากยา และรีบติดต่อหน่วยบริการเมื่อมีอาการรุนแรง</span>
                  </label>
                  <label className="flex items-start gap-1">
                    {renderCheck(record.adviceChecklist?.coverCoughWearMask ?? true)}
                    <span>ไอ/จามปิดปากด้วยกระดาษหรือข้อพับแขน และสวมหน้ากากเมื่ออยู่ใกล้ผู้อื่น</span>
                  </label>
                  <label className="flex items-start gap-1">
                    {renderCheck(record.adviceChecklist?.openWindows ?? true)}
                    <span>เปิดประตูหน้าต่างให้อากาศถ่ายเท</span>
                  </label>
                  <label className="flex items-start gap-1">
                    {renderCheck(record.adviceChecklist?.sputumDisposalProperly ?? true)}
                    <span>แยกภาชนะรองเสมหะและกำจัดอย่างถูกสุขลักษณะ</span>
                  </label>
                  <label className="flex items-start gap-1">
                    {renderCheck(record.adviceChecklist?.screenContacts ?? true)}
                    <span>คัดกรองผู้สัมผัสร่วมบ้าน โดยเฉพาะเด็กเล็กและผู้มีความเสี่ยง</span>
                  </label>
                  <label className="flex items-start gap-1">
                    {renderCheck(record.adviceChecklist?.nutritionAndRest ?? true)}
                    <span>โภชนาการและการพักผ่อน</span>
                  </label>
                  <label className="flex items-start gap-1">
                    {renderCheck(Boolean(record.adviceChecklist?.otherAdvice))}
                    <span>อื่น ๆ: <span className="underline decoration-dotted ml-1">{record.adviceChecklist?.otherAdvice || '............................................................................................................'}</span></span>
                  </label>
                </div>
              </div>

              {/* 7. ปัญหา อุปสรรค และแผนช่วยเหลือ */}
              <div className="mt-4 mb-4">
                <div className="font-bold text-slate-900 bg-slate-100 print:bg-slate-100 px-2 py-1 rounded text-[13.5px] border-l-4 border-slate-800">
                  7. ปัญหา อุปสรรค และแผนช่วยเหลือ
                </div>
                <div className="px-2 pt-2 space-y-2 text-[13px]">
                  <div>
                    <strong>ปัญหาที่พบ:</strong> <span className="underline decoration-dotted ml-1 font-medium">{record.problemsFound || (record.identifiedProblems && record.identifiedProblems.length > 0 ? record.identifiedProblems.join(', ') : 'ไม่พบปัญหาอุปสรรค ผู้ป่วยปฏิบัติตามคำแนะนำได้ดี')}</span>
                  </div>
                  <div>
                    <strong>แผนการช่วยเหลือ/ส่งต่อ:</strong> <span className="underline decoration-dotted ml-1 font-medium">{record.assistancePlan || (record.interventionsProvided && record.interventionsProvided.length > 0 ? record.interventionsProvided.join(', ') : 'ให้ อสม. พี่เลี้ยงตรวจเยี่ยมกำกับการกินยาทุกวัน และนัดตรวจตามรอบ')}</span>
                  </div>
                  <div>
                    <strong>วันนัดติดตามครั้งต่อไป:</strong> <span className="underline decoration-dotted ml-1 font-bold text-emerald-900">{record.nextFollowUpDate || record.nextVisitDueDate || record.nextAppointmentDate || '......../......../............'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 2 Footer */}
            <div className="text-center text-[11px] text-slate-500 pt-4 border-t border-slate-300 mt-4">
              กลุ่มงานบริการด้านปฐมภูมิและองค์รวม โรงพยาบาลโพนนาแก้ว (หน้า 2/4)
            </div>
          </div>

          {/* ============================================================== */}
          {/* PAGE 3: การกำกับการกินยา (DOT), ตาราง 7 วัน, Adherence, แก้ไข */}
          {/* ============================================================== */}
          <div className="min-h-[1050px] p-6 sm:p-10 border border-slate-300 rounded-lg mb-8 bg-white print:border-none print:p-0 print:m-0 print:min-h-screen print:break-after-page flex flex-col justify-between">
            <div>
              {/* Header Title */}
              <div className="text-center mb-4 pb-2 border-b border-slate-400">
                <div className="text-sm font-semibold text-slate-700">
                  กลุ่มงานบริการด้านปฐมภูมิและองค์รวม โรงพยาบาลโพนนาแก้ว
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  แบบฟอร์มเยี่ยมบ้านผู้ป่วยวัณโรค (TB Home Visit) - HN: {record.patientHN} ผู้ป่วย: {record.patientName}
                </div>
              </div>

              {/* 8. การกำกับการกินยา (DOT) */}
              <div className="mb-4">
                <div className="font-bold text-slate-900 bg-slate-100 print:bg-slate-100 px-2 py-1 rounded text-[13.5px] border-l-4 border-slate-800">
                  8. การกำกับการกินยา (DOT : Directly Observed Treatment)
                </div>
                <div className="px-2 pt-2 space-y-3 text-[13px]">
                  
                  {/* ผู้กำกับการกินยา */}
                  <div className="flex flex-wrap items-center gap-3">
                    <strong>ผู้กำกับการกินยา (DOT Provider):</strong>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.dotProviderType === 'ญาติ' || record.dotsSupervisor?.type === 'ญาติผู้ดูแล')} ญาติ ระบุ <span className="underline decoration-dotted ml-1">{record.dotProviderDetails || (record.dotsSupervisor?.type === 'ญาติผู้ดูแล' ? record.dotsSupervisor.name : '....................')}</span></label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.dotProviderType === 'อสม.' || record.dotsSupervisor?.type === 'อสม. พี่เลี้ยง' || !record.dotProviderType)} อสม.</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.dotProviderType === 'เจ้าหน้าที่สาธารณสุข' || record.dotsSupervisor?.type === 'เจ้าหน้าที่ รพ.สต.')} เจ้าหน้าที่สาธารณสุข</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.dotProviderType === 'อื่น ๆ')} อื่น ๆ <span className="underline decoration-dotted ml-1">....................</span></label>
                  </div>

                  {/* รูปแบบการกำกับการกินยา */}
                  <div className="flex flex-wrap items-center gap-3">
                    <strong>รูปแบบการกำกับการกินยา:</strong>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.dotFormat === 'พบเห็นการกินยาทุกวัน (Daily DOT)' || !record.dotFormat)} พบเห็นการกินยาทุกวัน (Daily DOT)</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.dotFormat === 'พบเห็นการกินยา 3 ครั้ง/สัปดาห์')} พบเห็นการกินยา 3 ครั้ง/สัปดาห์</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.dotFormat === 'Video DOT (VOT)' || record.dotsSupervisor?.type === 'V-DOT')} Video DOT (VOT)</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.dotFormat === 'Self-administered (SAT)' || record.dotsSupervisor?.type === 'กินเอง')} Self-administered (SAT)</label>
                    <label className="inline-flex items-center gap-1">{renderCheck(record.dotFormat === 'อื่น ๆ')} อื่น ๆ <span className="underline decoration-dotted ml-1">{record.dotFormatOther || '........'}</span></label>
                  </div>

                  {/* ตารางการรับประทานยาในช่วง 7 วันที่ผ่านมา */}
                  <div className="pt-2">
                    <strong className="block mb-1.5">การรับประทานยาในช่วง 7 วันที่ผ่านมา:</strong>
                    <table className="w-full border border-slate-400 text-center text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 print:bg-slate-100 font-bold border-b border-slate-400">
                          <th className="border-r border-slate-400 p-2 w-28 text-left pl-4">วันที่</th>
                          <th className="border-r border-slate-400 p-2 w-36">รับประทานยา</th>
                          <th className="border-r border-slate-400 p-2 w-48">ผู้กำกับการกินยา</th>
                          <th className="p-2 text-left pl-3">หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dotsLogs.map((log, idx) => (
                          <tr key={idx} className="border-b border-slate-300">
                            <td className="border-r border-slate-400 p-1.5 text-left pl-4 font-semibold">
                              {log.day}
                            </td>
                            <td className="border-r border-slate-400 p-1.5">
                              <span className="inline-flex items-center gap-3">
                                <span>{renderCheck(log.takenStatus === 'ครบ')} ครบ</span>
                                <span>{renderCheck(log.takenStatus === 'ขาด')} ขาด</span>
                              </span>
                            </td>
                            <td className="border-r border-slate-400 p-1.5 font-medium">
                              {log.supervisorName || record.dotsSupervisor?.name || patient?.dotsSupervisorName || 'อสม. พี่เลี้ยง'}
                            </td>
                            <td className="p-1.5 text-left pl-3 text-slate-600">
                              {log.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ประเมินความร่วมมือในการรักษา (Adherence) */}
                  <div className="pt-2">
                    <strong className="block mb-1">ประเมินความร่วมมือในการรักษา (Adherence):</strong>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-2 text-[12.5px]">
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adherenceEvaluation === 'ดีมาก (รับประทานยาครบ ≥95%)' || record.adherence === 'รับประทานยาทุกวัน สม่ำเสมอ 100%' || !record.adherenceEvaluation)} ดีมาก (รับประทานยาครบ ≥95%)</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adherenceEvaluation === 'ดี (80–94%)' || record.adherence === 'ลืมกินยา 1-2 วัน/สัปดาห์')} ดี (80–94%)</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adherenceEvaluation === 'ปานกลาง (50–79%)' || record.adherence === 'ลืมกินยา > 3 วัน/สัปดาห์ (เสี่ยงขาดยา)')} ปานกลาง (50–79%)</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adherenceEvaluation === 'ไม่ดี (<50%)' || record.adherence === 'หยุดยาเอง / ปฏิเสธยา')} ไม่ดี (&lt;50%)</label>
                    </div>
                  </div>

                  {/* สาเหตุที่ขาดยา (ถ้ามี) */}
                  <div className="pt-2">
                    <strong className="block mb-1">สาเหตุที่ขาดยา (ถ้ามี):</strong>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pl-2 text-[12.5px]">
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adherenceMissedReasons?.forgot)} ลืมรับประทานยา</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adherenceMissedReasons?.travelingAway)} เดินทาง/ไม่อยู่บ้าน</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adherenceMissedReasons?.adverseReaction)} มีอาการไม่พึงประสงค์จากยา</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adherenceMissedReasons?.outOfMedication)} ยาหมด</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adherenceMissedReasons?.misunderstanding)} ไม่เข้าใจการรักษา</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adherenceMissedReasons?.refusal)} ปฏิเสธการรักษา</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.adherenceMissedReasons?.substanceAlcohol)} ดื่มสุรา/ใช้สารเสพติด</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(Boolean(record.adherenceMissedReasons?.otherReason))} อื่น ๆ <span className="underline decoration-dotted ml-1">{record.adherenceMissedReasons?.otherReason || '............'}</span></label>
                    </div>
                  </div>

                  {/* การดำเนินการแก้ไข */}
                  <div className="pt-2">
                    <strong className="block mb-1">การดำเนินการแก้ไข:</strong>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 text-[12.5px]">
                      <label className="inline-flex items-center gap-1">{renderCheck(record.correctiveActions?.educateAdherenceImportance ?? true)} ให้คำแนะนำเรื่องความสำคัญของการกินยาสม่ำเสมอ</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.correctiveActions?.coordinateSupervisor ?? true)} ประสาน อสม./ญาติ กำกับการกินยา</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(Boolean(record.correctiveActions?.scheduleFollowUpDays))} นัดติดตามภายใน <span className="underline decoration-dotted font-bold mx-1">{record.correctiveActions?.scheduleFollowUpDays || '7'}</span> วัน</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.correctiveActions?.notifyDoctorNurse)} แจ้งแพทย์/พยาบาลเจ้าของไข้</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(record.correctiveActions?.referMultidisciplinary || record.referralRequired)} ส่งต่อทีมสหวิชาชีพ</label>
                      <label className="inline-flex items-center gap-1">{renderCheck(Boolean(record.correctiveActions?.otherAction))} อื่น ๆ <span className="underline decoration-dotted ml-1">{record.correctiveActions?.otherAction || '............................................'}</span></label>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Page 3 Footer */}
            <div className="text-center text-[11px] text-slate-500 pt-4 border-t border-slate-300 mt-4">
              กลุ่มงานบริการด้านปฐมภูมิและองค์รวม โรงพยาบาลโพนนาแก้ว (หน้า 3/4)
            </div>
          </div>

          {/* ============================================================== */}
          {/* PAGE 4: ผลการประเมินครั้งนี้ และลายมือชื่อ */}
          {/* ============================================================== */}
          <div className="min-h-[1050px] p-6 sm:p-10 border border-slate-300 rounded-lg bg-white print:border-none print:p-0 print:m-0 print:min-h-screen flex flex-col justify-between">
            <div>
              {/* Header Title */}
              <div className="text-center mb-6 pb-2 border-b border-slate-400">
                <div className="text-sm font-semibold text-slate-700">
                  กลุ่มงานบริการด้านปฐมภูมิและองค์รวม โรงพยาบาลโพนนาแก้ว
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  แบบฟอร์มเยี่ยมบ้านผู้ป่วยวัณโรค (TB Home Visit) - HN: {record.patientHN} ผู้ป่วย: {record.patientName}
                </div>
              </div>

              {/* ผลการประเมินครั้งนี้ */}
              <div className="mb-8">
                <div className="font-bold text-slate-900 bg-slate-100 print:bg-slate-100 px-3 py-1.5 rounded text-sm border-l-4 border-slate-800 mb-4">
                  ผลการประเมินครั้งนี้
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 text-[13.5px]">
                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg">
                    {renderCheck(record.overallEvaluationOutcome === 'รับประทานยาต่อเนื่องดี' || record.status === 'เยี่ยมสำเร็จ (ปกติ)' || !record.overallEvaluationOutcome)}
                    <span className="font-semibold text-slate-900">รับประทานยาต่อเนื่องดี</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg">
                    {renderCheck(record.overallEvaluationOutcome === 'มีความเสี่ยงต่อการขาดยา' || record.status === 'พบปัญหา/ต้องติดตามใกล้ชิด')}
                    <span className="font-semibold text-amber-900">มีความเสี่ยงต่อการขาดยา</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg">
                    {renderCheck(record.overallEvaluationOutcome === 'ขาดยา ต้องติดตามอย่างใกล้ชิด' || record.referralRequired)}
                    <span className="font-semibold text-rose-900">ขาดยา ต้องติดตามอย่างใกล้ชิด</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg">
                    {renderCheck(record.overallEvaluationOutcome === 'สงสัย Lost to Follow-up (LTFU)' || record.status === 'ไม่อยู่บ้าน/เลื่อนนัด')}
                    <span className="font-semibold text-purple-900">สงสัย Lost to Follow-up (LTFU)</span>
                  </label>
                </div>

                {/* Additional Clinical Notes */}
                {record.recommendationsAndNotes && (
                  <div className="mt-6 mx-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <strong>บันทึกเพิ่มเติมจากผู้เยี่ยมบ้าน:</strong>
                    <p className="mt-1 text-slate-700">{record.recommendationsAndNotes}</p>
                  </div>
                )}
              </div>

              {/* Signatures Section */}
              <div className="mt-16 space-y-12 px-6 sm:px-12 text-[13px]">
                
                {/* 1. ผู้กำกับการกินยา */}
                <div className="flex flex-col items-end">
                  <div className="w-80 text-center space-y-2">
                    <div>
                      ลงชื่อผู้กำกับการกินยา <span className="underline decoration-dotted font-medium">{record.dotSupervisorSignName || record.dotsSupervisor?.name || patient?.dotsSupervisorName || '...................................................'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. ผู้เยี่ยมบ้าน */}
                <div className="flex flex-col items-end">
                  <div className="w-80 text-center space-y-2">
                    <div>
                      ลงชื่อผู้เยี่ยมบ้าน <span className="underline decoration-dotted font-medium">{record.visitorSignName || record.visitorName || '...................................................'}</span>
                    </div>
                    <div>
                      ( <span className="font-semibold">{record.visitorName || '................................................................'}</span> )
                    </div>
                    <div className="text-xs text-slate-600">
                      ตำแหน่ง: {record.visitorRole} ({record.visitorUnit})
                    </div>
                  </div>
                </div>

                {/* 3. ผู้ป่วย / ผู้ดูแล */}
                <div className="flex flex-col items-end">
                  <div className="w-80 text-center space-y-2">
                    <div>
                      ลงชื่อผู้ป่วย/ผู้ดูแล <span className="underline decoration-dotted font-medium">{record.patientOrCaregiverSignName || record.patientName || '...................................................'}</span>
                    </div>
                    <div>
                      ( <span className="font-semibold">{record.patientOrCaregiverSignName || record.patientName || '................................................................'}</span> )
                    </div>
                    <div className="text-xs text-slate-600">
                      วันที่ ...... / ...... / 2569
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Page 4 Footer */}
            <div className="text-center text-[11px] text-slate-500 pt-4 border-t border-slate-300 mt-8">
              กลุ่มงานบริการด้านปฐมภูมิและองค์รวม โรงพยาบาลโพนนาแก้ว (หน้า 4/4)
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
