// Gelände aus dem Text-Raster: ein Feld = zwei Dreiecke, Höhen an den Ecken, Vertex-Farben,
// flach schattiert. Wasser ist eine eigene, halb durchsichtige Fläche darüber.

import * as THREE from 'three';
import { TILE_TYPES, heightFromChar } from '../../content/tiles.js';
import { litMaterial } from './light.js';

export const WATER_LEVEL = -0.12;

function hash(x, y, s = 0) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

export function buildTerrain(region) {
  const H = region.tiles.length;
  const W = region.tiles[0].length;
  const tileH = (x, y) => heightFromChar(region.heights[y][x]);
  const tileCol = (x, y) => new THREE.Color(TILE_TYPES[region.tiles[y][x]]?.color || '#ff00ff');

  // Höhe und Farbe jeder Ecke = Mittel der angrenzenden Felder.
  const cornerH = new Float32Array((W + 1) * (H + 1));
  const cornerC = [];
  for (let cy = 0; cy <= H; cy++) {
    for (let cx = 0; cx <= W; cx++) {
      let sum = 0, n = 0;
      const c = new THREE.Color(0, 0, 0);
      for (let ty = cy - 1; ty <= cy; ty++) {
        for (let tx = cx - 1; tx <= cx; tx++) {
          if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
          sum += tileH(tx, ty);
          c.add(tileCol(tx, ty));
          n++;
        }
      }
      cornerH[cy * (W + 1) + cx] = sum / n;
      cornerC.push(c.multiplyScalar(1 / n));
    }
  }
  const ch = (cx, cy) => cornerH[cy * (W + 1) + cx];
  const cc = (cx, cy) => cornerC[cy * (W + 1) + cx];

  const pos = [];
  const col = [];
  const waterPos = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const base = tileCol(x, y);
      const j = 0.92 + hash(x, y) * 0.16;
      base.multiplyScalar(j);
      const corners = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]];
      const vcol = corners.map(([cx, cy]) => base.clone().lerp(cc(cx, cy), 0.45));
      const vpos = corners.map(([cx, cy]) => [cx, ch(cx, cy), cy]);
      // Dreiecke A-D-C und A-C-B, Normalen zeigen nach oben.
      for (const i of [0, 3, 2, 0, 2, 1]) {
        pos.push(...vpos[i]);
        col.push(vcol[i].r, vcol[i].g, vcol[i].b);
      }
      if (TILE_TYPES[region.tiles[y][x]]?.water) {
        const q = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]].map(([a, b]) => [a, WATER_LEVEL, b]);
        for (const i of [0, 3, 2, 0, 2, 1]) waterPos.push(...q[i]);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, litMaterial(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
  mesh.name = 'terrain';

  const wgeo = new THREE.BufferGeometry();
  wgeo.setAttribute('position', new THREE.Float32BufferAttribute(waterPos, 3));
  wgeo.computeVertexNormals();
  const water = new THREE.Mesh(wgeo, litMaterial(new THREE.MeshLambertMaterial({ color: '#4a8ab4', transparent: true, opacity: 0.78 }), 0.1));
  water.name = 'water';

  // Höhe an einer beliebigen Stelle (bilinear zwischen den Ecken).
  function heightAt(x, z) {
    const cx = Math.min(W - 1, Math.max(0, Math.floor(x)));
    const cz = Math.min(H - 1, Math.max(0, Math.floor(z)));
    const fx = Math.min(1, Math.max(0, x - cx));
    const fz = Math.min(1, Math.max(0, z - cz));
    const a = ch(cx, cz), b = ch(cx + 1, cz), c = ch(cx, cz + 1), d = ch(cx + 1, cz + 1);
    return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz;
  }

  return { mesh, water, heightAt, W, H };
}
