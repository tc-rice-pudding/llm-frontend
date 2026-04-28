import { sttFromMic } from './helper';

export class Recognizer {
  private recorder: MediaRecorder | null = null;
  private initialized: boolean = false;
  private isRecording: boolean = false;
  private azureSTT: any = null;

  onAudioRecording?: (event: MessageEvent<any>) => void;
  onAudioTranscription?: ((transcription: { text: string; delta: string; done: boolean }) => void) | null;

  async init() {
    const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const audioContext = new AudioContext();
    const mediaStreamSource = audioContext.createMediaStreamSource(stream);
    await audioContext.audioWorklet.addModule('/worklet/vumeter.js');
    const node = new AudioWorkletNode(audioContext, 'vumeter');
    node.port.onmessage = event => {
      if (event.data.volume) {
        if (this.isRecording) {
          this.onAudioRecording && this.onAudioRecording(event);
        }
      }
    };
    mediaStreamSource.connect(node).connect(audioContext.destination);

    this.initialized = true;
  }

  async cancel() {
    await this.stop();
  }

  get state() {
    return this.recorder?.state;
  }

  async start() {
    if (this.isRecording) return;
    this.isRecording = true;
    this.azureSTT = await sttFromMic((text, delta, done) => {
      console.log('delta', delta);
      if (this.onAudioTranscription) {
        this.onAudioTranscription({
          text,
          delta,
          done,
        });
      }
    });
    if (!this.initialized) await this.init();
  }

  async stop() {
    if (!this.isRecording) return;
    this.isRecording = false;
    return new Promise(resolve => {
      setTimeout(() => {
        this.azureSTT.close();
        if (!this.azureSTT.startRecord) {
          this.onAudioTranscription &&
            this.onAudioTranscription({
              text: '',
              delta: '',
              done: true,
            });
        }
        resolve(null);
      }, 500);
    });
  }

  async destroy() {
    this.onAudioTranscription = null;
    await this.stop();
  }
}
