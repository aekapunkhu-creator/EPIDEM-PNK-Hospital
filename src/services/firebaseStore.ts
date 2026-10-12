import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  arrayUnion,
  addDoc
} from 'firebase/firestore';
import {
  getDatabase,
  ref as rtdbRef,
  set as rtdbSet,
  remove as rtdbRemove,
  get as rtdbGet,
  onValue as rtdbOnValue,
  push as rtdbPush
} from 'firebase/database';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Patient, HouseholdContact, LineNotificationConfig, NotificationLog, UserAccount, InvestigationRecord, HomeVisitRecord, VideoCallSession, CallChatMessage, CallStatus, CallParticipant, MultiPeerSignal, TbCxrScreeningRecord } from '../types';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(
  app,
  (firebaseConfig as any).firestoreDatabaseId || '(default)'
);

// Firebase Realtime Database
export const rtdb = getDatabase(
  app,
  (firebaseConfig as any).databaseURL || 'https://gen-lang-client-0819425332-default-rtdb.firebaseio.com'
);

export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
}

export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
  }
}

/**
 * Recursively removes `undefined` properties and replaces them or excludes them,
 * preventing FirebaseError: Function setDoc() called with invalid data. Unsupported field value: undefined.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object') {
    if (data instanceof Date) return data as any;
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value);
      }
    }
    return result;
  }
  return data;
}

// Track Firestore quota state to prevent infinite error backoffs and unneeded network hammering
let _isFirestoreQuotaExhausted = false;

export function isQuotaExhaustedError(err: any): boolean {
  if (!err) return false;
  return (
    err.code === 'resource-exhausted' ||
    (typeof err.message === 'string' && (
      err.message.includes('Quota limit exceeded') ||
      err.message.includes('resource-exhausted') ||
      err.message.includes('Free daily write units')
    ))
  );
}

export function isFirestoreQuotaExhausted(): boolean {
  if (_isFirestoreQuotaExhausted) return true;
  if (typeof sessionStorage !== 'undefined') {
    const flag = sessionStorage.getItem('tb_phon_firestore_quota_exhausted');
    if (flag) {
      const timestamp = parseInt(flag, 10);
      if (!isNaN(timestamp) && (Date.now() - timestamp < 12 * 60 * 60 * 1000)) {
        _isFirestoreQuotaExhausted = true;
        return true;
      }
    }
  }
  return false;
}

export function markFirestoreQuotaExhausted() {
  if (!_isFirestoreQuotaExhausted) {
    _isFirestoreQuotaExhausted = true;
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem('tb_phon_firestore_quota_exhausted', Date.now().toString());
      } catch (e) {}
    }
    console.warn('[Firestore] Daily free tier write quota reached. System is operating safely in local safeStorage & RTDB mode.');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
    }
  }
}

export function handleFirestoreError(operationName: string, error: any) {
  if (isQuotaExhaustedError(error)) {
    markFirestoreQuotaExhausted();
    return;
  }
  console.warn(`Firestore [${operationName}]:`, error?.message || error);
}

// Subscribe real-time collections
export function subscribePatients(onData: (data: Patient[]) => void, onError?: (err: any) => void) {
  const colRef = collection(db, 'patients');
  return onSnapshot(colRef, (snapshot) => {
    const items: Patient[] = [];
    snapshot.forEach(d => {
      items.push(d.data() as Patient);
    });
    onData(items);
  }, (err) => {
    handleFirestoreError('subscribePatients', err);
    if (onError) onError(err);
  });
}

export function subscribeContacts(onData: (data: HouseholdContact[]) => void, onError?: (err: any) => void) {
  const colRef = collection(db, 'contacts');
  return onSnapshot(colRef, (snapshot) => {
    const items: HouseholdContact[] = [];
    snapshot.forEach(d => {
      items.push(d.data() as HouseholdContact);
    });
    onData(items);
  }, (err) => {
    handleFirestoreError('subscribeContacts', err);
    if (onError) onError(err);
  });
}

export function subscribeUsers(onData: (data: UserAccount[]) => void, onError?: (err: any) => void) {
  const colRef = collection(db, 'users');
  return onSnapshot(colRef, (snapshot) => {
    const items: UserAccount[] = [];
    snapshot.forEach(d => {
      items.push(d.data() as UserAccount);
    });
    onData(items);
  }, (err) => {
    handleFirestoreError('subscribeUsers', err);
    if (onError) onError(err);
  });
}

export function subscribeLineConfig(onData: (data: LineNotificationConfig) => void, onError?: (err: any) => void) {
  const docRef = doc(db, 'config', 'lineConfig');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onData(docSnap.data() as LineNotificationConfig);
    }
  }, (err) => {
    handleFirestoreError('subscribeLineConfig', err);
    if (onError) onError(err);
  });
}

export function subscribeLogs(onData: (data: NotificationLog[]) => void, onError?: (err: any) => void) {
  const colRef = collection(db, 'logs');
  return onSnapshot(colRef, (snapshot) => {
    const items: NotificationLog[] = [];
    snapshot.forEach(d => {
      items.push(d.data() as NotificationLog);
    });
    onData(items);
  }, (err) => {
    handleFirestoreError('subscribeLogs', err);
    if (onError) onError(err);
  });
}

export function subscribeInvestigations(onData: (data: InvestigationRecord[]) => void, onError?: (err: any) => void) {
  const colRef = collection(db, 'investigations');
  return onSnapshot(colRef, (snapshot) => {
    const items: InvestigationRecord[] = [];
    snapshot.forEach(d => {
      items.push(d.data() as InvestigationRecord);
    });
    onData(items);
  }, (err) => {
    handleFirestoreError('subscribeInvestigations', err);
    if (onError) onError(err);
  });
}

export function subscribeHomeVisits(onData: (data: HomeVisitRecord[]) => void, onError?: (err: any) => void) {
  const colRef = collection(db, 'homeVisits');
  return onSnapshot(colRef, (snapshot) => {
    const items: HomeVisitRecord[] = [];
    snapshot.forEach(d => {
      items.push(d.data() as HomeVisitRecord);
    });
    onData(items);
  }, (err) => {
    handleFirestoreError('subscribeHomeVisits', err);
    if (onError) onError(err);
  });
}

export function subscribeTbcxrScreenings(onData: (data: TbCxrScreeningRecord[]) => void, onError?: (err: any) => void) {
  const colRef = collection(db, 'tbcxr_screenings');
  return onSnapshot(colRef, (snapshot) => {
    const items: TbCxrScreeningRecord[] = [];
    snapshot.forEach(d => {
      items.push(d.data() as TbCxrScreeningRecord);
    });
    onData(items);
  }, (err) => {
    handleFirestoreError('subscribeTbcxrScreenings', err);
    if (onError) onError(err);
  });
}

export async function saveAllTbcxrScreeningsToFirestore(screenings: TbCxrScreeningRecord[]) {
  try {
    try {
      const map: Record<string, any> = {};
      screenings.forEach(s => { map[s.id] = sanitizeForFirestore(s); });
      await rtdbSet(rtdbRef(rtdb, 'tbcxr_screenings'), map);
    } catch (e) {}

    if (isFirestoreQuotaExhausted()) return;

    const batch = writeBatch(db);
    screenings.forEach(s => {
      const cleanData = sanitizeForFirestore(s);
      const docRef = doc(db, 'tbcxr_screenings', s.id);
      batch.set(docRef, cleanData);
    });
    await batch.commit();
  } catch (e) {
    handleFirestoreError('saveAllTbcxrScreeningsToFirestore', e);
  }
}

export async function saveTbcxrScreeningToFirestore(screening: TbCxrScreeningRecord) {
  try {
    const cleanData = sanitizeForFirestore(screening);
    try {
      await rtdbSet(rtdbRef(rtdb, `tbcxr_screenings/${screening.id}`), cleanData);
    } catch (e) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'tbcxr_screenings', screening.id);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (e) {
    handleFirestoreError('saveTbcxrScreeningToFirestore', e);
  }
}

export async function deleteTbcxrScreeningFromFirestore(screeningId: string) {
  try {
    try {
      await rtdbRemove(rtdbRef(rtdb, `tbcxr_screenings/${screeningId}`));
    } catch (e) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'tbcxr_screenings', screeningId);
    await deleteDoc(docRef);
  } catch (e) {
    handleFirestoreError('deleteTbcxrScreeningFromFirestore', e);
  }
}

// Bulk Save / Seed Functions
export async function saveAllPatientsToFirestore(patients: Patient[]) {
  try {
    try {
      const patientsMap: Record<string, Patient> = {};
      patients.forEach(p => { patientsMap[p.id] = sanitizeForFirestore(p); });
      await rtdbSet(rtdbRef(rtdb, 'patients'), patientsMap);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const batch = writeBatch(db);
    patients.forEach(p => {
      const docRef = doc(db, 'patients', p.id);
      batch.set(docRef, sanitizeForFirestore(p));
    });
    await batch.commit();
  } catch (e) {
    handleFirestoreError('saveAllPatientsToFirestore', e);
  }
}

export async function saveAllContactsToFirestore(contacts: HouseholdContact[]) {
  try {
    try {
      const contactsMap: Record<string, HouseholdContact> = {};
      contacts.forEach(c => { contactsMap[c.id] = sanitizeForFirestore(c); });
      await rtdbSet(rtdbRef(rtdb, 'contacts'), contactsMap);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const batch = writeBatch(db);
    contacts.forEach(c => {
      const docRef = doc(db, 'contacts', c.id);
      batch.set(docRef, sanitizeForFirestore(c));
    });
    await batch.commit();
  } catch (e) {
    handleFirestoreError('saveAllContactsToFirestore', e);
  }
}

export async function saveAllUsersToFirestore(users: UserAccount[]) {
  try {
    try {
      const usersMap: Record<string, UserAccount> = {};
      users.forEach(u => { usersMap[u.id] = u; });
      await rtdbSet(rtdbRef(rtdb, 'users'), usersMap);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const batch = writeBatch(db);
    users.forEach(u => {
      const docRef = doc(db, 'users', u.id);
      batch.set(docRef, u);
    });
    await batch.commit();
  } catch (e) {
    handleFirestoreError('saveAllUsersToFirestore', e);
  }
}

export async function saveLineConfigToFirestore(config: LineNotificationConfig) {
  try {
    try {
      await rtdbSet(rtdbRef(rtdb, 'config/lineConfig'), config);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'config', 'lineConfig');
    await setDoc(docRef, config);
  } catch (e) {
    handleFirestoreError('saveLineConfigToFirestore', e);
  }
}

export async function saveAllLogsToFirestore(logs: NotificationLog[]) {
  try {
    try {
      const logsMap: Record<string, NotificationLog> = {};
      logs.forEach(l => { logsMap[l.id] = l; });
      await rtdbSet(rtdbRef(rtdb, 'logs'), logsMap);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const batch = writeBatch(db);
    logs.forEach(l => {
      const docRef = doc(db, 'logs', l.id);
      batch.set(docRef, l);
    });
    await batch.commit();
  } catch (e) {
    handleFirestoreError('saveAllLogsToFirestore', e);
  }
}

export async function saveLogToFirestore(log: NotificationLog) {
  try {
    try {
      await rtdbSet(rtdbRef(rtdb, `logs/${log.id}`), log);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'logs', log.id);
    await setDoc(docRef, log);
  } catch (e) {
    handleFirestoreError('saveLogToFirestore', e);
  }
}

// Single Item Persistence Helpers
export async function savePatientToFirestore(patient: Patient) {
  try {
    const cleanData = sanitizeForFirestore(patient);
    try {
      await rtdbSet(rtdbRef(rtdb, `patients/${patient.id}`), cleanData);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'patients', patient.id);
    await setDoc(docRef, cleanData);
  } catch (e) {
    handleFirestoreError('savePatientToFirestore', e);
  }
}

export async function deletePatientFromFirestore(patientId: string) {
  try {
    try {
      await rtdbRemove(rtdbRef(rtdb, `patients/${patientId}`));
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'patients', patientId);
    await deleteDoc(docRef);
  } catch (e) {
    handleFirestoreError('deletePatientFromFirestore', e);
  }
}

export async function saveContactToFirestore(contact: HouseholdContact) {
  try {
    const cleanData = sanitizeForFirestore(contact);
    try {
      await rtdbSet(rtdbRef(rtdb, `contacts/${contact.id}`), cleanData);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'contacts', contact.id);
    await setDoc(docRef, cleanData);
  } catch (e) {
    handleFirestoreError('saveContactToFirestore', e);
  }
}

export async function deleteContactFromFirestore(contactId: string) {
  try {
    try {
      await rtdbRemove(rtdbRef(rtdb, `contacts/${contactId}`));
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'contacts', contactId);
    await deleteDoc(docRef);
  } catch (e) {
    handleFirestoreError('deleteContactFromFirestore', e);
  }
}

export async function saveUserToFirestore(user: UserAccount) {
  try {
    try {
      await rtdbSet(rtdbRef(rtdb, `users/${user.id}`), user);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'users', user.id);
    await setDoc(docRef, user);
  } catch (e) {
    handleFirestoreError('saveUserToFirestore', e);
  }
}

export async function deleteUserFromFirestore(userId: string) {
  try {
    try {
      await rtdbRemove(rtdbRef(rtdb, `users/${userId}`));
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'users', userId);
    await deleteDoc(docRef);
  } catch (e) {
    handleFirestoreError('deleteUserFromFirestore', e);
  }
}

export async function saveAllInvestigationsToFirestore(investigations: InvestigationRecord[]) {
  try {
    try {
      const map: Record<string, InvestigationRecord> = {};
      investigations.forEach(inv => { map[inv.id] = inv; });
      await rtdbSet(rtdbRef(rtdb, 'investigations'), map);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const batch = writeBatch(db);
    investigations.forEach(inv => {
      const docRef = doc(db, 'investigations', inv.id);
      batch.set(docRef, inv);
    });
    await batch.commit();
  } catch (e) {
    handleFirestoreError('saveAllInvestigationsToFirestore', e);
  }
}

export async function saveInvestigationToFirestore(investigation: InvestigationRecord) {
  try {
    try {
      await rtdbSet(rtdbRef(rtdb, `investigations/${investigation.id}`), investigation);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'investigations', investigation.id);
    await setDoc(docRef, investigation);
  } catch (e) {
    handleFirestoreError('saveInvestigationToFirestore', e);
  }
}

export async function deleteInvestigationFromFirestore(investigationId: string) {
  try {
    try {
      await rtdbRemove(rtdbRef(rtdb, `investigations/${investigationId}`));
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'investigations', investigationId);
    await deleteDoc(docRef);
  } catch (e) {
    handleFirestoreError('deleteInvestigationFromFirestore', e);
  }
}

export async function saveAllHomeVisitsToFirestore(homeVisits: HomeVisitRecord[]) {
  try {
    try {
      const map: Record<string, HomeVisitRecord> = {};
      homeVisits.forEach(hv => { map[hv.id] = hv; });
      await rtdbSet(rtdbRef(rtdb, 'homeVisits'), map);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const batch = writeBatch(db);
    homeVisits.forEach(hv => {
      const docRef = doc(db, 'homeVisits', hv.id);
      batch.set(docRef, hv);
    });
    await batch.commit();
  } catch (e) {
    handleFirestoreError('saveAllHomeVisitsToFirestore', e);
  }
}

export async function saveHomeVisitToFirestore(homeVisit: HomeVisitRecord) {
  try {
    try {
      await rtdbSet(rtdbRef(rtdb, `homeVisits/${homeVisit.id}`), homeVisit);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'homeVisits', homeVisit.id);
    await setDoc(docRef, homeVisit);
  } catch (e) {
    handleFirestoreError('saveHomeVisitToFirestore', e);
  }
}

export async function deleteHomeVisitFromFirestore(homeVisitId: string) {
  try {
    try {
      await rtdbRemove(rtdbRef(rtdb, `homeVisits/${homeVisitId}`));
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'homeVisits', homeVisitId);
    await deleteDoc(docRef);
  } catch (e) {
    handleFirestoreError('deleteHomeVisitFromFirestore', e);
  }
}

export async function fetchPatientByIdFromFirestore(idOrHn: string): Promise<Patient | null> {
  try {
    // 1. Try direct doc ID
    const docRef = doc(db, 'patients', idOrHn);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Patient;
    }
    // 2. Try querying by HN
    const colRef = collection(db, 'patients');
    const allSnaps = await getDocs(colRef);
    for (const d of allSnaps.docs) {
      const p = d.data() as Patient;
      if (p.id === idOrHn || p.hn === idOrHn) {
        return p;
      }
    }
    // 3. Fallback: try RTDB if available
    try {
      const rtdbSnap = await rtdbGet(rtdbRef(rtdb, `patients/${idOrHn}`));
      if (rtdbSnap.exists()) {
        return rtdbSnap.val() as Patient;
      }
    } catch (rtdbErr) {}
    return null;
  } catch (e) {
    console.error('Error fetching patient directly from firestore', e);
    return null;
  }
}

export async function clearCollectionInFirestore(collectionName: string) {
  try {
    try {
      await rtdbRemove(rtdbRef(rtdb, collectionName));
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  } catch (e) {
    handleFirestoreError(`clearCollectionInFirestore(${collectionName})`, e);
  }
}

// ----------------------------------------------------
// TELEHEALTH VIDEO CALL FUNCTIONS
// ----------------------------------------------------

export function subscribeCalls(
  onUpdate: (calls: VideoCallSession[]) => void,
  onError?: (err: any) => void
) {
  try {
    const colRef = collection(db, 'calls');
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const list: VideoCallSession[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as VideoCallSession);
        });
        // sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (err) => {
        console.warn('Calls listener error', err);
        if (onError) onError(err);
      }
    );
    return unsub;
  } catch (e) {
    console.error('Error setting up calls listener', e);
    return () => {};
  }
}

export function subscribeCallById(
  callId: string,
  onUpdate: (call: VideoCallSession | null) => void,
  onError?: (err: any) => void
) {
  try {
    const docRef = doc(db, 'calls', callId);
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as VideoCallSession);
        } else {
          onUpdate(null);
        }
      },
      (err) => {
        console.warn(`Call doc listener error for ${callId}`, err);
        if (onError) onError(err);
      }
    );
    return unsub;
  } catch (e) {
    console.error('Error setting up call doc listener', e);
    return () => {};
  }
}

export async function saveCallSessionToFirestore(call: VideoCallSession) {
  try {
    try {
      await rtdbSet(rtdbRef(rtdb, `calls/${call.id}`), call);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'calls', call.id);
    await setDoc(docRef, call, { merge: true });
  } catch (e) {
    handleFirestoreError('saveCallSessionToFirestore', e);
  }
}

export async function updateCallStatus(
  callId: string,
  status: CallStatus,
  extra: Partial<VideoCallSession> = {}
) {
  try {
    try {
      await rtdbSet(rtdbRef(rtdb, `calls/${callId}/status`), status);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'calls', callId);
    const updateData: any = {
      status,
      ...extra
    };
    if (status === 'connected' && !extra.startedAt) {
      updateData.startedAt = new Date().toISOString();
    }
    if (status === 'ended' && !extra.endedAt) {
      updateData.endedAt = new Date().toISOString();
    }
    await setDoc(docRef, updateData, { merge: true });
  } catch (e) {
    handleFirestoreError('updateCallStatus', e);
  }
}

export async function addCallIceCandidate(
  callId: string,
  role: 'caller' | 'callee',
  candidate: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null }
) {
  try {
    if (!candidate || !candidate.candidate) return;

    try {
      const sanitizedKey = candidate.candidate.replace(/[.#$/[\]]/g, '_').substring(0, 40);
      const key = role === 'caller' ? 'callerIceCandidates' : 'calleeIceCandidates';
      await rtdbSet(rtdbRef(rtdb, `calls/${callId}/${key}/${sanitizedKey}`), candidate);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'calls', callId);
    const key = role === 'caller' ? 'callerIceCandidates' : 'calleeIceCandidates';
    await setDoc(docRef, {
      [key]: arrayUnion(candidate)
    }, { merge: true });
  } catch (e) {
    handleFirestoreError('addCallIceCandidate', e);
  }
}

export async function addCallMessage(callId: string, message: CallChatMessage) {
  try {
    try {
      await rtdbSet(rtdbRef(rtdb, `calls/${callId}/messages/${message.id}`), message);
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'calls', callId);
    await setDoc(docRef, {
      messages: arrayUnion(message)
    }, { merge: true });
  } catch (e) {
    handleFirestoreError('addCallMessage', e);
  }
}

export async function deleteCallSession(callId: string) {
  try {
    try {
      await rtdbRemove(rtdbRef(rtdb, `calls/${callId}`));
    } catch (rtdbErr) {}

    if (isFirestoreQuotaExhausted()) return;

    const docRef = doc(db, 'calls', callId);
    await deleteDoc(docRef);
  } catch (e) {
    handleFirestoreError('deleteCallSession', e);
  }
}

export async function fetchCallSessionById(callId: string): Promise<VideoCallSession | null> {
  try {
    if (isFirestoreQuotaExhausted()) {
      try {
        const rtdbSnap = await rtdbGet(rtdbRef(rtdb, `calls/${callId}`));
        if (rtdbSnap.exists()) {
          return rtdbSnap.val() as VideoCallSession;
        }
      } catch (rtdbErr) {}
      return null;
    }

    const docRef = doc(db, 'calls', callId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as VideoCallSession;
    }
    try {
      const rtdbSnap = await rtdbGet(rtdbRef(rtdb, `calls/${callId}`));
      if (rtdbSnap.exists()) {
        return rtdbSnap.val() as VideoCallSession;
      }
    } catch (rtdbErr) {}
    return null;
  } catch (e) {
    handleFirestoreError('fetchCallSessionById', e);
    return null;
  }
}

// ----------------------------------------------------
// Multi-Party / Group Video Call Signaling & Presence
// ----------------------------------------------------

export async function joinRoomParticipant(callId: string, participant: CallParticipant) {
  try {
    try {
      await rtdbSet(rtdbRef(rtdb, `calls/${callId}/participants/${participant.peerId}`), participant);
    } catch (e) {}

    if (isFirestoreQuotaExhausted()) return;

    const participantDoc = doc(db, 'calls', callId, 'participants', participant.peerId);
    await setDoc(participantDoc, participant, { merge: true });

    // Also update participants map in the main call document for easy overview
    const mainDocRef = doc(db, 'calls', callId);
    await setDoc(mainDocRef, {
      [`participants.${participant.peerId}`]: participant,
      status: 'connected',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    handleFirestoreError('joinRoomParticipant', e);
  }
}

export async function leaveRoomParticipant(callId: string, peerId: string) {
  try {
    try {
      await rtdbRemove(rtdbRef(rtdb, `calls/${callId}/participants/${peerId}`));
    } catch (e) {}

    if (isFirestoreQuotaExhausted()) return;

    const participantDoc = doc(db, 'calls', callId, 'participants', peerId);
    await deleteDoc(participantDoc);
  } catch (e) {
    handleFirestoreError('leaveRoomParticipant', e);
  }
}

export async function updateParticipantState(
  callId: string, 
  peerId: string, 
  state: Partial<CallParticipant>
) {
  try {
    try {
      await rtdbSet(rtdbRef(rtdb, `calls/${callId}/participants/${peerId}/isMuted`), state.isMuted ?? false);
      if (state.isVideoOff !== undefined) {
        await rtdbSet(rtdbRef(rtdb, `calls/${callId}/participants/${peerId}/isVideoOff`), state.isVideoOff);
      }
    } catch (e) {}

    if (isFirestoreQuotaExhausted()) return;

    const participantDoc = doc(db, 'calls', callId, 'participants', peerId);
    await setDoc(participantDoc, state, { merge: true });
  } catch (e) {
    handleFirestoreError('updateParticipantState', e);
  }
}

export function subscribeRoomParticipants(
  callId: string, 
  callback: (participants: CallParticipant[]) => void
): () => void {
  const colRef = collection(db, 'calls', callId, 'participants');
  return onSnapshot(colRef, (snapshot) => {
    const list: CallParticipant[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as CallParticipant);
    });
    callback(list);
  }, (err) => {
    handleFirestoreError('subscribeRoomParticipants', err);
    // RTDB fallback
    try {
      rtdbOnValue(rtdbRef(rtdb, `calls/${callId}/participants`), (snap) => {
        if (snap.exists()) {
          const val = snap.val();
          const list = Object.values(val) as CallParticipant[];
          callback(list);
        } else {
          callback([]);
        }
      });
    } catch (e) {}
  });
}

export async function sendRoomSignal(callId: string, signal: MultiPeerSignal) {
  try {
    try {
      await rtdbPush(rtdbRef(rtdb, `calls/${callId}/signals/${signal.toPeerId}`), signal);
    } catch (e) {}

    if (isFirestoreQuotaExhausted()) return;

    const sigCol = collection(db, 'calls', callId, 'signals');
    await addDoc(sigCol, {
      ...signal,
      createdAt: Date.now()
    });
  } catch (e) {
    handleFirestoreError('sendRoomSignal', e);
  }
}

export function subscribeRoomSignals(
  callId: string, 
  localPeerId: string, 
  callback: (signal: MultiPeerSignal) => void
): () => void {
  const sigCol = collection(db, 'calls', callId, 'signals');
  const seenSignalIds = new Set<string>();

  const unsubFirestore = onSnapshot(sigCol, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const sig = change.doc.data() as MultiPeerSignal;
        const sigId = change.doc.id;
        if (!seenSignalIds.has(sigId) && sig.toPeerId === localPeerId && sig.fromPeerId !== localPeerId) {
          seenSignalIds.add(sigId);
          callback({ ...sig, id: sigId });
        }
      }
    });
  }, (err) => {
    console.warn('Firestore signals error, fallback to RTDB:', err);
  });

  // Also subscribe to RTDB for immediate delivery
  let unsubRtdb = () => {};
  try {
    const rRef = rtdbRef(rtdb, `calls/${callId}/signals/${localPeerId}`);
    const listener = rtdbOnValue(rRef, (snap) => {
      if (snap.exists()) {
        const val = snap.val();
        Object.entries(val).forEach(([k, s]: [string, any]) => {
          if (!seenSignalIds.has(k) && s.fromPeerId !== localPeerId) {
            seenSignalIds.add(k);
            callback({ ...s, id: k });
          }
        });
      }
    });
    unsubRtdb = () => {};
  } catch (e) {}

  return () => {
    unsubFirestore();
    unsubRtdb();
  };
}


