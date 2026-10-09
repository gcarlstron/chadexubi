'use strict';
// =====================================================================
//  audio.js — efeitos e musicas sintetizadas (WebAudio)
// =====================================================================
let AC = null, master = null;
function audioInit() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.5; master.connect(AC.destination); } catch (e) { AC = null; } }
  if (AC && AC.state === 'suspended') AC.resume();
}
function tone(f, dur, type = 'square', vol = 0.12, when = 0, slide = 0) {
  if (!AC || AC.state !== 'running') return;
  const t = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
let noiseBuf = null;
function noise(dur, vol = 0.2, when = 0, freq = 1000) {
  if (!AC || AC.state !== 'running') return;
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = AC.currentTime + when, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
}
const SFX = {
  swing: () => noise(0.12, 0.25, 0, 2500),
  arrow: () => tone(1100, 0.15, 'triangle', 0.12, 0, 0.4),
  hit: () => { tone(260, 0.1, 'square', 0.14, 0, 0.5); noise(0.08, 0.2, 0, 800); },
  tink: () => tone(1800, 0.08, 'square', 0.06),
  kill: () => { tone(500, 0.2, 'square', 0.1, 0, 0.2); noise(0.2, 0.15, 0, 600); },
  break: () => { noise(0.35, 0.4, 0, 300); tone(90, 0.3, 'sawtooth', 0.12, 0, 0.5); },
  cut: () => noise(0.15, 0.3, 0, 3000),
  hurt: () => tone(320, 0.3, 'sawtooth', 0.14, 0, 0.3),
  heart: () => [660, 880].forEach((f, i) => tone(f, 0.1, 'square', 0.08, i * 0.06)),
  key: () => [880, 1175, 1568].forEach((f, i) => tone(f, 0.12, 'square', 0.09, i * 0.07)),
  unlock: () => { tone(300, 0.1, 'square', 0.12); tone(500, 0.15, 'square', 0.12, 0.1); noise(0.2, 0.2, 0.05, 600); },
  secret: () => [523, 587, 659, 698, 784, 880, 988, 1047].forEach((f, i) => tone(f, 0.1, 'triangle', 0.1, i * 0.06)),
  relic: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.09, i * 0.09)),
  chime: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.5, 'triangle', 0.12, i * 0.12)),
  wrong: () => { tone(200, 0.2, 'square', 0.12); tone(150, 0.35, 'square', 0.12, 0.2); },
  door: () => { tone(70, 1.0, 'sawtooth', 0.18, 0, 0.6); noise(0.9, 0.3, 0, 150); },
  tick: f => tone(f, 0.07, 'square', 0.1),
  sw: () => tone(700, 0.06, 'square', 0.07),
  pop: () => { noise(0.35, 0.22, 0, 900); tone(200, 0.2, 'triangle', 0.08, 0, 0.3); },
  poof: () => { noise(0.8, 0.4, 0, 400); tone(400, 0.6, 'sine', 0.1, 0, 0.2); },
  launch: () => tone(300, 0.4, 'triangle', 0.04, 0, 3),
  text: () => tone(1200, 0.02, 'square', 0.025),
  crow: () => { tone(900, 0.12, 'sawtooth', 0.1, 0, 0.6); tone(800, 0.15, 'sawtooth', 0.1, 0.16, 0.5); },
  portal: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'sine', 0.1, i * 0.08)),
  boss: () => { tone(110, 0.5, 'sawtooth', 0.15, 0, 0.5); noise(0.4, 0.2, 0, 200); },
  shield: () => tone(1500, 0.2, 'square', 0.08, 0, 1.5),
};
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const SONGS = {
  forest: { bpm: 128, mel: [69, 0, 72, 76, 74, 72, 71, 72, 69, 0, 0, 67, 69, 71, 72, 0, 76, 0, 79, 77, 76, 74, 72, 74, 76, 0, 71, 0, 69, 0, 0, 0, 72, 0, 74, 76, 77, 76, 74, 72, 71, 0, 67, 0, 71, 72, 74, 0, 72, 71, 69, 71, 72, 74, 76, 0, 74, 0, 71, 0, 69, 0, 0, 0], bass: [45, 0, 52, 0, 45, 0, 52, 0, 41, 0, 48, 0, 43, 0, 50, 0, 48, 0, 55, 0, 43, 0, 50, 0, 40, 0, 47, 0, 45, 0, 52, 0, 41, 0, 48, 0, 41, 0, 48, 0, 43, 0, 50, 0, 43, 0, 50, 0, 45, 0, 52, 0, 48, 0, 55, 0, 40, 0, 47, 0, 45, 0, 45, 0] },
  snow: { bpm: 104, mel: [74, 0, 77, 0, 81, 0, 79, 77, 76, 0, 0, 0, 74, 76, 77, 0, 79, 0, 77, 0, 76, 0, 72, 0, 74, 0, 0, 0, 0, 0, 0, 0, 81, 0, 84, 0, 83, 81, 79, 0, 77, 0, 79, 81, 79, 77, 76, 0, 74, 0, 76, 77, 76, 74, 73, 0, 74, 0, 0, 0, 0, 0, 0, 0], bass: [50, 0, 57, 0, 62, 0, 57, 0, 46, 0, 53, 0, 58, 0, 53, 0, 48, 0, 55, 0, 60, 0, 55, 0, 45, 0, 52, 0, 57, 0, 52, 0] },
  volcano: { bpm: 150, mel: [64, 0, 64, 67, 0, 64, 70, 0, 69, 0, 67, 0, 64, 0, 62, 0, 64, 0, 64, 67, 0, 64, 71, 0, 72, 0, 71, 0, 67, 0, 0, 0], bass: [40, 40, 0, 40, 40, 0, 40, 0, 43, 43, 0, 43, 41, 0, 41, 0, 40, 40, 0, 40, 40, 0, 40, 0, 47, 47, 0, 47, 46, 0, 46, 0] },
  boss: { bpm: 170, mel: [76, 75, 76, 0, 72, 0, 74, 0, 76, 0, 79, 0, 77, 76, 74, 0, 76, 75, 76, 0, 72, 0, 74, 0, 71, 0, 72, 0, 69, 0, 0, 0], bass: [45, 0, 45, 45, 0, 45, 45, 0, 41, 0, 41, 41, 0, 41, 43, 0, 45, 0, 45, 45, 0, 45, 45, 0, 40, 0, 40, 40, 0, 40, 44, 0] },
  reveal: { bpm: 140, mel: [72, 76, 79, 84, 79, 76, 79, 0, 77, 81, 84, 81, 79, 0, 0, 0, 76, 79, 84, 88, 86, 84, 83, 84, 79, 0, 76, 0, 72, 0, 0, 0], bass: [48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 57, 0, 55, 0, 59, 0, 48, 0, 55, 0, 52, 0, 55, 0, 43, 0, 47, 0, 48, 0, 48, 0] },
};
let song = null, songStep = 0, songNext = 0;
function playSong(name) { song = name ? SONGS[name] : null; songStep = 0; songNext = AC ? AC.currentTime + 0.1 : 0; }
function updateMusic() {
  if (!song || !AC || AC.state !== 'running') return;
  const step = 60 / song.bpm / 2;
  if (songNext < AC.currentTime) songNext = AC.currentTime + 0.05;
  while (songNext < AC.currentTime + 0.2) {
    const i = songStep % song.mel.length, m = song.mel[i], b = song.bass[songStep % song.bass.length], w = songNext - AC.currentTime;
    if (m) tone(midi(m), step * 0.9, 'square', 0.035, w);
    if (b) tone(midi(b), step * 1.6, 'triangle', 0.09, w);
    songStep++; songNext += step;
  }
}
