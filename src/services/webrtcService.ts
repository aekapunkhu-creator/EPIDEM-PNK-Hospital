import { 
  saveCallSessionToFirestore, 
  updateCallStatus, 
  addCallIceCandidate, 
  subscribeCallById 
} from './firebaseStore';
import { VideoCallSession } from '../types';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};

export class WebRTCConnection {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private unsubCall: (() => void) | null = null;
  private callId: string;
  private role: 'caller' | 'callee'; // caller = doctor, callee = patient
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChangeCallback: ((state: RTCPeerConnectionState) => void) | null = null;
  private processedCandidates: Set<string> = new Set();
  private facingMode: 'user' | 'environment' = 'user';
  private isScreenSharing: boolean = false;
  private screenStream: MediaStream | null = null;

  constructor(callId: string, role: 'caller' | 'callee') {
    this.callId = callId;
    this.role = role;
  }

  // Initialize Local Media (Camera & Mic)
  async startLocalMedia(video = true, audio = true, facing: 'user' | 'environment' = 'user'): Promise<MediaStream> {
    this.facingMode = facing;
    try {
      const constraints: MediaStreamConstraints = {
        audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false,
        video: video ? {
          facingMode: facing,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        } : false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      return stream;
    } catch (err: any) {
      console.warn('getUserMedia high constraints failed, trying basic fallback:', err);
      // Fallback with minimal constraints
      const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.localStream = fallbackStream;
      return fallbackStream;
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
    if (this.remoteStream) {
      callback(this.remoteStream);
    }
  }

  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateChangeCallback = callback;
  }

  // Setup Peer Connection
  private createPeerConnection() {
    if (this.pc) return this.pc;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.pc = pc;

    this.remoteStream = new MediaStream();

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        if (this.remoteStream && !this.remoteStream.getTracks().some(t => t.id === track.id)) {
          this.remoteStream.addTrack(track);
        }
      });
      if (this.onRemoteStreamCallback && this.remoteStream) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // Handle ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const c = event.candidate.toJSON();
        addCallIceCandidate(this.callId, this.role, {
          candidate: c.candidate || '',
          sdpMid: c.sdpMid || null,
          sdpMLineIndex: c.sdpMLineIndex ?? null
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      if (this.onConnectionStateChangeCallback && pc) {
        this.onConnectionStateChangeCallback(pc.connectionState);
      }
    };

    return pc;
  }

  // CALLER: Doctor creates call offer
  async initiateCallOffer(sessionData: VideoCallSession) {
    const pc = this.createPeerConnection();

    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await pc.setLocalDescription(offer);

    const callPayload: VideoCallSession = {
      ...sessionData,
      status: 'ringing',
      offer: {
        type: 'offer',
        sdp: offer.sdp || ''
      },
      callerIceCandidates: []
    };

    await saveCallSessionToFirestore(callPayload);

    // Listen for Answer from callee (patient) and callee ICE candidates
    this.unsubCall = subscribeCallById(this.callId, async (updated) => {
      if (!updated || !this.pc) return;

      // When callee answers
      if (updated.answer && !this.pc.currentRemoteDescription) {
        const answerDesc = new RTCSessionDescription(updated.answer);
        await this.pc.setRemoteDescription(answerDesc);
      }

      // Add callee's ICE candidates
      if (updated.calleeIceCandidates && updated.calleeIceCandidates.length > 0) {
        for (const candidateData of updated.calleeIceCandidates) {
          const key = `${candidateData.candidate}_${candidateData.sdpMLineIndex}`;
          if (!this.processedCandidates.has(key) && candidateData.candidate) {
            this.processedCandidates.add(key);
            try {
              await this.pc.addIceCandidate(new RTCIceCandidate(candidateData as RTCIceCandidateInit));
            } catch (err) {
              console.warn('Error adding callee ICE candidate', err);
            }
          }
        }
      }
    });
  }

  // CALLEE: Patient answers incoming call
  async answerCall() {
    const pc = this.createPeerConnection();

    // Start listening to the call doc to get the offer and caller's candidates
    this.unsubCall = subscribeCallById(this.callId, async (callDoc) => {
      if (!callDoc || !this.pc) return;

      // 1. Process Offer from caller if not done yet
      if (callDoc.offer && !this.pc.currentRemoteDescription) {
        const offerDesc = new RTCSessionDescription(callDoc.offer);
        await this.pc.setRemoteDescription(offerDesc);

        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);

        await updateCallStatus(this.callId, 'connected', {
          answer: {
            type: 'answer',
            sdp: answer.sdp || ''
          },
          startedAt: new Date().toISOString()
        });
      }

      // 2. Add caller's ICE candidates
      if (callDoc.callerIceCandidates && callDoc.callerIceCandidates.length > 0) {
        for (const candidateData of callDoc.callerIceCandidates) {
          const key = `${candidateData.candidate}_${candidateData.sdpMLineIndex}`;
          if (!this.processedCandidates.has(key) && candidateData.candidate) {
            this.processedCandidates.add(key);
            try {
              await this.pc.addIceCandidate(new RTCIceCandidate(candidateData as RTCIceCandidateInit));
            } catch (err) {
              console.warn('Error adding caller ICE candidate', err);
            }
          }
        }
      }
    });
  }

  // Toggle Audio (Mute / Unmute)
  toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled !== undefined ? enabled : !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  // Toggle Video (Camera On / Off)
  toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled !== undefined ? enabled : !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  // Switch Facing Mode (Front vs Back camera for examining pills / rash on mobile)
  async switchCamera(): Promise<'user' | 'environment'> {
    const nextFacing = this.facingMode === 'user' ? 'environment' : 'user';
    if (!this.localStream || !this.pc) return this.facingMode;

    try {
      const oldVideoTrack = this.localStream.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      // Replace track in peer connection
      const sender = this.pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }

      // Replace track in localStream
      if (oldVideoTrack) {
        this.localStream.removeTrack(oldVideoTrack);
      }
      this.localStream.addTrack(newVideoTrack);
      this.facingMode = nextFacing;
      return nextFacing;
    } catch (err) {
      console.warn('Error switching camera:', err);
      return this.facingMode;
    }
  }

  // Screen Sharing (Doctor shows educational slide or chest X-ray to patient)
  async startScreenShare(): Promise<boolean> {
    if (!this.pc || !navigator.mediaDevices.getDisplayMedia) return false;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      this.screenStream = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      const sender = this.pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }

      this.isScreenSharing = true;

      screenTrack.onended = () => {
        this.stopScreenShare();
      };
      return true;
    } catch (err) {
      console.warn('Screen share cancelled or failed', err);
      return false;
    }
  }

  async stopScreenShare() {
    if (!this.isScreenSharing || !this.pc) return;
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
    if (this.localStream) {
      const originalVideoTrack = this.localStream.getVideoTracks()[0];
      const sender = this.pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender && originalVideoTrack) {
        await sender.replaceTrack(originalVideoTrack);
      }
    }
    this.isScreenSharing = false;
  }

  getIsScreenSharing(): boolean {
    return this.isScreenSharing;
  }

  // End and Clean Up Everything
  close() {
    if (this.unsubCall) {
      this.unsubCall();
      this.unsubCall = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }
}
