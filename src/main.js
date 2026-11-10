// Overnight 2, Prototyp: verbindet Spiellogik (shared/sim.js), Darstellung (src/render/) und Oberfläche.
// Heute läuft die Simulation im Browser, später schickt der Server dieselben Ereignisse.

import * as THREE from 'three';
import { REGION } from '../content/regions/kindle.js';
import { DEFAULT_BAR } from '../content/abilities.js';
import { EXAMINE } from '../content/npcs.js';
import {
  TICK_MS, createWorld, step, walkTo, interact, cycleTarget, setTarget, useAbility,
  dialogAction, objectActions, findEntity, lanternRadius, staticLightAt,
} from '../shared/sim.js';
import { cheb } from '../shared/path.js';
import { createView, buildGreyWall } from './render/view.js';
import { buildTerrain } from './render/terrain.js';
import { buildObjects } from './render/objects.js';
import { makeSprite } from './render/sprites.js';
import { setLights, lightUniforms } from './render/light.js';
import { createUI } from './ui.js';
import { skyState, berlinClock, minutesToMidnight } from '../shared/daylight.js';

const canvas = document.getElementById('view');
const view = createView(canvas);
const { scene, camera, rig } = view;

const world = createWorld(REGION, Date.now() & 0xffff);
const terrain = buildTerrain(REGION);
scene.add(terrain.mesh, terrain.water, buildGreyWall(terrain.W, terrain.H));
const objects = buildObjects(world, REGION, terrain.heightAt);
scene.add(objects.root);

// ---------- Figuren ----------

const shadowGeo = new THREE.CircleGeometry(0.32, 12).rotateX(-Math.PI / 2);
const shadowMat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35, depthWrite: false });
const visuals = new Map();

function addVisual(ent) {
  const s = makeSprite(ent.sprite);
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.renderOrder = 1;
  const ref = ent.kind === 'player' ? null : { kind: ent.kind, id: ent.id };
  for (const m of s.meshes) m.userData.ref = ref;
  scene.add(s.group, shadow);
  const v = { ent, sprite: s, shadow, pos: new THREE.Vector3(), flip: 1, fade: 1 };
  visuals.set(ent.id, v);
  return v;
}
const playerVis = addVisual(world.player);
world.npcs.forEach(addVisual);
world.mobs.forEach(addVisual);

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

// ---------- Oberfläche ----------

const ui = createUI({
  ability(i) {
    const id = DEFAULT_BAR[i];
    if (!id) return;
    useAbility(world, id);
    ui.flashSlot(i);
  },
  dialogAction(npcId, action) { dialogAction(world, npcId, action); flushEvents(world.events.splice(0)); },
  crt(on) { view.setCrt(on); },
});
ui.buildBar(DEFAULT_BAR);
try {
  if (localStorage.getItem('overnight2.crt') === '0') document.getElementById('btn-crt').click();
} catch { /* egal */ }
ui.log('OVERNIGHT 2 // PROTOTYPE // DAY 0', 'sys');
ui.log('You stand in Kindle, by the Beacon. Beyond the fields: the Grey.');
ui.log('Click to walk. Click a Greyling to fight. TAB, 1-9 for abilities.', 'sys');

// ---------- Ereignisse aus der Simulation ----------

let flareUntil = 0;
let snapCamera = true;
function screenOf(v, lift = 0) {
  const p = v.pos.clone();
  p.y += v.sprite.height + lift;
  p.project(camera);
  return { x: (p.x * 0.5 + 0.5) * window.innerWidth, y: (-p.y * 0.5 + 0.5) * window.innerHeight, visible: p.z < 1 };
}

function flushEvents(events) {
  for (const e of events) {
    if (e.type === 'log') ui.log(e.text, e.cls);
    else if (e.type === 'float') {
      const v = visuals.get(e.ent);
      if (v) { const s = screenOf(v); ui.floater(s.x, s.y, e.text, e.cls); }
    } else if (e.type === 'dialog') {
      const npc = world.npcs.find((n) => n.id === e.npc);
      ui.openDialog(npc.id, npc.name, e.page);
    } else if (e.type === 'telegraph') {
      const g = new THREE.Group();
      for (const t of e.t.tiles) g.add(new THREE.Mesh(tileQuad(t.x, t.y), teleMat));
      g.renderOrder = 3;
      scene.add(g);
      telegraphs.set(e.t.id, g);
    } else if (e.type === 'telegraphEnd') {
      const g = telegraphs.get(e.id);
      if (g) { scene.remove(g); g.traverse((c) => c.geometry?.dispose()); telegraphs.delete(e.id); }
    } else if (e.type === 'lit') {
      const f = objects.flameByObject.get(e.id);
      if (f) f.group.visible = true;
    } else if (e.type === 'cast' && e.id === 'flare') {
      flareUntil = performance.now() + 450;
    } else if (e.type === 'respawn') {
      ui.closeDialog();
      snapCamera = true;
    }
  }
}

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
    if (v.ent.kind === 'player' || (v.ent.dead)) continue;
    targets.push(...v.sprite.meshes);
  }
  const hits = raycaster.intersectObjects([...targets, ...objects.pickables, terrain.mesh], true);
  for (const h of hits) {
    const ref = h.object.userData.ref;
    if (ref) return { ref, name: findEntity(world, ref)?.name };
    if (h.object.userData.kind && h.instanceId !== undefined) {
      return { kind: h.object.userData.kind, cell: h.object.userData.cells[h.instanceId] };
    }
    if (h.object === terrain.mesh) {
      return { ground: { x: Math.floor(h.point.x), y: Math.floor(h.point.z) } };
    }
  }
  return null;
}

function objectName(o) {
  return o.name || o.type;
}

function describe(hit) {
  if (!hit) return null;
  if (hit.ref) {
    const ent = findEntity(world, hit.ref);
    if (hit.ref.kind === 'mob') return { verb: 'Attack', noun: ent.name };
    if (hit.ref.kind === 'npc') return { verb: 'Talk-to', noun: ent.name };
    const [, label] = objectActions(ent)[0];
    return { verb: label, noun: objectName(ent) };
  }
  if (hit.kind) return { verb: 'Examine', noun: hit.kind === 'tree' ? 'Tree' : 'Rock' };
  if (hit.ground) return { verb: 'Walk here', noun: '' };
  return null;
}

function walkGround(tile) {
  walkTo(world, tile.x, tile.y);
  marker.visible = true;
  marker.position.set(tile.x + 0.5, terrain.heightAt(tile.x + 0.5, tile.y + 0.5) + 0.06, tile.y + 0.5);
  markerAge = 0;
}

function primary(hit) {
  if (!hit) return;
  ui.closeMenu();
  if (hit.ref) {
    const ent = findEntity(world, hit.ref);
    if (hit.ref.kind === 'mob') interact(world, hit.ref, 'attack');
    else if (hit.ref.kind === 'npc') interact(world, hit.ref, 'talk');
    else interact(world, hit.ref, objectActions(ent)[0][0]);
    flushEvents(world.events.splice(0));
  } else if (hit.kind) {
    ui.log(EXAMINE[hit.kind], 'sys');
  } else if (hit.ground) {
    walkGround(hit.ground);
  }
}

function contextMenu(hit, x, y) {
  const entries = [];
  if (hit?.ref) {
    const ent = findEntity(world, hit.ref);
    const run = (action) => () => { interact(world, hit.ref, action); flushEvents(world.events.splice(0)); };
    if (hit.ref.kind === 'mob') entries.push({ verb: 'Attack', noun: ent.name, fn: run('attack') }, { verb: 'Examine', noun: ent.name, fn: run('examine') });
    else if (hit.ref.kind === 'npc') entries.push({ verb: 'Talk-to', noun: ent.name, fn: run('talk') }, { verb: 'Examine', noun: ent.name, fn: run('examine') });
    else for (const [action, label] of objectActions(ent)) entries.push({ verb: label, noun: objectName(ent), fn: run(action) });
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
  if (d.moved || e.type === 'pointercancel') return;
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
    cycleTarget(world);
    return;
  }
  if (k === 'Escape') {
    if (ui.menuOpen()) ui.closeMenu();
    else if (ui.dialogNpc) ui.closeDialog();
    else setTarget(world, null);
    return;
  }
  if (/^[1-9]$/.test(k)) {
    if (!ui.dialogKey(Number(k))) {
      const i = Number(k) - 1;
      if (DEFAULT_BAR[i]) { useAbility(world, DEFAULT_BAR[i]); ui.flashSlot(i); }
    }
    return;
  }
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
const params = new URLSearchParams(location.search);
const startReal = Date.now();
let clockOffset = 0;
if (params.has('hour')) {
  const [h, m] = berlinClock(new Date()).split(':').map(Number);
  clockOffset = (Number(params.get('hour')) - (h + m / 60)) * 3600000;
}
const speed = Number(params.get('speed')) || 1;
const gameDate = () => new Date(startReal + (Date.now() - startReal) * speed + clockOffset);

const PHASE_LINES = {
  DAWN: ['Dawn. The Grey thins a little.', 'good'],
  DAY: ['Day. Even the Greylings squint.', 'good'],
  DUSK: ['The light is going. The Grey grows bold.', 'hurt'],
  NIGHT: ['Night. Keep your wick trimmed.', 'hurt'],
};
let lastPhase = null;
let lastSky = -1;
function updateSky(now) {
  if (now - lastSky < 250) return;
  lastSky = now;
  const date = gameDate();
  const sky = skyState(date);
  world.daylight = sky.day;
  view.setSky(sky.day, sky.dusk);
  const mins = minutesToMidnight(date);
  const note = sky.phase === 'NIGHT' || sky.phase === 'DUSK'
    ? `MIDNIGHT ${mins >= 60 ? `${Math.floor(mins / 60)}H ` : ''}${mins % 60}M`
    : '';
  ui.updateSky(berlinClock(date), sky.phase, note);
  if (lastPhase && lastPhase !== sky.phase) ui.log(...PHASE_LINES[sky.phase]);
  if (!lastPhase) ui.log(`It is ${sky.phase.toLowerCase()} in Kindle. ${berlinClock(date)}, Kindle time.`, 'sys');
  lastPhase = sky.phase;
}

// ---------- Schleife ----------

let acc = 0;
let last = performance.now();
const camTarget = new THREE.Vector3();

function entPos(v, alpha, out) {
  const e = v.ent;
  const x = e.px + (e.x - e.px) * alpha + 0.5;
  const z = e.py + (e.y - e.py) * alpha + 0.5;
  return out.set(x, terrain.heightAt(x, z), z);
}

function frame(now) {
  updateSky(now);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt * 1000;
  while (acc >= TICK_MS) {
    acc -= TICK_MS;
    flushEvents(step(world));
  }
  const alpha = acc / TICK_MS;
  const t = now / 1000;

  // Kamera drehen
  const turn = (held.has('arrowleft') || held.has('q') || held.has('cam-left') ? 1 : 0)
    - (held.has('arrowright') || held.has('e') || held.has('cam-right') ? 1 : 0);
  rig.yaw += turn * dt * 1.8;
  if (held.has('arrowup')) rig.pitch = Math.min(1.3, rig.pitch + dt);
  if (held.has('arrowdown')) rig.pitch = Math.max(0.45, rig.pitch - dt);

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
    if (e.type === 'greyling') v.sprite.group.position.y += 0.08 + Math.sin(t * 3 + e.home.x) * 0.06;
    v.shadow.position.set(v.pos.x, v.pos.y + 0.03, v.pos.z);
  }

  // Kamera folgt dem Spieler weich
  camTarget.copy(playerVis.pos);
  if (snapCamera) { rig.target.copy(camTarget); snapCamera = false; }
  rig.target.lerp(camTarget, 1 - Math.pow(0.002, dt));

  // Licht: feste Quellen flackern, dazu die eigene Laterne
  const p = world.player;
  const flare = now < flareUntil ? 1 + (flareUntil - now) / 450 * 1.6 : 1;
  const lights = world.lights.map((l, i) => ({ x: l.x, y: l.y, r: l.r * (1 + Math.sin(t * 7 + i * 3) * 0.02 + Math.sin(t * 13 + i) * 0.015), w: 1 }));
  lights.push({ x: playerVis.pos.x, y: playerVis.pos.z, r: lanternRadius(p.oil) * flare * (1 + Math.sin(t * 9) * 0.03), w: 1 });
  setLights(lights, t);
  lightUniforms.uSee.value.copy(playerVis.pos);

  // Flammen drehen sich wie die Figuren zur Kamera.
  for (const f of objects.flames) {
    f.setFrame(Math.floor(t * 5 + f.group.id) % 2);
    f.group.rotation.y = rig.yaw;
  }

  // Zielring
  const target = p.target ? world.mobs.find((m) => m.id === p.target) : null;
  ring.visible = !!target && !target.dead;
  if (ring.visible) {
    const tv = visuals.get(target.id);
    ring.position.set(tv.pos.x, tv.pos.y + 0.05, tv.pos.z);
    ring.material.color.set(p.engaged ? '#ff6b4a' : '#ffb347');
  }
  let note = '';
  if (target) {
    const lit = staticLightAt(world, target.x, target.y);
    if (world.tick < target.scaredUntil) note = 'DAZZLED';
    else if (lit < 0.2 && p.oil <= 0) note = 'BOLD IN THE DARK';
    else if (cheb(p.x, p.y, target.x, target.y) > 1) note = 'OUT OF REACH';
  }
  ui.updateTarget(target && !target.dead ? target : null, note);

  // Angekündigte Felder pulsieren
  teleMat.opacity = 0.3 + 0.25 * (0.5 + 0.5 * Math.sin(t * 14));

  // Klickmarke verblasst
  if (marker.visible) {
    markerAge += dt;
    marker.material.opacity = Math.max(0, 1 - markerAge / 0.8);
    marker.rotation.y += dt * 3;
    if (markerAge > 0.8) marker.visible = false;
  }

  // Dialog schließt, wenn man wegläuft
  if (ui.dialogNpc) {
    const n = world.npcs.find((x) => x.id === ui.dialogNpc);
    if (cheb(n.x, n.y, p.x, p.y) > 2) ui.closeDialog();
  }

  view.render();

  // HP-Balken über verletzten Wesen
  for (const m of world.mobs) {
    const v = visuals.get(m.id);
    if (m.dead || m.hp >= m.maxHp) { ui.overhead(m.id, 0, 0, null); continue; }
    const s = screenOf(v, 0.15);
    ui.overhead(m.id, s.x, s.y, s.visible ? m.hp / m.maxHp : null);
  }

  // Zeigertext (Maus)
  if (hoverAt && !drag && !ui.menuOpen()) {
    const d = describe(pick(hoverAt.x, hoverAt.y));
    ui.setHover(d ? `${d.verb} ${d.noun}`.trim() : null, hoverAt.x, hoverAt.y);
    canvas.style.cursor = d && d.verb !== 'Walk here' ? 'pointer' : 'crosshair';
  } else if (!hoverAt) {
    ui.setHover(null);
  }

  ui.updateStatus(p, REGION.name);
  ui.updateBar(p, world.tick, alpha);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Für Tests und Neugierige
window.__overnight = { world, view };
