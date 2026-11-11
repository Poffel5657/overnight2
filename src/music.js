// Leise Hintergrundmusik, im Browser erzeugt (keine Dateien, keine Lizenzfragen).
// 16-Bit-Anmutung: weiche Dreiecks-Flächen, Pulswellen-Melodie mit Echo, viel Stille.
// Tag: D-Dorisch, hell und ruhig. Nacht: dunklere Akkorde, langsamer, seltener eine Melodie.

import { onAudioReady } from './sfx.js';

const VOL_KEY = 'overnight2.music';
const BASE = 0.12; // Grundlautstärke bei Regler 100 %: bewusst leise

let volume = 0.5;
try {
  const v = localStorage.getItem(VOL_KEY);
  if (v !== null && !Number.isNaN(Number(v))) volume = Math.max(0, Math.min(1, Number(v)));
} catch { /* egal */ }

let ctx = null;
let out = null;   // Musik-Summe
let echoIn = null; // Eingang ins Echo
let pulse = null;  // Pulswelle 25 %
let night = false;
let timer = null;
let nextBar = 0;   // Zeit (ctx) des nächsten Takts
let bar = 0;
let lastNote = 2;  // Index in der Tonleiter, Melodie läuft schrittweise

const midi = (n) => 440 * 2 ** ((n - 69) / 12);

// Akkorde als MIDI-Grundtöne + Art; je 2 Takte
const DAY = [[50, 'm'], [46, 'M'], [53, 'M'], [48, 'M']];   // Dm  Bb  F  C
const NIGHT = [[50, 'm'], [55, 'm'], [46, 'M'], [45, 'M']]; // Dm  Gm  Bb A
const SCALE_DAY = [62, 64, 65, 67, 69, 71, 72, 74, 76];      // D-Dorisch
const SCALE_NIGHT = [62, 64, 65, 67, 69, 70, 72, 74, 77];    // D-Moll

function chordNotes(root, kind) {
  return [root, root + (kind === 'm' ? 3 : 4), root + 7];
}

function setup(c) {
  ctx = c;
  out = ctx.createGain();
  out.gain.value = BASE * volume;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2200;
  out.connect(lp).connect(ctx.destination);

  // Echo wie beim SNES: Verzögerung mit Rückkopplung und dumpfer Wiederholung
  echoIn = ctx.createGain();
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.42;
  const fb = ctx.createGain();
  fb.gain.value = 0.38;
  const damp = ctx.createBiquadFilter();
  damp.type = 'lowpass';
  damp.frequency.value = 1400;
  const wet = ctx.createGain();
  wet.gain.value = 0.45;
  echoIn.connect(delay).connect(damp).connect(fb).connect(delay);
  damp.connect(wet).connect(out);

  // Pulswelle mit 25 % Tastgrad (typischer Chip-Klang, hier weich gefiltert)
  const n = 32;
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
  pulse = ctx.createPeriodicWave(re, im);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
  start();
}

function voice(type, freq, t, dur, gain, attack, release, toEcho = false) {
  const o = ctx.createOscillator();
  if (type === 'pulse') o.setPeriodicWave(pulse);
  else o.type = type;
  o.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.setValueAtTime(gain, t + Math.max(attack, dur - release));
  g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g).connect(out);
  if (toEcho) g.connect(echoIn);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// Einen Takt (4 Schläge) einplanen
function scheduleBar(t) {
  const beat = night ? 1.05 : 0.85; // Sekunden pro Schlag
  const prog = night ? NIGHT : DAY;
  const [root, kind] = prog[Math.floor(bar / 2) % prog.length];
  const notes = chordNotes(root, kind);

  // Fläche: Akkord über den ganzen Takt, sehr weich
  if (bar % 2 === 0) for (const n of notes) voice('triangle', midi(n + 12), t, beat * 8, 0.09, 1.2, 1.6);
  // Bass: Grundton auf 1, Quinte auf 3
  voice('triangle', midi(root - 12), t, beat * 1.8, 0.22, 0.03, 0.6);
  voice('triangle', midi(root - 5), t + beat * 2, beat * 1.6, 0.16, 0.03, 0.6);

  // Melodie: in 4-Takt-Phrasen, jede zweite Phrase Pause; nachts seltener
  const phrase = Math.floor(bar / 4) % 2 === 0;
  if (!phrase) return;
  const scale = night ? SCALE_NIGHT : SCALE_DAY;
  const chance = night ? 0.3 : 0.45;
  for (let s = 0; s < 8; s++) {
    if (Math.random() > (s % 2 === 0 ? chance + 0.15 : chance * 0.5)) continue;
    // Schritt um -2..+2, am Taktanfang gern zum Akkordton
    lastNote = Math.max(0, Math.min(scale.length - 1, lastNote + Math.floor(Math.random() * 5) - 2));
    let n = scale[lastNote];
    if (s === 0) {
      const tones = notes.map((x) => x + 12).concat(notes.map((x) => x + 24));
      n = tones.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
    }
    const len = beat * (Math.random() < 0.3 ? 1 : 0.5);
    voice('pulse', midi(n), t + s * beat * 0.5, len, 0.07, 0.01, len * 0.6, true);
  }
}

function tick() {
  if (!ctx) return;
  const ahead = ctx.currentTime + 1.5;
  while (nextBar < ahead) {
    scheduleBar(nextBar);
    nextBar += (night ? 1.05 : 0.85) * 4;
    bar++;
  }
}

function start() {
  if (!ctx || timer || volume <= 0 || document.hidden) return;
  nextBar = ctx.currentTime + 0.3;
  timer = setInterval(tick, 400);
  tick();
}

function stop() {
  clearInterval(timer);
  timer = null;
}

onAudioReady(setup);

export const music = {
  setNight(on) { night = !!on; },
  get volume() { return volume; },
  setVolume(v) {
    volume = Math.round(Math.max(0, Math.min(1, v)) * 10) / 10;
    try { localStorage.setItem(VOL_KEY, String(volume)); } catch { /* egal */ }
    if (!out) return;
    out.gain.setTargetAtTime(BASE * volume, ctx.currentTime, 0.1);
    if (volume <= 0) stop();
    else start();
  },
};
