// Client-seitige Anbindung an die hochperformante Python Engine (Aegis-Standard)
export class LiveSessionManager {
  constructor(options = {}) {
    this.wsUrl = options.wsUrl || 'ws://127.0.0.1:3001';
    this.ws = null;
    this.onAiSpeaking = options.onAiSpeaking || (() => {});
    this.onTranscript = options.onTranscript || (() => {});
    this.onUserTranscript = options.onUserTranscript || (() => {});
    this.onScreenFrame = options.onScreenFrame || (() => {});
    this.audioElement = new Audio();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log("🟢 Verbunden mit DCAI Core Engine");
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'ai_response') {
            this.onTranscript(msg.text);
            if (msg.audio) {
              this.playAudio(msg.audio);
            }
          } else if (msg.type === 'user_transcript') {
            this.onUserTranscript(msg.text);
          } else if (msg.type === 'screen_frame') {
            this.onScreenFrame(msg.data);
          }
        } catch (e) {
          console.error("Message parse error:", e);
        }
      };

      this.ws.onerror = (err) => {
        console.error("WebSocket Error:", err);
      };
    });
  }

  startCall() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'start_call' }));
    }
  }

  endCall() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'end_call' }));
    }
    if (this.audioElement) this.audioElement.pause();
  }

  setMute(isMuted) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'toggle_mute', muted: isMuted }));
    }
  }

  setScreenShare(isSharing) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'toggle_screen', sharing: isSharing }));
    }
  }

  sendWhisper(text) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'text_whisper', text: text }));
    }
  }

  playAudio(base64Mp3) {
    this.onAiSpeaking(true);
    this.audioElement.src = `data:audio/mp3;base64,${base64Mp3}`;
    this.audioElement.play().catch(e => console.error("Playback error:", e));
    this.audioElement.onended = () => this.onAiSpeaking(false);
    this.audioElement.onerror = () => this.onAiSpeaking(false);
  }

  disconnect() {
    this.endCall();
    if (this.ws) this.ws.close();
  }
}
