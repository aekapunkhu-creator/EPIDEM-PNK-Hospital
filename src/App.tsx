import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { SpotMap } from './components/SpotMap';
import { PatientManagement } from './components/PatientManagement';
import { ContactTracing } from './components/ContactTracing';
import { LineAppsScript } from './components/LineAppsScript';
import { ExportModal } from './components/ExportModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ShareLocationLinkModal } from './components/ShareLocationLinkModal';
import { LineSendModal } from './components/LineSendModal';
import { PublicLocationSubmitView } from './components/PublicLocationSubmitView';
import { LocationEmailLogin } from './components/LocationEmailLogin';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';

import { 
  PHON_NA_KAEO_SUBDISTRICTS, 
  INITIAL_PATIENTS, 
  INITIAL_CONTACTS, 
  INITIAL_LINE_CONFIG, 
  INITIAL_LOGS,
  INITIAL_USERS
} from './data/mockData';

import { Patient, HouseholdContact, LineNotificationConfig, NotificationLog, UserAccount, InvestigationRecord, HomeVisitRecord } from './types';
import { CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { InvestigationManagement } from './components/InvestigationManagement';
import { HomeVisitManagement } from './components/HomeVisitManagement';

import {
  subscribePatients,
  subscribeContacts,
  subscribeInvestigations,
  subscribeHomeVisits,
  subscribeUsers,
  subscribeLineConfig,
  subscribeLogs,
  saveAllPatientsToFirestore,
  saveAllContactsToFirestore,
  saveAllInvestigationsToFirestore,
  saveAllHomeVisitsToFirestore,
  saveAllUsersToFirestore,
  saveLineConfigToFirestore,
  saveAllLogsToFirestore,
  savePatientToFirestore,
  deletePatientFromFirestore,
  saveContactToFirestore,
  deleteContactFromFirestore,
  saveInvestigationToFirestore,
  deleteInvestigationFromFirestore,
  saveHomeVisitToFirestore,
  deleteHomeVisitFromFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  clearCollectionInFirestore,
  fetchPatientByIdFromFirestore
} from './services/firebaseStore';
import { safeStorage } from './utils/safeStorage';

const MOCK_PATIENT_IDS = ['TB-6701', 'TB-6702', 'TB-6703', 'TB-6704', 'TB-6705'];
const MOCK_CONTACT_IDS = ['CT-101', 'CT-102', 'CT-103', 'CT-104'];
const MOCK_LOG_IDS = ['LOG-001', 'LOG-002', 'LOG-003'];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'spotmap' | 'patients' | 'contacts' | 'investigations' | 'home-visits' | 'line-gas'>('dashboard');

  // Application Persistent State
  const [patients, setPatients] = useState<Patient[]>(() => {
    safeStorage.removeItem('tb_phon_patients_v2');
    safeStorage.removeItem('tb_phon_patients_v3');
    return [];
  });

  const [contacts, setContacts] = useState<HouseholdContact[]>(() => {
    const saved = safeStorage.getItem('tb_phon_contacts_v3');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        return parsed.filter((c: HouseholdContact) => !MOCK_CONTACT_IDS.includes(c.id));
      } catch (e) { console.error('Error loading contacts from storage', e); }
    }
    const oldSaved = safeStorage.getItem('tb_phon_contacts_v2');
    if (oldSaved) {
      try {
        const parsed = JSON.parse(oldSaved);
        const cleaned = parsed.filter((c: HouseholdContact) => !MOCK_CONTACT_IDS.includes(c.id));
        safeStorage.setItem('tb_phon_contacts_v3', JSON.stringify(cleaned));
        return cleaned;
      } catch (e) { console.error(e); }
    }
    return [];
  });

  const [investigations, setInvestigations] = useState<InvestigationRecord[]>(() => {
    const saved = safeStorage.getItem('tb_phon_investigations_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error('Error loading investigations from storage', e); }
    }
    return [];
  });

  const [homeVisits, setHomeVisits] = useState<HomeVisitRecord[]>(() => {
    const saved = safeStorage.getItem('tb_phon_home_visits_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error('Error loading home visits from storage', e); }
    }
    return [];
  });

  const [lineConfig, setLineConfig] = useState<LineNotificationConfig>(() => {
    const saved = safeStorage.getItem('tb_phon_line_config_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error('Error loading line config from storage', e); }
    }
    return INITIAL_LINE_CONFIG;
  });

  const [logs, setLogs] = useState<NotificationLog[]>(() => {
    const saved = safeStorage.getItem('tb_phon_logs_v3');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        return parsed.filter((l: NotificationLog) => !MOCK_LOG_IDS.includes(l.id));
      } catch (e) { console.error('Error loading logs from storage', e); }
    }
    return [];
  });

  // User Accounts & Authentication State - Require login every time on link access / fresh load
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = safeStorage.getItem('tb_phon_users_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error('Error loading users from storage', e); }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [isFirestoreReady, setIsFirestoreReady] = useState(false);

  // Real-time Firestore Cloud DB Sync & Initialization
  useEffect(() => {
    // 1. Subscribe Patients
    const unsubPatients = subscribePatients(
      (data) => {
        const cleaned = (data || []).filter(p => !MOCK_PATIENT_IDS.includes(p.id));
        // Delete mock items from firestore in background
        data?.forEach(p => {
          if (MOCK_PATIENT_IDS.includes(p.id)) {
            deletePatientFromFirestore(p.id);
          }
        });
        setPatients(cleaned);
        setIsFirestoreReady(true);
      },
      () => {
        setIsFirestoreReady(true);
      }
    );

    // Safety fallback: if firestore doesn't answer in 3 seconds, mark ready
    const timer = setTimeout(() => {
      setIsFirestoreReady(true);
    }, 3000);

    // 2. Subscribe Contacts
    const unsubContacts = subscribeContacts(
      (data) => {
        const cleaned = (data || []).filter(c => !MOCK_CONTACT_IDS.includes(c.id));
        data?.forEach(c => {
          if (MOCK_CONTACT_IDS.includes(c.id)) {
            deleteContactFromFirestore(c.id);
          }
        });
        setContacts(cleaned);
      },
      () => {}
    );

    // 3. Subscribe Investigations
    const unsubInvestigations = subscribeInvestigations(
      (data) => {
        if (data) {
          setInvestigations(data);
        }
      },
      () => {}
    );

    // 4. Subscribe Home Visits
    const unsubHomeVisits = subscribeHomeVisits(
      (data) => {
        if (data) {
          setHomeVisits(data);
        }
      },
      () => {}
    );

    // 5. Subscribe Users
    const unsubUsers = subscribeUsers(
      (data) => {
        if (data && data.length > 0) {
          setUsers(data);
        } else {
          saveAllUsersToFirestore(INITIAL_USERS);
        }
      },
      () => {}
    );

    // 6. Subscribe Line Config
    const unsubLine = subscribeLineConfig((cfg) => {
      if (cfg) setLineConfig(cfg);
    });

    // 7. Subscribe Logs
    const unsubLogs = subscribeLogs((l) => {
      const cleaned = (l || []).filter(log => !MOCK_LOG_IDS.includes(log.id));
      setLogs(cleaned);
    });

    return () => {
      unsubPatients();
      unsubContacts();
      unsubInvestigations();
      unsubHomeVisits();
      unsubUsers();
      unsubLine();
      unsubLogs();
    };
  }, []);

  // Auto-Save Effects to LocalStorage AND Firestore Cloud DB
  useEffect(() => {
    safeStorage.setItem('tb_phon_patients_v3', JSON.stringify(patients));
    if (patients.length > 0) {
      saveAllPatientsToFirestore(patients);
    }
  }, [patients]);

  useEffect(() => {
    safeStorage.setItem('tb_phon_contacts_v3', JSON.stringify(contacts));
    if (contacts.length > 0) {
      saveAllContactsToFirestore(contacts);
    }
  }, [contacts]);

  useEffect(() => {
    safeStorage.setItem('tb_phon_investigations_v1', JSON.stringify(investigations));
    if (investigations.length > 0) {
      saveAllInvestigationsToFirestore(investigations);
    }
  }, [investigations]);

  useEffect(() => {
    safeStorage.setItem('tb_phon_home_visits_v1', JSON.stringify(homeVisits));
    if (homeVisits.length > 0) {
      saveAllHomeVisitsToFirestore(homeVisits);
    }
  }, [homeVisits]);

  useEffect(() => {
    safeStorage.setItem('tb_phon_line_config_v2', JSON.stringify(lineConfig));
    saveLineConfigToFirestore(lineConfig);
  }, [lineConfig]);

  useEffect(() => {
    safeStorage.setItem('tb_phon_logs_v3', JSON.stringify(logs));
    saveAllLogsToFirestore(logs);
  }, [logs]);

  useEffect(() => {
    safeStorage.setItem('tb_phon_users_v2', JSON.stringify(users));
    saveAllUsersToFirestore(users);
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      safeStorage.setItem('tb_phon_current_user_v2', JSON.stringify(currentUser));
    } else {
      safeStorage.removeItem('tb_phon_current_user_v2');
    }
  }, [currentUser]);

  // Modals & Navigation Helpers
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isShareLocationOpen, setIsShareLocationOpen] = useState(false);
  const [shareLocationTargetPatient, setShareLocationTargetPatient] = useState<Patient | null>(null);
  const [shareLocationTargetPatients, setShareLocationTargetPatients] = useState<Patient[] | null>(null);
  const [isLineSendModalOpen, setIsLineSendModalOpen] = useState(false);
  const [lineSendTargetPatient, setLineSendTargetPatient] = useState<Patient | null>(null);
  const [lineSendTargetPatients, setLineSendTargetPatients] = useState<Patient[] | undefined>(undefined);
  const [publicPinningPatient, setPublicPinningPatient] = useState<Patient | null>(null);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);

  // Detect URL parameter for public location pinning link (supporting iOS Safari, Chrome, LINE in-app webviews)
  const getPublicTargetIdsFromUrl = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const urlStr = window.location.href;
      const urlObj = new URL(urlStr);

      // 1. Direct query parameter search for batch or single
      const batchParam = urlObj.searchParams.get('pinLocationBatch') || 
                          urlObj.searchParams.get('batch');
      if (batchParam) {
        return decodeURIComponent(batchParam).split(',').map(s => s.trim()).filter(Boolean);
      }

      const directParam = urlObj.searchParams.get('pinLocationFor') || 
                          urlObj.searchParams.get('locationToken') || 
                          urlObj.searchParams.get('target') || 
                          urlObj.searchParams.get('patientId') || 
                          urlObj.searchParams.get('id') || 
                          urlObj.searchParams.get('hn');
      if (directParam) {
        const decoded = decodeURIComponent(directParam).trim();
        return decoded.includes(',') ? decoded.split(',').map(s => s.trim()).filter(Boolean) : [decoded];
      }

      // 2. Hash-based parameter search (e.g. #pinLocationFor=TB-01 or #/pin/TB-01)
      const hash = window.location.hash;
      if (hash) {
        const cleanHash = hash.replace(/^#\/?/, '');
        if (cleanHash.includes('=')) {
          const queryPart = cleanHash.includes('?') ? cleanHash.split('?')[1] : cleanHash;
          const hashParams = new URLSearchParams(queryPart);
          const hashBatch = hashParams.get('pinLocationBatch') || hashParams.get('batch');
          if (hashBatch) {
            return decodeURIComponent(hashBatch).split(',').map(s => s.trim()).filter(Boolean);
          }
          const hashTarget = hashParams.get('pinLocationFor') || 
                             hashParams.get('locationToken') || 
                             hashParams.get('patientId') || 
                             hashParams.get('id');
          if (hashTarget) {
            const decoded = decodeURIComponent(hashTarget).trim();
            return decoded.includes(',') ? decoded.split(',').map(s => s.trim()).filter(Boolean) : [decoded];
          }
        }
        const match = cleanHash.match(/pin\/([^/?&#]+)/i);
        if (match && match[1]) return [decodeURIComponent(match[1]).trim()];
      }

      // 3. Fallback regex search on raw URL (handles LINE or iOS webview param appending)
      const regexMatch = urlStr.match(/[?&#]pinLocationFor=([^&#]+)/i) || 
                         urlStr.match(/[?&#]pinLocationBatch=([^&#]+)/i) ||
                         urlStr.match(/[?&#]locationToken=([^&#]+)/i);
      if (regexMatch && regexMatch[1]) {
        const decoded = decodeURIComponent(regexMatch[1]).trim();
        return decoded.includes(',') ? decoded.split(',').map(s => s.trim()).filter(Boolean) : [decoded];
      }
    } catch (err) {
      console.warn('URL parsing error:', err);
    }
    return [];
  };

  const publicTargetIds = getPublicTargetIdsFromUrl();
  const publicTargetId = publicTargetIds.length > 0 ? publicTargetIds[0] : null;

  // Batch patients resolved from URL
  const publicBatchPatients = useMemo(() => {
    if (publicTargetIds.length <= 1) return undefined;
    return patients.filter(p => publicTargetIds.includes(p.id) || publicTargetIds.includes(p.hn));
  }, [patients, publicTargetIds]);

  useEffect(() => {
    if (!publicTargetId) return;

    // 1. Try finding in current memory patients
    const found = patients.find(p => p.id === publicTargetId || p.hn === publicTargetId);
    if (found) {
      setPublicPinningPatient(found);
      return;
    }

    // 2. Fetch directly from Firestore database
    fetchPatientByIdFromFirestore(publicTargetId).then(p => {
      if (p) {
        setPublicPinningPatient(p);
      }
    });
  }, [patients, publicTargetId]);

  // State for public location reporter email
  const [locationReporterEmail, setLocationReporterEmail] = useState<string | null>(() => {
    return safeStorage.getItem('tb_phon_reporter_email');
  });

  // Update Location from public pinning view
  const handleUpdatePatientLocationFromPublic = (patientId: string, newLat: number, newLng: number, reporterEmail?: string) => {
    let updatedP: Patient | null = null;
    const now = new Date().toLocaleString('th-TH');
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        updatedP = {
          ...p,
          lat: newLat,
          lng: newLng,
          lastLocationUpdatedBy: reporterEmail || locationReporterEmail || 'ผู้ใช้งานผ่านลิงก์',
          lastLocationUpdatedAt: now
        };
        return updatedP;
      }
      return p;
    }));

    if (updatedP) {
      savePatientToFirestore(updatedP);
    }

    showToast(`อัปเดตพิกัดตำแหน่งบ้านสำเร็จแล้ว (Lat: ${newLat}, Lng: ${newLng})`);
  };

  // Toast Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Import Excel data handler
  const handleImportExcelData = (data: { patients: Patient[]; contacts: HouseholdContact[] }) => {
    let addedP = 0;
    let addedC = 0;

    if (data.patients && data.patients.length > 0) {
      setPatients(prev => [...data.patients, ...prev]);
      addedP = data.patients.length;
    }

    if (data.contacts && data.contacts.length > 0) {
      setContacts(prev => [...data.contacts, ...prev]);
      addedC = data.contacts.length;
    }

    showToast(`นำเข้าข้อมูลจากไฟล์ Excel สำเร็จแล้ว! (เพิ่มผู้ป่วย ${addedP} ราย, ผู้สัมผัส ${addedC} ราย) ระบบบันทึกเข้าฐานข้อมูลเรียบร้อย`);
  };

  // Reset to initial demo dataset handler
  const handleResetToDemoData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นตัวอย่างใช่หรือไม่? (ข้อมูลที่บันทึกไว้ล่วงหน้าจะถูกแทนที่)')) {
      setPatients(INITIAL_PATIENTS);
      setContacts(INITIAL_CONTACTS);
      setLineConfig(INITIAL_LINE_CONFIG);
      setLogs(INITIAL_LOGS);
      setUsers(INITIAL_USERS);
      setCurrentUser(INITIAL_USERS[0]);
      localStorage.removeItem('tb_phon_patients_v2');
      localStorage.removeItem('tb_phon_contacts_v2');
      localStorage.removeItem('tb_phon_line_config_v2');
      localStorage.removeItem('tb_phon_logs_v2');
      localStorage.removeItem('tb_phon_users_v2');
      localStorage.removeItem('tb_phon_current_user_v2');
      showToast('รีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้นตัวอย่างเรียบร้อยแล้ว');
    }
  };

  // Import JSON backup handler
  const handleImportJsonData = (data: { patients?: Patient[]; contacts?: HouseholdContact[]; users?: UserAccount[] }) => {
    if (data.patients && Array.isArray(data.patients)) {
      setPatients(data.patients);
    }
    if (data.contacts && Array.isArray(data.contacts)) {
      setContacts(data.contacts);
    }
    if (data.users && Array.isArray(data.users)) {
      setUsers(data.users);
    }
    showToast('นำเข้าข้อมูลสำเร็จแล้ว ระบบบันทึกข้อมูลเข้าฐานข้อมูลเรียบร้อย');
  };

  // User Account Management Handlers
  const handleAddUser = (newUser: UserAccount) => {
    setUsers(prev => [newUser, ...prev]);
    showToast(`เพิ่มผู้ใช้งานและกำหนดรหัสผ่านสำเร็จ: ${newUser.fullName} (${newUser.username})`);
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    showToast(`อัปเดตข้อมูลและรหัสผ่านผู้ใช้งานสำเร็จ`);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    deleteUserFromFirestore(userId);
    showToast(`ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว`);
  };

  // Handlers
  const handleAddPatient = (newP: Patient) => {
    setPatients(prev => [newP, ...prev]);
    savePatientToFirestore(newP);
    showToast(`ลงทะเบียนผู้ป่วยใหม่สำเร็จ: ${newP.prefix}${newP.firstName} ${newP.lastName} (${newP.hn})`);
  };

  const handleUpdatePatient = (updatedP: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedP.id ? updatedP : p));
    savePatientToFirestore(updatedP);
    showToast(`อัปเดตข้อมูลผู้ป่วยสำเร็จแล้ว`);
  };

  const handleDeletePatient = (patientId: string) => {
    if (currentUser?.role !== 'Admin') {
      showToast('สิทธิ์ไม่ถูกต้อง: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบข้อมูลผู้ป่วยได้');
      return;
    }
    const target = patients.find(p => p.id === patientId);
    setPatients(prev => prev.filter(p => p.id !== patientId));
    deletePatientFromFirestore(patientId);
    if (selectedPatientForDetail?.id === patientId) {
      setSelectedPatientForDetail(null);
    }
    showToast(`ลบข้อมูลผู้ป่วย ${target ? target.prefix + target.firstName + ' ' + target.lastName : ''} เรียบร้อยแล้ว`);
  };

  const handleClearAllPatients = async () => {
    if (currentUser?.role !== 'Admin') {
      showToast('สิทธิ์ไม่ถูกต้อง: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบข้อมูลผู้ป่วยทั้งหมดได้');
      return;
    }
    if (!window.confirm('⚠️ ยืนยันการลบ: คุณต้องการลบและเคลียร์ข้อมูลผู้ป่วยทั้งหมดออกจากระบบและฐานข้อมูล Cloud ใช่หรือไม่?\n\n(ข้อมูลผู้ป่วยทั้งหมดจะถูกล้างออกจากระบบ ฐานข้อมูลจะว่างเปล่าพร้อมสำหรับการนำเข้า Excel หรือลงทะเบียนใหม่)')) {
      return;
    }

    // Clear Storage
    safeStorage.removeItem('tb_phon_patients_v2');
    safeStorage.removeItem('tb_phon_patients_v3');

    // Clear State
    setPatients([]);
    setSelectedPatientForDetail(null);
    setPublicPinningPatient(null);

    // Clear Cloud Firestore
    await clearCollectionInFirestore('patients');

    showToast('ลบและเคลียร์ข้อมูลผู้ป่วยทั้งหมดออกจากระบบเรียบร้อยแล้ว');
  };

  const handleAddContact = (newC: HouseholdContact) => {
    setContacts(prev => [newC, ...prev]);
    saveContactToFirestore(newC);
    showToast(`บันทึกคัดกรองผู้สัมผัสใหม่สำเร็จ: ${newC.prefix}${newC.firstName} ${newC.lastName}`);
  };

  const handleUpdateContact = (updatedC: HouseholdContact) => {
    setContacts(prev => prev.map(c => c.id === updatedC.id ? updatedC : c));
    saveContactToFirestore(updatedC);
    showToast(`อัปเดตข้อมูลผู้สัมผัสสำเร็จแล้ว`);
  };

  const handleDeleteContact = (contactId: string) => {
    if (currentUser?.role !== 'Admin') {
      showToast('สิทธิ์ไม่ถูกต้อง: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบข้อมูลผู้สัมผัสได้');
      return;
    }
    const target = contacts.find(c => c.id === contactId);
    setContacts(prev => prev.filter(c => c.id !== contactId));
    deleteContactFromFirestore(contactId);
    showToast(`ลบข้อมูลผู้สัมผัส ${target ? target.prefix + target.firstName + ' ' + target.lastName : ''} เรียบร้อยแล้ว`);
  };

  // Investigation CRUD Handlers
  const handleAddInvestigation = (newInv: InvestigationRecord) => {
    setInvestigations(prev => [newInv, ...prev]);
    saveInvestigationToFirestore(newInv);
    showToast(`บันทึกแบบสอบสวนโรคใหม่สำเร็จ: ${newInv.investigationNumber} (${newInv.prefix}${newInv.firstName} ${newInv.lastName})`);
  };

  const handleUpdateInvestigation = (updatedInv: InvestigationRecord) => {
    setInvestigations(prev => prev.map(inv => inv.id === updatedInv.id ? updatedInv : inv));
    saveInvestigationToFirestore(updatedInv);
    showToast(`อัปเดตแบบสอบสวนโรคสำเร็จ: ${updatedInv.investigationNumber}`);
  };

  const handleDeleteInvestigation = (invId: string) => {
    if (currentUser?.role !== 'Admin') {
      showToast('สิทธิ์ไม่ถูกต้อง: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบแบบสอบสวนโรคได้');
      return;
    }
    const target = investigations.find(i => i.id === invId);
    setInvestigations(prev => prev.filter(i => i.id !== invId));
    deleteInvestigationFromFirestore(invId);
    showToast(`ลบแบบสอบสวนโรค ${target ? target.investigationNumber : ''} เรียบร้อยแล้ว`);
  };

  // Home Visit Handlers
  const handleSaveHomeVisit = (record: HomeVisitRecord) => {
    setHomeVisits(prev => {
      const exists = prev.some(r => r.id === record.id);
      if (exists) {
        return prev.map(r => r.id === record.id ? record : r);
      }
      return [record, ...prev];
    });
    saveHomeVisitToFirestore(record);
    showToast(`บันทึกการเยี่ยมบ้านผู้ป่วย "${record.patientName}" สำเร็จแล้ว`);
  };

  const handleDeleteHomeVisit = (visitId: string) => {
    const target = homeVisits.find(v => v.id === visitId);
    setHomeVisits(prev => prev.filter(v => v.id !== visitId));
    deleteHomeVisitFromFirestore(visitId);
    showToast(`ลบบันทึกการเยี่ยมบ้าน ${target ? target.patientName : ''} เรียบร้อยแล้ว`);
  };

  const handleWipeAllData = async () => {
    if (!window.confirm('⚠️ คำเตือน: คุณต้องการลบข้อมูลผู้ป่วย, คัดกรองผู้สัมผัส, แบบสอบสวนโรค, การเยี่ยมบ้าน และประวัติการแจ้งเตือนทั้งหมดออกจากระบบและฐานข้อมูล Cloud หรือไม่?\n\n(ข้อมูลจะถูกล้างหมดทั้งในเครื่องและ Cloud ฐานข้อมูลจะว่างเปล่าพร้อมใช้งาน)')) {
      return;
    }
    
    // Clear Local Storage
    localStorage.removeItem('tb_phon_patients_v2');
    localStorage.removeItem('tb_phon_patients_v3');
    localStorage.removeItem('tb_phon_contacts_v2');
    localStorage.removeItem('tb_phon_contacts_v3');
    localStorage.removeItem('tb_phon_investigations_v1');
    localStorage.removeItem('tb_phon_home_visits_v1');
    localStorage.removeItem('tb_phon_logs_v2');
    localStorage.removeItem('tb_phon_logs_v3');
    
    // Clear React State
    setPatients([]);
    setContacts([]);
    setInvestigations([]);
    setHomeVisits([]);
    setLogs([]);
    setSelectedPatientForDetail(null);

    // Clear Cloud Firestore collections
    await clearCollectionInFirestore('patients');
    await clearCollectionInFirestore('contacts');
    await clearCollectionInFirestore('investigations');
    await clearCollectionInFirestore('homeVisits');
    await clearCollectionInFirestore('logs');

    showToast('ลบข้อมูลทั้งหมดในระบบและฐานข้อมูล Cloud เรียบร้อยแล้ว');
  };

  const handleAddLog = (log: NotificationLog) => {
    setLogs(prev => [log, ...prev]);
  };

  const handleTriggerPatientNotify = (patient: Patient) => {
    setLineSendTargetPatient(patient);
    setLineSendTargetPatients(undefined);
    setIsLineSendModalOpen(true);
  };

  const handleTriggerBulkNotify = (targetPatients: Patient[]) => {
    if (targetPatients.length === 0) return;
    setLineSendTargetPatients(targetPatients);
    setLineSendTargetPatient(targetPatients[0] || null);
    setIsLineSendModalOpen(true);
  };

  const handleQuickNotify = (message: string) => {
    showToast(`ส่งข้อความแจ้งเตือนด่วนถึงกลุ่มงานสาธารณสุข อ.โพนนาแก้ว เรียบร้อยแล้ว`);
    setLogs(prev => [
      {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString('th-TH'),
        type: 'system',
        targetName: lineConfig.lineGroupName,
        message,
        status: 'sent'
      },
      ...prev
    ]);
  };

  const subdistrictNames = PHON_NA_KAEO_SUBDISTRICTS.map(s => s.name);

  // Count missed doses count in active patients
  const missedDosesCount = patients.filter(p => p.status === 'Active' && p.dotsLogs.some(l => !l.taken)).length;

  // Resolve active public pinning patient (from state, current patients array, or initial dataset)
  const activePublicPatient = publicPinningPatient || 
    (publicTargetId ? patients.find(p => p.id === publicTargetId || p.hn === publicTargetId) : null) ||
    (publicTargetId ? INITIAL_PATIENTS.find(p => p.id === publicTargetId || p.hn === publicTargetId) : null);

  // 1. If accessed via public location link / state: Use Email-based authentication (No User/Password required)
  if (publicTargetId || publicPinningPatient) {
    // If patient is not yet loaded and firestore is still initializing, show nice medical loading screen
    if (!activePublicPatient && !isFirestoreReady) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 font-['Prompt',sans-serif]">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-8 text-center space-y-4 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-base font-bold text-slate-900">กำลังเชื่อมต่อระบบ รพ.โพนนาแก้ว...</h2>
            <p className="text-xs text-slate-500">กรุณารอสักครู่ กำลังดึงข้อมูลระบุพิกัดตำแหน่งบ้านผู้ป่วย</p>
          </div>
        </div>
      );
    }

    if (activePublicPatient) {
      // Step A: Require Email authentication if not logged in with email
      if (!locationReporterEmail) {
        return (
          <LocationEmailLogin
            patient={activePublicPatient}
            onAuthenticated={(email) => {
              setLocationReporterEmail(email);
              showToast(`ยืนยันตัวตนด้วยอีเมลสำเร็จ: ${email}`);
            }}
          />
        );
      }

      // Step B: Show Public Location Pinning Interface
      return (
        <PublicLocationSubmitView
          patient={activePublicPatient}
          batchPatients={publicBatchPatients}
          reporterEmail={locationReporterEmail}
          onSubmitLocation={handleUpdatePatientLocationFromPublic}
          onSelectBatchPatient={(p) => setPublicPinningPatient(p)}
          onLogoutReporter={() => {
            safeStorage.removeItem('tb_phon_reporter_email');
            setLocationReporterEmail(null);
            showToast('ออกจากระบบอีเมลเรียบร้อยแล้ว');
          }}
          onClosePublicView={() => {
            setPublicPinningPatient(null);
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('pinLocationFor');
              url.searchParams.delete('pinLocationBatch');
              url.searchParams.delete('locationToken');
              window.history.replaceState({}, '', url.toString());
            }
          }}
        />
      );
    }

    // Link target ID not found in database fallback view
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-['Prompt',sans-serif]">
        <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl font-bold">📍</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">ระบบระบุพิกัดตำแหน่งบ้าน รพ.โพนนาแก้ว</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            ไม่พบข้อมูลรายชื่อผู้ป่วยสำหรับลิงก์ระบุพิกัดนี้ (รหัส: <span className="font-mono font-bold text-amber-800">{publicTargetId}</span>) <br />
            ลิงก์อาจไม่ถูกต้อง หรือผู้ป่วยได้รับการจำหน่ายออกจากระบบแล้ว
          </p>
          <button 
            onClick={() => {
              setPublicPinningPatient(null);
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.delete('pinLocationFor');
                url.searchParams.delete('locationToken');
                window.location.href = url.pathname;
              }
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            ไปที่หน้าแรกของระบบ
          </button>
        </div>
      </div>
    );
  }

  // 2. Hospital Staff View: Requires Staff Username & Password login
  if (currentUser === null) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-['Prompt',sans-serif]">
        <LoginModal
          users={users}
          onLogin={(user) => {
            setCurrentUser(user);
            showToast(`ยินดีต้อนรับเข้าสู่ระบบ: คุณ${user.fullName}`);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Prompt',sans-serif]">
      
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        patientsCount={patients.length}
        contactsCount={contacts.length}
        investigationsCount={investigations.length}
        homeVisitsCount={homeVisits.length}
        missedDosesCount={missedDosesCount}
        onOpenExport={() => setIsExportOpen(true)}
        currentUser={currentUser}
        onOpenUserMgmt={() => setIsUserMgmtOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          showToast('ออกจากระบบเรียบร้อยแล้ว');
        }}
        onWipeAllData={handleWipeAllData}
      />

      {/* Login Screen Overlay when not logged in */}
      {currentUser === null && (
        <LoginModal
          users={users}
          onLogin={(user) => {
            setCurrentUser(user);
            showToast(`ยินดีต้อนรับเข้าสู่ระบบ: คุณ${user.fullName}`);
          }}
        />
      )}

      {/* Main Active Tab Content */}
      <main className="flex-1 pb-12">
        {activeTab === 'dashboard' && (
          <Dashboard
            patients={patients}
            contacts={contacts}
            investigations={investigations}
            subdistricts={PHON_NA_KAEO_SUBDISTRICTS}
            onNavigate={setActiveTab}
            onOpenNewPatient={() => setActiveTab('patients')}
            onOpenNewContact={() => setActiveTab('contacts')}
            onTriggerQuickNotify={handleQuickNotify}
            onSelectPatient={p => {
              setSelectedPatientForDetail(p);
              setActiveTab('patients');
            }}
          />
        )}

        {activeTab === 'spotmap' && (
          <SpotMap
            patients={patients}
            contacts={contacts}
            subdistricts={PHON_NA_KAEO_SUBDISTRICTS}
            onTriggerPatientNotify={handleTriggerPatientNotify}
            onSelectPatient={p => {
              setSelectedPatientForDetail(p);
              setActiveTab('patients');
            }}
            onOpenShareLocationModal={(param) => {
              if (Array.isArray(param)) {
                setShareLocationTargetPatients(param);
                setShareLocationTargetPatient(param[0] || null);
              } else {
                setShareLocationTargetPatient(param || null);
                setShareLocationTargetPatients(param ? [param] : null);
              }
              setIsShareLocationOpen(true);
            }}
          />
        )}

        {activeTab === 'patients' && (
          <PatientManagement
            patients={patients}
            subdistricts={subdistrictNames}
            onAddPatient={handleAddPatient}
            onUpdatePatient={handleUpdatePatient}
            onDeletePatient={handleDeletePatient}
            onClearAllPatients={handleClearAllPatients}
            onTriggerPatientNotify={handleTriggerPatientNotify}
            onTriggerBulkNotify={handleTriggerBulkNotify}
            initialSelectedPatient={selectedPatientForDetail}
            currentUser={currentUser}
            onOpenExcelImportModal={() => setIsExcelImportOpen(true)}
            onOpenShareLocationModal={(param) => {
              if (Array.isArray(param)) {
                setShareLocationTargetPatients(param);
                setShareLocationTargetPatient(param[0] || null);
              } else {
                setShareLocationTargetPatient(param || null);
                setShareLocationTargetPatients(param ? [param] : null);
              }
              setIsShareLocationOpen(true);
            }}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactTracing
            contacts={contacts}
            patients={patients}
            onAddContact={handleAddContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
            currentUser={currentUser}
            onOpenExcelImportModal={() => setIsExcelImportOpen(true)}
          />
        )}

        {activeTab === 'investigations' && (
          <InvestigationManagement
            investigations={investigations}
            patients={patients}
            contacts={contacts}
            onAddInvestigation={handleAddInvestigation}
            onUpdateInvestigation={handleUpdateInvestigation}
            onDeleteInvestigation={handleDeleteInvestigation}
            currentUser={currentUser}
            onNavigateToContacts={() => setActiveTab('contacts')}
          />
        )}

        {activeTab === 'home-visits' && (
          <HomeVisitManagement
            homeVisits={homeVisits}
            patients={patients}
            contacts={contacts}
            subdistricts={PHON_NA_KAEO_SUBDISTRICTS}
            onSaveHomeVisit={handleSaveHomeVisit}
            onDeleteHomeVisit={handleDeleteHomeVisit}
            currentUser={currentUser}
            onNavigateToPatients={() => setActiveTab('patients')}
            onTriggerQuickNotify={(msg) => showToast(msg)}
          />
        )}

        {activeTab === 'line-gas' && (
          <LineAppsScript
            lineConfig={lineConfig}
            onUpdateLineConfig={setLineConfig}
            logs={logs}
            onAddLog={newLog => setLogs(prev => [newLog, ...prev])}
          />
        )}
      </main>

      {/* User Management & Password Modal */}
      {currentUser && (
        <UserManagementModal
          isOpen={isUserMgmtOpen}
          onClose={() => setIsUserMgmtOpen(false)}
          users={users}
          onAddUser={handleAddUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          currentUser={currentUser}
        />
      )}

      {/* Floating Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        patients={patients}
        contacts={contacts}
        onResetToDemoData={handleResetToDemoData}
        onImportJsonData={handleImportJsonData}
        onOpenExcelImportModal={() => setIsExcelImportOpen(true)}
      />

      {/* Excel Import & Template Modal */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        onImportData={handleImportExcelData}
      />

      {/* Share Location Link & QR Code Modal */}
      <ShareLocationLinkModal
        isOpen={isShareLocationOpen}
        onClose={() => {
          setIsShareLocationOpen(false);
          setShareLocationTargetPatient(null);
          setShareLocationTargetPatients(null);
        }}
        patient={shareLocationTargetPatient}
        initialPatient={shareLocationTargetPatient}
        initialPatients={shareLocationTargetPatients}
        allPatients={patients}
        onSelectPatient={(p) => setShareLocationTargetPatient(p)}
        onOpenPublicPreview={(pId) => {
          const found = patients.find(pt => pt.id === pId);
          if (found) {
            setPublicPinningPatient(found);
          }
        }}
      />

      {/* LINE Send Notification Modal */}
      <LineSendModal
        isOpen={isLineSendModalOpen}
        onClose={() => {
          setIsLineSendModalOpen(false);
          setLineSendTargetPatient(null);
          setLineSendTargetPatients(undefined);
        }}
        patient={lineSendTargetPatient}
        patientsList={lineSendTargetPatients}
        lineConfig={lineConfig}
        onAddLog={handleAddLog}
        onShowToast={showToast}
        onOpenShareLocationModal={(p) => {
          setIsLineSendModalOpen(false);
          setShareLocationTargetPatient(p || null);
          setIsShareLocationOpen(true);
        }}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <p>
          ระบบควบคุมและติดตามผู้ป่วยวัณโรค อ.โพนนาแก้ว จ.สกลนคร &bull; โรงพยาบาลโพนนาแก้ว
        </p>
      </footer>
    </div>
  );
}
