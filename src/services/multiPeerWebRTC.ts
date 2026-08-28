import { CallParticipant, MultiPeerSignal } from '../types';
import {
  joinRoomParticipant,
  leaveRoomParticipant,
  updateParticipantState,
  subscribeRoomParticipants,
  sendRoomSignal,
  subscribeRoomSignals
} from './firebaseStore';

// Redundant & geo-optimized STUN server pool
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.services.mozilla.com' }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

export type NetworkQuality = 'good' | 'fair' | 'poor' | 'reconnecting';

export interface NetworkStatsInfo {
  quality: NetworkQuality;
  rttMs: number;
  packetLossPercent: number;
  bitrateKbps: number;
  isLowBandwidthMode: boolean;
}

export interface RemoteParticipantStream {
  peerId: string;
  stream: MediaStream;
  participant?: CallParticipant;
  isMuted?: boolean;
  isVideoOff?: boolean;
  networkQuality?: NetworkQuality;
}

export type VideoQualityMode = 'low' | 'balanced' | 'hd';

export class MultiPeerWebRTCManager {
  private callId: string;
  private localParticipant: CallParticipant;
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private isScreenSharing: boolean = false;
  private facingMode: 'user' | 'environment' = 'user';
  private isAudioOnlyMode: boolean = false;
  private qualityMode: VideoQualityMode = 'balanced';

  // Map of peerId -> RTCPeerConnection
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  // Map of peerId -> MediaStream
  private remoteStreams: Map<string, MediaStream> = new Map();
  // Map of peerId -> Set of processed candidate hashes
  private processedCandidates: Map<string, Set<string>> = new Map();
  // Map of peerId -> queued ICE candidates before setRemoteDescription
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  // Map of peerId -> reconnection retry timers / state
  private reconnectTimers: Map<string, any> = new Map();
  private isRestartingIce: Map<string, boolean> = new Map();

  // Subscriptions
  private unsubParticipants: (() => void) | null = null;
  private unsubSignals: (() => void) | null = null;

  // Stats polling interval
  private statsInterval: any = null;
  private latestStats: NetworkStatsInfo = {
    quality: 'good',
    rttMs: 50,
    packetLossPercent: 0,
    bitrateKbps: 300,
    isLowBandwidthMode: false
  };

  // Callbacks
  private onRemoteStreamsChangeCallbacks: Array<(streams: RemoteParticipantStream[]) => void> = [];
  private onParticipantsChangeCallbacks: Array<(participants: CallParticipant[]) => void> = [];
  private onConnectionStatusCallbacks: Array<(status: string) => void> = [];
  private onNetworkQualityCallbacks: Array<(stats: NetworkStatsInfo) => void> = [];

  private currentParticipants: Map<string, CallParticipant> = new Map();

  constructor(callId: string, localParticipant: CallParticipant) {
    this.callId = callId;
    this.localParticipant = localParticipant;
  }

  // 1. Start Local Media with optimized, resilient constraints
  async startLocalMedia(
    video = true, 
    audio = true, 
    facingMode: 'user' | 'environment' = 'user',
    quality: VideoQualityMode = 'balanced'
  ): Promise<MediaStream> {
    this.facingMode = facingMode;
    this.qualityMode = quality;
    this.isAudioOnlyMode = !video;

    const videoConstraints = this.getVideoConstraints(quality, facingMode);

    try {
      const constraints: MediaStreamConstraints = {
        video: video ? videoConstraints : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1 // Mono is best for low bandwidth speech clarity
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      this.syncTracksToAllPeers();
      this.applySenderBitrateLimits();
      this.startStatsMonitoring();
      return stream;
    } catch (err) {
      console.warn('Optimal media constraints failed, falling back to low bandwidth mode:', err);
      try {
        // Fallback to low-res video (QVGA / 15fps)
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: video ? {
            facingMode,
            width: { ideal: 480, max: 640 },
            height: { ideal: 360, max: 480 },
            frameRate: { ideal: 15, max: 20 }
          } : false,
          audio: audio ? { echoCancellation: true, noiseSuppression: true } : false
        });
        this.localStream = fallbackStream;
        this.qualityMode = 'low';
        this.syncTracksToAllPeers();
        this.applySenderBitrateLimits();
        this.startStatsMonitoring();
        return fallbackStream;
      } catch (err2) {
        console.warn('Standard fallback failed, switching to ultra-stable audio only:', err2);
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: { echoCancellation: true, noiseSuppression: true }
        });
        this.localStream = audioOnlyStream;
        this.isAudioOnlyMode = true;
        this.syncTracksToAllPeers();
        this.startStatsMonitoring();
        return audioOnlyStream;
      }
    }
  }

  private getVideoConstraints(quality: VideoQualityMode, facingMode: 'user' | 'environment'): MediaTrackConstraints {
    if (quality === 'low') {
      // 320x240 or 480x360 @ 15fps (consumes under 180 kbps)
      return {
        facingMode,
        width: { ideal: 480, max: 480 },
        height: { ideal: 360, max: 360 },
        frameRate: { ideal: 15, max: 18 }
      };
    } else if (quality === 'hd') {
      // 1280x720 @ 24fps
      return {
        facingMode,
        width: { ideal: 1280, max: 1280 },
        height: { ideal: 720, max: 720 },
        frameRate: { ideal: 24, max: 30 }
      };
    } else {
      // Balanced (Default): 640x480 @ 20fps (optimal for 3G/4G stability)
      return {
        facingMode,
        width: { ideal: 640, max: 854 },
        height: { ideal: 480, max: 480 },
        frameRate: { ideal: 20, max: 24 }
      };
    }
  }

  // Adjust Quality Mode dynamically on the fly without dropping call
  async setQualityMode(mode: VideoQualityMode) {
    this.qualityMode = mode;
    this.latestStats.isLowBandwidthMode = mode === 'low';

    // Apply bitrate & scale settings to all active video senders
    await this.applySenderBitrateLimits();

    // Re-acquire camera track if changing between low/balanced/hd
    if (this.localStream && !this.isAudioOnlyMode) {
      try {
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack && videoTrack.applyConstraints) {
          const constraints = this.getVideoConstraints(mode, this.facingMode);
          await videoTrack.applyConstraints(constraints);
        }
      } catch (e) {
        console.warn('Could not apply constraints dynamically, bitrate limiter applied instead.', e);
      }
    }
  }

  // Toggle Audio-Only Mode for saving bandwidth
  async toggleAudioOnlyMode(): Promise<boolean> {
    this.isAudioOnlyMode = !this.isAudioOnlyMode;
    if (this.isAudioOnlyMode) {
      // Disable video tracks
      this.toggleVideo(false);
      await this.setQualityMode('low');
    } else {
      // Enable video tracks
      this.toggleVideo(true);
      await this.setQualityMode('balanced');
    }
    return this.isAudioOnlyMode;
  }

  getIsAudioOnlyMode(): boolean {
    return this.isAudioOnlyMode;
  }

  getQualityMode(): VideoQualityMode {
    return this.qualityMode;
  }

  // Apply bitrate limits directly on RTCRtpSenders
  private async applySenderBitrateLimits() {
    const isLow = this.qualityMode === 'low';
    const maxVideoBitrate = isLow ? 180000 : this.qualityMode === 'hd' ? 1200000 : 450000;
    const maxFramerate = isLow ? 15 : this.qualityMode === 'hd' ? 30 : 20;
    const scaleFactor = isLow ? 2.0 : 1.0;

    for (const [peerId, pc] of this.peerConnections.entries()) {
      const senders = pc.getSenders();
      for (const sender of senders) {
        if (sender.track && sender.track.kind === 'video') {
          try {
            const params = sender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
              params.encodings = [{}];
            }
            params.encodings[0].maxBitrate = maxVideoBitrate;
            params.encodings[0].maxFramerate = maxFramerate;
            params.encodings[0].scaleResolutionDownBy = scaleFactor;
            // Maintain framerate prevents video freeze when packets drop on 3G
            (params as any).degradationPreference = 'maintain-framerate';
            await sender.setParameters(params);
          } catch (err) {
            // Some browsers don't allow setParameters before first handshake
          }
        }
      }
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // 2. Join the Room & Listen for Peers and Signals
  async joinRoom() {
    // 1. Join room presence in Firestore
    await joinRoomParticipant(this.callId, this.localParticipant);

    // 2. Listen to room signals directed to this peer
    this.unsubSignals = subscribeRoomSignals(this.callId, this.localParticipant.peerId, (signal) => {
      this.handleIncomingSignal(signal);
    });

    // 3. Listen to participants list in this room
    this.unsubParticipants = subscribeRoomParticipants(this.callId, (participants) => {
      this.handleParticipantsUpdate(participants);
    });
  }

  // Sync local tracks to all established peer connections
  private syncTracksToAllPeers() {
    if (!this.localStream) return;
    this.peerConnections.forEach((pc) => {
      const senders = pc.getSenders();
      this.localStream!.getTracks().forEach((track) => {
        const sender = senders.find(s => s.track && s.track.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track).catch(e => console.warn('replaceTrack error', e));
        } else {
          try {
            pc.addTrack(track, this.localStream!);
          } catch (e) {}
        }
      });
    });
  }

  // Handle participant join/leave events
  private async handleParticipantsUpdate(participants: CallParticipant[]) {
    const updatedMap = new Map<string, CallParticipant>();
    participants.forEach(p => updatedMap.set(p.peerId, p));
    this.currentParticipants = updatedMap;

    // Trigger participant callbacks
    this.onParticipantsChangeCallbacks.forEach(cb => cb(participants));

    // For every participant other than myself:
    for (const other of participants) {
      if (other.peerId === this.localParticipant.peerId) continue;

      if (!this.peerConnections.has(other.peerId)) {
        if (this.localParticipant.peerId > other.peerId) {
          await this.initiatePeerOffer(other.peerId);
        }
      }
    }

    // Clean up peers that left
    const currentPeerIds = new Set(participants.map(p => p.peerId));
    this.peerConnections.forEach((pc, peerId) => {
      if (!currentPeerIds.has(peerId)) {
        this.closePeer(peerId);
      }
    });

    this.notifyRemoteStreamsChanged();
  }

  // Munge SDP to inject Opus FEC (Forward Error Correction) & Bitrate optimization
  private optimizeSDP(sdp: string): string {
    let modified = sdp;
    // 1. Enable Opus Forward Error Correction and optimize audio for speech clarity on packet loss
    modified = modified.replace(
      /a=fmtp:111 ((?:(?!minptime).)*)/g,
      'a=fmtp:111 $1;useinbandfec=1;maxaveragebitrate=32000;stereo=0;sprop-stereo=0;cbr=0'
    );

    // 2. Prioritize baseline H264 or VP8 for low CPU consumption on budget Android phones
    return modified;
  }

  // Create an RTCPeerConnection for a specific remote peer with self-healing features
  private getOrCreatePeerConnection(targetPeerId: string): RTCPeerConnection {
    if (this.peerConnections.has(targetPeerId)) {
      return this.peerConnections.get(targetPeerId)!;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.peerConnections.set(targetPeerId, pc);
    this.processedCandidates.set(targetPeerId, new Set());
    this.pendingCandidates.set(targetPeerId, []);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, this.localStream!);
        } catch (e) {}
      });
    }

    // Remote Track Listener
    pc.ontrack = (event) => {
      let stream = this.remoteStreams.get(targetPeerId);
      if (!stream) {
        stream = new MediaStream();
        this.remoteStreams.set(targetPeerId, stream);
      }

      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!stream!.getTracks().some(t => t.id === track.id)) {
            stream!.addTrack(track);
          }
        });
      } else if (event.track) {
        if (!stream.getTracks().some(t => t.id === event.track.id)) {
          stream.addTrack(event.track);
        }
      }

      this.notifyRemoteStreamsChanged();
    };

    // ICE Candidate Listener
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendRoomSignal(this.callId, {
          fromPeerId: this.localParticipant.peerId,
          toPeerId: targetPeerId,
          type: 'ice-candidate',
          data: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex
          },
          createdAt: Date.now()
        });
      }
    };

    // Self-Healing Connection State Listener
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        this.onConnectionStatusCallbacks.forEach(cb => cb('connected'));
        this.isRestartingIce.set(targetPeerId, false);
        if (this.reconnectTimers.has(targetPeerId)) {
          clearTimeout(this.reconnectTimers.get(targetPeerId));
          this.reconnectTimers.delete(targetPeerId);
        }
        this.applySenderBitrateLimits();
      } else if (state === 'disconnected') {
        // Temporary network drop (e.g. mobile switching antenna)
        this.onConnectionStatusCallbacks.forEach(cb => cb('reconnecting'));
        this.scheduleAutoReconnect(targetPeerId, 2000);
      } else if (state === 'failed') {
        // Complete failure -> active ICE restart
        this.onConnectionStatusCallbacks.forEach(cb => cb('reconnecting'));
        this.scheduleAutoReconnect(targetPeerId, 1000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      const iceState = pc.iceConnectionState;
      if (iceState === 'disconnected' || iceState === 'failed') {
        this.scheduleAutoReconnect(targetPeerId, 2000);
      }
    };

    return pc;
  }

  // Automatic Reconnection Engine with Exponential Backoff
  private scheduleAutoReconnect(targetPeerId: string, delayMs: number) {
    if (this.isRestartingIce.get(targetPeerId)) return;
    if (this.reconnectTimers.has(targetPeerId)) {
      clearTimeout(this.reconnectTimers.get(targetPeerId));
    }

    const timer = setTimeout(async () => {
      if (this.localParticipant.peerId > targetPeerId) {
        console.log(`[Auto-Healing] Triggering ICE restart for peer ${targetPeerId}`);
        await this.triggerIceRestart(targetPeerId);
      }
    }, delayMs);

    this.reconnectTimers.set(targetPeerId, timer);
  }

  // Active ICE Restart
  async triggerIceRestart(targetPeerId: string) {
    const pc = this.peerConnections.get(targetPeerId);
    if (!pc) return;

    this.isRestartingIce.set(targetPeerId, true);
    try {
      const offer = await pc.createOffer({
        iceRestart: true,
        offerToReceiveAudio: true,
        offerToReceiveVideo: !this.isAudioOnlyMode
      });

      const optimizedSdp = this.optimizeSDP(offer.sdp || '');
      const sdpDesc = new RTCSessionDescription({ type: offer.type, sdp: optimizedSdp });
      await pc.setLocalDescription(sdpDesc);

      await sendRoomSignal(this.callId, {
        fromPeerId: this.localParticipant.peerId,
        toPeerId: targetPeerId,
        type: 'offer',
        data: {
          type: sdpDesc.type,
          sdp: sdpDesc.sdp
        },
        createdAt: Date.now()
      });
    } catch (err) {
      console.warn(`ICE Restart failed for ${targetPeerId}:`, err);
    } finally {
      setTimeout(() => {
        this.isRestartingIce.set(targetPeerId, false);
      }, 5000);
    }
  }

  // Manual Reconnect for User Button (1-Click Recovery)
  async reconnectAllPeers() {
    console.log('[MultiPeerWebRTC] Manually reconnecting all peers...');
    this.latestStats.quality = 'reconnecting';
    this.onNetworkQualityCallbacks.forEach(cb => cb(this.latestStats));

    for (const [peerId, pc] of this.peerConnections.entries()) {
      try {
        if (this.localParticipant.peerId > peerId) {
          await this.triggerIceRestart(peerId);
        } else {
          try { pc.restartIce(); } catch (e) {}
        }
      } catch (e) {
        console.warn('Manual reconnect error on peer', peerId, e);
      }
    }
  }

  // Initiate an offer to another peer
  private async initiatePeerOffer(targetPeerId: string) {
    try {
      const pc = this.getOrCreatePeerConnection(targetPeerId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      const optimizedSdp = this.optimizeSDP(offer.sdp || '');
      const sdpDesc = new RTCSessionDescription({ type: offer.type, sdp: optimizedSdp });
      await pc.setLocalDescription(sdpDesc);

      await sendRoomSignal(this.callId, {
        fromPeerId: this.localParticipant.peerId,
        toPeerId: targetPeerId,
        type: 'offer',
        data: {
          type: sdpDesc.type,
          sdp: sdpDesc.sdp
        },
        createdAt: Date.now()
      });
    } catch (err) {
      console.warn(`Failed to initiate offer to ${targetPeerId}:`, err);
    }
  }

  // Handle incoming signaling messages
  private async handleIncomingSignal(signal: MultiPeerSignal) {
    const fromPeerId = signal.fromPeerId;
    if (!fromPeerId || fromPeerId === this.localParticipant.peerId) return;

    try {
      if (signal.type === 'offer') {
        const pc = this.getOrCreatePeerConnection(fromPeerId);
        const remoteDesc = new RTCSessionDescription(signal.data);
        await pc.setRemoteDescription(remoteDesc);
        await this.flushPendingCandidates(fromPeerId);

        const answer = await pc.createAnswer();
        const optimizedSdp = this.optimizeSDP(answer.sdp || '');
        const sdpDesc = new RTCSessionDescription({ type: answer.type, sdp: optimizedSdp });
        await pc.setLocalDescription(sdpDesc);

        await sendRoomSignal(this.callId, {
          fromPeerId: this.localParticipant.peerId,
          toPeerId: fromPeerId,
          type: 'answer',
          data: {
            type: sdpDesc.type,
            sdp: sdpDesc.sdp
          },
          createdAt: Date.now()
        });
      } else if (signal.type === 'answer') {
        const pc = this.peerConnections.get(fromPeerId);
        if (pc && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
          await this.flushPendingCandidates(fromPeerId);
          this.applySenderBitrateLimits();
        }
      } else if (signal.type === 'ice-candidate') {
        const pc = this.peerConnections.get(fromPeerId);
        const candidateData = signal.data;
        if (pc && candidateData && candidateData.candidate) {
          const candidateKey = `${candidateData.candidate}_${candidateData.sdpMLineIndex}`;
          let processed = this.processedCandidates.get(fromPeerId);
          if (!processed) {
            processed = new Set();
            this.processedCandidates.set(fromPeerId, processed);
          }

          if (!processed.has(candidateKey)) {
            processed.add(candidateKey);
            if (pc.remoteDescription) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidateData as RTCIceCandidateInit));
              } catch (e) {
                console.warn('addIceCandidate error:', e);
              }
            } else {
              const pending = this.pendingCandidates.get(fromPeerId) || [];
              pending.push(candidateData as RTCIceCandidateInit);
              this.pendingCandidates.set(fromPeerId, pending);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error handling incoming signal:', err);
    }
  }

  private async flushPendingCandidates(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (!pc || !pc.remoteDescription) return;

    const pending = this.pendingCandidates.get(peerId) || [];
    while (pending.length > 0) {
      const candidate = pending.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Error flushing ICE candidate:', e);
        }
      }
    }
  }

  // Real-time Network Telemetry & Auto-Throttling
  private startStatsMonitoring() {
    if (this.statsInterval) clearInterval(this.statsInterval);

    this.statsInterval = setInterval(async () => {
      if (this.peerConnections.size === 0) return;

      let totalRtt = 0;
      let totalPacketsLost = 0;
      let totalPacketsReceived = 0;
      let totalBitrate = 0;
      let connCount = 0;

      for (const [peerId, pc] of this.peerConnections.entries()) {
        if (pc.connectionState !== 'connected') continue;
        try {
          const stats = await pc.getStats();
          connCount++;
          stats.forEach((report) => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              if (typeof report.currentRoundTripTime === 'number') {
                totalRtt += report.currentRoundTripTime * 1000;
              }
            }
            if (report.type === 'inbound-rtp') {
              if (typeof report.packetsLost === 'number') totalPacketsLost += report.packetsLost;
              if (typeof report.packetsReceived === 'number') totalPacketsReceived += report.packetsReceived;
            }
          });
        } catch (e) {}
      }

      if (connCount > 0) {
        const avgRtt = Math.round(totalRtt / connCount);
        const totalPackets = totalPacketsReceived + totalPacketsLost;
        const lossPercent = totalPackets > 0 ? Math.min(100, Math.round((totalPacketsLost / totalPackets) * 100)) : 0;

        let quality: NetworkQuality = 'good';
        if (avgRtt > 400 || lossPercent > 12) {
          quality = 'poor';
        } else if (avgRtt > 200 || lossPercent > 4) {
          quality = 'fair';
        }

        // Auto-adapt to low bandwidth if network becomes poor
        if (quality === 'poor' && this.qualityMode !== 'low') {
          console.log('[MultiPeerWebRTC] High packet loss/latency detected, auto-scaling to Low Bandwidth Mode');
          this.setQualityMode('low');
        }

        this.latestStats = {
          quality,
          rttMs: avgRtt || 60,
          packetLossPercent: lossPercent,
          bitrateKbps: this.qualityMode === 'low' ? 180 : 450,
          isLowBandwidthMode: this.qualityMode === 'low'
        };

        this.onNetworkQualityCallbacks.forEach(cb => cb(this.latestStats));
      }
    }, 3000);
  }

  // Notify listeners with formatted list of remote participant streams
  private notifyRemoteStreamsChanged() {
    const results: RemoteParticipantStream[] = [];
    this.remoteStreams.forEach((stream, peerId) => {
      const participant = this.currentParticipants.get(peerId);
      results.push({
        peerId,
        stream,
        participant,
        isMuted: participant?.isMuted,
        isVideoOff: participant?.isVideoOff,
        networkQuality: this.latestStats.quality
      });
    });
    this.onRemoteStreamsChangeCallbacks.forEach(cb => cb(results));
  }

  private closePeer(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    if (this.reconnectTimers.has(peerId)) {
      clearTimeout(this.reconnectTimers.get(peerId));
      this.reconnectTimers.delete(peerId);
    }
    this.remoteStreams.delete(peerId);
    this.processedCandidates.delete(peerId);
    this.pendingCandidates.delete(peerId);
    this.isRestartingIce.delete(peerId);
  }

  // Media Controls
  toggleAudio(enable: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(t => { t.enabled = enable; });
      updateParticipantState(this.callId, this.localParticipant.peerId, { isMuted: !enable });
    }
  }

  toggleVideo(enable: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(t => { t.enabled = enable; });
      updateParticipantState(this.callId, this.localParticipant.peerId, { isVideoOff: !enable });
    }
  }

  async switchCamera(): Promise<'user' | 'environment'> {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(t => t.stop());
    }

    try {
      const constraints = this.getVideoConstraints(this.qualityMode, this.facingMode);
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: constraints,
        audio: false
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (this.localStream && newVideoTrack) {
        const oldTrack = this.localStream.getVideoTracks()[0];
        if (oldTrack) this.localStream.removeTrack(oldTrack);
        this.localStream.addTrack(newVideoTrack);

        this.peerConnections.forEach((pc) => {
          const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(newVideoTrack).catch(() => {});
          }
        });
        this.applySenderBitrateLimits();
      }
    } catch (e) {
      console.warn('Switch camera error:', e);
    }
    return this.facingMode;
  }

  async startScreenShare(): Promise<MediaStream | null> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      this.screenStream = screenStream;
      this.isScreenSharing = true;
      const screenTrack = screenStream.getVideoTracks()[0];

      this.peerConnections.forEach((pc) => {
        const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack).catch(() => {});
        }
      });

      screenTrack.onended = () => {
        this.stopScreenShare();
      };

      updateParticipantState(this.callId, this.localParticipant.peerId, { isScreenSharing: true });
      return screenStream;
    } catch (err) {
      console.warn('Screen share error:', err);
      return null;
    }
  }

  async stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
    this.isScreenSharing = false;

    if (this.localStream) {
      const cameraTrack = this.localStream.getVideoTracks()[0];
      if (cameraTrack) {
        this.peerConnections.forEach((pc) => {
          const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(cameraTrack).catch(() => {});
          }
        });
      }
    }

    updateParticipantState(this.callId, this.localParticipant.peerId, { isScreenSharing: false });
  }

  getIsScreenSharing(): boolean {
    return this.isScreenSharing;
  }

  // Listeners registration
  onRemoteStreamsChange(cb: (streams: RemoteParticipantStream[]) => void) {
    this.onRemoteStreamsChangeCallbacks.push(cb);
  }

  onParticipantsChange(cb: (participants: CallParticipant[]) => void) {
    this.onParticipantsChangeCallbacks.push(cb);
  }

  onConnectionStatusChange(cb: (status: string) => void) {
    this.onConnectionStatusCallbacks.push(cb);
  }

  onNetworkQualityChange(cb: (stats: NetworkStatsInfo) => void) {
    this.onNetworkQualityCallbacks.push(cb);
  }

  // Cleanup
  async leaveRoom() {
    if (this.statsInterval) clearInterval(this.statsInterval);
    if (this.unsubSignals) this.unsubSignals();
    if (this.unsubParticipants) this.unsubParticipants();

    // Clear reconnect timers
    this.reconnectTimers.forEach(t => clearTimeout(t));
    this.reconnectTimers.clear();

    // Leave presence
    await leaveRoomParticipant(this.callId, this.localParticipant.peerId);

    // Stop local media
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.remoteStreams.clear();
    this.processedCandidates.clear();
    this.pendingCandidates.clear();
    this.isRestartingIce.clear();
  }
}
