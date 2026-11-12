// Leise Hintergrundmusik, im Browser erzeugt (keine Dateien, keine Lizenzfragen).
// 16-Bit-Anmutung: weiche Dreiecks-Flächen, Pulswellen-Melodie mit Echo, viel Stille.
// Tag: D-Dorisch, hell und ruhig. Nacht: dunklere Akkorde, langsamer, seltener eine Melodie.
// Taverne: „The Lark's Jig“, eine feste Melodie in G-Dur im 6/8-Takt mit Bass, Akkorden und Trommel.

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
let tavern = false;
let noise = null; // Rauschen für die Trommel
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
  noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

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

// ---------- The Lark's Jig (Taverne) ----------
// Pro Takt: Melodie als [MIDI, Achtel] (zusammen 6 Achtel) und Grundton des Akkords.
const JIG_EIGHTH = 0.19;
const JIG = [
  [[[74, 2], [71, 1], [67, 2], [71, 1]], 43, 'M'],
  [[[74, 2], [71, 1], [72, 1], [71, 1], [69, 1]], 43, 'M'],
  [[[67, 2], [69, 1], [71, 2], [72, 1]], 48, 'M'],
  [[[74, 3], [69, 2], [71, 1]], 50, 'M'],
  [[[74, 2], [71, 1], [67, 2], [71, 1]], 43, 'M'],
  [[[74, 2], [76, 1], [78, 1], [79, 1], [78, 1]], 50, 'M'],
  [[[76, 2], [74, 1], [72, 1], [71, 1], [69, 1]], 45, 'm'],
  [[[67, 4], [62, 2]], 43, 'M'],
  // B-Teil: höher, dann zurück
  [[[79, 2], [78, 1], [76, 2], [74, 1]], 48, 'M'],
  [[[76, 2], [74, 1], [72, 2], [71, 1]], 48, 'M'],
  [[[74, 2], [71, 1], [67, 2], [71, 1]], 43, 'M'],
  [[[72, 2], [71, 1], [69, 3]], 50, 'M'],
  [[[79, 2], [78, 1], [76, 2], [74, 1]], 48, 'M'],
  [[[76, 1], [78, 1], [79, 1], [74, 2], [71, 1]], 43, 'M'],
  [[[72, 2], [71, 1], [69, 2], [66, 1]], 50, 'M'],
  [[[67, 4], [62, 2]], 43, 'M'],
];

function drum(t, gain, freq) {
  const s = ctx.createBufferSource();
  s.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  s.connect(f).connect(g).connect(out);
  s.start(t);
  s.stop(t + 0.15);
}

function scheduleJig(t) {
  const e = JIG_EIGHTH;
  const [melody, root, kind] = JIG[bar % JIG.length];
  const chord = chordNotes(root + 12, kind);
  // Bass auf 1 und 4, Akkord-Tupfer dazwischen (Oom-pa-pa)
  voice('triangle', midi(root), t, e * 1.6, 0.24, 0.01, 0.15);
  voice('triangle', midi(root + 7), t + e * 3, e * 1.6, 0.18, 0.01, 0.15);
  for (const s of [1, 2, 4, 5]) for (const n of chord) voice('triangle', midi(n + 12), t + s * e, e * 0.6, 0.035, 0.005, 0.08);
  // Trommel: kräftig auf 1, leiser auf 4, ab und zu ein Wirbel
  drum(t, 0.35, 180);
  drum(t + e * 3, 0.22, 220);
  if (bar % 4 === 3) for (const s of [4, 4.5, 5, 5.5]) drum(t + s * e, 0.1, 900);
  // Melodie: die Fiedel (Pulswelle), leicht ins Echo
  let at = 0;
  for (const [n, len] of melody) {
    voice('pulse', midi(n), t + at * e, len * e * 0.92, 0.075, 0.01, 0.05, true);
    at += len;
  }
}

const barLength = () => (tavern ? JIG_EIGHTH * 6 : (night ? 1.05 : 0.85) * 4);

// Einen Takt (4 Schläge) einplanen
function scheduleBar(t) {
  if (tavern) return scheduleJig(t);
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
    nextBar += barLength();
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
  // Taverne an/aus: die Jig beginnt am Anfang, die Hintergrundmusik danach von vorn.
  setTavern(on) {
    if (tavern === !!on) return;
    tavern = !!on;
    bar = 0;
    if (ctx && timer) nextBar = Math.max(nextBar, ctx.currentTime + 0.3);
  },
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
