// /worklet/vumeter.js

class VUMeterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._volume = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      let sum = 0;
      for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
      }
      const rms = Math.sqrt(sum / channelData.length);
      this._volume = rms;
      this.port.postMessage({ volume: rms }); // 发送给主线程
    }
    return true;
  }
}

registerProcessor('vumeter', VUMeterProcessor);
