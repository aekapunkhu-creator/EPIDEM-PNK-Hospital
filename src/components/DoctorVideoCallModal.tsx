import React, { useEffect, useRef, useState } from 'react';
import { 
  Patient, 
  UserAccount, 
  VideoCallSession, 
  CallChatMessage, 
  HomeVisitRecord 
} from '../types';
import { 
  subscribeCallById, 
  saveCallSessionToFirestore, 
  updateCallStatus, 
  addCallMessage,
  saveHomeVisitToFirestore 
} from '../services/firebaseStore';
import { WebRTCConnection } from '../services/webrtcService';
import { callAudio } from '../utils/callAudio';
import { 
  X, Phone, PhoneOff, PhoneCall, Mic, MicOff, Video as VideoIcon, VideoOff, 
  Monitor, Camera, MessageSquare, Send, Copy, Check, QrCode, 
  Share2, HeartPulse, ShieldCheck, AlertCircle, FileText, CheckCircle2,
  Users, RefreshCw, Clock, ExternalLink, Sparkles, Building2, User
} from 'lucide-react';

interface DoctorVideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  currentUser: UserAccount;
  existingCallSession?: VideoCallSession | null;
  onShowToast: (msg: string) => void;
  onOpenLineSendModal?: (patient: Patient, customMsg: string) => void;
}

export const DoctorVideoCallModal: React.FC<DoctorVideoCallModalProps> = ({
  isOpen,
  onClose,
  patient,
  currentUser,
  existingCallSession,
  onShowToast,
  onOpenLineSendModal
}) => {
  if (!isOpen || !patient) return null;

  const [callSession, setCallSession] = useState<VideoCallSession | null>(null);
  const [callId, setCallId] = useState<string>('');
  const [connectionState, setConnectionState] = useState<string>('idle');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);

  // Media & Controls
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // In-Call Chat & Notes
  const [showChat, setShowChat] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [prescriptions, setPrescriptions] = useState<string>('');
  const [saveAsHomeVisit, setSaveAsHomeVisit] = useState<boolean>(true);
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

  // Quick Clinical Checkboxes
  const [evalDotsTaken, setEvalDotsTaken] = useState<boolean>(true);
  const [evalNoJaundice, setEvalNoJaundice] = useState<boolean>(true);
  const [evalNoRash, setEvalNoRash] = useState<boolean>(true);
  const [evalCoughBetter, setEvalCoughBetter] = useState<boolean>(true);

  // Captured snapshot
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const webrtcRef = useRef<WebRTCConnection | null>(null);
  const timerRef = useRef<any>(null);

  // Generate patient access URL
  const getPatientCallUrl = (id: string) => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?videoCall=${id}`;
  };

  // 1. Initialize or load Call Session
  useEffect(() => {
    let activeCallId = existingCallSession?.id;
    
    if (!activeCallId) {
      // Create new call session ID
      activeCallId = `CALL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newSession: VideoCallSession = {
        id: activeCallId,
        patientId: patient.id,
        patientName: `${patient.prefix}${patient.firstName} ${patient.lastName}`,
        patientHN: patient.hn,
        patientPhone: patient.phone,
        patientSubdistrict: patient.subdistrict,
        patientVillage: patient.village,
        callerId: currentUser.id,
        callerName: currentUser.fullName,
        callerRole: currentUser.role === 'Admin' ? 'แพทย์' : 'พยาบาลวิชาชีพ/เจ้าหน้าที่',
        hospitalName: 'โรงพยาบาลโพนนาแก้ว',
        status: 'waiting',
        createdAt: new Date().toISOString(),
        reason: 'ติดตามอาการและประเมินการกินยา (Telemedicine V-DOTS)'
      };
      setCallSession(newSession);
      setCallId(activeCallId);
      startCallAsDoctor(activeCallId, newSession);
    } else {
      setCallId(activeCallId);
      setCallSession(existingCallSession);
      startCallAsDoctor(activeCallId, existingCallSession);
    }

    // Subscribe to Firestore for real-time updates
    const unsub = subscribeCallById(activeCallId, (updated) => {
      if (updated) {
        setCallSession(updated);
        if (updated.status === 'connected' && (!callSession || callSession.status !== 'connected')) {
          callAudio.stopOutgoingRing();
          callAudio.playConnectedSound();
        }
        if (updated.status === 'ended' || updated.status === 'rejected') {
          callAudio.stopOutgoingRing();
          callAudio.playEndedSound();
        }
      }
    });

    return () => {
      unsub();
      callAudio.stopOutgoingRing();
      if (webrtcRef.current) {
        webrtcRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [patient.id]);

  // Start Doctor WebRTC
  const startCallAsDoctor = async (roomId: string, sessionData: VideoCallSession) => {
    callAudio.playOutgoingRing();
    setMediaError(null);

    try {
      const webrtc = new WebRTCConnection(roomId, 'caller');
      webrtcRef.current = webrtc;

      // 1. Get Doctor's Camera & Mic
      const stream = await webrtc.startLocalMedia(true, true, 'user');
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Listen for Patient's remote stream
      webrtc.onRemoteStream((remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(() => {});
        }
      });

      webrtc.onConnectionStateChange((state) => {
        setConnectionState(state);
      });

      // 3. Create WebRTC Offer & publish to Firestore
      await webrtc.initiateCallOffer(sessionData);
    } catch (err: any) {
      console.error('Error initiating doctor video call:', err);
      setMediaError('ไม่สามารถเปิดกล้องหรือไมโครโฟนได้ กรุณาตรวจสอบสิทธิ์การใช้งานของเบราว์เซอร์');
    }
  };

  // Timer Effect
  useEffect(() => {
    if (callSession?.status === 'connected') {
      callAudio.stopOutgoingRing();
      const startTime = callSession.startedAt ? new Date(callSession.startedAt).getTime() : Date.now();
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTime) / 1000);
        setCallDuration(Math.max(0, secs));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callSession?.status]);

  // Toggle Mute
  const handleToggleMute = () => {
    if (webrtcRef.current) {
      const newState = !isMuted;
      webrtcRef.current.toggleAudio(!newState);
      setIsMuted(newState);
    }
  };

  // Toggle Video
  const handleToggleVideo = () => {
    if (webrtcRef.current) {
      const newState = !isVideoOff;
      webrtcRef.current.toggleVideo(!newState);
      setIsVideoOff(newState);
    }
  };

  // Screen Share
  const handleToggleScreenShare = async () => {
    if (!webrtcRef.current) return;
    if (!isScreenSharing) {
      const success = await webrtcRef.current.startScreenShare();
      setIsScreenSharing(success);
    } else {
      await webrtcRef.current.stopScreenShare();
      setIsScreenSharing(false);
    }
  };

  // Capture Photo Snapshot of Patient
  const handleCaptureSnapshot = () => {
    if (!remoteVideoRef.current) return;
    try {
      const video = remoteVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhoto(dataUrl);
        onShowToast('ถ่ายภาพบันทึกหน้าจอคนไข้เรียบร้อยแล้ว');
      }
    } catch (e) {
      console.warn('Snapshot failed:', e);
    }
  };

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !callId) return;

    const newMsg: CallChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'doctor',
      senderName: currentUser.fullName,
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    await addCallMessage(callId, newMsg);
    setChatInput('');
  };

  // Copy Link
  const handleCopyLink = () => {
    const url = getPatientCallUrl(callId);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    onShowToast('คัดลอกลิงก์ห้องวิดีโอคอลสำหรับคนไข้แล้ว');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Send via LINE
  const handleSendViaLine = () => {
    if (onOpenLineSendModal && patient) {
      const url = getPatientCallUrl(callId);
      const msg = `🏥 โรงพยาบาลโพนนาแก้ว\nเรียน คุณ${patient.prefix}${patient.firstName} ${patient.lastName} (HN: ${patient.hn})\n\nแพทย์/เจ้าหน้าที่ขอนัดหมายวิดีโอคอลปรึกษาอาการและติดตามการกินยา (Telemedicine)\nโปรดกดลิงก์ด้านล่างเพื่อคุยกับคุณหมอทันที:\n👉 ${url}`;
      onOpenLineSendModal(patient, msg);
    }
  };

  // Native Web Share
  const handleNativeShare = () => {
    const url = getPatientCallUrl(callId);
    if (navigator.share) {
      navigator.share({
        title: `วิดีโอคอลพบแพทย์ รพ.โพนนาแก้ว - คุณ${patient.firstName}`,
        text: `ลิงก์วิดีโอคอลพบแพทย์ โรงพยาบาลโพนนาแก้ว สำหรับคุณ${patient.firstName} ${patient.lastName}`,
        url: url
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  // End Call & Save Notes
  const handleEndCall = async () => {
    callAudio.stopOutgoingRing();
    callAudio.playEndedSound();

    if (webrtcRef.current) {
      webrtcRef.current.close();
    }

    setIsSavingNotes(true);

    const fullNotes = `[Telemedicine Video Call]\n- การกินยา: ${evalDotsTaken ? 'กินยาสม่ำเสมอทุกวัน' : 'มีลืมกินยา'}\n- อาการตับอักเสบ/ตาเหลือง: ${evalNoJaundice ? 'ไม่มี (ปกติ)' : 'มีอาการสงสัยตับอักเสบ'}\n- ผื่นแพ้ยา: ${evalNoRash ? 'ไม่มีผื่น' : 'มีผื่นคัน'}\n- อาการไอ: ${evalCoughBetter ? 'ไอลดลง' : 'ยังไอมาก'}\n\nบันทึกเพิ่มเติม:\n${doctorNotes}\n\nคำแนะนำ/ยา:\n${prescriptions}`;

    await updateCallStatus(callId, 'ended', {
      endedAt: new Date().toISOString(),
      durationSeconds: callDuration,
      doctorNotes: fullNotes,
      prescriptionsOrAdvice: prescriptions,
      vitalSummary: {
        cough: evalCoughBetter ? 'ไอลดลง' : 'ยังไอมาก',
        fever: false,
        sideEffectsSummary: [
          evalNoJaundice ? 'ไม่มีตาเหลือง' : 'สงสัยตับอักเสบ',
          evalNoRash ? 'ไม่มีผื่น' : 'มีผื่นคัน'
        ],
        adherence: evalDotsTaken ? '100% ตรงเวลา' : 'ขาดบางมื้อ'
      }
    });

    // Auto-save as Home Visit / Tele-monitoring record if checked
    if (saveAsHomeVisit && patient) {
      const visitRecord: HomeVisitRecord = {
        id: `VISIT-TELE-${Date.now()}`,
        patientId: patient.id,
        patientName: `${patient.prefix}${patient.firstName} ${patient.lastName}`,
        patientHN: patient.hn,
        subdistrict: patient.subdistrict,
        village: patient.village,
        houseNo: patient.houseNo || '-',
        visitRound: 1,
        visitRoundType: 'ติดตามต่อเนื่อง',
        visitDate: new Date().toISOString().split('T')[0],
        visitorName: currentUser.fullName,
        visitorRole: currentUser.role === 'Admin' ? 'แพทย์/เภสัชกร' : 'พยาบาลวิชาชีพ',
        visitorUnit: 'โรงพยาบาลโพนนาแก้ว',
        visitorPhone: currentUser.phone || '',
        objectives: {
          dotsFollowUp: true,
          adrScreening: true,
          sputumFollowUp: false,
          contactScreening: false,
          environmentCheck: false,
          healthEducation: true,
          psychosocialSupport: true,
          missedAppointment: false
        },
        vitals: {},
        symptoms: {
          cough: evalCoughBetter ? 'ไอเล็กน้อย (ลดลง)' : 'ไอมาก/เรื้อรัง',
          fever: false,
          nightSweats: false,
          dyspnea: false,
          chestPain: false,
          fatigue: false,
          appetite: 'ปกติ/เจริญอาหาร'
        },
        dotsSupervisor: {
          type: 'V-DOT',
          name: patient.dotsSupervisorName || currentUser.fullName,
          isSupervisingDaily: evalDotsTaken
        },
        adherence: evalDotsTaken ? 'รับประทานยาทุกวัน สม่ำเสมอ 100%' : 'ลืมกินยา 1-2 วัน/สัปดาห์',
        pillCountStatus: 'จำนวนเม็ดยาคงเหลือถูกต้องตรงรอบ',
        missedDosesLast2Weeks: evalDotsTaken ? 0 : 2,
        sideEffects: {
          nauseaVomiting: false,
          orangeUrineAcknowledged: true,
          jointPain: false,
          numbness: false,
          itchingRash: !evalNoRash,
          jaundice: !evalNoJaundice,
          visionBlur: false,
          tinnitusDizziness: false,
          feverDrugReaction: false
        },
        environment: {
          ventilation: 'ดีมาก (โปร่ง แดดส่อง ลมถ่ายเทดี)',
          bedroomType: 'แยกห้องนอนเดี่ยว',
          sunlightExposure: 'แดดส่องถึงห้องพัก',
          sputumDisposalMethod: 'กระโถน/ถุงทิ้งมิดชิดผสมน้ำยาฆ่าเชื้อ',
          maskWearingCompliance: 'สวมหน้ากากสม่ำเสมอเมื่อมีคนอยู่ใกล้'
        },
        psychosocial: {
          familySupport: 'ครอบครัวดูแลและให้กำลังใจดีมาก',
          financialDifficulty: false,
          foodAidNeeded: false,
          stressAnxietyLevel: 'ปกติ'
        },
        sputumFollowUpDone: false,
        identifiedProblems: [
          ...(evalDotsTaken ? [] : ['กินยาไม่สม่ำเสมอ']),
          ...(evalNoJaundice ? [] : ['มีอาการตาเหลือง/สงสัยตับอักเสบ']),
          ...(evalNoRash ? [] : ['มีผื่นคันจากยา'])
        ],
        interventionsProvided: [
          'ตรวจประเมินอาการและติดตามการกินยาผ่านระบบ Telehealth Video Call',
          'ให้คำแนะนำการปฏิบัติตัวและสังเกตอาการผิดปกติ'
        ],
        evaluatedSymptoms: {
          cough: !evalCoughBetter,
          productiveCough: false,
          hemoptysis: false,
          fever: false,
          nightSweats: false,
          weightLoss: false,
          lossOfAppetite: false,
          dyspnea: false,
          noAbnormalSymptoms: evalCoughBetter
        },
        adverseDrugReactionsOfficial: {
          nauseaVomiting: false,
          itchingRash: !evalNoRash,
          jaundice: !evalNoJaundice,
          peripheralNeuropathy: false,
          blurredVision: false,
          tinnitusHearingLoss: false
        },
        adherenceEvaluation: evalDotsTaken ? 'ดีมาก (รับประทานยาครบ ≥95%)' : 'ปานกลาง (50–79%)',
        overallEvaluationOutcome: evalDotsTaken ? 'รับประทานยาต่อเนื่องดี' : 'มีความเสี่ยงต่อการขาดยา',
        clinicalActionTaken: 'ตรวจประเมินและให้คำปรึกษาผ่านระบบ Telehealth Video Call รพ.โพนนาแก้ว',
        problemsFound: evalNoJaundice ? '' : 'มีอาการสงสัยตับอักเสบ/ตาเหลือง',
        assistancePlan: 'ติดตามอาการต่อเนื่อง และประสานทีมพี่เลี้ยง V-DOT',
        recommendationsAndNotes: fullNotes,
        referralRequired: !evalNoJaundice,
        status: 'เยี่ยมสำเร็จ (ปกติ)',
        photos: capturedPhoto ? [capturedPhoto] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveHomeVisitToFirestore(visitRecord);
      onShowToast('บันทึกผลการปรึกษาทางไกลลงประวัติการติดตามเรียบร้อยแล้ว');
    }

    setIsSavingNotes(false);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const patientLink = getPatientCallUrl(callId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 font-['Prompt',sans-serif] overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-6xl h-[94vh] flex flex-col shadow-2xl overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">
                  ระบบพบแพทย์ออนไลน์ &bull; คุณ{patient.prefix}{patient.firstName} {patient.lastName}
                </h1>
                <span className="font-mono text-xs bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  HN: {patient.hn}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ตำบล{patient.subdistrict} ({patient.village}) &bull; สูตรยา: <span className="text-amber-300 font-bold">{patient.regimen || '2HRZE/4HR'}</span> &bull; ผู้โทร: {currentUser.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {callSession?.status === 'connected' ? (
              <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>กำลังสนทนา ({formatTimer(callDuration)})</span>
              </div>
            ) : callSession?.status === 'ended' ? (
              <div className="bg-slate-800 border border-slate-600 px-3 py-1.5 rounded-full text-xs font-bold text-slate-300">
                สนทนาเสร็จสิ้น
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/50 px-3 py-1.5 rounded-full text-xs font-bold text-amber-300 animate-pulse">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>รอคนไข้กดรับสาย...</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Share Link Banner for Patient */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-950/80 via-slate-800 to-teal-950/80 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 truncate max-w-md">
            <span className="text-emerald-400 font-bold flex items-center gap-1 shrink-0">
              <Share2 className="w-3.5 h-3.5" />
              <span>ลิงก์ให้คนไข้กดรับสาย:</span>
            </span>
            <input
              type="text"
              readOnly
              value={patientLink}
              className="bg-black/40 text-slate-300 font-mono text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 truncate w-60 sm:w-80 select-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm ${
                copiedLink ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
            </button>

            {onOpenLineSendModal && (
              <button
                type="button"
                onClick={handleSendViaLine}
                className="px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <span>ส่งผ่าน LINE Notify</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNativeShare}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 transition"
              title="แชร์ลิงก์"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 transition"
              title="แสดง QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* QR Code Overlay Dropdown */}
        {showQrCode && (
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-center gap-6 animate-fade-in">
            <div className="bg-white p-3 rounded-2xl shadow-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(patientLink)}`}
                alt="QR Code For Patient"
                className="w-36 h-36"
              />
            </div>
            <div className="space-y-2 text-xs max-w-sm">
              <h3 className="font-bold text-white text-sm">สแกน QR Code เพื่อรับสายวิดีโอคอล</h3>
              <p className="text-slate-300 leading-relaxed">
                ให้คนไข้หรือญาติใช้กล้องโทรศัพท์มือถือ หรือแอปพลิเคชัน LINE สแกน QR Code นี้เพื่อเปิดหน้าต่างรับสายคุยกับแพทย์ได้ทันที
              </p>
              <button
                onClick={() => setShowQrCode(false)}
                className="text-[11px] text-emerald-400 hover:underline font-bold"
              >
                ปิด QR Code
              </button>
            </div>
          </div>
        )}

        {/* Main Content Split (Video on Left, Doctor Clinical Console on Right) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* Left: Video Streaming Viewport */}
          <div className="flex-1 bg-black flex flex-col items-center justify-center relative overflow-hidden">
            
            {/* Remote Video of Patient */}
            <div className="w-full h-full flex items-center justify-center relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover sm:object-contain"
              />

              {/* Waiting patient placeholder overlay */}
              {(!callSession || callSession.status !== 'connected') && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-950/60 rounded-full border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse">
                    <PhoneCall className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">กำลังรอคุณ{patient.firstName}กดรับสายผ่านลิงก์...</h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      กรุณาส่งลิงก์หรือ QR Code ด้านบนให้แก่คนไข้ เมื่อคนไข้กดรับสาย วิดีโอและเสียงจะเชื่อมต่ออัตโนมัติ
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg"
                    >
                      <Copy className="w-4 h-4" />
                      <span>คัดลอกลิงก์ส่งให้คนไข้</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Doctor PiP Local Camera */}
              <div className="absolute top-4 right-4 z-20 w-32 h-44 sm:w-40 sm:h-52 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 bg-slate-900">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {isVideoOff && (
                  <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-400">
                    <VideoOff className="w-6 h-6 mb-1" />
                    <span className="text-[9px]">ปิดกล้องอยู่</span>
                  </div>
                )}
                <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] text-white">
                  กล้องคุณหมอ
                </div>
              </div>

              {/* Chat Overlay Drawer */}
              {showChat && (
                <div className="absolute inset-y-0 right-0 z-30 w-72 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 flex flex-col shadow-2xl animate-fade-in">
                  <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>ข้อความระหว่างสนทนา</span>
                    </span>
                    <button
                      onClick={() => setShowChat(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      ปิด
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {(!callSession?.messages || callSession.messages.length === 0) ? (
                      <div className="h-full flex items-center justify-center text-center text-xs text-slate-500">
                        ยังไม่มีข้อความ
                      </div>
                    ) : (
                      callSession.messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex flex-col ${m.sender === 'doctor' ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[10px] text-slate-400 mb-0.5">
                            {m.senderName} ({m.timestamp})
                          </span>
                          <div
                            className={`p-2.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                              m.sender === 'doctor'
                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                : 'bg-slate-800 text-white rounded-tl-none border border-slate-700'
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-700 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="พิมพ์ข้อความถึงคนไข้..."
                      className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

            </div>

            {/* Video Controls Bar */}
            <div className="p-3 bg-slate-900/90 border-t border-slate-800 w-full flex items-center justify-center gap-3">
              
              {/* Mic Mute */}
              <button
                type="button"
                onClick={handleToggleMute}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-md ${
                  isMuted ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
                title={isMuted ? 'เปิดไมโครโฟน' : 'ปิดไมโครโฟน'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Toggle */}
              <button
                type="button"
                onClick={handleToggleVideo}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-md ${
                  isVideoOff ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
                title={isVideoOff ? 'เปิดกล้อง' : 'ปิดกล้อง'}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
              </button>

              {/* Screen Share */}
              <button
                type="button"
                onClick={handleToggleScreenShare}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-md ${
                  isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
                title="แชร์หน้าจอ (ฟิล์ม X-ray/ภาพคำแนะนำยา)"
              >
                <Monitor className="w-5 h-5" />
              </button>

              {/* Snapshot Photo of Patient */}
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center transition shadow-md"
                title="บันทึกภาพถ่ายคนไข้/เม็ดยา"
              >
                <Camera className="w-5 h-5" />
              </button>

              {/* Chat Toggle */}
              <button
                type="button"
                onClick={() => setShowChat(!showChat)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-md ${
                  showChat ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
                title="ข้อความแชท"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              {/* End Call Button */}
              <button
                type="button"
                onClick={handleEndCall}
                className="px-5 h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full flex items-center gap-2 shadow-xl transition active:scale-95 ml-2"
                title="วางสายและบันทึกผล"
              >
                <PhoneOff className="w-4 h-4" />
                <span>วางสาย & บันทึก</span>
              </button>

            </div>

          </div>

          {/* Right: Doctor Clinical Console & Consultation Notes */}
          <div className="w-full lg:w-96 bg-slate-850 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-full overflow-y-auto p-4 space-y-4 bg-slate-900">
            
            {/* Patient Clinical Status Badge */}
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">ข้อมูลการรักษาปัจจุบัน</span>
                <span className="text-[11px] text-slate-400">อายุ {patient.age} ปี ({patient.gender})</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">ชนิดวัณโรค:</span>
                  <span className="font-bold text-white">{patient.tbType}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">พี่เลี้ยง DOTS:</span>
                  <span className="font-bold text-white truncate block">{patient.dotsSupervisorName || 'อสม.'}</span>
                </div>
              </div>
            </div>

            {/* Telehealth Clinical Assessment Checklist */}
            <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700 space-y-2.5">
              <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>ประเมินอาการทางคลินิก (Quick Checklist)</span>
              </h3>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evalDotsTaken}
                    onChange={(e) => setEvalDotsTaken(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-900 border-slate-600"
                  />
                  <span className="text-slate-200">กินยาสม่ำเสมอทุกวันตามแพทย์สั่ง</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evalNoJaundice}
                    onChange={(e) => setEvalNoJaundice(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-900 border-slate-600"
                  />
                  <span className="text-slate-200">ไม่มีตาเหลือง ตัวเหลือง (ไม่มีตับอักเสบ)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evalNoRash}
                    onChange={(e) => setEvalNoRash(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-900 border-slate-600"
                  />
                  <span className="text-slate-200">ไม่มีผื่นคันแพ้ยา</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evalCoughBetter}
                    onChange={(e) => setEvalCoughBetter(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-900 border-slate-600"
                  />
                  <span className="text-slate-200">อาการไอดีขึ้น/ลดลง</span>
                </label>
              </div>
            </div>

            {/* Captured Snapshot Thumbnail if any */}
            {capturedPhoto && (
              <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>ภาพถ่ายบันทึกเวชระเบียน</span>
                  <button
                    onClick={() => setCapturedPhoto(null)}
                    className="text-[10px] text-red-400 hover:underline"
                  >
                    ลบภาพ
                  </button>
                </div>
                <img
                  src={capturedPhoto}
                  alt="Captured snapshot"
                  className="w-full h-28 object-cover rounded-xl border border-slate-700"
                />
              </div>
            )}

            {/* Doctor's Consultation Notes */}
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>บันทึกผลการปรึกษา & คำวินิจฉัย:</span>
              </label>
              <textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="ระบุอาการ ผลการตรวจเม็ดยา หรือข้อสังเกตเพิ่มเติม..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none"
              />
            </div>

            {/* Doctor's Prescriptions / Advice to Patient */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                คำแนะนำและแผนการดูแลให้คนไข้:
              </label>
              <textarea
                value={prescriptions}
                onChange={(e) => setPrescriptions(e.target.value)}
                placeholder="ระบุคำแนะนำการกินยา วันนัดตรวจเสมหะรอบถัดไป..."
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none"
              />
            </div>

            {/* Auto-save to Home Visit Toggle */}
            <div className="p-3 bg-emerald-950/40 rounded-2xl border border-emerald-500/30">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={saveAsHomeVisit}
                  onChange={(e) => setSaveAsHomeVisit(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-900 border-emerald-500"
                />
                <span className="text-emerald-300 font-bold">
                  บันทึกประวัติการปรึกษาลงใน "ระบบติดตาม/เยี่ยมบ้าน" อัตโนมัติ
                </span>
              </label>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
