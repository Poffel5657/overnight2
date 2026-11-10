// Objekte aus Grundformen: Häuser, Kapelle, Werkstatt, Stände, Feuer, Bäume, Felsen.
// Jede Art ist eine kleine Bauanleitung. Neue Arten kommen als weitere Funktion in BUILDERS dazu.

import * as THREE from 'three';
import { TILE_TYPES } from '../../content/tiles.js';
import { NODES } from '../../content/nodes.js';
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
const emberMat = new THREE.MeshBasicMaterial({ color: '#ff6a2a' });
const glimmerMat = new THREE.MeshBasicMaterial({ color: '#9fe0ff' });
const mossGlow = new THREE.MeshBasicMaterial({ color: '#9aff7a' });
const riftMat = new THREE.MeshBasicMaterial({ color: '#c8e8ff', transparent: true, opacity: 0.75, side: THREE.DoubleSide });

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

// Fundstellen (content/nodes.js, Feld look) und Werkstationen (Feld station).
const LOOKS = {
  heap(g) {
    for (const [x, z, s, r, c] of [[-0.15, 0.1, 0.35, 0.3, '#5a5048'], [0.18, -0.08, 0.3, 1.1, '#6a5a48'], [0.02, 0.18, 0.22, 2, '#7a4a30'], [0.1, 0.05, 0.18, 0.7, '#4a4a50']]) {
      g.add(box(s, s * 0.7, s * 1.3, c, x, s * 0.35, z).rotateY(r).rotateZ(r * 0.3));
    }
    g.add(box(0.5, 0.04, 0.3, '#8a6a3a', 0, 0.32, 0).rotateZ(0.5));
  },
  wreck(g) {
    const hull = box(0.9, 0.35, 0.45, '#9a7a3a', 0, 0.2, 0);
    hull.rotation.z = 0.35;
    g.add(hull);
    for (const x of [-0.3, 0, 0.3]) g.add(box(0.06, 0.6, 0.06, '#c8a050', x, 0.4, 0.2));
    g.add(box(0.2, 0.1, 0.2, glimmerMat, 0.25, 0.42, -0.1));
  },
  cart(g) {
    g.add(box(0.8, 0.3, 0.5, '#6a4a2a', 0, 0.35, 0).rotateZ(0.12));
    for (const [x, z] of [[-0.3, 0.28], [0.3, 0.28]]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 4, 8), mat('#5a5048'));
      wheel.position.set(x, 0.18, z);
      g.add(wheel);
    }
    g.add(box(0.5, 0.1, 0.06, '#8a6a3a', 0.45, 0.25, 0).rotateZ(-0.6));
  },
  seam(g) {
    g.add(box(0.8, 0.6, 0.5, '#6a645a', 0, 0.3, 0).rotateY(0.3));
    for (const [x, y] of [[-0.2, 0.45], [0.15, 0.3], [0.05, 0.55]]) g.add(box(0.14, 0.08, 0.52, '#c8803a', x, y, 0).rotateY(0.3));
  },
  vein(g) {
    g.add(box(0.7, 0.8, 0.6, '#5a5650', 0, 0.4, 0).rotateY(-0.4));
    for (const [x, y] of [[-0.15, 0.6], [0.2, 0.4], [0, 0.25]]) g.add(box(0.1, 0.1, 0.62, glimmerMat, x, y, 0).rotateY(-0.4));
  },
  cache(g) {
    g.add(box(0.7, 0.4, 0.5, '#3a4040', 0, 0.12, 0).rotateZ(0.2));
    g.add(box(0.16, 0.16, 0.16, glimmerMat, 0.15, 0.36, 0.05));
    g.add(box(0.3, 0.05, 0.3, '#2f5a5a', -0.2, 0.02, 0.2));
  },
  moss(g) {
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3;
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 5, 4), mat(i % 2 ? '#4a7a3a' : '#6a9a4a')).translateX(Math.cos(a) * 0.2).translateZ(Math.sin(a) * 0.2).translateY(0.1));
    }
    g.add(box(0.08, 0.08, 0.08, mossGlow, 0, 0.25, 0));
  },
  shrooms(g) {
    for (let i = 0; i < 5; i++) {
      const a = i * 1.25;
      const x = Math.cos(a) * 0.25, z = Math.sin(a) * 0.25;
      g.add(box(0.05, 0.18, 0.05, '#d8d0c0', x, 0.09, z));
      g.add(new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.1, 6), i % 2 ? mat('#6a4a8a') : mossGlow).translateX(x).translateZ(z).translateY(0.22));
    }
  },
  lily(g) {
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 8), mat('#3a6a3a')).translateY(0.03));
    for (let i = 0; i < 4; i++) g.add(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 4), mat('#e8e0f0')).translateX(Math.cos(i * 1.6) * 0.08).translateZ(Math.sin(i * 1.6) * 0.08).translateY(0.13));
  },
  herbs(g) {
    for (let i = 0; i < 6; i++) {
      const a = i * 1.1;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), mat(i % 2 ? '#6a9a3a' : '#8aa848'));
      leaf.position.set(Math.cos(a) * 0.22, 0.17, Math.sin(a) * 0.22);
      leaf.rotation.z = Math.cos(a) * 0.4;
      g.add(leaf);
    }
  },
  hive(g) {
    g.add(box(0.08, 0.7, 0.08, '#5a4028', 0, 0.35, 0));
    g.add(new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 0), mat('#b08a40')).translateY(0.75));
  },
  ember(g) {
    for (let i = 0; i < 4; i++) {
      const a = i * 1.6;
      const r = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 4), emberMat);
      r.position.set(Math.cos(a) * 0.18, 0.14, Math.sin(a) * 0.18);
      g.add(r);
    }
  },
  waymark(g) {
    g.add(box(0.3, 1.0, 0.3, '#8a847a', 0, 0.5, 0));
    g.add(box(0.36, 0.12, 0.36, '#6a645a', 0, 1.05, 0));
  },
  signpost(g) {
    const post = box(0.1, 1.4, 0.1, '#5a4028', 0, 0.7, 0);
    post.rotation.z = 0.2;
    g.add(post);
    g.add(box(0.6, 0.16, 0.05, '#7a5a34', 0.2, 1.2, 0.05).rotateZ(0.05));
  },
  workbench(g, o) {
    g.add(box(o.w - 0.2, 0.1, o.d - 0.2, '#7a5a34', 0, 0.7, 0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.08, 0.7, 0.08, '#5a4028', sx * (o.w / 2 - 0.2), 0.35, sz * (o.d / 2 - 0.2)));
    g.add(box(0.25, 0.2, 0.2, '#4a4a50', 0, 0.85, -0.3));
    g.add(box(0.15, 0.06, 0.4, '#8a8a90', 0.1, 0.78, 0.4));
  },
  still(g) {
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.6, 8), mat('#b06a3a')).translateY(0.5));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat('#c07a4a')).translateY(0.85));
    g.add(box(0.5, 0.05, 0.05, '#8a5a30', 0.3, 0.95, 0).rotateZ(-0.4));
    g.add(box(0.3, 0.15, 0.3, emberMat, 0, 0.1, 0));
  },
  lampbench(g) {
    g.add(box(0.8, 0.08, 0.6, '#6a5a40', 0, 0.65, 0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.06, 0.65, 0.06, '#4a3420', sx * 0.32, 0.32, sz * 0.22));
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 6, 12), glimmerMat);
    lens.position.y = 0.85;
    g.add(lens);
  },
};

const BUILDERS = {
  find(o, g) {
    // Das Fundstück des Tages: ein schiefer Gegenstand im Nebel, mit einem kalten Schimmer darüber.
    g.add(box(0.6, 0.5, 0.4, '#6a645a', 0, 0.25, 0).rotateZ(0.4).rotateY(0.6));
    g.add(box(0.3, 0.6, 0.3, '#8a847a', 0.25, 0.3, -0.1).rotateZ(-0.3));
    const glint = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), glimmerMat);
    glint.position.y = 1.1;
    g.add(glint);
  },
  chest(o, g) {
    g.add(box(0.7, 0.4, 0.45, '#5a3a20', 0, 0.2, 0));
    g.add(box(0.72, 0.12, 0.47, '#6a4a2a', 0, 0.46, 0));
    g.add(box(0.1, 0.12, 0.05, '#c8a040', 0, 0.36, 0.24));
  },
  shrine(o, g) {
    g.add(box(0.8, 0.5, 0.5, '#6a6a60', 0, 0.25, 0));
    g.add(box(0.6, 0.9, 0.12, '#5a5a52', 0, 0.9, -0.15));
    for (const x of [-0.25, 0, 0.25]) g.add(box(0.06, 0.14, 0.06, '#e8dcc0', x, 0.57, 0.1));
  },
  door(o, g, ctx) {
    if (o.look === 'stairs') {
      for (let i = 0; i < 4; i++) g.add(box(0.9, 0.12, 0.25, '#6a6660', 0, 0.06 + i * 0.12, 0.35 - i * 0.22));
      g.add(box(1.1, 1.6, 0.15, '#4a4844', 0, 0.8, -0.45));
      g.add(box(0.5, 0.9, 0.05, '#0a0a0c', 0, 0.45, -0.37));
    } else {
      // Ein Riss im Grey: zwei schiefe Pfosten und flackerndes kaltes Licht dazwischen
      g.add(box(0.12, 1.8, 0.12, '#3a3a40', -0.45, 0.9, 0).rotateZ(0.1));
      g.add(box(0.12, 1.7, 0.12, '#3a3a40', 0.45, 0.85, 0).rotateZ(-0.12));
      g.add(box(0.7, 1.4, 0.04, riftMat, 0, 0.8, 0));
    }
  },
  brazier(o, g, ctx) {
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.18, 0.5, 6), mat('#3a3434')).translateY(0.55));
    g.add(box(0.08, 0.35, 0.08, '#2a2424', 0, 0.17, 0));
    ctx.flame(g, 0.8, 0.75);
  },
  false_light(o, g, ctx) {
    g.add(box(o.w - 0.2, 0.8, o.d - 0.1, '#5a5650', 0, 0.4, 0));
    g.add(box(0.1, 1.6, 0.1, '#2a2a30', 0, 1.6, 0));
    const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), riftMat);
    lamp.position.y = 2.5;
    g.add(lamp);
  },
  board(o, g) {
    for (const x of [-0.35, 0.35]) g.add(box(0.08, 1.4, 0.08, '#5a4028', x, 0.7, 0));
    g.add(box(0.9, 0.7, 0.06, '#7a5a34', 0, 1.05, 0));
    for (const [x, y, c] of [[-0.2, 1.15, '#e8dcc0'], [0.15, 1.0, '#d8c8a0'], [0.05, 1.22, '#f0e4c8']]) g.add(box(0.22, 0.26, 0.02, c, x, y, 0.04));
  },
  altar(o, g) {
    g.add(box(1.6, 0.6, 0.7, '#8a847a', 0, 0.3, 0));
    g.add(box(1.8, 0.12, 0.8, '#6a645a', 0, 0.66, 0));
    for (const x of [-0.6, 0, 0.6]) g.add(box(0.3, 0.25, 0.25, '#5a4028', x, 0.85, 0.15));
    g.add(box(0.12, 0.2, 0.12, glowMat, 0, 0.82, -0.2));
  },
  node(o, g) { (LOOKS[NODES[o.node].look] || LOOKS.heap)(g, o); },
  station(o, g) { (LOOKS[o.station] || LOOKS.workbench)(g, o); },
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
  const groupByObject = new Map();
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
    groupByObject.set(o.id, g);
  }

  // Leere Fundstellen schrumpfen, bis sie nachwachsen.
  function setDepleted(id, depleted) {
    const g = groupByObject.get(id);
    if (g) g.scale.set(depleted ? 0.7 : 1, depleted ? 0.35 : 1, depleted ? 0.7 : 1);
  }

  // Bäume und Felsen aus dem Raster als Instanzen (schnell, auch bei Hunderten).
  const trees = [];
  const rocks = [];
  const walls = [];
  region.tiles.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (blocked.has(`${x},${y}`)) return;
      const kind = TILE_TYPES[ch]?.object;
      if (kind === 'tree') trees.push({ x, y });
      if (kind === 'rock') rocks.push({ x, y });
      if (kind === 'wall') walls.push({ x, y });
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

  // Mauern (Innenräume, Ruinen): Steinblöcke, durchsichtig, wenn sie den Spieler verdecken.
  const wallMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 2.2, 1).translate(0, 1.0, 0),
    litMaterial(new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), 0.1, true), Math.max(1, walls.length));
  wallMesh.count = walls.length;
  walls.forEach((t, i) => {
    m4.compose(new THREE.Vector3(t.x + 0.5, heightAt(t.x + 0.5, t.y + 0.5) - 0.2, t.y + 0.5), new THREE.Quaternion(), new THREE.Vector3(1, 0.9 + hash(t.x, t.y, 9) * 0.25, 1));
    wallMesh.setMatrixAt(i, m4);
    wallMesh.setColorAt(i, color.set('#5a5650').multiplyScalar(0.8 + hash(t.x, t.y, 10) * 0.35));
  });
  wallMesh.userData.cells = walls;
  wallMesh.userData.kind = 'wall';

  root.add(trunks, crowns, rockMesh, wallMesh);
  pickables.push(trunks, crowns, rockMesh);
  return { root, pickables, flames, flameByObject, setDepleted };
}
