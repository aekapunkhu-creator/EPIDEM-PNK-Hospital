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
  writeBatch
} from 'firebase/firestore';
import {
  getDatabase,
  ref as rtdbRef,
  set as rtdbSet,
  remove as rtdbRemove,
  get as rtdbGet,
  onValue as rtdbOnValue
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
import { Patient, HouseholdContact, LineNotificationConfig, NotificationLog, UserAccount, InvestigationRecord, HomeVisitRecord, VideoCallSession, CallChatMessage, CallStatus } from '../types';

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
    console.error('Patients snapshot error:', err);
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
    console.error('Contacts snapshot error:', err);
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
    console.error('Users snapshot error:', err);
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
    console.error('LineConfig snapshot error:', err);
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
    console.error('Logs snapshot error:', err);
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
    console.error('Investigations snapshot error:', err);
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
    console.error('HomeVisits snapshot error:', err);
    if (onError) onError(err);
  });
}

// Bulk Save / Seed Functions
export async function saveAllPatientsToFirestore(patients: Patient[]) {
  try {
    const batch = writeBatch(db);
    patients.forEach(p => {
      const docRef = doc(db, 'patients', p.id);
      batch.set(docRef, p);
    });
    await batch.commit();

    // Also sync to Realtime Database
    try {
      const patientsMap: Record<string, Patient> = {};
      patients.forEach(p => { patientsMap[p.id] = p; });
      await rtdbSet(rtdbRef(rtdb, 'patients'), patientsMap);
    } catch (rtdbErr) {
      // Ignored if RTDB rules are currently locked
    }
  } catch (e) {
    console.error('Error saving patients to firestore', e);
  }
}

export async function saveAllContactsToFirestore(contacts: HouseholdContact[]) {
  try {
    const batch = writeBatch(db);
    contacts.forEach(c => {
      const docRef = doc(db, 'contacts', c.id);
      batch.set(docRef, c);
    });
    await batch.commit();

    try {
      const contactsMap: Record<string, HouseholdContact> = {};
      contacts.forEach(c => { contactsMap[c.id] = c; });
      await rtdbSet(rtdbRef(rtdb, 'contacts'), contactsMap);
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error saving contacts to firestore', e);
  }
}

export async function saveAllUsersToFirestore(users: UserAccount[]) {
  try {
    const batch = writeBatch(db);
    users.forEach(u => {
      const docRef = doc(db, 'users', u.id);
      batch.set(docRef, u);
    });
    await batch.commit();

    try {
      const usersMap: Record<string, UserAccount> = {};
      users.forEach(u => { usersMap[u.id] = u; });
      await rtdbSet(rtdbRef(rtdb, 'users'), usersMap);
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error saving users to firestore', e);
  }
}

export async function saveLineConfigToFirestore(config: LineNotificationConfig) {
  try {
    const docRef = doc(db, 'config', 'lineConfig');
    await setDoc(docRef, config);

    try {
      await rtdbSet(rtdbRef(rtdb, 'config/lineConfig'), config);
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error saving line config to firestore', e);
  }
}

export async function saveAllLogsToFirestore(logs: NotificationLog[]) {
  try {
    const batch = writeBatch(db);
    logs.forEach(l => {
      const docRef = doc(db, 'logs', l.id);
      batch.set(docRef, l);
    });
    await batch.commit();

    try {
      const logsMap: Record<string, NotificationLog> = {};
      logs.forEach(l => { logsMap[l.id] = l; });
      await rtdbSet(rtdbRef(rtdb, 'logs'), logsMap);
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error saving logs to firestore', e);
  }
}

// Single Item Persistence Helpers
export async function savePatientToFirestore(patient: Patient) {
  try {
    const docRef = doc(db, 'patients', patient.id);
    await setDoc(docRef, patient);

    try {
      await rtdbSet(rtdbRef(rtdb, `patients/${patient.id}`), patient);
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error saving patient to firestore', e);
  }
}

export async function deletePatientFromFirestore(patientId: string) {
  try {
    const docRef = doc(db, 'patients', patientId);
    await deleteDoc(docRef);

    try {
      await rtdbRemove(rtdbRef(rtdb, `patients/${patientId}`));
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error deleting patient from firestore', e);
  }
}

export async function saveContactToFirestore(contact: HouseholdContact) {
  try {
    const docRef = doc(db, 'contacts', contact.id);
    await setDoc(docRef, contact);

    try {
      await rtdbSet(rtdbRef(rtdb, `contacts/${contact.id}`), contact);
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error saving contact to firestore', e);
  }
}

export async function deleteContactFromFirestore(contactId: string) {
  try {
    const docRef = doc(db, 'contacts', contactId);
    await deleteDoc(docRef);

    try {
      await rtdbRemove(rtdbRef(rtdb, `contacts/${contactId}`));
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error deleting contact from firestore', e);
  }
}

export async function saveUserToFirestore(user: UserAccount) {
  try {
    const docRef = doc(db, 'users', user.id);
    await setDoc(docRef, user);

    try {
      await rtdbSet(rtdbRef(rtdb, `users/${user.id}`), user);
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error saving user to firestore', e);
  }
}

export async function deleteUserFromFirestore(userId: string) {
  try {
    const docRef = doc(db, 'users', userId);
    await deleteDoc(docRef);

    try {
      await rtdbRemove(rtdbRef(rtdb, `users/${userId}`));
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error deleting user from firestore', e);
  }
}

export async function saveAllInvestigationsToFirestore(investigations: InvestigationRecord[]) {
  try {
    const batch = writeBatch(db);
    investigations.forEach(inv => {
      const docRef = doc(db, 'investigations', inv.id);
      batch.set(docRef, inv);
    });
    await batch.commit();

    try {
      const map: Record<string, InvestigationRecord> = {};
      investigations.forEach(inv => { map[inv.id] = inv; });
      await rtdbSet(rtdbRef(rtdb, 'investigations'), map);
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error saving investigations to firestore', e);
  }
}

export async function saveInvestigationToFirestore(investigation: InvestigationRecord) {
  try {
    const docRef = doc(db, 'investigations', investigation.id);
    await setDoc(docRef, investigation);

    try {
      await rtdbSet(rtdbRef(rtdb, `investigations/${investigation.id}`), investigation);
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error saving investigation to firestore', e);
  }
}

export async function deleteInvestigationFromFirestore(investigationId: string) {
  try {
    const docRef = doc(db, 'investigations', investigationId);
    await deleteDoc(docRef);

    try {
      await rtdbRemove(rtdbRef(rtdb, `investigations/${investigationId}`));
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error deleting investigation from firestore', e);
  }
}

export async function saveAllHomeVisitsToFirestore(homeVisits: HomeVisitRecord[]) {
  try {
    const batch = writeBatch(db);
    homeVisits.forEach(hv => {
      const docRef = doc(db, 'homeVisits', hv.id);
      batch.set(docRef, hv);
    });
    await batch.commit();

    try {
      const map: Record<string, HomeVisitRecord> = {};
      homeVisits.forEach(hv => { map[hv.id] = hv; });
      await rtdbSet(rtdbRef(rtdb, 'homeVisits'), map);
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error saving home visits to firestore', e);
  }
}

export async function saveHomeVisitToFirestore(homeVisit: HomeVisitRecord) {
  try {
    const docRef = doc(db, 'homeVisits', homeVisit.id);
    await setDoc(docRef, homeVisit);

    try {
      await rtdbSet(rtdbRef(rtdb, `homeVisits/${homeVisit.id}`), homeVisit);
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error saving home visit to firestore', e);
  }
}

export async function deleteHomeVisitFromFirestore(homeVisitId: string) {
  try {
    const docRef = doc(db, 'homeVisits', homeVisitId);
    await deleteDoc(docRef);

    try {
      await rtdbRemove(rtdbRef(rtdb, `homeVisits/${homeVisitId}`));
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error deleting home visit from firestore', e);
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
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }

    try {
      await rtdbRemove(rtdbRef(rtdb, collectionName));
    } catch (rtdbErr) {}
  } catch (e) {
    console.error(`Error clearing collection ${collectionName} in firestore`, e);
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
    const docRef = doc(db, 'calls', call.id);
    await setDoc(docRef, call, { merge: true });

    // Fallback sync to RTDB
    try {
      await rtdbSet(rtdbRef(rtdb, `calls/${call.id}`), call);
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error saving call session to firestore', e);
  }
}

export async function updateCallStatus(
  callId: string,
  status: CallStatus,
  extra: Partial<VideoCallSession> = {}
) {
  try {
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

    try {
      await rtdbSet(rtdbRef(rtdb, `calls/${callId}/status`), status);
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error updating call status', e);
  }
}

export async function addCallIceCandidate(
  callId: string,
  role: 'caller' | 'callee',
  candidate: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null }
) {
  try {
    const docRef = doc(db, 'calls', callId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as VideoCallSession;
      const key = role === 'caller' ? 'callerIceCandidates' : 'calleeIceCandidates';
      const existing = data[key] || [];
      // avoid duplicates
      if (!existing.some(c => c.candidate === candidate.candidate)) {
        await setDoc(docRef, {
          [key]: [...existing, candidate]
        }, { merge: true });
      }
    }
  } catch (e) {
    console.error('Error adding ICE candidate', e);
  }
}

export async function addCallMessage(callId: string, message: CallChatMessage) {
  try {
    const docRef = doc(db, 'calls', callId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as VideoCallSession;
      const existing = data.messages || [];
      await setDoc(docRef, {
        messages: [...existing, message]
      }, { merge: true });
    }
  } catch (e) {
    console.error('Error adding call message', e);
  }
}

export async function deleteCallSession(callId: string) {
  try {
    const docRef = doc(db, 'calls', callId);
    await deleteDoc(docRef);
    try {
      await rtdbRemove(rtdbRef(rtdb, `calls/${callId}`));
    } catch (rtdbErr) {}
  } catch (e) {
    console.error('Error deleting call session from firestore', e);
  }
}

export async function fetchCallSessionById(callId: string): Promise<VideoCallSession | null> {
  try {
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
    console.error('Error fetching call session by ID', e);
    return null;
  }
}


