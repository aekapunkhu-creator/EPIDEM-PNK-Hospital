import React, { useState } from 'react';
import { UserAccount } from '../types';
import { UserCog, KeyRound, Plus, Trash2, Edit3, X, Shield, UserCheck, Check, Lock } from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  onAddUser: (newUser: UserAccount) => void;
  onUpdateUser: (updatedUser: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  currentUser: UserAccount;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUser
}) => {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Staff' | 'อสม.'>('Staff');
  const [subdistrict, setSubdistrict] = useState('ตำบลนาแก้ว');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setFullName('');
    setRole('Staff');
    setSubdistrict('ตำบลนาแก้ว');
    setPhone('');
    setIsAddFormOpen(false);
    setEditingUserId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !fullName) return;

    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      alert('ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว โปรดใช้ชื่ออื่น');
      return;
    }

    const newUser: UserAccount = {
      id: `USR-${Date.now()}`,
      username: username.trim(),
      password: password.trim(),
      fullName: fullName.trim(),
      role,
      subdistrict,
      phone,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddUser(newUser);
    resetForm();
  };

  const handleStartEdit = (u: UserAccount) => {
    setEditingUserId(u.id);
    setUsername(u.username);
    setPassword(u.password);
    setFullName(u.fullName);
    setRole(u.role);
    setSubdistrict(u.subdistrict || 'ตำบลนาแก้ว');
    setPhone(u.phone || '');
    setIsAddFormOpen(false);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    const existing = users.find(u => u.id === editingUserId);
    if (!existing) return;

    const updatedUser: UserAccount = {
      ...existing,
      username: username.trim(),
      password: password.trim(),
      fullName: fullName.trim(),
      role,
      subdistrict,
      phone
    };

    onUpdateUser(updatedUser);
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ระบบจัดการผู้ใช้งานและเพิ่มรหัสผ่าน (User Management)
              </h3>
              <p className="text-xs text-slate-500">
                เพิ่ม แก้ไข หรือกำหนดรหัสผ่านสำหรับ เจ้าหน้าที่ และ อสม. พี่เลี้ยง
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add User Button Toggle */}
        {!isAddFormOpen && !editingUserId && (
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700">
              รายชื่อผู้ใช้งานทั้งหมด ({users.length} บัญชี)
            </span>
            <button
              onClick={() => setIsAddFormOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มบัญชีผู้ใช้ใหม่</span>
            </button>
          </div>
        )}

        {/* Create or Edit Form */}
        {(isAddFormOpen || editingUserId) && (
          <form 
            onSubmit={editingUserId ? handleUpdateSubmit : handleCreateSubmit}
            className="p-4 bg-slate-50 rounded-2xl border border-blue-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>{editingUserId ? 'แก้ไขรหัสผ่านและข้อมูลผู้ใช้' : 'กรอกข้อมูลเพิ่มบัญชีผู้ใช้งานใหม่'}</span>
              </span>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:underline"
              >
                ยกเลิก
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อผู้ใช้งาน (Username) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น osm_01 หรือ staff_nakaeo"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  รหัสผ่าน (Password / PIN) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="กำหนดรหัสผ่าน เช่น 123456"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล ผู้ใช้งาน *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นางสมพร สุขสันต์"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  สิทธิ์ผู้ใช้งาน (Role) *
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Staff">เจ้าหน้าที่ รพ./รพ.สต. (Staff)</option>
                  <option value="อสม.">อสม. พี่เลี้ยง (OSM)</option>
                  <option value="Admin">ผู้ดูแลระบบสูงสุด (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ตำบลรับผิดชอบ
                </label>
                <select
                  value={subdistrict}
                  onChange={e => setSubdistrict(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ตำบลนาแก้ว">ตำบลนาแก้ว</option>
                  <option value="ตำบลบ้านโพน">ตำบลบ้านโพน</option>
                  <option value="ตำบลโพนกัง">ตำบลโพนกัง</option>
                  <option value="ตำบลนาตงง้อง">ตำบลนาตงง้อง</option>
                  <option value="ตำบลบ้านเมือง">ตำบลบ้านเมือง</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="text"
                  placeholder="08X-XXX-XXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
              >
                {editingUserId ? 'บันทึกการปรับปรุง' : 'บันทึกสร้างผู้ใช้งาน'}
              </button>
            </div>
          </form>
        )}

        {/* Users Table List */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">ชื่อผู้ใช้ (Username)</th>
                <th className="py-3 px-3">ชื่อ-นามสกุล</th>
                <th className="py-3 px-3">รหัสผ่าน</th>
                <th className="py-3 px-3 text-center">สิทธิ์</th>
                <th className="py-3 px-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">
                    {u.username}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{u.fullName}</div>
                    <div className="text-[11px] text-slate-400">{u.subdistrict || 'อ.โพนนาแก้ว'}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 bg-slate-50/60 font-medium">
                    {u.password}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'Admin' ? 'bg-purple-100 text-purple-800' : u.role === 'Staff' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-1">
                    <button
                      onClick={() => handleStartEdit(u)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-blue-700 transition"
                      title="แก้ไขรหัสผ่าน/ข้อมูล"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {u.id !== currentUser.id && (
                      <button
                        onClick={() => {
                          if (confirm(`คุณต้องการลบบัญชีผู้ใช้ ${u.username} (${u.fullName}) หรือไม่?`)) {
                            onDeleteUser(u.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-red-600 transition"
                        title="ลบบัญชี"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
