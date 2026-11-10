// Der Drift: der Rand des Grey hinter den Feldern. Jeden Tag (Berliner Datum) würfelt der Nightwright ihn neu:
// andere Höhlen, andere Wracks, andere Gefahren. Je weiter vom Eingang, desto tiefer, gefährlicher und reicher.
// Der Generator ist rein (gleiches Datum = gleiche Karte), damit Server und Browser dasselbe sehen.

import { ARRIVE } from './kindle.js';

const W = 64;
const H = 64;

// Drei Tiefen: Was dort wächst und lebt.
const DEPTHS = [
  { name: 'NEAR', nodes: ['scrap_heap', 'wild_hive', 'bitterleaf_patch', 'waymark'], mobs: ['greyling', 'greyling', 'crow'], count: [5, 7] },
  { name: 'MIDDLE', nodes: ['rusted_cart', 'brass_wreck', 'copper_seam', 'moss_bloom', 'cairn'], mobs: ['wolf', 'moss_spirit', 'greyling'], count: [6, 7] },
  { name: 'DEEP', nodes: ['glimmer_vein', 'sunken_cache', 'nightcap_ring', 'ruin_marker'], mobs: ['will_o_wisp', 'drowned_pilgrim', 'moss_spirit'], count: [5, 6] },
];

// Jeden Tag ein Fundstück mit eigener kleiner Geschichte. Der Nightwright darf die Liste erweitern.
export const DRIFT_FINDS = [
  { name: 'a lighthouse lamp', text: 'A lighthouse lamp, lying on its side. There is no sea for a hundred miles.' },
  { name: 'a stranger\'s camp', text: 'A cold campfire and a bedroll. The boot prints match the Stranger\'s.' },
  { name: 'a signpost to nowhere', text: 'A signpost with every arm pointing deeper into the Grey. All of them say KINDLE.' },
  { name: 'a sunken bell', text: 'A church bell half in the ground. When the wind blows, it almost rings.' },
  { name: 'a child\'s map', text: 'A child\'s map of Kindle, very wrong and very confident. It looks like Fen\'s handwriting.' },
  { name: 'a second beacon', text: 'The cold ashes of a beacon, much like Kindle\'s. Somebody kept a fire here, once.' },
];

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

  // Wanderer graben Höhlen vom Eingang unten in die Tiefe (nach oben).
  const start = { x: 32, y: 58 };
  for (let k = 0; k < 9; k++) {
    let x = start.x, y = start.y;
    for (let i = 0; i < 340; i++) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx > 1 && ny > 1 && nx < W - 2 && ny < H - 2) grid[ny][nx] = 'd';
      }
      const r = rand();
      if (r < 0.34) y--; else if (r < 0.5) y++; else if (r < 0.75) x--; else x++;
      x = Math.max(3, Math.min(W - 4, x));
      y = Math.max(3, Math.min(H - 4, y));
    }
  }
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
  for (let y = start.y - 2; y <= start.y + 2; y++) for (let x = start.x - 2; x <= start.x + 2; x++) { grid[y][x] = 'd'; hgt[y][x] = 'c'; }

  // Offene Felder nach Tiefe sortieren (Abstand zum Eingang).
  const open = [];
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      if (grid[y][x] === 'd') open.push({ x, y, dist: Math.hypot(x - start.x, y - start.y) });
    }
  }
  const maxDist = Math.max(...open.map((o) => o.dist));
  const band = (o) => (o.dist < 10 ? -1 : Math.min(2, Math.floor((o.dist - 10) / Math.max(1, (maxDist - 10) / 3))));
  const pools = [0, 1, 2].map((b) => open.filter((o) => band(o) === b));
  const used = new Set();
  const take = (b) => {
    const pool = pools[b].filter((o) => !used.has(`${o.x},${o.y}`));
    if (!pool.length) return null;
    const o = pool[Math.floor(rand() * pool.length)];
    // Ein Feld Abstand zu allem anderen
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) used.add(`${o.x + dx},${o.y + dy}`);
    return { x: o.x, y: o.y };
  };

  const objects = [
    { type: 'door', to: 'kindle', tx: ARRIVE.rift.x, ty: ARRIVE.rift.y, x: start.x, y: start.y + 3, name: 'the way home', look: 'rift' },
    { type: 'signal', x: start.x + 2, y: start.y - 2, light: 5, name: 'a signal fire' },
  ];
  const mobs = [];
  DEPTHS.forEach((d, b) => {
    for (let i = 0; i < d.count[0]; i++) {
      const at = take(b);
      if (at) objects.push({ type: 'node', node: d.nodes[Math.floor(rand() * d.nodes.length)], ...at });
    }
    for (let i = 0; i < d.count[1]; i++) {
      const at = take(b);
      if (at) mobs.push({ type: d.mobs[Math.floor(rand() * d.mobs.length)], ...at });
    }
    // Ein Signalfeuer pro Tiefe zum Anzünden, eine Truhe in der Mitte, eine reiche ganz unten.
    const fire = take(b);
    if (fire) objects.push({ type: 'signal', light: 5, name: 'a signal fire', ...fire });
    if (b >= 1) {
      const chest = take(b);
      if (chest) objects.push({ type: 'chest', chest: b === 2 ? 'drift_deep' : 'drift', name: b === 2 ? 'a chest deep in the fog' : 'a chest in the fog', ...chest });
    }
  });
  const find = DRIFT_FINDS[Math.floor(rand() * DRIFT_FINDS.length)];
  const findAt = take(2) || take(1);
  if (findAt) objects.push({ type: 'find', ...find, ...findAt });

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
    find: find.name,
    // Tiefe an einer Stelle, für die Statusanzeige.
    zoneAt(x, y) {
      const dist = Math.hypot(x - start.x, y - start.y);
      if (dist < 10) return 'THE DRIFT';
      return `${DEPTHS[Math.min(2, Math.floor((dist - 10) / Math.max(1, (maxDist - 10) / 3)))].name} DRIFT`;
    },
    objects,
    npcs: [],
    mobs,
  };
}
