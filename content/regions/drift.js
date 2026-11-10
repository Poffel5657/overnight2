// Der Drift: der Rand des Grey hinter den Feldern. Jeden Tag (Berliner Datum) würfelt der Nightwright ihn neu:
// andere Höhlen, andere Wracks, andere Gefahren. Wer etwas findet, bringt es besser heim, bevor es Mitternacht wird.
// Der Generator ist rein (gleiches Datum = gleiche Karte), damit Server und Browser dasselbe sehen.

import { ARRIVE } from './kindle.js';

const W = 48;
const H = 48;

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function hashDate(date) {
  let h = 2166136261;
  for (const c of `drift:${date}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function driftFor(date) {
  const rand = rng(hashDate(date));
  // Was nicht gegraben wird, ist Abgrund in den Grey.
  const grid = Array.from({ length: H }, () => Array(W).fill('x'));
  const hgt = Array.from({ length: H }, () => Array(W).fill('a'));

  // Mehrere Wanderer graben Höhlen in den Nebel, alle vom Eingang unten aus.
  const start = { x: 24, y: 43 };
  for (let k = 0; k < 7; k++) {
    let x = start.x, y = start.y;
    for (let i = 0; i < 260; i++) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx > 1 && ny > 1 && nx < W - 2 && ny < H - 2) grid[ny][nx] = 'd';
      }
      const r = rand();
      if (r < 0.32) y--; else if (r < 0.5) y++; else if (r < 0.75) x--; else x++;
      x = Math.max(3, Math.min(W - 4, x));
      y = Math.max(3, Math.min(H - 4, y));
    }
  }
  // Tote Bäume, Felsen, Tümpel und Höhen
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x] !== 'd') continue;
      const r = rand();
      if (r < 0.04) grid[y][x] = 'T';
      else if (r < 0.06) grid[y][x] = 'r';
      else if (r < 0.075) grid[y][x] = '~';
      hgt[y][x] = 'bcdd'[Math.floor(rand() * 4)];
      if (grid[y][x] === '~') hgt[y][x] = 'a';
    }
  }
  // Eingang freihalten
  for (let y = start.y - 2; y <= start.y + 2; y++) for (let x = start.x - 2; x <= start.x + 2; x++) { grid[y][x] = 'd'; hgt[y][x] = 'c'; }

  const open = [];
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      if (grid[y][x] === 'd' && Math.abs(x - start.x) + Math.abs(y - start.y) > 8) open.push({ x, y });
    }
  }
  const take = () => {
    const i = Math.floor(rand() * open.length);
    return open.splice(i, 1)[0];
  };
  const objects = [
    { type: 'door', to: 'kindle', tx: ARRIVE.rift.x, ty: ARRIVE.rift.y, x: start.x, y: start.y + 3, name: 'the way home', look: 'rift' },
    { type: 'signal', x: start.x + 2, y: start.y - 2, light: 5, name: 'a signal fire' },
  ];
  const nodeTypes = ['brass_wreck', 'brass_wreck', 'rusted_cart', 'emberroot_patch', 'leaning_post', 'wild_hive'];
  for (const node of nodeTypes) if (open.length) objects.push({ type: 'node', node, ...take() });
  for (let i = 0; i < 2 && open.length; i++) objects.push({ type: 'chest', chest: 'drift', name: 'a chest in the fog', ...take() });
  const mobs = [];
  for (let i = 0; i < 9 && open.length; i++) mobs.push({ type: 'greyling', ...take() });
  return {
    id: 'drift',
    name: 'THE DRIFT',
    date,
    daily: true,
    // Im Drift wird es nie richtig hell: der Nebel schluckt die Sonne.
    murk: 0.15,
    tiles: grid.map((r) => r.join('')),
    heights: hgt.map((r) => r.join('')),
    start: { x: start.x, y: start.y },
    deathTo: { region: 'kindle', ...ARRIVE.respawn },
    safeRadius: 0,
    objects,
    npcs: [],
    mobs,
  };
}
