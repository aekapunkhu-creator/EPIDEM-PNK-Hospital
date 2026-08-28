import React, { useState } from 'react';
import { Patient, HouseholdContact, SubdistrictInfo, InvestigationRecord } from '../types';
import { 
  Users, Activity, CheckCircle2, AlertTriangle, 
  UserPlus, Search, ArrowUpRight, 
  Calendar, CheckSquare, Sparkles, Send,
  Microscope, Network, BarChart3, ShieldAlert, HeartPulse, Clock,
  Building2, Home
} from 'lucide-react';
import { EpidemiologicalAnalysis } from './EpidemiologicalAnalysis';
import { EpidemiologicalLinkage } from './EpidemiologicalLinkage';
import { SubdistrictVillageAnalysis } from './SubdistrictVillageAnalysis';

interface DashboardProps {
  patients: Patient[];
  contacts: HouseholdContact[];
  investigations: InvestigationRecord[];
  subdistricts: SubdistrictInfo[];
  onNavigate: (tab: 'dashboard' | 'spotmap' | 'patients' | 'contacts' | 'investigations' | 'line-gas') => void;
  onOpenNewPatient: () => void;
  onOpenNewContact: () => void;
  onTriggerQuickNotify: (message: string) => void;
  onSelectPatient?: (patient: Patient) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  patients,
  contacts,
  investigations,
  subdistricts,
  onNavigate,
  onOpenNewPatient,
  onOpenNewContact,
  onTriggerQuickNotify,
  onSelectPatient
}) => {
  // Sub-view Tab inside Dashboard
  const [dashboardMode, setDashboardMode] = useState<'overview' | 'epidemiology' | 'villages' | 'linkage'>('overview');

  // Key Metrics
  const totalPatients = patients.length;
  const activePatients = patients.filter(p => p.status === 'Active');
  const curedPatients = patients.filter(p => p.status === 'Cured' || p.status === 'Completed');
  const interruptedPatients = patients.filter(p => p.status === 'Interrupted' || p.status === 'Died');
  
  const cureRate = totalPatients > 0 ? Math.round((curedPatients.length / totalPatients) * 100) : 0;
  
  // Smear Positive Count
  const smearPosCount = patients.filter(p => p.tbType === 'Pulmonary Smear+').length;
  
  // Contacts Metrics
  const totalContacts = contacts.length;
  const tptContacts = contacts.filter(c => c.outcome === 'TPT Initiated').length;
  const evaluatedContacts = contacts.filter(c => c.outcome !== 'Under Evaluation').length;
  const contactScreeningRate = totalContacts > 0 ? Math.round((evaluatedContacts / totalContacts) * 100) : 0;

  // Investigation Highlights
  const totalInv = investigations.length;
  const highRiskInv = investigations.filter(i => i.transmissionRisk.includes('สูง')).length;
  const dmCount = investigations.filter(i => i.underlyingDiseases?.diabetes).length;
  const dmPercent = totalInv > 0 ? Math.round((dmCount / totalInv) * 100) : 0;
  const activeFoundFromContact = investigations.reduce((sum, i) => sum + (i.contactsActiveTbFound || 0), 0);

  // Patients with recent missed doses (missed at least 1 in last 7 days)
  const missedDosePatients = activePatients.filter(p => {
    const recentLogs = p.dotsLogs.slice(-7);
    return recentLogs.some(log => !log.taken);
  });

  // Upcoming appointments in 7 days
  const upcomingAppointments = activePatients.filter(p => p.nextAppointmentDate);

  return (
    <div className="space-[#f8fafc] p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Banner Notice */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-emerald-700/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>ระบบสนับสนุนการดำเนินงานงานควบคุมวัณโรค อ.โพนนาแก้ว</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            ศูนย์ข้อมูลและวิเคราะห์สถานการณ์วัณโรค อ.โพนนาแก้ว 2569
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
            บูรณาการการดูแลรักษา DOTS, การสอบสวนโรคระบาดวิทยา, คัดกรองผู้สัมผัส และระบบแจ้งเตือนเจ้าหน้าที่ผ่าน LINE
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={onOpenNewPatient}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs shadow-md hover:bg-emerald-400 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>ลงทะเบียนผู้ป่วยใหม่</span>
          </button>
          
          <button
            onClick={() => onNavigate('investigations')}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-medium text-xs hover:bg-slate-700 transition"
          >
            <Microscope className="w-4 h-4 text-emerald-400" />
            <span>แบบสอบสวนโรค ({investigations.length})</span>
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setDashboardMode('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            dashboardMode === 'overview'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          <span>ภาพรวมการดูแลรักษา DOTS</span>
        </button>

        <button
          onClick={() => setDashboardMode('epidemiology')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            dashboardMode === 'epidemiology'
              ? 'bg-white text-emerald-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Microscope className="w-4 h-4 text-emerald-600" />
          <span>บทวิเคราะห์ทางระบาดวิทยา ({investigations.length})</span>
        </button>

        <button
          onClick={() => setDashboardMode('villages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            dashboardMode === 'villages'
              ? 'bg-white text-emerald-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>วิเคราะห์รายตำบล-หมู่บ้าน (5 ตำบล 53 หมู่บ้าน)</span>
        </button>

        <button
          onClick={() => setDashboardMode('linkage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            dashboardMode === 'linkage'
              ? 'bg-white text-emerald-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Network className="w-4 h-4 text-emerald-600" />
          <span>ผังความเชื่อมโยงการแพร่กระจายเชื้อ (Clusters)</span>
        </button>
      </div>

      {/* Sub-view: 1. Overview */}
      {dashboardMode === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Active Cases */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  ผู้ป่วยระหว่างรักษา (Active)
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{activePatients.length}</span>
                <span className="text-xs text-slate-500">ราย (จากสะสม {totalPatients} ราย)</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>เสมหะพบเชื้อ (Smear+):</span>
                <span className="font-semibold text-emerald-700">{smearPosCount} ราย</span>
              </div>
            </div>

            {/* Card 2: Treatment Success Rate */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  อัตราการรักษาสำเร็จ (Cured)
                </span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-teal-700">{cureRate}%</span>
                <span className="text-xs text-slate-500">(เป้าหมาย NTP &gt; 85%)</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600">รักษาหาย/ครบกำหนด:</span>
                <span className="font-semibold text-teal-800">{curedPatients.length} ราย</span>
              </div>
            </div>

            {/* Card 3: Contact Screening Rate */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  อัตราคัดกรองผู้สัมผัส
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-700">{contactScreeningRate}%</span>
                <span className="text-xs text-slate-500">ประเมินแล้ว ({evaluatedContacts}/{totalContacts})</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>ได้รับยา TPT ป้องกัน:</span>
                <span className="font-semibold text-blue-800">{tptContacts} ราย</span>
              </div>
            </div>

            {/* Card 4: Missed Doses Alert */}
            <div className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition ${
              missedDosePatients.length > 0 ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  เตือนเฝ้าระวังการขาดยา
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-amber-800">{missedDosePatients.length}</span>
                <span className="text-xs text-slate-500">ราย (ขาดรับยาใน 7 วันล่าสุด)</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button 
                  onClick={() => onNavigate('patients')}
                  className="text-amber-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>ตรวจสอบและแจ้งเตือน อสม.</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Quick Epidemiological Highlight Strip */}
          {investigations.length > 0 && (
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase">
                  <Microscope className="w-4 h-4" />
                  <span>ข้อมูลสังเคราะห์ทางระบาดวิทยาจากการสอบสวนโรค {investigations.length} ชุด</span>
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  พบผู้ป่วยมีความเสี่ยงแพร่กระจายสูง <span className="text-rose-400 font-bold">{highRiskInv} ราย</span> • มีโรคร่วมเบาหวาน (DM) <span className="text-emerald-400 font-bold">{dmCount} ราย ({dmPercent}%)</span> • ตรวจพบผู้ป่วย Active TB จากการค้นหา <span className="text-amber-400 font-bold">{activeFoundFromContact} ราย</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDashboardMode('epidemiology')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1.5"
                >
                  <span>ดูบทวิเคราะห์ระบาดวิทยา</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setDashboardMode('linkage')}
                  className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-xs transition flex items-center gap-1.5"
                >
                  <Network className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ดูผังเชื่อมโยง</span>
                </button>
              </div>
            </div>
          )}

          {/* Subdistrict Level Overview Table & Map Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Table: Breakdown by Subdistrict (5 Subdistricts) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    สถานการณ์แยกรายตำบล (อำเภอโพนนาแก้ว 5 ตำบล)
                  </h3>
                  <p className="text-xs text-slate-500">
                    จำแนกตามจำนวนผู้ป่วย, อัตราคัดกรองผู้สัมผัส และ รพ.สต. ที่รับผิดชอบ
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('spotmap')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                >
                  <span>ดูแผนที่ SpotMap</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-3">ตำบล</th>
                      <th className="py-3 px-3">รพ.สต. รับผิดชอบ</th>
                      <th className="py-3 px-3 text-center">ผู้ป่วย Active</th>
                      <th className="py-3 px-3 text-center">เสมหะพบเชื้อ</th>
                      <th className="py-3 px-3 text-center">แบบสอบสวน</th>
                      <th className="py-3 px-3 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subdistricts.map(sub => {
                      const subPatients = patients.filter(p => p.subdistrict === sub.name);
                      const subActive = subPatients.filter(p => p.status === 'Active').length;
                      const subSmearPos = subPatients.filter(p => p.tbType === 'Pulmonary Smear+').length;
                      const subInv = investigations.filter(i => i.subdistrict === sub.name).length;

                      return (
                        <tr key={sub.code} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {sub.name}
                            <div className="text-[10px] text-slate-400 font-normal">{sub.villagesCount} หมู่บ้าน</div>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {sub.healthCenterName}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-emerald-700">
                            {subActive} ราย
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700">
                            {subSmearPos} ราย
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-emerald-800">
                            {subInv} ชุด
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              subActive > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {subActive > 0 ? 'กำลังควบคุมโรค' : 'เฝ้าระวังปกติ'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions & Urgent Notification Trigger */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-1">
                  <Send className="w-5 h-5 text-emerald-600" />
                  <span>ส่งการแจ้งเตือนด่วนผ่าน LINE</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  ส่งข้อความแจ้งเตือนเจ้าหน้าที่ รพ.สต. และ อสม. ในกลุ่มไลน์ อ.โพนนาแก้ว ทันที
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => onTriggerQuickNotify("💊 [เตือนประจำวัน] เจ้าหน้าที่/อสม. โปรดตรวจสอบการรับประทานยา DOTS ของผู้ป่วยในพื้นที่ตนเองประจำวันที่ " + new Date().toLocaleDateString('th-TH'))}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition group"
                  >
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 flex items-center justify-between">
                      <span>💊 เตือนให้ยาทาน DOTS เช้านี้</span>
                      <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      แจ้ง อสม. ติดตามทานยาประจำวัน 08:00 น.
                    </div>
                  </button>

                  <button
                    onClick={() => onTriggerQuickNotify("📅 [เตือนวันนัดหมาย] สรุปรายการนัดหมายส่งตรวจเสมหะและรับยาผู้ป่วยวัณโรคประจำสัปดาห์นี้ รพ.โพนนาแก้ว / รพ.สต.")}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition group"
                  >
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 flex items-center justify-between">
                      <span>📅 แจ้งเตือนส่งตรวจเสมหะตามนัด</span>
                      <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      แจ้งเตือนนัดตรวจเสมหะเดือนที่ 2, 5, 6
                    </div>
                  </button>

                  <button
                    onClick={() => onTriggerQuickNotify("🚨 [แจ้งเตือนฉุกเฉิน] ตรวจพบผู้ป่วยขาดการทานยา 2 วันติดต่อกันในพื้นที่ อ.โพนนาแก้ว โปรดลงพื้นที่ติดตามด่วน")}
                    className="w-full text-left p-3 rounded-xl bg-amber-50 border border-amber-200 hover:border-amber-400 hover:bg-amber-100/60 transition group"
                  >
                    <div className="text-xs font-semibold text-amber-900 group-hover:text-amber-950 flex items-center justify-between">
                      <span>🚨 แจ้งติดตามผู้ป่วยขาดยาด่วน</span>
                      <Send className="w-3.5 h-3.5 text-amber-600 group-hover:text-amber-800" />
                    </div>
                    <div className="text-[11px] text-amber-700 mt-1">
                      แจ้งกลุ่มงานควบคุมโรคลงพื้นที่ตามผู้ป่วย
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">การแจ้งเตือนใช้ระบบ Webhook LINE Notify</span>
                <button
                  onClick={() => onNavigate('line-gas')}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  ตั้งค่าพารามิเตอร์
                </button>
              </div>
            </div>

          </div>

          {/* Upcoming Appointments List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  กำหนดการนัดหมายตรวจติดตามและรับยา (รพ.โพนนาแก้ว / รพ.สต.)
                </h3>
              </div>
              <button
                onClick={() => onNavigate('patients')}
                className="text-xs text-emerald-700 font-semibold hover:underline"
              >
                ดูทะเบียนผู้ป่วยทั้งหมด
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map(patient => (
                  <div 
                    key={patient.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{patient.prefix}{patient.firstName} {patient.lastName}</span>
                      <span className="font-mono text-emerald-700 font-semibold">{patient.hn}</span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-1">
                      <span>{patient.subdistrict} ({patient.village})</span>
                    </div>
                    <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/70 rounded-lg p-2 mt-2">
                      <div className="font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        <span>วันนัด: {patient.nextAppointmentDate}</span>
                      </div>
                      <div className="text-slate-600 mt-0.5">{patient.nextAppointmentReason}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-6 text-slate-400 text-xs">
                  ยังไม่มีการนัดหมายในช่วงสัปดาห์นี้
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-view: 2. Epidemiological Analytics */}
      {dashboardMode === 'epidemiology' && (
        <EpidemiologicalAnalysis
          investigations={investigations}
          patients={patients}
          contacts={contacts}
          subdistricts={subdistricts}
          onNavigateToInvestigations={() => onNavigate('investigations')}
          onNavigateToContacts={() => onNavigate('contacts')}
        />
      )}

      {/* Sub-view: 3. Subdistrict & Village Analysis */}
      {dashboardMode === 'villages' && (
        <SubdistrictVillageAnalysis
          investigations={investigations}
          patients={patients}
          contacts={contacts}
          subdistricts={subdistricts}
          onSelectPatient={onSelectPatient}
          onNavigateToSpotMap={() => onNavigate('spotmap')}
          onNavigateToInvestigations={() => onNavigate('investigations')}
        />
      )}

      {/* Sub-view: 4. Epidemiological Linkage & Clusters */}
      {dashboardMode === 'linkage' && (
        <EpidemiologicalLinkage
          investigations={investigations}
          patients={patients}
          contacts={contacts}
          subdistricts={subdistricts}
          onNavigateToInvestigations={() => onNavigate('investigations')}
          onNavigateToContacts={() => onNavigate('contacts')}
        />
      )}

    </div>
  );
};

