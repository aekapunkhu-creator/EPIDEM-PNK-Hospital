import React, { useState } from 'react';
import { Patient, TBType, TreatmentStatus } from '../types';
import { Edit3, X, Save, User, MapPin, Pill, Calendar, Phone, Shield, Crosshair, Map, CheckCircle2, Sparkles } from 'lucide-react';
import { PHON_NA_KAEO_SUBDISTRICTS, getVillagesForSubdistrict } from '../data/mockData';
import { LocationPickerModal } from './LocationPickerModal';
import { TREATMENT_STATUS_OPTIONS } from '../utils/statusUtils';

interface EditPatientModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPatient: Patient) => void;
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  patient,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen || !patient) return null;

  const [formData, setFormData] = useState<Patient>({ ...patient });
  const [isMapPickerOpen, setIsMapPickerOpen] = useState<boolean>(false);
  const [locationSavedAlert, setLocationSavedAlert] = useState<string | null>(null);

  const handleChange = (field: keyof Patient, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                แก้ไขข้อมูลผู้ป่วยวัณโรค ({patient.id})
              </h3>
              <p className="text-xs text-slate-500">
                ปรับปรุงข้อมูลส่วนตัว ประเภทโรค ยาที่ได้รับ และผู้กำกับการทานยา (DOTS)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* Section 1: Basic Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-blue-700">
              <User className="w-4 h-4" />
              <span>1. ข้อมูลทั่วไปและอัตลักษณ์ผู้ป่วย</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">เลข HN *</label>
                <input
                  type="text"
                  required
                  value={formData.hn}
                  onChange={e => handleChange('hn', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เลขประจำตัวประชาชน (13 หลัก)</label>
                <input
                  type="text"
                  value={formData.idCard}
                  onChange={e => handleChange('idCard', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">คำนำหน้า *</label>
                <select
                  value={formData.prefix}
                  onChange={e => handleChange('prefix', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
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
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">นามสกุล *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={e => handleChange('lastName', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เพศ *</label>
                <select
                  value={formData.gender}
                  onChange={e => handleChange('gender', e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
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
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">สถานะการรักษา *</label>
                <select
                  value={formData.status}
                  onChange={e => handleChange('status', e.target.value as TreatmentStatus)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-bold text-blue-700"
                >
                  {TREATMENT_STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-blue-700">
              <MapPin className="w-4 h-4" />
              <span>2. ที่อยู่ปัจจุบันในอำเภอโพนนาแก้ว</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-medium"
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
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {getVillagesForSubdistrict(formData.subdistrict).map((v, idx) => (
                    <option key={idx} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">บ้านเลขที่</label>
                <input
                  type="text"
                  placeholder="เช่น 45/2"
                  value={formData.houseNo}
                  onChange={e => handleChange('houseNo', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Coordinates / Map Pin Picker */}
            <div className="mt-3 pt-3 border-t border-slate-200/80 bg-blue-50/50 p-3 rounded-xl flex flex-col space-y-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">พิกัดแผนที่บ้านผู้ป่วย (GPS Coordinates):</span>
                    {formData.lat && formData.lng ? (
                      <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                        Lat: {formData.lat}, Lng: {formData.lng}
                      </span>
                    ) : (
                      <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-medium">
                        ยังไม่ได้ระบุพิกัด
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-500 block">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.lat || ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          handleChange('lat', val);
                          setLocationSavedAlert(`อัปเดตละติจูดเป็น ${val}`);
                          setTimeout(() => setLocationSavedAlert(null), 3000);
                        }}
                        placeholder="17.XXXXXX"
                        className="p-1.5 rounded-lg border border-slate-200 font-mono text-xs w-full bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.lng || ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          handleChange('lng', val);
                          setLocationSavedAlert(`อัปเดตลองจิจูดเป็น ${val}`);
                          setTimeout(() => setLocationSavedAlert(null), 3000);
                        }}
                        placeholder="104.XXXXXX"
                        className="p-1.5 rounded-lg border border-slate-200 font-mono text-xs w-full bg-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMapPickerOpen(true)}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition shrink-0"
                >
                  <Map className="w-4 h-4 text-amber-300" />
                  <span>เปิดปักหมุดบนแผนที่ (Map Picker)</span>
                </button>
              </div>

              {/* Location Saved Alert Message */}
              {locationSavedAlert && (
                <div className="bg-emerald-100/90 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{locationSavedAlert}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Clinical & Regimen */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-blue-700">
              <Pill className="w-4 h-4" />
              <span>3. ข้อมูลการวินิจฉัยและสูตรยารักษา</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ประเภทผู้ป่วย/วัณโรค *</label>
                <select
                  value={formData.tbType}
                  onChange={e => handleChange('tbType', e.target.value as TBType)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pulmonary Smear+">วัณโรคปอด เสมหะพบเชื้อ (+)</option>
                  <option value="Pulmonary Smear-">วัณโรคปอด เสมหะไม่พบเชื้อ (-)</option>
                  <option value="Extra-Pulmonary">วัณโรคนอกปอด (Extra-Pulmonary)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">สูตรยาที่ได้รับ (Regimen) *</label>
                <input
                  type="text"
                  required
                  value={formData.regimen}
                  onChange={e => handleChange('regimen', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">วันที่เริ่มรับการรักษา</label>
                <input
                  type="date"
                  value={formData.treatmentStartDate}
                  onChange={e => handleChange('treatmentStartDate', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">วันที่คาดว่าสิ้นสุดการรักษา</label>
                <input
                  type="date"
                  value={formData.expectedEndDate}
                  onChange={e => handleChange('expectedEndDate', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">วันนัดหมายครั้งถัดไป</label>
                <input
                  type="date"
                  value={formData.nextAppointmentDate || ''}
                  onChange={e => handleChange('nextAppointmentDate', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">สาเหตุที่นัดหมาย</label>
                <input
                  type="text"
                  placeholder="เช่น ตรวจเสมหะ/รับยาต้านวัณโรค"
                  value={formData.nextAppointmentReason || ''}
                  onChange={e => handleChange('nextAppointmentReason', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: DOTS Supervisor */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-blue-700">
              <Shield className="w-4 h-4" />
              <span>4. ข้อมูลพี่เลี้ยง DOTS กำกับการทานยา</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล พี่เลี้ยง DOTS</label>
                <input
                  type="text"
                  value={formData.dotsSupervisorName}
                  onChange={e => handleChange('dotsSupervisorName', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">บทบาทพี่เลี้ยง</label>
                <select
                  value={formData.dotsSupervisorRole}
                  onChange={e => handleChange('dotsSupervisorRole', e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="อสม. พี่เลี้ยง">อสม. พี่เลี้ยง</option>
                  <option value="เจ้าหน้าที่ รพ.สต.">เจ้าหน้าที่ รพ.สต.</option>
                  <option value="ญาติผู้ดูแล">ญาติผู้ดูแล</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์พี่เลี้ยง</label>
                <input
                  type="text"
                  value={formData.dotsSupervisorPhone}
                  onChange={e => handleChange('dotsSupervisorPhone', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
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
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการแก้ไขข้อมูลผู้ป่วย</span>
            </button>
          </div>

        </form>

        {/* Location Picker Modal */}
        <LocationPickerModal
          isOpen={isMapPickerOpen}
          onClose={() => setIsMapPickerOpen(false)}
          initialLat={formData.lat}
          initialLng={formData.lng}
          subdistrictName={formData.subdistrict}
          patientName={`${formData.prefix}${formData.firstName} ${formData.lastName}`}
          onSelectLocation={(selectedLat, selectedLng) => {
            setFormData(prev => ({
              ...prev,
              lat: selectedLat,
              lng: selectedLng
            }));
            setLocationSavedAlert(`📍 บันทึกพิกัดตำแหน่งบ้านเรียบร้อยแล้ว: ละติจูด ${selectedLat}, ลองจิจูด ${selectedLng}`);
            setTimeout(() => setLocationSavedAlert(null), 4000);
          }}
        />

      </div>
    </div>
  );
};
