(() => {
  'use strict';
  // The locomotive follows the same 16-beat timeline as the highlighted grid.
  const root = document.getElementById('trainTrack');
  const runner = document.getElementById('trainRunner');
  const sleepers = Array.from(document.querySelectorAll('#trainSleepers span'));
  let lastBeat = -1;

  function setPhase(phase) {
    const moving = phase === 'listen' || phase === 'play';
    root.classList.toggle('moving', moving);
    root.dataset.phase = phase;
    if (!moving) setProgress(0, -1);
  }

  function setProgress(fraction, beatIndex = -1) {
    const value = Math.max(0, Math.min(1, Number(fraction) || 0));
    runner.style.left = `${(value * 100).toFixed(2)}%`;
    root.setAttribute('aria-valuenow', String(Math.min(16, Math.floor(value * 16))));
    if (beatIndex !== lastBeat) {
      sleepers.forEach((sleeper, i) => {
        sleeper.classList.toggle('reached', i < beatIndex);
        sleeper.classList.toggle('current', i === beatIndex);
      });
      lastBeat = beatIndex;
    }
  }

  function reset() {
    root.classList.remove('moving');
    root.dataset.phase = 'idle';
    lastBeat = -2;
    setProgress(0, -1);
  }

  function finish() {
    root.classList.remove('moving');
    root.dataset.phase = 'finished';
    lastBeat = -2;
    setProgress(1, 15);
  }

  window.GrooveTrain = { setPhase, setProgress, reset, finish };
  reset();
})();
