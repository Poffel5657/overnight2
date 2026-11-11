// Overnight 2: verbindet Verbindung (src/net.js), Darstellung (src/render/) und Oberfläche (src/ui.js).
// Die Welt rechnet der Server (oder offline der Browser). Hier liegt nur eine Spiegelung davon:
// Figuren mit Position und HP, der eigene Zustand und angezündete Feuer.

import * as THREE from 'three';
import { regionFor, HOME_REGION } from '../content/regions/index.js';
import { EXAMINE } from '../content/npcs.js';
import { TICK_MS, objectActions, lanternRadius, regionObjects } from '../shared/sim.js';
import { cheb } from '../shared/path.js';
import { TILE_TYPES } from '../content/tiles.js';
import { NODES } from '../content/nodes.js';
import { PROFESSIONS } from '../content/professions.js';
import { skyState, berlinClock, minutesToMidnight, berlinDate } from '../shared/daylight.js';
import { createView, buildGreyWall } from './render/view.js';
import { buildTerrain } from './render/terrain.js';
import { buildObjects } from './render/objects.js';
import { makeSprite } from './render/sprites.js';
import { setLights, lightUniforms } from './render/light.js';
import { createUI } from './ui.js';
import { startNumerals } from './numerals.js';
import { conditionHolds } from '../shared/talk.js';
import { TALK } from '../content/npcs.js';
import { createWindows } from './windows.js';
import { sfx, getVolume, setVolume } from './sfx.js';
import { music } from './music.js';
import { BARKS, HAILS, HAIL_DEFAULT, HAIL_RANGE, HAIL_COOLDOWN } from '../content/barks.js';
import { CHRONICLE } from '../content/chronicle.js';
import { BEACON_GOAL } from '../content/dailies.js';
import { SHOPS } from '../content/shops.js';
import { LocalConnection, NetConnection } from './net.js';
import { createLogin } from './login.js';
import { SERVER, OFFLINE } from './config.js';
import { CONTENT_SIG } from '../shared/version.js';

const canvas = document.getElementById('view');
const view = createView(canvas);
const { scene, camera, rig } = view;

// ---------- Spiegelwelt ----------

const mirror = {
  state: null,
  you: null,
  tick: 0,
  arrivedAt: performance.now(),
  ents: new Map(),
  me: null,
  objects: [],
};

// Das aktuelle Gebiet. Bei jedem Wechsel (Tür, Aufwachen in Kindle) wird es neu gebaut.
let lastSky = -1;
let greeted = false;
let lastZone = null;
let region = null;
let terrain = null;
let objects = null;
let greyWall = null;
const REGION_KEY = 'overnight2.region';

function loadRegion(id, date) {
  const r = regionFor(id, date || berlinDate(new Date()));
  if (!r) return;
  if (region && region.id === r.id && (region.date ?? null) === (r.date ?? null)) return;
  if (terrain) {
    for (const obj of [terrain.mesh, terrain.water, greyWall, objects.root]) {
      scene.remove(obj);
      obj.traverse((c) => c.geometry?.dispose());
    }
  }
  region = r;
  mirror.objects = regionObjects(r);
  terrain = buildTerrain(r, mirror.objects);
  greyWall = buildGreyWall(terrain.W, terrain.H);
  objects = buildObjects({ objects: mirror.objects }, r, terrain.heightAt);
  scene.add(terrain.mesh, terrain.water, greyWall, objects.root);
  lastSky = -1;
}
loadRegion(savedRegion());

function savedRegion() {
  try { return localStorage.getItem(REGION_KEY) || HOME_REGION; } catch { return HOME_REGION; }
}
function rememberRegion(id) {
  try { localStorage.setItem(REGION_KEY, id); } catch { /* egal */ }
}

function findEntity(ref) {
  if (!ref) return null;
  if (ref.kind === 'object') return mirror.objects.find((o) => o.id === ref.id) || null;
  return mirror.ents.get(ref.id) || null;
}

// ---------- Figuren ----------

const shadowGeo = new THREE.CircleGeometry(0.32, 12).rotateX(-Math.PI / 2);
const shadowMat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35, depthWrite: false });
const visuals = new Map();

function idHash(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h % 1000) / 100;
}

function addVisual(ent) {
  const s = makeSprite(ent.sprite);
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.renderOrder = 1;
  for (const m of s.meshes) m.userData.ref = { kind: ent.kind, id: ent.id };
  scene.add(s.group, shadow);
  const v = { ent, sprite: s, shadow, pos: new THREE.Vector3(), flip: 1, fade: ent.dead ? 0 : 1, bob: idHash(ent.id) };
  visuals.set(ent.id, v);
  return v;
}

function removeVisual(id) {
  const v = visuals.get(id);
  if (!v) return;
  scene.remove(v.sprite.group, v.shadow);
  visuals.delete(id);
  ui.overhead(id, 0, 0, null);
  ui.nameTag(id, 0, 0, null);
  ui.marker(id, 0, 0, null);
}

// Zielring und Klickmarke
const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 20).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.9, depthWrite: false }));
ring.renderOrder = 2;
scene.add(ring);
const marker = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.22, 4).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: '#ffe08a', transparent: true, depthWrite: false }));
marker.visible = false;
scene.add(marker);
let markerAge = 0;

// Angekündigte Angriffe: rote Felder, die pulsieren, bis sie treffen.
const telegraphs = new Map();
const teleMat = new THREE.MeshBasicMaterial({ color: '#ff5030', transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide });
function tileQuad(x, y, lift = 0.05) {
  const h = (a, b) => terrain.heightAt(a, b) + lift;
  const p = [[x + 0.06, y + 0.06], [x + 0.94, y + 0.06], [x + 0.94, y + 0.94], [x + 0.06, y + 0.94]].map(([a, b]) => [a, h(a, b), b]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 3, 2, 0, 2, 1].flatMap((i) => p[i]), 3));
  return g;
}
// Angekündigter Angriff: Fläche füllt sich bis zum Einschlag (eigenes Material pro Angriff)
function addTelegraph(t) {
  const g = new THREE.Group();
  const mat = teleMat.clone();
  for (const tile of t.tiles) g.add(new THREE.Mesh(tileQuad(tile.x, tile.y), mat));
  g.renderOrder = 3;
  g.userData.start = performance.now();
  g.userData.ms = t.ms || 900;
  g.userData.mat = mat;
  scene.add(g);
  telegraphs.set(t.id, g);
}
function removeTelegraph(id) {
  const g = telegraphs.get(id);
  if (!g) return;
  scene.remove(g);
  g.traverse((c) => c.geometry?.dispose());
  g.userData.mat?.dispose();
  telegraphs.delete(id);
}

function setLit(id, lit) {
  const o = mirror.objects.find((x) => x.id === id);
  if (o) o.lit = lit;
  const f = objects.flameByObject.get(id);
  if (f) f.group.visible = lit;
}

// ---------- Verbindung ----------

let conn = null;
const send = (intent) => conn?.send(intent);

function useBarSlot(i) {
  const id = ui.bar[i];
  if (!id) return;
  send({ t: 'ability', id });
  ui.flashSlot(i);
}

// Zahlen überall in der Ziffern-Schrift
startNumerals();

const ui = createUI({
  ability: useBarSlot,
  assign(slot, id) { send({ t: 'bar', slot, id }); },
  say(i) { send({ t: 'say', i }); },
  bye() { send({ t: 'bye' }); },
  crt(on) { view.setCrt(on); },
  partyLeave() { send({ t: 'partyLeave' }); },
  partyKick(id) { send({ t: 'partyKick', id }); },
});

const windows = createWindows({
  use(slot) { send({ t: 'use', slot }); },
  drop(slot) { send({ t: 'drop', slot }); },
  unequip(slot) { send({ t: 'unequip', slot }); },
  craft(obj, recipe, n) { send({ t: 'craft', obj, recipe, n }); },
  buy(shop, item, n) { send({ t: 'buy', shop, item, n }); },
  sell(shop, slot, n) { send({ t: 'sell', shop, slot, n }); },
  assign(id, name) { ui.beginAssign(id, name); },
  menu(x, y, entries) { ui.openMenu(x, y, entries); },
  log(text, cls) { ui.log(text, cls); },
  keys() { return ui.keys; },
  setKeys(k) { ui.setKeys(k); },
  favour(id) { send({ t: 'favour', id }); },
  feed(item, n) { send({ t: 'feed', item, n }); },
  vote(option) { send({ t: 'vote', option }); },
  pray(text) {
    if (!text || text.trim().length < 3) { ui.log('A prayer needs a few words at least.', 'sys'); return false; }
    send({ t: 'pray', text });
    return true;
  },
  online() { return conn ? !conn.offline : false; },
  leave() { document.getElementById('btn-leave').click(); },
  me() { return mirror.me; },
  scale() { return ui.scale; },
  setScale(v) { ui.setScale(v); },
  crt() { return ui.crt; },
  setCrt(on) { ui.setCrt(on); },
  volume() { return getVolume(); },
  setVolume(v) { setVolume(v); sfx.ui(); },
  click() { sfx.ui(); },
  tradeAnswer(from, yes) { send({ t: 'tradeAnswer', from, yes }); },
  tradeSet(items, gold) { send({ t: 'tradeSet', items, gold }); },
  tradeOk() { send({ t: 'tradeOk' }); },
  partyAnswer(from, yes) { send({ t: 'partyAnswer', from, yes }); },
  tradeCancel() { send({ t: 'tradeCancel' }); },
  music() { return music.volume; },
  setMusic(v) { music.setVolume(v); },
  async fetchBoard() {
    const res = await fetch(`${SERVER}/api/board`);
    return (await res.json()).top;
  },
});
try {
  if (localStorage.getItem('overnight2.crt') === '0') ui.setCrt(false);
} catch { /* egal */ }

let flareUntil = 0;
let snapCamera = true;

function screenOf(v, lift = 0) {
  const p = v.pos.clone();
  p.y += v.sprite.height + lift;
  p.project(camera);
  const x = (p.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-p.y * 0.5 + 0.5) * window.innerHeight;
  return { x, y, visible: p.z < 1 && x > 0 && x < window.innerWidth && y > 0 && y < window.innerHeight };
}

const hitAvg = {};
let community = null;
let today = '';

// Bildschirmpunkt eines Weltpunkts (für Symbole über Gebäuden)
function screenAt(x, y, z) {
  const p = new THREE.Vector3(x, y, z).project(camera);
  const sx = (p.x * 0.5 + 0.5) * window.innerWidth;
  const sy = (-p.y * 0.5 + 0.5) * window.innerHeight;
  return { x: sx, y: sy, visible: p.z < 1 && sx > 0 && sx < window.innerWidth && sy > 0 && sy < window.innerHeight };
}

// Tagesaufgaben am Altar: beten (nur online) und Gold opfern
function todayState() {
  const d = mirror.state?.daily;
  const fresh = d && d.date === today;
  return { prayed: !!(fresh && d.prayed), voted: !!(fresh && d.voted), canPray: !!(conn && !conn.offline) };
}
// Leuchtfeuer-Balken: im Status immer, über dem Feuer, wenn es im Bild ist
function placeBeacon() {
  if (!community || typeof community.beacon !== 'number') { ui.setBeacon(null); return; }
  const frac = Math.min(1, community.beacon / BEACON_GOAL);
  const b = mirror.objects.find((o) => o.type === 'beacon');
  let pos = null;
  if (b) {
    const cx = b.x + b.w / 2;
    const cz = b.y + b.d / 2;
    const s = screenAt(cx, terrain.heightAt(cx, cz) + 3.4, cz);
    if (s.visible) pos = s;
  }
  ui.setBeacon(frac, `${community.beacon} / ${BEACON_GOAL}`, pos);
}

const MARK_LIFT = { chapel: 4.2, altar: 1.6 };
function placeDailyMarks() {
  const t = todayState();
  const due = (t.canPray && !t.prayed) || !t.voted;
  for (const o of mirror.objects) {
    if (!MARK_LIFT[o.type]) continue;
    const cx = o.x + o.w / 2;
    const cz = o.y + o.d / 2;
    const s = due ? screenAt(cx, terrain.heightAt(cx, cz) + MARK_LIFT[o.type], cz) : null;
    ui.marker(`obj:${o.id}`, s?.x ?? 0, s?.y ?? 0, s?.visible ? 'pray' : null);
  }
}

// ---------- Rufe (content/barks.js) ----------
const barkNext = new Map(); // npc -> Zeitpunkt des nächsten Rufs
const barkIdx = new Map();  // npc -> nächste Zeile
let barkCheck = 0;

// Der Crier: zuerst die Nacht im Überblick, dann der Stand des Leuchtfeuers
function newsLines() {
  const last = CHRONICLE[CHRONICLE.length - 1];
  const out = [];
  if (last) {
    out.push(`HEAR YE! Day ${last.day}: ${last.title}!`);
    out.push(...String(last.text).split(/(?<=[.!?])\s+/).slice(0, 2));
  }
  if (community && typeof community.beacon === 'number') {
    const pct = Math.min(100, Math.round((community.beacon / BEACON_GOAL) * 100));
    out.push(pct >= 100 ? 'The Beacon BLAZES tonight! Well fed, Kindle!' : `The Beacon stands at ${pct}%! Bring it fuel before midnight!`);
  }
  return out;
}

function barks(now) {
  if (now - barkCheck < 500) return;
  barkCheck = now;
  const self = mirror.ents.get(mirror.you);
  if (!self) return;
  for (const e of mirror.ents.values()) {
    if (e.kind !== 'npc' || ui.dialogNpc === e.id) continue;
    const dist = Math.max(Math.abs(e.x - self.x), Math.abs(e.y - self.y));
    const next = barkNext.get(e.id) ?? 0;

    // Crier: regelmäßig, solange man in Hörweite ist
    const b = BARKS[e.id];
    if (b) {
      if (dist > b.range) continue;
      if (!barkNext.has(e.id)) { barkNext.set(e.id, now + 2000 + Math.random() * 3000); continue; }
      if (now < next) continue;
      const lines = b.news ? [...newsLines(), ...b.lines] : b.lines;
      const i = (barkIdx.get(e.id) ?? 0) % lines.length;
      barkIdx.set(e.id, i + 1);
      ui.bubble(e.id, lines[i], 5000, b.shout ? 'npc shout' : 'npc');
      barkNext.set(e.id, now + b.every * 1000 * (0.85 + Math.random() * 0.3));
      continue;
    }

    // Wer eine neue Quest hat ("!"), ruft einmal beim Vorbeigehen
    if (markers.get(e.id) !== '!' || dist > HAIL_RANGE || now < next) continue;
    ui.bubble(e.id, HAILS[e.id] ?? HAIL_DEFAULT, 5000, 'npc');
    barkNext.set(e.id, now + HAIL_COOLDOWN * 1000);
  }
}

// ---------- Sprechen: Enter öffnet die Zeile, Enter sendet, Esc bricht ab ----------
const chatForm = document.getElementById('chat-form');
const chatText = document.getElementById('chat-text');
function openChat() {
  chatForm.hidden = false;
  chatText.value = '';
  chatText.focus();
}
function closeChat() {
  chatForm.hidden = true;
  chatText.blur();
}
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatText.value.trim();
  if (text) send({ t: 'chat', text });
  closeChat();
});
chatText.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); closeChat(); }
  e.stopPropagation();
});
chatText.addEventListener('blur', () => { if (!chatText.value.trim()) chatForm.hidden = true; });

function flushEvents(events) {
  for (const e of events) {
    if (e.type === 'log') { ui.log(e.text, e.cls); sfx.log(e.text, e.cls); }
    else if (e.type === 'float') {
      const v = visuals.get(e.ent);
      if (v) {
        const s = screenOf(v);
        // Schadenszahlen ohne Klasse: eigener Schaden rot, ausgeteilter hell; große Treffer größer.
        let cls = e.cls;
        if (!cls && /^\d+$/.test(e.text)) {
          // Groß: deutlich über dem gleitenden Schnitt der letzten Treffer dieser Art.
          const kind = e.ent === mirror.you ? 'taken' : 'dealt';
          const n = Number(e.text);
          const avg = hitAvg[kind] ?? n;
          cls = n >= avg * 1.5 && n >= 4 ? `${kind} big` : kind;
          hitAvg[kind] = avg * 0.8 + n * 0.2;
        }
        ui.floater(s.x, s.y, e.text, cls);
        sfx.float(e, cls, mirror.you);
      }
    } else if (e.type === 'dialog') {
      const npc = mirror.ents.get(e.npc);
      if (npc) ui.openDialog(npc.id, npc.name, e.page, e.options, npc.sprite, mirror.ents.get(mirror.you)?.sprite);
    } else if (e.type === 'dialogEnd') ui.closeDialog();
    else if (e.type === 'shop') { ui.closeDialog(); windows.open('shop', { shop: e.shop }); }
    else if (e.type === 'craft') windows.open('craft', { obj: e.obj, station: e.station });
    else if (e.type === 'node') objects.setDepleted(e.id, e.left <= 0);
    else if (e.type === 'window') { ui.closeDialog(); windows.open(e.win); }
    else if (e.type === 'travel') {
      rememberRegion(e.region);
      windows.closeAll();
      // Häuser betreten und verlassen ohne großes Zwischenbild
      if (e.region !== 'kindle_inside' && region?.id !== 'kindle_inside') banner('THE WAY OPENS...');
    }
    else if (e.type === 'community') { community = e.community; windows.setCommunity(e.community); }
    else if (e.type === 'tradeAsk') { windows.open('tradeask', { from: e.from, name: e.name }); sfx.ui(); }
    else if (e.type === 'partyInvite') { windows.open('partyask', { from: e.from, name: e.name }); sfx.ui(); }
    else if (e.type === 'trade') windows.open('trade', e);
    else if (e.type === 'tradeEnd') {
      windows.close('tradeask');
      if (windows.isOpen('trade')) windows.close('trade');
      if (e.done) sfx.play?.('coin');
    }
    else if (e.type === 'chat') {
      ui.bubble(e.ent, e.text, 5000, e.ent === mirror.you ? 'me' : '');
      ui.chatLine(e.ent === mirror.you ? 'You' : mirror.ents.get(e.ent)?.name ?? 'Someone', e.text, e.ent === mirror.you);
      sfx.ui();
    }
    else if (e.type === 'telegraph') addTelegraph(e.t);
    else if (e.type === 'telegraphEnd') removeTelegraph(e.id);
    else if (e.type === 'lit') setLit(e.id, e.lit !== false);
    else if (e.type === 'cast') {
      sfx.cast(e, mirror.you);
      if (e.id === 'flare' && e.by === mirror.you) flareUntil = performance.now() + 450;
    }
    else if (e.type === 'respawn') {
      ui.closeDialog();
      snapCamera = true;
    }
  }
}

function onMessage(msg) {
  if (msg.t === 'welcome') {
    if (msg.sig && msg.sig !== CONTENT_SIG) banner('KINDLE HAS CHANGED. TAP HERE TO RELOAD.');
    loadRegion(msg.region, msg.regionDate);
    rememberRegion(msg.region);
    mirror.you = msg.you;
    for (const o of mirror.objects) setLit(o.id, msg.lit.includes(o.id));
    for (const o of mirror.objects) if (o.type === 'node') objects.setDepleted(o.id, msg.depleted.includes(o.id));
    community = msg.community;
    today = msg.date || today;
    windows.setCommunity(msg.community, msg.date);
    showNews();
    for (const id of [...telegraphs.keys()]) removeTelegraph(id);
    for (const t of msg.telegraphs) addTelegraph(t);
    for (const id of [...visuals.keys()]) removeVisual(id);
    mirror.ents.clear();
    snapCamera = true;
    login.hide();
    banner(null);
    document.getElementById('btn-leave').hidden = conn?.offline !== false;
    if (!greeted) ui.log(conn?.offline ? 'OFFLINE. The world runs in your browser; progress stays on this device.' : `Welcome to Kindle, ${msg.name}.`, 'sys');
    else ui.log(`You arrive: ${region.name}.`, 'sys');
    greeted = true;
    return;
  }
  if (msg.t === 'tick') {
    for (const meta of msg.spawn) {
      const old = mirror.ents.get(meta.id);
      if (old && !old.fresh) {
        // Bekannte Figur mit neuem Aussehen (Klassenwechsel): Bild austauschen, Lage behalten.
        if (old.sprite !== meta.sprite) {
          Object.assign(old, meta);
          removeVisual(meta.id);
          addVisual(old);
        }
        continue;
      }
      const ent = { ...meta, x: 0, y: 0, px: 0, py: 0, hp: 0, dead: false, dazzled: false, fresh: true };
      mirror.ents.set(meta.id, ent);
    }
    for (const [id, x, y, hp, flags, maxHp] of msg.ents) {
      const e = mirror.ents.get(id);
      if (!e) continue;
      // Neu gesehen oder weit gesprungen (Aufwachen): nicht hingleiten.
      const jump = e.fresh || Math.abs(e.x - x) > 2 || Math.abs(e.y - y) > 2;
      e.px = jump ? x : e.x;
      e.py = jump ? y : e.y;
      e.x = x;
      e.y = y;
      e.hp = hp;
      e.maxHp = maxHp;
      e.dead = !!(flags & 1);
      e.dazzled = !!(flags & 2);
      if (e.fresh) { e.fresh = false; addVisual(e); }
    }
    for (const id of msg.gone) {
      mirror.ents.delete(id);
      removeVisual(id);
    }
    mirror.me = msg.me;
    mirror.tick = msg.tick;
    if (msg.state) {
      const first = !mirror.state;
      mirror.state = msg.state;
      windows.setState(msg.state);
      ui.setToday(todayState());
      updateMarkers();
      if (first && !msg.state.cls) ui.log('Warden Ama stands by the Beacon. Talk to her to begin. (Look for the lantern above her head.)', 'good');
      // Erinnerung beim Einloggen: Altar in der Kapelle (Kerze über der Kapelle)
      const t = todayState();
      if (first && msg.state.cls && ((t.canPray && !t.prayed) || !t.voted)) {
        ui.log(`The altar in the Chapel is waiting: ${t.canPray && !t.prayed ? 'say a prayer' : ''}${t.canPray && !t.prayed && !t.voted ? ' and ' : ''}${!t.voted ? 'cast your vote' : ''} today. Follow the candle.`, 'good');
      }
    }
    if (mirror.state) ui.setBar(mirror.state.bar, mirror.state);
    mirror.arrivedAt = performance.now();
    flushEvents(msg.events);
    return;
  }
  if (msg.t === 'answered') {
    ui.log(`Your prayer was heard. ${msg.note || 'Look around Kindle tomorrow.'}`, 'good');
    ui.floater(window.innerWidth / 2, window.innerHeight / 3, 'YOUR PRAYER WAS HEARD', 'info');
    return;
  }
  if (msg.t === 'error') {
    ui.log(msg.error, 'hurt');
    return;
  }
  if (msg.t === 'closed') onClosed(msg);
}

// Wer etwas für mich hat: ! = neue Quest, ? = etwas abzugeben. Dieselbe Prüfung wie auf dem Server.
const markers = new Map();
function updateMarkers() {
  markers.clear();
  const s = mirror.state;
  if (!s) return;
  for (const [npc, pages] of Object.entries(TALK)) {
    const opts = (pages.start?.options || []).filter((o) => o.do && conditionHolds(s, o.if));
    if (opts.some((o) => o.do.some((d) => d.advance))) markers.set(npc, '?');
    else if (opts.some((o) => o.do.some((d) => d.start || d.chooseClass))) markers.set(npc, '!');
  }
}

// „Last night…“: einmal pro neuem Chronik-Eintrag beim Einloggen zeigen.
function showNews() {
  const day = CHRONICLE[CHRONICLE.length - 1].day;
  let seen = -1;
  try { seen = Number(localStorage.getItem('overnight2.newsSeen') ?? -1); } catch { /* egal */ }
  if (seen >= day) return;
  windows.open('news');
  try { localStorage.setItem('overnight2.newsSeen', String(day)); } catch { /* egal */ }
}

let retry = 0;
function onClosed(msg) {
  conn = null;
  // 4001: Anmeldung ungültig, 4002: woanders angemeldet, 4003: zu viele Nachrichten.
  if (msg.code === 4001) {
    forgetToken();
    login.show('Your name was forgotten by the Beacon. Please sign in again.');
    return;
  }
  // 4005: Reise in ein anderes Gebiet, 4006: der Server hat sich gerade erneuert. Gleich neu verbinden.
  if (msg.code === 4005 || msg.code === 4006) {
    connect();
    return;
  }
  if (msg.code === 4002) {
    banner('You stepped into Kindle somewhere else. Reload to come back here.');
    return;
  }
  retry++;
  banner(`THE LINE TO KINDLE IS DOWN. RETRYING… (${retry})`);
  setTimeout(() => connect(), Math.min(15000, 1000 * 2 ** Math.min(retry, 4)));
}

const TOKEN_KEY = 'overnight2.token';
function getToken() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
function forgetToken() { try { localStorage.removeItem(TOKEN_KEY); } catch { /* egal */ } }

function connect() {
  const token = getToken();
  if (!token) { login.show(); return; }
  conn = new NetConnection(SERVER, token, savedRegion(), onMessage);
  conn.ws.addEventListener('open', () => { retry = 0; });
}

function playOffline() {
  conn?.close();
  conn = new LocalConnection(onMessage, { clock: gameDate });
  login.hide();
}

const bannerEl = document.getElementById('banner');
function banner(text) {
  bannerEl.hidden = !text;
  bannerEl.textContent = text || '';
}
bannerEl.addEventListener('click', () => location.reload());

const login = createLogin(SERVER, {
  onToken(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* egal */ }
    connect();
  },
  onOffline: playOffline,
});

document.getElementById('btn-leave').addEventListener('click', async () => {
  const token = getToken();
  forgetToken();
  conn?.close();
  conn = null;
  if (token) login.logout(token);
  login.show('You left Kindle. Your place by the fire is kept.');
});

// ---------- Eingabe ----------

const raycaster = new THREE.Raycaster();
const crtOn = () => document.documentElement.classList.contains('crt-on');

// Bildschirmpunkt -> Punkt im Bild der Szene (der CRT-Shader wölbt das Bild).
function toNdc(clientX, clientY) {
  let u = clientX / window.innerWidth;
  let v = 1 - clientY / window.innerHeight;
  if (crtOn()) {
    let x = u * 2 - 1, y = v * 2 - 1;
    const ox = Math.abs(y) / 6, oy = Math.abs(x) / 5;
    x += x * ox * ox;
    y += y * oy * oy;
    u = x * 0.5 + 0.5;
    v = y * 0.5 + 0.5;
  }
  return new THREE.Vector2(u * 2 - 1, v * 2 - 1);
}

function pick(clientX, clientY) {
  raycaster.setFromCamera(toNdc(clientX, clientY), camera);
  const targets = [];
  for (const v of visuals.values()) {
    if (v.ent.id === mirror.you || v.ent.dead) continue;
    targets.push(...v.sprite.meshes);
  }
  const hits = raycaster.intersectObjects([...targets, ...objects.pickables, terrain.mesh], true);
  for (const h of hits) {
    const ref = h.object.userData.ref;
    if (ref) return { ref };
    if (h.object.userData.kind && h.instanceId !== undefined) {
      return { kind: h.object.userData.kind, cell: h.object.userData.cells[h.instanceId] };
    }
    if (h.object === terrain.mesh) {
      const x = Math.floor(h.point.x);
      const y = Math.floor(h.point.z);
      // Das ganze Feld zählt: Wer oder was dort steht, ist gemeint (nicht nur die Figur selbst).
      return tileOccupant(x, y) || { ground: { x, y } };
    }
  }
  return null;
}

// Was steht auf dem Feld? Lebende Wesen vor Figuren vor anderen Spielern vor Objekten.
const OCCUPANT_ORDER = { mob: 0, npc: 1, player: 2 };
function tileOccupant(x, y) {
  let best = null;
  for (const e of mirror.ents.values()) {
    if (e.id === mirror.you || e.dead || e.x !== x || e.y !== y) continue;
    if (!best || OCCUPANT_ORDER[e.kind] < OCCUPANT_ORDER[best.kind]) best = e;
  }
  if (best) return { ref: { kind: best.kind, id: best.id } };
  const o = mirror.objects.find((ob) => x >= ob.x && x < ob.x + ob.w && y >= ob.y && y < ob.y + ob.d);
  return o ? { ref: { kind: 'object', id: o.id } } : null;
}

// Fundstellen und Werkbänke der eigenen Berufe leuchten leicht
let glowSig = '';
function updateProfessionGlow() {
  const profs = mirror.state?.profs || {};
  const sig = `${region?.id}|${Object.keys(profs).sort().join(',')}`;
  if (sig === glowSig || !objects) return;
  glowSig = sig;
  const stations = new Set(Object.keys(profs).map((p) => PROFESSIONS[p]?.station).filter(Boolean));
  for (const o of mirror.objects) {
    const mine = (o.type === 'node' && profs[NODES[o.node]?.prof]) || (o.type === 'station' && stations.has(o.station));
    objects.setGlow(o.id, !!mine);
  }
}

const objectName = (o) => o.name || o.type;

function describe(hit) {
  if (!hit) return null;
  if (hit.ref) {
    const ent = findEntity(hit.ref);
    if (!ent) return null;
    if (hit.ref.kind === 'mob') return { verb: 'Attack', noun: ent.name };
    if (hit.ref.kind === 'npc') return { verb: 'Talk-to', noun: ent.name };
    if (hit.ref.kind === 'player') return { verb: '', noun: ent.name };
    const [, label] = objectActions(ent)[0];
    return { verb: label, noun: objectName(ent) };
  }
  if (hit.kind) return { verb: 'Examine', noun: hit.kind === 'tree' ? 'Tree' : 'Rock' };
  if (hit.ground) return { verb: 'Walk here', noun: '' };
  return null;
}

// Nur offline (Tests im Browser): eigene Lage und Kamera abfragen
if (OFFLINE) window.overnightDebug = { me: () => { const e = mirror.ents.get(mirror.you); return e && { x: e.x, y: e.y }; }, yaw: () => rig.yaw };

// ---------- WASD: laufen relativ zur Kamera ----------
// W = auf dem Bildschirm nach oben. Gesendet wird ein Ziel zwei Felder voraus, solange die Tasten
// gedrückt sind; beim Loslassen bleibt die Figur auf ihrem Feld stehen.
function walkableHere(x, y) {
  if (!region || y < 0 || x < 0 || y >= region.tiles.length || x >= region.tiles[0].length) return false;
  if (!TILE_TYPES[region.tiles[y][x]]?.walk) return false;
  return !mirror.objects.some((o) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.d);
}
let wasdSent = 0;
let wasdTarget = null;
function wasd(now) {
  const self = mirror.ents.get(mirror.you);
  const ix = (held.has('d') ? 1 : 0) - (held.has('a') ? 1 : 0);
  const iy = (held.has('w') ? 1 : 0) - (held.has('s') ? 1 : 0);
  if (!self) return;
  if (!ix && !iy) {
    if (wasdTarget) { send({ t: 'walk', x: self.x, y: self.y }); wasdTarget = null; }
    return;
  }
  // Bildschirm-Richtung in Welt-Richtung: rechts = (cos, -sin), vorn = (-sin, -cos)
  const wx = ix * Math.cos(rig.yaw) - iy * Math.sin(rig.yaw);
  const wz = -ix * Math.sin(rig.yaw) - iy * Math.cos(rig.yaw);
  const ang = Math.atan2(wz, wx);
  const dx = Math.round(Math.cos(ang));
  const dz = Math.round(Math.sin(ang));
  let tx = self.x + dx * 2;
  let ty = self.y + dz * 2;
  if (!walkableHere(tx, ty) || !walkableHere(self.x + dx, self.y + dz)) {
    // diagonal blockiert: an der Kante entlang gleiten
    const alt = [[dx, 0], [0, dz]].find(([ax, az]) => (ax || az) && walkableHere(self.x + ax, self.y + az));
    if (!alt) return;
    tx = self.x + alt[0];
    ty = self.y + alt[1];
  }
  if (wasdTarget && wasdTarget.x === tx && wasdTarget.y === ty && now - wasdSent < 250) return;
  wasdTarget = { x: tx, y: ty };
  wasdSent = now;
  send({ t: 'walk', x: tx, y: ty });
  if (ui.dialogNpc) ui.closeDialog(true);
}

function walkGround(tile) {
  send({ t: 'walk', x: tile.x, y: tile.y });
  marker.visible = true;
  marker.position.set(tile.x + 0.5, terrain.heightAt(tile.x + 0.5, tile.y + 0.5) + 0.06, tile.y + 0.5);
  markerAge = 0;
}

function act(ref, action) {
  send({ t: 'act', kind: ref.kind, id: ref.id, action });
}

function primary(hit) {
  if (!hit) return;
  ui.closeMenu();
  if (hit.ref) {
    const ent = findEntity(hit.ref);
    if (!ent) return;
    if (hit.ref.kind === 'mob') act(hit.ref, 'attack');
    else if (hit.ref.kind === 'npc') act(hit.ref, 'talk');
    else if (hit.ref.kind === 'object') act(hit.ref, objectActions(ent)[0][0]);
  } else if (hit.kind) {
    ui.log(EXAMINE[hit.kind], 'sys');
  } else if (hit.ground) {
    walkGround(hit.ground);
  }
}

function contextMenu(hit, x, y) {
  const entries = [];
  const ent = hit?.ref && findEntity(hit.ref);
  if (ent) {
    const run = (action) => () => act(hit.ref, action);
    if (hit.ref.kind === 'mob') entries.push({ verb: 'Attack', noun: ent.name, fn: run('attack') }, { verb: 'Examine', noun: ent.name, fn: run('examine') });
    else if (hit.ref.kind === 'npc') entries.push({ verb: 'Talk-to', noun: ent.name, fn: run('talk') }, { verb: 'Examine', noun: ent.name, fn: run('examine') });
    else if (hit.ref.kind === 'object') for (const [action, label] of objectActions(ent)) entries.push({ verb: label, noun: objectName(ent), fn: run(action) });
    else if (ent.kind === 'player' && ent.id !== mirror.you) {
      entries.push({ verb: 'Trade with', noun: ent.name, fn: () => send({ t: 'tradeAsk', id: ent.id }) });
      if (!mirror.state?.party?.members.some((m) => m.id === ent.id)) entries.push({ verb: 'Invite to party', noun: ent.name, fn: () => send({ t: 'partyInvite', id: ent.id }) });
    }
  } else if (hit?.kind) {
    entries.push({ verb: 'Examine', noun: hit.kind === 'tree' ? 'Tree' : 'Rock', fn: () => ui.log(EXAMINE[hit.kind], 'sys') });
  }
  if (hit?.ground) entries.push({ verb: 'Walk here', fn: () => walkGround(hit.ground) });
  entries.push({ verb: 'Cancel' });
  ui.openMenu(x, y, entries);
}

// Maus und Touch
const pointers = new Map();
let hoverAt = null;
let drag = null;
let longPress = null;
let pinchDist = 0;

canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    clearTimeout(longPress);
    drag = null;
    return;
  }
  drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, button: e.button, moved: false, type: e.pointerType };
  if (e.pointerType !== 'mouse') {
    longPress = setTimeout(() => {
      if (drag && !drag.moved) {
        contextMenu(pick(drag.sx, drag.sy), drag.sx, drag.sy);
        drag = null;
      }
    }, 450);
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    rig.dist = THREE.MathUtils.clamp(rig.dist * (pinchDist / d), 7, 28);
    pinchDist = d;
    return;
  }
  if (drag) {
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 12) drag.moved = true;
    // Kamera drehen: mittlere Maustaste, oder am Handy mit einem Finger ziehen.
    if (drag.moved && (drag.button === 1 || drag.type !== 'mouse')) {
      rig.yaw -= dx * 0.008;
      rig.pitch = THREE.MathUtils.clamp(rig.pitch + dy * 0.005, 0.45, 1.3);
    }
    drag.x = e.clientX;
    drag.y = e.clientY;
  }
  if (e.pointerType === 'mouse') hoverAt = { x: e.clientX, y: e.clientY };
});
function endPointer(e) {
  pointers.delete(e.pointerId);
  clearTimeout(longPress);
  if (!drag) return;
  const d = drag;
  drag = null;
  if (e.type === 'pointercancel') return;
  // Nur echtes Kameraziehen (mittlere Taste, Finger) schluckt den Klick. Mit linker/rechter
  // Maustaste zählt der Klick auch bei schneller Bewegung, und zwar dort, wo gedrückt wurde.
  if (d.moved && (d.button === 1 || d.type !== 'mouse')) return;
  if (d.button === 2) contextMenu(pick(d.sx, d.sy), d.sx, d.sy);
  else if (d.button === 0) primary(pick(d.sx, d.sy));
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', () => { hoverAt = null; ui.setHover(null); });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  rig.dist = THREE.MathUtils.clamp(rig.dist * (1 + Math.sign(e.deltaY) * 0.1), 7, 28);
}, { passive: false });
document.addEventListener('pointerdown', (e) => {
  if (ui.menuOpen() && !e.target.closest('#menu')) ui.closeMenu();
});

// Tastatur
const held = new Set();
window.addEventListener('keydown', (e) => {
  if (e.target.closest?.('input, textarea')) return;
  const k = e.key;
  if (k === 'Tab') {
    e.preventDefault();
    send({ t: 'cycle' });
    return;
  }
  if (k === 'Escape') {
    if (ui.menuOpen()) ui.closeMenu();
    else if (ui.assigning) ui.endAssign();
    else if (windows.any) windows.close();
    else if (ui.dialogNpc) ui.closeDialog(true);
    else send({ t: 'target', id: null });
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (k === 'Enter') { e.preventDefault(); openChat(); return; }
  // Im Gespräch wählen Zahlen Antworten.
  if (/^[1-9]$/.test(k) && ui.dialogKey(Number(k))) return;
  const key = k.length === 1 ? k.toLowerCase() : k;
  const slot = ui.keys.indexOf(key);
  if (slot >= 0) {
    useBarSlot(slot);
    return;
  }
  if (key === 'c') { windows.toggle('char'); return; }
  if (key === 'b' || key === 'i') { windows.toggle('bag'); return; }
  if (key === 'j') { windows.toggle('quests'); return; }
  if (key === 'o') { windows.toggle('settings'); return; }
  held.add(k.toLowerCase());
});
window.addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => held.clear());

for (const id of ['cam-left', 'cam-right']) {
  const b = document.getElementById(id);
  b.addEventListener('pointerdown', () => held.add(id));
  b.addEventListener('pointerup', () => held.delete(id));
  b.addEventListener('pointerleave', () => held.delete(id));
}

// ---------- Tag und Nacht ----------

// Zum Ausprobieren: ?hour=17.5 setzt die Berliner Uhrzeit, ?speed=600 lässt die Zeit schneller laufen.
// Das ändert nur das Bild; online rechnet der Server mit der echten Uhrzeit.
const params = new URLSearchParams(location.search);
const startReal = Date.now();
let clockOffset = 0;
if (params.has('hour')) {
  const [h, m] = berlinClock(new Date()).split(':').map(Number);
  clockOffset = (Number(params.get('hour')) - (h + m / 60)) * 3600000;
}
const speed = Number(params.get('speed')) || 1;
function gameDate() {
  return new Date(startReal + (Date.now() - startReal) * speed + clockOffset);
}

const PHASE_LINES = {
  DAWN: ['Dawn. The Grey thins a little.', 'good'],
  DAY: ['Day. Even the Greylings squint.', 'good'],
  DUSK: ['The light is going. The Grey grows bold.', 'hurt'],
  NIGHT: ['Night. Keep your wick trimmed.', 'hurt'],
};
let lastPhase = null;
function updateSky(now) {
  if (now - lastSky < 250) return;
  lastSky = now;
  const date = gameDate();
  const sky = skyState(date);
  // Unter der Erde gibt es keinen Himmel, im Drift nur einen trüben.
  // Häuser: warmes Dämmerlicht, dunkle Ecken statt Grey
  if (region?.sheltered) view.setSky(0.5, 0.35, [0.05, 0.034, 0.022]);
  else if (region?.indoor) view.setSky(0, 0);
  else if (region?.murk !== undefined) view.setSky(Math.min(sky.day, region.murk), sky.dusk * 0.3);
  else view.setSky(sky.day, sky.dusk);
  const mins = minutesToMidnight(date);
  const note = sky.phase === 'NIGHT' || sky.phase === 'DUSK'
    ? `MIDNIGHT ${mins >= 60 ? `${Math.floor(mins / 60)}H ` : ''}${mins % 60}M`
    : '';
  let placeLabel = sky.phase;
  if (region?.place) placeLabel = region.place;
  else if (region?.indoor) placeLabel = 'UNDERGROUND';
  else if (region?.murk !== undefined) placeLabel = 'IN THE GREY';
  ui.updateSky(berlinClock(date), placeLabel, note);
  if (lastPhase && lastPhase !== sky.phase) ui.log(...PHASE_LINES[sky.phase]);
  if (!lastPhase) ui.log(`It is ${sky.phase.toLowerCase()} in Kindle. ${berlinClock(date)}, Kindle time.`, 'sys');
  lastPhase = sky.phase;
  // Nachts, unter der Erde und im Grey klingt die Musik dunkler.
  music.setNight(sky.phase === 'NIGHT' || !!region?.indoor || region?.murk !== undefined);
}

// ---------- Schleife ----------

let last = performance.now();
const camTarget = new THREE.Vector3();

function entPos(v, alpha, out) {
  const e = v.ent;
  const x = e.px + (e.x - e.px) * alpha + 0.5;
  const z = e.py + (e.y - e.py) * alpha + 0.5;
  // Höchster Punkt unter den Füßen, damit am Hang nichts im Boden versinkt.
  let y = terrain.heightAt(x, z);
  for (const [ox, oz] of [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]]) y = Math.max(y, terrain.heightAt(x + ox, z + oz));
  return out.set(x, y, z);
}

function frame(now) {
  updateSky(now);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const alpha = Math.min(1, (now - mirror.arrivedAt) / TICK_MS);
  const t = now / 1000;

  // Kamera drehen
  const turn = (held.has('arrowleft') || held.has('q') || held.has('cam-left') ? 1 : 0)
    - (held.has('arrowright') || held.has('e') || held.has('cam-right') ? 1 : 0);
  rig.yaw += turn * dt * 1.8;
  if (held.has('arrowup')) rig.pitch = Math.min(1.3, rig.pitch + dt);
  if (held.has('arrowdown')) rig.pitch = Math.max(0.45, rig.pitch - dt);

  wasd(now);

  // Figuren setzen
  const right = new THREE.Vector3(Math.cos(rig.yaw), 0, -Math.sin(rig.yaw));
  for (const v of visuals.values()) {
    const prev = v.pos.clone();
    entPos(v, alpha, v.pos);
    const e = v.ent;
    const moving = e.x !== e.px || e.y !== e.py;
    const mx = v.pos.x - prev.x, mz = v.pos.z - prev.z;
    const side = mx * right.x + mz * right.z;
    if (Math.abs(side) > 0.002) v.flip = side < 0 ? -1 : 1;
    v.sprite.setFrame(moving ? Math.floor(t * 6) % 2 : 0);
    v.fade = THREE.MathUtils.lerp(v.fade, e.dead ? 0 : 1, 0.2);
    v.sprite.group.visible = v.fade > 0.05;
    v.shadow.visible = v.fade > 0.05;
    v.sprite.group.position.copy(v.pos);
    v.sprite.group.rotation.y = rig.yaw;
    v.sprite.group.scale.set(v.flip, 1, 1);
    // Greylinge schweben leicht
    if (e.type === 'greyling') v.sprite.group.position.y += 0.08 + Math.sin(t * 3 + v.bob) * 0.06;
    v.shadow.position.set(v.pos.x, v.pos.y + 0.03, v.pos.z);
  }

  const self = mirror.ents.get(mirror.you);
  const selfVis = visuals.get(mirror.you);
  const me = mirror.me;

  // Kamera folgt dem Spieler weich
  if (selfVis) {
    camTarget.copy(selfVis.pos);
    if (snapCamera) { rig.target.copy(camTarget); snapCamera = false; }
    rig.target.lerp(camTarget, 1 - Math.pow(0.002, dt));
  }

  // Licht: feste Quellen flackern, dazu die Laternen aller Spieler (die eigene zuerst)
  const lights = mirror.objects
    .filter((o) => o.light && o.lit)
    .map((o, i) => ({ x: o.x + o.w / 2, y: o.y + o.d / 2, r: o.light * (1 + Math.sin(t * 7 + i * 3) * 0.02 + Math.sin(t * 13 + i) * 0.015), w: 1 }));
  if (selfVis && me) {
    const flare = now < flareUntil ? 1 + (flareUntil - now) / 450 * 1.6 : 1;
    lights.unshift({ x: selfVis.pos.x, y: selfVis.pos.z, r: lanternRadius(me.oil, me.light) * flare * (1 + Math.sin(t * 9) * 0.03), w: 1 });
  }
  for (const v of visuals.values()) {
    if (v.ent.kind === 'player' && v.ent.id !== mirror.you) lights.push({ x: v.pos.x, y: v.pos.z, r: 4, w: 0.9 });
  }
  setLights(lights, t);
  if (selfVis) lightUniforms.uSee.value.copy(selfVis.pos);

  // Flammen drehen sich wie die Figuren zur Kamera.
  updateProfessionGlow();
  objects.pulseGlow(t);
  for (const f of objects.flames) {
    f.setFrame(Math.floor(t * 5 + f.group.id) % 2);
    f.group.rotation.y = rig.yaw;
  }

  // Zielring
  const target = me?.target ? mirror.ents.get(me.target) : null;
  ring.visible = !!target && !target.dead && visuals.has(target.id);
  if (ring.visible) {
    const tv = visuals.get(target.id);
    ring.position.set(tv.pos.x, tv.pos.y + 0.05, tv.pos.z);
    ring.material.color.set(me.engaged ? '#ff6b4a' : '#ffb347');
  }
  let note = '';
  if (target && self) {
    if (target.dazzled) note = 'DAZZLED';
    else if (cheb(self.x, self.y, target.x, target.y) > 1) note = 'OUT OF REACH';
  }
  ui.updateTarget(target && !target.dead ? target : null, note);

  // Angekündigte Felder pulsieren
  for (const g of telegraphs.values()) {
    const k = Math.min(1, (performance.now() - g.userData.start) / g.userData.ms);
    // Erst blass, dann kräftiger; kurz vor dem Einschlag schnelles Flackern
    const flick = k > 0.8 ? 0.15 * Math.sin(t * 40) : 0.05 * Math.sin(t * 10);
    g.userData.mat.opacity = 0.15 + 0.55 * k + flick;
  }

  // Klickmarke verblasst
  if (marker.visible) {
    markerAge += dt;
    marker.material.opacity = Math.max(0, 1 - markerAge / 0.8);
    marker.rotation.y += dt * 3;
    if (markerAge > 0.8) marker.visible = false;
  }

  // Herstell- und Händlerfenster schließen, wenn man wegläuft (Gespräche schließt der Server).
  if (self && windows.isOpen('craft')) {
    const o = mirror.objects.find((x) => x.id === windows.optsOf('craft').obj);
    if (!o || cheb(self.x, self.y, Math.max(o.x, Math.min(self.x, o.x + o.w - 1)), Math.max(o.y, Math.min(self.y, o.y + o.d - 1))) > 1) windows.close('craft');
  }
  if (self && windows.isOpen('shop')) {
    const n = mirror.ents.get(SHOPS[windows.optsOf('shop').shop]?.npc);
    if (!n || cheb(n.x, n.y, self.x, self.y) > 2) windows.close('shop');
  }

  view.render();

  // HP-Balken über verletzten Wesen, Namen über anderen Spielern
  for (const v of visuals.values()) {
    const e = v.ent;
    if (e.kind === 'player' && e.id !== mirror.you) {
      const s = screenOf(v, 0.1);
      ui.nameTag(e.id, s.x, s.y, s.visible ? e.name : null);
      continue;
    }
    if (e.kind === 'npc') {
      const mark = markers.get(e.id);
      const s = screenOf(v, 0.1);
      ui.marker(e.id, s.x, s.y, mark && s.visible ? (mark === '?' ? 'turnin' : 'quest') : null);
      continue;
    }
    if (e.kind !== 'mob') continue;
    if (e.dead || e.hp >= e.maxHp) { ui.overhead(e.id, 0, 0, null); continue; }
    const s = screenOf(v, 0.15);
    ui.overhead(e.id, s.x, s.y, s.visible ? e.hp / e.maxHp : null);
  }

  // Sprechblasen folgen den Köpfen; Figuren in der Nähe rufen von selbst
  ui.placeBubbles((id) => {
    const v = visuals.get(id);
    if (!v) return null;
    const s = screenOf(v, 0.45);
    return s.visible ? s : null;
  });
  barks(now);
  placeDailyMarks();
  placeBeacon();
  ui.updateParty(mirror.state?.party ?? null, mirror.ents, mirror.you);

  // Zeigertext (Maus)
  if (hoverAt && !drag && !ui.menuOpen()) {
    const d = describe(pick(hoverAt.x, hoverAt.y));
    ui.setHover(d ? `${d.verb} ${d.noun}`.trim() : null, hoverAt.x, hoverAt.y);
    canvas.style.cursor = d && d.verb && d.verb !== 'Walk here' ? 'pointer' : 'crosshair';
  } else if (!hoverAt) {
    ui.setHover(null);
  }

  if (me) {
    const zone = self && region.zoneAt ? region.zoneAt(self.x, self.y) : region.name;
    if (zone !== lastZone) {
      if (lastZone && zone !== 'KINDLE') ui.log(`You enter: ${zone}.`, 'sys');
      lastZone = zone;
    }
    ui.updateStatus(me, zone);
    ui.updateBar(me, mirror.tick, alpha);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- Start ----------

ui.log('OVERNIGHT 2 // PROTOTYPE // DAY 0', 'sys');
if (OFFLINE) playOffline();
else if (getToken()) connect();
else login.show();

// Für Tests und Neugierige
window.__overnight = { mirror, view, windows, get conn() { return conn; } };
