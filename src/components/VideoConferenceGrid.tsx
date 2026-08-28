import React, { useEffect, useRef } from 'react';
import { CallParticipant } from '../types';
import { RemoteParticipantStream } from '../services/multiPeerWebRTC';
import { Mic, MicOff, VideoOff, User, HeartPulse, ShieldCheck, Stethoscope, Users } from 'lucide-react';

interface VideoTileProps {
  stream?: MediaStream | null;
  participant?: CallParticipant | null;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  facingMode?: 'user' | 'environment';
  label?: string;
  roleTitle?: string;
  roleBadgeColor?: string;
  onClick?: () => void;
  className?: string;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  participant,
  isLocal = false,
  isMuted = false,
  isVideoOff = false,
  facingMode = 'user',
  label,
  roleTitle,
  roleBadgeColor,
  onClick,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  const name = label || participant?.name || (isLocal ? 'ท่าน' : 'ผู้เข้าร่วม');
  const role = roleTitle || participant?.roleTitle || (participant?.role === 'doctor' ? 'แพทย์' : participant?.role === 'vdot' ? 'อสม. พี่เลี้ยง' : participant?.role === 'relative' ? 'ญาติ' : participant?.role === 'nurse' ? 'พยาบาล' : 'คนไข้');

  const getRoleIcon = () => {
    if (participant?.role === 'doctor' || role.includes('แพทย์')) return <Stethoscope className="w-3 h-3 text-emerald-400" />;
    if (participant?.role === 'vdot' || role.includes('อสม')) return <ShieldCheck className="w-3 h-3 text-amber-400" />;
    if (participant?.role === 'relative' || role.includes('ญาติ')) return <Users className="w-3 h-3 text-cyan-400" />;
    return <User className="w-3 h-3 text-emerald-400" />;
  };

  const getRoleBadgeStyle = () => {
    if (participant?.role === 'doctor' || role.includes('แพทย์')) return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
    if (participant?.role === 'vdot' || role.includes('อสม')) return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
    if (participant?.role === 'relative' || role.includes('ญาติ')) return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
    if (participant?.role === 'nurse' || role.includes('พยาบาล')) return 'bg-blue-950/80 text-blue-300 border-blue-500/40';
    return 'bg-teal-950/80 text-teal-300 border-teal-500/40';
  };

  return (
    <div 
      onClick={onClick}
      className={`relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl flex items-center justify-center group select-none ${className}`}
    >
      {/* Video Element */}
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal && facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-4 text-slate-400 space-y-2">
          <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
            <User className="w-7 h-7 text-slate-500" />
          </div>
          <span className="text-xs font-semibold text-slate-300 truncate max-w-[150px]">{name}</span>
          <span className="text-[10px] text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
            {isVideoOff ? 'ปิดกล้องอยู่' : 'กำลังเชื่อมต่อภาพ...'}
          </span>
        </div>
      )}

      {/* Participant Name & Role Tag Overlay */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 max-w-[85%] truncate shadow-lg">
          {getRoleIcon()}
          <span className="text-xs font-bold text-white truncate">{name}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium border ${getRoleBadgeStyle()}`}>
            {role}
          </span>
        </div>

        {/* Audio Muted Indicator */}
        <div className={`p-1.5 rounded-lg backdrop-blur-md shadow-md border ${
          isMuted 
            ? 'bg-red-600/90 text-white border-red-400/30' 
            : 'bg-slate-950/70 text-slate-300 border-white/10'
        }`}>
          {isMuted ? <MicOff className="w-3 h-3 text-white" /> : <Mic className="w-3 h-3 text-emerald-400" />}
        </div>
      </div>
    </div>
  );
};

interface VideoConferenceGridProps {
  localStream: MediaStream | null;
  localParticipant: CallParticipant;
  remoteStreams: RemoteParticipantStream[];
  isLocalMuted?: boolean;
  isLocalVideoOff?: boolean;
  facingMode?: 'user' | 'environment';
  onTileClick?: (peerId: string) => void;
  className?: string;
}

export const VideoConferenceGrid: React.FC<VideoConferenceGridProps> = ({
  localStream,
  localParticipant,
  remoteStreams,
  isLocalMuted = false,
  isLocalVideoOff = false,
  facingMode = 'user',
  onTileClick,
  className = ''
}) => {
  const totalCount = remoteStreams.length + 1; // local + remotes

  // 1 Remote Stream (Total 2: 1 Doctor + 1 Patient)
  if (remoteStreams.length === 1) {
    const remote = remoteStreams[0];
    return (
      <div className={`w-full h-full relative bg-slate-950 overflow-hidden ${className}`}>
        {/* Remote Main Video */}
        <VideoTile
          stream={remote.stream}
          participant={remote.participant}
          isMuted={remote.isMuted}
          isVideoOff={remote.isVideoOff}
          className="w-full h-full rounded-none border-none"
        />

        {/* Local Video in Floating PIP corner */}
        <div className="absolute top-4 right-4 z-20 w-32 h-44 sm:w-44 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-900">
          <VideoTile
            stream={localStream}
            participant={localParticipant}
            isLocal={true}
            isMuted={isLocalMuted}
            isVideoOff={isLocalVideoOff}
            facingMode={facingMode}
            label={`${localParticipant.name} (ตัวคุณ)`}
            className="w-full h-full rounded-2xl"
          />
        </div>
      </div>
    );
  }

  // 0 Remote Streams (Waiting for others)
  if (remoteStreams.length === 0) {
    return (
      <div className={`w-full h-full relative bg-slate-950 flex items-center justify-center p-4 ${className}`}>
        <div className="w-full max-w-lg h-72 sm:h-96 relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
          <VideoTile
            stream={localStream}
            participant={localParticipant}
            isLocal={true}
            isMuted={isLocalMuted}
            isVideoOff={isLocalVideoOff}
            facingMode={facingMode}
            label={`${localParticipant.name} (ตัวคุณ)`}
            className="w-full h-full"
          />
        </div>
      </div>
    );
  }

  // 2 Remote Streams (Total 3 participants: e.g. Doctor + Patient + Relative)
  if (remoteStreams.length === 2) {
    return (
      <div className={`w-full h-full p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 bg-slate-950 overflow-y-auto ${className}`}>
        {remoteStreams.map((remote) => (
          <VideoTile
            key={remote.peerId}
            stream={remote.stream}
            participant={remote.participant}
            isMuted={remote.isMuted}
            isVideoOff={remote.isVideoOff}
            className="h-56 sm:h-auto min-h-[220px]"
            onClick={() => onTileClick && onTileClick(remote.peerId)}
          />
        ))}
        {/* Local Stream */}
        <VideoTile
          stream={localStream}
          participant={localParticipant}
          isLocal={true}
          isMuted={isLocalMuted}
          isVideoOff={isLocalVideoOff}
          facingMode={facingMode}
          label={`${localParticipant.name} (ตัวคุณ)`}
          className="h-56 sm:h-auto min-h-[220px]"
        />
      </div>
    );
  }

  // 3+ Remote Streams (Total 4+ participants: 2x2 or 3x2 Grid)
  return (
    <div className={`w-full h-full p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3 bg-slate-950 overflow-y-auto ${className}`}>
      {remoteStreams.map((remote) => (
        <VideoTile
          key={remote.peerId}
          stream={remote.stream}
          participant={remote.participant}
          isMuted={remote.isMuted}
          isVideoOff={remote.isVideoOff}
          className="h-48 sm:h-auto min-h-[200px]"
          onClick={() => onTileClick && onTileClick(remote.peerId)}
        />
      ))}
      {/* Local Stream */}
      <VideoTile
        stream={localStream}
        participant={localParticipant}
        isLocal={true}
        isMuted={isLocalMuted}
        isVideoOff={isLocalVideoOff}
        facingMode={facingMode}
        label={`${localParticipant.name} (ตัวคุณ)`}
        className="h-48 sm:h-auto min-h-[200px]"
      />
    </div>
  );
};
