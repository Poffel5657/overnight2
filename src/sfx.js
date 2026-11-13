// Soundeffekte (CC0, Quellen in sounds/CREDITS.md). Web Audio: Puffer werden beim ersten Spielen
// geladen, der Ton startet erst nach der ersten Eingabe (Browser-Regel). Lautstärke 0..1 im Browser.

import { ABILITIES } from '../content/abilities.js';

const NAMES = ['hit', 'hit_big', 'hurt', 'heal', 'spell', 'burst', 'levelup', 'coin', 'pickup', 'ui', 'error', 'swing'];
const VOL_KEY = 'overnight2.volume';

let ctx = null;
const readyFns = [];
let master = null;
const buffers = new Map();
const lastPlayed = new Map();
let volume = 0.6;
try {
  const v = localStorage.getItem(VOL_KEY);
  if (v !== null && !Number.isNaN(Number(v))) volume = Math.max(0, Math.min(1, Number(v)));
} catch { /* egal */ }

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);
  for (const n of NAMES) load(n);
  for (const fn of readyFns) fn(ctx);
  return ctx;
}

function load(name) {
  if (buffers.has(name)) return;
  buffers.set(name, null);
  fetch(`sounds/${name}.mp3`)
    .then((r) => r.arrayBuffer())
    .then((a) => ctx.decodeAudioData(a))
    .then((b) => buffers.set(name, b))
    .catch(() => { /* ohne Ton weiter */ });
}

// Ton erst nach einer Geste freischalten
for (const ev of ['pointerdown', 'keydown']) {
  window.addEventListener(ev, () => { if (ensure()?.state === 'suspended') ctx.resume(); }, { capture: true });
}

// gain: relative Lautstärke; gap: Mindestabstand in ms, damit Salven nicht übersteuern.
export function play(name, gain = 1, gap = 40) {
  if (!ctx || volume <= 0) return;
  const buf = buffers.get(name);
  if (!buf) return;
  const now = performance.now();
  if (now - (lastPlayed.get(name) || 0) < gap) return;
  lastPlayed.set(name, now);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = 0.94 + Math.random() * 0.12; // leichte Abwechslung
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(g).connect(master);
  src.start();
}

// Gemeinsamer Audio-Kontext für die Musik (src/music.js). null bis zur ersten Eingabe.
export function audioContext() { return ctx; }
export function onAudioReady(fn) { readyFns.push(fn); if (ctx) fn(ctx); }

export function getVolume() { return volume; }
export function setVolume(v) {
  volume = Math.round(Math.max(0, Math.min(1, v)) * 10) / 10;
  if (master) master.gain.value = volume;
  try { localStorage.setItem(VOL_KEY, String(volume)); } catch { /* egal */ }
}

// Zuordnung von Spiel-Ereignissen zu Tönen. me: eigene Spieler-ID.
export const sfx = {
  play,
  // near: Hörweite 0..1 aus src/main.js (Entfernung, eigener Kampf oder fremder)
  float(e, cls = '', me = null, near = 1) {
    const own = e.ent === me;
    if (near <= 0.02) return;
    if (/dealt/.test(cls)) play(/big/.test(cls) ? 'hit_big' : 'hit', 0.8 * near);
    else if (/taken/.test(cls)) play('hurt', near);
    else if (cls === 'heal') play('heal', 0.7 * near, 300);
    else if (cls === 'info' && own && / gold$/.test(e.text)) play('coin');
    else if (cls === 'info' && own && /^\+1 /.test(e.text)) play('pickup');
  },
  cast(e, me) {
    if (e.by !== me) return;
    if (e.id === 'swing') { play('swing', 0.5); return; }
    const a = ABILITIES[e.id];
    if (!a) return;
    if (a.kind === 'burst' || a.kind === 'zone') play('burst');
    else if (a.kind !== 'melee') play('spell', 0.7);
  },
  log(text, cls) {
    if (cls === 'good' && / level \d+\.$/.test(text)) play('levelup', 1, 500);
    else if (cls === 'sys' && /not ready yet/.test(text)) play('error', 0.6, 300);
  },
  ui() { play('ui', 0.6); },
};
