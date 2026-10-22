'use strict';
// Shared by the audio worklet, the interface and the regression tests.
globalThis.GrooveRhythm = (() => {
  class OnsetDetector {
    constructor(sampleRate) {
      this.sampleRate = sampleRate;
      this.envelope = 0;
      this.noise = 0;
      this.peak = 0;
      this.armed = true;
      this.last = -Infinity;
    }
    process(samples, time, sensitivity = 35) {
      let energy = 0;
      for (const value of samples) energy += value * value;
      const rms = Math.sqrt(energy / samples.length);
      const duration = samples.length / this.sampleRate;
      const threshold = Math.max((98 - sensitivity) / 4000, this.noise * 3);
      const rising = rms > this.envelope * 1.6 && rms - this.envelope > threshold * .45;
      if (rms < Math.max(threshold * .65, this.peak * .4)) this.armed = true;
      const hit = rms > threshold && rising && this.armed && time - this.last >= .04;
      if (hit) {
        this.last = time;
        this.peak = rms;
        this.armed = false;
      }
      this.peak = Math.max(rms, this.peak * Math.exp(-duration / .12));
      // Learn quiet background slowly; transients must not raise the noise floor.
      if (rms < threshold) this.noise += (rms - this.noise) * (1 - Math.exp(-duration / .8));
      this.envelope += (rms - this.envelope) * (1 - Math.exp(-duration / .02));
      return { hit, rms, threshold };
    }
  }

  function analyseHits(expected, hits, tolerance, beatSec) {
    // Chronological matching: maximize matches, then minimize total timing error.
    const ordered = hits.map((t, i) => ({ t, i })).sort((a, b) => a.t - b.t);
    const rows = Array.from({ length: expected.length + 1 }, () => Array(ordered.length + 1));
    for (let i = 0; i <= expected.length; i++) {
      for (let j = 0; j <= ordered.length; j++) {
        if (!i || !j) { rows[i][j] = { count: 0, error: 0 }; continue; }
        const skipNote = rows[i - 1][j], skipHit = rows[i][j - 1];
        let best = { ...skipNote, action: 'note' };
        const better = candidate => candidate.count > best.count || (candidate.count === best.count && candidate.error < best.error);
        if (better(skipHit)) best = { ...skipHit, action: 'hit' };
        const delta = ordered[j - 1].t - expected[i - 1].t;
        if (Math.abs(delta) <= tolerance) {
          const prev = rows[i - 1][j - 1];
          const candidate = { count: prev.count + 1, error: prev.error + Math.abs(delta), action: 'match' };
          if (better(candidate)) best = candidate;
        }
        rows[i][j] = best;
      }
    }
    const matched = [];
    let i = expected.length, j = ordered.length;
    while (i && j) {
      const action = rows[i][j].action;
      if (action === 'match') {
        const delta = ordered[j - 1].t - expected[i - 1].t;
        matched.push({ e: i - 1, h: ordered[j - 1].i, err: Math.abs(delta), delta });
        i--; j--;
      } else if (action === 'hit') j--;
      else i--;
    }
    const used = new Set(matched.map(m => m.h));
    const badBlocks = new Set(hits.flatMap((t, index) => used.has(index) ? [] : [Math.max(0, Math.min(15, Math.floor(t / beatSec)))]));
    const goodBlocks = new Set();
    const matchedNotes = new Set(matched.map(m => m.e));
    expected.forEach((note, index) => { if (!matchedNotes.has(index)) badBlocks.add(note.block); });
    expected.forEach(note => { if (!badBlocks.has(note.block)) goodBlocks.add(note.block); });
    return { matched, goodBlocks, badBlocks };
  }
  return { OnsetDetector, analyseHits };
})();
