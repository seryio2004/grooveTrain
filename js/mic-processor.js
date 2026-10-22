import './rhythm.js';

class GrooveOnsets extends AudioWorkletProcessor {
  constructor() {
    super();
    this.detector = new globalThis.GrooveRhythm.OnsetDetector(sampleRate);
    this.sensitivity = 35;
    this.lastMeter = -1;
    this.port.onmessage = event => { this.sensitivity = event.data.sensitivity; };
  }
  process(inputs) {
    const samples = inputs[0]?.[0];
    if (samples?.length) {
      const result = this.detector.process(samples, currentTime, this.sensitivity);
      if (result.hit || currentTime - this.lastMeter >= 1 / 30) {
        this.port.postMessage({ ...result, time: currentTime });
        this.lastMeter = currentTime;
      }
    }
    // Outputs stay silent: microphone audio is never played back.
    return true;
  }
}
registerProcessor('groove-onsets', GrooveOnsets);
