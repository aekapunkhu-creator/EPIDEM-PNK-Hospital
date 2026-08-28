import React, { useEffect, useRef, useState } from 'react';
import { 
  VideoCallSession, 
  CallChatMessage 
} from '../types';
import { 
  subscribeCallById, 
  saveCallSessionToFirestore,
  updateCallStatus, 
  addCallMessage 
} from '../services/firebaseStore';
import { WebRTCConnection } from '../services/webrtcService';
import { callAudio } from '../utils/callAudio';
import { 
  Phone, PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, 
  SwitchCamera, MessageSquare, Send, HeartPulse, Building2, 
  ShieldCheck, AlertCircle, CheckCircle2,
  Users, Volume2
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
  const [connectionState, setConnectionState] = useState<string>('connecting');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  
  // Media Controls
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [showChat, setShowChat] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [mediaError, setMediaError] = useState<string | null>(null);

  // References
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const webrtcRef = useRef<WebRTCConnection | null>(null);
  const timerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize or Auto-create Call Session & Auto-start Media
  useEffect(() => {
    // 1. Subscribe to Firestore Call
    const unsub = subscribeCallById(callId, async (session) => {
      if (session) {
        setCallSession(session);
        if (session.status === 'ended' || session.status === 'rejected') {
          callAudio.stopIncomingRingtone();
          callAudio.playEndedSound();
          if (webrtcRef.current) {
            webrtcRef.current.close();
          }
        }
      } else {
        // If no call doc exists yet in Firestore, auto-create it so user never gets "not found"
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
        await saveCallSessionToFirestore(defaultSession);
      }
    });

    // 2. Auto-start camera and join room immediately
    startPatientMediaAndJoin();

    return () => {
      unsub();
      callAudio.stopIncomingRingtone();
      if (webrtcRef.current) {
        webrtcRef.current.close();
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
      if (remoteVideoRef.current) {
        remoteVideoRef.current.play().catch(() => {});
      }
    }
  };

  // Auto-start Patient Media and Peer connection
  const startPatientMediaAndJoin = async () => {
    if (isAttemptingMedia) return;
    setIsAttemptingMedia(true);
    setMediaError(null);

    try {
      if (!webrtcRef.current) {
        const webrtc = new WebRTCConnection(callId, 'callee');
        webrtcRef.current = webrtc;

        // Remote stream listener
        webrtc.onRemoteStream((remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch((e) => {
              console.log('Autoplay handled, will play on tap:', e);
            });
          }
        });

        // Connection State listener
        webrtc.onConnectionStateChange((state) => {
          setConnectionState(state);
          if (state === 'connected') {
            callAudio.stopIncomingRingtone();
            callAudio.playConnectedSound();
          }
        });
      }

      // Start local camera/mic
      const stream = await webrtcRef.current.startLocalMedia(true, true, facingMode);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      setHasStartedMedia(true);

      // Start answering / listening for doctor
      await webrtcRef.current.answerCall();
    } catch (err: any) {
      console.warn('Auto-start media failed, waiting for user click:', err);
      setMediaError('กรุณากดปุ่ม "เปิดกล้องและไมค์" เพื่อเริ่มการสนทนากับแพทย์');
    } finally {
      setIsAttemptingMedia(false);
    }
  };

  // Call Timer
  useEffect(() => {
    if (callSession?.status === 'connected' || connectionState === 'connected') {
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
  }, [callSession?.status, connectionState]);

  // Toggle Mute
  const handleToggleMute = () => {
    if (webrtcRef.current) {
      const newState = !isMuted;
      webrtcRef.current.toggleAudio(!newState);
      setIsMuted(newState);
    }
  };

  // Toggle Camera
  const handleToggleVideo = () => {
    if (webrtcRef.current) {
      const newState = !isVideoOff;
      webrtcRef.current.toggleVideo(!newState);
      setIsVideoOff(newState);
    }
  };

  // Switch Front/Back Camera
  const handleSwitchCamera = async () => {
    if (webrtcRef.current) {
      const newMode = await webrtcRef.current.switchCamera();
      setFacingMode(newMode);
      const stream = webrtcRef.current.getLocalStream();
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
      }
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newMsg: CallChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'patient',
      senderName: callSession?.patientName || 'คนไข้',
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
    if (webrtcRef.current) {
      webrtcRef.current.close();
    }
    await updateCallStatus(callId, 'ended', {
      endedAt: new Date().toISOString(),
      durationSeconds: callDuration
    });
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
              ขอบคุณที่ร่วมปรึกษาอาการกับทีมแพทย์/พยาบาล โรงพยาบาลโพนนาแก้ว
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

  const isConnected = connectionState === 'connected' || callSession?.status === 'connected';

  // 2. Direct Live Video Room View
  return (
    <div 
      ref={containerRef}
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      className="fixed inset-0 z-50 bg-black text-white flex flex-col font-['Prompt',sans-serif] overflow-hidden select-none"
    >
      
      {/* Top Overlay Bar */}
      <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/85 via-black/40 to-transparent p-4 flex items-center justify-between text-white pointer-events-auto">
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
            <p className="text-[11px] text-slate-300 flex items-center gap-2">
              <span>โรงพยาบาลโพนนาแก้ว</span>
              {callSession?.patientHN && callSession.patientHN !== 'ทั่วไป' && (
                <span>&bull; HN: {callSession.patientHN}</span>
              )}
            </p>
          </div>
        </div>

        {/* Live status badge & Timer */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-mono font-bold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{formatTimer(callDuration)}</span>
            </div>
          ) : (
            <div className="bg-amber-950/80 border border-amber-500/40 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[11px] font-semibold">กำลังรอแพทย์...</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Remote Video Viewport */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
        
        {/* Remote Doctor Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover sm:object-contain"
        />

        {/* Placeholder if doctor video is not yet streaming */}
        {!isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-teal-950 text-slate-300 p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 shadow-xl">
              <Users className="w-10 h-10 text-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              ท่านเข้าสู่ห้องสนทนาเรียบร้อยแล้ว
            </h3>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              ระบบกำลังเชื่อมต่อสัญญาณกับแพทย์ เมื่อแพทย์เปิดกล้อง ภาพและเสียงจะปรากฏขึ้นอัตโนมัติ
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>กล้องและไมค์ของท่านพร้อมสนทนาแล้ว</span>
            </div>
          </div>
        )}

        {/* Floating Self Camera View (Picture-in-Picture) */}
        <div className="absolute top-20 right-4 z-20 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 bg-slate-900">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-2 text-center">
              <VideoOff className="w-6 h-6 text-slate-500 mb-1" />
              <span className="text-[9px]">ปิดกล้องอยู่</span>
            </div>
          )}
          <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] text-white">
            ตัวท่าน
          </div>
        </div>

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
                  กดปุ่มด้านล่างเพื่อเปิดกล้องและไมโครโฟน เริ่มสนทนากับแพทย์ได้ทันที
                </p>
              </div>
              <button
                onClick={startPatientMediaAndJoin}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5 animate-bounce" />
                <span>เปิดกล้อง & สนทนากับหมอทันที</span>
              </button>
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
                  สามารถพิมพ์ข้อความหรือคำถามส่งให้แพทย์ได้ที่นี่
                </div>
              ) : (
                callSession.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'patient' ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-400 font-semibold mb-0.5">
                      {m.senderName} ({m.timestamp})
                    </span>
                    <div
                      className={`p-2.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                        m.sender === 'patient'
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
                placeholder="พิมพ์ข้อความถึงหมอ..."
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
