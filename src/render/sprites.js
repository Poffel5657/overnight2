// Pixel-Sprites aus content/sprites.js: Jedes Bild wird einmal in eine kleine Textur gemalt.
// Leuchtende Pixel ('!' in der Palette) landen in einer zweiten Textur ohne Nebel,
// damit Augen und Flammen auch im Grey zu sehen sind.

import * as THREE from 'three';
import { SPRITES } from '../../content/sprites.js';
import { litMaterial } from './light.js';

const cache = new Map();

function frameRows(def) {
  const frames = [def.rows];
  if (def.walk) {
    const rows = def.rows.slice(0, def.rows.length - def.walk.length).concat(def.walk);
    frames.push(rows);
  }
  if (def.frames) frames.push(...def.frames);
  return frames;
}

function paint(rows, palette, glow) {
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  let any = false;
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const c = palette[ch];
      if (!c) return;
      const isGlow = c.startsWith('!');
      if (isGlow !== glow) return;
      ctx.fillStyle = isGlow ? c.slice(1) : c;
      ctx.fillRect(x, y, 1, 1);
      any = true;
    });
  });
  if (!any) return null;
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

export function spriteSheet(id) {
  if (cache.has(id)) return cache.get(id);
  const def = SPRITES[id];
  if (!def) throw new Error(`Unknown sprite: ${id}`);
  const frames = frameRows(def).map((rows) => ({
    base: paint(rows, def.palette, false),
    glow: paint(rows, def.palette, true),
  }));
  const w = Math.max(...def.rows.map((r) => r.length));
  const sheet = { frames, w: w * def.px, h: def.rows.length * def.px };
  cache.set(id, sheet);
  return sheet;
}

// Eine Figur als Billboard, das sich zur Kamera dreht. Der Fußpunkt liegt bei (0, 0, 0).
export function makeSprite(id, scale = 1) {
  const sheet = spriteSheet(id);
  const geo = new THREE.PlaneGeometry(sheet.w * scale, sheet.h * scale);
  geo.translate(0, (sheet.h * scale) / 2, 0);
  const group = new THREE.Group();
  const first = sheet.frames[0];
  let base = null;
  let glow = null;
  if (first.base || sheet.frames.some((f) => f.base)) {
    base = new THREE.Mesh(geo, litMaterial(new THREE.MeshBasicMaterial({ map: first.base, alphaTest: 0.5, side: THREE.DoubleSide }), 0.12));
    group.add(base);
  }
  if (sheet.frames.some((f) => f.glow)) {
    glow = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: first.glow, alphaTest: 0.5, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    }));
    glow.visible = !!first.glow;
    group.add(glow);
  }
  let current = 0;
  return {
    group,
    height: sheet.h * scale,
    frameCount: sheet.frames.length,
    meshes: [base, glow].filter(Boolean),
    setFrame(i) {
      i %= sheet.frames.length;
      if (i === current) return;
      current = i;
      const f = sheet.frames[i];
      if (base) { base.material.map = f.base; base.visible = !!f.base; }
      if (glow) { glow.material.map = f.glow; glow.visible = !!f.glow; }
    },
  };
}
