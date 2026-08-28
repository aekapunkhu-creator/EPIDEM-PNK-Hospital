import React, { useState } from 'react';
import { HouseholdContact, ContactOutcome, CXRResult, SputumResultStatus } from '../types';
import { Edit3, X, Save, User, Activity, FileText, CheckSquare } from 'lucide-react';
import { PHON_NA_KAEO_SUBDISTRICTS, getVillagesForSubdistrict } from '../data/mockData';

interface EditContactModalProps {
  contact: HouseholdContact | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedContact: HouseholdContact) => void;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  contact,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen || !contact) return null;

  const [formData, setFormData] = useState<HouseholdContact>({ ...contact });

  const handleChange = (field: keyof HouseholdContact, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSymptomToggle = (symptomKey: keyof HouseholdContact['symptoms']) => {
    setFormData(prev => ({
      ...prev,
      symptoms: {
        ...prev.symptoms,
        [symptomKey]: !prev.symptoms[symptomKey]
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                แก้ไขข้อมูลผู้สัมผัสร่วมบ้าน / คัดกรอง ({contact.id})
              </h3>
              <p className="text-xs text-slate-500">
                เชื่อมโยงกับผู้ป่วยดัชนี: <span className="font-bold text-slate-800">{contact.indexPatientName}</span> ({contact.indexPatientHN})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* Section 1: Personal Info & Relationship */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-purple-700">
              <User className="w-4 h-4" />
              <span>1. ข้อมูลทั่วไปผู้สัมผัสและที่อยู่</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">คำนำหน้า *</label>
                <select
                  value={formData.prefix}
                  onChange={e => handleChange('prefix', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
                  <option value="เด็กชาย">เด็กชาย</option>
                  <option value="เด็กหญิง">เด็กหญิง</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อจริง *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={e => handleChange('firstName', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">นามสกุล *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={e => handleChange('lastName', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เพศ *</label>
                <select
                  value={formData.gender}
                  onChange={e => handleChange('gender', e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">อายุ (ปี) *</label>
                <input
                  type="number"
                  required
                  value={formData.age}
                  onChange={e => handleChange('age', Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ความสัมพันธ์กับผู้ป่วย *</label>
                <select
                  value={formData.relationship}
                  onChange={e => handleChange('relationship', e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  <option value="สามี/ภรรยา">สามี/ภรรยา</option>
                  <option value="บุตร">บุตร</option>
                  <option value="บิดา/มารดา">บิดา/มารดา</option>
                  <option value="พี่น้อง">พี่น้อง</option>
                  <option value="ผู้สัมผัสร่วมบ้าน">ผู้สัมผัสร่วมบ้าน</option>
                  <option value="เพื่อนบ้านใกล้ชิด">เพื่อนบ้านใกล้ชิด</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ตำบล *</label>
                <select
                  value={formData.subdistrict}
                  onChange={e => {
                    const newSub = e.target.value;
                    const villages = getVillagesForSubdistrict(newSub);
                    setFormData(prev => ({
                      ...prev,
                      subdistrict: newSub,
                      village: villages.length > 0 ? villages[0] : prev.village
                    }));
                  }}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  {PHON_NA_KAEO_SUBDISTRICTS.map(s => (
                    <option key={s.code} value={s.name}>
                      {s.name} ({s.villagesCount} หมู่บ้าน)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมู่บ้าน / หมู่ที่ *</label>
                <select
                  value={formData.village}
                  onChange={e => handleChange('village', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  {getVillagesForSubdistrict(formData.subdistrict).map((v, idx) => (
                    <option key={idx} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Symptom Screening Checklist */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-purple-700">
              <CheckSquare className="w-4 h-4" />
              <span>2. แบบคัดกรองอาการสงสัยวัณโรค (Symptom Screening)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-purple-50 transition">
                <input
                  type="checkbox"
                  checked={formData.symptoms.coughOver2Weeks}
                  onChange={() => handleSymptomToggle('coughOver2Weeks')}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-slate-800 font-medium">ไอเรื้อรังติดต่อกันมากกว่า 2 สัปดาห์</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-purple-50 transition">
                <input
                  type="checkbox"
                  checked={formData.symptoms.fever}
                  onChange={() => handleSymptomToggle('fever')}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-slate-800 font-medium">มีไข้ต่ำๆ ตอนบ่ายหรือเย็น</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-purple-50 transition">
                <input
                  type="checkbox"
                  checked={formData.symptoms.nightSweats}
                  onChange={() => handleSymptomToggle('nightSweats')}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-slate-800 font-medium">เหงื่อออกมากในตอนกลางคืน</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-purple-50 transition">
                <input
                  type="checkbox"
                  checked={formData.symptoms.weightLoss}
                  onChange={() => handleSymptomToggle('weightLoss')}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-slate-800 font-medium">น้ำหนักลด เบื่ออาหาร โดยไม่ทราบสาเหตุ</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-purple-50 transition sm:col-span-2">
                <input
                  type="checkbox"
                  checked={formData.symptoms.haemoptysis}
                  onChange={() => handleSymptomToggle('haemoptysis')}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-slate-800 font-medium">ไอมีเสมหะปนเลือด</span>
              </label>
            </div>
          </div>

          {/* Section 3: Screening Outcome & Diagnostics */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-purple-700">
              <Activity className="w-4 h-4" />
              <span>3. ผลการตรวจทางห้องปฏิบัติการและสรุปผลคัดกรอง</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ผลการคัดกรองหลัก (Outcome) *</label>
                <select
                  value={formData.outcome}
                  onChange={e => handleChange('outcome', e.target.value as ContactOutcome)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500 font-bold text-purple-700"
                >
                  <option value="Under Evaluation">อยู่ระหว่างประเมิน/ส่งตรวจ</option>
                  <option value="Cleared">ปกติ (ไม่พบวัณโรค)</option>
                  <option value="TPT Initiated">เริ่มยาป้องกันวัณโรค (TPT)</option>
                  <option value="Active TB (Referred)">ป่วยเป็นวัณโรค (ส่งขึ้นทะเบียนรักษา)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ผลเอกซเรย์ปอด (CXR)</label>
                <select
                  value={formData.cxrResult}
                  onChange={e => handleChange('cxrResult', e.target.value as CXRResult)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Normal">Normal (ปกติ)</option>
                  <option value="Abnormal TB Suspect">Abnormal TB Suspect (สงสัยวัณโรค)</option>
                  <option value="Abnormal Non-TB">Abnormal Non-TB (ผิดปกติแต่ไม่ใช่ TB)</option>
                  <option value="Pending">Pending (รอผล)</option>
                  <option value="Not Done">Not Done (ยังไม่ได้ตรวจ)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ผลตรวจเสมหะ (AFB/GeneXpert)</label>
                <select
                  value={formData.afbResult}
                  onChange={e => handleChange('afbResult', e.target.value as SputumResultStatus)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Negative">Negative (-)</option>
                  <option value="Scanty">Scanty</option>
                  <option value="1+">1+</option>
                  <option value="2+">2+</option>
                  <option value="3+">3+</option>
                  <option value="Pending">Pending (รอผล)</option>
                  <option value="Not Done">Not Done (ไม่ได้ส่ง)</option>
                </select>
              </div>

              {formData.outcome === 'TPT Initiated' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">สูตรยา TPT ที่ได้รับ</label>
                    <input
                      type="text"
                      placeholder="เช่น 3HP หรือ 1HP"
                      value={formData.tptRegimen || ''}
                      onChange={e => handleChange('tptRegimen', e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">วันที่เริ่ม TPT</label>
                    <input
                      type="date"
                      value={formData.tptStartDate || ''}
                      onChange={e => handleChange('tptStartDate', e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  placeholder="เช่น ผลเอกซเรย์ปอดปกติ แนะนำติดตามอาการสม่ำเสมอ"
                  value={formData.notes || ''}
                  onChange={e => handleChange('notes', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการแก้ไขผู้สัมผัส</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
