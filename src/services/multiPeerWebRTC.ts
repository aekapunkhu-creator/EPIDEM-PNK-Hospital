import { CallParticipant, MultiPeerSignal } from '../types';
import {
  joinRoomParticipant,
  leaveRoomParticipant,
  updateParticipantState,
  subscribeRoomParticipants,
  sendRoomSignal,
  subscribeRoomSignals
} from './firebaseStore';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ],
  iceCandidatePoolSize: 10
};

export interface RemoteParticipantStream {
  peerId: string;
  stream: MediaStream;
  participant?: CallParticipant;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export class MultiPeerWebRTCManager {
  private callId: string;
  private localParticipant: CallParticipant;
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private isScreenSharing: boolean = false;
  private facingMode: 'user' | 'environment' = 'user';

  // Map of peerId -> RTCPeerConnection
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  // Map of peerId -> MediaStream
  private remoteStreams: Map<string, MediaStream> = new Map();
  // Map of peerId -> Set of processed candidate hashes
  private processedCandidates: Map<string, Set<string>> = new Map();
  // Map of peerId -> queued ICE candidates before setRemoteDescription
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();

  // Subscriptions
  private unsubParticipants: (() => void) | null = null;
  private unsubSignals: (() => void) | null = null;

  // Callbacks
  private onRemoteStreamsChangeCallbacks: Array<(streams: RemoteParticipantStream[]) => void> = [];
  private onParticipantsChangeCallbacks: Array<(participants: CallParticipant[]) => void> = [];
  private onConnectionStatusCallbacks: Array<(status: string) => void> = [];

  private currentParticipants: Map<string, CallParticipant> = new Map();

  constructor(callId: string, localParticipant: CallParticipant) {
    this.callId = callId;
    this.localParticipant = localParticipant;
  }

  // 1. Start Local Camera/Mic
  async startLocalMedia(video = true, audio = true, facingMode: 'user' | 'environment' = 'user'): Promise<MediaStream> {
    this.facingMode = facingMode;
    try {
      const constraints: MediaStreamConstraints = {
        video: video ? {
          facingMode: this.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24, max: 30 }
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      this.syncTracksToAllPeers();
      return stream;
    } catch (err) {
      console.warn('High quality constraints failed, trying fallback:', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video, audio });
        this.localStream = fallbackStream;
        this.syncTracksToAllPeers();
        return fallbackStream;
      } catch (err2) {
        console.warn('Standard constraints failed, trying audio-only:', err2);
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        this.localStream = audioOnlyStream;
        this.syncTracksToAllPeers();
        return audioOnlyStream;
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

      // Deterministic initiator rule:
      // If my peerId is lexicographically larger than other peerId and no connection exists,
      // I create the Offer to initiate WebRTC mesh link!
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

  // Create an RTCPeerConnection for a specific remote peer
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

    // Connection State Change Listener
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        this.onConnectionStatusCallbacks.forEach(cb => cb('connected'));
      } else if (pc.connectionState === 'failed') {
        try {
          pc.restartIce();
        } catch (e) {}
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
        // Will be cleaned up if peer left
      }
    };

    return pc;
  }

  // Initiate an offer to another peer
  private async initiatePeerOffer(targetPeerId: string) {
    try {
      const pc = this.getOrCreatePeerConnection(targetPeerId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);

      await sendRoomSignal(this.callId, {
        fromPeerId: this.localParticipant.peerId,
        toPeerId: targetPeerId,
        type: 'offer',
        data: {
          type: offer.type,
          sdp: offer.sdp
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
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
        await this.flushPendingCandidates(fromPeerId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await sendRoomSignal(this.callId, {
          fromPeerId: this.localParticipant.peerId,
          toPeerId: fromPeerId,
          type: 'answer',
          data: {
            type: answer.type,
            sdp: answer.sdp
          },
          createdAt: Date.now()
        });
      } else if (signal.type === 'answer') {
        const pc = this.peerConnections.get(fromPeerId);
        if (pc && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
          await this.flushPendingCandidates(fromPeerId);
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
        isVideoOff: participant?.isVideoOff
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
    this.remoteStreams.delete(peerId);
    this.processedCandidates.delete(peerId);
    this.pendingCandidates.delete(peerId);
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
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (this.localStream && newVideoTrack) {
        const oldTrack = this.localStream.getVideoTracks()[0];
        if (oldTrack) this.localStream.removeTrack(oldTrack);
        this.localStream.addTrack(newVideoTrack);

        // Replace track across all peer connections
        this.peerConnections.forEach((pc) => {
          const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(newVideoTrack).catch(() => {});
          }
        });
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

  // Cleanup
  async leaveRoom() {
    if (this.unsubSignals) this.unsubSignals();
    if (this.unsubParticipants) this.unsubParticipants();

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
  }
}
