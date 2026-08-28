import React, { useEffect, useRef, useState } from 'react';
import { 
  VideoCallSession, 
  CallChatMessage, 
  Patient 
} from '../types';
import { 
  subscribeCallById, 
  updateCallStatus, 
  addCallMessage,
  fetchPatientByIdFromFirestore 
} from '../services/firebaseStore';
import { WebRTCConnection } from '../services/webrtcService';
import { callAudio } from '../utils/callAudio';
import { 
  Phone, PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, 
  SwitchCamera, MessageSquare, Send, HeartPulse, Building2, 
  ShieldCheck, AlertCircle, Sparkles, CheckCircle2, RefreshCw,
  PhoneCall, Users, Clock, Volume2
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
  const [loading, setLoading] = useState<boolean>(true);
  const [hasStartedMedia, setHasStartedMedia] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<string>('connecting');
  const [callDuration, setCallDuration] = useState<number>(0);
  
  // Media Controls
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [showChat, setShowChat] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // References
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const webrtcRef = useRef<WebRTCConnection | null>(null);
  const timerRef = useRef<any>(null);

  // 1. Subscribe to Call Session
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeCallById(callId, (session) => {
      setLoading(false);
      setCallSession(session);

      if (session) {
        // Manage ringtone on patient side if call is waiting/ringing and patient hasn't joined
        if (session.status === 'ringing' || session.status === 'waiting') {
          callAudio.playIncomingRingtone();
        } else {
          callAudio.stopIncomingRingtone();
        }

        if (session.status === 'ended' || session.status === 'rejected') {
          callAudio.stopIncomingRingtone();
          callAudio.playEndedSound();
          if (webrtcRef.current) {
            webrtcRef.current.close();
          }
        }
      }
    });

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

  // 2. Call Timer
  useEffect(() => {
    if (callSession?.status === 'connected') {
      callAudio.stopIncomingRingtone();
      callAudio.playConnectedSound();
      
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

  // Handle Patient Answers the Video Call
  const handleAnswerCall = async () => {
    callAudio.stopIncomingRingtone();
    setMediaError(null);

    try {
      const webrtc = new WebRTCConnection(callId, 'callee');
      webrtcRef.current = webrtc;

      // 1. Start Patient's Local Camera & Mic
      const stream = await webrtc.startLocalMedia(true, true, facingMode);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setHasStartedMedia(true);

      // 2. Listen for Doctor's remote stream
      webrtc.onRemoteStream((remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(() => {});
        }
      });

      webrtc.onConnectionStateChange((state) => {
        setConnectionState(state);
      });

      // 3. Connect WebRTC Answer
      await webrtc.answerCall();
    } catch (err: any) {
      console.error('Error starting patient video call:', err);
      setMediaError('ไม่สามารถเข้าถึงกล้องหรือไมโครโฟนได้ โปรดอนุญาตให้เบราว์เซอร์ใช้งานกล้องและไมโครโฟน');
    }
  };

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

  // Send In-Call Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !callSession) return;

    const newMsg: CallChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'patient',
      senderName: callSession.patientName || 'ผู้ป่วย',
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

  // Reject Call
  const handleRejectCall = async () => {
    callAudio.stopIncomingRingtone();
    await updateCallStatus(callId, 'rejected');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-['Prompt',sans-serif]">
        <div className="w-14 h-14 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">กำลังเชื่อมต่อระบบพบแพทย์ออนไลน์ รพ.โพนนาแก้ว...</p>
      </div>
    );
  }

  if (!callSession) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-['Prompt',sans-serif]">
        <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">ไม่พบห้องวิดีโอคอลนี้</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            ลิงก์ห้องสนทนานี้อาจหมดอายุ หรือถูกยกเลิกแล้ว หากต้องการพบแพทย์กรุณาติดต่อ โรงพยาบาลโพนนาแก้ว โทร. <span className="font-bold text-slate-900">042-759045</span>
          </p>
          {onExit && (
            <button
              onClick={onExit}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
            >
              กลับหน้าหลัก
            </button>
          )}
        </div>
      </div>
    );
  }

  // 1. Incoming Call / Pre-join Waiting Screen
  if (callSession.status === 'waiting' || callSession.status === 'ringing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-teal-950 text-white flex flex-col items-center justify-between p-6 sm:p-8 font-['Prompt',sans-serif]">
        
        {/* Top Header */}
        <div className="text-center space-y-1.5 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold border border-white/10">
            <Building2 className="w-3.5 h-3.5" />
            <span>โรงพยาบาลโพนนาแก้ว จ.สกลนคร</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-wide">
            ระบบวิดีโอคอลพบแพทย์ทางไกล (Telemedicine)
          </h1>
        </div>

        {/* Center Caller & Patient Card */}
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 text-center space-y-5 shadow-2xl animate-fade-in">
          
          {/* Animated Avatar / Ringing Indicator */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-25" />
            <div className="absolute inset-2 bg-emerald-400 rounded-full animate-pulse opacity-40" />
            <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-full flex items-center justify-center text-white shadow-xl border-2 border-white/40">
              <PhoneCall className="w-10 h-10 animate-bounce" />
            </div>
          </div>

          {/* Caller Details */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              {callSession.callerRole || 'แพทย์ประจำ รพ.โพนนาแก้ว'}
            </span>
            <h2 className="text-xl font-bold text-white pt-1">
              {callSession.callerName || 'แพทย์/พยาบาล โรงพยาบาลโพนนาแก้ว'}
            </h2>
            <p className="text-xs text-slate-300">
              {callSession.hospitalName || 'โรงพยาบาลโพนนาแก้ว'} กำลังโทรหาท่าน...
            </p>
          </div>

          {/* Patient Info Box */}
          <div className="bg-black/30 rounded-2xl p-3 border border-white/10 text-left text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-300">
              <span>ผู้รับสาย (คนไข้):</span>
              <span className="font-mono text-emerald-300 font-bold">HN: {callSession.patientHN}</span>
            </div>
            <p className="font-bold text-white text-sm">
              คุณ{callSession.patientName}
            </p>
            {callSession.reason && (
              <p className="text-[11px] text-emerald-200/90 pt-0.5 border-t border-white/10 mt-1">
                วัตถุประสงค์: {callSession.reason}
              </p>
            )}
          </div>

          {mediaError && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{mediaError}</span>
            </div>
          )}

          {/* Accept / Decline Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleRejectCall}
              className="py-3.5 px-4 bg-red-600/90 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>ไม่สะดวกคุย</span>
            </button>

            <button
              onClick={handleAnswerCall}
              className="py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-xl shadow-emerald-900/50 transition flex items-center justify-center gap-2 border border-emerald-300/40"
            >
              <Phone className="w-4 h-4 animate-pulse" />
              <span>กดรับสายหมอ</span>
            </button>
          </div>
        </div>

        {/* Footer Guidance */}
        <div className="text-center text-[11px] text-slate-400 max-w-xs space-y-1">
          <p>🔔 เมื่อกดรับสาย โปรดอนุญาตให้เบราว์เซอร์เปิดกล้องและไมโครโฟนเพื่อสนทนากับแพทย์</p>
        </div>

      </div>
    );
  }

  // 2. Call Ended Screen
  if (callSession.status === 'ended' || callSession.status === 'rejected') {
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

          {/* Doctor's Advice Box if present */}
          {callSession.prescriptionsOrAdvice && (
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

          {/* Health reminder banner */}
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

  // 3. Active In-Call Video Room View
  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col font-['Prompt',sans-serif] overflow-hidden select-none">
      
      {/* Top Overlay Bar */}
      <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/80 backdrop-blur-md flex items-center justify-center text-white font-bold shadow-md border border-white/20">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-tight flex items-center gap-1.5">
              <span>{callSession.callerName || 'แพทย์ รพ.โพนนาแก้ว'}</span>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-normal">
                {callSession.callerRole || 'แพทย์'}
              </span>
            </h2>
            <p className="text-[11px] text-slate-300">
              โรงพยาบาลโพนนาแก้ว &bull; HN: {callSession.patientHN}
            </p>
          </div>
        </div>

        {/* Timer & Quality indicator */}
        <div className="flex items-center gap-2">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{formatTimer(callDuration)}</span>
          </div>
        </div>
      </div>

      {/* Main Video Viewport (Remote Doctor Stream) */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover sm:object-contain"
        />

        {/* Doctor Audio/Video placeholder if remote stream not yet rendering */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-400 pointer-events-none -z-10">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-3">
            <Users className="w-10 h-10 text-slate-500" />
          </div>
          <p className="text-sm font-bold text-white">กำลังรอภาพจากแพทย์...</p>
          <p className="text-xs text-slate-400">เมื่อแพทย์เปิดกล้อง ภาพจะปรากฏขึ้นอัตโนมัติ</p>
        </div>

        {/* Floating Patient Self-View (Picture-in-Picture) */}
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
          <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] text-white">
            ตัวท่าน
          </div>
        </div>

        {/* Slide-over Chat Box */}
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
              {(!callSession.messages || callSession.messages.length === 0) ? (
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
      <div className="absolute bottom-6 inset-x-0 z-20 flex items-center justify-center px-4">
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

          {/* Switch Camera Front/Back (For showing pills or rash) */}
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
            className="w-14 h-12 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xl transition active:scale-95"
            title="วางสาย"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline">วางสาย</span>
          </button>

        </div>
      </div>

    </div>
  );
};
