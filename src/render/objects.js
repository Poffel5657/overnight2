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
    if (o.look === 'cold_lantern') {
      // Ein Pfosten mit einer fremden Laterne aus grünem Glas, nach Norden gedreht
      g.add(box(0.12, 1.7, 0.12, '#4a3a2a', 0, 0.85, 0));
      g.add(box(0.5, 0.08, 0.1, '#4a3a2a', 0, 1.6, -0.2));
      g.add(box(0.3, 0.38, 0.3, '#3a5a48', 0, 1.35, -0.38));
      g.add(box(0.36, 0.06, 0.36, '#2a2a2a', 0, 1.56, -0.38));
      g.add(box(0.14, 0.14, 0.14, glimmerMat, 0, 1.34, -0.38));
      return;
    }
    if (o.look === 'offering_box') {
      // Ein Holzkasten mit weißen Stimmsteinen neben dem Altar
      g.add(box(0.6, 0.4, 0.45, '#5a3a20', 0, 0.2, 0));
      g.add(box(0.5, 0.06, 0.35, '#e8e4d8', 0, 0.42, 0));
      g.add(box(0.16, 0.03, 0.1, '#d8c8a0', 0.12, 0.46, 0.05));
      return;
    }
    if (o.look === 'bell_frame') {
      // Ein schiefer Glockenrahmen, halb im Sumpf, mit einer kleinen grünen Glocke
      const frame = new THREE.Group();
      frame.add(box(0.12, 1.6, 0.12, '#3a3020', -0.45, 0.8, 0));
      frame.add(box(0.12, 1.6, 0.12, '#3a3020', 0.45, 0.8, 0));
      frame.add(box(1.1, 0.12, 0.14, '#4a3a26', 0, 1.6, 0));
      frame.add(box(0.04, 0.2, 0.04, '#2a2a2a', 0, 1.45, 0));
      frame.add(box(0.26, 0.26, 0.26, '#4a7a5a', 0, 1.25, 0));
      frame.add(box(0.32, 0.06, 0.32, '#3a6a4a', 0, 1.12, 0));
      frame.rotation.z = 0.12;
      g.add(frame);
      return;
    }
    g.add(box(0.8, 0.5, 0.5, '#6a6a60', 0, 0.25, 0));
    g.add(box(0.6, 0.9, 0.12, '#5a5a52', 0, 0.9, -0.15));
    for (const x of [-0.25, 0, 0.25]) g.add(box(0.06, 0.14, 0.06, '#e8dcc0', x, 0.57, 0.1));
  },
  door(o, g, ctx) {
    if (o.look === 'door') {
      // Holztür in der Wand, mit Lichtspalt unten
      g.add(box(0.9, 1.5, 0.12, '#4a3220', 0, 0.75, 0.3));
      g.add(box(0.75, 1.35, 0.06, '#6a4a2a', 0, 0.7, 0.38));
      g.add(box(0.08, 0.08, 0.06, '#c8a040', 0.25, 0.7, 0.42));
      g.add(box(0.7, 0.04, 0.04, glowMat, 0, 0.03, 0.4));
    } else if (o.look === 'stairs') {
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
  // ---------- Einrichtung (Innenräume) ----------
  pew(o, g) {
    g.add(box(o.w - 0.2, 0.08, 0.45, '#5a3c22', 0, 0.42, 0));
    g.add(box(o.w - 0.2, 0.5, 0.08, '#4a3020', 0, 0.7, -0.22));
    for (const sx of [-1, 1]) g.add(box(0.08, 0.42, 0.45, '#3e2818', sx * (o.w / 2 - 0.15), 0.21, 0));
  },
  candles(o, g, ctx) {
    g.add(box(0.7, 0.5, 0.5, '#5a5048', 0, 0.25, 0));
    for (const [x, z, h] of [[-0.2, -0.1, 0.25], [0, 0.1, 0.35], [0.2, -0.05, 0.2], [-0.05, -0.15, 0.3], [0.15, 0.12, 0.18]]) {
      g.add(box(0.07, h, 0.07, '#efe4c8', x, 0.5 + h / 2, z));
      g.add(box(0.05, 0.06, 0.05, glowMat, x, 0.53 + h, z));
    }
    ctx.flame(g, 0.35, 0.75);
  },
  hearth(o, g, ctx) {
    g.add(box(0.95, 0.9, 0.7, '#6a645a', 0, 0.45, -0.1));
    g.add(box(0.6, 0.45, 0.3, '#1a1412', 0, 0.3, 0.12));
    g.add(box(1.05, 0.1, 0.8, '#5a4a3a', 0, 0.95, -0.1));
    g.add(box(0.4, 1.0, 0.4, '#5a5650', 0, 1.45, -0.25));
    ctx.flame(g, 0.55, 0.12);
  },
  table(o, g) {
    g.add(box(o.w - 0.15, 0.08, o.d - 0.25, '#7a5a34', 0, 0.62, 0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.07, 0.6, 0.07, '#5a4028', sx * (o.w / 2 - 0.15), 0.3, sz * (o.d / 2 - 0.2)));
    g.add(box(0.18, 0.08, 0.18, '#c8b090', -0.15, 0.7, 0.05));
    g.add(box(0.12, 0.16, 0.12, '#8a5a30', 0.2, 0.74, -0.05));
  },
  shelf(o, g) {
    g.add(box(0.9, 1.6, 0.35, '#5a3c22', 0, 0.8, -0.25));
    for (const y of [0.45, 0.9, 1.35]) g.add(box(0.85, 0.05, 0.38, '#7a5a34', 0, y, -0.22));
    for (const [x, y, c] of [[-0.25, 0.55, '#8a6a3a'], [0.05, 0.56, '#4a6a5a'], [0.25, 1.0, '#c8a040'], [-0.15, 1.45, '#7a4a3a']]) g.add(box(0.14, 0.18, 0.14, c, x, y, -0.15));
  },
  bed(o, g) {
    g.add(box(o.w - 0.2, 0.35, 0.85, '#5a3c22', 0, 0.18, 0));
    g.add(box(o.w - 0.3, 0.12, 0.8, '#8a4a3a', 0.05, 0.42, 0));
    g.add(box(0.35, 0.12, 0.6, '#e8dcc0', -(o.w / 2) + 0.35, 0.5, 0));
    g.add(box(0.1, 0.7, 0.9, '#4a3020', -(o.w / 2) + 0.12, 0.35, 0));
  },
  // Taverne: gemietetes Bett mit Vorhangstange, eigene Truhe mit Eisenbändern
  inn_bed(o, g) {
    BUILDERS.bed(o, g);
    g.add(box(0.06, 1.6, 0.06, '#4a3020', o.w / 2 - 0.05, 0.8, 0.45));
    g.add(box(0.05, 1.1, 0.7, '#7a3a3a', o.w / 2 - 0.05, 1.0, 0.1));
  },
  stash(o, g) {
    g.add(box(0.8, 0.45, 0.5, '#4a3018', 0, 0.23, 0));
    g.add(box(0.82, 0.14, 0.52, '#5a3c22', 0, 0.52, 0));
    for (const x of [-0.28, 0.28]) g.add(box(0.06, 0.6, 0.54, '#3a3a40', x, 0.3, 0));
    g.add(box(0.12, 0.14, 0.04, '#c8a040', 0, 0.38, 0.27));
  },
  barrel(o, g) {
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.75, 8), mat('#6a4a2a')).translateY(0.38));
    for (const y of [0.15, 0.6]) g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.315, 0.315, 0.06, 8), mat('#3a3434')).translateY(y));
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
  tavern(o, g) {
    // Zwei Stockwerke, warme Fenster, Schornstein und ein schiefes Schild mit Laterne
    const wall = 2.2;
    g.add(box(o.w - 0.2, wall + 1, o.d - 0.2, '#9a7a56', 0, (wall - 1) / 2, 0));
    g.add(box(o.w - 0.1, 0.12, o.d - 0.1, '#5a3c22', 0, 1.05, 0));
    g.add(roof(o.w + 0.3, o.d + 0.3, 1.3, o.roof || '#5a3020', wall));
    g.add(box(0.5, 1.4, 0.5, '#6a5a50', o.w / 2 - 0.9, wall + 0.9, -0.3));
    const front = o.d / 2 - 0.08;
    g.add(box(0.8, 1.0, 0.06, '#3e2a18', 0, 0.5, front));
    for (const x of [-1.5, -0.8, 0.8, 1.5]) g.add(box(0.36, 0.34, 0.06, glowMat, x, 0.65, front));
    for (const x of [-1.2, 0, 1.2]) g.add(box(0.34, 0.32, 0.06, glowMat, x, 1.6, front));
    // Schild am Ausleger
    g.add(box(0.06, 0.06, 0.7, '#3a2a1a', 0.75, 1.25, front + 0.35));
    g.add(box(0.5, 0.36, 0.05, '#7a5a34', 0.75, 1.0, front + 0.62));
    g.add(box(0.14, 0.14, 0.06, glowMat, 0.75, 1.0, front + 0.66));
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
    // Ein Stand mit eigenem Licht (Nachtmarkt): kleine Laternen unter der Markise
    if (o.light) {
      for (const x of [-0.9, 0, 0.9]) {
        g.add(box(0.03, 0.25, 0.03, '#2a2a2a', x, 1.38, o.d / 2 - 0.3));
        g.add(box(0.16, 0.2, 0.16, glowMat, x, 1.2, o.d / 2 - 0.3));
      }
    }
  },
  lookout(o, g) {
    // Der Ausguck am Nordrand (Tag 2): vier hohe Pfosten, Plattform mit Windschutz aus Wolfsfell,
    // ein spitzes Dach und eine Laterne oben, eine Leiter auf der Südseite.
    const top = 2.6;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      g.add(box(0.16, top + 0.9, 0.16, '#5a4028', sx * (o.w / 2 - 0.3), (top + 0.9) / 2, sz * (o.d / 2 - 0.3)));
    }
    g.add(box(0.08, 0.08, o.d - 0.4, '#4a3420', -(o.w / 2 - 0.3), 1.1, 0).rotateX(0.7));
    g.add(box(0.08, 0.08, o.d - 0.4, '#4a3420', o.w / 2 - 0.3, 1.1, 0).rotateX(-0.7));
    g.add(box(o.w - 0.1, 0.12, o.d - 0.1, '#6a4c2c', 0, top, 0));
    g.add(box(o.w - 0.2, 0.5, 0.08, '#7a7a82', 0, top + 0.3, -(o.d / 2 - 0.1)));
    g.add(box(0.08, 0.5, o.d - 0.2, '#6a6a72', -(o.w / 2 - 0.1), top + 0.3, 0));
    g.add(box(0.08, 0.5, o.d - 0.2, '#6a6a72', o.w / 2 - 0.1, top + 0.3, 0));
    g.add(roof(o.w + 0.1, o.d + 0.1, 0.8, '#4a3a2a', top + 0.9));
    g.add(box(0.22, 0.26, 0.22, glowMat, 0, top + 0.5, 0));
    for (let i = 0; i < 5; i++) g.add(box(0.5, 0.06, 0.06, '#5a4028', 0, 0.35 + i * 0.5, o.d / 2 - 0.1));
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
  // Leuchten für Dinge des eigenen Berufs: ein weicher Lichtring am Boden um die Grundfläche.
  const profGlowMat = new THREE.MeshBasicMaterial({ color: '#ffcf6a', transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const glows = new Map();
  function setGlow(id, on) {
    let ring = glows.get(id);
    if (!on) { if (ring) ring.visible = false; return; }
    if (!ring) {
      const o = world.objects.find((x) => x.id === id);
      const g = groupByObject.get(id);
      if (!o || !g) return;
      const r = Math.max(o.w, o.d) * 0.5;
      ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.75, r * 1.15, 24).rotateX(-Math.PI / 2), profGlowMat);
      ring.position.y = 0.04;
      ring.renderOrder = 2;
      ring.raycast = () => {};
      g.add(ring);
      glows.set(id, ring);
    }
    ring.visible = true;
  }
  // Jedes Bild: sanftes Pulsieren
  function pulseGlow(t) {
    profGlowMat.opacity = 0.22 + 0.18 * (0.5 + 0.5 * Math.sin(t * 2.2));
  }

  return { root, pickables, flames, flameByObject, setDepleted, setGlow, pulseGlow };
}
