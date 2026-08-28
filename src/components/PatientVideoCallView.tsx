import React, { useEffect, useRef, useState } from 'react';
import { 
  VideoCallSession, 
  CallChatMessage, 
  CallParticipant 
} from '../types';
import { 
  subscribeCallById, 
  saveCallSessionToFirestore,
  updateCallStatus, 
  addCallMessage 
} from '../services/firebaseStore';
import { 
  MultiPeerWebRTCManager, 
  RemoteParticipantStream,
  NetworkStatsInfo,
  NetworkQuality,
  VideoQualityMode
} from '../services/multiPeerWebRTC';
import { VideoConferenceGrid } from './VideoConferenceGrid';
import { callAudio } from '../utils/callAudio';
import { 
  Phone, PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, 
  SwitchCamera, MessageSquare, Send, HeartPulse, Building2, 
  ShieldCheck, AlertCircle, CheckCircle2, Check,
  Users, Volume2, User, UserCheck, Stethoscope,
  Wifi, WifiOff, Zap, RefreshCw
} from 'lucide-react';

interface PatientVideoCallViewProps {
  callId: string;
  onExit?: () => void;
}

export const PatientVideoCallView: React.FC<PatientVideoCallViewProps> = ({
  callId,
  onExit
}) => {
  const [callSession, setCallSession] = useState<VideoCallSession | null>(null);
  const [hasStartedMedia, setHasStartedMedia] = useState<boolean>(false);
  const [isAttemptingMedia, setIsAttemptingMedia] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);

  // Participant Identity
  const [guestPeerId] = useState<string>(() => `peer_guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
  const [participantRole, setParticipantRole] = useState<'patient' | 'relative' | 'vdot' | 'nurse'>('patient');
  const [participantName, setParticipantName] = useState<string>('');
  const [showIdentitySelector, setShowIdentitySelector] = useState<boolean>(false);

  // Multi-Peer State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteParticipantStream[]>([]);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [showParticipantsList, setShowParticipantsList] = useState<boolean>(false);
  
  // Media Controls
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [showChat, setShowChat] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Network Resilience & Low-Bandwidth State
  const [qualityMode, setQualityMode] = useState<VideoQualityMode>('balanced');
  const [networkStats, setNetworkStats] = useState<NetworkStatsInfo>({
    quality: 'good',
    rttMs: 50,
    packetLossPercent: 0,
    bitrateKbps: 350,
    isLowBandwidthMode: false
  });
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // References
  const webrtcManagerRef = useRef<MultiPeerWebRTCManager | null>(null);
  const timerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'patient': return 'ผู้ป่วย (คนไข้)';
      case 'relative': return 'ญาติ / ผู้ดูแล';
      case 'vdot': return 'อสม. พี่เลี้ยง TB';
      case 'nurse': return 'พยาบาล / เจ้าหน้าที่';
      default: return 'ผู้รับบริการ';
    }
  };

  // 1. Subscribe to Firestore Call and Auto-Initialize
  useEffect(() => {
    const unsub = subscribeCallById(callId, async (session) => {
      if (session) {
        setCallSession(session);
        if (!participantName) {
          setParticipantName(session.patientName || 'ผู้รับบริการ');
        }
        if (session.status === 'ended' || session.status === 'rejected') {
          callAudio.stopIncomingRingtone();
          callAudio.playEndedSound();
          if (webrtcManagerRef.current) {
            webrtcManagerRef.current.leaveRoom();
          }
        }
      } else {
        // If no call doc exists, create a default room session
        const defaultSession: VideoCallSession = {
          id: callId,
          patientId: callId,
          patientName: 'ผู้รับบริการ (คนไข้)',
          patientHN: callId.startsWith('CALL-') ? 'ทั่วไป' : callId,
          callerId: 'doctor-staff',
          callerName: 'แพทย์/พยาบาล รพ.โพนนาแก้ว',
          callerRole: 'ทีมแพทย์ รพ.โพนนาแก้ว',
          hospitalName: 'โรงพยาบาลโพนนาแก้ว',
          status: 'waiting',
          createdAt: new Date().toISOString(),
          reason: 'ปรึกษาแพทย์ทางไกล & ติดตามการรักษา TB-Care'
        };
        setCallSession(defaultSession);
        setParticipantName(defaultSession.patientName);
        await saveCallSessionToFirestore(defaultSession);
      }
    });

    // Auto-start camera and join room
    startMultiPeerMediaAndJoin();

    return () => {
      unsub();
      callAudio.stopIncomingRingtone();
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.leaveRoom();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callId]);

  // Unlock Audio on user touch / click
  const handleUserInteraction = () => {
    if (!audioUnlocked) {
      setAudioUnlocked(true);
    }
  };

  // Start Multi-Peer Media and connect
  const startMultiPeerMediaAndJoin = async () => {
    if (isAttemptingMedia) return;
    setIsAttemptingMedia(true);
    setMediaError(null);

    const initialParticipant: CallParticipant = {
      peerId: guestPeerId,
      name: participantName || callSession?.patientName || 'ผู้รับบริการ',
      role: participantRole,
      roleTitle: getRoleTitle(participantRole),
      joinedAt: new Date().toISOString()
    };

    try {
      if (!webrtcManagerRef.current) {
        const manager = new MultiPeerWebRTCManager(callId, initialParticipant);
        webrtcManagerRef.current = manager;

        manager.onRemoteStreamsChange((streams) => {
          setRemoteStreams([...streams]);
          if (streams.length > 0) {
            callAudio.stopIncomingRingtone();
            callAudio.playConnectedSound();
            updateCallStatus(callId, 'connected');
          }
        });

        manager.onParticipantsChange((participantList) => {
          setParticipants([...participantList]);
        });

        // Real-time Network Telemetry & Quality Listener
        manager.onNetworkQualityChange((stats) => {
          setNetworkStats(stats);
          if (stats.quality === 'poor') {
            showToast('⚠️ สัญญาณเน็ตอ่อน ระบบกำลังปรับเป็นโหมดประหยัดข้อมูลให้อัตโนมัติ');
          }
        });
      }

      // Start local camera/mic with balanced quality
      const stream = await webrtcManagerRef.current.startLocalMedia(true, true, facingMode, qualityMode);
      setLocalStream(stream);
      setHasStartedMedia(true);

      // Join room signaling
      await webrtcManagerRef.current.joinRoom();
    } catch (err: any) {
      console.warn('Auto-start media failed, waiting for user tap:', err);
      setMediaError('กรุณากดปุ่ม "เปิดกล้องและไมค์" เพื่อเริ่มการสนทนากับแพทย์');
    } finally {
      setIsAttemptingMedia(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle Low-Bandwidth Mode
  const handleToggleLowBandwidthMode = async () => {
    if (!webrtcManagerRef.current) return;
    const newMode: VideoQualityMode = qualityMode === 'low' ? 'balanced' : 'low';
    setQualityMode(newMode);
    await webrtcManagerRef.current.setQualityMode(newMode);
    showToast(newMode === 'low' ? '⚡ เปิดโหมดเน็ตช้า (ลดความละเอียดเพื่อความเสถียร)' : '📶 กลับสู่โหมดคุณภาพปกติ');
  };

  // Toggle Audio-Only Mode for saving 100% video bandwidth
  const handleToggleAudioOnly = async () => {
    if (!webrtcManagerRef.current) return;
    const isNowAudioOnly = await webrtcManagerRef.current.toggleAudioOnlyMode();
    setIsVideoOff(isNowAudioOnly);
    showToast(isNowAudioOnly ? '🎙️ เปิดโหมดเสียงอย่างเดียว (ประหยัดเน็ตสูงสุด)' : '📹 เปิดกล้องวิดีโอ');
  };

  // 1-Click Reconnect (Active ICE Restart)
  const handleManualReconnect = async () => {
    if (!webrtcManagerRef.current || isReconnecting) return;
    setIsReconnecting(true);
    showToast('🔄 กำลังกู้คืนสัญญาณและต่อสายใหม่...');
    await webrtcManagerRef.current.reconnectAllPeers();
    setTimeout(() => {
      setIsReconnecting(false);
      showToast('✅ เชื่อมต่อสัญญาณใหม่เรียบร้อยแล้ว');
    }, 2000);
  };

  // Update Identity (e.g. if user is actually a relative or VDOT)
  const handleChangeIdentity = async (newRole: 'patient' | 'relative' | 'vdot' | 'nurse', newName: string) => {
    setParticipantRole(newRole);
    setParticipantName(newName);
    setShowIdentitySelector(false);

    if (webrtcManagerRef.current) {
      const updatedParticipant: CallParticipant = {
        peerId: guestPeerId,
        name: newName || getRoleTitle(newRole),
        role: newRole,
        roleTitle: getRoleTitle(newRole),
        joinedAt: new Date().toISOString()
      };
      // Leave & re-join with updated identity
      await webrtcManagerRef.current.leaveRoom();
      const manager = new MultiPeerWebRTCManager(callId, updatedParticipant);
      webrtcManagerRef.current = manager;

      manager.onRemoteStreamsChange((streams) => setRemoteStreams([...streams]));
      manager.onParticipantsChange((pList) => setParticipants([...pList]));

      const stream = await manager.startLocalMedia(!isVideoOff, !isMuted, facingMode);
      setLocalStream(stream);
      await manager.joinRoom();
    }
  };

  // Call Timer
  useEffect(() => {
    const isConnected = remoteStreams.length > 0 || callSession?.status === 'connected';
    if (isConnected) {
      const startTime = callSession?.startedAt ? new Date(callSession.startedAt).getTime() : Date.now();
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
  }, [remoteStreams.length, callSession?.status]);

  // Toggle Mute
  const handleToggleMute = () => {
    if (webrtcManagerRef.current) {
      const newState = !isMuted;
      webrtcManagerRef.current.toggleAudio(!newState);
      setIsMuted(newState);
    }
  };

  // Toggle Camera
  const handleToggleVideo = () => {
    if (webrtcManagerRef.current) {
      const newState = !isVideoOff;
      webrtcManagerRef.current.toggleVideo(!newState);
      setIsVideoOff(newState);
    }
  };

  // Switch Front/Back Camera
  const handleSwitchCamera = async () => {
    if (webrtcManagerRef.current) {
      const newMode = await webrtcManagerRef.current.switchCamera();
      setFacingMode(newMode);
      const stream = webrtcManagerRef.current.getLocalStream();
      setLocalStream(stream);
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newMsg: CallChatMessage = {
      id: `msg-${Date.now()}`,
      sender: participantRole,
      senderName: participantName || getRoleTitle(participantRole),
      text: chatMessage.trim(),
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    await addCallMessage(callId, newMsg);
    setChatMessage('');
  };

  // End Call
  const handleEndCall = async () => {
    callAudio.stopIncomingRingtone();
    callAudio.playEndedSound();
    if (webrtcManagerRef.current) {
      await webrtcManagerRef.current.leaveRoom();
    }
    // If last participant or patient leaves
    if (remoteStreams.length <= 1) {
      await updateCallStatus(callId, 'ended', {
        endedAt: new Date().toISOString(),
        durationSeconds: callDuration
      });
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentLocalParticipant: CallParticipant = {
    peerId: guestPeerId,
    name: participantName || 'ผู้รับบริการ',
    role: participantRole,
    roleTitle: getRoleTitle(participantRole),
    joinedAt: new Date().toISOString()
  };

  const totalInCall = remoteStreams.length + 1;

  // 1. Call Ended Screen
  if (callSession?.status === 'ended' || callSession?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-['Prompt',sans-serif]">
        <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl border border-slate-200 animate-fade-in">
          
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md border-4 border-emerald-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900">การปรึกษาแพทย์เสร็จสิ้น</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              ขอบคุณที่ร่วมสนทนากับทีมแพทย์/พยาบาล โรงพยาบาลโพนนาแก้ว
            </p>
            {callDuration > 0 && (
              <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 py-1 px-3 rounded-full inline-block">
                ระยะเวลาสนทนา: {formatTimer(callDuration)} นาที
              </p>
            )}
          </div>

          {/* Doctor Advice if present */}
          {callSession?.prescriptionsOrAdvice && (
            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-left text-xs text-teal-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-teal-900">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                <span>คำแนะนำจากแพทย์:</span>
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {callSession.prescriptionsOrAdvice}
              </p>
            </div>
          )}

          {/* Health reminder */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs text-slate-700 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>คำแนะนำสำคัญสำหรับผู้ป่วยวัณโรค</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1">
              <li>รับประทานยาอย่างต่อเนื่องทุกวัน ห้ามหยุดยาเองเด็ดขาด</li>
              <li>หากมีอาการตาเหลือง ตัวเหลือง หรือผื่นขึ้น ให้รีบมาพบแพทย์ทันที</li>
              <li>สวมหน้ากากอนามัยเมื่ออยู่ร่วมกับผู้อื่น และเปิดหน้าต่างให้อากาศถ่ายเท</li>
            </ul>
          </div>

          <div className="pt-2 text-xs text-slate-500">
            มีข้อสงสัยหรือเหตุฉุกเฉิน โทร: <span className="font-bold text-slate-800">042-759045</span> (รพ.โพนนาแก้ว)
          </div>

          {onExit && (
            <button
              onClick={onExit}
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg transition"
            >
              ปิดหน้าต่างนี้
            </button>
          )}

        </div>
      </div>
    );
  }

  const isConnected = remoteStreams.length > 0 || callSession?.status === 'connected';

  // 2. Direct Live Multi-Party Room View
  return (
    <div 
      ref={containerRef}
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      className="fixed inset-0 z-50 bg-black text-white flex flex-col font-['Prompt',sans-serif] overflow-hidden select-none"
    >
      
      {/* Top Overlay Bar */}
      <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/90 via-black/50 to-transparent p-3 sm:p-4 flex items-center justify-between text-white pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/90 backdrop-blur-md flex items-center justify-center text-white font-bold shadow-md border border-white/20">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-tight flex items-center gap-2">
              <span>{callSession?.callerName || 'แพทย์/พยาบาล รพ.โพนนาแก้ว'}</span>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-normal border border-emerald-400/20">
                {callSession?.callerRole || 'แพทย์'}
              </span>
            </h2>
            <div className="text-[11px] text-slate-300 flex items-center gap-2">
              <span>โรงพยาบาลโพนนาแก้ว</span>
              <button
                onClick={() => setShowIdentitySelector(true)}
                className="text-[10px] text-emerald-400 underline hover:text-emerald-300 font-semibold"
              >
                (เปลี่ยนสถานะ: {getRoleTitle(participantRole)})
              </button>
            </div>
          </div>
        </div>

        {/* Live status badge, participants & Timer */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <button
              onClick={() => setShowParticipantsList(!showParticipantsList)}
              className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-mono font-bold text-emerald-300 transition"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>{totalInCall} คน ({formatTimer(callDuration)})</span>
            </button>
          ) : (
            <div className="bg-amber-950/80 border border-amber-500/40 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[11px] font-semibold">กำลังเชื่อมต่อ...</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Multi-Peer Video Grid Viewport */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
        
        <VideoConferenceGrid
          localStream={localStream}
          localParticipant={currentLocalParticipant}
          remoteStreams={remoteStreams}
          isLocalMuted={isMuted}
          isLocalVideoOff={isVideoOff}
          facingMode={facingMode}
        />

        {/* Placeholder if waiting for other participants */}
        {!isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-teal-950 text-slate-300 p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 shadow-xl">
              <Users className="w-10 h-10 text-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              ท่านเข้าสู่ห้องสนทนาเรียบร้อยแล้ว
            </h3>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              ระบบรองรับการเข้าสายพร้อมกันหลายคน (แพทย์, พยาบาล, คนไข้, อสม., ญาติ) เมื่อสมาชิกท่านอื่นเปิดกล้อง ภาพจะปรากฏขึ้นอัตโนมัติ
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>กล้องและไมค์ของท่านพร้อมสนทนาแล้ว</span>
            </div>
          </div>
        )}

        {/* Permission / Click to Start Overlay if blocked by browser */}
        {!hasStartedMedia && (
          <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-sm w-full bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <VideoIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">วิดีโอคอลพบแพทย์ รพ.โพนนาแก้ว</h3>
                <p className="text-xs text-slate-600">
                  กดปุ่มด้านล่างเพื่อเปิดกล้องและไมโครโฟน เริ่มสนทนากับแพทย์และทีมดูแลได้ทันที
                </p>
              </div>
              <button
                onClick={startMultiPeerMediaAndJoin}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5 animate-bounce" />
                <span>เปิดกล้อง & เข้าห้องสนทนาทันที</span>
              </button>
            </div>
          </div>
        )}

        {/* Change Identity Modal */}
        {showIdentitySelector && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>เลือกสถานะของผู้เข้าร่วมสาย</span>
                </h3>
                <button onClick={() => setShowIdentitySelector(false)} className="text-xs text-slate-400">ปิด</button>
              </div>
              <div className="space-y-2">
                {[
                  { id: 'patient', label: 'ผู้ป่วย (คนไข้)', icon: User, color: 'text-teal-400' },
                  { id: 'relative', label: 'ญาติ / ผู้ดูแลผู้ป่วย', icon: Users, color: 'text-cyan-400' },
                  { id: 'vdot', label: 'อสม. พี่เลี้ยงติดตามยา', icon: ShieldCheck, color: 'text-amber-400' },
                  { id: 'nurse', label: 'พยาบาล / เจ้าหน้าที่ รพ.สต.', icon: Stethoscope, color: 'text-blue-400' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleChangeIdentity(item.id as any, participantName)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                      participantRole === item.id 
                        ? 'bg-emerald-600 text-white border-emerald-500 font-bold' 
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {participantRole === item.id && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">ชื่อที่จะให้แสดงในห้องสนทนา:</label>
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="เช่น นายสมชาย, น้าแมว (อสม.)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={() => handleChangeIdentity(participantRole, participantName)}
                className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl transition"
              >
                ยืนยันข้อมูล
              </button>
            </div>
          </div>
        )}

        {/* Participants list drawer */}
        {showParticipantsList && (
          <div className="absolute inset-y-0 left-0 z-30 w-full sm:w-72 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl animate-fade-in">
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>ผู้ร่วมสายในห้อง ({totalInCall} คน)</span>
              </span>
              <button
                onClick={() => setShowParticipantsList(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                ปิด
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Local user */}
              <div className="p-2.5 bg-slate-800 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{currentLocalParticipant.name} (คุณ)</div>
                  <div className="text-[10px] text-emerald-400">{currentLocalParticipant.roleTitle}</div>
                </div>
                <div className="text-xs">
                  {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
              </div>
              {/* Remote participants */}
              {remoteStreams.map((r) => (
                <div key={r.peerId} className="p-2.5 bg-slate-800/80 rounded-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">{r.participant?.name || 'ผู้ร่วมสาย'}</div>
                    <div className="text-[10px] text-teal-400">{r.participant?.roleTitle || 'ผู้เข้าร่วม'}</div>
                  </div>
                  <div className="text-xs">
                    {r.isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat slide-over */}
        {showChat && (
          <div className="absolute inset-y-0 right-0 z-30 w-full sm:w-80 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl animate-fade-in">
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>ข้อความระหว่างสนทนา</span>
              </span>
              <button
                onClick={() => setShowChat(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                ปิด
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {(!callSession?.messages || callSession.messages.length === 0) ? (
                <div className="h-full flex items-center justify-center text-center text-xs text-slate-500 p-4">
                  สามารถพิมพ์ข้อความหรือคำถามส่งให้ทุกคนในห้องได้ที่นี่
                </div>
              ) : (
                callSession.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === participantRole ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-400 font-semibold mb-0.5">
                      {m.senderName} ({m.timestamp})
                    </span>
                    <div
                      className={`p-2.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                        m.sender === participantRole
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-slate-800 text-white rounded-tl-none border border-white/10'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-2.5 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="พิมพ์ข้อความถึงหมอและทุกคน..."
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

      {/* Bottom Floating Call Control Bar */}
      <div className="absolute bottom-6 inset-x-0 z-20 flex items-center justify-center px-4 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-2.5 sm:p-3 rounded-full flex items-center gap-2 sm:gap-4 shadow-2xl">
          
          {/* Mute Mic */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-md ${
              isMuted 
                ? 'bg-red-600 text-white' 
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isMuted ? 'เปิดไมโครโฟน' : 'ปิดไมโครโฟน'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video */}
          <button
            type="button"
            onClick={handleToggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-md ${
              isVideoOff 
                ? 'bg-red-600 text-white' 
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isVideoOff ? 'เปิดกล้อง' : 'ปิดกล้อง'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
          </button>

          {/* Switch Camera Front/Back */}
          <button
            type="button"
            onClick={handleSwitchCamera}
            className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition shadow-md"
            title="สลับกล้องหน้า/หลัง"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>

          {/* Participants list button */}
          <button
            type="button"
            onClick={() => setShowParticipantsList(!showParticipantsList)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-md ${
              showParticipantsList ? 'bg-teal-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title="รายชื่อผู้ร่วมสาย"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* Chat Toggle */}
          <button
            type="button"
            onClick={() => setShowChat(!showChat)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-md relative ${
              showChat ? 'bg-emerald-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title="ข้อความแชท"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            className="h-12 px-5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition active:scale-95"
            title="วางสาย"
          >
            <PhoneOff className="w-5 h-5" />
            <span>วางสาย</span>
          </button>

        </div>
      </div>

    </div>
  );
};
