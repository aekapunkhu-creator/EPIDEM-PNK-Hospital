import React from 'react';
import { LayoutDashboard, MapPin, Users, UserCheck, Bell, FileSpreadsheet, ShieldAlert, UserCog, LogOut, Lock, Trash2, ClipboardList, Home } from 'lucide-react';
import { UserAccount } from '../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'spotmap' | 'patients' | 'contacts' | 'investigations' | 'home-visits' | 'line-gas';
  setActiveTab: (tab: 'dashboard' | 'spotmap' | 'patients' | 'contacts' | 'investigations' | 'home-visits' | 'line-gas') => void;
  patientsCount: number;
  contactsCount: number;
  investigationsCount?: number;
  homeVisitsCount?: number;
  missedDosesCount: number;
  onOpenExport: () => void;
  currentUser: UserAccount | null;
  onOpenUserMgmt: () => void;
  onLogout: () => void;
  onWipeAllData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  patientsCount,
  contactsCount,
  investigationsCount = 0,
  homeVisitsCount = 0,
  missedDosesCount,
  onOpenExport,
  currentUser,
  onOpenUserMgmt,
  onLogout,
  onWipeAllData
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40">
      {/* Top Banner */}
      <div className="bg-emerald-700 text-emerald-50 px-4 py-1.5 text-xs font-medium flex flex-wrap items-center justify-between border-b border-emerald-600/30">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase">
            ระบาดวิทยา โรงพยาบาลโพนนาแก้ว
          </span>
          <span className="hidden sm:inline">ระบบสารสนเทศคัดกรอง รักษา ติดตาม และควบคุมโรควัณโรคระดับพื้นที่</span>
          <span className="bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-400/40 flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
            <span>Cloud Database (Firestore) ออนไลน์</span>
          </span>
        </div>
        
        {/* User Info & Admin Actions in Banner */}
        <div className="flex items-center gap-3 text-emerald-100">
          {currentUser && (
            <div className="flex items-center gap-2 bg-emerald-950/60 px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-white">{currentUser.fullName}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                currentUser.role === 'Admin' ? 'bg-purple-900 text-purple-200' : 'bg-emerald-800 text-emerald-100'
              }`}>
                {currentUser.role}
              </span>
            </div>
          )}

          {currentUser?.role === 'Admin' && (
            <>
              <button
                onClick={onOpenUserMgmt}
                className="bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow transition"
                title="จัดการผู้ใช้และเพิ่มรหัสผ่าน"
              >
                <UserCog className="w-3.5 h-3.5" />
                <span>+ เพิ่มรหัส/จัดการผู้ใช้</span>
              </button>

              {onWipeAllData && (
                <button
                  onClick={onWipeAllData}
                  className="bg-red-700/80 hover:bg-red-600 text-white px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow transition"
                  title="ลบข้อมูลผู้ป่วยและผู้สัมผัสทั้งหมดในระบบ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ล้างข้อมูลทั้งหมด</span>
                </button>
              )}
            </>
          )}

          {currentUser && (
            <button
              onClick={onLogout}
              className="bg-emerald-800/80 hover:bg-red-600 text-white px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition"
              title="ออกจากระบบ"
            >
              <LogOut className="w-3 h-3" />
              <span>ออกจากระบบ</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Nav Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <ShieldAlert className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">TB-Care โพนนาแก้ว</h1>
                <span className="bg-teal-500/20 text-teal-300 text-xs px-2 py-0.5 rounded-full border border-teal-500/30">
                  v2.5 NTP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ควบคุมวัณโรครายหมู่บ้าน-ตำบล อ.โพนนาแก้ว จ.สกลนคร
              </p>
            </div>
          </div>

          {/* Quick Actions & Export */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {missedDosesCount > 0 && (
              <button
                onClick={() => setActiveTab('patients')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition animate-pulse"
                title="พบผู้ป่วยขาดรับยา"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>เตือนขาดรับยา ({missedDosesCount})</span>
              </button>
            )}

            {currentUser?.role === 'Admin' && (
              <button
                onClick={onOpenUserMgmt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-semibold hover:bg-purple-600/50 transition"
              >
                <UserCog className="w-3.5 h-3.5 text-purple-300" />
                <span>จัดการรหัสผู้ใช้</span>
              </button>
            )}

            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium hover:bg-slate-700 hover:text-white transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>ส่งออกข้อมูล / Excel</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-1 border-t border-slate-800 pt-1 pb-2 no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard สรุปภาพรวม</span>
          </button>

          <button
            onClick={() => setActiveTab('spotmap')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'spotmap'
                ? 'bg-emerald-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>SpotMap แผนที่รายหมู่บ้าน</span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'patients'
                ? 'bg-emerald-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ทะเบียนผู้ป่วย & บันทึก DOTS</span>
            <span className="ml-1 bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full">
              {patientsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'contacts'
                ? 'bg-emerald-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>คัดกรองผู้สัมผัสใกล้ชิด</span>
            <span className="ml-1 bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full">
              {contactsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('investigations')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'investigations'
                ? 'bg-emerald-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>แบบสอบสวนโรค</span>
            <span className="ml-1 bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full">
              {investigationsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('home-visits')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'home-visits'
                ? 'bg-emerald-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>ระบบเยี่ยมบ้าน</span>
            <span className="ml-1 bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full">
              {homeVisitsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('line-gas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'line-gas'
                ? 'bg-emerald-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bell className="w-4 h-4 text-emerald-400" />
            <span>LINE Notify & Apps Script</span>
          </button>
        </div>
      </div>
    </header>
  );
};
