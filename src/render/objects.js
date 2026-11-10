// Objekte aus Grundformen: Häuser, Kapelle, Werkstatt, Stände, Feuer, Bäume, Felsen.
// Jede Art ist eine kleine Bauanleitung. Neue Arten kommen als weitere Funktion in BUILDERS dazu.

import * as THREE from 'three';
import { TILE_TYPES } from '../../content/tiles.js';
import { litMaterial } from './light.js';
import { makeSprite } from './sprites.js';

// Alle Objekt-Materialien schneiden sich zwischen Kamera und Spieler auf (wie die Baumkronen),
// damit Häuser und Dächer die eigene Figur nie verdecken.
const mats = new Map();
function mat(color) {
  if (!mats.has(color)) mats.set(color, litMaterial(new THREE.MeshLambertMaterial({ color, flatShading: true }), 0.14, true));
  return mats.get(color);
}
const glowMat = new THREE.MeshBasicMaterial({ color: '#ffcf70' });
const forgeMat = new THREE.MeshBasicMaterial({ color: '#ff8a3a' });

function hash(x, y, s = 0) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

function box(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'string' ? mat(color) : color);
  m.position.set(x, y, z);
  return m;
}

// Pyramidendach über einer Grundfläche w x d.
function roof(w, d, h, color, y) {
  const g = new THREE.ConeGeometry(Math.SQRT1_2 * 1, h, 4, 1);
  g.rotateY(Math.PI / 4);
  g.scale(w, 1, d);
  const m = new THREE.Mesh(g, mat(color));
  m.position.y = y + h / 2;
  return m;
}

// Der Boden unter Objekten ist eingeebnet (terrain.js), die Mitte ist also die Grundhöhe.
function footprintBase(o, heightAt) {
  return heightAt(o.x + o.w / 2, o.y + o.d / 2);
}

const BUILDERS = {
  house(o, g) {
    const wall = 1.3;
    g.add(box(o.w - 0.2, wall + 1, o.d - 0.2, '#a08664', 0, (wall - 1) / 2, 0));
    g.add(roof(o.w + 0.2, o.d + 0.2, 1.1, o.roof || '#7a3b26', wall));
    g.add(box(0.5, 0.85, 0.06, '#3e2a18', 0, 0.42, o.d / 2 - 0.08));
    g.add(box(0.3, 0.28, 0.06, glowMat, -o.w / 4 - 0.1, 0.8, o.d / 2 - 0.08));
    g.add(box(0.3, 0.28, 0.06, glowMat, o.w / 4 + 0.1, 0.8, o.d / 2 - 0.08));
  },
  chapel(o, g) {
    const wall = 2.0;
    g.add(box(o.w - 0.4, wall + 1, o.d - 0.4, '#b8b0a0', 0, (wall - 1) / 2, 0));
    g.add(roof(o.w, o.d, 2.0, '#4a4e5a', wall));
    // Turm vorne mit Spitze
    const tower = new THREE.Group();
    tower.add(box(1.1, 4.2, 1.1, '#aaa292', 0, 1.1, 0));
    tower.add(roof(1.4, 1.4, 1.6, '#4a4e5a', 3.2));
    tower.add(box(0.3, 0.45, 0.06, glowMat, 0, 2.5, 0.56));
    tower.position.set(0, 0, o.d / 2 - 0.6);
    g.add(tower);
    g.add(box(0.8, 1.2, 0.06, '#3e2a18', 0, 0.6, o.d / 2 - 0.02));
    for (const sx of [-1, 1]) g.add(box(0.25, 0.6, 0.06, glowMat, sx * (o.w / 2 - 0.2), 1.1, 0.4).rotateY(Math.PI / 2));
  },
  workshop(o, g) {
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      g.add(box(0.15, 1.6, 0.15, '#5a4028', sx * (o.w / 2 - 0.3), 0.8, sz * (o.d / 2 - 0.3)));
    }
    const r = box(o.w + 0.2, 0.12, o.d + 0.3, '#6b5a40', 0, 1.65, 0);
    r.rotation.x = 0.18;
    g.add(r);
    g.add(box(1.0, 0.7, 0.8, '#3a3a3e', 0.6, 0.35, 0.1));
    g.add(box(0.5, 0.3, 0.4, forgeMat, 0.6, 0.75, 0.1));
    g.add(box(0.5, 0.5, 0.5, '#8a6a40', -0.9, 0.25, 0.4));
    g.add(box(0.4, 0.4, 0.4, '#7a5a34', -1.1, 0.7, 0.3));
    g.add(box(0.7, 0.35, 0.3, '#4a4a50', -0.4, 0.45, -0.6));
  },
  stall(o, g) {
    g.add(box(o.w - 0.4, 0.7, o.d - 0.6, '#7a5a34', 0, 0.35, 0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      g.add(box(0.1, 1.5, 0.1, '#5a4028', sx * (o.w / 2 - 0.25), 0.75, sz * (o.d / 2 - 0.25)));
    }
    const a = box(o.w, 0.08, o.d, o.awning || '#8a2f2f', 0, 1.55, 0);
    a.rotation.x = -0.15;
    g.add(a);
    g.add(box(0.3, 0.2, 0.3, '#c8a040', -0.5, 0.8, 0));
    g.add(box(0.25, 0.25, 0.25, '#7a8a40', 0.4, 0.82, 0.05));
  },
  beacon(o, g, ctx) {
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.15, 0.7, 8), mat('#7a746a')).translateY(0.35));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.6, 0.35, 8), mat('#3a3434')).translateY(0.85));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      g.add(box(0.3, 1.6, 0.3, '#8a847a', Math.cos(a) * 1.35, 0.8, Math.sin(a) * 1.35));
    }
    ctx.flame(g, 1.9, 0.95);
  },
  campfire(o, g, ctx) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      g.add(box(0.16, 0.12, 0.16, '#6a6460', Math.cos(a) * 0.36, 0.06, Math.sin(a) * 0.36));
    }
    g.add(box(0.6, 0.1, 0.1, '#5a3a20', 0, 0.08, 0).rotateY(0.6));
    g.add(box(0.6, 0.1, 0.1, '#5a3a20', 0, 0.1, 0).rotateY(-0.6));
    ctx.flame(g, 1.1, 0.05);
  },
  signal(o, g, ctx) {
    g.add(new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.0, 6), mat('#6a4a2a')).translateY(0.5));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.add(box(0.14, 0.12, 0.14, '#6a6460', Math.cos(a) * 0.5, 0.06, Math.sin(a) * 0.5));
    }
    g.add(box(0.08, 1.8, 0.08, '#4a3420', 0.45, 0.9, -0.3));
    ctx.flame(g, 1.7, 0.35, !o.lit);
  },
};

export function buildObjects(world, region, heightAt) {
  const root = new THREE.Group();
  const pickables = [];
  const flames = [];
  const flameByObject = new Map();
  const blocked = new Set();

  for (const o of world.objects) {
    for (let y = o.y; y < o.y + o.d; y++) for (let x = o.x; x < o.x + o.w; x++) blocked.add(`${x},${y}`);
    const g = new THREE.Group();
    const ctx = {
      flame(parent, scale, y, hidden = false) {
        const s = makeSprite('flame', scale);
        s.group.position.y = y;
        s.group.visible = !hidden;
        parent.add(s.group);
        flames.push(s);
        flameByObject.set(o.id, s);
      },
    };
    (BUILDERS[o.type] || BUILDERS.house)(o, g, ctx);
    g.position.set(o.x + o.w / 2, footprintBase(o, heightAt), o.y + o.d / 2);
    g.traverse((c) => { c.userData.ref = { kind: 'object', id: o.id }; });
    root.add(g);
    pickables.push(g);
  }

  // Bäume und Felsen aus dem Raster als Instanzen (schnell, auch bei Hunderten).
  const trees = [];
  const rocks = [];
  region.tiles.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (blocked.has(`${x},${y}`)) return;
      const kind = TILE_TYPES[ch]?.object;
      if (kind === 'tree') trees.push({ x, y });
      if (kind === 'rock') rocks.push({ x, y });
    });
  });

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();

  const trunkGeo = new THREE.CylinderGeometry(0.09, 0.13, 0.7, 5).translate(0, 0.35, 0);
  const crownGeo = new THREE.ConeGeometry(0.55, 1.5, 6).translate(0, 1.3, 0);
  const trunks = new THREE.InstancedMesh(trunkGeo, mat('#5a3f26'), trees.length);
  const crowns = new THREE.InstancedMesh(crownGeo, litMaterial(new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), 0.14, true), trees.length);
  trees.forEach((t, i) => {
    const s = 0.8 + hash(t.x, t.y, 1) * 0.5;
    const tall = t.y < 16 ? 1.35 : 1;
    q.setFromAxisAngle(up, hash(t.x, t.y, 2) * Math.PI * 2);
    const px = t.x + 0.5 + (hash(t.x, t.y, 3) - 0.5) * 0.3;
    const pz = t.y + 0.5 + (hash(t.x, t.y, 4) - 0.5) * 0.3;
    m4.compose(new THREE.Vector3(px, heightAt(px, pz) - 0.05, pz), q, new THREE.Vector3(s, s * tall, s));
    trunks.setMatrixAt(i, m4);
    crowns.setMatrixAt(i, m4);
    color.set(t.y < 16 ? '#2f5a34' : '#3f7030').multiplyScalar(0.85 + hash(t.x, t.y, 5) * 0.3);
    crowns.setColorAt(i, color);
  });
  trunks.userData.cells = trees;
  crowns.userData.cells = trees;
  trunks.userData.kind = crowns.userData.kind = 'tree';

  const rockGeo = new THREE.DodecahedronGeometry(0.42, 0).translate(0, 0.25, 0);
  const rockMesh = new THREE.InstancedMesh(rockGeo, litMaterial(new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true })), Math.max(1, rocks.length));
  rockMesh.count = rocks.length;
  rocks.forEach((r, i) => {
    const s = 0.9 + hash(r.x, r.y, 6) * 0.6;
    q.setFromAxisAngle(up, hash(r.x, r.y, 7) * Math.PI * 2);
    m4.compose(new THREE.Vector3(r.x + 0.5, heightAt(r.x + 0.5, r.y + 0.5), r.y + 0.5), q, new THREE.Vector3(s, s * 0.8, s));
    rockMesh.setMatrixAt(i, m4);
    rockMesh.setColorAt(i, color.set(hash(r.x, r.y, 8) < 0.5 ? '#8a7a68' : '#9a6a48'));
  });
  rockMesh.userData.cells = rocks;
  rockMesh.userData.kind = 'rock';

  root.add(trunks, crowns, rockMesh);
  pickables.push(trunks, crowns, rockMesh);
  return { root, pickables, flames, flameByObject };
}
