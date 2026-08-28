import React, { useState } from 'react';
import { HouseholdContact, Patient, ContactOutcome, CXRResult, SputumResultStatus, UserAccount } from '../types';
import { 
  Users, UserPlus, Search, Filter, ShieldCheck, AlertTriangle, 
  CheckCircle2, FileSpreadsheet, X, Plus, HeartPulse, Edit3, Trash2
} from 'lucide-react';
import { EditContactModal } from './EditContactModal';

interface ContactTracingProps {
  contacts: HouseholdContact[];
  patients: Patient[];
  onAddContact: (newContact: HouseholdContact) => void;
  onUpdateContact: (updatedContact: HouseholdContact) => void;
  onDeleteContact?: (contactId: string) => void;
  currentUser?: UserAccount | null;
  onOpenExcelImportModal?: () => void;
}

export const ContactTracing: React.FC<ContactTracingProps> = ({
  contacts,
  patients,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  currentUser,
  onOpenExcelImportModal
}) => {
  const isAdmin = currentUser?.role === 'Admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<HouseholdContact | null>(null);

  // Form state
  const [selectedIndexPatientId, setSelectedIndexPatientId] = useState(patients[0]?.id || '');
  const [formPrefix, setFormPrefix] = useState('นาง');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formAge, setFormAge] = useState<number>(30);
  const [formGender, setFormGender] = useState<'ชาย' | 'หญิง'>('หญิง');
  const [formRelationship, setFormRelationship] = useState<'สามี/ภรรยา' | 'บุตร' | 'บิดา/มารดา' | 'พี่น้อง' | 'ผู้สัมผัสร่วมบ้าน' | 'เพื่อนบ้านใกล้ชิด'>('ผู้สัมผัสร่วมบ้าน');
  const [formPhone, setFormPhone] = useState('');

  // Risk Factors
  const [riskChild, setRiskChild] = useState(false);
  const [riskElderly, setRiskElderly] = useState(false);
  const [riskHIV, setRiskHIV] = useState(false);

  // Symptoms
  const [symCough, setSymCough] = useState(false);
  const [symFever, setSymFever] = useState(false);
  const [symNightSweat, setSymNightSweat] = useState(false);
  const [symWeightLoss, setSymWeightLoss] = useState(false);
  const [symHaemoptysis, setSymHaemoptysis] = useState(false);

  // Outcome
  const [formOutcome, setFormOutcome] = useState<ContactOutcome>('Under Evaluation');
  const [formTPTRegimen, setFormTPTRegimen] = useState('3HP');

  const filteredContacts = contacts.filter(c => {
    const matchText = 
      c.firstName.includes(searchTerm) || 
      c.lastName.includes(searchTerm) || 
      c.indexPatientName.includes(searchTerm);
    const matchOutcome = outcomeFilter === 'all' || c.outcome === outcomeFilter;
    return matchText && matchOutcome;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirstName || !formLastName) return;

    const indexP = patients.find(p => p.id === selectedIndexPatientId) || patients[0];
    const riskArr: string[] = [];
    if (riskChild || formAge < 5) riskArr.push('เด็กอายุ < 5 ปี');
    if (riskElderly || formAge >= 60) riskArr.push('ผู้สูงอายุ > 60 ปี');
    if (riskHIV) riskArr.push('มีโรคประจำตัว/ผู้ป่วย HIV');
    riskArr.push('ผู้สัมผัสร่วมบ้านใกล้ชิด');

    const newContact: HouseholdContact = {
      id: `CT-${Math.floor(100 + Math.random() * 900)}`,
      indexPatientId: indexP.id,
      indexPatientName: `${indexP.prefix}${indexP.firstName} ${indexP.lastName}`,
      indexPatientHN: indexP.hn,
      idCard: '14714' + Math.floor(10000000 + Math.random() * 90000000),
      prefix: formPrefix,
      firstName: formFirstName,
      lastName: formLastName,
      age: Number(formAge),
      gender: formGender,
      relationship: formRelationship,
      phone: formPhone,
      subdistrict: indexP.subdistrict,
      village: indexP.village,
      riskFactors: riskArr,
      symptoms: {
        coughOver2Weeks: symCough,
        fever: symFever,
        nightSweats: symNightSweat,
        weightLoss: symWeightLoss,
        haemoptysis: symHaemoptysis
      },
      screeningDate: new Date().toISOString().split('T')[0],
      cxrResult: symCough ? 'Abnormal TB Suspect' : 'Normal',
      afbResult: symCough ? 'Pending' : 'Not Done',
      outcome: formOutcome,
      tptRegimen: formOutcome === 'TPT Initiated' ? formTPTRegimen : undefined,
      tptStartDate: formOutcome === 'TPT Initiated' ? new Date().toISOString().split('T')[0] : undefined
    };

    onAddContact(newContact);
    setIsModalOpen(false);
    setFormFirstName('');
    setFormLastName('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>ทะเบียนบันทึกการคัดกรองผู้สัมผัสร่วมบ้านและใกล้ชิด (Contact Tracing)</span>
            </h2>
            <p className="text-xs text-slate-500">
              อำเภอโพนนาแก้ว จังหวัดสกลนคร (เพื่อประเมิน CXR/เสมหะ และจ่ายยา TPT ป้องกันวัณโรค)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenExcelImportModal && (
              <button
                onClick={onOpenExcelImportModal}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition"
                title="นำเข้าข้อมูลจาก Excel และดาวน์โหลดเทมเพลต"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>นำเข้า Excel / เทมเพลต</span>
              </button>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ บันทึกคัดกรองผู้สัมผัสใหม่</span>
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้สัมผัส หรือชื่อผู้ป่วยดัชนี..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={outcomeFilter}
              onChange={e => setOutcomeFilter(e.target.value)}
              className="w-full bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">ผลการคัดกรองทั้งหมด</option>
              <option value="Under Evaluation">รอนัดประเมิน CXR/เสมหะ</option>
              <option value="TPT Initiated">ได้รับยา TPT ป้องกันวัณโรค</option>
              <option value="Cleared">ปกติ (Cleared)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map(contact => {
          const hasSymptoms = Object.values(contact.symptoms).some(v => v);

          return (
            <div 
              key={contact.id} 
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    ID: {contact.id}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {contact.prefix}{contact.firstName} {contact.lastName} ({contact.age} ปี)
                  </h3>
                  <div className="text-xs text-slate-500">
                    ความสัมพันธ์: <span className="font-semibold text-slate-700">{contact.relationship}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  contact.outcome === 'TPT Initiated'
                    ? 'bg-blue-100 text-blue-800'
                    : contact.outcome === 'Cleared'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {contact.outcome}
                </span>
              </div>

              {/* Index Patient Link */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600">
                <span className="text-slate-400">ผู้ป่วยดัชนี (Index Case):</span>
                <div className="font-semibold text-slate-900">
                  {contact.indexPatientName} ({contact.indexPatientHN})
                </div>
                <div className="text-[11px] text-slate-500">📍 {contact.subdistrict} ({contact.village})</div>
              </div>

              {/* Symptoms Check */}
              <div className="text-xs space-y-1">
                <span className="font-semibold text-slate-700">อาการสงสัยวัณโรค:</span>
                {hasSymptoms ? (
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {contact.symptoms.coughOver2Weeks && <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-medium">ไอเกิน 2 วน.</span>}
                    {contact.symptoms.fever && <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">มีไข้</span>}
                    {contact.symptoms.nightSweats && <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">เหงื่อออกกลางคืน</span>}
                    {contact.symptoms.weightLoss && <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">น้ำหนักลด</span>}
                  </div>
                ) : (
                  <div className="text-emerald-700 font-medium text-[11px]">ไม่มีอาการสงสัย</div>
                )}
              </div>

              {/* TPT Info if active */}
              {contact.tptRegimen && (
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-blue-900 flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-blue-600" />
                    <span>ได้รับยา TPT: {contact.tptRegimen}</span>
                  </div>
                  <div className="text-[11px] text-blue-700">เริ่มยา: {contact.tptStartDate}</div>
                </div>
              )}

              {/* Action row */}
              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setEditingContact(contact)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูลผู้สัมผัส</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (window.confirm(`คุณต้องการลบข้อมูลคัดกรองผู้สัมผัส ${contact.prefix}${contact.firstName} ${contact.lastName} ใช่หรือไม่?`)) {
                        if (onDeleteContact) {
                          onDeleteContact(contact.id);
                        }
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1.5 transition"
                    title="ลบข้อมูลผู้สัมผัส (เฉพาะ Admin)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบ</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Contact Modal Component */}
      <EditContactModal
        contact={editingContact}
        isOpen={!!editingContact}
        onClose={() => setEditingContact(null)}
        onSave={(updated) => {
          onUpdateContact(updated);
        }}
      />

      {/* New Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">
                บันทึกคัดกรองผู้สัมผัสร่วมบ้านและใกล้ชิด
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Select Index Patient */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">เลือกผู้ป่วยดัชนี (Index Patient) *</label>
                <select
                  value={selectedIndexPatientId}
                  onChange={e => setSelectedIndexPatientId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.hn} - {p.prefix}{p.firstName} {p.lastName} ({p.subdistrict})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">คำนำหน้า</label>
                  <select
                    value={formPrefix}
                    onChange={e => setFormPrefix(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="เด็กชาย">เด็กชาย</option>
                    <option value="เด็กหญิง">เด็กหญิง</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">ชื่อ *</label>
                  <input
                    required
                    type="text"
                    value={formFirstName}
                    onChange={e => setFormFirstName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">นามสกุล *</label>
                  <input
                    required
                    type="text"
                    value={formLastName}
                    onChange={e => setFormLastName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">อายุ (ปี)</label>
                  <input
                    type="number"
                    value={formAge}
                    onChange={e => setFormAge(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">ความสัมพันธ์</label>
                  <select
                    value={formRelationship}
                    onChange={e => setFormRelationship(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="สามี/ภรรยา">สามี/ภรรยา</option>
                    <option value="บุตร">บุตร</option>
                    <option value="บิดา/มารดา">บิดา/มารดา</option>
                    <option value="พี่น้อง">พี่น้อง</option>
                    <option value="ผู้สัมผัสร่วมบ้าน">ผู้สัมผัสร่วมบ้าน</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Symptom Checklist */}
              <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                <span className="font-bold text-slate-800">อาการสงสัยวัณโรค (Symptom Screening)</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={symCough} onChange={e => setSymCough(e.target.checked)} />
                    <span>ไอติดต่อกันเกิน 2 สัปดาห์</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={symFever} onChange={e => setSymFever(e.target.checked)} />
                    <span>มีไข้บ่าย/ค่ำ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={symNightSweat} onChange={e => setSymNightSweat(e.target.checked)} />
                    <span>เหงื่อออกตอนกลางคืน</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={symWeightLoss} onChange={e => setSymWeightLoss(e.target.checked)} />
                    <span>น้ำหนักลดผิดปกติ</span>
                  </label>
                </div>
              </div>

              {/* Outcome */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">ผลการประเมินเบื้องต้น</label>
                  <select
                    value={formOutcome}
                    onChange={e => setFormOutcome(e.target.value as ContactOutcome)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Under Evaluation">ส่งตรวจ CXR/เสมหะ ณ รพ.โพนนาแก้ว</option>
                    <option value="TPT Initiated">จ่ายยา TPT ป้องกันวัณโรค</option>
                    <option value="Cleared">ปกติ (Cleared)</option>
                  </select>
                </div>
                {formOutcome === 'TPT Initiated' && (
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">สูตรยา TPT</label>
                    <select
                      value={formTPTRegimen}
                      onChange={e => setFormTPTRegimen(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    >
                      <option value="3HP (Rifapentine + INH รายสัปดาห์ 12 สัปดาห์)">3HP (ทานสัปดาห์ละครั้ง)</option>
                      <option value="1HP (Rifapentine + INH รายวัน 1 เดือน)">1HP (ทานรายวัน 1 เดือน)</option>
                      <option value="6H (Isoniazid รายวัน 6 เดือน)">6H (ทานรายวัน 6 เดือน)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold"
                >
                  บันทึกข้อมูลผู้สัมผัส
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
