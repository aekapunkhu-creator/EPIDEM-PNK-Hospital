import React, { useState } from 'react';
import { 
  Patient, 
  UserAccount, 
  VideoCallSession 
} from '../types';
import { 
  deleteCallSession, 
  updateCallStatus 
} from '../services/firebaseStore';
import { 
  PhoneCall, Video as VideoIcon, Plus, Search, Filter, Calendar, 
  Clock, User, Copy, Check, ExternalLink, Share2, Trash2, 
  FileText, ShieldCheck, HeartPulse, Building2, CheckCircle2, 
  AlertCircle, PhoneOff, Users, ArrowRight
} from 'lucide-react';

interface TelehealthManagementProps {
  patients: Patient[];
  currentUser: UserAccount;
  callSessions: VideoCallSession[];
  onStartVideoCall: (patient: Patient, existingSession?: VideoCallSession) => void;
  onOpenLineSendModal?: (patient: Patient, customMsg: string) => void;
  onShowToast: (msg: string) => void;
}

export const TelehealthManagement: React.FC<TelehealthManagementProps> = ({
  patients,
  currentUser,
  callSessions,
  onStartVideoCall,
  onOpenLineSendModal,
  onShowToast
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPatientForNewCall, setSelectedPatientForNewCall] = useState<Patient | null>(null);
  const [isNewCallModalOpen, setIsNewCallModalOpen] = useState<boolean>(false);
  const [newCallReason, setNewCallReason] = useState<string>('ติดตามอาการข้างเคียงและการกินยา (V-DOTS)');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate patient access link
  const getPatientCallUrl = (callId: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}?videoCall=${callId}`;
  };

  const handleCopyLink = (callId: string) => {
    const url = getPatientCallUrl(callId);
    navigator.clipboard.writeText(url);
    setCopiedId(callId);
    onShowToast('คัดลอกลิงก์วิดีโอคอลสำหรับคนไข้แล้ว');
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleDeleteCall = async (callId: string) => {
    if (window.confirm('คุณต้องการลบประวัติการวิดีโอคอลนี้ใช่หรือไม่?')) {
      await deleteCallSession(callId);
      onShowToast('ลบรายการวิดีโอคอลเรียบร้อยแล้ว');
    }
  };

  // Filter call sessions
  const filteredCalls = callSessions.filter((c) => {
    const matchesSearch = 
      (c.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.patientHN || '').includes(searchQuery) ||
      (c.callerName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalCalls = callSessions.length;
  const connectedCalls = callSessions.filter(c => c.status === 'connected' || (c.status === 'ended' && (c.durationSeconds || 0) > 0)).length;
  const waitingCalls = callSessions.filter(c => c.status === 'waiting' || c.status === 'ringing').length;

  return (
    <div className="space-y-6 animate-fade-in font-['Prompt',sans-serif]">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-700/40">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-bold border border-white/10">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Telehealth V-DOTS &bull; รพ.โพนนาแก้ว</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            ระบบวิดีโอคอลปรึกษาแพทย์และติดตามผู้ป่วย (Telemedicine)
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl">
            สร้างห้องวิดีโอคอลส่งลิงก์ให้ผู้ป่วยหรือญาติกดรับสายคุยกับแพทย์ได้ทันทีบนมือถือ พร้อมบันทึกผลการติดตามอาการและการกินยา
          </p>
        </div>

        <button
          onClick={() => setIsNewCallModalOpen(true)}
          className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center gap-2 shrink-0"
        >
          <VideoIcon className="w-4 h-4 text-emerald-600" />
          <span>เริ่มวิดีโอคอลใหม่ (Start Call)</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <VideoIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">การสนทนาทั้งหมด</span>
            <span className="text-2xl font-bold text-slate-800">{totalCalls}</span>
            <span className="text-[11px] text-slate-400 block">ครั้ง</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">สนทนาสำเร็จ</span>
            <span className="text-2xl font-bold text-emerald-600">{connectedCalls}</span>
            <span className="text-[11px] text-slate-400 block">ครั้ง</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <PhoneCall className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">กำลังรอรับสาย</span>
            <span className="text-2xl font-bold text-amber-600">{waitingCalls}</span>
            <span className="text-[11px] text-slate-400 block">สาย</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อผู้ป่วย, HN, หรือแพทย์..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="waiting">รอคนไข้รับสาย (Waiting)</option>
            <option value="connected">กำลังสนทนา (Connected)</option>
            <option value="ended">เสร็จสิ้น (Ended)</option>
            <option value="rejected">ปฏิเสธสาย (Rejected)</option>
          </select>
        </div>
      </div>

      {/* Call History List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>ประวัติและการนัดหมายวิดีโอคอล</span>
          </h2>
          <span className="text-xs text-slate-500">พบ {filteredCalls.length} รายการ</span>
        </div>

        {filteredCalls.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <VideoIcon className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">ยังไม่มีรายการวิดีโอคอล</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              กดปุ่ม "เริ่มวิดีโอคอลใหม่" เพื่อสร้างลิงก์และเริ่มคุยกับผู้ป่วยวัณโรคได้ทันที
            </p>
            <button
              onClick={() => setIsNewCallModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              เริ่มวิดีโอคอล
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCalls.map((call) => {
              const matchedPatient = patients.find(p => p.id === call.patientId || p.hn === call.patientHN);
              const isWaiting = call.status === 'waiting' || call.status === 'ringing';
              const isConnected = call.status === 'connected';

              return (
                <div key={call.id} className="p-4 sm:p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  
                  {/* Patient & Call Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        คุณ{call.patientName}
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        HN: {call.patientHN}
                      </span>
                      {call.patientSubdistrict && (
                        <span className="text-xs text-slate-500">
                          ต.{call.patientSubdistrict} ({call.patientVillage || '-'})
                        </span>
                      )}

                      {/* Status Tag */}
                      {isConnected ? (
                        <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          <span>กำลังสนทนา</span>
                        </span>
                      ) : isWaiting ? (
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <PhoneCall className="w-3 h-3 animate-pulse" />
                          <span>รอคนไข้รับสาย</span>
                        </span>
                      ) : call.status === 'ended' ? (
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          สนทนาเสร็จสิ้น {call.durationSeconds ? `(${Math.floor(call.durationSeconds / 60)} นาที)` : ''}
                        </span>
                      ) : (
                        <span className="bg-red-50 text-red-700 border border-red-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          ปฏิเสธสาย
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600">
                      วัตถุประสงค์: <span className="font-semibold text-slate-800">{call.reason || 'ติดตามอาการ'}</span>
                      {call.callerName && (
                        <span> &bull; ผู้โทร: {call.callerName} ({call.callerRole || 'แพทย์'})</span>
                      )}
                    </p>

                    {call.doctorNotes && (
                      <p className="text-[11px] text-slate-500 bg-slate-100/70 p-2 rounded-xl border border-slate-200 mt-1 line-clamp-2">
                        <span className="font-bold text-slate-700">บันทึกแพทย์: </span>
                        {call.doctorNotes}
                      </p>
                    )}

                    <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                      <span>สร้างเมื่อ: {new Date(call.createdAt).toLocaleString('th-TH')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    
                    {/* Resume / Join Call */}
                    <button
                      onClick={() => {
                        if (matchedPatient) {
                          onStartVideoCall(matchedPatient, call);
                        } else {
                          // Fallback patient
                          const dummyPatient: Patient = {
                            id: call.patientId,
                            hn: call.patientHN,
                            prefix: '',
                            firstName: call.patientName,
                            lastName: '',
                            idCard: '',
                            age: 0,
                            gender: 'ชาย',
                            phone: call.patientPhone || '',
                            subdistrict: call.patientSubdistrict || 'โพนนาแก้ว',
                            village: call.patientVillage || '',
                            houseNo: '',
                            tbType: 'Pulmonary Smear+',
                            regimen: '2HRZE/4HR',
                            registrationDate: new Date().toISOString().split('T')[0],
                            treatmentStartDate: new Date().toISOString().split('T')[0],
                            expectedEndDate: '',
                            dotsSupervisorName: '',
                            dotsSupervisorRole: 'อสม. พี่เลี้ยง',
                            dotsSupervisorPhone: '',
                            status: 'Active',
                            lat: 17.15,
                            lng: 104.30,
                            sputumRecords: [],
                            dotsLogs: []
                          };
                          onStartVideoCall(dummyPatient, call);
                        }
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                    >
                      <VideoIcon className="w-3.5 h-3.5" />
                      <span>{isWaiting ? 'เข้าห้องคุย' : isConnected ? 'เปิดหน้าจอวิดีโอ' : 'เปิดดูบันทึก/โทรซ้ำ'}</span>
                    </button>

                    {/* Copy Patient Link */}
                    <button
                      onClick={() => handleCopyLink(call.id)}
                      className={`p-2 rounded-xl text-xs font-bold transition border flex items-center gap-1 ${
                        copiedId === call.id
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                      title="คัดลอกลิงก์ให้คนไข้"
                    >
                      {copiedId === call.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span className="hidden sm:inline">{copiedId === call.id ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
                    </button>

                    {/* Send via LINE */}
                    {onOpenLineSendModal && matchedPatient && (
                      <button
                        onClick={() => {
                          const url = getPatientCallUrl(call.id);
                          const msg = `🏥 โรงพยาบาลโพนนาแก้ว\nเรียน คุณ${call.patientName} (HN: ${call.patientHN})\n\nแพทย์/เจ้าหน้าที่ขอนัดหมายวิดีโอคอลปรึกษาอาการและติดตามการกินยา\nโปรดกดลิงก์ด้านล่างเพื่อรับสายคุยกับหมอทันที:\n👉 ${url}`;
                          onOpenLineSendModal(matchedPatient, msg);
                        }}
                        className="p-2 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                        title="ส่งลิงก์ผ่าน LINE Notify"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">LINE</span>
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteCall(call.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      title="ลบรายการนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal to Select Patient & Start New Call */}
      {isNewCallModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-['Prompt',sans-serif]">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <VideoIcon className="w-5 h-5 text-emerald-600" />
                <span>เริ่มวิดีโอคอลใหม่ (Telehealth Video Call)</span>
              </div>
              <button
                onClick={() => {
                  setIsNewCallModalOpen(false);
                  setSelectedPatientForNewCall(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Select Patient */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">เลือกผู้ป่วยที่ต้องการวิดีโอคอล:</label>
              <select
                value={selectedPatientForNewCall?.id || ''}
                onChange={(e) => {
                  const p = patients.find(x => x.id === e.target.value);
                  setSelectedPatientForNewCall(p || null);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- กรุณาเลือกผู้ป่วย --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    HN: {p.hn} - {p.prefix}{p.firstName} {p.lastName} (ต.{p.subdistrict})
                  </option>
                ))}
              </select>
            </div>

            {/* Call Objective */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">วัตถุประสงค์การวิดีโอคอล:</label>
              <input
                type="text"
                value={newCallReason}
                onChange={(e) => setNewCallReason(e.target.value)}
                placeholder="เช่น ติดตามอาการข้างเคียง (ADR), ดูการกินยา V-DOTS, ตรวจผลเสมหะ"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {selectedPatientForNewCall && (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-bold">
                  คุณ{selectedPatientForNewCall.prefix}{selectedPatientForNewCall.firstName} {selectedPatientForNewCall.lastName}
                </p>
                <p className="text-[11px] text-emerald-700">
                  สูตรยา: {selectedPatientForNewCall.regimen || '2HRZE/4HR'} &bull; เบอร์โทร: {selectedPatientForNewCall.phone || '-'}
                </p>
              </div>
            )}

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsNewCallModalOpen(false);
                  setSelectedPatientForNewCall(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!selectedPatientForNewCall}
                onClick={() => {
                  if (selectedPatientForNewCall) {
                    setIsNewCallModalOpen(false);
                    onStartVideoCall(selectedPatientForNewCall);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <VideoIcon className="w-4 h-4" />
                <span>เปิดห้องวิดีโอคอลทันที</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
