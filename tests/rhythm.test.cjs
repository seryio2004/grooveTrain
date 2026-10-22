const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
global.window = global;
vm.runInThisContext(fs.readFileSync('js/rhythm.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/figures.js', 'utf8'));
const { analyseHits, OnsetDetector } = global.GrooveRhythm;

test('quarter note has only a head and stem; isolated eighths keep their flag', () => {
  const quarter = GrooveFigures.svgFig(GrooveFigures.FIGS.find(f => f.id === 'quarter'));
  assert.equal((quarter.match(/<ellipse/g) || []).length, 1);
  assert.equal((quarter.match(/<path/g) || []).length, 1);
  for (const id of ['rest', 'sync']) {
    assert.equal((GrooveFigures.svgFig(GrooveFigures.FIGS.find(f => f.id === id)).match(/<path/g) || []).length, 3);
  }
});

test('matching maximizes valid hits when timing windows overlap', () => {
  const result = analyseHits([{ t: 0, block: 0 }, { t: .1, block: 0 }], [.06, .14], .07, .5);
  assert.equal(result.matched.length, 2);
  assert.ok(result.goodBlocks.has(0));
});

test('a partially correct block and a block with extra hits are marked wrong', () => {
  const expected = [{ t: 0, block: 0 }, { t: .25, block: 0 }, { t: .5, block: 1 }];
  const result = analyseHits(expected, [0, .5, .8], .06, .5);
  assert.equal(result.matched.length, 2);
  assert.deepEqual([...result.badBlocks].sort(), [0, 1]);
  assert.equal(result.goodBlocks.size, 0);
});

test('silence, duplicates, early hits and late hits are scored independently', () => {
  const expected = [{ t: 0, block: 0 }, { t: .5, block: 1 }];
  assert.equal(analyseHits(expected, [], .06, .5).matched.length, 0);
  const result = analyseHits(expected, [-.02, 0, .53], .06, .5);
  assert.equal(result.matched.length, 2);
  assert.equal(result.matched.find(m => m.e === 1).delta.toFixed(2), '0.03');
  assert.equal(result.matched.find(m => m.e === 0).h, 1);
});

function simulate(amplitude, sensitivity = 35, rate = 48000) {
  const detector = new OnsetDetector(rate), hits = [];
  for (let frame = 0; frame < rate; frame += 128) {
    const samples = Float32Array.from({ length: 128 }, (_, i) => amplitude((frame + i) / rate));
    if (detector.process(samples, frame / rate, sensitivity).hit) hits.push(frame / rate);
  }
  return hits;
}

test('microphone ignores quiet background and counts a sustained attack once', () => {
  assert.equal(simulate(() => .001).length, 0);
  assert.equal(simulate(t => t > .1 ? .1 : 0).length, 1);
});

test('microphone detects fast repeated attacks at common sample rates', () => {
  for (const rate of [44100, 48000]) {
    const hits = simulate(t => t > .1 && t < .7 && (t - .1) % .06 < .01 ? .1 : .001, 35, rate);
    assert.equal(hits.length, 10);
  }
});

test('increasing sensitivity detects softer attacks', () => {
  const signal = t => t > .1 && t < .12 ? .008 : 0;
  assert.equal(simulate(signal, 8).length, 0);
  assert.equal(simulate(signal, 90).length, 1);
});
