import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ShieldAlert, 
  UserCheck, 
  Activity, 
  ExternalLink,
  ChevronRight,
  Eye
} from 'lucide-react';
import { InvestigationRecord, Patient, HouseholdContact, UserAccount } from '../types';
import { PHON_NA_KAEO_SUBDISTRICTS } from '../data/mockData';
import { InvestigationModal } from './InvestigationModal';
import { InvestigationPrintModal } from './InvestigationPrintModal';

interface InvestigationManagementProps {
  investigations: InvestigationRecord[];
  patients: Patient[];
  contacts?: HouseholdContact[];
  onAddInvestigation: (rec: InvestigationRecord) => void;
  onUpdateInvestigation: (rec: InvestigationRecord) => void;
  onDeleteInvestigation: (id: string) => void;
  currentUser?: UserAccount | null;
  onNavigateToContacts?: () => void;
}

export const InvestigationManagement: React.FC<InvestigationManagementProps> = ({
  investigations,
  patients,
  contacts = [],
  onAddInvestigation,
  onUpdateInvestigation,
  onDeleteInvestigation,
  currentUser,
  onNavigateToContacts
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTbType, setSelectedTbType] = useState('all');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InvestigationRecord | null>(null);
  
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingRecord, setPrintingRecord] = useState<InvestigationRecord | null>(null);

  // Filtered investigations
  const filteredInvestigations = useMemo(() => {
    return investigations.filter(inv => {
      // Search matches HN, Name, Inv Number, Investigator, Role, Village
      const matchesSearch = 
        !searchTerm ||
        inv.hn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${inv.firstName} ${inv.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.investigationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.investigatorName && inv.investigatorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inv.investigatorRole && inv.investigatorRole.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inv.villageName && inv.villageName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSubdistrict = selectedSubdistrict === 'all' || inv.subdistrict === selectedSubdistrict;
      const matchesStatus = selectedStatus === 'all' || inv.status === selectedStatus;
      const matchesTbType = selectedTbType === 'all' || inv.tbType === selectedTbType;

      return matchesSearch && matchesSubdistrict && matchesStatus && matchesTbType;
    });
  }, [investigations, searchTerm, selectedSubdistrict, selectedStatus, selectedTbType]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = investigations.length;
    const completed = investigations.filter(i => i.status === 'Complete').length;
    const pending = investigations.filter(i => i.status !== 'Complete').length;
    const smearPos = investigations.filter(i => i.tbType === 'Pulmonary Smear+').length;
    const highRisk = investigations.filter(i => i.transmissionRisk.includes('สูง')).length;
    const totalContactsScreened = investigations.reduce((sum, i) => sum + (i.contactsScreened || 0), 0);
    const totalActiveTbFound = investigations.reduce((sum, i) => sum + (i.contactsActiveTbFound || 0), 0);

    return {
      total,
      completed,
      pending,
      smearPos,
      highRisk,
      totalContactsScreened,
      totalActiveTbFound
    };
  }, [investigations]);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (rec: InvestigationRecord) => {
    setEditingRecord(rec);
    setIsFormModalOpen(true);
  };

  const handleOpenPrint = (rec: InvestigationRecord) => {
    setPrintingRecord(rec);
    setIsPrintModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`ยืนยันการลบแบบสอบสวนโรคของ ${name} ใช่หรือไม่?`)) {
      onDeleteInvestigation(id);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner shrink-0">
            <ClipboardList className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                แบบบันทึกการสอบสวนผู้ป่วยวัณโรค (TB Case Investigation)
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                กองวัณโรค กรมควบคุมโรค
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ระบบบันทึก จัดการ และพิมพ์แบบสอบสวนโรคทางระบาดวิทยารายบุคคล อ.โพนนาแก้ว จ.สกลนคร
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ บันทึกการสอบสวนโรคใหม่</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              สอบสวนแล้วทั้งหมด
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.total} <span className="text-xs font-normal text-slate-500">เคส</span></div>
            <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
              เสร็จสิ้น {metrics.completed} / รอติดตาม {metrics.pending}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              เสมหะบวก (Smear+)
            </span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{metrics.smearPos} <span className="text-xs font-normal text-slate-500">ราย</span></div>
            <span className="text-[10px] text-amber-700 font-medium mt-0.5 block">
              กลุ่มเสี่ยงแพร่กระจายสูง
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              ผู้สัมผัสคัดกรองแล้ว
            </span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{metrics.totalContactsScreened} <span className="text-xs font-normal text-slate-500">คน</span></div>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
              จากการลงพื้นที่สอบสวน
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              พบป่วยร่วมบ้าน (Active TB)
            </span>
            <div className="text-2xl font-bold text-red-600 mt-1">{metrics.totalActiveTbFound} <span className="text-xs font-normal text-slate-500">ราย</span></div>
            <span className="text-[10px] text-red-600 font-medium mt-0.5 block">
              ส่งต่อเข้าระบบรักษาทันที
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, HN, เลขสอบสวน, ผู้สอบสวน..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedSubdistrict}
            onChange={e => setSelectedSubdistrict(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">ทุกตำบล ({investigations.length})</option>
            {PHON_NA_KAEO_SUBDISTRICTS.map(sd => (
              <option key={sd.code} value={sd.name}>{sd.name}</option>
            ))}
          </select>

          <select
            value={selectedTbType}
            onChange={e => setSelectedTbType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">ทุกชนิดวัณโรค</option>
            <option value="Pulmonary Smear+">Pulmonary Smear+</option>
            <option value="Pulmonary Smear-">Pulmonary Smear-</option>
            <option value="Extra-Pulmonary">Extra-Pulmonary</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="Complete">Complete (เสร็จสิ้น)</option>
            <option value="Draft">Draft (ฉบับร่าง)</option>
            <option value="Pending Follow-up">Pending (รอติดตาม)</option>
          </select>
        </div>
      </div>

      {/* Investigations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span>รายการแบบสอบสวนโรคทั้งหมด</span>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
              {filteredInvestigations.length} รายการ
            </span>
          </h3>
        </div>

        {filteredInvestigations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <ClipboardList className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">ยังไม่มีแบบสอบสวนโรคในระบบ</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              คลิกปุ่ม &quot;+ บันทึกการสอบสวนโรคใหม่&quot; เพื่อสร้างแบบบันทึกการสอบสวนทางระบาดวิทยาตามแบบฟอร์มมาตรฐานของกองวัณโรค
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>เริ่มบันทึกการสอบสวนโรค</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">เลขที่สอบสวน / วันที่</th>
                  <th className="px-4 py-3.5">ผู้ป่วย (HN / ชื่อ-สกุล)</th>
                  <th className="px-4 py-3.5">ที่อยู่ / ตำบล</th>
                  <th className="px-4 py-3.5">ชนิดวัณโรค / ผลเสมหะ</th>
                  <th className="px-4 py-3.5">ผู้สัมผัสคัดกรอง</th>
                  <th className="px-4 py-3.5">ผู้สอบสวนโรค</th>
                  <th className="px-4 py-3.5 text-center">สถานะ</th>
                  <th className="px-4 py-3.5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvestigations.map((inv) => {
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{inv.investigationNumber}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{inv.investigationDate}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{inv.prefix}{inv.firstName} {inv.lastName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          HN: {inv.hn} | อายุ {inv.age} ปี ({inv.gender})
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{inv.subdistrict}</div>
                        <div className="text-[11px] text-slate-500">
                          {inv.villageName} {inv.villageNo ? `ม.${inv.villageNo}` : ''}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">{inv.tbType}</div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          AFB: {inv.afbSmear1} / GeneXpert: {inv.geneXpertResult.includes('detected') ? 'พบเชื้อ' : 'ไม่พบเชื้อ'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{inv.contactsScreened || 0} / {inv.contactsIdentified || 0} คน</span>
                        </div>
                        {inv.contactsActiveTbFound > 0 && (
                          <div className="text-[10px] text-red-600 font-bold">
                            พบ Active TB {inv.contactsActiveTbFound} คน!
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{inv.investigatorName || '-'}</div>
                        {inv.investigatorRole && (
                          <div className="text-[10px] text-emerald-700 font-medium">{inv.investigatorRole}</div>
                        )}
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          {inv.investigatorUnit || 'รพ.โพนนาแก้ว'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          inv.status === 'Complete' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {inv.status === 'Complete' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>สมบูรณ์</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{inv.status}</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenPrint(inv)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="พิมพ์แบบสอบสวนโรคราชการ / บันทึก PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleOpenEdit(inv)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="แก้ไขข้อมูลแบบสอบสวน"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(inv.id, `${inv.prefix}${inv.firstName} ${inv.lastName}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="ลบแบบสอบสวน"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <InvestigationModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={(record) => {
          if (editingRecord) {
            onUpdateInvestigation(record);
          } else {
            onAddInvestigation(record);
          }
        }}
        initialData={editingRecord}
        patients={patients}
        currentUser={currentUser}
        onOpenPrint={(record) => {
          setPrintingRecord(record);
          setIsPrintModalOpen(true);
        }}
      />

      {/* Print Preview Modal */}
      <InvestigationPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        investigation={printingRecord}
        patient={patients.find(p => p.id === printingRecord?.patientId || p.hn === printingRecord?.hn)}
        contacts={printingRecord ? contacts.filter(c => c.indexPatientId === printingRecord.patientId || c.indexPatientHN === printingRecord.hn) : []}
      />
    </div>
  );
};
