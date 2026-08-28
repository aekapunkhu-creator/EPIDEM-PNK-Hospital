import React, { useState } from 'react';
import { Patient } from '../types';
import { 
  MapPin, ShieldCheck, Mail, ArrowRight, Building2, 
  AlertCircle, CheckCircle2, Lock, Sparkles
} from 'lucide-react';
import { signInWithGoogle } from '../services/firebaseStore';
import { safeStorage } from '../utils/safeStorage';

interface LocationEmailLoginProps {
  patient: Patient;
  onAuthenticated: (email: string) => void;
}

export const LocationEmailLogin: React.FC<LocationEmailLoginProps> = ({
  patient,
  onAuthenticated
}) => {
  const [emailInput, setEmailInput] = useState(() => {
    return safeStorage.getItem('tb_phon_reporter_email') || '';
  });
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setErrorMessage(null);
    try {
      const user = await signInWithGoogle();
      if (user && user.email) {
        safeStorage.setItem('tb_phon_reporter_email', user.email);
        onAuthenticated(user.email);
      } else {
        setErrorMessage('ไม่พบบัญชีอีเมล กรุณาระบุอีเมลของคุณในช่องด้านล่าง');
      }
    } catch (err: any) {
      console.warn('Google Sign-In notice:', err);
      setErrorMessage('เบราว์เซอร์ไม่รองรับป๊อปอัป Google กรุณาระบุอีเมลในช่องด้านล่างเพื่อเข้าสู่ระบบ');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail) {
      setErrorMessage('กรุณาระบุอีเมลของคุณ (เช่น user@gmail.com)');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('กรุณากรอกรูปแบบอีเมลให้ถูกต้อง (เช่น yourname@gmail.com)');
      return;
    }

    safeStorage.setItem('tb_phon_reporter_email', cleanEmail);
    onAuthenticated(cleanEmail);
  };

  const handleAppendDomain = (domain: string) => {
    if (!emailInput) {
      setEmailInput(domain);
      return;
    }
    if (emailInput.includes('@')) {
      const prefix = emailInput.split('@')[0];
      setEmailInput(prefix + domain);
    } else {
      setEmailInput(emailInput + domain);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 font-['Prompt',sans-serif]">
      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-lg border border-white/20">
            <MapPin className="w-8 h-8 text-amber-300 animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-200 font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>โรงพยาบาลโพนนาแก้ว จ.สกลนคร</span>
          </div>
          <h1 className="text-xl font-bold">ระบบระบุพิกัดตำแหน่งบ้าน</h1>
          <p className="text-xs text-emerald-100 mt-1">
            ยืนยันตัวตนด้วยบัญชีอีเมลเพื่อความปลอดภัย
          </p>
        </div>

        {/* Patient Reference Card */}
        <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs leading-tight">
            <div className="font-bold text-slate-900">
              {patient.prefix}{patient.firstName} {patient.lastName}
            </div>
            <div className="text-slate-600 mt-0.5">
              HN: <span className="font-mono font-bold text-emerald-800">{patient.hn}</span> &bull; {patient.subdistrict} ({patient.village})
            </div>
          </div>
        </div>

        {/* Auth Body */}
        <div className="p-6 space-y-5">
          
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-slate-800">เข้าสู่ระบบด้วยบัญชีอีเมล (Mail)</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              ไม่ต้องใช้ Username/Password ของโรงพยาบาล <br />
              สามารถใช้บัญชี <b>Google Mail</b> หรือ <b>อีเมลส่วนตัว</b> เพื่อบันทึกพิกัด
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Option 1: Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-slate-400 rounded-2xl font-bold text-xs text-slate-800 shadow-sm transition flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {loadingGoogle ? (
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                กำลังเชื่อมต่อ Google...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>เข้าสู่ระบบด้วย Google (Google Sign-In)</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[11px] font-bold text-slate-400">หรือระบุอีเมล</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Option 2: Direct Email Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                อีเมลของคุณ (เช่น อสม., ญาติ หรือผู้บันทึก):
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="เช่น somsri@gmail.com หรือ somchai"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>

              {/* Quick domain buttons */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-slate-400 font-medium">กดเติมท้าย:</span>
                {['@gmail.com', '@hotmail.com', '@outlook.com'].map(dom => (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => handleAppendDomain(dom)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-[10px] font-semibold text-slate-600 border border-slate-200 transition"
                  >
                    {dom}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-200 transition flex items-center justify-center gap-2"
            >
              <span>เข้าสู่ระบบและไปที่หน้าปักหมุด</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>ข้อมูลพิกัดจะถูกส่งตรงเข้าสู่ฐานข้อมูล รพ.โพนนาแก้ว อย่างปลอดภัย</span>
        </div>

      </div>
    </div>
  );
};
