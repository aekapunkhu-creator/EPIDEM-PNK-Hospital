import React, { useState } from 'react';
import { UserAccount } from '../types';
import { Lock, User, KeyRound, ShieldAlert } from 'lucide-react';

interface LoginModalProps {
  users: UserAccount[];
  onLogin: (user: UserAccount) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const found = users.find(
      u => u.username.trim().toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (found) {
      onLogin(found);
    } else {
      setErrorMsg('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง โปรดตรวจสอบอีกครั้ง');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#0f172a] text-white p-6 text-center relative">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-2xl text-white mx-auto shadow-lg shadow-blue-500/30 mb-3">
            TB
          </div>
          <h2 className="text-xl font-bold tracking-tight">เข้าสู่ระบบ PNK TB-Care</h2>
          <p className="text-xs text-slate-400 mt-1">
            ระบบควบคุมและติดตามผู้ป่วยวัณโรค อ.โพนนาแก้ว จ.สกลนคร
          </p>
        </div>

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="กรอกชื่อผู้ใช้ เช่น admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสผ่าน / PIN
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>เข้าสู่ระบบ</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
